import { LAST_RETENTION_PRESET, RETENTION_PRESETS } from "../constants/retention";

const RETENTION_LABEL_KEY: Record<number, string> = {
    7: "retention1Week",
    30: "retention1Month",
    90: "retention3Months",
    180: "retention6Months",
    365: "retention12Months",
};

export function snapToPreset(days: number): number {
    const match = RETENTION_PRESETS.find((preset) => preset.days >= days);

    return (match ?? LAST_RETENTION_PRESET).days;
}

export function retentionLabelKey(days: number): string {
    return RETENTION_LABEL_KEY[days] ?? "retention1Month";
}
