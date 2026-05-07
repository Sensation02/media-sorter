import { describe, expect, it } from "vitest";
import { formatBytes } from "./format-bytes";

describe("formatBytes", () => {
  it("returns 0 B for zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes without decimals", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes with one decimal", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes with one decimal", () => {
    expect(formatBytes(8 * 1024 * 1024 + 400 * 1024)).toBe("8.4 MB");
  });

  it("formats gigabytes with one decimal", () => {
    expect(formatBytes(8.4 * 1024 * 1024 * 1024)).toBe("8.4 GB");
  });

  it("returns fallback for negative values", () => {
    expect(formatBytes(-1)).toBe("—");
  });

  it("returns fallback for NaN", () => {
    expect(formatBytes(Number.NaN)).toBe("—");
  });

  it("returns fallback for Infinity", () => {
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe("—");
  });
});
