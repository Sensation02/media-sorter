import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { ICON } from "../../constants/icons";
import { Eyebrow } from "../../components/eyebrow";
import { ScreenFrame } from "../../components/screen-frame";
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
        <ScreenFrame
            bodyClassName="py-9"
            footer={
                <>
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
                </>
            }
        >
            <section>
                <div className="flex items-center gap-2.5 mb-3">
                    <StatusDot status="idle" />
                    <Eyebrow tone="muted">Completed in {done.duration}</Eyebrow>
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
                        <Eyebrow tone="warning">{done.skipped} skipped</Eyebrow>
                        <span className="text-body-sm text-fg-2">
                            Files without EXIF date were left in place.
                        </span>
                        <Button variant="ghost" size="sm" className="ml-auto">
                            Review
                        </Button>
                    </div>
                </Card>
            )}
        </ScreenFrame>
    );
}
