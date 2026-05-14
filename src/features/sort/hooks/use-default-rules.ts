import { useTranslation } from "react-i18next";

import type { SortRule, SortRuleId } from "../../../types/sort";
import { DEFAULT_RULE_IDS } from "../constants/rules";

const RULE_LABEL_KEY: Record<SortRuleId, { name: string; hint: string; description: string }> = {
    "by-date-and-place": {
        name: "byDateAndPlaceName",
        hint: "byDateAndPlaceHint",
        description: "byDateAndPlaceDescription",
    },
    "by-date": {
        name: "byDateName",
        hint: "byDateHint",
        description: "byDateDescription",
    },
    "by-type": {
        name: "byTypeName",
        hint: "byTypeHint",
        description: "byTypeDescription",
    },
    "by-camera": {
        name: "byCameraName",
        hint: "byCameraHint",
        description: "byCameraDescription",
    },
};

export function useDefaultRules(): SortRule[] {
    const { t } = useTranslation("rules");

    return DEFAULT_RULE_IDS.map((id) => {
        const keys = RULE_LABEL_KEY[id];

        return {
            id,
            name: t(keys.name),
            hint: t(keys.hint),
            description: t(keys.description),
        };
    });
}
