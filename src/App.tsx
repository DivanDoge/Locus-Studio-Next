import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { check } from "@tauri-apps/plugin-updater";
// @ts-ignore
import GridLayout, { Layout } from "react-grid-layout";

// в”Ђв”Ђ SVG Icons в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const Ico = {
  folder:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  save:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>,
  export:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  import:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  counter:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  lock:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  unlock:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  copy:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  translit: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4,7 4,4 20,4 20,7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  plus:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  reset:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 .49-3.56"/></svg>,
  check:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  drag:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>,
  review:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  splitH:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>,
  splitV:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>,
};
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import type { Entry, ImportResult, ProjectData, StudioProjectInfo } from "./types";
import "./styles.css";

type FilterMode = "all" | "todo" | "done" | "voice" | "narration" | "choice";

interface Panel {
  id: string;
  title: string;
  visible: boolean;
}

interface ImportSettings {
  overwriteExisting: boolean;
  importVoice: boolean;
  importNarration: boolean;
  importChoice: boolean;
  trimWhitespace: boolean;
  skipIfSameAsOriginal: boolean;
  skipEmptyTranslations: boolean;
}

type UIPresetId = "balanced" | "writer" | "inspector";

interface StudioProject {
  id: string;
  name: string;
  sourcePath: string;
  jsonPath: string;
  savedSignature: string;
  entries: Entry[];
  currentId: number | null;
  search: string;
  filter: FilterMode;
}

interface OpenedFilePayload {
  entries: Entry[];
  sourcePath: string;
  jsonPath: string;
}

interface UIPreset {
  id: UIPresetId;
  label: string;
  desktopLayout: Layout[];
  compactLayout: Layout[];
  panels: Record<string, Panel>;
  editorOrientation: "horizontal" | "vertical";
}

const DESKTOP_LAYOUT: Layout[] = [
  { x: 0, y: 0, w: 7, h: 30, i: "table" },
  { x: 7, y: 0, w: 5, h: 16, i: "editor" },
  { x: 7, y: 16, w: 5, h: 14, i: "inspector" },
];
const COMPACT_LAYOUT: Layout[] = [
  { x: 0, y: 0, w: 12, h: 12, i: "table" },
  { x: 0, y: 12, w: 12, h: 10, i: "editor" },
  { x: 0, y: 22, w: 12, h: 8, i: "inspector" },
];
const DEFAULT_PANELS: Record<string, Panel> = {
  table: { id: "table", title: "Translations", visible: true },
  editor: { id: "editor", title: "Editor", visible: true },
  inspector: { id: "inspector", title: "Inspector", visible: true },
};
const DEFAULT_IMPORT_SETTINGS: ImportSettings = {
  overwriteExisting: false,
  importVoice: true,
  importNarration: true,
  importChoice: true,
  trimWhitespace: true,
  skipIfSameAsOriginal: true,
  skipEmptyTranslations: true,
};
const LOCAL_ALIAS_STORAGE_KEY = "nps-speaker-aliases-local";
const UI_PRESETS: UIPreset[] = [
  {
    id: "balanced",
    label: "Balanced",
    desktopLayout: [
      { x: 0, y: 0, w: 7, h: 30, i: "table" },
      { x: 7, y: 0, w: 5, h: 16, i: "editor" },
      { x: 7, y: 16, w: 5, h: 14, i: "inspector" },
    ],
    compactLayout: [
      { x: 0, y: 0, w: 12, h: 12, i: "table" },
      { x: 0, y: 12, w: 12, h: 10, i: "editor" },
      { x: 0, y: 22, w: 12, h: 8, i: "inspector" },
    ],
    panels: {
      table: { id: "table", title: "Translations", visible: true },
      editor: { id: "editor", title: "Editor", visible: true },
      inspector: { id: "inspector", title: "Inspector", visible: true },
    },
    editorOrientation: "horizontal",
  },
  {
    id: "writer",
    label: "Writer Focus",
    desktopLayout: [
      { x: 0, y: 0, w: 8, h: 30, i: "editor" },
      { x: 8, y: 0, w: 4, h: 30, i: "table" },
      { x: 8, y: 18, w: 4, h: 12, i: "inspector" },
    ],
    compactLayout: [
      { x: 0, y: 0, w: 12, h: 14, i: "editor" },
      { x: 0, y: 14, w: 12, h: 9, i: "table" },
      { x: 0, y: 23, w: 12, h: 7, i: "inspector" },
    ],
    panels: {
      table: { id: "table", title: "Translations", visible: true },
      editor: { id: "editor", title: "Editor", visible: true },
      inspector: { id: "inspector", title: "Inspector", visible: false },
    },
    editorOrientation: "horizontal",
  },
  {
    id: "inspector",
    label: "Inspector Focus",
    desktopLayout: [
      { x: 0, y: 0, w: 6, h: 30, i: "inspector" },
      { x: 6, y: 0, w: 6, h: 18, i: "table" },
      { x: 6, y: 18, w: 6, h: 12, i: "editor" },
    ],
    compactLayout: [
      { x: 0, y: 0, w: 12, h: 14, i: "inspector" },
      { x: 0, y: 14, w: 12, h: 9, i: "table" },
      { x: 0, y: 23, w: 12, h: 7, i: "editor" },
    ],
    panels: {
      table: { id: "table", title: "Translations", visible: true },
      editor: { id: "editor", title: "Editor", visible: true },
      inspector: { id: "inspector", title: "Inspector", visible: true },
    },
    editorOrientation: "vertical",
  },
];

function cloneLayout(layout: Layout[]): Layout[] {
  return layout.map((item) => ({ ...item }));
}

function clonePanels(panels: Record<string, Panel>): Record<string, Panel> {
  return Object.fromEntries(Object.entries(panels).map(([k, v]) => [k, { ...v }])) as Record<string, Panel>;
}

function loadStoredLayout(key: string, fallback: Layout[]): Layout[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return cloneLayout(fallback);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return cloneLayout(fallback);
    return parsed.map((item) => ({ ...item }));
  } catch {
    return cloneLayout(fallback);
  }
}

function loadImportSettings(): ImportSettings {
  try {
    const raw = localStorage.getItem("nps-import-settings");
    if (!raw) return { ...DEFAULT_IMPORT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_IMPORT_SETTINGS,
      ...(parsed || {}),
    };
  } catch {
    return { ...DEFAULT_IMPORT_SETTINGS };
  }
}

function loadRecentProjectPaths(): string[] {
  try {
    const raw = localStorage.getItem("nps-recent-workspaces");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === "string") : [];
  } catch {
    return [];
  }
}

function createProjectShell(name: string): StudioProject {
  return {
    id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    sourcePath: "",
    jsonPath: "",
    savedSignature: "",
    entries: [],
    currentId: null,
    search: "",
    filter: "all",
  };
}

function buildEntriesSignature(entries: Entry[]): string {
  return entries.map((entry) => `${entry.id}:${entry.translation}:${entry.approved ? 1 : 0}`).join("\u0001");
}

function getProjectDisplayName(project: StudioProject): string {
  if (project.sourcePath) {
    const sourceName = project.sourcePath.split(/[\\/]/).pop() || project.name;
    return sourceName;
  }
  if (project.jsonPath) {
    const jsonName = project.jsonPath.split(/[\\/]/).pop() || project.name;
    return jsonName;
  }
  return project.name;
}

function getTranslationProgress(entries: Entry[]) {
  const total = entries.length;
  const done = entries.filter((entry) => entry.translation.trim().length > 0).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { total, done, percent };
}

function getFileName(path: string): string {
  const parts = path.split(/[\\/]/);
  return (parts[parts.length - 1] || path).toLowerCase();
}

function getFileStem(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx <= 0) return fileName;
  return fileName.slice(0, idx);
}

function normalizeImportStem(stem: string): string {
  return stem
    .toLowerCase()
    .replace(/[\s]+/g, "")
    .replace(/[_-](?:copy)?\d+$/i, "")
    .replace(/\((?:copy|\d+)\)$/i, "");
}

function buildImportLookup(paths: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const path of paths) {
    const fileName = getFileName(path);
    const stem = getFileStem(fileName);
    const normalizedStem = normalizeImportStem(stem);
    if (!map.has(fileName)) map.set(fileName, path);
    if (!map.has(stem)) map.set(stem, path);
    if (normalizedStem && !map.has(normalizedStem)) map.set(normalizedStem, path);
  }
  return map;
}

function resolveImportForProject(project: StudioProject, lookup: Map<string, string>): string | null {
  const candidates: string[] = [];

  const pushNameCandidates = (name: string) => {
    const stem = getFileStem(name);
    candidates.push(name, stem, normalizeImportStem(stem));
  };

  if (project.sourcePath) {
    const sourceName = getFileName(project.sourcePath);
    pushNameCandidates(sourceName);
  }
  if (project.jsonPath) {
    const jsonName = getFileName(project.jsonPath);
    pushNameCandidates(jsonName);
  }
  pushNameCandidates(getFileName(project.name));

  for (const key of candidates) {
    const match = lookup.get(key);
    if (match) return match;
  }
  return null;
}

function replaceFirstOccurrence(input: string, search: string, replacement: string): string {
  const idx = input.indexOf(search);
  if (idx === -1) return input;
  return input.slice(0, idx) + replacement + input.slice(idx + search.length);
}

function App() {
  const isSplashWindow = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("splash") === "1";
  }, []);
  const [startupVisible, setStartupVisible] = useState(() => isSplashWindow);
  const [startupProgress, setStartupProgress] = useState(0);
  const [startupStage, setStartupStage] = useState("Initializing modules...");
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>(() => "");
  const [workspace, setWorkspace] = useState<StudioProjectInfo | null>(null);
  const [viewMode, setViewMode] = useState<"manager" | "studio">("manager");
  const [recentProjectPaths, setRecentProjectPaths] = useState<string[]>(() => loadRecentProjectPaths());
  const [status, setStatus] = useState("Open or create a project folder to begin");
  const [fileListSearch, setFileListSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [projectLoadState, setProjectLoadState] = useState<{
    active: boolean;
    stage: string;
    current: number;
    total: number;
  }>({
    active: false,
    stage: "",
    current: 0,
    total: 1,
  });
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [nameManagerOpen, setNameManagerOpen] = useState(false);
  const [aliasDraft, setAliasDraft] = useState<Record<string, string>>({});
  const [aliasSaving, setAliasSaving] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPaths, setImportPaths] = useState<string[]>([]);
  const [importBusy, setImportBusy] = useState(false);
  const [importProgressState, setImportProgressState] = useState<{
    active: boolean;
    stage: string;
    current: number;
    total: number;
  }>({
    active: false,
    stage: "",
    current: 0,
    total: 1,
  });
  const [importSettings, setImportSettings] = useState<ImportSettings>(() => loadImportSettings());
  const [panels, setPanels] = useState<Record<string, Panel>>(() => {
    try {
      const s = localStorage.getItem("nps-panels");
      const loaded = s ? JSON.parse(s) : {};
      // Merge loaded panels with DEFAULT_PANELS to ensure all keys exist
      return Object.fromEntries(
        Object.entries(DEFAULT_PANELS).map(([k, v]) => [k, { ...v, ...(loaded[k] || {}) }])
      );
    } catch {
      return { ...DEFAULT_PANELS };
    }
  });
  const [editorOrientation, setEditorOrientation] = useState<"horizontal" | "vertical">(() =>
    (localStorage.getItem("nps-editor-orient") as "horizontal" | "vertical") || "horizontal"
  );
  const [layoutLocked, setLayoutLocked] = useState<boolean>(() =>
    localStorage.getItem("nps-layout-locked") !== "false"
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [gridWidth, setGridWidth] = useState(window.innerWidth);
  const [gridHeight, setGridHeight] = useState(window.innerHeight);
  const [desktopLayout, setDesktopLayout] = useState<Layout[]>(() =>
    loadStoredLayout("nps-layout-desktop", DESKTOP_LAYOUT)
  );
  const [compactLayout, setCompactLayout] = useState<Layout[]>(() =>
    loadStoredLayout("nps-layout-compact", COMPACT_LAYOUT)
  );
  const [selectedPreset, setSelectedPreset] = useState<UIPresetId | "custom">("custom");
  const [sourceFileLines, setSourceFileLines] = useState<string[]>([]); // real original file
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewDrafts, setReviewDrafts] = useState<Record<number, string>>({});
  const [reviewCurrentId, setReviewCurrentId] = useState<number | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"all" | "modified" | "unedited">("all");
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const gridRows = 30;
  const rowHeight = useMemo(() => {
    const usableHeight = Math.max(360, gridHeight - 12);
    return Math.max(16, Math.floor(usableHeight / gridRows));
  }, [gridHeight]);
  const isDesktopLayout = gridWidth >= 1280;
  const layout = useMemo(
    () => (isDesktopLayout ? desktopLayout : compactLayout),
    [isDesktopLayout, desktopLayout, compactLayout]
  );

  useEffect(() => {
    if (!isSplashWindow) return;
    let disposed = false;
    const minVisibleUntil = Date.now() + 1100;

    const stageTimer = window.setTimeout(() => {
      if (!disposed) setStartupStage("Preparing workspace...");
    }, 420);

    const progressTimer = window.setInterval(() => {
      if (disposed) return;
      setStartupProgress((prev) => {
        if (prev >= 94) return prev;
        const step = Math.max(1, Math.round((100 - prev) / 8));
        return Math.min(94, prev + step);
      });
    }, 70);

    const finalizeTimer = window.setTimeout(() => {
      if (disposed) return;
      setStartupStage("Launching Locus Studio Next...");
      setStartupProgress(100);
      const remaining = Math.max(0, minVisibleUntil - Date.now()) + 180;
      window.setTimeout(async () => {
        if (disposed) return;
        try {
          await invoke("finish_startup");
        } catch (error) {
          console.error("Failed to finish startup:", error);
          setStartupVisible(false);
        }
      }, remaining);
    }, 1300);

    return () => {
      disposed = true;
      window.clearTimeout(stageTimer);
      window.clearTimeout(finalizeTimer);
      window.clearInterval(progressTimer);
    };
  }, [isSplashWindow]);

  if (isSplashWindow) {
    return (
      <div className="app splash-window-only">
        {startupVisible && (
          <div id="startup-overlay">
            <div className="startup-card">
              <div
                className="startup-progress-ring"
                style={{
                  background: `conic-gradient(from -90deg, var(--accent) 0deg ${startupProgress * 3.6}deg, rgba(255, 255, 255, 0.12) ${startupProgress * 3.6}deg 360deg)`,
                }}
              >
                <div className="startup-progress-core">
                  <img className="startup-logo-image" src="/Locus-logo.png" alt="Locus" />
                </div>
              </div>
              <div className="startup-progress-value">{startupProgress}%</div>
              <div className="startup-progress-stage">{startupStage}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  useEffect(() => {
    if (activeProjectId) return;
    if (!projects.length) return;
    setActiveProjectId(projects[0].id);
  }, [activeProjectId, projects]);

  useEffect(() => {
    localStorage.setItem("nps-recent-workspaces", JSON.stringify(recentProjectPaths));
  }, [recentProjectPaths]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const entries = activeProject?.entries ?? [];
  const sourcePath = activeProject?.sourcePath ?? "";
  const jsonPath = activeProject?.jsonPath ?? "";
  const currentId = activeProject?.currentId ?? null;
  const search = activeProject?.search ?? "";
  const filter = activeProject?.filter ?? "all";

  const projectFileRows = useMemo(() => {
    return projects
      .map((project) => {
        const progressStats = getTranslationProgress(project.entries);
        return {
          id: project.id,
          title: getProjectDisplayName(project),
          sourcePath: project.sourcePath,
          jsonPath: project.jsonPath,
          ...progressStats,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [projects]);

  const filteredProjectFileRows = useMemo(() => {
    const query = fileListSearch.trim().toLowerCase();
    if (!query) return projectFileRows;
    return projectFileRows.filter((row) => row.title.toLowerCase().includes(query));
  }, [projectFileRows, fileListSearch]);

  const workspaceProgress = useMemo(() => {
    const total = projects.reduce((sum, project) => sum + project.entries.length, 0);
    const done = projects.reduce(
      (sum, project) => sum + project.entries.filter((entry) => entry.translation.trim().length > 0).length,
      0
    );
    const percent = total ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }, [projects]);

  const knownSpeakers = useMemo(() => {
    const keys = new Set<string>();
    for (const project of projects) {
      for (const entry of project.entries) {
        const speaker = (entry.speaker || "").trim();
        if (!speaker || speaker.toUpperCase() === "CHOICE") continue;
        keys.add(speaker);
      }
    }
    for (const key of Object.keys(aliases)) {
      if (key.trim()) keys.add(key);
    }
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [projects, aliases]);

  const importSelectionLabel = useMemo(() => {
    if (!importPaths.length) return "";
    if (importPaths.length === 1) return importPaths[0];
    const first = importPaths[0].split(/[\\/]/).pop() || importPaths[0];
    return `${importPaths.length} files selected (first: ${first})`;
  }, [importPaths]);

  const importProgressPercent = useMemo(() => {
    if (!importProgressState.total) return 0;
    return Math.max(0, Math.min(100, Math.round((importProgressState.current / importProgressState.total) * 100)));
  }, [importProgressState.current, importProgressState.total]);

  const projectLoadPercent = useMemo(() => {
    if (!projectLoadState.total) return 0;
    return Math.max(0, Math.min(100, Math.round((projectLoadState.current / projectLoadState.total) * 100)));
  }, [projectLoadState.current, projectLoadState.total]);

  const updateActiveProject = useCallback((updater: (project: StudioProject) => StudioProject) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === activeProjectId ? updater(project) : project
      )
    );
  }, [activeProjectId]);

  const setCurrentId = useCallback((value: number | null | ((prev: number | null) => number | null)) => {
    updateActiveProject((project) => ({
      ...project,
      currentId: typeof value === "function"
        ? (value as (prev: number | null) => number | null)(project.currentId)
        : value,
    }));
  }, [updateActiveProject]);

  const setEntries = useCallback((value: Entry[] | ((prev: Entry[]) => Entry[])) => {
    updateActiveProject((project) => ({
      ...project,
      entries: typeof value === "function" ? (value as (prev: Entry[]) => Entry[])(project.entries) : value,
    }));
  }, [updateActiveProject]);

  const setSearch = useCallback((value: string) => {
    updateActiveProject((project) => ({ ...project, search: value }));
  }, [updateActiveProject]);

  const setFilter = useCallback((value: FilterMode) => {
    updateActiveProject((project) => ({ ...project, filter: value }));
  }, [updateActiveProject]);

  const addToRecentProjects = useCallback((path: string) => {
    setRecentProjectPaths((prev) => [path, ...prev.filter((p) => p !== path)].slice(0, 12));
  }, []);

  // Keep GridLayout width/height in sync when studio view mounts and on window resize.
  useEffect(() => {
    if (viewMode !== "studio") return;

    const el = gridContainerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((es) => {
      for (const e of es) {
        setGridWidth(e.contentRect.width);
        setGridHeight(e.contentRect.height);
      }
    });
    ro.observe(el);
    setGridWidth(el.clientWidth);
    setGridHeight(el.clientHeight);
    
    // Also listen to window resize as fallback (Tauri window resizes)
    const handleWindowResize = () => {
      if (el) {
        setGridWidth(el.clientWidth);
        setGridHeight(el.clientHeight);
      }
    };
    window.addEventListener("resize", handleWindowResize);
    
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [viewMode]);
  useEffect(() => { localStorage.setItem("nps-panels", JSON.stringify(panels)); }, [panels]);
  useEffect(() => { localStorage.setItem("nps-editor-orient", editorOrientation); }, [editorOrientation]);
  useEffect(() => { localStorage.setItem("nps-layout-locked", String(layoutLocked)); }, [layoutLocked]);
  useEffect(() => { localStorage.setItem("nps-layout-desktop", JSON.stringify(desktopLayout)); }, [desktopLayout]);
  useEffect(() => { localStorage.setItem("nps-layout-compact", JSON.stringify(compactLayout)); }, [compactLayout]);
  useEffect(() => { localStorage.setItem("nps-import-settings", JSON.stringify(importSettings)); }, [importSettings]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (importDialogOpen && !importBusy) {
        setImportDialogOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [importDialogOpen, importBusy]);

  // Load real source file content (for inspector)
  useEffect(() => {
    if (!sourcePath) {
      setSourceFileLines([]);
      return;
    }
    void (async () => {
      try {
        const content = await invoke<string>("read_file_content", { path: sourcePath });
        const lines = content.split(/\r?\n/);
        setSourceFileLines(lines);
      } catch (error) {
        console.error("Failed to load source file:", error);
        setSourceFileLines([]);
      }
    })();
  }, [sourcePath]);

  // Generate translation file content for currently active file.
  const entriesByLine = useMemo(() => {
    const grouped = new Map<number, Entry[]>();
    for (const entry of entries) {
      if (!entry.original) continue;
      const bucket = grouped.get(entry.line_no);
      if (bucket) {
        bucket.push(entry);
      } else {
        grouped.set(entry.line_no, [entry]);
      }
    }
    for (const bucket of grouped.values()) {
      bucket.sort((a, b) => a.id - b.id);
    }
    return grouped;
  }, [entries]);

  const translationFileLines = useMemo(() => {
    if (!sourceFileLines.length) return [];
    return sourceFileLines.map((line, idx) => {
      const lineEntries = entriesByLine.get(idx + 1);
      if (!lineEntries?.length) {
        return line;
      }

      let rewritten = line;
      for (const entry of lineEntries) {
        const replacement = entry.translation.trim().length > 0 ? entry.translation : entry.original;
        rewritten = replaceFirstOccurrence(rewritten, entry.original, replacement);
      }
      return rewritten;
    });
  }, [sourceFileLines, entriesByLine]);

  const readProjectFilePayload = useCallback(async (path: string): Promise<OpenedFilePayload> => {
    if (path.toLowerCase().endsWith(".json")) {
      const data = await invoke<ProjectData>("load_json_project", { path });
      const inferredSource = data.source_file?.trim()
        ? data.source_file
        : path.replace(/\.json$/i, ".nps");
      return {
        entries: data.entries,
        sourcePath: inferredSource,
        jsonPath: path,
      };
    }

    const result = await invoke<{ project: ProjectData; json_path: string }>("open_nps_project", { path });
    return {
      entries: result.project.entries,
      sourcePath: result.project.source_file,
      jsonPath: result.json_path,
    };
  }, []);

  const buildFileTabFromPath = useCallback(async (path: string): Promise<StudioProject> => {
    const payload = await readProjectFilePayload(path);
    const fileName = path.split(/[\\/]/).pop() || "Untitled";
    return {
      ...createProjectShell(fileName.replace(/\.(json|nps)$/i, "")),
      entries: payload.entries,
      sourcePath: payload.sourcePath,
      jsonPath: payload.jsonPath,
      savedSignature: buildEntriesSignature(payload.entries),
    };
  }, [readProjectFilePayload]);

  const saveWorkspaceManifest = useCallback(async (
    nextProjects: StudioProject[],
    lastOpenedFile: string | null
  ) => {
    if (!workspace) return;
    const files = nextProjects
      .map((project) => project.sourcePath || project.jsonPath)
      .filter((path) => path.trim().length > 0);
    await invoke("save_studio_project", {
      projectPath: workspace.path,
      name: workspace.name,
      files,
      lastOpenedFile,
    });
  }, [workspace]);

  const loadWorkspaceFromPath = useCallback(async (projectPath: string) => {
    setBusy(true);
    setProjectLoadState({
      active: true,
      stage: "Opening project manifest...",
      current: 0,
      total: 1,
    });
    try {
      const info = await invoke<StudioProjectInfo>("open_studio_project", { projectPath });
      const loadedTabs: StudioProject[] = [];
      const totalFiles = Math.max(1, info.files.length);

      setProjectLoadState({
        active: true,
        stage: info.files.length ? "Loading project files..." : "Preparing empty project...",
        current: 0,
        total: totalFiles,
      });

      for (let i = 0; i < info.files.length; i += 1) {
        const filePath = info.files[i];
        try {
          loadedTabs.push(await buildFileTabFromPath(filePath));
        } catch {
          // Skip missing/broken files but keep opening the project.
        } finally {
          setProjectLoadState((prev) => ({
            ...prev,
            stage: `Loading project files... (${i + 1}/${info.files.length})`,
            current: i + 1,
          }));
        }
      }

      setProjectLoadState((prev) => ({
        ...prev,
        stage: "Finalizing workspace...",
        current: prev.total,
      }));

      setWorkspace(info);
      setProjects(loadedTabs);
      const preferred = info.last_opened_file
        ? loadedTabs.find((project) => project.sourcePath === info.last_opened_file || project.jsonPath === info.last_opened_file)
        : null;
      setActiveProjectId(preferred?.id || loadedTabs[0]?.id || "");
      addToRecentProjects(projectPath);
      setViewMode("studio");
      setStatus(`Project loaded: ${info.name}`);
    } catch (error) {
      setStatus(`Failed to open project: ${String(error)}`);
    } finally {
      setBusy(false);
      setProjectLoadState({
        active: false,
        stage: "",
        current: 0,
        total: 1,
      });
    }
  }, [addToRecentProjects, buildFileTabFromPath]);

  const createWorkspaceProject = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Choose location for new project folder"
    });
    if (!selected || Array.isArray(selected)) return;

    const suggested = `Project_${new Date().toISOString().slice(0, 10)}`;
    const name = window.prompt("Project folder name", suggested)?.trim();
    if (!name) return;

    setBusy(true);
    try {
      const info = await invoke<StudioProjectInfo>("create_studio_project", {
        basePath: selected,
        name,
      });
      setWorkspace(info);
      setProjects([]);
      setActiveProjectId("");
      addToRecentProjects(info.path);
      setViewMode("studio");
      setStatus(`Project created: ${info.name}`);
    } catch (error) {
      setStatus(`Failed to create project: ${String(error)}`);
    } finally {
      setBusy(false);
    }
  }, [addToRecentProjects]);

  const openWorkspaceProject = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Open project folder"
    });
    if (!selected || Array.isArray(selected)) return;
    await loadWorkspaceFromPath(selected);
  }, [loadWorkspaceFromPath]);

  const openProjectFromPath = useCallback(async (path: string) => {
    if (!workspace) {
      setStatus("Open a project folder first");
      return;
    }
    setBusy(true);
    try {
      const payload = await readProjectFilePayload(path);
      let nextActiveProjectId = "";
      let nextTabs: StudioProject[] = [];
      setProjects((prev) => {
        const fileName = path.split(/[\\/]/).pop() || "Untitled";
        const existing = prev.find((project) => {
          if (payload.jsonPath && project.jsonPath) return project.jsonPath === payload.jsonPath;
          return payload.sourcePath && project.sourcePath === payload.sourcePath;
        });

        if (existing) {
          nextActiveProjectId = existing.id;
          nextTabs = prev.map((project) =>
            project.id === existing.id
              ? {
                  ...project,
                  entries: payload.entries,
                  sourcePath: payload.sourcePath,
                  jsonPath: payload.jsonPath,
                  savedSignature: buildEntriesSignature(payload.entries),
                }
              : project
          );
          return nextTabs;
        }

        const project = createProjectShell(fileName.replace(/\.(json|nps)$/i, ""));
        project.entries = payload.entries;
        project.sourcePath = payload.sourcePath;
        project.jsonPath = payload.jsonPath;
        project.savedSignature = buildEntriesSignature(payload.entries);
        nextActiveProjectId = project.id;
        nextTabs = [...prev, project];
        return nextTabs;
      });
      if (nextActiveProjectId) {
        setActiveProjectId(nextActiveProjectId);
      }
      await saveWorkspaceManifest(nextTabs, payload.sourcePath || payload.jsonPath || null);
      setStatus(`Loaded ${path.split(/[\\/]/).pop()}`);
    } catch (error) {
      setStatus(`Failed to open: ${String(error)}`);
    } finally {
      setBusy(false);
    }
  }, [workspace, readProjectFilePayload, saveWorkspaceManifest]);

  // Tauri drag & drop events (only if Tauri is available)
  useEffect(() => {
    // Check if Tauri API is available
    if (typeof window === 'undefined' || !(window as any).__TAURI__) {
      return;
    }
    
    const fns: Array<() => void> = [];
    (async () => {
      try {
        fns.push(await listen("tauri://drag-enter", () => setIsDragOver(true)));
        fns.push(await listen("tauri://drag-leave", () => setIsDragOver(false)));
        fns.push(await listen<{ paths: string[] }>("tauri://drag-drop", (ev) => {
          setIsDragOver(false);
          const p = ev.payload?.paths?.[0];
          console.log("Drag drop event:", ev.payload?.paths); // Debug log
          if (p && (p.toLowerCase().endsWith(".nps") || p.toLowerCase().endsWith(".json"))) {
            openProjectFromPath(p);
          }
        }));
      } catch (error) {
        console.error("Failed to setup drag & drop listeners:", error);
      }
    })();
    return () => fns.forEach((f) => f());
  }, [openProjectFromPath]);

  const currentEntry = useMemo(
    () => entries.find((e) => e.id === currentId) ?? null,
    [entries, currentId]
  );

  const workspaceFilesKey = useMemo(
    () => projects.map((project) => `${project.id}:${project.sourcePath || project.jsonPath}`).join("|"),
    [projects]
  );

  useEffect(() => {
    if (!workspace) return;
    const activeFile = projects.find((project) => project.id === activeProjectId);
    const lastOpened = activeFile?.sourcePath || activeFile?.jsonPath || null;
    void saveWorkspaceManifest(projects, lastOpened);
  }, [workspace, workspaceFilesKey, activeProjectId, saveWorkspaceManifest]);

  // Auto-scroll to active line in both inspector panes
  useEffect(() => {
    const scrollToActive = (id: string, paneId: string) => {
      const el = document.getElementById(id);
      const pane = document.getElementById(paneId);
      if (el && pane) {
        const elRect = el.getBoundingClientRect();
        const paneRect = pane.getBoundingClientRect();
        if (elRect.top < paneRect.top || elRect.bottom > paneRect.bottom) {
          el.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }
    };
    scrollToActive('inspector-active-line-original', 'inspector-original-pane');
    scrollToActive('inspector-active-line-translation', 'inspector-translation-pane');
  }, [currentEntry, sourceFileLines, translationFileLines]);

  // Review mode: auto-scroll list to active item
  useEffect(() => {
    if (!reviewMode) return;
    const el = document.getElementById("review-active-item");
    const pane = document.getElementById("review-list-pane");
    if (!el || !pane) return;
    const elRect = el.getBoundingClientRect();
    const paneRect = pane.getBoundingClientRect();
    if (elRect.top < paneRect.top || elRect.bottom > paneRect.bottom) {
      el.scrollIntoView({ behavior: "auto", block: "center" });
    }
  }, [reviewCurrentId, reviewMode]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => {
        const done = e.translation.trim().length > 0;
        if (filter === "todo") return !done;
        if (filter === "done") return done;
        if (filter === "voice") return e.type === "voice";
        if (filter === "narration") return e.type === "narration";
        if (filter === "choice") return e.type === "choice";
        return true;
      })
      .filter((e) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const speaker = (aliases[e.speaker] || e.speaker || "narrator").toLowerCase();
        return (
          speaker.includes(q) ||
          e.original.toLowerCase().includes(q) ||
          e.translation.toLowerCase().includes(q)
        );
      });
  }, [entries, filter, search, aliases]);

  const stepSelection = useCallback((delta: number) => {
    setCurrentId((currentId) => {
      if (!filteredEntries.length) return currentId;
      if (currentId === null) {
        return filteredEntries[0].id;
      }
      const idx = filteredEntries.findIndex((e) => e.id === currentId);
      const next = Math.min(filteredEntries.length - 1, Math.max(0, idx + delta));
      return filteredEntries[next].id;
    });
  }, [filteredEntries]);

  // UX: always keep a valid active selection when the filtered list changes.
  useEffect(() => {
    if (!filteredEntries.length) {
      if (currentId !== null) setCurrentId(null);
      return;
    }
    const hasCurrent = currentId !== null && filteredEntries.some((e) => e.id === currentId);
    if (!hasCurrent) {
      setCurrentId(filteredEntries[0].id);
    }
  }, [filteredEntries, currentId]);

  // UX: keep selected table row visible.
  useEffect(() => {
    const activeRow = document.getElementById("table-active-row");
    const tablePanel = activeRow?.closest(".grid-panel-body");
    if (!activeRow || !tablePanel) return;

    const rowRect = activeRow.getBoundingClientRect();
    const panelRect = tablePanel.getBoundingClientRect();
    if (rowRect.top < panelRect.top || rowRect.bottom > panelRect.bottom) {
      activeRow.scrollIntoView({ behavior: "auto", block: "center" });
    }
  }, [currentId, filteredEntries]);

  // Global keyboard handler for arrow keys (navigate table without focussing textarea)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isFocusedInTextarea = document.activeElement?.tagName === 'TEXTAREA';
      
      // Only intercept arrow keys if not focused in textarea (but allow in other inputs like search)
      if (isFocusedInTextarea) return;
      
      if (e.key === "ArrowUp" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        stepSelection(-1);
      } else if (e.key === "ArrowDown" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        stepSelection(1);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [stepSelection]);

  const doneCount = useMemo(
    () => entries.filter((e) => e.translation.trim().length > 0).length,
    [entries]
  );

  const progress = entries.length ? Math.round((doneCount / entries.length) * 100) : 0;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    void (async () => {
      try {
        const loaded = (window as any).__TAURI__
          ? await invoke<Record<string, string>>("load_aliases")
          : JSON.parse(localStorage.getItem(LOCAL_ALIAS_STORAGE_KEY) || "{}");
        setAliases(loaded);
      } catch (error) {
        console.error("Failed to load aliases:", error);
        try {
          const fallback = JSON.parse(localStorage.getItem(LOCAL_ALIAS_STORAGE_KEY) || "{}");
          setAliases(fallback);
        } catch {
          setAliases({});
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).__TAURI__) return;
    void (async () => {
      try {
        const update = await check();
        if (!update) return;
        setStatus(`Update found: ${update.version}. Downloading...`);
        await update.downloadAndInstall();
        setStatus("Update installed. Restart app to apply.");
      } catch {
        /* Update check failed */
      }
    })();
  }, []);

  // ── Review Mode ─────────────────────────────────────────────────────────
  const reviewEntries = useMemo(() => {
    if (reviewFilter === "modified") {
      return entries.filter((e) => reviewDrafts[e.id] !== e.translation);
    }
    if (reviewFilter === "unedited") {
      return entries.filter((e) => (reviewDrafts[e.id] ?? e.translation) === e.translation);
    }
    return entries;
  }, [entries, reviewFilter, reviewDrafts]);

  const reviewCurrentEntry = useMemo(
    () => reviewEntries.find((e) => e.id === reviewCurrentId) ?? null,
    [reviewEntries, reviewCurrentId]
  );

  const reviewChangedCount = useMemo(
    () => Object.entries(reviewDrafts).filter(([id, val]) => {
      const entry = entries.find((e) => e.id === Number(id));
      return entry && entry.translation !== val;
    }).length,
    [entries, reviewDrafts]
  );

  const stepReview = useCallback((delta: number) => {
    setReviewCurrentId((cur) => {
      if (!reviewEntries.length) return cur;
      if (cur === null) return reviewEntries[0].id;
      const idx = reviewEntries.findIndex((e) => e.id === cur);
      const next = Math.min(reviewEntries.length - 1, Math.max(0, idx + delta));
      return reviewEntries[next].id;
    });
  }, [reviewEntries]);

  const persistApprovedState = useCallback(async (entriesToSave: Entry[]) => {
    if (!sourcePath) return;
    try {
      const path = await invoke<string>("quick_save_project", {
        jsonPath: jsonPath || null,
        sourcePath,
        entries: entriesToSave,
      });
      const savedSignature = buildEntriesSignature(entriesToSave);
      updateActiveProject((project) => ({
        ...project,
        jsonPath: path,
        savedSignature,
      }));
    } catch (error) {
      console.error("Failed to auto-save approval state:", error);
    }
  }, [jsonPath, sourcePath, updateActiveProject]);

  const toggleReviewApproved = useCallback((id: number, nextValue?: boolean) => {
    const nextEntries = entries.map((entry) => {
      if (entry.id !== id) return entry;
      const willApprove = nextValue ?? !entry.approved;
      return { ...entry, approved: willApprove };
    });
    setEntries(nextEntries);
    void persistApprovedState(nextEntries);
  }, [entries, persistApprovedState, setEntries]);

  const approveAndStepReview = useCallback(() => {
    if (reviewCurrentId === null) return;
    toggleReviewApproved(reviewCurrentId, true);
    stepReview(1);
  }, [reviewCurrentId, stepReview, toggleReviewApproved]);

  // Keep review selection valid when filter changes
  useEffect(() => {
    if (!reviewMode || !reviewEntries.length) return;
    const valid = reviewCurrentId !== null && reviewEntries.some((e) => e.id === reviewCurrentId);
    if (!valid) setReviewCurrentId(reviewEntries[0].id);
  }, [reviewEntries, reviewCurrentId, reviewMode]);

  // Review mode: keyboard navigation
  useEffect(() => {
    if (!reviewMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowUp" && !e.shiftKey) { e.preventDefault(); stepReview(-1); }
      if (e.key === "ArrowDown" && !e.shiftKey) { e.preventDefault(); stepReview(1); }
      if (e.key === "Escape") { setReviewMode(false); setReviewDrafts({}); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reviewMode, stepReview]);

  function enterReviewMode() {
    if (!entries.length) return;
    const drafts: Record<number, string> = {};
    for (const entry of entries) {
      drafts[entry.id] = entry.translation;
    }
    setReviewDrafts(drafts);
    setReviewCurrentId(entries[0].id);
    setReviewFilter("all");
    setReviewMode(true);
  }

  function applyReviewChanges() {
    const changed = Object.entries(reviewDrafts).filter(([id, val]) => {
      const entry = entries.find((e) => e.id === Number(id));
      return entry && entry.translation !== val;
    }).length;
    setEntries((prev) => prev.map((e) => ({ ...e, translation: reviewDrafts[e.id] ?? e.translation })));
    setReviewMode(false);
    setReviewDrafts({});
    setStatus(`Review applied: ${changed} change${changed !== 1 ? "s" : ""}`);
  }

  function discardReview() {
    setReviewMode(false);
    setReviewDrafts({});
  }

  async function openProject() {
    if (!workspace) {
      setStatus("Open a project folder first");
      return;
    }
    const selected = await open({
      multiple: true,
      filters: [
        { name: "NPS / JSON", extensions: ["nps", "json"] },
        { name: "All", extensions: ["*"] }
      ]
    });
    if (!selected) return;

    const filesToAdd = Array.isArray(selected) ? selected : [selected];
    for (const filePath of filesToAdd) {
      try {
        const copiedPath = await invoke<string>("add_file_to_studio_project", {
          projectPath: workspace.path,
          filePath,
        });
        await openProjectFromPath(copiedPath);
      } catch (error) {
        setStatus(`Failed to add file to project: ${String(error)}`);
      }
    }
  }

  function closeFileTab(projectId: string) {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === projectId);
      const next = prev.filter((p) => p.id !== projectId);
      if (activeProjectId === projectId) {
        const fallback = next[Math.max(0, idx - 1)] || next[0];
        setActiveProjectId(fallback?.id || "");
      }

      const lastOpened = next.find((project) => project.id === activeProjectId)?.sourcePath
        || next.find((project) => project.id === activeProjectId)?.jsonPath
        || next[0]?.sourcePath
        || next[0]?.jsonPath
        || null;
      void saveWorkspaceManifest(next, lastOpened);
      setStatus("File tab closed");
      return next;
    });
  }

  function openRecentProject(path: string) {
    void loadWorkspaceFromPath(path);
  }

  function removeRecentProject(path: string) {
    setRecentProjectPaths((prev) => prev.filter((p) => p !== path));
  }

  const dirtyProjectCount = useMemo(
    () => projects.filter((project) => buildEntriesSignature(project.entries) !== project.savedSignature).length,
    [projects]
  );

  async function quickSave() {
    if (!projects.length) return;

    const dirtyProjects = projects.filter(
      (project) => buildEntriesSignature(project.entries) !== project.savedSignature
    );

    if (!dirtyProjects.length) {
      setStatus("No unsaved changes to save");
      return;
    }

    setBusy(true);
    try {
      const updates = new Map<string, { path: string; signature: string }>();

      for (const project of dirtyProjects) {
        const path = await invoke<string>("quick_save_project", {
          jsonPath: project.jsonPath || null,
          sourcePath: project.sourcePath,
          entries: project.entries,
        });

        updates.set(project.id, {
          path,
          signature: buildEntriesSignature(project.entries),
        });
      }

      setProjects((prev) =>
        prev.map((project) => {
          const updated = updates.get(project.id);
          if (!updated) return project;
          return {
            ...project,
            jsonPath: updated.path,
            savedSignature: updated.signature,
          };
        })
      );

      setStatus(
        dirtyProjects.length === 1
          ? `Saved ${updates.get(dirtyProjects[0].id)?.path.split(/[\\/]/).pop()}`
          : `Saved ${dirtyProjects.length} modified files`
      );
    } catch (error) {
      setStatus(`Save failed: ${String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
      if (viewMode !== "studio") return;
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "s") return;
      e.preventDefault();
      if (busy) return;
      void quickSave();
    };

    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [viewMode, busy, quickSave]);

  async function saveNps() {
    if (!entries.length || !sourcePath) return;
    try {
      const outPath = await invoke<string>("save_translated_nps", {
        sourcePath,
        entries
      });
      setStatus(`Exported ${outPath.split(/[\\/]/).pop()}`);
    } catch (error) {
      setStatus(`Export failed: ${String(error)}`);
    }
  }

  function applyImportSettingsToEntries(baseEntries: Entry[], importedEntries: Entry[]) {
    const nextEntries = importedEntries.map((nextEntry, idx) => {
      const prevEntry = baseEntries[idx];
      if (!prevEntry) return nextEntry;

      const changedByImport = prevEntry.translation !== nextEntry.translation;
      if (!changedByImport) return nextEntry;

      if (!importSettings.importVoice && prevEntry.type === "voice") {
        return { ...nextEntry, translation: prevEntry.translation };
      }
      if (!importSettings.importNarration && prevEntry.type === "narration") {
        return { ...nextEntry, translation: prevEntry.translation };
      }
      if (!importSettings.importChoice && prevEntry.type === "choice") {
        return { ...nextEntry, translation: prevEntry.translation };
      }

      let normalizedTranslation = nextEntry.translation;
      if (importSettings.trimWhitespace) {
        normalizedTranslation = normalizedTranslation.trim();
      }

      if (importSettings.skipEmptyTranslations && !normalizedTranslation.trim()) {
        normalizedTranslation = prevEntry.translation;
      }

      if (importSettings.skipIfSameAsOriginal && normalizedTranslation.trim() === prevEntry.original.trim()) {
        normalizedTranslation = prevEntry.translation;
      }

      return {
        ...nextEntry,
        translation: normalizedTranslation,
      };
    });

    const effectiveMatched = nextEntries.reduce((acc, entry, idx) => {
      const prev = baseEntries[idx];
      if (!prev) return acc;
      return acc + (prev.translation !== entry.translation ? 1 : 0);
    }, 0);

    return { nextEntries, effectiveMatched };
  }

  async function chooseImportFile() {
    const selected = await open({
      multiple: true,
      filters: [
        { name: "NPS / JSON", extensions: ["nps", "json"] },
        { name: "All", extensions: ["*"] }
      ]
    });
    if (!selected) return;
    const selectedPaths = Array.isArray(selected) ? selected : [selected];
    setImportPaths(selectedPaths);
  }

  function openImportDialog() {
    if (!projects.some((project) => project.entries.length > 0) || busy) return;
    setImportDialogOpen(true);
  }

  async function importTranslationWithSettings() {
    if (!projects.length || !importPaths.length) return;
    setImportBusy(true);

    const importLookup = buildImportLookup(importPaths);
    const importTargets = projects
      .filter((project) => project.entries.length > 0)
      .map((project) => ({
        project,
        importPath: resolveImportForProject(project, importLookup),
      }))
      .filter((item): item is { project: StudioProject; importPath: string } => !!item.importPath);

    if (!importTargets.length) {
      setImportBusy(false);
      setStatus("Import skipped: no filename matches between selected files and project files");
      return;
    }

    const totalSteps = Math.max(1, importTargets.length);
    setImportProgressState({
      active: true,
      stage: "Preparing filename matching...",
      current: 0,
      total: totalSteps,
    });

    try {
      const updatedProjects: StudioProject[] = [];
      let totalMatched = 0;
      let processed = 0;
      let updatedFileCount = 0;
      const touchedIds = new Set<string>();

      for (const target of importTargets) {
        const project = target.project;
        const importPath = target.importPath;
        let workingEntries = project.entries;
        const importFileName = importPath.split(/[\\/]/).pop() || importPath;
        const targetFileName = getProjectDisplayName(project);
        setImportProgressState((prev) => ({
          ...prev,
          stage: `Importing ${importFileName} → ${targetFileName}`,
        }));

        const result = await invoke<ImportResult>("import_translation_file", {
          path: importPath,
          entries: workingEntries,
          overwrite: importSettings.overwriteExisting
        });
        const merged = applyImportSettingsToEntries(workingEntries, result.entries);
        workingEntries = merged.nextEntries;
        totalMatched += merged.effectiveMatched;
        const fileMatched = merged.effectiveMatched;
        processed += 1;

        if (fileMatched > 0) {
          updatedFileCount += 1;
        }
        updatedProjects.push({ ...project, entries: workingEntries });
        touchedIds.add(project.id);

        setImportProgressState((prev) => ({
          ...prev,
          current: Math.min(prev.total, processed),
        }));
      }

      for (const project of projects) {
        if (!touchedIds.has(project.id)) {
          updatedProjects.push(project);
        }
      }

      setProjects(updatedProjects);
      setImportDialogOpen(false);
      const importableProjectCount = projects.filter((project) => project.entries.length > 0).length;
      const unmatched = Math.max(0, importableProjectCount - importTargets.length);
      setStatus(
        unmatched > 0
          ? `Imported ${totalMatched} updates across ${updatedFileCount}/${importTargets.length} matched files (unmatched: ${unmatched})`
          : `Imported ${totalMatched} updates across ${updatedFileCount}/${importTargets.length} matched files`
      );
    } catch (error) {
      setStatus(`Import failed: ${String(error)}`);
    } finally {
      setImportBusy(false);
      setImportProgressState({
        active: false,
        stage: "",
        current: 0,
        total: 1,
      });
    }
  }

  async function translitCurrent() {
    if (!currentEntry) return;
    const text = await invoke<string>("transliterate_text", { text: currentEntry.original });
    updateCurrentTranslation(text);
  }

  function updateCurrentTranslation(next: string) {
    if (currentId === null) return;
    setEntries((prev) => prev.map((e) => (e.id === currentId ? { ...e, translation: next } : e)));
  }

  function getSpeakerName(entry: Entry) {
    if (!entry.speaker) return "narrator";
    return aliases[entry.speaker] || entry.speaker;
  }

  function openNameManager() {
    setAliasDraft({ ...aliases });
    setNameManagerOpen(true);
  }

  async function saveNameManager() {
    const cleaned = Object.fromEntries(
      Object.entries(aliasDraft)
        .map(([k, v]) => [k.trim(), v.trim()] as const)
        .filter(([k, v]) => k.length > 0 && v.length > 0)
    );

    setAliasSaving(true);
    try {
      if (typeof window !== "undefined" && (window as any).__TAURI__) {
        await invoke("save_aliases", { aliases: cleaned });
      }
      localStorage.setItem(LOCAL_ALIAS_STORAGE_KEY, JSON.stringify(cleaned));
      setAliases(cleaned);
      setNameManagerOpen(false);
      setStatus(`Saved ${Object.keys(cleaned).length} speaker aliases`);
    } catch (error) {
      setStatus(`Failed to save aliases: ${String(error)}`);
    } finally {
      setAliasSaving(false);
    }
  }

  function togglePanel(id: string) {
    setPanels((prev) => ({
      ...prev,
      [id]: { ...prev[id], visible: !prev[id].visible }
    }));
    setSelectedPreset("custom");
  }

  function applyPreset(presetId: UIPresetId) {
    const preset = UI_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDesktopLayout(cloneLayout(preset.desktopLayout));
    setCompactLayout(cloneLayout(preset.compactLayout));
    setPanels(clonePanels(preset.panels));
    setEditorOrientation(preset.editorOrientation);
    setSelectedPreset(preset.id);
    setStatus(`Preset applied: ${preset.label}`);
  }

  function resetLayout() {
    if (isDesktopLayout) {
      setDesktopLayout(cloneLayout(DESKTOP_LAYOUT));
      setSelectedPreset("custom");
      return;
    }
    setCompactLayout(cloneLayout(COMPACT_LAYOUT));
    setSelectedPreset("custom");
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!workspace || viewMode !== "studio") return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedPaths = Array.from(files)
        .map((file: any) => file.path || file.webkitRelativePath)
        .filter((path): path is string => !!path && (path.endsWith('.nps') || path.endsWith('.json')));

      if (!droppedPaths.length) return;

      void (async () => {
        for (const path of droppedPaths) {
          try {
            const copiedPath = await invoke<string>("add_file_to_studio_project", {
              projectPath: workspace.path,
              filePath: path,
            });
            await openProjectFromPath(copiedPath);
          } catch (error) {
            setStatus(`Failed to add file to project: ${String(error)}`);
          }
        }
      })();
    }
  };

  return (
    <div className="app" onDragOver={handleDragOver} onDrop={handleDrop}>
      {/* Drag overlay */}
      <div id="drag-overlay" className={isDragOver ? "active" : ""}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>📁</div>
          <div>Drop .nps or .json file to open project</div>
        </div>
      </div>

      {projectLoadState.active && (
        <div id="project-load-overlay">
          <div className="project-load-card">
            <div className="project-load-title">Loading Project</div>
            <div className="project-load-stage">{projectLoadState.stage}</div>
            <div className="project-load-track">
              <div className="project-load-fill" style={{ width: `${projectLoadPercent}%` }} />
            </div>
            <div className="project-load-meta">{projectLoadPercent}%</div>
          </div>
        </div>
      )}

      {viewMode === "manager" ? (
        <div className="project-manager-screen">
          <div className="project-manager-card">
            <h1 className="project-manager-title">Locus Studio Next</h1>
            <p className="project-manager-subtitle">Project Manager</p>
            <div className="project-manager-actions">
              <button className="btn primary" onClick={() => void openWorkspaceProject()} disabled={busy}>{Ico.folder} Open Project Folder</button>
              <button className="btn" onClick={() => void createWorkspaceProject()} disabled={busy}>{Ico.plus} Create New Project</button>
              {workspace && (
                <button className="btn" onClick={() => setViewMode("studio")} disabled={busy}>Continue Project</button>
              )}
            </div>

            {workspace && (
              <div className="project-manager-section">
                <div className="project-manager-section-title">Current Project</div>
                <div className="project-manager-item project-manager-item-stack">
                  <button className="project-manager-item-main" onClick={() => setViewMode("studio")} title={workspace.path}>
                    {workspace.name}
                  </button>
                  <div className="project-manager-meta-row">
                    <span>{projects.length} files</span>
                    <span>{workspaceProgress.done}/{workspaceProgress.total} translated ({workspaceProgress.percent}%)</span>
                  </div>
                </div>
              </div>
            )}

            <div className="project-manager-section">
              <div className="project-manager-section-title">Recent Projects</div>
              {recentProjectPaths.length === 0 ? (
                <div className="project-manager-empty">No recent projects yet.</div>
              ) : (
                <div className="project-manager-list">
                  {recentProjectPaths.map((path) => {
                    const label = path.split(/[\\/]/).pop() || path;
                    return (
                      <div className="project-manager-item" key={path}>
                        <button className="project-manager-item-main" onClick={() => openRecentProject(path)} title={path}>{label}</button>
                        <button className="project-manager-item-close" onClick={() => removeRecentProject(path)} title="Remove from recent">✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Sidebar menu */}
          <aside id="toolbar">
            <span id="toolbar-title">Locus Studio Next</span>
            <button className="btn" onClick={() => setViewMode("manager")} disabled={busy}>Project Manager</button>
            <button className="btn primary" onClick={openProject} disabled={!workspace || busy}>{Ico.folder} Add Files To Project</button>

            <div className="project-files-panel">
              <div className="project-files-panel-head">
                <span className="project-files-title">Files</span>
                <span className="project-files-summary">{projects.length}</span>
              </div>
              <input
                className="project-files-search"
                value={fileListSearch}
                onChange={(e) => setFileListSearch(e.target.value)}
                placeholder="Search files..."
              />
              <div className="project-files-list">
                {filteredProjectFileRows.length === 0 ? (
                  <div className="project-files-empty">No files</div>
                ) : (
                  filteredProjectFileRows.map((fileRow) => {
                    const isActive = fileRow.id === activeProjectId;
                    return (
                      <div
                        key={fileRow.id}
                        className={`project-file-item${isActive ? " active" : ""}`}
                        onClick={() => setActiveProjectId(fileRow.id)}
                      >
                        <button
                          className="project-file-main"
                          onClick={() => setActiveProjectId(fileRow.id)}
                          title={fileRow.sourcePath || fileRow.jsonPath || fileRow.title}
                        >
                          <span className="project-file-name">{fileRow.title}</span>
                          <span className="project-file-stats">{fileRow.done}/{fileRow.total}</span>
                        </button>
                        <button
                          className="project-file-close"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeFileTab(fileRow.id);
                          }}
                          title={`Remove ${fileRow.title}`}
                        >
                          ✕
                        </button>
                        <div className="project-file-progress-track">
                          <div className="project-file-progress-fill" style={{ width: `${fileRow.percent}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button className="btn" onClick={quickSave} disabled={!projects.length || busy || dirtyProjectCount === 0}>{Ico.save} Quick Save</button>
            <button className="btn" onClick={saveNps} disabled={!entries.length || busy}>{Ico.export} Save .nps</button>
            <button className="btn" onClick={openImportDialog} disabled={!entries.length || busy}>{Ico.import} Import</button>
            <button className="btn" onClick={openNameManager} disabled={busy}>{Ico.folder} Name Manager</button>
            <button className="btn" onClick={enterReviewMode} disabled={!entries.length || busy}>{Ico.review} Review Mode</button>
            <div className="preset-group">
              <span className="grid-toolbar-label">Presets</span>
              {UI_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className={`grid-panel-chip${selectedPreset === preset.id ? " active" : ""}`}
                  onClick={() => applyPreset(preset.id)}
                  title={`Apply ${preset.label} preset`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <button
              className={`btn${layoutLocked ? "" : " btn-active"}`}
              onClick={() => setLayoutLocked((v) => !v)}
              title={layoutLocked ? "Enable panel edit mode" : "Disable panel edit mode"}
            >
              {layoutLocked ? Ico.lock : Ico.unlock}
              {layoutLocked ? "Layout Locked" : "Layout Edit"}
            </button>
            <button className="btn" onClick={resetLayout} title="Reset current layout to defaults">{Ico.reset} Reset Layout</button>
            <div id="toolbar-right">
              {!layoutLocked && (
                <div className="panel-toggle-group">
                  <span className="grid-toolbar-label">Panels</span>
                  {Object.values(panels).map((panel) => (
                    <button
                      key={panel.id}
                      className={`grid-panel-chip${panel.visible ? " active" : ""}`}
                      onClick={() => togglePanel(panel.id)}
                      title={panel.visible ? `Hide ${panel.title}` : `Show ${panel.title}`}
                    >
                      {panel.visible ? Ico.check : Ico.plus}
                      {panel.title}
                    </button>
                  ))}
                </div>
              )}
              {sourcePath && <span className="path-chip" title={sourcePath}>SRC: {sourcePath.split(/[\\/]/).pop()}</span>}
              {jsonPath && <span className="path-chip" title={jsonPath}>JSON: {jsonPath.split(/[\\/]/).pop()}</span>}
              {entries.length > 0 && (
                <span id="progress-text">{doneCount}/{entries.length} ({progress}%)</span>
              )}
              {workspace && <span className="path-chip" title={workspace.path}>PROJECT: {workspace.name}</span>}
            </div>
          </aside>

          <div className="workspace">
        {/* Status bar */}
        <div id="statusbar">
          {status || (entries.length === 0 ? "Ready · Add files to current project" : "Ready")}
        </div>

        {/* Main */}
        <div id="main">
          {/* Search bar */}
          <div id="searchbar">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search speaker, original, translation..."
            />
            {(["all", "todo", "done", "voice", "narration", "choice"] as const).map((mode) => (
              <button
                key={mode}
                className={`filter-btn${filter === mode ? " active" : ""}`}
                onClick={() => setFilter(mode)}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="grid-layout-container" ref={gridContainerRef}>
            <GridLayout
              className="layout"
              layout={layout}
              onLayoutChange={(nextLayout: Layout[]) => {
                const normalized = nextLayout.map((item: Layout) => ({ ...item }));
                setSelectedPreset("custom");
                if (isDesktopLayout) {
                  setDesktopLayout(normalized);
                  return;
                }
                setCompactLayout(normalized);
              }}
              cols={12}
              rowHeight={rowHeight}
              width={gridWidth || window.innerWidth}
              height={gridHeight || window.innerHeight}
              isDraggable={!layoutLocked}
              isResizable={!layoutLocked}
              resizeHandles={['s', 'n', 'e', 'w', 'se', 'sw', 'ne', 'nw']}
              compactType="vertical"
              preventCollision={false}
              draggableHandle=".grid-panel-header"
              margin={[0, 0]}
            >
            {panels.table.visible && (
              <div key="table" className="grid-panel">
                <div className="grid-panel-header">
                  {!layoutLocked && <span className="grid-panel-drag-hint">{Ico.drag}</span>}
                  <span style={{ flex: 1 }}>Translations</span>
                  {!layoutLocked && <button className="mini-btn" onClick={() => togglePanel("table")} title="Hide panel">✕</button>}
                </div>
                <div className="grid-panel-body" style={{ overflowY: "auto" }}>
                  {entries.length === 0 ? (
                    <div id="empty-state">
                      <div className="big-icon">📄</div>
                      <h2>No file loaded</h2>
                      <p>Open a .nps or .json file, or drag &amp; drop it here to start translating.</p>
                    </div>
                  ) : (
                    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                      <table>
                        <thead>
                          <tr>
                            <th className="col-id">#</th>
                            <th className="col-spk">Speaker</th>
                            <th className="col-orig">Original</th>
                            <th className="col-tr">Translation</th>
                            <th className="col-type">Type</th>
                            <th className="col-line">Line</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEntries.map((e) => {
                            const sel = e.id === currentId;
                            const done = !!e.translation;
                            const rowClass = [
                              sel ? "selected" : "",
                              done ? "row-done" : "",
                              e.type === "narration" ? "row-narr" : "",
                              e.type === "choice" ? "row-choice" : "",
                            ].filter(Boolean).join(" ");
                            return (
                              <tr
                                key={e.id}
                                id={sel ? "table-active-row" : undefined}
                                className={rowClass}
                                onClick={() => setCurrentId(e.id)}
                              >
                                <td className="col-id">{e.id}</td>
                                <td className="col-spk">{getSpeakerName(e)}</td>
                                <td className="col-orig">{e.original}</td>
                                <td className="col-tr">{e.translation}</td>
                                <td className="col-type"><span className={`tag tag-${e.type}`}>{e.type}</span></td>
                                <td className="col-line">{e.line_no}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            {panels.editor.visible && (
              <div key="editor" className="grid-panel">
                <div className="grid-panel-header">
                  {!layoutLocked && <span className="grid-panel-drag-hint">{Ico.drag}</span>}
                  <span style={{ flex: 1 }}>Editor</span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button
                      className="mini-btn"
                      onClick={() => {
                        setEditorOrientation((o) => o === "horizontal" ? "vertical" : "horizontal");
                        setSelectedPreset("custom");
                      }}
                      title={`Switch to ${editorOrientation === "horizontal" ? "vertical" : "horizontal"} layout`}
                    >{editorOrientation === "horizontal" ? Ico.splitV : Ico.splitH}</button>
                    {!layoutLocked && <button className="mini-btn" onClick={() => togglePanel("editor")} title="Hide panel">✕</button>}
                  </div>
                </div>
                <div className="grid-panel-body" style={{ display: "flex", flexDirection: "column" }}>
                  <div id="editor-meta">
                    <span id="editor-speaker">{currentEntry ? getSpeakerName(currentEntry) : "—"}</span>
                    {currentEntry && (
                      <span id="editor-info">#{currentEntry.id} · line {currentEntry.line_no} · {currentEntry.type}</span>
                    )}
                    <span id="editor-lbl-progress">{doneCount}/{entries.length} ({progress}%)</span>
                  </div>
                  <div id="editor-body" className={editorOrientation}>
                    <div className="editor-col">
                      <div className="editor-col-header">
                        <span className="editor-col-label">Original</span>
                        <div className="editor-col-actions">
                          <button className="mini-btn" disabled={!currentEntry} onClick={() => navigator.clipboard.writeText(currentEntry?.original ?? "")}>{Ico.copy} Copy</button>
                        </div>
                      </div>
                      <div className="ta-wrap">
                        <textarea className="editor-textarea" readOnly value={currentEntry?.original ?? ""} placeholder="Select an entry to see the original text" />
                      </div>
                    </div>
                    <div className="editor-col">
                      <div className="editor-col-header">
                        <span className="editor-col-label">Translation</span>
                        <div className="editor-col-actions">
                          <button className="mini-btn" disabled={!currentEntry} onClick={translitCurrent}>{Ico.translit} Translit</button>
                          <button className="mini-btn" disabled={!currentEntry} onClick={() => navigator.clipboard.writeText(currentEntry?.translation ?? "")}>{Ico.copy} Copy</button>
                        </div>
                      </div>
                      <div className="ta-wrap">
                        <textarea
                          className="editor-textarea"
                          value={currentEntry?.translation ?? ""}
                          onChange={(e) => updateCurrentTranslation(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp" && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); stepSelection(-1); }
                            if (e.key === "ArrowDown" && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); stepSelection(1); }
                            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); stepSelection(1); }
                          }}
                          placeholder="Type translation… ↑↓ navigate · Enter → next · Ctrl+S save"
                        />
                      </div>
                    </div>
                  </div>
                  <div id="editor-footer">
                    <span className="hint">↑↓ navigate · Enter → next · Ctrl+S save</span>
                    <button className="mini-btn" disabled={!currentEntry} onClick={() => updateCurrentTranslation("")}>Clear</button>
                  </div>
                </div>
              </div>
            )}
            {panels.inspector.visible && (
              <div key="inspector" className="grid-panel">
                <div className="grid-panel-header">
                  {!layoutLocked && <span className="grid-panel-drag-hint">{Ico.drag}</span>}
                  <span style={{ flex: 1 }}>Inspector</span>
                  {!layoutLocked && <button className="mini-btn" onClick={() => togglePanel("inspector")} title="Hide panel">✕</button>}
                </div>
                <div className="grid-panel-body" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                  {/* Split view: top = original, bottom = translation */}
                  <div className="inspector-pane inspector-pane-left" id="inspector-original-pane">
                    <div className="inspector-pane-title">Original File</div>
                    <div className="inspector-content">
                      {sourceFileLines.length === 0 ? (
                        <div className="inspector-empty">No original file loaded</div>
                      ) : (
                        sourceFileLines.map((line, idx) => {
                          const lineNo = idx + 1;
                          const isActive = currentEntry && currentEntry.line_no === lineNo;
                          return (
                            <div
                              key={idx}
                              className={`inspector-line${isActive ? ' active' : ''}`}
                              id={isActive ? 'inspector-active-line-original' : undefined}
                            >
                              <span className="inspector-line-no">{lineNo}</span>
                              <span className="inspector-line-text">{line}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="inspector-pane" id="inspector-translation-pane">
                    <div className="inspector-pane-title">Translation (Generated)</div>
                    <div className="inspector-content" style={{ backgroundColor: 'var(--bg2)' }}>
                      {translationFileLines.length === 0 ? (
                        <div className="inspector-empty">No translation file loaded</div>
                      ) : (
                        translationFileLines.map((line, idx) => {
                          // Try to highlight the line that matches the current translation line number
                          const isActive = currentEntry && currentEntry.line_no === idx + 1;
                          return (
                            <div
                              key={idx}
                              className={`inspector-line${isActive ? ' active' : ''}`}
                              id={isActive ? 'inspector-active-line-translation' : undefined}
                            >
                              <span className="inspector-line-no">{idx + 1}</span>
                              <span className="inspector-line-text">{line}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </GridLayout>
          </div>
        </div>
          </div>
        </>
      )}

      {importDialogOpen && (
        <div className="modal-overlay" onClick={() => !importBusy && setImportDialogOpen(false)}>
          <div className="import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="import-modal-header">
              <h3>Import Translation</h3>
              <button className="mini-btn" onClick={() => setImportDialogOpen(false)} disabled={importBusy}>Close</button>
            </div>

            <div className="import-modal-section">
              <label className="import-modal-label">Translation file</label>
              <div className="import-path-row">
                <input
                  className="import-path-input"
                  value={importSelectionLabel}
                  readOnly
                  placeholder="Choose one or more .nps/.json files"
                />
                <button className="btn" onClick={chooseImportFile} disabled={importBusy}>{Ico.folder} Browse Files</button>
              </div>
              {importPaths.length > 1 && (
                <div className="import-modal-label">Selected: {importPaths.length} files</div>
              )}
            </div>

            <div className="import-modal-section">
              <div className="import-section-title">Merge behavior</div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={importSettings.overwriteExisting}
                  onChange={(e) => setImportSettings((prev) => ({ ...prev, overwriteExisting: e.target.checked }))}
                />
                Overwrite existing translations
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={importSettings.trimWhitespace}
                  onChange={(e) => setImportSettings((prev) => ({ ...prev, trimWhitespace: e.target.checked }))}
                />
                Trim imported whitespace
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={importSettings.skipIfSameAsOriginal}
                  onChange={(e) => setImportSettings((prev) => ({ ...prev, skipIfSameAsOriginal: e.target.checked }))}
                />
                Skip lines where import equals original text
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={importSettings.skipEmptyTranslations}
                  onChange={(e) => setImportSettings((prev) => ({ ...prev, skipEmptyTranslations: e.target.checked }))}
                />
                Skip empty imported translations
              </label>
            </div>

            <div className="import-modal-section">
              <div className="import-section-title">Entry types to import</div>
              <div className="import-type-grid">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={importSettings.importVoice}
                    onChange={(e) => setImportSettings((prev) => ({ ...prev, importVoice: e.target.checked }))}
                  />
                  Voice
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={importSettings.importNarration}
                    onChange={(e) => setImportSettings((prev) => ({ ...prev, importNarration: e.target.checked }))}
                  />
                  Narration
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={importSettings.importChoice}
                    onChange={(e) => setImportSettings((prev) => ({ ...prev, importChoice: e.target.checked }))}
                  />
                  Choice
                </label>
              </div>
            </div>

            {importProgressState.active && (
              <div className="import-modal-section">
                <div className="import-section-title">Import Progress</div>
                <div className="import-progress-stage">{importProgressState.stage}</div>
                <div className="import-progress-track">
                  <div className="import-progress-fill" style={{ width: `${importProgressPercent}%` }} />
                </div>
                <div className="import-progress-meta">{importProgressPercent}% ({importProgressState.current}/{importProgressState.total})</div>
              </div>
            )}

            <div className="import-modal-actions">
              <button
                className="btn"
                onClick={() => setImportSettings({ ...DEFAULT_IMPORT_SETTINGS })}
                disabled={importBusy}
              >
                {Ico.reset} Reset Defaults
              </button>
              <button className="btn" onClick={() => setImportDialogOpen(false)} disabled={importBusy}>Cancel</button>
              <button
                className="btn primary"
                onClick={() => void importTranslationWithSettings()}
                disabled={importBusy || !importPaths.length || (!importSettings.importVoice && !importSettings.importNarration && !importSettings.importChoice)}
              >
                {Ico.import} {importBusy ? "Importing..." : "Start Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewMode && viewMode === "studio" && (
        <div className="review-overlay">
          {/* Header */}
          <div className="review-header">
            <span className="review-title">{Ico.review} Review Mode</span>
            <span className="review-counter">
              {reviewCurrentEntry
                ? `${reviewEntries.findIndex((e) => e.id === reviewCurrentId) + 1} / ${reviewEntries.length}`
                : `0 / ${reviewEntries.length}`}
            </span>
            <div className="review-filter-btns">
              {(["all", "modified", "unedited"] as const).map((f) => (
                <button
                  key={f}
                  className={`filter-btn${reviewFilter === f ? " active" : ""}`}
                  onClick={() => setReviewFilter(f)}
                >{f}</button>
              ))}
            </div>
            {reviewChangedCount > 0 && (
              <span className="review-changed-badge">{reviewChangedCount} changed</span>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="btn" onClick={discardReview}>Exit Review</button>
              <button
                className="btn primary"
                onClick={applyReviewChanges}
                disabled={reviewChangedCount === 0}
                title="Apply all review edits to translations"
              >
                {Ico.save} Apply{reviewChangedCount > 0 ? ` (${reviewChangedCount})` : ""}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="review-body">
            {/* Entry list */}
            <div className="review-list" id="review-list-pane">
              {reviewEntries.map((entry) => {
                const isActive = entry.id === reviewCurrentId;
                const draft = reviewDrafts[entry.id] ?? entry.translation;
                const isModified = draft !== entry.translation;
                const isApproved = !!entry.approved;
                return (
                  <div
                    key={entry.id}
                    id={isActive ? "review-active-item" : undefined}
                    className={`review-list-item${isActive ? " active" : ""}${isModified ? " modified" : ""}${isApproved ? " approved" : ""}`}
                    onClick={() => setReviewCurrentId(entry.id)}
                  >
                    <div className="review-list-item-header">
                      <span className="review-list-id">#{entry.id}</span>
                      <span className="review-list-speaker">{getSpeakerName(entry)}</span>
                      <span className={`tag tag-${entry.type}`}>{entry.type[0]}</span>
                      {isModified && <span className="review-modified-dot" title="Modified">✎</span>}
                      <button
                        className={`mini-btn review-approve-btn${isApproved ? " active" : ""}`}
                        title={isApproved ? "Remove approval" : "Mark approved"}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleReviewApproved(entry.id);
                        }}
                      >
                        {isApproved ? "Approved" : "Approve"}
                      </button>
                    </div>
                    <div className="review-list-preview">{entry.original}</div>
                  </div>
                );
              })}
            </div>

            {/* Three-panel editor */}
            <div className="review-editor">
              {reviewCurrentEntry ? (
                <>
                  <div className="review-meta">
                    <span>
                      #{reviewCurrentEntry.id} · Line {reviewCurrentEntry.line_no} ·{" "}
                      <span className={`tag tag-${reviewCurrentEntry.type}`}>{reviewCurrentEntry.type}</span>
                    </span>
                    <span className="review-meta-speaker">{getSpeakerName(reviewCurrentEntry)}</span>
                  </div>
                  <div className="review-panels">
                    {/* Original */}
                    <div className="review-panel">
                      <div className="review-panel-header">
                        <span className="review-panel-label">Original</span>
                        <button className="mini-btn" onClick={() => navigator.clipboard.writeText(reviewCurrentEntry.original)}>{Ico.copy} Copy</button>
                      </div>
                      <textarea className="review-textarea" readOnly value={reviewCurrentEntry.original} />
                    </div>
                    {/* Current Translation */}
                    <div className="review-panel">
                      <div className="review-panel-header">
                        <span className="review-panel-label">Translation</span>
                        <button className="mini-btn" onClick={() => navigator.clipboard.writeText(reviewCurrentEntry.translation)}>{Ico.copy} Copy</button>
                      </div>
                      <textarea className="review-textarea" readOnly value={reviewCurrentEntry.translation} />
                    </div>
                    {/* Edited */}
                    <div className="review-panel review-panel-edit">
                      <div className="review-panel-header">
                        <span className="review-panel-label review-panel-label-edit">Edited</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {(reviewDrafts[reviewCurrentEntry.id] ?? reviewCurrentEntry.translation) !== reviewCurrentEntry.translation && (
                            <button
                              className="mini-btn"
                              title="Revert to current translation"
                              onClick={() => setReviewDrafts((prev) => ({ ...prev, [reviewCurrentEntry.id]: reviewCurrentEntry.translation }))}
                            >{Ico.reset} Revert</button>
                          )}
                          <button className="mini-btn" onClick={() => navigator.clipboard.writeText(reviewDrafts[reviewCurrentEntry.id] ?? reviewCurrentEntry.translation)}>{Ico.copy} Copy</button>
                        </div>
                      </div>
                      <textarea
                        className="review-textarea review-textarea-edit"
                        value={reviewDrafts[reviewCurrentEntry.id] ?? reviewCurrentEntry.translation}
                        onChange={(e) => setReviewDrafts((prev) => ({ ...prev, [reviewCurrentEntry.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); stepReview(-1); }
                          if (e.key === "ArrowDown" && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); stepReview(1); }
                          if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); approveAndStepReview(); }
                        }}
                        placeholder="Edit the translation here…"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="review-footer">
                    <button
                      className="btn"
                      onClick={() => stepReview(-1)}
                      disabled={reviewEntries.findIndex((e) => e.id === reviewCurrentId) <= 0}
                    >← Prev</button>
                    <span className="hint">↑↓ navigate · Enter → next · Ctrl+S save draft · Escape exit</span>
                    <button
                      className="btn"
                      onClick={approveAndStepReview}
                      disabled={reviewEntries.findIndex((e) => e.id === reviewCurrentId) >= reviewEntries.length - 1}
                    >Next →</button>
                  </div>
                </>
              ) : (
                <div className="review-empty">No entries to review. Try changing the filter.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {nameManagerOpen && (
        <div className="modal-overlay" onClick={() => !aliasSaving && setNameManagerOpen(false)}>
          <div className="import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="import-modal-header">
              <h3>Speaker Name Manager</h3>
              <button className="mini-btn" onClick={() => setNameManagerOpen(false)} disabled={aliasSaving}>Close</button>
            </div>

            <div className="import-modal-section">
              <div className="import-section-title">Local aliases</div>
              <div className="alias-manager-list">
                {knownSpeakers.length === 0 ? (
                  <div className="project-files-empty">No speakers found in current project files.</div>
                ) : (
                  knownSpeakers.map((speaker) => (
                    <div className="alias-row" key={speaker}>
                      <div className="alias-row-speaker" title={speaker}>{speaker}</div>
                      <input
                        className="import-path-input"
                        value={aliasDraft[speaker] ?? ""}
                        onChange={(e) => setAliasDraft((prev) => ({ ...prev, [speaker]: e.target.value }))}
                        placeholder="Custom display name"
                        disabled={aliasSaving}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="import-modal-actions">
              <button
                className="btn"
                onClick={() => setAliasDraft({ ...aliases })}
                disabled={aliasSaving}
              >
                {Ico.reset} Reset Changes
              </button>
              <button className="btn" onClick={() => setNameManagerOpen(false)} disabled={aliasSaving}>Cancel</button>
              <button className="btn primary" onClick={() => void saveNameManager()} disabled={aliasSaving}>
                {Ico.save} {aliasSaving ? "Saving..." : "Save Names"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
