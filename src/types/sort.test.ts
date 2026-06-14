import { describe, expect, it } from "vitest";

import { isDateFormatId, isSortRuleId } from "./sort";

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

describe("isDateFormatId", () => {
    it("accepts all six wire values", () => {
        expect(isDateFormatId("localized-month-year")).toBe(true);
        expect(isDateFormatId("year-localized-month")).toBe(true);
        expect(isDateFormatId("iso-month")).toBe(true);
        expect(isDateFormatId("iso-month-nested")).toBe(true);
        expect(isDateFormatId("iso-day-nested")).toBe(true);
        expect(isDateFormatId("iso-month-localized")).toBe(true);
    });

    it("rejects unknown ids", () => {
        expect(isDateFormatId("by-date")).toBe(false);
        expect(isDateFormatId("")).toBe(false);
        expect(isDateFormatId("iso")).toBe(false);
    });
});
