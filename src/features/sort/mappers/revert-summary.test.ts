import { describe, expect, it } from "vitest";

import { revertSummaryParts } from "./revert-summary";

describe("revertSummaryParts", () => {
    it("returns restored count along with zero counters", () => {
        expect(revertSummaryParts(12, 0, 0)).toEqual({ restored: 12, skipped: 0, errors: 0 });
    });

    it("preserves skipped count", () => {
        expect(revertSummaryParts(12, 3, 0)).toEqual({ restored: 12, skipped: 3, errors: 0 });
    });

    it("preserves errors count", () => {
        expect(revertSummaryParts(12, 0, 2)).toEqual({ restored: 12, skipped: 0, errors: 2 });
    });

    it("preserves all three counters", () => {
        expect(revertSummaryParts(12, 3, 2)).toEqual({ restored: 12, skipped: 3, errors: 2 });
    });

    it("handles zero restored", () => {
        expect(revertSummaryParts(0, 0, 0)).toEqual({ restored: 0, skipped: 0, errors: 0 });
    });
});
