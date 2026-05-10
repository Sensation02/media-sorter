use serde::{Deserialize, Serialize};
use std::path::PathBuf;

use crate::domain::{ScanId, ScanSummary};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanSourceRequest {
    pub path: PathBuf,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResponse {
    pub scan_id: ScanId,
    pub summary: ScanSummary,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RevealRequest {
    pub path: PathBuf,
}
