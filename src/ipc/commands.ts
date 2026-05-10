import { invoke } from "@tauri-apps/api/core";
import type {
  HistoryItemDto,
  JobId,
  ScanId,
  ScanResponse,
  SortPlan,
  SortRuleId,
  SortSettingsDto,
} from "../types/ipc";

export function pickSourceDir(): Promise<string | null> {
  return invoke<string | null>("pick_source_dir");
}

export function scanSource(path: string): Promise<ScanResponse> {
  return invoke<ScanResponse>("scan_source", { request: { path } });
}

export function previewPlan(scanId: ScanId, rule: SortRuleId): Promise<SortPlan> {
  return invoke<SortPlan>("preview_plan", { request: { scanId, rule } });
}

export function startSort(plan: SortPlan, settings: SortSettingsDto): Promise<{ jobId: JobId }> {
  return invoke<{ jobId: JobId }>("start_sort", { request: { plan, settings } });
}

export async function pauseSort(jobId: JobId): Promise<void> {
  await invoke("pause_sort", { request: { jobId } });
}

export async function cancelSort(jobId: JobId): Promise<void> {
  await invoke("cancel_sort", { request: { jobId } });
}

export async function revertJob(jobId: JobId): Promise<void> {
  await invoke("revert_job", { request: { jobId } });
}

export function listHistory(): Promise<HistoryItemDto[]> {
  return invoke<HistoryItemDto[]>("list_history");
}

export async function revealInOs(path: string): Promise<void> {
  await invoke("reveal_in_os", { request: { path } });
}
