import { afterAll, beforeAll, describe, expect, it } from "vitest";

import i18next from "i18next";

import { DEFAULT_LOCALE, initI18n, LANGUAGE_CODE_EN } from "../../../i18n";
import { formatHistoryDuration, historyDateParts } from "./history-format";

const NOW = new Date(2026, 4, 10, 14, 30, 0).getTime();

let previousLanguage: string | undefined;

beforeAll(async () => {
    await initI18n(DEFAULT_LOCALE);
    previousLanguage = i18next.language;
    await i18next.changeLanguage(LANGUAGE_CODE_EN);
});

afterAll(async () => {
    if (previousLanguage !== undefined) {
        await i18next.changeLanguage(previousLanguage);
    }
});

describe("historyDateParts", () => {
    it("returns 'today' for a timestamp earlier the same day", () => {
        const earlier = new Date(2026, 4, 10, 9, 5, 0).getTime();

        expect(historyDateParts(earlier, NOW)).toEqual({ kind: "today", time: "09:05" });
    });

    it("returns 'yesterday' for a timestamp on the previous calendar day", () => {
        const yesterday = new Date(2026, 4, 9, 23, 59, 0).getTime();

        expect(historyDateParts(yesterday, NOW)).toEqual({ kind: "yesterday", time: "23:59" });
    });

    it("returns 'thisYear' for an earlier day in the same year", () => {
        const earlierInYear = new Date(2026, 1, 28, 19, 2, 0).getTime();

        expect(historyDateParts(earlierInYear, NOW)).toEqual({
            kind: "thisYear",
            monthDay: "Feb 28",
            time: "19:02",
        });
    });

    it("returns 'otherYear' for an earlier year", () => {
        const previousYear = new Date(2024, 7, 14, 9, 11, 0).getTime();

        expect(historyDateParts(previousYear, NOW)).toEqual({
            kind: "otherYear",
            monthDay: "Aug 14",
            year: 2024,
            time: "09:11",
        });
    });
});

describe("formatHistoryDuration", () => {
    it("renders sub-second durations as decimal seconds", () => {
        expect(formatHistoryDuration(0)).toBe("0.0 s");
        expect(formatHistoryDuration(400)).toBe("0.4 s");
        expect(formatHistoryDuration(900)).toBe("0.9 s");
    });

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
