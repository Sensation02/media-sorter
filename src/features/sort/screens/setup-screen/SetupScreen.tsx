import { useState } from "react";
import { Button } from "../../components/button";
import { Card } from "../../components/card";
import { RuleSelector } from "../../components/rule-selector";
import { ScanBreakdown } from "../../components/scan-breakdown";
import { Spinner } from "../../components/spinner";
import { Tree } from "../../components/tree";
import { formatBytes } from "../../../../utils";
import type { ScanSummary } from "../../../../types/ipc";
import type { SortRule, SortRuleId } from "../../../../types/sort";

const EMPTY_PATH_LABEL = "No folder selected";

export type SetupScreenProps = {
  rules: SortRule[];
  source: ScanSummary | null;
  scanning: boolean;
  onPickSource: () => void;
  onRun: () => void;
};

export function SetupScreen({ rules, source, scanning, onPickSource, onRun }: SetupScreenProps) {
  const firstRule = rules[0];

  if (!firstRule) {
    throw new Error("SetupScreen requires at least one rule");
  }

  const [ruleId, setRuleId] = useState<SortRuleId>(firstRule.id);
  const selected = rules.find((rule) => rule.id === ruleId) ?? firstRule;
  const canRun = source !== null && !scanning;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-7 py-7 space-y-7">
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
                <Spinner size="sm" />
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

        <section>
          <div className="font-mono text-[10.5px] uppercase tracking-[1px] text-[var(--color-fg-3)] mb-2.5">
            Output preview
          </div>
          <Card className="px-4 py-4">
            <Tree nodes={selected.preview} />
          </Card>
        </section>
      </div>

      <footer className="h-12 border-t border-[var(--color-border)] px-5 flex items-center gap-2 bg-[var(--color-surface-1)]">
        <Button variant="ghost" size="md">
          Save preset
        </Button>
        <div className="ml-auto" />
        <Button variant="primary" size="md" onClick={onRun} disabled={!canRun}>
          Run sort {"→"}
        </Button>
      </footer>
    </div>
  );
}
