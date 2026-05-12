import { useCallback, useEffect, useState } from "react";

import { getSettings, resetSettings, setSettings as ipcSetSettings } from "../../ipc";
import type { AppSettingsDto } from "../../types/ipc";
import { toAppErrorView, type ToastErrorView } from "../../utils";

export type SettingsHookState =
  | { status: "loading" }
  | { status: "success"; settings: AppSettingsDto }
  | { status: "error"; error: ToastErrorView };

export type SettingsHook = {
  state: SettingsHookState;
  save: (next: AppSettingsDto) => Promise<AppSettingsDto>;
  reset: () => Promise<AppSettingsDto>;
  refresh: () => void;
};

export function useSettings(): SettingsHook {
  const [state, setState] = useState<SettingsHookState>({ status: "loading" });
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getSettings()
      .then((settings) => {
        if (!cancelled) {
          setState({ status: "success", settings });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ status: "error", error: toAppErrorView(error) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const refresh = useCallback(() => {
    setState({ status: "loading" });
    setReloadTick((tick) => tick + 1);
  }, []);

  const save = useCallback(async (next: AppSettingsDto) => {
    const saved = await ipcSetSettings(next);
    setState({ status: "success", settings: saved });

    return saved;
  }, []);

  const reset = useCallback(async () => {
    const fresh = await resetSettings();
    setState({ status: "success", settings: fresh });

    return fresh;
  }, []);

  return { state, save, reset, refresh };
}
