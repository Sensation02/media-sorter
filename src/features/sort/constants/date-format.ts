import type { DateFormatId } from "../../../types/ipc";

export type DateFormatOption = {
    id: DateFormatId;
    labelKey: string;
    exampleKey: string;
};

export const DATE_FORMAT_OPTIONS: readonly DateFormatOption[] = [
    {
        id: "localized-month-year",
        labelKey: "dateFormatLocalizedMonthYear",
        exampleKey: "dateFormatLocalizedMonthYearExample",
    },
    {
        id: "year-localized-month",
        labelKey: "dateFormatYearLocalizedMonth",
        exampleKey: "dateFormatYearLocalizedMonthExample",
    },
    {
        id: "iso-month",
        labelKey: "dateFormatIsoMonth",
        exampleKey: "dateFormatIsoMonthExample",
    },
    {
        id: "iso-month-nested",
        labelKey: "dateFormatIsoMonthNested",
        exampleKey: "dateFormatIsoMonthNestedExample",
    },
    {
        id: "iso-day-nested",
        labelKey: "dateFormatIsoDayNested",
        exampleKey: "dateFormatIsoDayNestedExample",
    },
    {
        id: "iso-month-localized",
        labelKey: "dateFormatIsoMonthLocalized",
        exampleKey: "dateFormatIsoMonthLocalizedExample",
    },
] as const;
