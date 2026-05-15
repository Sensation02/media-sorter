import { invoke } from "@tauri-apps/api/core";
import type {
    AppSettingsDto,
    HistoryItemDto,
    JobId,
    RevertOutcomeDto,
    ScanId,
    ScanResponse,
    SessionMemoDto,
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

export function startSort(
    plan: SortPlan,
    settings: SortSettingsDto,
    dryRun = false,
): Promise<{ jobId: JobId }> {
    return invoke<{ jobId: JobId }>("start_sort", { request: { plan, settings, dryRun } });
}

export async function pauseSort(jobId: JobId): Promise<void> {
    await invoke("pause_sort", { request: { jobId } });
}

export async function cancelSort(jobId: JobId): Promise<void> {
    await invoke("cancel_sort", { request: { jobId } });
}

export function revertJob(jobId: JobId): Promise<RevertOutcomeDto> {
    return invoke<RevertOutcomeDto>("revert_job", { request: { jobId } });
}

export function listHistory(): Promise<HistoryItemDto[]> {
    return invoke<HistoryItemDto[]>("list_history");
}

export async function revealDirectory(path: string): Promise<void> {
    await invoke("reveal_directory", { request: { path } });
}

export function getSettings(): Promise<AppSettingsDto> {
    return invoke<AppSettingsDto>("get_settings");
}

export function setSettings(settings: AppSettingsDto): Promise<AppSettingsDto> {
    return invoke<AppSettingsDto>("set_settings", { request: { settings } });
}

export function resetSettings(): Promise<AppSettingsDto> {
    return invoke<AppSettingsDto>("reset_settings");
}

export function getMemo(): Promise<SessionMemoDto> {
    return invoke<SessionMemoDto>("get_memo");
}

export async function setMemo(memo: SessionMemoDto): Promise<void> {
    await invoke("set_memo", { request: { memo } });
}
