import { useTranslation } from "react-i18next";

import { Toaster } from "@/components/ui/sonner";

import { ErrorBoundary } from "./components/error-boundary";
import { Sidebar } from "./components/sidebar";
import { Toolbar } from "./components/toolbar";
import { SORT_SCREEN, TOOLBAR_STATUS, type SortScreen } from "./constants/screens";
import { JOB_STATUS } from "./hooks/use-sort-job";
import { useDefaultRules } from "./hooks/use-default-rules";
import { useSortOrchestration } from "./hooks/use-sort-orchestration";
import { preferredDefaultRule } from "./mappers/preferred-rule";
import { resolveScreen } from "./mappers/resolve-screen";
import { toSortDone } from "./mappers/to-sort-done";
import { DoneScreen, HistoryScreen, ProgressScreen, SettingsScreen, SetupScreen } from "./screens";
import { SORT_STATUS } from "../../types/sort";

const TOOLBAR_TITLE_KEY: Record<SortScreen, string> = {
    [SORT_SCREEN.setup]: "newSort",
    [SORT_SCREEN.progress]: "sortingStatus",
    [SORT_SCREEN.done]: "sortedStatus",
    [SORT_SCREEN.history]: "history",
    [SORT_SCREEN.settings]: "settings",
};

const TOOLBAR_SUBTITLE_KEY: Partial<Record<SortScreen, string>> = {
    [SORT_SCREEN.progress]: "running",
    [SORT_SCREEN.done]: "completed",
};

export function SortApp() {
    const { t } = useTranslation("common");
    const rules = useDefaultRules();
    const { screen, setScreen, source, scanId, scanning, job, history, settings, handlers } =
        useSortOrchestration();

    const effectiveScreen = resolveScreen(screen, job.status);
    const progressCompleted =
        effectiveScreen === SORT_SCREEN.progress && job.status === JOB_STATUS.done;
    const titleKey = progressCompleted
        ? TOOLBAR_TITLE_KEY[SORT_SCREEN.done]
        : TOOLBAR_TITLE_KEY[effectiveScreen];
    const subtitleKey = progressCompleted
        ? TOOLBAR_SUBTITLE_KEY[SORT_SCREEN.done]
        : TOOLBAR_SUBTITLE_KEY[effectiveScreen];
    const subtitle = subtitleKey === undefined ? undefined : t(subtitleKey);
    const toolbarStatus = progressCompleted ? SORT_STATUS.idle : TOOLBAR_STATUS[effectiveScreen];

    return (
        <div className="h-screen w-screen flex bg-bg text-fg-1 antialiased">
            <Sidebar active={screen} onNavigate={setScreen} />
            <div className="flex-1 flex flex-col min-w-0">
                <Toolbar jobName={t(titleKey)} status={toolbarStatus} subtitle={subtitle} />
                <main className="flex-1 min-h-0">
                    <ErrorBoundary>
                        {effectiveScreen === SORT_SCREEN.setup && (
                            <SetupScreen
                                source={{ summary: source, scanId, scanning }}
                                rule={{
                                    rules,
                                    defaultId: preferredDefaultRule(settings.state),
                                }}
                                actions={{
                                    onPickSource: () => {
                                        void handlers.pickSource();
                                    },
                                    onRun: (plan) => {
                                        void handlers.run(plan);
                                    },
                                }}
                            />
                        )}
                        {effectiveScreen === SORT_SCREEN.progress && (
                            <ProgressScreen
                                progress={job.progress}
                                completed={progressCompleted}
                                onPause={() => {
                                    void handlers.pause();
                                }}
                                onCancel={() => {
                                    void handlers.cancel();
                                }}
                                onContinue={() => {
                                    setScreen(SORT_SCREEN.done);
                                }}
                            />
                        )}
                        {effectiveScreen === SORT_SCREEN.done && job.done !== null && (
                            <DoneScreen
                                done={toSortDone(job.done)}
                                onUndo={() => {
                                    setScreen(SORT_SCREEN.history);
                                }}
                                onNewSort={handlers.resetForNewSort}
                                onReveal={() => {
                                    // EPIC-13: wire to plugin-opener revealItemInDir (docs/specs/epic-13-reveal-in-finder.md)
                                    console.warn("[SortApp] onReveal not yet wired — see EPIC-13");
                                }}
                            />
                        )}
                        {effectiveScreen === SORT_SCREEN.history && (
                            <HistoryScreen
                                state={history.state}
                                onRevert={(id) => {
                                    void handlers.revert(id);
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
