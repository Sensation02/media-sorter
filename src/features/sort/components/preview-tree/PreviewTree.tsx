import { useTranslation } from "react-i18next";

import { ICON } from "../../constants/icons";
import { Tree } from "../tree";
import { planToTree } from "../../mappers/plan-tree";
import { PLAN_PREVIEW_STATUS, type PlanPreviewState } from "../../hooks/use-plan-preview";
import { Placeholder } from "./Placeholder";

const Loader = ICON.loader;

export type PreviewTreeProps = {
    state: PlanPreviewState;
};

export function PreviewTree({ state }: PreviewTreeProps) {
    const { t } = useTranslation("setup");

    if (state.status === PLAN_PREVIEW_STATUS.idle) {
        return <Placeholder>{t("previewIdle")}</Placeholder>;
    }

    if (state.status === PLAN_PREVIEW_STATUS.loading) {
        return (
            <Placeholder>
                <span className="flex items-center gap-2">
                    <Loader className="w-3 h-3 animate-spin" aria-hidden />
                    {t("previewLoading")}
                </span>
            </Placeholder>
        );
    }

    if (state.status === PLAN_PREVIEW_STATUS.error) {
        return <Placeholder tone="error">{state.error.title}</Placeholder>;
    }

    const nodes = planToTree(state.plan);

    if (nodes.length === 0) {
        return <Placeholder>{t("previewEmpty")}</Placeholder>;
    }

    return <Tree nodes={nodes} />;
}
