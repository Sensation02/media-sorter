import { Button } from "../../components/button";
import { Card } from "../../components/card";
import { ProgressBar } from "../../components/progress-bar";
import { Stat } from "../../components/stat";
import type { SortLogLevel, SortProgress } from "../../../../types/sort";

const PERCENT_BASE = 100;

export type ProgressScreenProps = {
  progress: SortProgress;
  onPause: () => void;
  onCancel: () => void;
};

const LOG_DOT_COLORS: Record<SortLogLevel, string> = {
  ok: "bg-[var(--color-success)]",
  warn: "bg-[var(--color-warning)]",
  error: "bg-[var(--color-destructive)]",
};

export function ProgressScreen({ progress, onPause, onCancel }: ProgressScreenProps) {
  const pct =
    progress.total > 0 ? Math.round((progress.processed / progress.total) * PERCENT_BASE) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-7 py-7 space-y-6">
        <section>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="font-mono text-[28px] font-medium tracking-[-1px]">
              {progress.processed.toLocaleString()}
            </span>
            <span className="font-mono text-[14px] text-[var(--color-fg-3)]">
              / {progress.total.toLocaleString()}
            </span>
            <span className="ml-auto font-mono text-[11.5px] text-[var(--color-fg-2)]">
              {pct}% {"\u00b7"} {progress.remaining}
            </span>
          </div>
          <ProgressBar value={progress.processed} max={progress.total} />
          <div className="mt-3 flex items-center gap-2 font-mono text-[11.5px] text-[var(--color-fg-2)]">
            <span className="text-[var(--color-primary)]">{"\u25b8"}</span>
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
          <div className="font-mono text-[10.5px] uppercase tracking-[1px] text-[var(--color-fg-3)] mb-2.5">
            Activity log
          </div>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-[var(--color-divider-soft)]">
              {progress.log.map((entry, index) => (
                <li
                  key={`${entry.time}-${index}`}
                  className="px-4 py-2 flex items-baseline gap-3 font-mono text-[12px]"
                >
                  <span className="text-[var(--color-fg-3)] tabular-nums w-[58px] flex-shrink-0">
                    {entry.time}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${LOG_DOT_COLORS[entry.level]}`}
                  />
                  <span
                    className={
                      entry.level === "warn"
                        ? "text-[var(--color-warning)]"
                        : "text-[var(--color-fg-1)]"
                    }
                  >
                    {entry.text}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <footer className="h-12 border-t border-[var(--color-border)] px-5 flex items-center gap-2 bg-[var(--color-surface-1)]">
        <Button variant="cautious" size="md" onClick={onCancel}>
          Cancel sort
        </Button>
        <div className="ml-auto" />
        <Button variant="secondary" size="md" onClick={onPause}>
          Pause
        </Button>
      </footer>
    </div>
  );
}
