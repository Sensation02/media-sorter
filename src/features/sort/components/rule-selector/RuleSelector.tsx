import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { SortRule, SortRuleId } from "../../../../types/sort";

export type RuleSelectorProps = {
  rules: SortRule[];
  value: SortRuleId;
  onChange: (id: SortRuleId) => void;
};

export function RuleSelector({ rules, value, onChange }: RuleSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        onChange(next as SortRuleId);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Pick a rule" />
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
