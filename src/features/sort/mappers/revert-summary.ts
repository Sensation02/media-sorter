export type RevertSummaryParts = {
    restored: number;
    skipped: number;
    errors: number;
};

export function revertSummaryParts(
    restored: number,
    skipped: number,
    errors: number,
): RevertSummaryParts {
    return { restored, skipped, errors };
}
