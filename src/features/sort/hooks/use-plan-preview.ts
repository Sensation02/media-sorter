import { useEffect, useState } from "react";

import { previewPlan, samplePreview } from "../../../ipc";
import { toAppErrorView, type ToastErrorView } from "../../../utils";
import type {
    DateFormatId,
    PlanEstimateDto,
    ScanId,
    SortPlan,
    SortRuleId,
    SortSettingsDto,
} from "../../../types/ipc";

export const PLAN_PREVIEW_STATUS = {
    idle: "idle",
    loading: "loading",
    success: "success",
    error: "error",
} as const;

export type PlanPreviewState =
    | { status: typeof PLAN_PREVIEW_STATUS.idle }
    | { status: typeof PLAN_PREVIEW_STATUS.loading }
    | {
          status: typeof PLAN_PREVIEW_STATUS.success;
          plan: SortPlan;
          estimate: PlanEstimateDto | null;
          isSample: boolean;
      }
    | { status: typeof PLAN_PREVIEW_STATUS.error; error: ToastErrorView };

type Outcome = { plan: SortPlan; estimate: PlanEstimateDto | null } | { error: ToastErrorView };

type PreviewResult = {
    scanId: ScanId | null;
    rule: SortRuleId;
    localeTag: string;
    dateFormat: DateFormatId;
    sortSettingsKey: string;
    isSample: boolean;
    outcome: Outcome;
};

export function usePlanPreview(
    scanId: ScanId | null,
    rule: SortRuleId,
    localeTag: string,
    dateFormat: DateFormatId,
    sortSettings: SortSettingsDto,
): PlanPreviewState {
    const [result, setResult] = useState<PreviewResult | null>(null);
    const sortSettingsKey = sortSettingsCacheKey(sortSettings);
    const isSample = scanId === null;

    useEffect(() => {
        let cancelled = false;

        const request =
            scanId === null
                ? samplePreview(rule).then(toSampleOutcome)
                : previewPlan(scanId, rule, sortSettings).then(toRealOutcome);

        void request
            .catch((error: unknown): Outcome => ({ error: toAppErrorView(error) }))
            .then((outcome) => {
                if (!cancelled) {
                    setResult({
                        scanId,
                        rule,
                        localeTag,
                        dateFormat,
                        sortSettingsKey,
                        isSample,
                        outcome,
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [scanId, rule, localeTag, dateFormat, sortSettings, sortSettingsKey, isSample]);

    return derivePreviewState(
        scanId,
        rule,
        localeTag,
        dateFormat,
        sortSettingsKey,
        isSample,
        result,
    );
}

function toRealOutcome(response: { plan: SortPlan; estimate: PlanEstimateDto }): Outcome {
    return { plan: response.plan, estimate: response.estimate };
}

function toSampleOutcome(plan: SortPlan): Outcome {
    return { plan, estimate: null };
}

function sortSettingsCacheKey(settings: SortSettingsDto): string {
    return [
        settings.copy ? "1" : "0",
        settings.skipDuplicates ? "1" : "0",
        settings.watchSource ? "1" : "0",
        settings.writeReport ? "1" : "0",
    ].join(":");
}

function derivePreviewState(
    scanId: ScanId | null,
    rule: SortRuleId,
    localeTag: string,
    dateFormat: DateFormatId,
    sortSettingsKey: string,
    isSample: boolean,
    result: PreviewResult | null,
): PlanPreviewState {
    if (
        result?.scanId !== scanId ||
        result.rule !== rule ||
        result.localeTag !== localeTag ||
        result.dateFormat !== dateFormat ||
        result.sortSettingsKey !== sortSettingsKey ||
        result.isSample !== isSample
    ) {
        return { status: PLAN_PREVIEW_STATUS.loading };
    }

    if ("plan" in result.outcome) {
        return {
            status: PLAN_PREVIEW_STATUS.success,
            plan: result.outcome.plan,
            estimate: result.outcome.estimate,
            isSample: result.isSample,
        };
    }

    return { status: PLAN_PREVIEW_STATUS.error, error: result.outcome.error };
}
