import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSettingsDto } from "../../../types/ipc";

const getSettingsMock = vi.fn<() => Promise<AppSettingsDto>>();
const setSettingsMock = vi.fn<(next: AppSettingsDto) => Promise<AppSettingsDto>>();
const resetSettingsMock = vi.fn<() => Promise<AppSettingsDto>>();

vi.mock("../../../ipc", () => ({
    getSettings: () => getSettingsMock(),
    setSettings: (next: AppSettingsDto) => setSettingsMock(next),
    resetSettings: () => resetSettingsMock(),
}));

const { useSettings } = await import("./use-settings");

function appSettings(overrides: Partial<AppSettingsDto> = {}): AppSettingsDto {
    return {
        rememberLastSortRule: true,
        rememberLastDestination: true,
        unknownDateFolderName: null,
        historyRetentionDays: 30,
        uiLanguage: "en",
        memo: { lastSortRule: null, lastDestination: null },
        ...overrides,
    };
}

beforeEach(() => {
    getSettingsMock.mockReset();
    setSettingsMock.mockReset();
    resetSettingsMock.mockReset();
});

afterEach(() => {
    vi.clearAllMocks();
});

describe("useSettings", () => {
    it("starts in loading and transitions to success on resolve", async () => {
        getSettingsMock.mockResolvedValue(appSettings({ historyRetentionDays: 42 }));

        const { result } = renderHook(() => useSettings());

        expect(result.current.state.status).toBe("loading");

        await waitFor(() => {
            expect(result.current.state.status).toBe("success");
        });

        if (result.current.state.status === "success") {
            expect(result.current.state.settings.historyRetentionDays).toBe(42);
        }
    });

    it("transitions to error when getSettings rejects", async () => {
        getSettingsMock.mockRejectedValue(new Error("disk gone"));

        const { result } = renderHook(() => useSettings());

        await waitFor(() => {
            expect(result.current.state.status).toBe("error");
        });
    });

    it("save replaces state with the returned settings", async () => {
        getSettingsMock.mockResolvedValueOnce(appSettings());
        setSettingsMock.mockResolvedValueOnce(appSettings({ historyRetentionDays: 90 }));

        const { result } = renderHook(() => useSettings());

        await waitFor(() => {
            expect(result.current.state.status).toBe("success");
        });

        await act(async () => {
            await result.current.save(appSettings({ historyRetentionDays: 90 }));
        });

        if (result.current.state.status === "success") {
            expect(result.current.state.settings.historyRetentionDays).toBe(90);
        }
    });

    it("reset replaces state with fresh defaults from the backend", async () => {
        getSettingsMock.mockResolvedValueOnce(appSettings({ historyRetentionDays: 200 }));
        resetSettingsMock.mockResolvedValueOnce(appSettings({ historyRetentionDays: 30 }));

        const { result } = renderHook(() => useSettings());

        await waitFor(() => {
            expect(result.current.state.status).toBe("success");
        });

        await act(async () => {
            await result.current.reset();
        });

        if (result.current.state.status === "success") {
            expect(result.current.state.settings.historyRetentionDays).toBe(30);
        }
    });

    it("refresh re-issues getSettings and goes back to loading first", async () => {
        getSettingsMock.mockResolvedValueOnce(appSettings({ historyRetentionDays: 30 }));

        const { result } = renderHook(() => useSettings());

        await waitFor(() => {
            expect(result.current.state.status).toBe("success");
        });

        getSettingsMock.mockResolvedValueOnce(appSettings({ historyRetentionDays: 60 }));

        act(() => {
            result.current.refresh();
        });

        expect(result.current.state.status).toBe("loading");

        await waitFor(() => {
            expect(result.current.state.status).toBe("success");
        });

        if (result.current.state.status === "success") {
            expect(result.current.state.settings.historyRetentionDays).toBe(60);
        }
    });
});
