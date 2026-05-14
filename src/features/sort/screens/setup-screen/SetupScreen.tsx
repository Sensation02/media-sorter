import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { ScanId, ScanSummary, SortPlan } from "../../../../types/ipc";
import type { SortRule, SortRuleId } from "../../../../types/sort";
import { formatBytes, formatNumber } from "../../../../utils";
import { Eyebrow } from "../../components/eyebrow";
import { PreviewTree } from "../../components/preview-tree";
import { RuleSelector } from "../../components/rule-selector";
import { ScanBreakdown } from "../../components/scan-breakdown";
import { ScreenFrame } from "../../components/screen-frame";
import { ICON } from "../../constants/icons";
import { usePlanPreview } from "../../hooks/use-plan-preview";
import { resolveDefaultRule } from "../../mappers/resolve-default-rule";

const Loader = ICON.loader;
const Folder = ICON.folder;
const ArrowRight = ICON.arrowRight;

export type SetupScreenSource = {
    summary: ScanSummary | null;
    scanId: ScanId | null;
    scanning: boolean;
};

export type SetupScreenRule = {
    rules: SortRule[];
    defaultId: SortRuleId | null;
};

export type SetupScreenActions = {
    onPickSource: () => void;
    onRun: (plan: SortPlan) => void;
};

export type SetupScreenProps = {
    source: SetupScreenSource;
    rule: SetupScreenRule;
    actions: SetupScreenActions;
};

export function SetupScreen({ source, rule, actions }: SetupScreenProps) {
    const { t, i18n } = useTranslation("setup");
    const { t: tCommon } = useTranslation("common");
    const firstRule = rule.rules[0];

    if (!firstRule) {
        throw new Error(t("requiresAtLeastOneRule"));
    }

    const resolvedDefault = resolveDefaultRule(rule.defaultId, rule.rules, firstRule.id);
    const [prevDefault, setPrevDefault] = useState(resolvedDefault);
    const [ruleId, setRuleId] = useState<SortRuleId>(resolvedDefault);

    if (resolvedDefault !== prevDefault) {
        setPrevDefault(resolvedDefault);
        setRuleId(resolvedDefault);
    }
    const previewState = usePlanPreview(source.scanId, ruleId, i18n.language);
    const canRun = source.summary !== null && !source.scanning && previewState.status === "success";
    const plan = previewState.status === "success" ? previewState.plan : null;

    const handleRun = () => {
        if (plan === null) {
            return;
        }

        actions.onRun(plan);
    };

    return (
        <ScreenFrame
            footerPadding="tight"
            footer={
                <Button
                    variant="primary"
                    size="md"
                    radius="lg"
                    onClick={handleRun}
                    disabled={!canRun}
                >
                    {t("runSort")} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Button>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                <section>
                    <Eyebrow className="mb-2.5">{t("sourceFolder")}</Eyebrow>
                    <Card className="px-4 py-3 flex items-center gap-3">
                        <Folder className="h-4 w-4 text-fg-3" aria-hidden />
                        <span
                            className={`font-mono text-body flex-1 truncate ${source.summary === null ? "text-fg-3" : ""}`}
                        >
                            {source.summary?.root ?? tCommon("noFolderSelected")}
                        </span>
                        {source.scanning ? (
                            <span className="flex items-center gap-2 font-mono text-meta-sm text-fg-3">
                                <Loader className="w-3 h-3 animate-spin" aria-hidden />
                                {t("scanning")}
                            </span>
                        ) : (
                            source.summary !== null && (
                                <span className="font-mono text-meta-sm text-fg-3">
                                    {t("filesSummary", {
                                        count: source.summary.fileCount,
                                        value: formatNumber(source.summary.fileCount),
                                    })}{" "}
                                    {"·"} {formatBytes(source.summary.sizeBytes)}
                                </span>
                            )
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={actions.onPickSource}
                            disabled={source.scanning}
                        >
                            {t("browse")}
                        </Button>
                    </Card>
                    {source.summary !== null && !source.scanning && (
                        <ScanBreakdown summary={source.summary} />
                    )}
                </section>

                <section>
                    <Eyebrow className="mb-2.5">{t("rule")}</Eyebrow>
                    <RuleSelector rules={rule.rules} value={ruleId} onChange={setRuleId} />
                </section>
            </div>

            <section>
                <Eyebrow className="mb-2.5">{t("outputPreview")}</Eyebrow>
                <Card className="px-4 py-4">
                    <PreviewTree state={previewState} />
                </Card>
            </section>
        </ScreenFrame>
    );
}
