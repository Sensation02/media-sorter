use serde::Serialize;

use crate::domain::{JobId, JobStatus};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SortProgressDto {
    pub total: u64,
    pub processed: u64,
    pub moved: u64,
    pub skipped: u64,
    pub folders: u64,
    pub current: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SortLogLevelDto {
    Ok,
    Warn,
    Error,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SortLogEntryDto {
    pub time: String,
    pub level: SortLogLevelDto,
    pub text: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SortDoneDto {
    pub job_id: JobId,
    pub state: JobStatus,
    pub duration_ms: u64,
    pub moved: u64,
    pub skipped: u64,
    pub folders: u64,
    pub destination: String,
}
