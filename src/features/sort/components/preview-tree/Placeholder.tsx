import type { ReactNode } from "react";

export type PlaceholderTone = "neutral" | "error";

export type PlaceholderProps = {
    tone?: PlaceholderTone;
    children: ReactNode;
};

export function Placeholder({ tone = "neutral", children }: PlaceholderProps) {
    const color = tone === "error" ? "text-warning" : "text-fg-3";

    return <div className={`font-mono text-caption ${color}`}>{children}</div>;
}
