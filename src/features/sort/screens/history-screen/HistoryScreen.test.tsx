import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { HistoryItemDto } from "../../../../types/ipc";
import type { ToastErrorView } from "../../../../utils";

import { HistoryScreen } from "./HistoryScreen";

const NOW = new Date(2026, 4, 10, 14, 30, 0).getTime();

function item(overrides: Partial<HistoryItemDto> = {}): HistoryItemDto {
  return {
    id: 1,
    name: "/Users/me/Pictures",
    destinationRoot: "/Users/me/Pictures",
    startedAtMs: new Date(2026, 4, 10, 9, 5, 0).getTime(),
    durationMs: 138 * 1000,
    moved: 158,
    skipped: 0,
    errors: 0,
    state: "done",
    ...overrides,
  };
}

describe("HistoryScreen", () => {
  it("renders a loading message in the loading state", () => {
    render(
      <HistoryScreen
        state={{ status: "loading" }}
        onRevert={() => undefined}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByText(/loading history/i)).toBeInTheDocument();
  });

  it("renders the error title and a retry button in the error state", () => {
    const error: ToastErrorView = { title: "Backend unavailable", detail: "" };
    const onRetry = vi.fn();

    render(
      <HistoryScreen
        state={{ status: "error", error }}
        onRevert={() => undefined}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("Backend unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("renders an empty-state message when the success list is empty", () => {
    render(
      <HistoryScreen
        state={{ status: "success", items: [] }}
        onRevert={() => undefined}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByText(/no completed sorts yet/i)).toBeInTheDocument();
  });

  it("renders a row per job and triggers onRevert with the job id", () => {
    const onRevert = vi.fn();

    render(
      <HistoryScreen
        state={{ status: "success", items: [item({ id: 7 })] }}
        nowMs={NOW}
        onRevert={onRevert}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByText("/Users/me/Pictures")).toBeInTheDocument();
    expect(screen.getByText(/Today, 09:05/)).toBeInTheDocument();
    expect(screen.getByText(/02:18/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /revert/i }));
    expect(onRevert).toHaveBeenCalledWith(7);
  });

  it("disables the revert button on already-reverted jobs", () => {
    render(
      <HistoryScreen
        state={{ status: "success", items: [item({ state: "reverted" })] }}
        nowMs={NOW}
        onRevert={() => undefined}
        onRetry={() => undefined}
      />,
    );

    const button = screen.getByRole("button", { name: /reverted/i });
    expect(button).toBeDisabled();
  });

  it("shows skipped and error counters when present", () => {
    render(
      <HistoryScreen
        state={{
          status: "success",
          items: [item({ skipped: 3, errors: 2 })],
        }}
        nowMs={NOW}
        onRevert={() => undefined}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByText(/3 skipped/)).toBeInTheDocument();
    expect(screen.getByText(/2 errors/)).toBeInTheDocument();
  });
});
