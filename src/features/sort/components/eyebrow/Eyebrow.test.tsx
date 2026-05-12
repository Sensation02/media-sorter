import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Eyebrow } from "./Eyebrow";

describe("Eyebrow", () => {
    it("renders children with default tone", () => {
        render(<Eyebrow>Source folder</Eyebrow>);
        const node = screen.getByText("Source folder");
        expect(node).toBeInTheDocument();
        expect(node.className).toContain("text-eyebrow");
        expect(node.className).toContain("text-fg-3");
    });

    it("applies warning tone", () => {
        render(<Eyebrow tone="warning">8 skipped</Eyebrow>);
        expect(screen.getByText("8 skipped").className).toContain("text-warning");
    });

    it("applies destructive tone", () => {
        render(<Eyebrow tone="destructive">Something went wrong</Eyebrow>);
        expect(screen.getByText("Something went wrong").className).toContain("text-destructive");
    });

    it("applies muted tone (fg-2)", () => {
        render(<Eyebrow tone="muted">Completed in 1m</Eyebrow>);
        expect(screen.getByText("Completed in 1m").className).toContain("text-fg-2");
    });

    it("forwards a custom className", () => {
        render(<Eyebrow className="mb-2.5">Output preview</Eyebrow>);
        expect(screen.getByText("Output preview").className).toContain("mb-2.5");
    });
});
