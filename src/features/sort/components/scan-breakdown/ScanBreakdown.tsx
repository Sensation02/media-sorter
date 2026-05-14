import { useTranslation } from "react-i18next";

import type { ScanSummary } from "../../../../types/ipc";

export type ScanBreakdownProps = {
    summary: ScanSummary;
};

export function ScanBreakdown({ summary }: ScanBreakdownProps) {
    const { t, i18n } = useTranslation("setup");
    const { photos, raw, videos } = summary.byKind;
    const formatter = numberFormatter(i18n.language);

    return (
        <div className="mt-2 px-4 flex items-center gap-4 font-mono text-meta-sm text-fg-3">
            <span>
                {t("breakdownPhotos")} {"·"}{" "}
                <span className="text-fg-2">{formatter.format(photos)}</span>
            </span>
            <span>
                {t("breakdownRaw")} {"·"} <span className="text-fg-2">{formatter.format(raw)}</span>
            </span>
            <span>
                {t("breakdownVideos")} {"·"}{" "}
                <span className="text-fg-2">{formatter.format(videos)}</span>
            </span>
        </div>
    );
}

function numberFormatter(language: string): Intl.NumberFormat {
    return new Intl.NumberFormat(language);
}
