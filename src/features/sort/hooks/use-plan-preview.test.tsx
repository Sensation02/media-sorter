import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
    PreviewPlanResponseDto,
    SortPlan,
    SortRuleId,
    SortSettingsDto,
} from "../../../types/ipc";

const samplePreviewMock = vi.fn<(rule: SortRuleId) => Promise<SortPlan>>();
const previewPlanMock =
    vi.fn<
        (
            scanId: number,
            rule: SortRuleId,
            settings: SortSettingsDto,
        ) => Promise<PreviewPlanResponseDto>
    >();

vi.mock("../../../ipc", () => ({
    samplePreview: (rule: SortRuleId) => samplePreviewMock(rule),
    previewPlan: (scanId: number, rule: SortRuleId, settings: SortSettingsDto) =>
        previewPlanMock(scanId, rule, settings),
}));

const { usePlanPreview } = await import("./use-plan-preview");

const SORT_SETTINGS: SortSettingsDto = {
    copy: false,
    skipDuplicates: false,
    watchSource: false,
    writeReport: false,
    probeBandwidth: false,
};

function samplePlan(): SortPlan {
    return {
        rule: "by-date",
        root: "sample",
        items: [{ source: "/a.jpg", target: "/2024/a.jpg" }],
    };
}

function planResponse(): PreviewPlanResponseDto {
    return {
        plan: {
            rule: "by-date",
            root: "/root",
            items: [{ source: "/a.jpg", target: "/2024/a.jpg" }],
        },
        estimate: {
            mode: "move-same-volume",
            totalFiles: 1,
            totalBytes: 100,
            estimatedMsLow: 10,
            estimatedMsHigh: 20,
            confidence: "high",
        },
    };
}

beforeEach(() => {
    samplePreviewMock.mockReset();
    samplePreviewMock.mockResolvedValue(samplePlan());
    previewPlanMock.mockReset();
    previewPlanMock.mockResolvedValue(planResponse());
});

afterEach(() => {
    vi.clearAllMocks();
});

describe("usePlanPreview", () => {
    it("fetches the sample plan when scanId is null", async () => {
        const { result } = renderHook(() =>
            usePlanPreview(null, "by-date", "en", "localized-month-year", SORT_SETTINGS),
        );

        await waitFor(() => {
            expect(result.current.status).toBe("success");
        });

        expect(samplePreviewMock).toHaveBeenCalledWith("by-date");
        expect(previewPlanMock).not.toHaveBeenCalled();

        if (result.current.status === "success") {
            expect(result.current.isSample).toBe(true);
            expect(result.current.estimate).toBeNull();
            expect(result.current.plan.items).toHaveLength(1);
        }
    });

    it("fetches the real plan when scanId is set", async () => {
        const { result } = renderHook(() =>
            usePlanPreview(7, "by-date", "en", "localized-month-year", SORT_SETTINGS),
        );

        await waitFor(() => {
            expect(result.current.status).toBe("success");
        });

        expect(previewPlanMock).toHaveBeenCalledWith(7, "by-date", SORT_SETTINGS);
        expect(samplePreviewMock).not.toHaveBeenCalled();

        if (result.current.status === "success") {
            expect(result.current.isSample).toBe(false);
            expect(result.current.estimate).not.toBeNull();
        }
    });

    it("surfaces an error state when the sample fetch rejects", async () => {
        samplePreviewMock.mockRejectedValueOnce(new Error("boom"));

        const { result } = renderHook(() =>
            usePlanPreview(null, "by-date", "en", "localized-month-year", SORT_SETTINGS),
        );

        await waitFor(() => {
            expect(result.current.status).toBe("error");
        });
    });
});
