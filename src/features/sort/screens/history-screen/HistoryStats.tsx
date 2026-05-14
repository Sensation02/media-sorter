import { useTranslation } from "react-i18next";

import type { HistoryItemDto } from "../../../../types/ipc";
import { formatNumber } from "../../../../utils";

export type HistoryStatsProps = {
    job: HistoryItemDto;
};

export function HistoryStats({ job }: HistoryStatsProps) {
    const { t } = useTranslation("history");

    return (
        <div className="font-mono text-meta text-fg-2 tabular-nums whitespace-nowrap">
            {t("statsMoved", { count: job.moved, value: formatNumber(job.moved) })}
            {job.skipped > 0 && (
                <span className="text-warning">
                    {" · "}
                    {t("statsSkipped", { count: job.skipped, value: formatNumber(job.skipped) })}
                </span>
            )}
            {job.errors > 0 && (
                <span className="text-destructive">
                    {" · "}
                    {t("statsErrors", { count: job.errors, value: formatNumber(job.errors) })}
                </span>
            )}
        </div>
    );
}
