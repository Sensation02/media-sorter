import i18next from "i18next";

export function formatNumber(value: number): string {
    return new Intl.NumberFormat(i18next.language).format(value);
}
