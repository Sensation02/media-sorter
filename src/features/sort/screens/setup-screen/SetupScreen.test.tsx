import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { PreviewPlanResponseDto, SortPlan, SortRuleId } from "../../../../types/ipc";
import type { SortRule } from "../../../../types/sort";

const samplePreviewMock = vi.fn<(rule: SortRuleId) => Promise<SortPlan>>();
const previewPlanMock = vi.fn<() => Promise<PreviewPlanResponseDto>>();

vi.mock("../../../../ipc", () => ({
    samplePreview: (rule: SortRuleId) => samplePreviewMock(rule),
    previewPlan: () => previewPlanMock(),
}));

const { SetupScreen } = await import("./SetupScreen");
type SetupScreenProps = Parameters<typeof SetupScreen>[0];

function emptySamplePlan(): SortPlan {
    return { rule: "by-date", root: "sample", items: [] };
}

function emptyPlanResponse(): PreviewPlanResponseDto {
    return {
        plan: { rule: "by-date", root: "", items: [] },
        estimate: {
            mode: "move-same-volume",
            totalFiles: 0,
            totalBytes: 0,
            estimatedMsLow: 0,
            estimatedMsHigh: 0,
            confidence: "high",
        },
    };
}

beforeAll(() => {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.releasePointerCapture = () => undefined;
    Element.prototype.scrollIntoView = () => undefined;
});

beforeEach(() => {
    samplePreviewMock.mockReset();
    samplePreviewMock.mockResolvedValue(emptySamplePlan());
    previewPlanMock.mockReset();
    previewPlanMock.mockResolvedValue(emptyPlanResponse());
});

const RULES: SortRule[] = [
    { id: "by-date-and-place", name: "By date and place", hint: "", description: "" },
    { id: "by-date", name: "By date", hint: "", description: "" },
    { id: "by-type", name: "By type", hint: "", description: "" },
    { id: "by-camera", name: "By camera", hint: "", description: "" },
];

function setupProps(overrides: Partial<SetupScreenProps> = {}): SetupScreenProps {
    return {
        source: { summary: null, scanId: null, scanning: false },
        rule: { rules: RULES, defaultId: "by-date" },
        dateFormat: { value: "localized-month-year", onChange: vi.fn() },
        actions: { onPickSource: vi.fn(), onRun: vi.fn() },
        ...overrides,
    };
}

function renderSetup(defaultId: SortRuleId) {
    const onChange = vi.fn();
    const props = setupProps({
        rule: { rules: RULES, defaultId },
        dateFormat: { value: "localized-month-year", onChange },
    });

    render(<SetupScreen {...props} />);

    return { onChange };
}

describe("SetupScreen date-format selector", () => {
    it("shows the date-format selector for a date-based rule", async () => {
        renderSetup("by-date");

        expect(screen.getByText("Date folder format")).toBeInTheDocument();

        await waitFor(() => {
            expect(samplePreviewMock).toHaveBeenCalled();
        });
    });

    it("hides the date-format selector for by-type", async () => {
        renderSetup("by-type");

        expect(screen.queryByText("Date folder format")).not.toBeInTheDocument();

        await waitFor(() => {
            expect(samplePreviewMock).toHaveBeenCalled();
        });
    });

    it("hides the date-format selector for by-camera", async () => {
        renderSetup("by-camera");

        expect(screen.queryByText("Date folder format")).not.toBeInTheDocument();

        await waitFor(() => {
            expect(samplePreviewMock).toHaveBeenCalled();
        });
    });

    it("selecting a format calls dateFormat.onChange with the new id", async () => {
        const user = userEvent.setup();
        const { onChange } = renderSetup("by-date");

        const dateFormatCombobox = screen.getAllByRole("combobox")[1];

        if (dateFormatCombobox === undefined) {
            throw new Error("expected a date-format combobox in the rendered setup screen");
        }

        await user.click(dateFormatCombobox);

        const listbox = within(screen.getByRole("listbox"));
        await user.click(listbox.getByText("2024 / 02 / 15"));

        expect(onChange).toHaveBeenCalledWith("iso-day-nested");
    });
});

describe("SetupScreen sample preview", () => {
    it("labels the output preview as a sample when no source is selected", async () => {
        render(<SetupScreen {...setupProps()} />);

        expect(await screen.findByText("sample")).toBeInTheDocument();
        expect(samplePreviewMock).toHaveBeenCalledWith("by-date");
        expect(previewPlanMock).not.toHaveBeenCalled();
    });

    it("keeps the run button disabled while no source is selected", async () => {
        render(<SetupScreen {...setupProps()} />);

        expect(screen.getByRole("button", { name: /run sort/i })).toBeDisabled();

        await waitFor(() => {
            expect(samplePreviewMock).toHaveBeenCalled();
        });

        expect(screen.getByRole("button", { name: /run sort/i })).toBeDisabled();
    });
});
