export type MediaKind = "photo" | "raw" | "video";

export type SortRuleId = "by-date" | "by-date-and-place" | "by-type" | "by-camera";

export type DateSource = "exif" | "mtime" | "unknown";

export type JobStatus =
  | "idle"
  | "running"
  | "paused"
  | "done"
  | "cancelled"
  | "failed"
  | "reverted";

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type Place = {
  name: string;
  country: string | null;
};

export type Camera = {
  make: string | null;
  model: string | null;
};

export type CaptureDate = {
  at: string;
  source: DateSource;
};

export type Metadata = {
  capture: CaptureDate | null;
  geo: GeoPoint | null;
  camera: Camera | null;
};

export type MediaFile = {
  path: string;
  sizeBytes: number;
  kind: MediaKind;
};

export type ByKind = {
  photos: number;
  raw: number;
  videos: number;
};

export type ScanSummary = {
  root: string;
  fileCount: number;
  sizeBytes: number;
  byKind: ByKind;
};

export type ScanId = number;

export type ScanResponse = {
  scanId: ScanId;
  summary: ScanSummary;
};

export type SortPlanItem = {
  source: string;
  target: string;
};

export type SortPlan = {
  rule: SortRuleId;
  root: string;
  items: SortPlanItem[];
};

export type JobId = number;

export type MoveOp = {
  from: string;
  to: string;
  atMs: number;
};

export type SortSettingsDto = {
  copy: boolean;
  skipDuplicates: boolean;
  watchSource: boolean;
  writeReport: boolean;
};

export type HistoryItemDto = {
  id: JobId;
  name: string;
  destinationRoot: string;
  startedAtMs: number;
  durationMs: number;
  moved: number;
  skipped: number;
  errors: number;
  state: JobStatus;
};

export type RevertOutcomeDto = {
  jobId: JobId;
  restored: number;
  skipped: number;
  errors: number;
};

export type AppErrorCode = "io" | "validation" | "forbidden" | "conflict" | "internal";

export type AppErrorDto =
  | { code: "io"; params: { message: string } }
  | { code: "validation"; params: { message: string } }
  | { code: "forbidden"; params: { path: string } }
  | { code: "conflict"; params: { path: string } }
  | { code: "internal"; params: { message: string } };

export type SortLogLevelDto = "ok" | "warn" | "error";

export type SortLogEntryDto = {
  time: string;
  level: SortLogLevelDto;
  text: string;
};

export type SortProgressDto = {
  total: number;
  processed: number;
  moved: number;
  skipped: number;
  folders: number;
  current: string;
};

export type SortDoneDto = {
  jobId: JobId;
  state: JobStatus;
  durationMs: number;
  moved: number;
  skipped: number;
  folders: number;
  destination: string;
};
