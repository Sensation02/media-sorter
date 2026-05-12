import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { HistoryItemDto, JobId } from "../../../../types/ipc";
import type { HistoryHookState } from "../../use-history";
import { formatHistoryDate, formatHistoryDuration } from "../../history-format";

const REVERTABLE_STATES = new Set(["done", "cancelled", "failed"]);

export type HistoryScreenProps = {
    state: HistoryHookState;
    onRevert: (jobId: JobId) => void;
    onRetry: () => void;
    nowMs?: number;
};

export function HistoryScreen({ state, onRevert, onRetry, nowMs }: HistoryScreenProps) {
    const [mountedNowMs] = useState(() => Date.now());
    const referenceNowMs = nowMs ?? mountedNowMs;

    if (state.status === "loading") {
        return <Centered>Loading history…</Centered>;
    }

    if (state.status === "error") {
        return (
            <Centered>
                <p className="text-body mb-3">{state.error.title}</p>
                <Button variant="ghost" size="sm" onClick={onRetry}>
                    Try again
                </Button>
            </Centered>
        );
    }

    if (state.items.length === 0) {
        return <Centered>No completed sorts yet.</Centered>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-7 py-7">
                <Card className="overflow-hidden">
                    <ul className="divide-y divide-divider-soft">
                        {state.items.map((job) => (
                            <HistoryRow
                                key={job.id}
                                job={job}
                                nowMs={referenceNowMs}
                                onRevert={onRevert}
                            />
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
}

type HistoryRowProps = {
    job: HistoryItemDto;
    nowMs: number;
    onRevert: (jobId: JobId) => void;
};

function HistoryRow({ job, nowMs, onRevert }: HistoryRowProps) {
    const date = formatHistoryDate(job.startedAtMs, nowMs);
    const duration = formatHistoryDuration(job.durationMs);
    const canRevert = REVERTABLE_STATES.has(job.state);

    return (
        <li className="px-4 py-3 flex items-center gap-4 hover:bg-hover-soft">
            <div className="flex-1 min-w-0">
                <div className="text-body font-medium truncate">{job.name}</div>
                <div className="font-mono text-meta-sm text-fg-3 mt-0.5">
                    {date} {"·"} {duration}
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
                {job.state === "reverted" ? "Reverted" : `↶ Revert`}
            </Button>
        </li>
    );
}

function HistoryStats({ job }: { job: HistoryItemDto }) {
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

function Centered({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-full flex items-center justify-center text-body text-fg-3 flex-col">
            {children}
        </div>
    );
}
