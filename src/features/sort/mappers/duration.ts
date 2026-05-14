import i18next from "i18next";

const MS_PER_SECOND = 1000;
const SUB_SECOND_FRACTION_DIGITS = 1;

export function formatSubSecond(ms: number): string {
    const seconds = ms / MS_PER_SECOND;
    const formatter = new Intl.NumberFormat(i18next.language, {
        minimumFractionDigits: SUB_SECOND_FRACTION_DIGITS,
        maximumFractionDigits: SUB_SECOND_FRACTION_DIGITS,
    });

    return i18next.t("common:secondsShort", { value: formatter.format(seconds) });
}

export function isSubSecond(ms: number): boolean {
    return Number.isFinite(ms) && ms >= 0 && ms < MS_PER_SECOND;
}
