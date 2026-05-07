const SIZES = {
  sm: "w-3 h-3 border-[1.5px]",
  md: "w-4 h-4 border-2",
  lg: "w-6 h-6 border-2",
} as const;

export type SpinnerSize = keyof typeof SIZES;

export type SpinnerProps = {
  size?: SpinnerSize;
  label?: string;
};

export function Spinner({ size = "md", label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block ${SIZES[size]} rounded-full border-[var(--color-border-strong)] border-t-[var(--color-primary)] animate-spin`}
    />
  );
}
