export type { SortRuleId } from "./ipc";

import type { SortRuleId } from "./ipc";

export type SortTreeNode =
    | { kind: "folder"; label: string; muted?: boolean; children: SortTreeNode[] }
    | { kind: "file"; count: number; muted?: boolean };

export type SortRule = {
    id: SortRuleId;
    name: string;
    hint: string;
    description: string;
};

export const LOG_LEVEL = {
    ok: "ok",
    warn: "warn",
    error: "error",
} as const;

export type SortLogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

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

export const SORT_STATUS = {
    idle: "idle",
    running: "running",
    paused: "paused",
    warning: "warning",
    error: "error",
} as const;

export type SortStatus = (typeof SORT_STATUS)[keyof typeof SORT_STATUS];

export type { SortScreen } from "../features/sort/constants/screens";

const SORT_RULE_IDS = new Set<SortRuleId>(["by-date-and-place", "by-date", "by-type", "by-camera"]);

export function isSortRuleId(value: string): value is SortRuleId {
    return SORT_RULE_IDS.has(value as SortRuleId);
}
