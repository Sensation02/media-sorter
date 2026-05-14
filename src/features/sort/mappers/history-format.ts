import { formatDateTime } from "../../../utils/datetime";

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;

const TIME_PATTERN = "HH:mm";
const MONTH_DAY_PATTERN = "MMM d";

export type HistoryDateParts =
    | { kind: "today"; time: string }
    | { kind: "yesterday"; time: string }
    | { kind: "thisYear"; monthDay: string; time: string }
    | { kind: "otherYear"; monthDay: string; year: number; time: string };

export function historyDateParts(timestampMs: number, nowMs: number): HistoryDateParts {
    const at = new Date(timestampMs);
    const now = new Date(nowMs);
    const time = formatDateTime(at, TIME_PATTERN);

    if (isSameLocalDay(at, now)) {
        return { kind: "today", time };
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (isSameLocalDay(at, yesterday)) {
        return { kind: "yesterday", time };
    }

    const monthDay = formatDateTime(at, MONTH_DAY_PATTERN);

    if (at.getFullYear() === now.getFullYear()) {
        return { kind: "thisYear", monthDay, time };
    }

    return { kind: "otherYear", monthDay, year: at.getFullYear(), time };
}

export function formatHistoryDuration(durationMs: number): string {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
        return "—";
    }

    if (durationMs >= MS_PER_HOUR) {
        const hours = Math.floor(durationMs / MS_PER_HOUR);
        const minutes = Math.floor((durationMs % MS_PER_HOUR) / MS_PER_MINUTE);
        const seconds = Math.floor((durationMs % MS_PER_MINUTE) / MS_PER_SECOND);

        return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
    }

    const minutes = Math.floor(durationMs / MS_PER_MINUTE);
    const seconds = Math.floor((durationMs % MS_PER_MINUTE) / MS_PER_SECOND);

    return `${pad2(minutes)}:${pad2(seconds)}`;
}

function pad2(n: number): string {
    return n.toString().padStart(2, "0");
}

function isSameLocalDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}
