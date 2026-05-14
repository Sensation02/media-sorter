import { describe, expect, it } from "vitest";

import { SORT_SCREEN } from "../constants/screens";
import { resolveScreen } from "./resolve-screen";

describe("resolveScreen", () => {
    it("returns the input screen when it is not progress", () => {
        expect(resolveScreen(SORT_SCREEN.setup, "running")).toBe(SORT_SCREEN.setup);
        expect(resolveScreen(SORT_SCREEN.history, "idle")).toBe(SORT_SCREEN.history);
        expect(resolveScreen(SORT_SCREEN.settings, "error")).toBe(SORT_SCREEN.settings);
    });

    it("stays on progress when the job is done so the user can review counters", () => {
        expect(resolveScreen(SORT_SCREEN.progress, "done")).toBe(SORT_SCREEN.progress);
    });

    it("falls back to setup when on progress with status=error", () => {
        expect(resolveScreen(SORT_SCREEN.progress, "error")).toBe(SORT_SCREEN.setup);
    });

    it("stays on progress for running/idle while still on progress", () => {
        expect(resolveScreen(SORT_SCREEN.progress, "running")).toBe(SORT_SCREEN.progress);
        expect(resolveScreen(SORT_SCREEN.progress, "idle")).toBe(SORT_SCREEN.progress);
    });
});
