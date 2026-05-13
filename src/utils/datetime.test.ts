import i18next from "i18next";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { formatDateTime } from "./datetime";
import { initI18n, LANGUAGE_CODE_EN, LANGUAGE_CODE_UK } from "../i18n";

describe("formatDateTime", () => {
    beforeAll(async () => {
        await initI18n(LANGUAGE_CODE_EN);
    });

    beforeEach(async () => {
        await i18next.changeLanguage(LANGUAGE_CODE_EN);
    });

    it("formats date with English locale by default", () => {
        const result = formatDateTime(new Date(2024, 3, 15), "MMM d, yyyy");
        expect(result).toBe("Apr 15, 2024");
    });

    it("formats date with Ukrainian locale when language is uk", async () => {
        await i18next.changeLanguage(LANGUAGE_CODE_UK);
        const result = formatDateTime(new Date(2024, 3, 15), "LLLL");
        expect(result.toLowerCase()).toContain("квіт");
    });

    it("falls back to English when active language is not in locale map", async () => {
        await i18next.changeLanguage("fr");
        const result = formatDateTime(new Date(2024, 3, 15), "MMM d, yyyy");
        expect(result).toBe("Apr 15, 2024");
    });
});
