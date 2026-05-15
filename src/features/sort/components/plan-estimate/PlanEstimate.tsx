import { useTranslation } from "react-i18next";

import type { EstimateConfidence, PlanEstimateDto } from "../../../../types/ipc";
import { formatPlanEstimate } from "../../mappers/estimate-format";

export type PlanEstimateProps = {
    estimate: PlanEstimateDto;
};

const DOT_COLORS: Record<EstimateConfidence, string> = {
    high: "var(--color-success)",
    medium: "var(--color-warning)",
    low: "var(--color-fg-3)",
};

const CONFIDENCE_LABEL_KEYS: Record<EstimateConfidence, string> = {
    high: "setup:confidenceHigh",
    medium: "setup:confidenceMedium",
    low: "setup:confidenceLow",
};

export function PlanEstimate({ estimate }: PlanEstimateProps) {
    const { t } = useTranslation();
    const view = formatPlanEstimate(estimate);

    if (view.hidden) {
        return null;
    }

    const dotColor = DOT_COLORS[view.confidence];
    const confidenceLabel = t(CONFIDENCE_LABEL_KEYS[view.confidence]);
    const ariaLabel = `${t("setup:estimateLabel")}: ${view.text} (${confidenceLabel})`;

    return (
        <span
            className="font-mono text-meta-sm text-fg-2 flex items-center gap-2"
            title={confidenceLabel}
            aria-label={ariaLabel}
        >
            <span
                aria-hidden
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}` }}
            />
            {view.text}
        </span>
    );
}
