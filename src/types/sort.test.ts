import { describe, expect, it } from "vitest";

import { isSortRuleId } from "./sort";

describe("isSortRuleId", () => {
    it("accepts known ids", () => {
        expect(isSortRuleId("by-date-and-place")).toBe(true);
        expect(isSortRuleId("by-date")).toBe(true);
        expect(isSortRuleId("by-type")).toBe(true);
        expect(isSortRuleId("by-camera")).toBe(true);
    });

    it("rejects unknown ids", () => {
        expect(isSortRuleId("by-everything")).toBe(false);
        expect(isSortRuleId("")).toBe(false);
        expect(isSortRuleId("BY-DATE")).toBe(false);
    });
});
