import {
    DEFAULT_RETENTION_LABELS,
    LAST_RETENTION_PRESET,
    RETENTION_PRESETS,
    type RetentionPreset,
} from "../constants/retention";

export function snapToPreset(days: number): number {
    const match = RETENTION_PRESETS.find((preset) => preset.days >= days);

    return (match ?? LAST_RETENTION_PRESET).days;
}

export function retentionLabel(preset: RetentionPreset, language: string): string {
    return preset.labels[language] ?? preset.labels.en ?? DEFAULT_RETENTION_LABELS.en;
}
