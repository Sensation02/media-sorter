import { useState } from "react";
import { Sidebar } from "./components/sidebar";
import { Toolbar } from "./components/toolbar";
import { DoneScreen, HistoryScreen, ProgressScreen, SettingsScreen, SetupScreen } from "./screens";
import {
  DEFAULT_DONE,
  DEFAULT_HISTORY,
  DEFAULT_PROGRESS,
  DEFAULT_RULES,
  DEFAULT_SETTINGS,
  DEFAULT_SOURCE,
} from "./constants";
import type { SortScreen, SortSettings, SortStatus } from "../../types/sort";

const TOOLBAR_TITLE: Record<SortScreen, string> = {
  setup: "New sort",
  progress: "2024-vacation",
  done: "2024-vacation",
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

export function SortApp() {
  const [screen, setScreen] = useState<SortScreen>("setup");
  const [settings, setSettings] = useState<SortSettings>(DEFAULT_SETTINGS);

  const subtitle = TOOLBAR_SUBTITLE[screen];

  return (
    <div className="h-screen w-screen flex bg-[var(--color-bg)] text-[var(--color-fg-1)] antialiased">
      <Sidebar active={screen} onNavigate={setScreen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar
          jobName={TOOLBAR_TITLE[screen]}
          status={TOOLBAR_STATUS[screen]}
          {...(subtitle !== undefined && { subtitle })}
        />
        <main className="flex-1 min-h-0">
          {screen === "setup" && (
            <SetupScreen
              rules={DEFAULT_RULES}
              source={DEFAULT_SOURCE}
              onRun={() => {
                setScreen("progress");
              }}
            />
          )}
          {screen === "progress" && (
            <ProgressScreen
              progress={DEFAULT_PROGRESS}
              onPause={() => {
                setScreen("setup");
              }}
              onCancel={() => {
                setScreen("setup");
              }}
            />
          )}
          {screen === "done" && (
            <DoneScreen
              done={DEFAULT_DONE}
              onUndo={() => {
                setScreen("history");
              }}
              onNewSort={() => {
                setScreen("setup");
              }}
              onReveal={() => {
                // TODO(IPC): wire to a Tauri command that reveals the destination in Finder/Explorer
                console.warn("[SortApp] onReveal not yet wired to Tauri");
              }}
            />
          )}
          {screen === "history" && (
            <HistoryScreen
              history={DEFAULT_HISTORY}
              onRevert={(id) => {
                // TODO(IPC): wire to a Tauri command that reverts the sort job by id
                console.warn("[SortApp] onRevert not yet wired to Tauri", { id });
              }}
            />
          )}
          {screen === "settings" && <SettingsScreen settings={settings} onChange={setSettings} />}
        </main>
      </div>
    </div>
  );
}
