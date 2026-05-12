import type { SortRuleId } from "../../../types/ipc";
import type { SettingsHook } from "../hooks/use-settings";

export function preferredDefaultRule(state: SettingsHook["state"]): SortRuleId | null {
    if (state.status !== "success") {
        return null;
    }

    const { rememberLastSortRule, memo } = state.settings;

    if (!rememberLastSortRule) {
        return null;
    }

    return memo.lastSortRule;
}
