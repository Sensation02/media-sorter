import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-13.5 w-full items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] px-4 py-3 text-left text-[13px] transition-colors",
        "hover:border-[var(--color-border-strong)]",
        "focus-visible:border-[var(--color-primary)]/40 focus-visible:outline-none",
        "data-[state=open]:border-[var(--color-primary)]/40 data-[state=open]:bg-[var(--color-surface-2)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 text-[var(--color-fg-3)]" />
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
          "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-lg",
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
        "data-[highlighted]:bg-[var(--color-hover-soft)] data-[highlighted]:text-[var(--color-fg-1)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText asChild>
        <span className="text-[12.5px] font-medium">{children}</span>
      </SelectPrimitive.ItemText>
      {description && (
        <span className="mt-1 font-mono text-[10.5px] text-[var(--color-fg-3)]">{description}</span>
      )}
      <SelectPrimitive.ItemIndicator className="absolute right-3 top-2.5">
        <Check className="h-3.5 w-3.5 text-[var(--color-primary)]" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
