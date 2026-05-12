import type { LucideIcon } from "lucide-react";

import { ICON } from "../../constants/icons";
import type { SortScreen } from "../../../../types/sort";

export type SidebarItem = {
    id: SortScreen;
    label: string;
    icon: LucideIcon;
};

const ITEMS: SidebarItem[] = [
    { id: "setup", label: "New sort", icon: ICON.newSort },
    { id: "history", label: "History", icon: ICON.history },
    { id: "settings", label: "Settings", icon: ICON.settings },
];

export type SidebarProps = {
    active: SortScreen;
    onNavigate: (screen: SortScreen) => void;
};

export function Sidebar({ active, onNavigate }: SidebarProps) {
    return (
        <aside className="w-14 bg-surface-1 border-r border-border flex flex-col items-center py-4 gap-1">
            {ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;

                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                            onNavigate(item.id);
                        }}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                        title={item.label}
                        className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
                            isActive
                                ? "bg-surface-2 text-primary"
                                : "text-fg-3 hover:text-fg-1 hover:bg-hover-soft"
                        }`}
                    >
                        <Icon className="h-5 w-5" aria-hidden />
                    </button>
                );
            })}
        </aside>
    );
}
