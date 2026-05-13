export type RetentionPreset = {
    days: number;
    labels: Record<string, string>;
};

export const DEFAULT_RETENTION_LABELS = { en: "1 month", uk: "1 місяць" } as const;

export const RETENTION_PRESETS: readonly [RetentionPreset, ...RetentionPreset[]] = [
    { days: 7, labels: { en: "1 week", uk: "1 тиждень" } },
    { days: 30, labels: DEFAULT_RETENTION_LABELS },
    { days: 90, labels: { en: "3 months", uk: "3 місяці" } },
    { days: 180, labels: { en: "6 months", uk: "6 місяців" } },
    { days: 365, labels: { en: "12 months", uk: "12 місяців" } },
];

export const LAST_RETENTION_PRESET: RetentionPreset =
    RETENTION_PRESETS[RETENTION_PRESETS.length - 1] ?? RETENTION_PRESETS[0];
