import type { SortStatus } from "../../../../types/sort";

export type StatusDotProps = {
    status?: SortStatus;
};

// CSS-variable strings (not class names) — consumed by style={{ background, boxShadow }} below.
const COLORS: Record<SortStatus, string> = {
    idle: "var(--color-success)",
    running: "var(--color-primary)",
    paused: "var(--color-fg-3)",
    warning: "var(--color-warning)",
    error: "var(--color-destructive)",
};

export function StatusDot({ status = "idle" }: StatusDotProps) {
    const color = COLORS[status];

    return (
        <span
            className="inline-block w-[7px] h-[7px] rounded-full"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
    );
}
