import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { AppErrorDto, SortDoneDto, SortLogEntryDto, SortProgressDto } from "../types/ipc";

export const SORT_PROGRESS_EVENT = "sort:progress";
export const SORT_LOG_EVENT = "sort:log";
export const SORT_DONE_EVENT = "sort:done";
export const SORT_ERROR_EVENT = "sort:error";

export function onSortProgress(handler: (payload: SortProgressDto) => void): Promise<UnlistenFn> {
  return listen<SortProgressDto>(SORT_PROGRESS_EVENT, (event) => {
    handler(event.payload);
  });
}

export function onSortLog(handler: (payload: SortLogEntryDto) => void): Promise<UnlistenFn> {
  return listen<SortLogEntryDto>(SORT_LOG_EVENT, (event) => {
    handler(event.payload);
  });
}

export function onSortDone(handler: (payload: SortDoneDto) => void): Promise<UnlistenFn> {
  return listen<SortDoneDto>(SORT_DONE_EVENT, (event) => {
    handler(event.payload);
  });
}

export function onSortError(handler: (payload: AppErrorDto) => void): Promise<UnlistenFn> {
  return listen<AppErrorDto>(SORT_ERROR_EVENT, (event) => {
    handler(event.payload);
  });
}
