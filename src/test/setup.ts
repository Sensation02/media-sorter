import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

import { initI18n, LANGUAGE_CODE_EN } from "../i18n";

beforeAll(async () => {
    await initI18n(LANGUAGE_CODE_EN);
});

afterEach(() => {
    cleanup();
});
