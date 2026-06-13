import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { SortRule, SortRuleId } from "../../../../types/sort";

import { SetupScreen, type SetupScreenProps } from "./SetupScreen";

beforeAll(() => {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.releasePointerCapture = () => undefined;
    Element.prototype.scrollIntoView = () => undefined;
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
    it("shows the date-format selector for a date-based rule", () => {
        renderSetup("by-date");

        expect(screen.getByText("Date folder format")).toBeInTheDocument();
    });

    it("hides the date-format selector for by-type", () => {
        renderSetup("by-type");

        expect(screen.queryByText("Date folder format")).not.toBeInTheDocument();
    });

    it("hides the date-format selector for by-camera", () => {
        renderSetup("by-camera");

        expect(screen.queryByText("Date folder format")).not.toBeInTheDocument();
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
