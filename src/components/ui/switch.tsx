import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            className={cn(
                "peer relative inline-flex h-(--switch-height) w-(--switch-width) shrink-0 cursor-pointer items-center rounded-full transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "data-[state=checked]:bg-primary",
                "data-[state=unchecked]:bg-surface-2 data-[state=unchecked]:border data-[state=unchecked]:border-border-strong",
                className,
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className={cn(
                    "pointer-events-none block h-(--switch-thumb-size) w-(--switch-thumb-size) rounded-full transition-transform",
                    "data-[state=checked]:translate-x-(--switch-thumb-checked-offset) data-[state=checked]:bg-primary-foreground",
                    "data-[state=unchecked]:translate-x-(--switch-thumb-offset) data-[state=unchecked]:bg-fg-2",
                )}
            />
        </SwitchPrimitive.Root>
    );
}
