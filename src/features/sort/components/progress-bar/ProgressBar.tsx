export type ProgressBarProps = {
  value: number;
  max?: number;
};

const FULL_PERCENT = 100;
const EMPTY_PERCENT = 0;

export function ProgressBar({ value, max = FULL_PERCENT }: ProgressBarProps) {
  const safeMax = max <= 0 ? FULL_PERCENT : max;
  const pct = Math.min(FULL_PERCENT, Math.max(EMPTY_PERCENT, (value / safeMax) * FULL_PERCENT));

  return (
    <div className="w-full h-[3px] bg-[var(--color-surface-2)] rounded-sm overflow-hidden">
      <div
        className="h-full bg-[var(--color-primary)] transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
