import { describe, expect, it } from "vitest";

import type { SortRule } from "../../../types/sort";
import { resolveDefaultRule } from "./resolve-default-rule";

const RULES: SortRule[] = [
    { id: "by-date", name: "By date", hint: "", description: "" },
    { id: "by-date-and-place", name: "By date and place", hint: "", description: "" },
    { id: "by-type", name: "By type", hint: "", description: "" },
];

const FALLBACK = "by-date" as const;

describe("resolveDefaultRule", () => {
    it("returns the fallback when preferred is null", () => {
        expect(resolveDefaultRule(null, RULES, FALLBACK)).toBe(FALLBACK);
    });

    it("returns the fallback when preferred is undefined", () => {
        expect(resolveDefaultRule(undefined, RULES, FALLBACK)).toBe(FALLBACK);
    });

    it("returns the preferred id when it exists in the rules list", () => {
        expect(resolveDefaultRule("by-type", RULES, FALLBACK)).toBe("by-type");
    });

    it("returns the fallback when preferred is not in the rules list", () => {
        expect(resolveDefaultRule("by-camera", RULES, FALLBACK)).toBe(FALLBACK);
    });
});
