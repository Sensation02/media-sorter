import type {
  SortDone,
  SortHistoryItem,
  SortProgress,
  SortRule,
  SortSettings,
} from "../../types/sort";

export const DEFAULT_RULES: SortRule[] = [
  {
    id: "by-date-and-place",
    name: "By date and place",
    hint: "<Month Year>/<City, Country>",
    description: "Group by capture month, then by reverse-geocoded city.",
  },
  {
    id: "by-date",
    name: "By date",
    hint: "<Month Year>",
    description: "Group by capture month.",
  },
  {
    id: "by-type",
    name: "By type",
    hint: "Photos / Videos / RAW",
    description: "Group by file kind.",
  },
  {
    id: "by-camera",
    name: "By camera",
    hint: "EXIF make + model",
    description: "Group by camera make and model.",
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
  current: "IMG_4821.HEIC → 2024/08-August/",
  log: [
    { time: "00:42.1", level: "ok", text: "IMG_4821.HEIC → 2024/08-August/" },
    { time: "00:42.0", level: "ok", text: "IMG_4820.HEIC → 2024/08-August/" },
    { time: "00:41.8", level: "warn", text: "IMG_4819.JPG → skipped (no EXIF date)" },
    { time: "00:41.7", level: "ok", text: "IMG_4818.HEIC → 2024/08-August/" },
    { time: "00:41.5", level: "ok", text: "DSC_0203.RAW → 2024/08-August/" },
    { time: "00:41.3", level: "ok", text: "IMG_4817.HEIC → 2024/08-August/" },
  ],
};

export const DEFAULT_DONE: SortDone = {
  moved: 1236,
  skipped: 11,
  folders: 14,
  duration: "02:18",
  destination: "~/Pictures/Imports/2024-vacation → sorted by date",
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
