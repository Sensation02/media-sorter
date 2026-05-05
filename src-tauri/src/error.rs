use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Clone, Error, Serialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
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
    pub fn internal(message: impl Into<String>) -> Self {
        Self::Internal {
            message: message.into(),
        }
    }

    pub fn validation(message: impl Into<String>) -> Self {
        Self::Validation {
            message: message.into(),
        }
    }

    pub fn io(message: impl Into<String>) -> Self {
        Self::Io {
            message: message.into(),
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
