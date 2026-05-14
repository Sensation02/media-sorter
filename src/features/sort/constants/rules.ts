import type { SortRuleId } from "../../../types/sort";

export const DEFAULT_RULE_IDS: readonly SortRuleId[] = [
    "by-date-and-place",
    "by-date",
    "by-type",
    "by-camera",
] as const;
