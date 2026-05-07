import { describe, expect, it } from "vitest";
import { isAppErrorDto, toAppErrorView } from "./app-error";

describe("isAppErrorDto", () => {
  it("accepts a valid AppErrorDto", () => {
    expect(isAppErrorDto({ code: "io", params: { message: "fail" } })).toBe(true);
  });

  it("rejects null", () => {
    expect(isAppErrorDto(null)).toBe(false);
  });

  it("rejects plain Error", () => {
    expect(isAppErrorDto(new Error("boom"))).toBe(false);
  });

  it("rejects object without code", () => {
    expect(isAppErrorDto({ params: {} })).toBe(false);
  });
});

describe("toAppErrorView", () => {
  it("maps io error", () => {
    const view = toAppErrorView({ code: "io", params: { message: "disk gone" } });
    expect(view).toEqual({ title: "Cannot read folder", detail: "disk gone" });
  });

  it("maps validation error", () => {
    const view = toAppErrorView({ code: "validation", params: { message: "not a directory" } });
    expect(view).toEqual({ title: "Invalid input", detail: "not a directory" });
  });

  it("maps forbidden error to path detail", () => {
    const view = toAppErrorView({ code: "forbidden", params: { path: "/secret" } });
    expect(view).toEqual({ title: "Permission denied", detail: "/secret" });
  });

  it("maps conflict error to path detail", () => {
    const view = toAppErrorView({ code: "conflict", params: { path: "/dup" } });
    expect(view).toEqual({ title: "Path conflict", detail: "/dup" });
  });

  it("maps native Error to internal title", () => {
    const view = toAppErrorView(new Error("kaboom"));
    expect(view).toEqual({ title: "Unexpected error", detail: "kaboom" });
  });

  it("maps unknown value to fallback", () => {
    const view = toAppErrorView(undefined);
    expect(view).toEqual({ title: "Unexpected error", detail: "Something went wrong" });
  });

  it("falls back when message is missing", () => {
    const view = toAppErrorView({ code: "io", params: { message: "" } });
    expect(view.detail).toBe("Something went wrong");
  });

  it("falls back when path is missing", () => {
    const view = toAppErrorView({ code: "forbidden", params: { path: "" } });
    expect(view.detail).toBe("selected folder");
  });
});
