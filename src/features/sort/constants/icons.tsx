import {
    ArrowRight,
    Check,
    ChevronDown,
    ChevronRight,
    FilePlus2,
    Folder,
    History,
    Loader2,
    Settings,
    Sparkles,
    Undo2,
    type LucideIcon,
} from "lucide-react";

export const ICON = {
    arrowRight: ArrowRight,
    check: Check,
    chevronDown: ChevronDown,
    chevronRight: ChevronRight,
    folder: Folder,
    history: History,
    loader: Loader2,
    newSort: FilePlus2,
    settings: Settings,
    sparkles: Sparkles,
    undo: Undo2,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICON;
