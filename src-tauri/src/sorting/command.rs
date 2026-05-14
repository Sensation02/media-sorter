use std::path::{Path, PathBuf};
use std::sync::Arc;

use tauri::{AppHandle, Manager};

use crate::domain::{AppSettings, HistoryItem, JobId, SessionMemo, SortPlan};
use crate::error::{AppError, AppResult};
use crate::history::summary::write_summary;
use crate::i18n;
use crate::scanning::repository::get_session;
use crate::settings;
use crate::utils::now_ms;

use super::dto::{JobIdRequest, PreviewPlanRequest, StartSortRequest, StartSortResponse};
use super::planner::build_plan;
use super::runner::constants::THROTTLE_INTERVAL_MS;
use super::runner::emitter::{ProgressEmitter, TauriEmitter, ThrottledEmitter};
use super::runner::fs_repo::RealFsRepo;
use super::runner::job;
use super::runner::service::{run_sort, JobOutcome, RunInput};

#[tauri::command]
pub async fn preview_plan(app: AppHandle, request: PreviewPlanRequest) -> AppResult<SortPlan> {
    tauri::async_runtime::spawn_blocking(move || run_preview(&app, request))
        .await
        .map_err(AppError::internal)?
}

#[tauri::command]
pub async fn start_sort(app: AppHandle, request: StartSortRequest) -> AppResult<StartSortResponse> {
    let job_id = now_ms();
    let jobs_dir = jobs_dir(&app)?;
    let log_path = log_path(&jobs_dir, job_id);
    let summary_path = summary_path(&jobs_dir, job_id);
    let destination_root = request.plan.root.clone();
    let dry_run = request.dry_run;

    if !dry_run {
        write_session_memo(&app, request.plan.rule, &destination_root);
    }

    let control = job::register(job_id)?;
    let tauri_emitter: Arc<dyn ProgressEmitter> = Arc::new(TauriEmitter::new(app.clone()));
    let emitter: Arc<dyn ProgressEmitter> =
        Arc::new(ThrottledEmitter::new(tauri_emitter, THROTTLE_INTERVAL_MS));

    let input = RunInput {
        job_id,
        plan: request.plan,
        settings: request.settings,
        dry_run,
        fs_repo: Arc::new(RealFsRepo::new()),
        log_path,
        control,
        emitter,
    };

    tauri::async_runtime::spawn_blocking(move || {
        let outcome = run_sort(input);

        if !dry_run {
            let item = build_history_item(&outcome, &destination_root);
            let _ = write_summary(&summary_path, &item);
        }

        let _ = job::finish(outcome.job_id);
    });

    Ok(StartSortResponse { job_id })
}

#[tauri::command]
pub async fn pause_sort(request: JobIdRequest) -> AppResult<()> {
    job::pause(request.job_id)
}

#[tauri::command]
pub async fn cancel_sort(request: JobIdRequest) -> AppResult<()> {
    job::cancel(request.job_id)
}

fn run_preview(app: &AppHandle, request: PreviewPlanRequest) -> AppResult<SortPlan> {
    let session = get_session(request.scan_id)?;
    let settings = settings::service::get_settings(app)?;
    let unknown_folder = resolve_unknown_folder(&settings);

    build_plan(
        &session.root,
        request.rule,
        &session.files,
        &session.metadata,
        &unknown_folder,
        &settings.ui_language,
    )
}

fn resolve_unknown_folder(settings: &AppSettings) -> String {
    settings
        .unknown_date_folder_name
        .clone()
        .unwrap_or_else(|| i18n::unknown_date_folder_for(&settings.ui_language).to_string())
}

fn jobs_dir(app: &AppHandle) -> AppResult<PathBuf> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|err| AppError::internal(format!("could not resolve app data dir: {err}")))?;

    Ok(data_dir.join("jobs"))
}

fn log_path(jobs_dir: &Path, job_id: JobId) -> PathBuf {
    jobs_dir.join(format!("{job_id}.jsonl"))
}

fn summary_path(jobs_dir: &Path, job_id: JobId) -> PathBuf {
    jobs_dir.join(format!("{job_id}.summary.json"))
}

fn write_session_memo(app: &AppHandle, rule: crate::domain::SortRuleId, destination: &Path) {
    let memo = SessionMemo {
        last_sort_rule: Some(rule),
        last_destination: Some(destination.to_path_buf()),
    };

    if let Err(err) = settings::service::set_memo(app, memo) {
        eprintln!("[settings] could not persist session memo: {err}");
    }
}

fn build_history_item(outcome: &JobOutcome, destination_root: &Path) -> HistoryItem {
    HistoryItem {
        id: outcome.job_id,
        name: destination_root.display().to_string(),
        destination_root: destination_root.to_path_buf(),
        started_at_ms: outcome.job_id,
        duration_ms: outcome.duration_ms,
        moved: outcome.moved,
        skipped: outcome.skipped,
        errors: outcome.errors,
        state: outcome.state,
    }
}
