export type EntryType = "voice" | "narration" | "choice";

export interface Entry {
  id: number;
  type: EntryType;
  line_no: number;
  speaker: string;
  original: string;
  translation: string;
  approved?: boolean;
  src?: string;
}

export interface ProjectData {
  source_file: string;
  entries: Entry[];
}

export interface StudioProjectInfo {
  name: string;
  path: string;
  files: string[];
  last_opened_file: string | null;
}

export interface ImportResult {
  entries: Entry[];
  matched: number;
  total: number;
  method: string;
}

export interface CounterFileReport {
  file: string;
  lines: number;
  words: number;
  entries: Entry[];
}

export interface CounterReport {
  total_lines: number;
  total_words: number;
  files: CounterFileReport[];
}
