import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

export function Toaster({ position = "bottom-right", ...props }: ToasterProps) {
    return (
        <SonnerToaster
            data-slot="sonner"
            position={position}
            toastOptions={{
                classNames: {
                    toast: "bg-surface-1 border border-[var(--color-border-strong)] rounded-md shadow-lg text-fg-1",
                    title: "text-[13px] font-medium",
                    description: "text-[11.5px] font-mono text-fg-3",
                    error: "border-l-[3px] border-l-[var(--color-destructive)]",
                    warning: "border-l-[3px] border-l-[var(--color-warning)]",
                    info: "border-l-[3px] border-l-[var(--color-primary)]",
                    success: "border-l-[3px] border-l-[var(--color-success)]",
                },
            }}
            {...props}
        />
    );
}
