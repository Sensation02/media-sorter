use serde::{Deserialize, Serialize};

use crate::domain::{JobId, ScanId, SortPlan, SortRuleId, SortSettings};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewPlanRequest {
    pub scan_id: ScanId,
    pub rule: SortRuleId,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartSortRequest {
    pub plan: SortPlan,
    pub settings: SortSettings,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobIdRequest {
    pub job_id: JobId,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StartSortResponse {
    pub job_id: JobId,
}
