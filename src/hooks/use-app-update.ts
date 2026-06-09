import { useCallback, useEffect, useState } from "react";

import { check, type Update } from "@tauri-apps/plugin-updater";

import { toAppErrorView, type ToastErrorView } from "../utils";

export const UPDATE_STATUS = {
    idle: "idle",
    checking: "checking",
    available: "available",
    downloading: "downloading",
    installed: "installed",
    upToDate: "upToDate",
    error: "error",
    downloadError: "downloadError",
} as const;

export type AppUpdateState =
    | { status: typeof UPDATE_STATUS.idle }
    | { status: typeof UPDATE_STATUS.checking }
    | { status: typeof UPDATE_STATUS.available; version: string }
    | { status: typeof UPDATE_STATUS.downloading; version: string }
    | { status: typeof UPDATE_STATUS.installed; version: string }
    | { status: typeof UPDATE_STATUS.upToDate }
    | { status: typeof UPDATE_STATUS.error; error: ToastErrorView }
    | { status: typeof UPDATE_STATUS.downloadError; error: ToastErrorView };

export type AppUpdateHook = {
    state: AppUpdateState;
    checkForUpdates: () => Promise<void>;
    downloadAndInstall: () => Promise<void>;
    dismiss: () => void;
};

export function useAppUpdate(): AppUpdateHook {
    const [state, setState] = useState<AppUpdateState>({ status: UPDATE_STATUS.idle });
    const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);

    const releasePendingUpdate = useCallback((next: Update | null) => {
        setPendingUpdate((previous) => {
            void previous?.close();

            return next;
        });
    }, []);

    const applyCheckResult = useCallback(
        (update: Update | null) => {
            releasePendingUpdate(update);
            setState(
                update === null
                    ? { status: UPDATE_STATUS.upToDate }
                    : { status: UPDATE_STATUS.available, version: update.version },
            );
        },
        [releasePendingUpdate],
    );

    const applyCheckError = useCallback(
        (error: unknown) => {
            console.error("[updater] update check failed", error);
            releasePendingUpdate(null);
            setState({ status: UPDATE_STATUS.error, error: toAppErrorView(error) });
        },
        [releasePendingUpdate],
    );

    const checkForUpdates = useCallback(async () => {
        setState({ status: UPDATE_STATUS.checking });

        try {
            applyCheckResult(await check());
        } catch (error: unknown) {
            applyCheckError(error);
        }
    }, [applyCheckResult, applyCheckError]);

    const downloadAndInstall = useCallback(async () => {
        if (pendingUpdate === null) {
            return;
        }

        const version = pendingUpdate.version;
        setState({ status: UPDATE_STATUS.downloading, version });

        try {
            await pendingUpdate.downloadAndInstall();
            setState({ status: UPDATE_STATUS.installed, version });
        } catch (error: unknown) {
            console.error("[updater] update install failed", error);
            releasePendingUpdate(null);
            setState({ status: UPDATE_STATUS.downloadError, error: toAppErrorView(error) });
        }
    }, [pendingUpdate, releasePendingUpdate]);

    const dismiss = useCallback(() => {
        releasePendingUpdate(null);
        setState({ status: UPDATE_STATUS.idle });
    }, [releasePendingUpdate]);

    useEffect(() => {
        let cancelled = false;

        check()
            .then((update) => {
                if (!cancelled) {
                    applyCheckResult(update);
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    applyCheckError(error);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [applyCheckResult, applyCheckError]);

    return { state, checkForUpdates, downloadAndInstall, dismiss };
}
