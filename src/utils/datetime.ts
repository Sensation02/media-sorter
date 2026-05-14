import { format as dfFormat, type Locale as DateFnsLocale } from "date-fns";
import { enUS, uk } from "date-fns/locale";
import i18next from "i18next";

import { isSupportedLocale, LANGUAGE_CODE_EN, LANGUAGE_CODE_UK, type Locale } from "../i18n";

const LOCALE_MAP: Record<Locale, DateFnsLocale> = {
    [LANGUAGE_CODE_EN]: enUS,
    [LANGUAGE_CODE_UK]: uk,
};

const DEFAULT_DATE_FNS_LOCALE = enUS;

export function formatDateTime(date: Date, pattern: string): string {
    const active = i18next.language;
    const locale = isSupportedLocale(active) ? LOCALE_MAP[active] : DEFAULT_DATE_FNS_LOCALE;

    return dfFormat(date, pattern, { locale });
}
