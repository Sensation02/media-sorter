import type { TFunction } from "i18next";

import type { HistoryDateParts } from "../../mappers/history-format";

export function renderHistoryDate(t: TFunction<"history">, parts: HistoryDateParts): string {
    switch (parts.kind) {
        case "today":
            return t("today", { time: parts.time });
        case "yesterday":
            return t("yesterday", { time: parts.time });
        case "thisYear":
            return t("dateThisYear", { monthDay: parts.monthDay, time: parts.time });
        case "otherYear":
            return t("dateOtherYear", {
                monthDay: parts.monthDay,
                year: parts.year,
                time: parts.time,
            });
    }
}
