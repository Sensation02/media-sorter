import type { SortScreen } from "../../../../types/sort";

export type SidebarItem = {
  id: SortScreen;
  label: string;
  icon: string;
};

const ITEMS: SidebarItem[] = [
  { id: "setup", label: "New sort", icon: "✦" },
  { id: "history", label: "History", icon: "◷" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export type SidebarProps = {
  active: SortScreen;
  onNavigate: (screen: SortScreen) => void;
};

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="w-14 bg-[var(--color-surface-1)] border-r border-[var(--color-border)] flex flex-col items-center py-4 gap-1">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            onNavigate(item.id);
          }}
          title={item.label}
          className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
            active === item.id
              ? "bg-[var(--color-surface-2)] text-[var(--color-primary)]"
              : "text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-hover-soft)]"
          }`}
        >
          <span className="text-[22px]">{item.icon}</span>
        </button>
      ))}
    </aside>
  );
}
