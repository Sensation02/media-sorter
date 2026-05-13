import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { LOG_LEVEL, type SortLogLevel, type SortProgress } from "../../../../types/sort";
import { Eyebrow } from "../../components/eyebrow";
import { ScreenFrame } from "../../components/screen-frame";
import { Stat } from "../../components/stat";
import { ICON } from "../../constants/icons";

const ChevronRight = ICON.chevronRight;

const PERCENT_BASE = 100;

export type ProgressScreenProps = {
    progress: SortProgress;
    onPause: () => void;
    onCancel: () => void;
};

const LOG_DOT_COLORS: Record<SortLogLevel, string> = {
    ok: "bg-success",
    warn: "bg-warning",
    error: "bg-destructive",
};

export function ProgressScreen({ progress, onPause, onCancel }: ProgressScreenProps) {
    const percent =
        progress.total > 0 ? Math.round((progress.processed / progress.total) * PERCENT_BASE) : 0;

    return (
        <ScreenFrame
            bodyClassName="space-y-6"
            footer={
                <>
                    <Button variant="cautious" size="md" onClick={onCancel}>
                        Cancel sort
                    </Button>
                    <div className="ml-auto" />
                    <Button variant="secondary" size="md" onClick={onPause}>
                        Pause
                    </Button>
                </>
            }
        >
            <section>
                <div className="flex items-baseline gap-3 mb-3">
                    <span className="font-mono text-display font-medium tracking-display">
                        {progress.processed.toLocaleString()}
                    </span>
                    <span className="font-mono text-title text-fg-3">
                        / {progress.total.toLocaleString()}
                    </span>
                    <span className="ml-auto font-mono text-meta text-fg-2">
                        {percent}% {"·"} {progress.remaining}
                    </span>
                </div>
                <Progress value={percent} />
                <div className="mt-3 flex items-center gap-2 font-mono text-meta text-fg-2">
                    <ChevronRight className="h-3 w-3 text-primary" aria-hidden />
                    <span className="truncate">{progress.current}</span>
                </div>
            </section>

            <section className="flex gap-3">
                <Stat label="Moved" value={progress.moved} />
                <Stat
                    label="Skipped"
                    value={progress.skipped}
                    tone={progress.skipped > 0 ? "warning" : "default"}
                />
                <Stat label="Folders" value={progress.folders} />
                <Stat label="Elapsed" value={progress.elapsed} />
            </section>

            <section>
                <Eyebrow className="mb-2.5">Activity log</Eyebrow>
                <Card className="overflow-hidden">
                    <ul className="divide-y divide-divider-soft">
                        {progress.log.map((entry, index) => (
                            <li
                                key={`${entry.time}-${index}`}
                                className="px-4 py-2 flex items-baseline gap-3 font-mono text-caption"
                            >
                                <span className="text-fg-3 tabular-nums w-14.5 shrink-0">
                                    {entry.time}
                                </span>
                                <span
                                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${LOG_DOT_COLORS[entry.level]}`}
                                />
                                <span
                                    className={
                                        entry.level === LOG_LEVEL.warn
                                            ? "text-warning"
                                            : "text-fg-1"
                                    }
                                >
                                    {entry.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </section>
        </ScreenFrame>
    );
}
