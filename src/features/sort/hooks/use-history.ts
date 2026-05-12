import { useCallback, useEffect, useState } from "react";

import { listHistory, revertJob } from "../../../ipc";
import type { HistoryItemDto, JobId, RevertOutcomeDto } from "../../../types/ipc";
import { toAppErrorView, type ToastErrorView } from "../../../utils";

export type HistoryHookState =
    | { status: "loading" }
    | { status: "success"; items: HistoryItemDto[] }
    | { status: "error"; error: ToastErrorView };

export type HistoryHook = {
    state: HistoryHookState;
    refresh: () => void;
    revert: (jobId: JobId) => Promise<RevertOutcomeDto>;
};

export function useHistory(): HistoryHook {
    const [state, setState] = useState<HistoryHookState>({ status: "loading" });
    const [reloadTick, setReloadTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        listHistory()
            .then((items) => {
                if (!cancelled) {
                    setState({ status: "success", items });
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
