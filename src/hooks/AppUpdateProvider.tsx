import { type ReactNode } from "react";

import { AppUpdateContext } from "./app-update-context";
import { useAppUpdate } from "./use-app-update";

export function AppUpdateProvider({ children }: { children: ReactNode }) {
    const update = useAppUpdate();

    return <AppUpdateContext.Provider value={update}>{children}</AppUpdateContext.Provider>;
}
