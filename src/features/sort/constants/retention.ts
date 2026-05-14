export type RetentionPreset = {
    days: number;
};

export const RETENTION_PRESETS: readonly [RetentionPreset, ...RetentionPreset[]] = [
    { days: 7 },
    { days: 30 },
    { days: 90 },
    { days: 180 },
    { days: 365 },
];

export const LAST_RETENTION_PRESET: RetentionPreset =
    RETENTION_PRESETS[RETENTION_PRESETS.length - 1] ?? RETENTION_PRESETS[0];
