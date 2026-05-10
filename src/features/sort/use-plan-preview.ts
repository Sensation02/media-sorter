import { useEffect, useState } from "react";

import { previewPlan } from "../../ipc";
import { toAppErrorView, type ToastErrorView } from "../../utils";
import type { ScanId, SortPlan, SortRuleId } from "../../types/ipc";

export type PlanPreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; plan: SortPlan }
  | { status: "error"; error: ToastErrorView };

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
    return { status: "idle" };
  }

  if (result?.scanId !== scanId || result.rule !== rule) {
    return { status: "loading" };
  }

  if ("plan" in result.outcome) {
    return { status: "success", plan: result.outcome.plan };
  }

  return { status: "error", error: result.outcome.error };
}
