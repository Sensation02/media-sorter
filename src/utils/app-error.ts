import type { AppErrorCode, AppErrorDto } from "../types/ipc";

const FALLBACK_MESSAGE = "Something went wrong";
const UNKNOWN_PATH_LABEL = "selected folder";

const TITLES: Record<AppErrorCode, string> = {
  io: "Cannot read folder",
  validation: "Invalid input",
  forbidden: "Permission denied",
  conflict: "Path conflict",
  internal: "Unexpected error",
};

export type ToastErrorView = {
  title: string;
  detail: string;
};

export function isAppErrorDto(value: unknown): value is AppErrorDto {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { code?: unknown; params?: unknown };

  return typeof candidate.code === "string" && typeof candidate.params === "object";
}

export function toAppErrorView(error: unknown): ToastErrorView {
  if (isAppErrorDto(error)) {
    return { title: TITLES[error.code], detail: detailFor(error) };
  }

  if (error instanceof Error) {
    return { title: TITLES.internal, detail: error.message || FALLBACK_MESSAGE };
  }

  if (typeof error === "string" && error.length > 0) {
    return { title: TITLES.internal, detail: error };
  }

  return { title: TITLES.internal, detail: FALLBACK_MESSAGE };
}

function detailFor(error: AppErrorDto): string {
  switch (error.code) {
    case "io":
    case "validation":
    case "internal":
      return error.params.message || FALLBACK_MESSAGE;
    case "forbidden":
    case "conflict":
      return error.params.path || UNKNOWN_PATH_LABEL;
  }
}
