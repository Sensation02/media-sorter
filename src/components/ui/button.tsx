import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-1.5 font-medium tracking-tight whitespace-nowrap transition-colors disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    {
        variants: {
            variant: {
                primary:
                    "bg-primary text-primary-foreground font-semibold hover:opacity-85 disabled:bg-surface-2 disabled:text-fg-3",
                secondary:
                    "border border-border-strong text-fg-1 hover:bg-surface-2 disabled:opacity-50",
                ghost: "text-fg-2 hover:text-fg-1 hover:bg-hover-soft disabled:opacity-50",
                cautious:
                    "border border-warning/30 text-warning hover:bg-warning/10 disabled:opacity-50",
            },
            size: {
                sm: "h-7 px-2.5 text-meta rounded-[5px]",
                md: "h-8 px-3.5 text-body-sm rounded-md",
                lg: "h-10 px-5 text-body rounded-md",
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
