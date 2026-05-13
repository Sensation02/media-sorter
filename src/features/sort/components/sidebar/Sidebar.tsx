import { Button } from "@/components/ui/button";

import { SIDEBAR_ITEMS, type SortScreen } from "../../constants/screens";

export type SidebarProps = {
    active: SortScreen;
    onNavigate: (screen: SortScreen) => void;
};

export function Sidebar({ active, onNavigate }: SidebarProps) {
    return (
        <aside className="w-14 bg-surface-1 border-r border-border flex flex-col items-center py-4 gap-1">
            {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;

                return (
                    <Button
                        key={item.id}
                        variant="ghost"
                        onClick={() => {
                            onNavigate(item.id);
                        }}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                        title={item.label}
                        className={
                            isActive
                                ? "w-9 h-9 px-0 bg-surface-2 text-primary hover:bg-surface-2 hover:text-primary"
                                : "w-9 h-9 px-0"
                        }
                    >
                        <Icon className="h-5 w-5" aria-hidden />
                    </Button>
                );
            })}
        </aside>
    );
}
