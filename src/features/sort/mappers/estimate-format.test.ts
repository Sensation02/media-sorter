import i18next from "i18next";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, initI18n, LANGUAGE_CODE_EN } from "../../../i18n";
import type { PlanEstimateDto } from "../../../types/ipc";
import { formatPlanEstimate } from "./estimate-format";

let previousLanguage: string | undefined;

beforeAll(async () => {
    await initI18n(DEFAULT_LOCALE);
    previousLanguage = i18next.language;
    await i18next.changeLanguage(LANGUAGE_CODE_EN);
});

afterAll(async () => {
    if (previousLanguage !== undefined) {
        await i18next.changeLanguage(previousLanguage);
    }
});

function estimate(overrides: Partial<PlanEstimateDto>): PlanEstimateDto {
    return {
        mode: "move-same-volume",
        totalFiles: 100,
        totalBytes: 1_000_000,
        estimatedMsLow: 15_000,
        estimatedMsHigh: 15_000,
        confidence: "high",
        ...overrides,
    };
}

describe("formatPlanEstimate", () => {
    it("hides the pill when the plan has no files", () => {
        const view = formatPlanEstimate(estimate({ totalFiles: 0 }));

        expect(view.hidden).toBe(true);
        expect(view.text).toBe("");
    });

    it("renders a high-confidence point estimate with an approximation prefix", () => {
        const view = formatPlanEstimate(
            estimate({
                confidence: "high",
                estimatedMsLow: 14_000,
                estimatedMsHigh: 16_000,
            }),
        );

        expect(view.hidden).toBe(false);
        expect(view.confidence).toBe("high");
        expect(view.text).toContain("≈");
        expect(view.text).toContain("15");
    });

    it("renders a medium-confidence range with a low and high bound", () => {
        const view = formatPlanEstimate(
            estimate({
                confidence: "medium",
                estimatedMsLow: 25_000,
                estimatedMsHigh: 50_000,
            }),
        );

        expect(view.text).toContain("30");
        expect(view.text).toMatch(/[–-]/);
    });

    it("renders a low-confidence floor with a greater-than prefix", () => {
        const view = formatPlanEstimate(
            estimate({
                confidence: "low",
                estimatedMsLow: 90_000,
                estimatedMsHigh: 240_000,
            }),
        );

        expect(view.text).toContain(">");
    });

    it("rounds sub-minute durations up to nice ladder values", () => {
        const fastFinish = formatPlanEstimate(
            estimate({
                confidence: "high",
                estimatedMsLow: 4_000,
                estimatedMsHigh: 4_000,
            }),
        );

        expect(fastFinish.text).toContain("5");
    });

    it("crosses into minutes when the duration exceeds 60 seconds", () => {
        const view = formatPlanEstimate(
            estimate({
                confidence: "high",
                estimatedMsLow: 75_000,
                estimatedMsHigh: 75_000,
            }),
        );

        expect(view.text).toMatch(/min/);
    });
});
