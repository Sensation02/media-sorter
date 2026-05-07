import type { ScanSummary } from "../../../../types/ipc";

export type ScanBreakdownProps = {
  summary: ScanSummary;
};

export function ScanBreakdown({ summary }: ScanBreakdownProps) {
  const { photos, raw, videos } = summary.byKind;

  return (
    <div className="mt-2 px-4 flex items-center gap-4 font-mono text-[11px] text-[var(--color-fg-3)]">
      <span>
        Photos {"·"} <span className="text-[var(--color-fg-2)]">{photos.toLocaleString()}</span>
      </span>
      <span>
        RAW {"·"} <span className="text-[var(--color-fg-2)]">{raw.toLocaleString()}</span>
      </span>
      <span>
        Videos {"·"} <span className="text-[var(--color-fg-2)]">{videos.toLocaleString()}</span>
      </span>
    </div>
  );
}
