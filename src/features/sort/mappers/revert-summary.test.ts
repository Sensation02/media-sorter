import { describe, expect, it } from "vitest";

import { revertSummary } from "./revert-summary";

describe("revertSummary", () => {
    it("reports restored count only when no skips and no errors", () => {
        expect(revertSummary(12, 0, 0)).toBe("12 restored");
    });

    it("includes skipped when non-zero", () => {
        expect(revertSummary(12, 3, 0)).toBe("12 restored, 3 skipped");
    });

    it("includes errors when non-zero", () => {
        expect(revertSummary(12, 0, 2)).toBe("12 restored, 2 errors");
    });

    it("includes both skipped and errors when both non-zero", () => {
        expect(revertSummary(12, 3, 2)).toBe("12 restored, 3 skipped, 2 errors");
    });

    it("handles zero restored", () => {
        expect(revertSummary(0, 0, 0)).toBe("0 restored");
    });
});
