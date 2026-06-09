import { createContext, useContext } from "react";

import type { AppUpdateHook } from "./use-app-update";

export const AppUpdateContext = createContext<AppUpdateHook | null>(null);

export function useAppUpdateContext(): AppUpdateHook {
    const context = useContext(AppUpdateContext);

    if (context === null) {
        throw new Error("useAppUpdateContext must be used within an AppUpdateProvider");
    }

    return context;
}
