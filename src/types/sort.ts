export type { SortRuleId } from "./ipc";

import type { SortRuleId } from "./ipc";

export type SortTreeNode =
  | { kind: "folder"; label: string; muted?: boolean; children: SortTreeNode[] }
  | { kind: "file"; label: string; muted?: boolean };

export type SortRule = {
  id: SortRuleId;
  name: string;
  hint: string;
  description: string;
};

export type SortLogLevel = "ok" | "warn" | "error";

export type SortLogEntry = {
  time: string;
  level: SortLogLevel;
  text: string;
};

export type SortProgress = {
  total: number;
  processed: number;
  moved: number;
  skipped: number;
  folders: number;
  elapsed: string;
  remaining: string;
  current: string;
  log: SortLogEntry[];
};

export type SortDone = {
  duration: string;
  moved: number;
  skipped: number;
  folders: number;
  destination: string;
};

export type SortStatus = "idle" | "running" | "paused" | "warning" | "error";

export type SortScreen = "setup" | "progress" | "done" | "history" | "settings";

export type SortSettings = {
  copy: boolean;
  skipDuplicates: boolean;
  watchSource: boolean;
  writeReport: boolean;
};
