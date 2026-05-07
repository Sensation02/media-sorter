use std::fmt::Display;

use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Clone, Error, Serialize)]
#[serde(
    tag = "code",
    content = "params",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum AppError {
    #[error("io error: {message}")]
    Io { message: String },

    #[error("validation error: {message}")]
    Validation { message: String },

    #[error("permission denied: {path}")]
    Forbidden { path: String },

    #[error("conflict at {path}")]
    Conflict { path: String },

    #[error("internal error: {message}")]
    Internal { message: String },
}

impl AppError {
    pub fn internal(message: impl Display) -> Self {
        Self::Internal {
            message: message.to_string(),
        }
    }

    pub fn validation(message: impl Display) -> Self {
        Self::Validation {
            message: message.to_string(),
        }
    }

    pub fn io(message: impl Display) -> Self {
        Self::Io {
            message: message.to_string(),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        Self::Io {
            message: error.to_string(),
        }
    }
}

pub type AppResult<T> = Result<T, AppError>;
