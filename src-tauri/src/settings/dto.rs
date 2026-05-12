use serde::{Deserialize, Serialize};

use crate::domain::{AppSettings, SessionMemo};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetSettingsRequest {
    pub settings: AppSettings,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetMemoRequest {
    pub memo: SessionMemo,
}
