import { useTranslation } from "react-i18next";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { isSortRuleId } from "../../../../types/sort";
import type { SortRule, SortRuleId } from "../../../../types/sort";

export type RuleSelectorProps = {
    rules: SortRule[];
    value: SortRuleId;
    onChange: (id: SortRuleId) => void;
};

export function RuleSelector({ rules, value, onChange }: RuleSelectorProps) {
    const { t } = useTranslation("setup");

    return (
        <Select
            value={value}
            onValueChange={(next) => {
                if (isSortRuleId(next)) {
                    onChange(next);
                }
            }}
        >
            <SelectTrigger>
                <SelectValue placeholder={t("pickRule")} />
            </SelectTrigger>
            <SelectContent>
                {rules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id} description={rule.hint}>
                        {rule.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
