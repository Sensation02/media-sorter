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

export const TOOLBAR_TITLE: Record<SortScreen, string> = {
    setup: "New sort",
    progress: "Sorting",
    done: "Sorted",
    history: "History",
    settings: "Settings",
};

export const TOOLBAR_STATUS: Record<SortScreen, SortStatus> = {
    setup: SORT_STATUS.idle,
    progress: SORT_STATUS.running,
    done: SORT_STATUS.idle,
    history: SORT_STATUS.idle,
    settings: SORT_STATUS.idle,
};

export const TOOLBAR_SUBTITLE: Partial<Record<SortScreen, string>> = {
    progress: "running",
    done: "completed",
};

export type SidebarItemConfig = {
    id: SortScreen;
    label: string;
    icon: LucideIcon;
};

export const SIDEBAR_ITEMS: SidebarItemConfig[] = [
    { id: SORT_SCREEN.setup, label: "New sort", icon: ICON.newSort },
    { id: SORT_SCREEN.history, label: "History", icon: ICON.history },
    { id: SORT_SCREEN.settings, label: "Settings", icon: ICON.settings },
];
