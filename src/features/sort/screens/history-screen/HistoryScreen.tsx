import { Button } from "../../components/button";
import { Card } from "../../components/card";
import type { SortHistoryItem } from "../../../../types/sort";

export type HistoryScreenProps = {
  history: SortHistoryItem[];
  onRevert: (id: number) => void;
};

export function HistoryScreen({ history, onRevert }: HistoryScreenProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-7 py-7">
        <Card className="overflow-hidden">
          <ul className="divide-y divide-white/[.04]">
            {history.map((job) => (
              <li key={job.id} className="px-4 py-3 flex items-center gap-4 hover:bg-white/[.02]">
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{job.name}</div>
                  <div className="font-mono text-[11px] text-[var(--color-fg-3)] mt-0.5">
                    {job.date} {"\u00b7"} {job.duration}
                  </div>
                </div>
                <div className="font-mono text-[11.5px] text-[var(--color-fg-2)] tabular-nums">
                  {job.moved.toLocaleString()} moved
                  {job.skipped > 0 && (
                    <span className="text-[var(--color-warning)]">
                      {" \u00b7 "}
                      {job.skipped} skipped
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onRevert(job.id);
                  }}
                >
                  {"\u21b6"} Revert
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
