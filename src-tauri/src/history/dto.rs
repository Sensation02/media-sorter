use serde::{Deserialize, Serialize};

use crate::domain::JobId;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RevertOutcome {
    pub job_id: JobId,
    pub restored: u64,
    pub skipped: u64,
    pub errors: u64,
}
