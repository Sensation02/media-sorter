import type { ReactNode } from "react";

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
    const classes = ["font-mono text-eyebrow uppercase tracking-eyebrow", TONES[tone], className]
        .filter(Boolean)
        .join(" ");

    return <div className={classes}>{children}</div>;
}
