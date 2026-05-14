import { formatSubSecond, isSubSecond } from "./duration";

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

const PAD_WIDTH = 2;
const PAD_CHAR = "0";

const EMPTY_ETA = "—";
const ZERO_TIME = "00:00";
const REMAINING_SUFFIX = "remaining";

/**
 * Format an elapsed millisecond duration as `MM:SS` once at least one second
 * has passed, falling back to `0.4 s` style for the first second so quick
 * jobs do not display a stuck `00:00`. Negative or non-finite inputs
 * collapse to `00:00`.
 */
export function formatElapsed(elapsedMs: number): string {
    if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
        return ZERO_TIME;
    }

    if (isSubSecond(elapsedMs)) {
        return formatSubSecond(elapsedMs);
    }

    return formatMinutesSeconds(elapsedMs, Math.floor);
}

/**
 * Format an estimated time remaining as `MM:SS remaining`.
 *
 * Uses count-rate extrapolation: `(total - processed) / (processed / elapsedMs)`.
 * Returns `—` while no progress has been made or inputs are unusable.
 */
export function formatEta(processed: number, total: number, elapsedMs: number): string {
    if (!isUsableCount(total) || !isUsableCount(processed) || !Number.isFinite(elapsedMs)) {
        return EMPTY_ETA;
    }

    if (total === 0) {
        return EMPTY_ETA;
    }

    if (processed >= total) {
        return `${ZERO_TIME} ${REMAINING_SUFFIX}`;
    }

    if (processed <= 0 || elapsedMs <= 0) {
        return EMPTY_ETA;
    }

    const remainingItems = total - processed;
    const ratePerMs = processed / elapsedMs;
    const remainingMs = remainingItems / ratePerMs;

    return `${formatMinutesSeconds(remainingMs, Math.round)} ${REMAINING_SUFFIX}`;
}

function isUsableCount(value: number): boolean {
    return Number.isFinite(value) && value >= 0;
}

function formatMinutesSeconds(ms: number, secondsRounding: (value: number) => number): string {
    if (!Number.isFinite(ms) || ms <= 0) {
        return ZERO_TIME;
    }

    const totalSeconds = secondsRounding(ms / MS_PER_SECOND);
    const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
    const seconds = totalSeconds % SECONDS_PER_MINUTE;

    return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(value: number): string {
    return value.toString().padStart(PAD_WIDTH, PAD_CHAR);
}
