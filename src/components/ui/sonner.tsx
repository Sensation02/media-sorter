import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

export function Toaster({ position = "bottom-right", ...props }: ToasterProps) {
    return (
        <SonnerToaster
            data-slot="sonner"
            position={position}
            toastOptions={{
                classNames: {
                    toast: "bg-surface-1 border border-border-strong rounded-md shadow-lg text-fg-1",
                    title: "text-body font-medium",
                    description: "text-meta font-mono text-fg-3",
                    error: "border-l-(length:--toast-accent-width) border-l-destructive",
                    warning: "border-l-(length:--toast-accent-width) border-l-warning",
                    info: "border-l-(length:--toast-accent-width) border-l-primary",
                    success: "border-l-(length:--toast-accent-width) border-l-success",
                },
            }}
            {...props}
        />
    );
}
