import type { SortRule, SortRuleId } from "../../../../types/sort";

export type RuleSelectorProps = {
  rules: SortRule[];
  value: SortRuleId;
  onChange: (id: SortRuleId) => void;
};

export function RuleSelector({ rules, value, onChange }: RuleSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {rules.map((rule) => {
        const isActive = rule.id === value;
        return (
          <button
            key={rule.id}
            type="button"
            onClick={() => {
              onChange(rule.id);
            }}
            className={`text-left px-3.5 py-3 rounded-md border transition-colors ${
              isActive
                ? "bg-[var(--color-surface-2)] border-[var(--color-primary)]/40"
                : "bg-[var(--color-surface-1)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-1 h-1 rounded-full ${
                  isActive ? "bg-[var(--color-primary)]" : "bg-[var(--color-fg-3)]"
                }`}
              />
              <span className="text-[12.5px] font-medium">{rule.name}</span>
            </div>
            <div className="font-mono text-[10.5px] text-[var(--color-fg-3)]">{rule.hint}</div>
          </button>
        );
      })}
    </div>
  );
}
