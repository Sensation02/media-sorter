import i18next from "i18next";

import type { EstimateConfidence, PlanEstimateDto } from "../../../types/ipc";

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const NICE_SECONDS = [5, 10, 15, 20, 30, 45];
const NICE_MINUTES = [1, 2, 3, 5, 10, 15, 30, 45];

export type EstimateView = {
    text: string;
    confidence: EstimateConfidence;
    hidden: boolean;
};

export function formatPlanEstimate(estimate: PlanEstimateDto): EstimateView {
    if (estimate.totalFiles === 0) {
        return { text: "", confidence: estimate.confidence, hidden: true };
    }

    const lowMs = Math.max(0, estimate.estimatedMsLow);
    const highMs = Math.max(lowMs, estimate.estimatedMsHigh);

    if (estimate.confidence === "high") {
        const midMs = (lowMs + highMs) / 2;
        const text = i18next.t("setup:estimateAbout", { value: formatDuration(midMs) });
        return { text, confidence: estimate.confidence, hidden: false };
    }

    if (estimate.confidence === "low") {
        const text = i18next.t("setup:estimateLong", { value: formatDuration(lowMs) });
        return { text, confidence: estimate.confidence, hidden: false };
    }

    const lowText = formatDuration(lowMs);
    const highText = formatDuration(highMs);
    const text = i18next.t("setup:estimateRange", { low: lowText, high: highText });
    return { text, confidence: estimate.confidence, hidden: false };
}

function formatDuration(ms: number): string {
    if (!Number.isFinite(ms) || ms <= 0) {
        return i18next.t("setup:estimateInstant");
    }

    const seconds = ms / MS_PER_SECOND;

    if (seconds < SECONDS_PER_MINUTE) {
        const rounded = roundUp(seconds, NICE_SECONDS) ?? SECONDS_PER_MINUTE;

        if (rounded < SECONDS_PER_MINUTE) {
            return i18next.t("setup:estimateSeconds", { value: rounded });
        }
    }

    const minutes = seconds / SECONDS_PER_MINUTE;
    const roundedMinutes = roundUp(minutes, NICE_MINUTES);

    if (roundedMinutes === null) {
        return i18next.t("setup:estimateMinutesMany", {
            value: NICE_MINUTES[NICE_MINUTES.length - 1],
        });
    }

    return i18next.t("setup:estimateMinutes", { value: roundedMinutes });
}

function roundUp(value: number, ladder: readonly number[]): number | null {
    for (const candidate of ladder) {
        if (value <= candidate) {
            return candidate;
        }
    }

    return null;
}
