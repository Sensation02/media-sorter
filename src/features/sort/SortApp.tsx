import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";

import { ErrorBoundary } from "./components/error-boundary";
import { Sidebar } from "./components/sidebar";
import { Toolbar } from "./components/toolbar";
import { DoneScreen, HistoryScreen, ProgressScreen, SettingsScreen, SetupScreen } from "./screens";
import { DEFAULT_RULES } from "./constants";
import { formatHistoryDuration } from "./history-format";
import { useHistory } from "./use-history";
import { useSettings } from "./use-settings";
import { useSortJob, type SortJobStatus } from "./use-sort-job";
import { cancelSort, pauseSort, pickSourceDir, scanSource, startSort } from "../../ipc";
import { toAppErrorView } from "../../utils";
import type {
  JobId,
  ScanId,
  ScanSummary,
  SortDoneDto,
  SortPlan,
  SortSettingsDto,
} from "../../types/ipc";
import type { SortDone, SortScreen, SortStatus } from "../../types/sort";

const TOOLBAR_TITLE: Record<SortScreen, string> = {
  setup: "New sort",
  progress: "Sorting",
  done: "Sorted",
  history: "History",
  settings: "Settings",
};

const TOOLBAR_STATUS: Record<SortScreen, SortStatus> = {
  setup: "idle",
  progress: "running",
  done: "idle",
  history: "idle",
  settings: "idle",
};

const TOOLBAR_SUBTITLE: Partial<Record<SortScreen, string>> = {
  progress: "running",
  done: "completed",
};

const LEGACY_SORT_SETTINGS: SortSettingsDto = {
  copy: false,
  skipDuplicates: true,
  watchSource: false,
  writeReport: true,
};

export function SortApp() {
  const [screen, setScreen] = useState<SortScreen>("setup");
  const [source, setSource] = useState<ScanSummary | null>(null);
  const [scanId, setScanId] = useState<ScanId | null>(null);
  const [scanning, setScanning] = useState(false);
  const [jobId, setJobId] = useState<JobId | null>(null);
  const job = useSortJob(jobId);
  const history = useHistory();
  const settings = useSettings();

  const handlePickSource = useCallback(async () => {
    try {
      const path = await pickSourceDir();

      if (path === null) {
        return;
      }

      setSource(null);
      setScanId(null);
      setScanning(true);
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

  const handleRun = useCallback(async (plan: SortPlan) => {
    try {
      const response = await startSort(plan, LEGACY_SORT_SETTINGS);
      setJobId(response.jobId);
      setScreen("progress");
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
    setScreen("setup");
    setJobId(null);
  }, [job.status, job.error]);

  const effectiveScreen = resolveScreen(screen, job.status);
  const subtitle = TOOLBAR_SUBTITLE[effectiveScreen];

  return (
    <div className="h-screen w-screen flex bg-[var(--color-bg)] text-[var(--color-fg-1)] antialiased">
      <Sidebar active={screen} onNavigate={setScreen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar
          jobName={TOOLBAR_TITLE[effectiveScreen]}
          status={TOOLBAR_STATUS[effectiveScreen]}
          {...(subtitle !== undefined && { subtitle })}
        />
        <main className="flex-1 min-h-0">
          <ErrorBoundary>
            {effectiveScreen === "setup" && (
              <SetupScreen
                rules={DEFAULT_RULES}
                source={source}
                scanId={scanId}
                scanning={scanning}
                onPickSource={() => {
                  void handlePickSource();
                }}
                onRun={(plan) => {
                  void handleRun(plan);
                }}
              />
            )}
            {effectiveScreen === "progress" && (
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
            {effectiveScreen === "done" && job.done !== null && (
              <DoneScreen
                done={toSortDone(job.done)}
                onUndo={() => {
                  setScreen("history");
                }}
                onNewSort={() => {
                  setJobId(null);
                  setScreen("setup");
                }}
                onReveal={() => {
                  // TODO(IPC): wire to a Tauri command that reveals the destination in Finder/Explorer
                  console.warn("[SortApp] onReveal not yet wired to Tauri");
                }}
              />
            )}
            {effectiveScreen === "history" && (
              <HistoryScreen
                state={history.state}
                onRevert={(id) => {
                  void handleRevert(id);
                }}
                onRetry={history.refresh}
              />
            )}
            {effectiveScreen === "settings" && (
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

function resolveScreen(screen: SortScreen, jobStatus: SortJobStatus): SortScreen {
  if (screen !== "progress") {
    return screen;
  }

  if (jobStatus === "done") {
    return "done";
  }

  if (jobStatus === "error") {
    return "setup";
  }

  return "progress";
}

function toSortDone(dto: SortDoneDto): SortDone {
  return {
    duration: formatHistoryDuration(dto.durationMs),
    moved: dto.moved,
    skipped: dto.skipped,
    folders: dto.folders,
    destination: dto.destination,
  };
}

function revertSummary(restored: number, skipped: number, errors: number): string {
  const parts = [`${restored} restored`];
  if (skipped > 0) {
    parts.push(`${skipped} skipped`);
  }
  if (errors > 0) {
    parts.push(`${errors} errors`);
  }

  return parts.join(", ");
}
