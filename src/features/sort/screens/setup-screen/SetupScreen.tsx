import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { PreviewTree } from "../../components/preview-tree";
import { RuleSelector } from "../../components/rule-selector";
import { ScanBreakdown } from "../../components/scan-breakdown";
import { usePlanPreview } from "../../use-plan-preview";
import { formatBytes } from "../../../../utils";
import type { ScanId, ScanSummary, SortPlan } from "../../../../types/ipc";
import type { SortRule, SortRuleId } from "../../../../types/sort";

const EMPTY_PATH_LABEL = "No folder selected";

export type SetupScreenProps = {
  rules: SortRule[];
  source: ScanSummary | null;
  scanId: ScanId | null;
  scanning: boolean;
  defaultRuleId?: SortRuleId | null;
  onPickSource: () => void;
  onRun: (plan: SortPlan) => void;
};

export function SetupScreen({
  rules,
  source,
  scanId,
  scanning,
  defaultRuleId,
  onPickSource,
  onRun,
}: SetupScreenProps) {
  const firstRule = rules[0];

  if (!firstRule) {
    throw new Error("SetupScreen requires at least one rule");
  }

  const resolvedDefault = resolveDefaultRule(defaultRuleId, rules, firstRule.id);
  const [prevDefault, setPrevDefault] = useState(resolvedDefault);
  const [ruleId, setRuleId] = useState<SortRuleId>(resolvedDefault);

  if (resolvedDefault !== prevDefault) {
    setPrevDefault(resolvedDefault);
    setRuleId(resolvedDefault);
  }
  const previewState = usePlanPreview(scanId, ruleId);
  const canRun = source !== null && !scanning && previewState.status === "success";
  const plan = previewState.status === "success" ? previewState.plan : null;

  const handleRun = () => {
    if (plan === null) {
      return;
    }

    onRun(plan);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-7 py-7 space-y-7">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          <section>
            <div className="font-mono text-[10.5px] uppercase tracking-[1px] text-[var(--color-fg-3)] mb-2.5">
              Source folder
            </div>
            <Card className="px-4 py-3 flex items-center gap-3">
              <span className="text-[var(--color-fg-3)] text-base">{"▣"}</span>
              <span
                className={`font-mono text-[13px] flex-1 truncate ${source === null ? "text-[var(--color-fg-3)]" : ""}`}
              >
                {source?.root ?? EMPTY_PATH_LABEL}
              </span>
              {scanning ? (
                <span className="flex items-center gap-2 font-mono text-[11px] text-[var(--color-fg-3)]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Scanning{"…"}
                </span>
              ) : (
                source !== null && (
                  <span className="font-mono text-[11px] text-[var(--color-fg-3)]">
                    {source.fileCount.toLocaleString()} files {"·"} {formatBytes(source.sizeBytes)}
                  </span>
                )
              )}
              <Button variant="ghost" size="sm" onClick={onPickSource} disabled={scanning}>
                Browse{"…"}
              </Button>
            </Card>
            {source !== null && !scanning && <ScanBreakdown summary={source} />}
          </section>

          <section>
            <div className="font-mono text-[10.5px] uppercase tracking-[1px] text-[var(--color-fg-3)] mb-2.5">
              Sorting rule
            </div>
            <RuleSelector rules={rules} value={ruleId} onChange={setRuleId} />
          </section>
        </div>

        <section>
          <div className="font-mono text-[10.5px] uppercase tracking-[1px] text-[var(--color-fg-3)] mb-2.5">
            Output preview
          </div>
          <Card className="px-4 py-4">
            <PreviewTree state={previewState} />
          </Card>
        </section>
      </div>

      <footer className="h-12 border-t border-[var(--color-border)] px-5 flex items-center justify-end bg-[var(--color-surface-1)]">
        <Button variant="primary" size="md" onClick={handleRun} disabled={!canRun}>
          Run sort {"→"}
        </Button>
      </footer>
    </div>
  );
}

function resolveDefaultRule(
  preferred: SortRuleId | null | undefined,
  rules: SortRule[],
  fallback: SortRuleId,
): SortRuleId {
  if (preferred === null || preferred === undefined) {
    return fallback;
  }

  if (!rules.some((rule) => rule.id === preferred)) {
    return fallback;
  }

  return preferred;
}
