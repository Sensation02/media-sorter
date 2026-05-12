import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { ICON } from "../../constants/icons";
import { Stat } from "../../components/stat";
import { StatusDot } from "../../components/status-dot";
import type { SortDone } from "../../../../types/sort";

const Undo = ICON.undo;

export type DoneScreenProps = {
    done: SortDone;
    onUndo: () => void;
    onNewSort: () => void;
    onReveal: () => void;
};

export function DoneScreen({ done, onUndo, onNewSort, onReveal }: DoneScreenProps) {
    const hasSkipped = done.skipped > 0;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-7 py-9 space-y-7">
                <section>
                    <div className="flex items-center gap-2.5 mb-3">
                        <StatusDot status="idle" />
                        <span className="font-mono text-eyebrow uppercase tracking-eyebrow text-fg-2">
                            Completed in {done.duration}
                        </span>
                    </div>
                    <h1 className="text-display font-medium tracking-[-0.6px] leading-tight">
                        {done.moved.toLocaleString()} files in their place.
                    </h1>
                    <p className="text-body text-fg-2 mt-2 font-mono">{done.destination}</p>
                </section>

                <section className="flex gap-3">
                    <Stat label="Moved" value={done.moved.toLocaleString()} />
                    <Stat
                        label="Skipped"
                        value={done.skipped}
                        tone={hasSkipped ? "warning" : "default"}
                    />
                    <Stat label="Folders created" value={done.folders} />
                </section>

                {hasSkipped && (
                    <Card className="px-4 py-3 border-warning/20 bg-warning/5">
                        <div className="flex items-baseline gap-3">
                            <span className="font-mono text-eyebrow uppercase tracking-eyebrow text-warning">
                                {done.skipped} skipped
                            </span>
                            <span className="text-body-sm text-fg-2">
                                Files without EXIF date were left in place.
                            </span>
                            <Button variant="ghost" size="sm" className="ml-auto">
                                Review
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            <footer className="h-12 border-t border-border px-5 flex items-center gap-2 bg-surface-1">
                <Button variant="ghost" size="md" onClick={onUndo}>
                    <Undo className="h-3.5 w-3.5" aria-hidden /> Undo last sort
                </Button>
                <div className="ml-auto flex gap-2">
                    <Button variant="secondary" size="md" onClick={onReveal}>
                        Reveal in Finder
                    </Button>
                    <Button variant="primary" size="md" onClick={onNewSort}>
                        New sort
                    </Button>
                </div>
            </footer>
        </div>
    );
}
