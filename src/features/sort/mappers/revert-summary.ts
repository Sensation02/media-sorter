export function revertSummary(restored: number, skipped: number, errors: number): string {
    const parts: string[] = [`${restored} restored`];

    if (skipped > 0) {
        parts.push(`${skipped} skipped`);
    }

    if (errors > 0) {
        parts.push(`${errors} errors`);
    }

    return parts.join(", ");
}
