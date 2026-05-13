import type { HistoryItemDto } from "../../../../types/ipc";

export type HistoryStatsProps = {
    job: HistoryItemDto;
};

export function HistoryStats({ job }: HistoryStatsProps) {
    return (
        <div className="font-mono text-meta text-fg-2 tabular-nums whitespace-nowrap">
            {job.moved.toLocaleString()} moved
            {job.skipped > 0 && (
                <span className="text-warning">
                    {" · "}
                    {job.skipped} skipped
                </span>
            )}
            {job.errors > 0 && (
                <span className="text-destructive">
                    {" · "}
                    {job.errors} errors
                </span>
            )}
        </div>
    );
}
