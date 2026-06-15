import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSettingsDto, HistoryItemDto, ScanResponse } from "../../../types/ipc";

const getSettingsMock = vi.fn<() => Promise<AppSettingsDto>>();
const listHistoryMock = vi.fn<() => Promise<HistoryItemDto[]>>();
const scanSourceMock = vi.fn<(path: string) => Promise<ScanResponse>>();

vi.mock("../../../ipc", () => ({
    getSettings: () => getSettingsMock(),
    listHistory: () => listHistoryMock(),
    scanSource: (path: string) => scanSourceMock(path),
}));

const { useSortOrchestration } = await import("./use-sort-orchestration");

const REMEMBERED_PATH = "/Users/test/Photos/Last sort";

function settingsWithMemo(): AppSettingsDto {
    return {
        rememberLastSortRule: true,
        rememberLastDestination: true,
        unknownDateFolderName: null,
        historyRetentionDays: 30,
        uiLanguage: "uk",
        dateFormat: "iso-month",
        memo: { lastSortRule: "by-date-and-place", lastDestination: REMEMBERED_PATH },
    };
}

function scanResponse(): ScanResponse {
    return {
        scanId: 7,
        summary: {
            root: REMEMBERED_PATH,
            fileCount: 3,
            sizeBytes: 1024,
            byKind: { photos: 3, raw: 0, videos: 0 },
        },
    };
}

beforeEach(() => {
    getSettingsMock.mockReset();
    getSettingsMock.mockResolvedValue(settingsWithMemo());
    listHistoryMock.mockReset();
    listHistoryMock.mockResolvedValue([]);
    scanSourceMock.mockReset();
    scanSourceMock.mockResolvedValue(scanResponse());
});

afterEach(() => {
    vi.clearAllMocks();
});

describe("useSortOrchestration source prefill", () => {
    it("does not auto-scan the remembered folder on mount", async () => {
        const { result } = renderHook(() => useSortOrchestration());

        await waitFor(() => {
            expect(result.current.settings.state.status).toBe("success");
        });

        expect(scanSourceMock).not.toHaveBeenCalled();
        expect(result.current.source).toBeNull();
        expect(result.current.scanId).toBeNull();
    });

    it("reopenSource scans the given folder and loads it as the active source", async () => {
        const { result } = renderHook(() => useSortOrchestration());

        await waitFor(() => {
            expect(result.current.settings.state.status).toBe("success");
        });

        await act(async () => {
            await result.current.handlers.reopenSource(REMEMBERED_PATH);
        });

        expect(scanSourceMock).toHaveBeenCalledWith(REMEMBERED_PATH);
        expect(result.current.source).not.toBeNull();
        expect(result.current.scanId).toBe(7);
    });
});
