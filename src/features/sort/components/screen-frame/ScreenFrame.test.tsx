import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScreenFrame } from "./ScreenFrame";

describe("ScreenFrame", () => {
    it("renders children inside a scrollable body", () => {
        render(<ScreenFrame>body content</ScreenFrame>);
        expect(screen.getByText("body content")).toBeInTheDocument();
    });

    it("renders a footer when provided", () => {
        render(<ScreenFrame footer={<button>Run</button>}>body</ScreenFrame>);
        expect(screen.getByRole("button", { name: "Run" })).toBeInTheDocument();
    });

    it("omits the footer wrapper when no footer is provided", () => {
        const { container } = render(<ScreenFrame>body</ScreenFrame>);
        expect(container.querySelector("footer")).toBeNull();
    });

    it("renders the footer with px-2 horizontal padding", () => {
        const { container } = render(<ScreenFrame footer={<span />}>body</ScreenFrame>);
        expect(container.querySelector("footer")?.className).toContain("px-2");
    });

    it("appends bodyClassName to the scroll body", () => {
        const { container } = render(<ScreenFrame bodyClassName="space-y-5">body</ScreenFrame>);
        const body = container.querySelector('[data-slot="screen-frame-body"]');
        expect(body?.className).toContain("space-y-5");
    });
});
