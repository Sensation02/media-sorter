import { useCallback, useEffect, useState } from "react";

import { listHistory, revertJob } from "../../../ipc";
import type { HistoryItemDto, JobId, RevertOutcomeDto } from "../../../types/ipc";
import { toAppErrorView, type ToastErrorView } from "../../../utils";

export const HISTORY_STATUS = {
    loading: "loading",
    success: "success",
    error: "error",
} as const;

export type HistoryHookState =
    | { status: typeof HISTORY_STATUS.loading }
    | { status: typeof HISTORY_STATUS.success; items: HistoryItemDto[] }
    | { status: typeof HISTORY_STATUS.error; error: ToastErrorView };

export type HistoryHook = {
    state: HistoryHookState;
    refresh: () => void;
    revert: (jobId: JobId) => Promise<RevertOutcomeDto>;
};

export function useHistory(): HistoryHook {
    const [state, setState] = useState<HistoryHookState>({ status: HISTORY_STATUS.loading });
    const [reloadTick, setReloadTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        listHistory()
            .then((items) => {
                if (!cancelled) {
                    setState({ status: HISTORY_STATUS.success, items });
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setState({ status: HISTORY_STATUS.error, error: toAppErrorView(error) });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [reloadTick]);

    const refresh = useCallback(() => {
        setState({ status: HISTORY_STATUS.loading });
        setReloadTick((tick) => tick + 1);
    }, []);

    const revert = useCallback(
        async (jobId: JobId) => {
            const outcome = await revertJob(jobId);
            refresh();

            return outcome;
        },
        [refresh],
    );

    return { state, refresh, revert };
}
