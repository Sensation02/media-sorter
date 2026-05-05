import type { HTMLAttributes, ReactNode } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-lg ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
