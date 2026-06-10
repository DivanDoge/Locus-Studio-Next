#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::{Context, Result};
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::collections::VecDeque;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
enum EntryType {
    Voice,
    Narration,
    Choice,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Entry {
    id: usize,
    r#type: EntryType,
    line_no: usize,
    speaker: String,
    original: String,
    translation: String,
    #[serde(default)]
    approved: bool,
    #[serde(default)]
    src: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ProjectData {
    source_file: String,
    entries: Vec<Entry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OpenNpsResult {
    project: ProjectData,
    json_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ImportResult {
    entries: Vec<Entry>,
    matched: usize,
    total: usize,
    method: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CounterFileReport {
    file: String,
    lines: usize,
    words: usize,
    entries: Vec<Entry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CounterReport {
    total_lines: usize,
    total_words: usize,
    files: Vec<CounterFileReport>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StudioProjectManifest {
    name: String,
    files: Vec<String>,
    last_opened_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StudioProjectInfo {
    name: String,
    path: String,
    files: Vec<String>,
    last_opened_file: Option<String>,
}

static VOICE_LINE_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r#"(?i)^(<voice\b[^>]*\bname\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>)(.*)$"#)
        .unwrap()
});
static VOICE_TAG_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"(?i)<voice\b"#).unwrap());
static VOICE_SRC_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"(?i)\bSRC="([^"]+)""#).unwrap());
static CHOICE_LINE_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r#"(?i)^(<CHOICE\b[^>]*\bTEXT="([^"]*)"[^>]*></A>//?.*)$"#).unwrap()
});
static TAG_NAME_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"</?\s*([A-Za-z0-9_:-]+)"#).unwrap());
static TRAILING_TAG_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r#"(\s*)(<[^>]+>)(\s*)$"#).unwrap());

fn split_text_and_tail_tags(text: &str) -> (String, String) {
    let mut working = text.to_string();
    let mut tail_parts: Vec<String> = Vec::new();
    loop {
        let Some(m) = TRAILING_TAG_RE.captures(&working) else {
            break;
        };
        let full = m.get(0).map(|x| x.as_str()).unwrap_or("");
        let tag = m.get(2).map(|x| x.as_str()).unwrap_or("");
        let Some(nm) = TAG_NAME_RE.captures(tag) else {
            break;
        };
        let tag_name = nm
            .get(1)
            .map(|x| x.as_str().to_ascii_lowercase())
            .unwrap_or_default();
        if tag_name == "i" || tag_name == "ii" {
            break;
        }
        tail_parts.insert(0, full.to_string());
        let end = working.len().saturating_sub(full.len());
        working.truncate(end);
    }
    (working.trim().to_string(), tail_parts.join(""))
}

fn split_voice_line(line: &str) -> Option<(String, String, String, String)> {
    let m = VOICE_LINE_RE.captures(line)?;
    let head = m.get(1)?.as_str().to_string();
    let speaker = m
        .get(2)
        .or_else(|| m.get(3))
        .map(|x| x.as_str().to_string())?;
    let rest = m.get(4)?.as_str().to_string();
    let (text, tail_tags) = split_text_and_tail_tags(&rest);
    let rest_ws_len = rest.len().saturating_sub(rest.trim_start().len());
    let full_head = format!("{}{}", head, &rest[..rest_ws_len]);
    Some((speaker, full_head, text, tail_tags))
}

fn extract_voice_src(segment: &str) -> String {
    VOICE_SRC_RE
        .captures(segment)
        .and_then(|m| m.get(1))
        .map(|m| m.as_str().to_ascii_lowercase())
        .unwrap_or_default()
}

fn split_choice_line(line: &str) -> Option<(String, String, String)> {
    if line.trim_start().starts_with("//") {
        return None;
    }
    let m = CHOICE_LINE_RE.captures(line)?;
    let whole = m.get(1)?.as_str().to_string();
    let text = m.get(2)?.as_str().to_string();
    let start = line.rfind(&whole)?;
    let pre = line[..start].to_string();
    Some((pre, whole, text))
}

fn split_line_by_voice_tags(line: &str) -> Vec<String> {
    let mut starts: Vec<usize> = VOICE_TAG_RE.find_iter(line).map(|m| m.start()).collect();
    if starts.is_empty() {
        return vec![line.to_string()];
    }

    starts.sort_unstable();
    let mut result: Vec<String> = Vec::new();
    if starts[0] > 0 {
        result.push(line[..starts[0]].to_string());
    }
    for i in 0..starts.len() {
        let start = starts[i];
        let end = if i + 1 < starts.len() {
            starts[i + 1]
        } else {
            line.len()
        };
        result.push(line[start..end].to_string());
    }
    result
}

fn looks_like_voice_continuation(line: &str) -> bool {
    let trimmed = line.trim();
    if trimmed.is_empty() || trimmed.starts_with("//") {
        return false;
    }
    if trimmed.starts_with('<') {
        return false;
    }
    true
}

fn is_unbalanced_quote_pair(text: &str, open: char, close: char) -> bool {
    let opens = text.chars().filter(|c| *c == open).count();
    let closes = text.chars().filter(|c| *c == close).count();
    opens > closes
}

fn voice_text_needs_continuation(text: &str) -> bool {
    let t = text.trim();
    if t.is_empty() {
        return false;
    }

    // Wrapped voice lines are typically unfinished quoted text on the next line.
    let dbl_quotes = t.chars().filter(|c| *c == '"').count();
    if dbl_quotes % 2 == 1 {
        return true;
    }
    if is_unbalanced_quote_pair(t, '«', '»') {
        return true;
    }
    if is_unbalanced_quote_pair(t, '“', '”') {
        return true;
    }

    false
}

fn split_narration_line(line: &str) -> Option<(String, String, String)> {
    let stripped = line.trim();
    if stripped.is_empty() || stripped.starts_with("//") {
        return None;
    }
    let low = stripped.to_ascii_lowercase();
    if stripped.starts_with('<') && !(low.starts_with("<i") || low.starts_with("<ii") || low.starts_with("</i")) {
        return None;
    }

    let ws_len = line.len().saturating_sub(line.trim_start().len());
    let head_ws = line[..ws_len].to_string();
    let body = &line[ws_len..];
    let (text, tail_tags) = split_text_and_tail_tags(body);
    if text.is_empty() {
        return None;
    }
    let low_text = text.to_ascii_lowercase();
    if low_text.starts_with("translated with deepl") || low_text.starts_with("translated with google") {
        return None;
    }
    if Regex::new(r#"^(?:\s*<[^>]+>\s*)+$"#)
        .unwrap()
        .is_match(&text)
    {
        return None;
    }
    Some((head_ws, text, tail_tags))
}

fn build_entries_from_nps(nps_path: &Path) -> Result<Vec<Entry>> {
    let content = fs::read_to_string(nps_path)
        .with_context(|| format!("Cannot read {}", nps_path.display()))?;
    let mut entries: Vec<Entry> = Vec::new();
    let mut pending_voice_idx: Option<usize> = None;
    let mut pending_voice_line_no: usize = 0;

    for (lineno, line) in content.lines().enumerate() {
        let line_no = lineno + 1;
        let segments = split_line_by_voice_tags(line);

        for segment in segments {
            if segment.trim().is_empty() {
                continue;
            }

            if let Some((speaker, _, text, tail_tags)) = split_voice_line(&segment) {
                if !text.is_empty() {
                    let needs_continuation = tail_tags.is_empty() && voice_text_needs_continuation(&text);
                    let src = extract_voice_src(&segment);
                    entries.push(Entry {
                        id: entries.len(),
                        r#type: EntryType::Voice,
                        line_no,
                        speaker,
                        original: text,
                        translation: String::new(),
                        approved: false,
                        src,
                    });
                    let idx = entries.len() - 1;
                    if needs_continuation {
                        pending_voice_idx = Some(idx);
                        pending_voice_line_no = line_no;
                    } else {
                        pending_voice_idx = None;
                        pending_voice_line_no = 0;
                    }
                }
                continue;
            }

            if let Some((_, _, text)) = split_choice_line(&segment) {
                pending_voice_idx = None;
                pending_voice_line_no = 0;
                if !text.is_empty() {
                    entries.push(Entry {
                        id: entries.len(),
                        r#type: EntryType::Choice,
                        line_no,
                        speaker: "CHOICE".to_string(),
                        original: text,
                        translation: String::new(),
                        approved: false,
                        src: String::new(),
                    });
                }
                continue;
            }

            if let Some(idx) = pending_voice_idx {
                if line_no == pending_voice_line_no + 1 && looks_like_voice_continuation(&segment) {
                    let (text, tail_tags) = split_text_and_tail_tags(segment.trim());
                    if !text.is_empty() {
                        let merged = format!("{} {}", entries[idx].original, text)
                            .split_whitespace()
                            .collect::<Vec<&str>>()
                            .join(" ");
                        entries[idx].original = merged;
                        if tail_tags.is_empty() {
                            pending_voice_line_no = line_no;
                        } else {
                            pending_voice_idx = None;
                            pending_voice_line_no = 0;
                        }
                        continue;
                    }
                }
                pending_voice_idx = None;
                pending_voice_line_no = 0;
            }

            if let Some((_, text, _)) = split_narration_line(&segment) {
                if !text.is_empty() {
                    entries.push(Entry {
                        id: entries.len(),
                        r#type: EntryType::Narration,
                        line_no,
                        speaker: String::new(),
                        original: text,
                        translation: String::new(),
                        approved: false,
                        src: String::new(),
                    });
                }
            }
        }
    }
    Ok(entries)
}

fn apply_translations_to_nps(source_path: &Path, entries: &[Entry], out_path: &Path) -> Result<()> {
    let content = fs::read_to_string(source_path)?;
    let mut iter = entries.iter();
    let mut current = iter.next();
    let mut out: Vec<String> = Vec::new();

    for line in content.lines() {
        if current.is_none() {
            out.push(line.to_string());
            continue;
        }

        let mut rewritten = line.to_string();

        if let Some((_, head, _, tail)) = split_voice_line(line) {
            if let Some(cur) = current {
                if cur.r#type == EntryType::Voice {
                    let text = if cur.translation.trim().is_empty() {
                        cur.original.clone()
                    } else {
                        cur.translation.clone()
                    };
                    rewritten = format!("{}{}{}", head, text, tail);
                    current = iter.next();
                }
            }
        } else if let Some((pre, tag, old_text)) = split_choice_line(line) {
            if let Some(cur) = current {
                if cur.r#type == EntryType::Choice {
                    let text = if cur.translation.trim().is_empty() {
                        old_text
                    } else {
                        cur.translation.clone()
                    };
                    let replaced = Regex::new(r#"TEXT="[^"]*""#)
                        .unwrap()
                        .replace(&tag, format!(r#"TEXT="{}""#, text))
                        .to_string();
                    rewritten = format!("{}{}", pre, replaced);
                    current = iter.next();
                }
            }
        } else if let Some((head_ws, _, tail)) = split_narration_line(line) {
            if let Some(cur) = current {
                if cur.r#type == EntryType::Narration {
                    let text = if cur.translation.trim().is_empty() {
                        cur.original.clone()
                    } else {
                        cur.translation.clone()
                    };
                    rewritten = format!("{}{}{}", head_ws, text, tail);
                    current = iter.next();
                }
            }
        }

        out.push(rewritten);
    }

    fs::write(out_path, out.join("\n"))?;
    Ok(())
}

fn import_from_nps(path: &Path, original_entries: &[Entry], overwrite: bool) -> Result<ImportResult> {
    let translated_entries = build_entries_from_nps(path)?;
    let total = original_entries.len();
    let mut matched = 0;
    let mut updated = original_entries.to_vec();

    // Match voice entries by SRC attribute (identical in both files).
    // Match narration/choice entries by position within the section that
    // follows each voice SRC anchor (or the file start).
    // This is robust against extra/missing lines in the translated file.

    // voice src -> translated text (first occurrence wins)
    let mut src_to_tr: HashMap<String, String> = HashMap::new();
    for e in &translated_entries {
        if e.r#type == EntryType::Voice && !e.src.is_empty() {
            src_to_tr.entry(e.src.clone()).or_insert_with(|| e.original.clone());
        }
    }

    // section map: (anchor_voice_src, offset_within_section) -> translated text
    let mut section_map: HashMap<(String, usize), String> = HashMap::new();
    {
        let mut anchor = String::new();
        let mut offset: usize = 0;
        for e in &translated_entries {
            if e.r#type == EntryType::Voice {
                anchor = e.src.clone();
                offset = 0;
            } else {
                section_map.insert((anchor.clone(), offset), e.original.clone());
                offset += 1;
            }
        }
    }

    let mut orig_anchor = String::new();
    let mut orig_offset: usize = 0;

    for orig in updated.iter_mut() {
        let tr_text = if orig.r#type == EntryType::Voice {
            orig_anchor = orig.src.clone();
            orig_offset = 0;
            src_to_tr.get(&orig.src).cloned().unwrap_or_default()
        } else {
            let key = (orig_anchor.clone(), orig_offset);
            orig_offset += 1;
            section_map.get(&key).cloned().unwrap_or_default()
        };

        if !overwrite && !orig.translation.trim().is_empty() {
            continue;
        }
        orig.translation = tr_text;
        matched += 1;
    }

    Ok(ImportResult {
        entries: updated,
        matched,
        total,
        method: "SRC-anchor + section-position".to_string(),
    })
}

fn import_from_json(path: &Path, original_entries: &[Entry], overwrite: bool) -> Result<ImportResult> {
    let data: ProjectData = serde_json::from_str(&fs::read_to_string(path)?)?;
    let mut lookup: HashMap<String, VecDeque<String>> = HashMap::new();
    for e in data.entries {
        let orig = e.original.trim().to_string();
        let tr = e.translation;
        if !orig.is_empty() {
            lookup.entry(orig).or_default().push_back(tr);
        }
    }

    let mut matched = 0;
    let mut updated = original_entries.to_vec();
    for e in &mut updated {
        if let Some(queue) = lookup.get_mut(e.original.trim()) {
            let Some(tr) = queue.pop_front() else {
                continue;
            };
            if !overwrite && !e.translation.trim().is_empty() {
                continue;
            }
            e.translation = tr;
            matched += 1;
        }
    }

    let total = updated.len();
    Ok(ImportResult {
        entries: updated,
        matched,
        total,
        method: "original text".to_string(),
    })
}

fn transliterate_text_impl(text: &str) -> String {
    let mut pairs: Vec<(&str, &str)> = vec![
        ("Shch", "Щ"),
        ("shch", "щ"),
        ("Ye", "Є"),
        ("Zh", "Ж"),
        ("Yi", "Ї"),
        ("Kh", "Х"),
        ("Ts", "Ц"),
        ("Ch", "Ч"),
        ("Sh", "Ш"),
        ("Shh", "Щ"),
        ("Yu", "Ю"),
        ("Ya", "Я"),
        ("ye", "є"),
        ("zh", "ж"),
        ("yi", "ї"),
        ("kh", "х"),
        ("ts", "ц"),
        ("ch", "ч"),
        ("sh", "ш"),
        ("shh", "щ"),
        ("yu", "ю"),
        ("ya", "я"),
        ("A", "А"),
        ("B", "Б"),
        ("C", "С"),
        ("D", "Д"),
        ("E", "Е"),
        ("F", "Ф"),
        ("G", "Г"),
        ("H", "Г"),
        ("I", "І"),
        ("J", "Й"),
        ("K", "К"),
        ("L", "Л"),
        ("M", "М"),
        ("N", "Н"),
        ("O", "О"),
        ("P", "П"),
        ("Q", "К"),
        ("R", "Р"),
        ("S", "С"),
        ("T", "Т"),
        ("U", "У"),
        ("V", "В"),
        ("W", "В"),
        ("X", "КС"),
        ("Y", "И"),
        ("Z", "З"),
        ("a", "а"),
        ("b", "б"),
        ("c", "с"),
        ("d", "д"),
        ("e", "е"),
        ("f", "ф"),
        ("g", "г"),
        ("h", "г"),
        ("i", "і"),
        ("j", "й"),
        ("k", "к"),
        ("l", "л"),
        ("m", "м"),
        ("n", "н"),
        ("o", "о"),
        ("p", "п"),
        ("q", "к"),
        ("r", "р"),
        ("s", "с"),
        ("t", "т"),
        ("u", "у"),
        ("v", "в"),
        ("w", "в"),
        ("x", "кс"),
        ("y", "и"),
        ("z", "з"),
    ];
    pairs.sort_by_key(|(k, _)| usize::MAX - k.len());

    let chars: Vec<char> = text.chars().collect();
    let mut i = 0usize;
    let mut out = String::new();
    while i < chars.len() {
        let mut matched = false;
        for (lat, cyr) in &pairs {
            let l = lat.chars().count();
            if i + l > chars.len() {
                continue;
            }
            let frag: String = chars[i..i + l].iter().collect();
            if frag == *lat {
                out.push_str(cyr);
                i += l;
                matched = true;
                break;
            }
        }
        if !matched {
            out.push(chars[i]);
            i += 1;
        }
    }
    out
}

fn aliases_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Cannot resolve app config dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Cannot create config dir: {e}"))?;
    Ok(dir.join("nps_speaker_aliases.json"))
}

fn studio_manifest_path(project_path: &Path) -> PathBuf {
    project_path.join("studio_project.json")
}

fn normalize_manifest_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

fn to_manifest_relative_path(project_dir: &Path, raw_path: &str) -> String {
    let candidate = PathBuf::from(raw_path);

    if candidate.is_absolute() {
        if let Ok(rel) = candidate.strip_prefix(project_dir) {
            return normalize_manifest_path(rel);
        }
        return normalize_manifest_path(&candidate);
    }

    normalize_manifest_path(&candidate)
}

fn resolve_manifest_file_path(project_dir: &Path, raw_path: &str) -> PathBuf {
    let candidate = PathBuf::from(raw_path);
    if !candidate.is_absolute() {
        return project_dir.join(candidate);
    }

    if candidate.exists() {
        return candidate;
    }

    if let Some(name) = candidate.file_name() {
        let fallback = project_dir.join("files").join(name);
        if fallback.exists() {
            return fallback;
        }
    }

    candidate
}

fn load_studio_manifest(project_path: &Path) -> Result<StudioProjectManifest, String> {
    let manifest_path = studio_manifest_path(project_path);
    if !manifest_path.exists() {
        return Err("This folder is not a studio project (studio_project.json not found)".to_string());
    }

    let raw = fs::read_to_string(&manifest_path).map_err(|e| e.to_string())?;
    serde_json::from_str::<StudioProjectManifest>(&raw).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_studio_project(base_path: String, name: String) -> Result<StudioProjectInfo, String> {
    let trimmed_name = name.trim();
    if trimmed_name.is_empty() {
        return Err("Project name cannot be empty".to_string());
    }

    let root = PathBuf::from(base_path);
    if !root.exists() || !root.is_dir() {
        return Err("Invalid base directory".to_string());
    }

    let project_dir = root.join(trimmed_name);
    if project_dir.exists() {
        return Err("Project folder already exists".to_string());
    }

    fs::create_dir_all(&project_dir).map_err(|e| e.to_string())?;

    let manifest = StudioProjectManifest {
        name: trimmed_name.to_string(),
        files: Vec::new(),
        last_opened_file: None,
    };
    fs::write(
        studio_manifest_path(&project_dir),
        serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    Ok(StudioProjectInfo {
        name: manifest.name,
        path: project_dir.to_string_lossy().to_string(),
        files: manifest.files,
        last_opened_file: manifest.last_opened_file,
    })
}

#[tauri::command]
fn open_studio_project(project_path: String) -> Result<StudioProjectInfo, String> {
    let project_dir = PathBuf::from(project_path);
    if !project_dir.exists() || !project_dir.is_dir() {
        return Err("Project directory does not exist".to_string());
    }

    let manifest = load_studio_manifest(&project_dir)?;
    let resolved_files = manifest
        .files
        .iter()
        .map(|stored| resolve_manifest_file_path(&project_dir, stored).to_string_lossy().to_string())
        .collect::<Vec<_>>();

    let resolved_last_opened = manifest
        .last_opened_file
        .as_ref()
        .map(|stored| resolve_manifest_file_path(&project_dir, stored).to_string_lossy().to_string());

    Ok(StudioProjectInfo {
        name: manifest.name,
        path: project_dir.to_string_lossy().to_string(),
        files: resolved_files,
        last_opened_file: resolved_last_opened,
    })
}

#[tauri::command]
fn save_studio_project(
    project_path: String,
    name: String,
    files: Vec<String>,
    last_opened_file: Option<String>,
) -> Result<(), String> {
    let project_dir = PathBuf::from(project_path);
    if !project_dir.exists() || !project_dir.is_dir() {
        return Err("Project directory does not exist".to_string());
    }

    let manifest_files = files
        .iter()
        .map(|raw| to_manifest_relative_path(&project_dir, raw))
        .collect::<Vec<_>>();

    let manifest_last_opened = last_opened_file
        .as_ref()
        .map(|raw| to_manifest_relative_path(&project_dir, raw));

    let manifest = StudioProjectManifest {
        name: name.trim().to_string(),
        files: manifest_files,
        last_opened_file: manifest_last_opened,
    };

    fs::write(
        studio_manifest_path(&project_dir),
        serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn add_file_to_studio_project(project_path: String, file_path: String) -> Result<String, String> {
    let project_dir = PathBuf::from(project_path);
    if !project_dir.exists() || !project_dir.is_dir() {
        return Err("Project directory does not exist".to_string());
    }
    let _ = load_studio_manifest(&project_dir)?;

    let source = PathBuf::from(&file_path);
    if !source.exists() || !source.is_file() {
        return Err("Source file does not exist".to_string());
    }

    let files_dir = project_dir.join("files");
    fs::create_dir_all(&files_dir).map_err(|e| e.to_string())?;

    let file_name = source
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "Invalid source file name".to_string())?;

    let stem = source
        .file_stem()
        .and_then(|name| name.to_str())
        .unwrap_or("file");
    let ext = source.extension().and_then(|e| e.to_str()).unwrap_or("");

    let mut target = files_dir.join(file_name);
    let mut idx = 1usize;
    while target.exists() {
        let next_name = if ext.is_empty() {
            format!("{} ({idx})", stem)
        } else {
            format!("{} ({idx}).{}", stem, ext)
        };
        target = files_dir.join(next_name);
        idx += 1;
    }

    fs::copy(&source, &target).map_err(|e| e.to_string())?;
    Ok(target.to_string_lossy().to_string())
}

#[tauri::command]
fn open_nps_project(path: String) -> Result<OpenNpsResult, String> {
    let source = PathBuf::from(path);
    let mut entries = build_entries_from_nps(&source).map_err(|e| e.to_string())?;
    let json_path = source.with_extension("json");

    if json_path.exists() {
        let read = fs::read_to_string(&json_path).map_err(|e| e.to_string())?;
        if let Ok(saved) = serde_json::from_str::<ProjectData>(&read) {
            let saved_map: HashMap<usize, Entry> =
                saved.entries.into_iter().map(|e| (e.id, e)).collect();
            for e in &mut entries {
                if let Some(saved_entry) = saved_map.get(&e.id) {
                    e.translation = saved_entry.translation.clone();
                    e.approved = saved_entry.approved;
                }
            }
        }
    }

    let project = ProjectData {
        source_file: source.to_string_lossy().to_string(),
        entries,
    };

    fs::write(
        &json_path,
        serde_json::to_string_pretty(&project).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    Ok(OpenNpsResult {
        project,
        json_path: json_path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn load_json_project(path: String) -> Result<ProjectData, String> {
    let read = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&read).map_err(|e| e.to_string())
}

#[tauri::command]
fn quick_save_project(
    json_path: Option<String>,
    source_path: String,
    entries: Vec<Entry>,
) -> Result<String, String> {
    let target = if let Some(path) = json_path {
        PathBuf::from(path)
    } else {
        PathBuf::from(source_path.clone()).with_extension("json")
    };

    let project = ProjectData {
        source_file: source_path,
        entries,
    };

    fs::write(
        &target,
        serde_json::to_string_pretty(&project).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    Ok(target.to_string_lossy().to_string())
}

#[tauri::command]
fn save_translated_nps(source_path: String, entries: Vec<Entry>) -> Result<String, String> {
    let source = PathBuf::from(source_path);
    let name = source
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Invalid source file name".to_string())?;
    let out = source.with_file_name(format!("translated_{name}"));
    apply_translations_to_nps(&source, &entries, &out).map_err(|e| e.to_string())?;
    Ok(out.to_string_lossy().to_string())
}

#[tauri::command]
fn import_translation_file(path: String, entries: Vec<Entry>, overwrite: bool) -> Result<ImportResult, String> {
    let p = PathBuf::from(path);
    let ext = p
        .extension()
        .and_then(|x| x.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();

    if ext == "json" {
        import_from_json(&p, &entries, overwrite).map_err(|e| e.to_string())
    } else {
        import_from_nps(&p, &entries, overwrite).map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn run_counter(paths: Vec<String>) -> Result<CounterReport, String> {
    let mut total_lines = 0usize;
    let mut total_words = 0usize;
    let mut files: Vec<CounterFileReport> = Vec::new();

    for path in paths {
        let p = PathBuf::from(&path);
        let entries = build_entries_from_nps(&p).map_err(|e| e.to_string())?;
        let lines = entries.len();
        let words = entries
            .iter()
            .map(|e| e.original.split_whitespace().count())
            .sum::<usize>();

        total_lines += lines;
        total_words += words;

        files.push(CounterFileReport {
            file: p
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(&path)
                .to_string(),
            lines,
            words,
            entries,
        });
    }

    Ok(CounterReport {
        total_lines,
        total_words,
        files,
    })
}

#[tauri::command]
fn write_counter_report(report_path: String, report: CounterReport) -> Result<(), String> {
    let mut lines: Vec<String> = Vec::new();
    lines.push(format!("Total lines: {}", report.total_lines));
    lines.push(format!("Total words: {}", report.total_words));
    lines.push(String::new());

    for file in report.files {
        lines.push(format!("[{}] lines={}, words={}", file.file, file.lines, file.words));
        for e in file.entries {
            let speaker = if e.speaker.is_empty() {
                "narrator".to_string()
            } else {
                e.speaker
            };
            lines.push(format!("{}\t{}\t{}", e.id, speaker, e.original));
        }
        lines.push(String::new());
    }

    fs::write(report_path, lines.join("\n")).map_err(|e| e.to_string())
}

#[tauri::command]
fn transliterate_text(text: String) -> String {
    transliterate_text_impl(&text)
}

#[tauri::command]
fn load_aliases(app: AppHandle) -> Result<HashMap<String, String>, String> {
    let path = aliases_path(&app)?;
    if !path.exists() {
        return Ok(HashMap::new());
    }
    let read = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&read).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_aliases(app: AppHandle, aliases: HashMap<String, String>) -> Result<(), String> {
    let path = aliases_path(&app)?;
    fs::write(
        path,
        serde_json::to_string_pretty(&aliases).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    let bytes = fs::read(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    match String::from_utf8(bytes) {
        Ok(text) => Ok(text),
        Err(err) => Ok(String::from_utf8_lossy(err.as_bytes()).to_string()),
    }
}

#[tauri::command]
fn finish_startup(app: AppHandle) -> Result<(), String> {
    if let Some(splash) = app.get_webview_window("splashscreen") {
        splash.close().map_err(|e| e.to_string())?;
    }

    let main = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;
    main.show().map_err(|e| e.to_string())?;
    main.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn open_settings_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("settings") {
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    tauri::WebviewWindowBuilder::new(
        &app,
        "settings",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("Settings")
    .inner_size(920.0, 760.0)
    .min_inner_size(760.0, 560.0)
    .resizable(true)
    .center()
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            create_studio_project,
            open_studio_project,
            save_studio_project,
            add_file_to_studio_project,
            open_nps_project,
            load_json_project,
            quick_save_project,
            save_translated_nps,
            import_translation_file,
            run_counter,
            write_counter_report,
            transliterate_text,
            load_aliases,
            save_aliases,
            read_file_content,
            finish_startup,
            open_settings_window
        ])
        .run(tauri::generate_context!())
        .unwrap();
}
