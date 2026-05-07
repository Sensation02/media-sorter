import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium tracking-tight whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-85",
        secondary:
          "border border-[var(--color-border-strong)] text-[var(--color-fg-1)] hover:bg-[var(--color-surface-2)]",
        ghost:
          "text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-hover-soft)]",
        cautious:
          "border border-[var(--color-warning)]/30 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10",
      },
      size: {
        sm: "h-7 px-2.5 text-[11.5px] rounded-[5px]",
        md: "h-8 px-3.5 text-[12.5px] rounded-md",
        lg: "h-10 px-5 text-[13px] rounded-md",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  ...rest
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type })}
      {...rest}
    />
  );
}
