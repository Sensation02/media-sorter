import i18next from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";

import enCommon from "./en/common";
import enDone from "./en/done";
import enHistory from "./en/history";
import enProgress from "./en/progress";
import enRules from "./en/rules";
import enSettings from "./en/settings";
import enSetup from "./en/setup";
import ukCommon from "./uk/common";
import ukDone from "./uk/done";
import ukHistory from "./uk/history";
import ukProgress from "./uk/progress";
import ukRules from "./uk/rules";
import ukSettings from "./uk/settings";
import ukSetup from "./uk/setup";

export const LANGUAGE_CODE_EN = "en" as const;
export const LANGUAGE_CODE_UK = "uk" as const;

export type Locale = typeof LANGUAGE_CODE_EN | typeof LANGUAGE_CODE_UK;

export type LocaleEntry = {
    code: Locale;
    nativeName: string;
};

export const SUPPORTED_LOCALES: readonly LocaleEntry[] = [
    { code: LANGUAGE_CODE_EN, nativeName: "English" },
    { code: LANGUAGE_CODE_UK, nativeName: "Українська" },
] as const;

export const DEFAULT_LOCALE: Locale = LANGUAGE_CODE_EN;

export const I18N_NAMESPACES = [
    "common",
    "setup",
    "progress",
    "done",
    "history",
    "settings",
    "rules",
] as const;

const resources = {
    [LANGUAGE_CODE_EN]: {
        common: enCommon,
        setup: enSetup,
        progress: enProgress,
        done: enDone,
        history: enHistory,
        settings: enSettings,
        rules: enRules,
    },
    [LANGUAGE_CODE_UK]: {
        common: ukCommon,
        setup: ukSetup,
        progress: ukProgress,
        done: ukDone,
        history: ukHistory,
        settings: ukSettings,
        rules: ukRules,
    },
} as const;

export async function initI18n(initialLocale: Locale): Promise<void> {
    if (i18next.isInitialized) {
        await i18next.changeLanguage(initialLocale);
        return;
    }

    await i18next.use(initReactI18next).init({
        resources,
        lng: initialLocale,
        fallbackLng: DEFAULT_LOCALE,
        ns: I18N_NAMESPACES,
        defaultNS: "common",
        interpolation: { escapeValue: false },
    });
}

export async function changeLocale(next: Locale): Promise<void> {
    await i18next.changeLanguage(next);
}

export function isSupportedLocale(value: string): value is Locale {
    return SUPPORTED_LOCALES.some((entry) => entry.code === value);
}

export { useTranslation };
