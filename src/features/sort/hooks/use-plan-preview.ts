import { useEffect, useState } from "react";

import { previewPlan } from "../../../ipc";
import { toAppErrorView, type ToastErrorView } from "../../../utils";
import type { ScanId, SortPlan, SortRuleId } from "../../../types/ipc";

export const PLAN_PREVIEW_STATUS = {
    idle: "idle",
    loading: "loading",
    success: "success",
    error: "error",
} as const;

export type PlanPreviewState =
    | { status: typeof PLAN_PREVIEW_STATUS.idle }
    | { status: typeof PLAN_PREVIEW_STATUS.loading }
    | { status: typeof PLAN_PREVIEW_STATUS.success; plan: SortPlan }
    | { status: typeof PLAN_PREVIEW_STATUS.error; error: ToastErrorView };

type Outcome = { plan: SortPlan } | { error: ToastErrorView };

type PreviewResult = {
    scanId: ScanId;
    rule: SortRuleId;
    outcome: Outcome;
};

export function usePlanPreview(scanId: ScanId | null, rule: SortRuleId): PlanPreviewState {
    const [result, setResult] = useState<PreviewResult | null>(null);

    useEffect(() => {
        if (scanId === null) {
            return;
        }

        let cancelled = false;

        previewPlan(scanId, rule)
            .then((plan) => {
                if (!cancelled) {
                    setResult({ scanId, rule, outcome: { plan } });
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setResult({ scanId, rule, outcome: { error: toAppErrorView(error) } });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [scanId, rule]);

    return derivePreviewState(scanId, rule, result);
}

function derivePreviewState(
    scanId: ScanId | null,
    rule: SortRuleId,
    result: PreviewResult | null,
): PlanPreviewState {
    if (scanId === null) {
        return { status: PLAN_PREVIEW_STATUS.idle };
    }

    if (result?.scanId !== scanId || result.rule !== rule) {
        return { status: PLAN_PREVIEW_STATUS.loading };
    }

    if ("plan" in result.outcome) {
        return { status: PLAN_PREVIEW_STATUS.success, plan: result.outcome.plan };
    }

    return { status: PLAN_PREVIEW_STATUS.error, error: result.outcome.error };
}
