import type {
  SortDone,
  SortHistoryItem,
  SortProgress,
  SortRule,
  SortSettings,
  SortSource,
} from "../../types/sort";

export const DEFAULT_SOURCE: SortSource = {
  path: "~/Pictures/Imports/2024-vacation",
  fileCount: 1247,
  size: "8.4 GB",
};

export const DEFAULT_RULES: SortRule[] = [
  {
    id: "by-date",
    name: "By date",
    hint: "EXIF \u2192 YYYY/MM",
    description: "Group by capture date from EXIF metadata.",
    preview: [
      {
        kind: "folder",
        label: "2024",
        children: [
          {
            kind: "folder",
            label: "08-August",
            children: [{ kind: "file", label: "247 files" }],
          },
          {
            kind: "folder",
            label: "07-July",
            children: [{ kind: "file", label: "189 files" }],
          },
        ],
      },
      { kind: "folder", label: "2023", muted: true, children: [] },
    ],
  },
  {
    id: "by-type",
    name: "By type",
    hint: "Photos / Videos / RAW",
    description: "Group by file kind.",
    preview: [
      { kind: "folder", label: "Photos", children: [{ kind: "file", label: "892 files" }] },
      { kind: "folder", label: "Videos", children: [{ kind: "file", label: "201 files" }] },
      { kind: "folder", label: "RAW", children: [{ kind: "file", label: "154 files" }] },
    ],
  },
  {
    id: "by-camera",
    name: "By camera",
    hint: "EXIF make + model",
    description: "Group by camera make and model.",
    preview: [
      { kind: "folder", label: "Sony A7 IV", children: [{ kind: "file", label: "612 files" }] },
      { kind: "folder", label: "iPhone 15 Pro", children: [{ kind: "file", label: "521 files" }] },
      { kind: "folder", label: "DJI Mini 3", children: [{ kind: "file", label: "114 files" }] },
    ],
  },
];

export const DEFAULT_PROGRESS: SortProgress = {
  total: 1247,
  processed: 482,
  moved: 471,
  skipped: 11,
  folders: 14,
  elapsed: "00:42",
  remaining: "01:14 remaining",
  current: "IMG_4821.HEIC \u2192 2024/08-August/",
  log: [
    { time: "00:42.1", level: "ok", text: "IMG_4821.HEIC \u2192 2024/08-August/" },
    { time: "00:42.0", level: "ok", text: "IMG_4820.HEIC \u2192 2024/08-August/" },
    { time: "00:41.8", level: "warn", text: "IMG_4819.JPG \u2192 skipped (no EXIF date)" },
    { time: "00:41.7", level: "ok", text: "IMG_4818.HEIC \u2192 2024/08-August/" },
    { time: "00:41.5", level: "ok", text: "DSC_0203.RAW \u2192 2024/08-August/" },
    { time: "00:41.3", level: "ok", text: "IMG_4817.HEIC \u2192 2024/08-August/" },
  ],
};

export const DEFAULT_DONE: SortDone = {
  moved: 1236,
  skipped: 11,
  folders: 14,
  duration: "02:18",
  destination: "~/Pictures/Imports/2024-vacation \u2192 sorted by date",
};

export const DEFAULT_HISTORY: SortHistoryItem[] = [
  {
    id: 1,
    name: "2024-vacation",
    date: "Today, 14:32",
    moved: 1236,
    skipped: 11,
    duration: "02:18",
  },
  {
    id: 2,
    name: "iphone-backup-mar",
    date: "Mar 14, 09:11",
    moved: 4218,
    skipped: 0,
    duration: "06:54",
  },
  {
    id: 3,
    name: "drone-shoot-feb",
    date: "Feb 28, 19:02",
    moved: 312,
    skipped: 4,
    duration: "00:48",
  },
];

export const DEFAULT_SETTINGS: SortSettings = {
  copy: false,
  skipDuplicates: true,
  watchSource: false,
  writeReport: true,
};
