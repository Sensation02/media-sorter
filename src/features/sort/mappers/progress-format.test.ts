import { describe, expect, it } from "vitest";

import { formatElapsed, formatEta } from "./progress-format";

describe("formatElapsed", () => {
    it("returns 00:00 for zero", () => {
        expect(formatElapsed(0)).toBe("00:00");
    });

    it("formats seconds under a minute", () => {
        expect(formatElapsed(42_000)).toBe("00:42");
    });

    it("formats minutes and seconds", () => {
        expect(formatElapsed(75_000)).toBe("01:15");
    });

    it("formats large durations beyond an hour as MM:SS", () => {
        expect(formatElapsed(3_660_000)).toBe("61:00");
    });

    it("returns 00:00 for negative input", () => {
        expect(formatElapsed(-1)).toBe("00:00");
    });

    it("returns 00:00 for NaN", () => {
        expect(formatElapsed(Number.NaN)).toBe("00:00");
    });

    it("returns 00:00 for Infinity", () => {
        expect(formatElapsed(Number.POSITIVE_INFINITY)).toBe("00:00");
    });
});

describe("formatEta", () => {
    it("returns em dash when total is zero", () => {
        expect(formatEta(0, 0, 0)).toBe("—");
    });

    it("returns em dash when processed is zero", () => {
        expect(formatEta(0, 100, 1_000)).toBe("—");
    });

    it("returns em dash when elapsed is zero", () => {
        expect(formatEta(10, 100, 0)).toBe("—");
    });

    it("returns 00:00 remaining when processed equals total", () => {
        expect(formatEta(100, 100, 60_000)).toBe("00:00 remaining");
    });

    it("returns 00:00 remaining when processed exceeds total", () => {
        expect(formatEta(120, 100, 60_000)).toBe("00:00 remaining");
    });

    it("extrapolates ETA from current count rate", () => {
        expect(formatEta(50, 100, 60_000)).toBe("01:00 remaining");
    });

    it("returns em dash for non-finite total", () => {
        expect(formatEta(10, Number.NaN, 1_000)).toBe("—");
    });

    it("returns em dash for negative processed", () => {
        expect(formatEta(-1, 100, 1_000)).toBe("—");
    });
});
