import { Loader2 } from "lucide-react";

import { Tree } from "../tree";
import { planToTree } from "../../plan-tree";
import type { PlanPreviewState } from "../../use-plan-preview";

const IDLE_LABEL = "Pick a source folder to see the layout";
const LOADING_LABEL = "Building preview…";
const EMPTY_LABEL = "No media files matched the chosen rule";

export type PreviewTreeProps = {
    state: PlanPreviewState;
};

export function PreviewTree({ state }: PreviewTreeProps) {
    if (state.status === "idle") {
        return <Placeholder>{IDLE_LABEL}</Placeholder>;
    }

    if (state.status === "loading") {
        return (
            <Placeholder>
                <span className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {LOADING_LABEL}
                </span>
            </Placeholder>
        );
    }

    if (state.status === "error") {
        return <Placeholder tone="error">{state.error.title}</Placeholder>;
    }

    const nodes = planToTree(state.plan);

    if (nodes.length === 0) {
        return <Placeholder>{EMPTY_LABEL}</Placeholder>;
    }

    return <Tree nodes={nodes} />;
}

type PlaceholderProps = {
    tone?: "neutral" | "error";
    children: React.ReactNode;
};

function Placeholder({ tone = "neutral", children }: PlaceholderProps) {
    const color = tone === "error" ? "text-warning" : "text-fg-3";

    return <div className={`font-mono text-[12px] ${color}`}>{children}</div>;
}
