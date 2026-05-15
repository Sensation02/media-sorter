import { useEffect, useState } from "react";

import { previewPlan } from "../../../ipc";
import { toAppErrorView, type ToastErrorView } from "../../../utils";
import type {
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
          estimate: PlanEstimateDto;
      }
    | { status: typeof PLAN_PREVIEW_STATUS.error; error: ToastErrorView };

type Outcome = { plan: SortPlan; estimate: PlanEstimateDto } | { error: ToastErrorView };

type PreviewResult = {
    scanId: ScanId;
    rule: SortRuleId;
    localeTag: string;
    sortSettingsKey: string;
    outcome: Outcome;
};

export function usePlanPreview(
    scanId: ScanId | null,
    rule: SortRuleId,
    localeTag: string,
    sortSettings: SortSettingsDto,
): PlanPreviewState {
    const [result, setResult] = useState<PreviewResult | null>(null);
    const sortSettingsKey = sortSettingsCacheKey(sortSettings);

    useEffect(() => {
        if (scanId === null) {
            return;
        }

        let cancelled = false;

        previewPlan(scanId, rule, sortSettings)
            .then((response) => {
                if (!cancelled) {
                    setResult({
                        scanId,
                        rule,
                        localeTag,
                        sortSettingsKey,
                        outcome: {
                            plan: response.plan,
                            estimate: response.estimate,
                        },
                    });
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setResult({
                        scanId,
                        rule,
                        localeTag,
                        sortSettingsKey,
                        outcome: { error: toAppErrorView(error) },
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [scanId, rule, localeTag, sortSettings, sortSettingsKey]);

    return derivePreviewState(scanId, rule, localeTag, sortSettingsKey, result);
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
    sortSettingsKey: string,
    result: PreviewResult | null,
): PlanPreviewState {
    if (scanId === null) {
        return { status: PLAN_PREVIEW_STATUS.idle };
    }

    if (
        result?.scanId !== scanId ||
        result.rule !== rule ||
        result.localeTag !== localeTag ||
        result.sortSettingsKey !== sortSettingsKey
    ) {
        return { status: PLAN_PREVIEW_STATUS.loading };
    }

    if ("plan" in result.outcome) {
        return {
            status: PLAN_PREVIEW_STATUS.success,
            plan: result.outcome.plan,
            estimate: result.outcome.estimate,
        };
    }

    return { status: PLAN_PREVIEW_STATUS.error, error: result.outcome.error };
}
