import type { ButtonHTMLAttributes, ReactNode } from "react";

const VARIANTS = {
  primary: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-85",
  secondary:
    "border border-[var(--color-border-strong)] text-[var(--color-fg-1)] hover:bg-[var(--color-surface-2)]",
  ghost:
    "text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-hover-soft)]",
  cautious:
    "border border-[var(--color-warning)]/30 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10",
} as const;

const SIZES = {
  sm: "h-7 px-2.5 text-[11.5px] rounded-[5px]",
  md: "h-8 px-3.5 text-[12.5px] rounded-md",
  lg: "h-10 px-5 text-[13px] rounded-md",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const BASE =
  "inline-flex items-center gap-1.5 font-medium tracking-tight whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]";

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
