import type { LucideIcon } from "lucide-react";

import { ICON } from "./icons";
import { SORT_STATUS, type SortStatus } from "../../../types/sort";

export const SORT_SCREEN = {
    setup: "setup",
    progress: "progress",
    done: "done",
    history: "history",
    settings: "settings",
} as const;

export type SortScreen = (typeof SORT_SCREEN)[keyof typeof SORT_SCREEN];

export const TOOLBAR_STATUS: Record<SortScreen, SortStatus> = {
    setup: SORT_STATUS.idle,
    progress: SORT_STATUS.running,
    done: SORT_STATUS.idle,
    history: SORT_STATUS.idle,
    settings: SORT_STATUS.idle,
};

export type SidebarItemConfig = {
    id: SortScreen;
    icon: LucideIcon;
};

export const SIDEBAR_ITEMS: SidebarItemConfig[] = [
    { id: SORT_SCREEN.setup, icon: ICON.newSort },
    { id: SORT_SCREEN.history, icon: ICON.history },
    { id: SORT_SCREEN.settings, icon: ICON.settings },
];
