import { describe, expect, it } from "vitest";

import { formatHistoryDate, formatHistoryDuration } from "./history-format";

const NOW = new Date(2026, 4, 10, 14, 30, 0).getTime();

describe("formatHistoryDate", () => {
    it("renders 'Today, HH:mm' for a timestamp earlier the same day", () => {
        const earlier = new Date(2026, 4, 10, 9, 5, 0).getTime();

        expect(formatHistoryDate(earlier, NOW)).toBe("Today, 09:05");
    });

    it("renders 'Yesterday, HH:mm' for a timestamp on the previous calendar day", () => {
        const yesterday = new Date(2026, 4, 9, 23, 59, 0).getTime();

        expect(formatHistoryDate(yesterday, NOW)).toBe("Yesterday, 23:59");
    });

    it("renders 'Mon DD, HH:mm' for an earlier day in the same year", () => {
        const earlierInYear = new Date(2026, 1, 28, 19, 2, 0).getTime();

        expect(formatHistoryDate(earlierInYear, NOW)).toBe("Feb 28, 19:02");
    });

    it("renders 'Mon DD YYYY, HH:mm' for an earlier year", () => {
        const previousYear = new Date(2024, 7, 14, 9, 11, 0).getTime();

        expect(formatHistoryDate(previousYear, NOW)).toBe("Aug 14 2024, 09:11");
    });
});

describe("formatHistoryDuration", () => {
    it("renders MM:SS for sub-hour durations", () => {
        expect(formatHistoryDuration(2 * 60 * 1000 + 18 * 1000)).toBe("02:18");
        expect(formatHistoryDuration(48 * 1000)).toBe("00:48");
    });

    it("renders HH:MM:SS for durations of an hour or longer", () => {
        expect(formatHistoryDuration(3 * 60 * 60 * 1000 + 7 * 60 * 1000 + 9 * 1000)).toBe(
            "03:07:09",
        );
    });

    it("falls back to '—' for non-finite or negative inputs", () => {
        expect(formatHistoryDuration(-1)).toBe("—");
        expect(formatHistoryDuration(Number.NaN)).toBe("—");
    });
});
