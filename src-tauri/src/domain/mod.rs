use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub mod extensions;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum MediaKind {
    Photo,
    Raw,
    Video,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum SortRuleId {
    ByDate,
    ByDateAndPlace,
    ByType,
    ByCamera,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum DateSource {
    Exif,
    Mtime,
    Unknown,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum JobStatus {
    Idle,
    Running,
    Paused,
    Done,
    Cancelled,
    Failed,
    Reverted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeoPoint {
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Place {
    pub name: String,
    pub country: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Camera {
    pub make: Option<String>,
    pub model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureDate {
    pub at: DateTime<Utc>,
    pub source: DateSource,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Metadata {
    pub capture: Option<CaptureDate>,
    pub geo: Option<GeoPoint>,
    pub camera: Option<Camera>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaFile {
    pub path: PathBuf,
    pub size_bytes: u64,
    pub kind: MediaKind,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ByKind {
    pub photos: u64,
    pub raw: u64,
    pub videos: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanSummary {
    pub root: PathBuf,
    pub file_count: u64,
    pub size_bytes: u64,
    pub by_kind: ByKind,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SortPlanItem {
    pub source: PathBuf,
    pub target: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SortPlan {
    pub rule: SortRuleId,
    pub root: PathBuf,
    pub items: Vec<SortPlanItem>,
}

pub type JobId = i64;
pub type ScanId = i64;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveOp {
    pub from: PathBuf,
    pub to: PathBuf,
    pub at_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SortSettings {
    pub copy: bool,
    pub skip_duplicates: bool,
    pub watch_source: bool,
    pub write_report: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub remember_last_sort_rule: bool,
    pub remember_last_destination: bool,
    pub unknown_date_folder_name: Option<String>,
    pub history_retention_days: u16,
    pub ui_language: String,
    pub memo: SessionMemo,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionMemo {
    pub last_sort_rule: Option<SortRuleId>,
    pub last_destination: Option<PathBuf>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryItem {
    pub id: JobId,
    pub name: String,
    pub destination_root: PathBuf,
    pub started_at_ms: i64,
    pub duration_ms: u64,
    pub moved: u64,
    pub skipped: u64,
    pub errors: u64,
    pub state: JobStatus,
}
