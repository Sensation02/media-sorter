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
        <aside className="w-14 bg-surface-1 border-r border-border flex flex-col items-center py-4 gap-1">
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
                            ? "bg-surface-2 text-primary"
                            : "text-fg-3 hover:text-fg-1 hover:bg-hover-soft"
                    }`}
                >
                    <span className="text-icon-lg">{item.icon}</span>
                </button>
            ))}
        </aside>
    );
}
