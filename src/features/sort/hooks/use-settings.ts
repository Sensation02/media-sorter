import { useCallback, useEffect, useState } from "react";

import { getSettings, resetSettings, setSettings as ipcSetSettings } from "../../../ipc";
import type { AppSettingsDto } from "../../../types/ipc";
import { toAppErrorView, type ToastErrorView } from "../../../utils";

export const SETTINGS_STATUS = {
    loading: "loading",
    success: "success",
    error: "error",
} as const;

export type SettingsHookState =
    | { status: typeof SETTINGS_STATUS.loading }
    | { status: typeof SETTINGS_STATUS.success; settings: AppSettingsDto }
    | { status: typeof SETTINGS_STATUS.error; error: ToastErrorView };

export type SettingsHook = {
    state: SettingsHookState;
    save: (next: AppSettingsDto) => Promise<AppSettingsDto>;
    reset: () => Promise<AppSettingsDto>;
    refresh: () => void;
};

export function useSettings(): SettingsHook {
    const [state, setState] = useState<SettingsHookState>({ status: SETTINGS_STATUS.loading });
    const [reloadTick, setReloadTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        getSettings()
            .then((settings) => {
                if (!cancelled) {
                    setState({ status: SETTINGS_STATUS.success, settings });
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setState({ status: SETTINGS_STATUS.error, error: toAppErrorView(error) });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [reloadTick]);

    const refresh = useCallback(() => {
        setState({ status: SETTINGS_STATUS.loading });
        setReloadTick((tick) => tick + 1);
    }, []);

    const save = useCallback(async (next: AppSettingsDto) => {
        const saved = await ipcSetSettings(next);
        setState({ status: SETTINGS_STATUS.success, settings: saved });

        return saved;
    }, []);

    const reset = useCallback(async () => {
        const fresh = await resetSettings();
        setState({ status: SETTINGS_STATUS.success, settings: fresh });

        return fresh;
    }, []);

    return { state, save, reset, refresh };
}
