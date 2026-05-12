import { ICON } from "../../constants/icons";
import { Tree } from "../tree";
import { planToTree } from "../../plan-tree";
import type { PlanPreviewState } from "../../use-plan-preview";
import { Placeholder } from "./Placeholder";

const Loader = ICON.loader;

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
                    <Loader className="w-3 h-3 animate-spin" aria-hidden />
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
