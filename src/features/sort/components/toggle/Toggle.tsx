export type ToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
};

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        onChange(!checked);
      }}
      className={`relative w-[30px] h-[17px] rounded-full transition-colors ${
        checked
          ? "bg-[var(--color-primary)]"
          : "bg-[var(--color-surface-2)] border border-[var(--color-border-strong)]"
      }`}
    >
      <span
        className={`absolute top-[1px] w-[13px] h-[13px] rounded-full transition-all ${
          checked
            ? "left-[14px] bg-[var(--color-primary-foreground)]"
            : "left-[1px] bg-[var(--color-fg-2)]"
        }`}
      />
    </button>
  );
}
