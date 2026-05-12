import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { cancelSort, pauseSort, pickSourceDir, scanSource, startSort } from "../../../ipc";
import type { JobId, ScanId, ScanSummary, SortPlan, SortSettingsDto } from "../../../types/ipc";
import { toAppErrorView } from "../../../utils";
import { SORT_SCREEN, type SortScreen } from "../constants/screens";
import { revertSummary } from "../mappers/revert-summary";
import { useHistory, type HistoryHook } from "./use-history";
import { useSettings, type SettingsHook } from "./use-settings";
import { useSortJob, type UseSortJobResult } from "./use-sort-job";

const IMMUTABLE_SORT_FLAGS: SortSettingsDto = {
    copy: false,
    skipDuplicates: true,
    watchSource: false,
    writeReport: true,
};

export type SortOrchestrationHandlers = {
    pickSource: () => Promise<void>;
    run: (plan: SortPlan) => Promise<void>;
    pause: () => Promise<void>;
    cancel: () => Promise<void>;
    revert: (id: JobId) => Promise<void>;
    resetForNewSort: () => void;
};

export type SortOrchestration = {
    screen: SortScreen;
    setScreen: (screen: SortScreen) => void;
    source: ScanSummary | null;
    scanId: ScanId | null;
    scanning: boolean;
    jobId: JobId | null;
    job: UseSortJobResult;
    history: HistoryHook;
    settings: SettingsHook;
    handlers: SortOrchestrationHandlers;
};

export function useSortOrchestration(): SortOrchestration {
    const [screen, setScreen] = useState<SortScreen>(SORT_SCREEN.setup);
    const [source, setSource] = useState<ScanSummary | null>(null);
    const [scanId, setScanId] = useState<ScanId | null>(null);
    const [scanning, setScanning] = useState(false);
    const [jobId, setJobId] = useState<JobId | null>(null);

    const job = useSortJob(jobId);
    const history = useHistory();
    const settings = useSettings();

    const scanPath = useCallback(async (path: string) => {
        setSource(null);
        setScanId(null);
        setScanning(true);

        try {
            const response = await scanSource(path);
            setSource(response.summary);
            setScanId(response.scanId);
        } catch (error) {
            const view = toAppErrorView(error);
            toast.error(view.title, { description: view.detail });
        } finally {
            setScanning(false);
        }
    }, []);

    const pickSource = useCallback(async () => {
        const path = await pickSourceDir();

        if (path === null) {
            return;
        }

        await scanPath(path);
    }, [scanPath]);

    const prefillTriggeredRef = useRef(false);

    useEffect(() => {
        if (prefillTriggeredRef.current) {
            return;
        }

        if (settings.state.status !== "success") {
            return;
        }

        prefillTriggeredRef.current = true;

        const { rememberLastDestination, memo } = settings.state.settings;

        if (rememberLastDestination && memo.lastDestination !== null) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- first-success prefill is gated by prefillTriggeredRef; the scanSource IPC is the canonical external-sync use case
            void scanPath(memo.lastDestination);
        }
    }, [settings.state, scanPath]);

    const run = useCallback(async (plan: SortPlan) => {
        try {
            const response = await startSort(plan, IMMUTABLE_SORT_FLAGS);
            setJobId(response.jobId);
            setScreen(SORT_SCREEN.progress);
        } catch (error) {
            const view = toAppErrorView(error);
            toast.error(view.title, { description: view.detail });
        }
    }, []);

    const pause = useCallback(async () => {
        if (jobId === null) {
            return;
        }

        try {
            await pauseSort(jobId);
        } catch (error) {
            const view = toAppErrorView(error);
            toast.error(view.title, { description: view.detail });
        }
    }, [jobId]);

    const cancel = useCallback(async () => {
        if (jobId === null) {
            return;
        }

        try {
            await cancelSort(jobId);
        } catch (error) {
            const view = toAppErrorView(error);
            toast.error(view.title, { description: view.detail });
        }
    }, [jobId]);

    const revert = useCallback(
        async (id: JobId) => {
            try {
                const outcome = await history.revert(id);
                toast.success("Revert complete", {
                    description: revertSummary(outcome.restored, outcome.skipped, outcome.errors),
                });
            } catch (error) {
                const view = toAppErrorView(error);
                toast.error(view.title, { description: view.detail });
            }
        },
        [history],
    );

    const resetForNewSort = useCallback(() => {
        setJobId(null);
        setScreen(SORT_SCREEN.setup);
    }, []);

    useEffect(() => {
        if (job.status !== "error" || job.error === null) {
            return;
        }

        const view = toAppErrorView(job.error);
        toast.error(view.title, { description: view.detail });
        // eslint-disable-next-line react-hooks/set-state-in-effect -- terminal job error must reset screen and jobId together with the toast side effect
        setScreen(SORT_SCREEN.setup);
        setJobId(null);
    }, [job.status, job.error]);

    return {
        screen,
        setScreen,
        source,
        scanId,
        scanning,
        jobId,
        job,
        history,
        settings,
        handlers: { pickSource, run, pause, cancel, revert, resetForNewSort },
    };
}
