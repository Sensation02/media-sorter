import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import type { ScanId, ScanSummary, SortPlan } from "../../../../types/ipc";
import { isDateFormatId } from "../../../../types/sort";
import type { DateFormatId, SortRule, SortRuleId } from "../../../../types/sort";
import { formatBytes, formatNumber } from "../../../../utils";
import { Eyebrow } from "../../components/eyebrow";
import { PlanEstimate } from "../../components/plan-estimate";
import { PreviewTree } from "../../components/preview-tree";
import { RuleSelector } from "../../components/rule-selector";
import { ScanBreakdown } from "../../components/scan-breakdown";
import { ScreenFrame } from "../../components/screen-frame";
import { DATE_FORMAT_OPTIONS } from "../../constants/date-format";
import { ICON } from "../../constants/icons";
import { IMMUTABLE_SORT_FLAGS } from "../../constants/sort-flags";
import { usePlanPreview } from "../../hooks/use-plan-preview";
import { resolveDefaultRule } from "../../mappers/resolve-default-rule";

const Loader = ICON.loader;
const Folder = ICON.folder;
const ArrowRight = ICON.arrowRight;

const DATE_BASED_RULE_IDS = new Set<SortRuleId>(["by-date", "by-date-and-place"]);

function isDateBasedRule(ruleId: SortRuleId): boolean {
    return DATE_BASED_RULE_IDS.has(ruleId);
}

export type SetupScreenSource = {
    summary: ScanSummary | null;
    scanId: ScanId | null;
    scanning: boolean;
    rememberedPath?: string | null;
};

export type SetupScreenRule = {
    rules: SortRule[];
    defaultId: SortRuleId | null;
};

export type SetupScreenDateFormat = {
    value: DateFormatId;
    onChange: (next: DateFormatId) => void;
};

export type SetupScreenActions = {
    onPickSource: () => void;
    onReopenLast?: () => void;
    onRun: (plan: SortPlan) => void;
};

export type SetupScreenProps = {
    source: SetupScreenSource;
    rule: SetupScreenRule;
    dateFormat: SetupScreenDateFormat;
    actions: SetupScreenActions;
};

export function SetupScreen({ source, rule, dateFormat, actions }: SetupScreenProps) {
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
    const previewState = usePlanPreview(
        source.scanId,
        ruleId,
        i18n.language,
        dateFormat.value,
        IMMUTABLE_SORT_FLAGS,
    );
    const canRun = source.summary !== null && !source.scanning && previewState.status === "success";
    const plan = previewState.status === "success" ? previewState.plan : null;
    const estimate = previewState.status === "success" ? previewState.estimate : null;
    const isSamplePreview = previewState.status === "success" && previewState.isSample;
    const showReopenLast =
        source.summary === null &&
        !source.scanning &&
        typeof source.rememberedPath === "string" &&
        source.rememberedPath.length > 0 &&
        actions.onReopenLast !== undefined;

    const handleRun = () => {
        if (plan === null) {
            return;
        }

        actions.onRun(plan);
    };

    return (
        <ScreenFrame
            bodyClassName="flex flex-col"
            footer={
                <>
                    {estimate !== null && <PlanEstimate estimate={estimate} />}
                    <Button
                        variant="primary"
                        size="md"
                        onClick={handleRun}
                        disabled={!canRun}
                        className="ml-auto"
                    >
                        {t("runSort")} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                </>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 shrink-0">
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
                    {showReopenLast && (
                        <button
                            type="button"
                            onClick={actions.onReopenLast}
                            className="mt-2.5 flex w-full items-center gap-2 text-left font-mono text-meta-sm text-fg-3 transition-colors hover:text-fg-1"
                        >
                            <Folder className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span className="shrink-0">{t("reopenLast")}</span>
                            <span className="truncate text-fg-2">{source.rememberedPath}</span>
                        </button>
                    )}
                </section>

                <section>
                    <Eyebrow className="mb-2.5">{t("rule")}</Eyebrow>
                    <RuleSelector rules={rule.rules} value={ruleId} onChange={setRuleId} />
                    {isDateBasedRule(ruleId) && (
                        <div className="mt-4">
                            <Eyebrow className="mb-2.5">{t("dateFormat")}</Eyebrow>
                            <Select
                                value={dateFormat.value}
                                onValueChange={(next) => {
                                    if (isDateFormatId(next)) {
                                        dateFormat.onChange(next);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DATE_FORMAT_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.id}
                                            value={option.id}
                                            description={t(option.exampleKey)}
                                        >
                                            {t(option.labelKey)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </section>
            </div>

            <div className="flex-1" aria-hidden />

            <section>
                <Eyebrow className="mb-2.5">
                    {t("outputPreview")}
                    {isSamplePreview && (
                        <>
                            <span aria-hidden> · </span>
                            <span className="text-fg-2">{t("previewSampleBadge")}</span>
                        </>
                    )}
                </Eyebrow>
                <Card className="px-4 py-4">
                    <PreviewTree state={previewState} />
                </Card>
            </section>
        </ScreenFrame>
    );
}
