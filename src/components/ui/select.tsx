import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

const selectTriggerVariants = cva(
    cn(
        "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface-1 text-left transition-colors",
        "hover:border-border-strong",
        "focus-visible:border-primary/40 focus-visible:outline-none",
        "data-[state=open]:border-primary/40 data-[state=open]:bg-surface-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
    ),
    {
        variants: {
            size: {
                sm: "h-9 px-3 py-1.5 text-body-sm",
                md: "h-(--select-trigger-height) px-4 py-3 text-body",
            },
        },
        defaultVariants: {
            size: "md",
        },
    },
);

export type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger> &
    VariantProps<typeof selectTriggerVariants>;

export function SelectTrigger({ className, children, size, ...props }: SelectTriggerProps) {
    return (
        <SelectPrimitive.Trigger
            data-slot="select-trigger"
            className={cn(selectTriggerVariants({ size }), className)}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDown className="h-4 w-4 text-fg-3" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

export function SelectContent({
    className,
    children,
    position = "popper",
    ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                data-slot="select-content"
                position={position}
                sideOffset={4}
                className={cn(
                    "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-surface-2 shadow-lg",
                    className,
                )}
                {...props}
            >
                <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

export type SelectItemProps = ComponentProps<typeof SelectPrimitive.Item> & {
    description?: string;
};

export function SelectItem({ className, children, description, ...props }: SelectItemProps) {
    return (
        <SelectPrimitive.Item
            data-slot="select-item"
            className={cn(
                "relative flex w-full cursor-default select-none flex-col items-start rounded-sm py-2 pl-3 pr-9 outline-none transition-colors",
                "data-[highlighted]:bg-hover-soft data-[highlighted]:text-fg-1",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className,
            )}
            {...props}
        >
            <SelectPrimitive.ItemText asChild>
                <span className="text-body-sm font-medium">{children}</span>
            </SelectPrimitive.ItemText>
            {description && (
                <span className="mt-1 font-mono text-eyebrow text-fg-3">{description}</span>
            )}
            <SelectPrimitive.ItemIndicator className="absolute right-3 top-2.5">
                <Check className="h-3.5 w-3.5 text-primary" />
            </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
    );
}
