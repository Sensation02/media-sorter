const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;

const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
] as const;

export function formatHistoryDate(timestampMs: number, nowMs: number): string {
    const at = new Date(timestampMs);
    const now = new Date(nowMs);
    const time = `${pad2(at.getHours())}:${pad2(at.getMinutes())}`;

    if (isSameLocalDay(at, now)) {
        return `Today, ${time}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameLocalDay(at, yesterday)) {
        return `Yesterday, ${time}`;
    }

    const monthDay = `${MONTH_NAMES[at.getMonth()]} ${at.getDate()}`;

    if (at.getFullYear() === now.getFullYear()) {
        return `${monthDay}, ${time}`;
    }

    return `${monthDay} ${at.getFullYear()}, ${time}`;
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
