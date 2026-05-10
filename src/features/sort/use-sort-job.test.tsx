import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppErrorDto, SortDoneDto, SortLogEntryDto, SortProgressDto } from "../../types/ipc";

type ProgressHandler = (payload: SortProgressDto) => void;
type LogHandler = (payload: SortLogEntryDto) => void;
type DoneHandler = (payload: SortDoneDto) => void;
type ErrorHandler = (payload: AppErrorDto) => void;

const progressHandlers: ProgressHandler[] = [];
const logHandlers: LogHandler[] = [];
const doneHandlers: DoneHandler[] = [];
const errorHandlers: ErrorHandler[] = [];

const unlistenProgress = vi.fn();
const unlistenLog = vi.fn();
const unlistenDone = vi.fn();
const unlistenError = vi.fn();

vi.mock("../../ipc", () => ({
  onSortProgress: (handler: ProgressHandler) => {
    progressHandlers.push(handler);
    return Promise.resolve(unlistenProgress);
  },
  onSortLog: (handler: LogHandler) => {
    logHandlers.push(handler);
    return Promise.resolve(unlistenLog);
  },
  onSortDone: (handler: DoneHandler) => {
    doneHandlers.push(handler);
    return Promise.resolve(unlistenDone);
  },
  onSortError: (handler: ErrorHandler) => {
    errorHandlers.push(handler);
    return Promise.resolve(unlistenError);
  },
}));

const { useSortJob } = await import("./use-sort-job");

function emitProgress(payload: SortProgressDto): void {
  progressHandlers.forEach((handler) => {
    handler(payload);
  });
}

function emitLog(payload: SortLogEntryDto): void {
  logHandlers.forEach((handler) => {
    handler(payload);
  });
}

function emitDone(payload: SortDoneDto): void {
  doneHandlers.forEach((handler) => {
    handler(payload);
  });
}

function emitError(payload: AppErrorDto): void {
  errorHandlers.forEach((handler) => {
    handler(payload);
  });
}

beforeEach(() => {
  progressHandlers.length = 0;
  logHandlers.length = 0;
  doneHandlers.length = 0;
  errorHandlers.length = 0;
  unlistenProgress.mockReset();
  unlistenLog.mockReset();
  unlistenDone.mockReset();
  unlistenError.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useSortJob", () => {
  it("idle when jobId is null and no listeners are wired", async () => {
    const { result } = renderHook(() => useSortJob(null));

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    expect(progressHandlers).toHaveLength(0);
  });

  it("transitions to running and reflects progress payloads", async () => {
    const { result } = renderHook(() => useSortJob(7));

    expect(result.current.status).toBe("running");

    await waitFor(() => {
      expect(progressHandlers).toHaveLength(1);
    });

    act(() => {
      emitProgress({
        total: 100,
        processed: 25,
        moved: 24,
        skipped: 1,
        folders: 3,
        current: "IMG_0001.HEIC",
      });
    });

    expect(result.current.progress.processed).toBe(25);
    expect(result.current.progress.total).toBe(100);
    expect(result.current.progress.current).toBe("IMG_0001.HEIC");
  });

  it("caps the log buffer and prepends newest entries first", async () => {
    const { result } = renderHook(() => useSortJob(1));

    await waitFor(() => {
      expect(logHandlers).toHaveLength(1);
    });

    act(() => {
      emitLog({ time: "00:01", level: "ok", text: "first" });
      emitLog({ time: "00:02", level: "ok", text: "second" });
    });

    expect(result.current.log[0]?.text).toBe("second");
    expect(result.current.log[1]?.text).toBe("first");
  });

  it("transitions to done on sort:done with non-failed state", async () => {
    const { result } = renderHook(() => useSortJob(3));

    await waitFor(() => {
      expect(doneHandlers).toHaveLength(1);
    });

    act(() => {
      emitDone({
        jobId: 3,
        state: "done",
        durationMs: 1234,
        moved: 10,
        skipped: 0,
        folders: 2,
        destination: "/out",
      });
    });

    expect(result.current.status).toBe("done");
    expect(result.current.done?.moved).toBe(10);
  });

  it("transitions to error on sort:error", async () => {
    const { result } = renderHook(() => useSortJob(4));

    await waitFor(() => {
      expect(errorHandlers).toHaveLength(1);
    });

    act(() => {
      emitError({ code: "io", params: { message: "disk full" } });
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error?.code).toBe("io");
  });

  it("unsubscribes all listeners when jobId becomes null", async () => {
    const initialProps: { id: number | null } = { id: 5 };
    const { rerender } = renderHook(({ id }: { id: number | null }) => useSortJob(id), {
      initialProps,
    });

    await waitFor(() => {
      expect(progressHandlers).toHaveLength(1);
    });

    rerender({ id: null });

    await waitFor(() => {
      expect(unlistenProgress).toHaveBeenCalled();
      expect(unlistenLog).toHaveBeenCalled();
      expect(unlistenDone).toHaveBeenCalled();
      expect(unlistenError).toHaveBeenCalled();
    });
  });
});
