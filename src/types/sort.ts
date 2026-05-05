export type SortRuleId = "by-date" | "by-type" | "by-camera";

export interface SortTreeNode {
  kind: "folder" | "file";
  label: string;
  muted?: boolean;
  children?: SortTreeNode[];
}

export interface SortRule {
  id: SortRuleId;
  name: string;
  hint: string;
  description: string;
  preview: SortTreeNode[];
}

export interface SortSource {
  path: string;
  fileCount: number;
  size: string;
}

export type SortLogLevel = "ok" | "warn" | "error";

export interface SortLogEntry {
  time: string;
  level: SortLogLevel;
  text: string;
}

export interface SortProgress {
  total: number;
  processed: number;
  moved: number;
  skipped: number;
  folders: number;
  elapsed: string;
  remaining: string;
  current: string;
  log: SortLogEntry[];
}

export interface SortDone {
  duration: string;
  moved: number;
  skipped: number;
  folders: number;
  destination: string;
}

export interface SortHistoryItem {
  id: number;
  name: string;
  date: string;
  duration: string;
  moved: number;
  skipped: number;
}

export type SortStatus = "idle" | "running" | "paused" | "warning" | "error";

export type SortScreen = "setup" | "progress" | "done" | "history" | "settings";

export interface SortSettings {
  copy: boolean;
  skipDuplicates: boolean;
  watchSource: boolean;
  writeReport: boolean;
}
