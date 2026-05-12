import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HistoryItemDto, RevertOutcomeDto } from "../../../types/ipc";

const listHistoryMock = vi.fn<() => Promise<HistoryItemDto[]>>();
const revertJobMock = vi.fn<(jobId: number) => Promise<RevertOutcomeDto>>();

vi.mock("../../../ipc", () => ({
    listHistory: () => listHistoryMock(),
    revertJob: (jobId: number) => revertJobMock(jobId),
}));

const { useHistory } = await import("./use-history");

function item(overrides: Partial<HistoryItemDto> = {}): HistoryItemDto {
    return {
        id: 1,
        name: "/Users/me/Pictures",
        destinationRoot: "/Users/me/Pictures",
        startedAtMs: 1,
        durationMs: 100,
        moved: 0,
        skipped: 0,
        errors: 0,
        state: "done",
        ...overrides,
    };
}

beforeEach(() => {
    listHistoryMock.mockReset();
    revertJobMock.mockReset();
});

afterEach(() => {
    vi.clearAllMocks();
});

describe("useHistory", () => {
    it("starts in loading state and transitions to success on resolve", async () => {
        listHistoryMock.mockResolvedValue([item({ id: 42 })]);

        const { result } = renderHook(() => useHistory());

        expect(result.current.state.status).toBe("loading");

        await waitFor(() => {
            expect(result.current.state.status).toBe("success");
        });

        if (result.current.state.status === "success") {
            expect(result.current.state.items[0]?.id).toBe(42);
        }
    });

    it("transitions to error state when listHistory rejects", async () => {
        listHistoryMock.mockRejectedValue(new Error("network down"));

        const { result } = renderHook(() => useHistory());

        await waitFor(() => {
            expect(result.current.state.status).toBe("error");
        });
    });

    it("refresh re-issues listHistory and goes back to loading first", async () => {
        listHistoryMock.mockResolvedValueOnce([item({ id: 1 })]);

        const { result } = renderHook(() => useHistory());

        await waitFor(() => {
            expect(result.current.state.status).toBe("success");
        });

        listHistoryMock.mockResolvedValueOnce([item({ id: 2 }), item({ id: 3 })]);

        act(() => {
            result.current.refresh();
        });

        expect(result.current.state.status).toBe("loading");

        await waitFor(() => {
            expect(result.current.state.status).toBe("success");
        });

        if (result.current.state.status === "success") {
            expect(result.current.state.items).toHaveLength(2);
        }
    });

    it("revert calls revertJob and refreshes the list", async () => {
        listHistoryMock.mockResolvedValueOnce([item({ id: 7, state: "done" })]);
        revertJobMock.mockResolvedValueOnce({
            jobId: 7,
            restored: 5,
            skipped: 1,
            errors: 0,
        });
        listHistoryMock.mockResolvedValueOnce([item({ id: 7, state: "reverted" })]);

        const { result } = renderHook(() => useHistory());

        await waitFor(() => {
            expect(result.current.state.status).toBe("success");
        });

        let outcome: RevertOutcomeDto | undefined;
        await act(async () => {
            outcome = await result.current.revert(7);
        });

        expect(revertJobMock).toHaveBeenCalledWith(7);
        expect(outcome?.restored).toBe(5);

        await waitFor(() => {
            if (result.current.state.status === "success") {
                expect(result.current.state.items[0]?.state).toBe("reverted");
            }
        });
    });
});
