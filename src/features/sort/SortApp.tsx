import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";

import { cancelSort, pauseSort, pickSourceDir, scanSource, startSort } from "../../ipc";
import type { JobId, ScanId, ScanSummary, SortPlan, SortSettingsDto } from "../../types/ipc";
import { toAppErrorView } from "../../utils";
import { ErrorBoundary } from "./components/error-boundary";
import { Sidebar } from "./components/sidebar";
import { Toolbar } from "./components/toolbar";
import { DEFAULT_RULES } from "./constants";
import {
    SORT_SCREEN,
    TOOLBAR_STATUS,
    TOOLBAR_SUBTITLE,
    TOOLBAR_TITLE,
    type SortScreen,
} from "./constants/screens";
import { preferredDefaultRule } from "./mappers/preferred-rule";
import { resolveScreen } from "./mappers/resolve-screen";
import { revertSummary } from "./mappers/revert-summary";
import { toSortDone } from "./mappers/to-sort-done";
import { DoneScreen, HistoryScreen, ProgressScreen, SettingsScreen, SetupScreen } from "./screens";
import { useHistory } from "./use-history";
import { useSettings } from "./use-settings";
import { useSortJob } from "./use-sort-job";

const IMMUTABLE_SORT_FLAGS: SortSettingsDto = {
    copy: false,
    skipDuplicates: true,
    watchSource: false,
    writeReport: true,
};

export function SortApp() {
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

    const handlePickSource = useCallback(async () => {
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

    const handleRun = useCallback(async (plan: SortPlan) => {
        try {
            const response = await startSort(plan, IMMUTABLE_SORT_FLAGS);
            setJobId(response.jobId);
            setScreen(SORT_SCREEN.progress);
        } catch (error) {
            const view = toAppErrorView(error);
            toast.error(view.title, { description: view.detail });
        }
    }, []);

    const handlePause = useCallback(async () => {
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

    const handleCancel = useCallback(async () => {
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

    const handleRevert = useCallback(
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

    const effectiveScreen = resolveScreen(screen, job.status);
    const subtitle = TOOLBAR_SUBTITLE[effectiveScreen];

    return (
        <div className="h-screen w-screen flex bg-bg text-fg-1 antialiased">
            <Sidebar active={screen} onNavigate={setScreen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Toolbar
                    jobName={TOOLBAR_TITLE[effectiveScreen]}
                    status={TOOLBAR_STATUS[effectiveScreen]}
                    {...(subtitle !== undefined && { subtitle })}
                />
                <main className="flex-1 min-h-0">
                    <ErrorBoundary>
                        {effectiveScreen === SORT_SCREEN.setup && (
                            <SetupScreen
                                rules={DEFAULT_RULES}
                                source={source}
                                scanId={scanId}
                                scanning={scanning}
                                defaultRuleId={preferredDefaultRule(settings.state)}
                                onPickSource={() => {
                                    void handlePickSource();
                                }}
                                onRun={(plan) => {
                                    void handleRun(plan);
                                }}
                            />
                        )}
                        {effectiveScreen === SORT_SCREEN.progress && (
                            <ProgressScreen
                                progress={job.progress}
                                onPause={() => {
                                    void handlePause();
                                }}
                                onCancel={() => {
                                    void handleCancel();
                                }}
                            />
                        )}
                        {effectiveScreen === SORT_SCREEN.done && job.done !== null && (
                            <DoneScreen
                                done={toSortDone(job.done)}
                                onUndo={() => {
                                    setScreen(SORT_SCREEN.history);
                                }}
                                onNewSort={() => {
                                    setJobId(null);
                                    setScreen(SORT_SCREEN.setup);
                                }}
                                onReveal={() => {
                                    // TODO(IPC): wire to a Tauri command that reveals the destination in Finder/Explorer
                                    console.warn("[SortApp] onReveal not yet wired to Tauri");
                                }}
                            />
                        )}
                        {effectiveScreen === SORT_SCREEN.history && (
                            <HistoryScreen
                                state={history.state}
                                onRevert={(id) => {
                                    void handleRevert(id);
                                }}
                                onRetry={history.refresh}
                            />
                        )}
                        {effectiveScreen === SORT_SCREEN.settings && (
                            <SettingsScreen
                                state={settings.state}
                                onSave={settings.save}
                                onReset={settings.reset}
                                onRetry={settings.refresh}
                            />
                        )}
                    </ErrorBoundary>
                </main>
            </div>
            <Toaster />
        </div>
    );
}
