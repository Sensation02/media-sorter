import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type InputProps = ComponentProps<"input">;

export function Input({ className, type = "text", ...rest }: InputProps) {
    return (
        <input
            data-slot="input"
            type={type}
            className={cn(
                "h-9 w-full rounded-md border border-divider-soft bg-surface-2 px-2.5 text-body-sm",
                "outline-none transition-colors",
                "focus-visible:border-fg-2 focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "placeholder:text-fg-3",
                className,
            )}
            {...rest}
        />
    );
}
