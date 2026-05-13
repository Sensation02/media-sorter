import type { SortRule, SortRuleId } from "../../../types/sort";

export function resolveDefaultRule(
    preferred: SortRuleId | null | undefined,
    rules: SortRule[],
    fallback: SortRuleId,
): SortRuleId {
    if (preferred === null || preferred === undefined) {
        return fallback;
    }

    if (!rules.some((rule) => rule.id === preferred)) {
        return fallback;
    }

    return preferred;
}
