import { Button } from "@/components/ui/button";

import { ICON } from "../../constants/icons";
import { formatHistoryDate, formatHistoryDuration } from "../../history-format";
import type { HistoryItemDto, JobId } from "../../../../types/ipc";
import { HistoryStats } from "./HistoryStats";

const Undo = ICON.undo;

const REVERTABLE_STATES = new Set(["done", "cancelled", "failed"]);

export type HistoryRowProps = {
    job: HistoryItemDto;
    nowMs: number;
    onRevert: (jobId: JobId) => void;
};

export function HistoryRow({ job, nowMs, onRevert }: HistoryRowProps) {
    const date = formatHistoryDate(job.startedAtMs, nowMs);
    const duration = formatHistoryDuration(job.durationMs);
    const canRevert = REVERTABLE_STATES.has(job.state);

    return (
        <li className="px-4 py-3 flex items-center gap-4 hover:bg-hover-soft">
            <div className="flex-1 min-w-0">
                <div className="text-body font-medium truncate">{job.name}</div>
                <div className="font-mono text-meta-sm text-fg-3 mt-0.5">
                    {date} · {duration}
                </div>
            </div>
            <HistoryStats job={job} />
            <Button
                variant="ghost"
                size="sm"
                disabled={!canRevert}
                onClick={() => {
                    onRevert(job.id);
                }}
            >
                {job.state === "reverted" ? (
                    "Reverted"
                ) : (
                    <>
                        <Undo className="h-3.5 w-3.5" aria-hidden /> Revert
                    </>
                )}
            </Button>
        </li>
    );
}
