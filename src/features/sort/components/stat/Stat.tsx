export type StatTone = "default" | "primary" | "warning" | "success";

export type StatProps = {
  label: string;
  value: string | number;
  tone?: StatTone;
};

const TONES: Record<StatTone, string> = {
  default: "text-[var(--color-fg-1)]",
  primary: "text-[var(--color-primary)]",
  warning: "text-[var(--color-warning)]",
  success: "text-[var(--color-success)]",
};

export function Stat({ label, value, tone = "default" }: StatProps) {
  return (
    <div className="flex-1 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-md px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.6px] text-[var(--color-fg-3)]">
        {label}
      </div>
      <div className={`font-mono text-[20px] font-medium leading-tight mt-0.5 ${TONES[tone]}`}>
        {value}
      </div>
    </div>
  );
}
