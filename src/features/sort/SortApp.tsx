import { Toaster } from "@/components/ui/sonner";

import { ErrorBoundary } from "./components/error-boundary";
import { Sidebar } from "./components/sidebar";
import { Toolbar } from "./components/toolbar";
import { DEFAULT_RULES } from "./constants/rules";
import { SORT_SCREEN, TOOLBAR_STATUS, TOOLBAR_SUBTITLE, TOOLBAR_TITLE } from "./constants/screens";
import { useSortOrchestration } from "./hooks/use-sort-orchestration";
import { preferredDefaultRule } from "./mappers/preferred-rule";
import { resolveScreen } from "./mappers/resolve-screen";
import { toSortDone } from "./mappers/to-sort-done";
import { DoneScreen, HistoryScreen, ProgressScreen, SettingsScreen, SetupScreen } from "./screens";

export function SortApp() {
    const { screen, setScreen, source, scanId, scanning, job, history, settings, handlers } =
        useSortOrchestration();

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
                                    void handlers.pickSource();
                                }}
                                onRun={(plan) => {
                                    void handlers.run(plan);
                                }}
                            />
                        )}
                        {effectiveScreen === SORT_SCREEN.progress && (
                            <ProgressScreen
                                progress={job.progress}
                                onPause={() => {
                                    void handlers.pause();
                                }}
                                onCancel={() => {
                                    void handlers.cancel();
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
