export type ToastTone = "error" | "warning" | "info";

export type ToastProps = {
  title: string;
  detail?: string;
  tone?: ToastTone;
  onDismiss: () => void;
};

const TONES: Record<ToastTone, { accent: string; label: string }> = {
  error: { accent: "var(--color-destructive)", label: "Error" },
  warning: { accent: "var(--color-warning)", label: "Warning" },
  info: { accent: "var(--color-primary)", label: "Info" },
};

export function Toast({ title, detail, tone = "error", onDismiss }: ToastProps) {
  const { accent, label } = TONES[tone];

  return (
    <div
      role="alert"
      className="pointer-events-auto bg-[var(--color-surface-1)] border border-[var(--color-border-strong)] rounded-md shadow-lg px-4 py-3 flex items-start gap-3 min-w-[280px] max-w-[420px]"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      <div className="flex-1 min-w-0">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.6px] mb-1"
          style={{ color: accent }}
        >
          {label}
        </div>
        <div className="text-[13px] font-medium text-[var(--color-fg-1)] leading-tight">
          {title}
        </div>
        {detail !== undefined && detail.length > 0 && (
          <div className="text-[11.5px] text-[var(--color-fg-3)] font-mono mt-1 break-words">
            {detail}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)] transition-colors text-[14px] leading-none -mr-1 mt-0.5"
      >
        {"×"}
      </button>
    </div>
  );
}
