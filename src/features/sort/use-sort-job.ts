import { useEffect, useReducer, useState } from "react";
import type { UnlistenFn } from "@tauri-apps/api/event";

import { onSortDone, onSortError, onSortLog, onSortProgress } from "../../ipc";
import type {
  AppErrorDto,
  JobId,
  SortDoneDto,
  SortLogEntryDto,
  SortProgressDto,
} from "../../types/ipc";
import type { SortLogEntry, SortLogLevel, SortProgress } from "../../types/sort";

import { ELAPSED_TICK_MS, UI_LOG_BUFFER_CAP } from "./use-sort-job-constants";
import { formatElapsed, formatEta } from "./progress-format";

export type SortJobStatus = "idle" | "running" | "paused" | "done" | "error";

export type UseSortJobResult = {
  progress: SortProgress;
  log: SortLogEntry[];
  status: SortJobStatus;
  done: SortDoneDto | null;
  error: AppErrorDto | null;
};

type SortJobState = {
  jobId: JobId | null;
  startedAtMs: number | null;
  snapshot: SortProgressDto | null;
  log: SortLogEntry[];
  status: SortJobStatus;
  done: SortDoneDto | null;
  error: AppErrorDto | null;
};

type SortJobAction =
  | { type: "reset"; jobId: JobId | null; startedAtMs: number | null }
  | { type: "progress"; jobId: JobId; payload: SortProgressDto }
  | { type: "log"; jobId: JobId; payload: SortLogEntryDto }
  | { type: "done"; jobId: JobId; payload: SortDoneDto }
  | { type: "error"; jobId: JobId; payload: AppErrorDto }
  | { type: "subscribeError"; jobId: JobId };

const IDLE_STATE: SortJobState = {
  jobId: null,
  startedAtMs: null,
  snapshot: null,
  log: [],
  status: "idle",
  done: null,
  error: null,
};

const EMPTY_PROGRESS: SortProgress = {
  total: 0,
  processed: 0,
  moved: 0,
  skipped: 0,
  folders: 0,
  elapsed: "00:00",
  remaining: "—",
  current: "",
  log: [],
};

/**
 * Subscribe to live `sort:progress`, `sort:log`, `sort:done`, and `sort:error`
 * events for the given job. Returns the latest UI-shaped progress, a capped
 * activity log (newest first), the current status, and any terminal payload.
 *
 * Pass `null` while no job is active — the hook will hold idle state and skip
 * subscriptions. Re-subscribing on `jobId` change is automatic; cleanup runs
 * on unmount and on `jobId` change.
 */
export function useSortJob(jobId: JobId | null): UseSortJobResult {
  const [state, dispatch] = useReducer(reduce, IDLE_STATE);
  const [tickNow, setTickNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (jobId === null) {
      dispatch({ type: "reset", jobId: null, startedAtMs: null });

      return;
    }

    dispatch({ type: "reset", jobId, startedAtMs: Date.now() });

    let cancelled = false;
    const unlisteners: UnlistenFn[] = [];

    const subscriptions: Promise<UnlistenFn>[] = [
      onSortProgress((payload) => {
        dispatch({ type: "progress", jobId, payload });
      }),
      onSortLog((payload) => {
        dispatch({ type: "log", jobId, payload });
      }),
      onSortDone((payload) => {
        dispatch({ type: "done", jobId, payload });
      }),
      onSortError((payload) => {
        dispatch({ type: "error", jobId, payload });
      }),
    ];

    Promise.all(subscriptions)
      .then((fns) => {
        if (cancelled) {
          fns.forEach((fn) => {
            fn();
          });

          return;
        }

        unlisteners.push(...fns);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        dispatch({ type: "subscribeError", jobId });
      });

    return () => {
      cancelled = true;
      unlisteners.forEach((fn) => {
        fn();
      });
    };
  }, [jobId]);

  useEffect(() => {
    if (state.status !== "running") {
      return;
    }

    const interval = window.setInterval(() => {
      setTickNow(Date.now());
    }, ELAPSED_TICK_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [state.status]);

  const progress = toProgress(state.snapshot, state.log, state.startedAtMs, tickNow);

  return {
    progress,
    log: state.log,
    status: state.status,
    done: state.done,
    error: state.error,
  };
}

function reduce(state: SortJobState, action: SortJobAction): SortJobState {
  switch (action.type) {
    case "reset":
      if (action.jobId === null) {
        return IDLE_STATE;
      }

      return {
        ...IDLE_STATE,
        jobId: action.jobId,
        startedAtMs: action.startedAtMs,
        status: "running",
      };
    case "progress":
      if (state.jobId !== action.jobId) {
        return state;
      }

      return { ...state, snapshot: action.payload };
    case "log":
      if (state.jobId !== action.jobId) {
        return state;
      }

      return { ...state, log: prependLog(state.log, action.payload) };
    case "done":
      if (state.jobId !== action.jobId) {
        return state;
      }

      return { ...state, done: action.payload, status: statusFromDone(action.payload) };
    case "error":
      if (state.jobId !== action.jobId) {
        return state;
      }

      return { ...state, error: action.payload, status: "error" };
    case "subscribeError":
      if (state.jobId !== action.jobId) {
        return state;
      }

      return { ...state, status: "error" };
  }
}

function prependLog(previous: SortLogEntry[], dto: SortLogEntryDto): SortLogEntry[] {
  const next = [toLogEntry(dto), ...previous];

  if (next.length > UI_LOG_BUFFER_CAP) {
    next.length = UI_LOG_BUFFER_CAP;
  }

  return next;
}

function toLogEntry(dto: SortLogEntryDto): SortLogEntry {
  const level: SortLogLevel = dto.level;

  return {
    time: dto.time,
    level,
    text: dto.text,
  };
}

function toProgress(
  snapshot: SortProgressDto | null,
  log: SortLogEntry[],
  startedAtMs: number | null,
  nowMs: number,
): SortProgress {
  if (snapshot === null) {
    return { ...EMPTY_PROGRESS, log };
  }

  const elapsedMs = startedAtMs === null ? 0 : Math.max(0, nowMs - startedAtMs);

  return {
    total: snapshot.total,
    processed: snapshot.processed,
    moved: snapshot.moved,
    skipped: snapshot.skipped,
    folders: snapshot.folders,
    elapsed: formatElapsed(elapsedMs),
    remaining: formatEta(snapshot.processed, snapshot.total, elapsedMs),
    current: snapshot.current,
    log,
  };
}

function statusFromDone(payload: SortDoneDto): SortJobStatus {
  return payload.state === "failed" ? "error" : "done";
}
