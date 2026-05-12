import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type EyebrowTone = "default" | "warning" | "destructive" | "muted";

export type EyebrowProps = {
    tone?: EyebrowTone;
    className?: string;
    children: ReactNode;
};

const TONES: Record<EyebrowTone, string> = {
    default: "text-fg-3",
    warning: "text-warning",
    destructive: "text-destructive",
    muted: "text-fg-2",
};

export function Eyebrow({ tone = "default", className, children }: EyebrowProps) {
    return (
        <div
            className={cn(
                "font-mono text-eyebrow uppercase tracking-eyebrow",
                TONES[tone],
                className,
            )}
        >
            {children}
        </div>
    );
}
