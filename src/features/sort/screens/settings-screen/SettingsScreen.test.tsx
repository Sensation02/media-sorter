import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AppSettingsDto } from "../../../../types/ipc";
import type { ToastErrorView } from "../../../../utils";

import { SettingsScreen } from "./SettingsScreen";

function appSettings(overrides: Partial<AppSettingsDto> = {}): AppSettingsDto {
  return {
    rememberLastSortRule: true,
    rememberLastDestination: true,
    unknownDateFolderName: null,
    historyRetentionDays: 30,
    uiLanguage: "en",
    memo: { lastSortRule: null, lastDestination: null },
    ...overrides,
  };
}

const noopSave = (next: AppSettingsDto) => Promise.resolve(next);
const noopReset = () => Promise.resolve(appSettings());

describe("SettingsScreen", () => {
  it("renders a loading message in the loading state", () => {
    render(
      <SettingsScreen
        state={{ status: "loading" }}
        onSave={noopSave}
        onReset={noopReset}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByText(/loading settings/i)).toBeInTheDocument();
  });

  it("renders the error title and a retry button in the error state", () => {
    const error: ToastErrorView = { title: "Backend unavailable", detail: "" };
    const onRetry = vi.fn();

    render(
      <SettingsScreen
        state={{ status: "error", error }}
        onSave={noopSave}
        onReset={noopReset}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("Backend unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("toggle change calls onSave with the new value", () => {
    const onSave = vi.fn((next: AppSettingsDto) => Promise.resolve(next));

    render(
      <SettingsScreen
        state={{ status: "success", settings: appSettings({ rememberLastSortRule: true }) }}
        onSave={onSave}
        onReset={noopReset}
        onRetry={() => undefined}
      />,
    );

    const [rememberRuleToggle] = screen.getAllByRole("switch");

    if (rememberRuleToggle === undefined) {
      throw new Error("expected at least one switch in the rendered settings form");
    }

    fireEvent.click(rememberRuleToggle);

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ rememberLastSortRule: false }));
  });

  it("folder name blur saves the trimmed value", () => {
    const onSave = vi.fn((next: AppSettingsDto) => Promise.resolve(next));

    render(
      <SettingsScreen
        state={{ status: "success", settings: appSettings({ unknownDateFolderName: null }) }}
        onSave={onSave}
        onReset={noopReset}
        onRetry={() => undefined}
      />,
    );

    const input = screen.getByPlaceholderText("Misc");
    fireEvent.change(input, { target: { value: "  Custom  " } });
    fireEvent.blur(input);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ unknownDateFolderName: "Custom" }),
    );
  });

  it("retention blur clamps out-of-range values", () => {
    const onSave = vi.fn((next: AppSettingsDto) => Promise.resolve(next));

    render(
      <SettingsScreen
        state={{ status: "success", settings: appSettings({ historyRetentionDays: 30 }) }}
        onSave={onSave}
        onReset={noopReset}
        onRetry={() => undefined}
      />,
    );

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "9999" } });
    fireEvent.blur(input);

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ historyRetentionDays: 365 }));
  });

  it("reset button calls onReset", () => {
    const onReset = vi.fn(() => Promise.resolve(appSettings()));

    render(
      <SettingsScreen
        state={{ status: "success", settings: appSettings() }}
        onSave={noopSave}
        onReset={onReset}
        onRetry={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /reset to defaults/i }));

    expect(onReset).toHaveBeenCalled();
  });

  it("displays the locale-aware placeholder and language for Ukrainian", () => {
    render(
      <SettingsScreen
        state={{ status: "success", settings: appSettings({ uiLanguage: "uk" }) }}
        onSave={noopSave}
        onReset={noopReset}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByPlaceholderText("Різне")).toBeInTheDocument();
    expect(screen.getByText("Українська")).toBeInTheDocument();
  });
});
