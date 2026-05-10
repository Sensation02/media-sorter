import { describe, expect, it } from "vitest";

import type { SortPlan, SortPlanItem } from "../../types/ipc";

import { planToTree } from "./plan-tree";

const ROOT = "/dest";

function plan(items: SortPlanItem[]): SortPlan {
  return {
    rule: "by-date",
    root: ROOT,
    items,
  };
}

describe("planToTree", () => {
  it("returns an empty tree for an empty plan", () => {
    const tree = planToTree(plan([]));

    expect(tree).toEqual([]);
  });

  it("groups files by their immediate parent folder", () => {
    const tree = planToTree(
      plan([
        { source: "/src/a.jpg", target: "/dest/Photos/a.jpg" },
        { source: "/src/b.jpg", target: "/dest/Photos/b.jpg" },
        { source: "/src/c.mp4", target: "/dest/Videos/c.mp4" },
      ]),
    );

    expect(tree).toEqual([
      {
        kind: "folder",
        label: "Photos",
        children: [{ kind: "file", label: "2 files" }],
      },
      {
        kind: "folder",
        label: "Videos",
        children: [{ kind: "file", label: "1 file" }],
      },
    ]);
  });

  it("nests by-date-and-place segments under month folders", () => {
    const tree = planToTree(
      plan([
        { source: "/src/1.jpg", target: "/dest/August 2024/Paris, France/1.jpg" },
        { source: "/src/2.jpg", target: "/dest/August 2024/Paris, France/2.jpg" },
        { source: "/src/3.jpg", target: "/dest/August 2024/Lviv, Ukraine/3.jpg" },
        { source: "/src/4.jpg", target: "/dest/February 2024/Unknown location/4.jpg" },
      ]),
    );

    expect(tree).toEqual([
      {
        kind: "folder",
        label: "August 2024",
        children: [
          {
            kind: "folder",
            label: "Lviv, Ukraine",
            children: [{ kind: "file", label: "1 file" }],
          },
          {
            kind: "folder",
            label: "Paris, France",
            children: [{ kind: "file", label: "2 files" }],
          },
        ],
      },
      {
        kind: "folder",
        label: "February 2024",
        children: [
          {
            kind: "folder",
            label: "Unknown location",
            children: [{ kind: "file", label: "1 file" }],
          },
        ],
      },
    ]);
  });

  it("places top-level Misc files at the tree root", () => {
    const tree = planToTree(
      plan([
        { source: "/src/x.jpg", target: "/dest/Photos/x.jpg" },
        { source: "/src/y.jpg", target: "/dest/Misc/y.jpg" },
      ]),
    );

    expect(tree).toEqual([
      {
        kind: "folder",
        label: "Misc",
        children: [{ kind: "file", label: "1 file" }],
      },
      {
        kind: "folder",
        label: "Photos",
        children: [{ kind: "file", label: "1 file" }],
      },
    ]);
  });

  it("handles Windows-style separators in target paths", () => {
    const tree = planToTree({
      rule: "by-date",
      root: "C:\\dest",
      items: [
        { source: "C:\\src\\a.jpg", target: "C:\\dest\\August 2024\\a.jpg" },
        { source: "C:\\src\\b.jpg", target: "C:\\dest\\August 2024\\b.jpg" },
      ],
    });

    expect(tree).toEqual([
      {
        kind: "folder",
        label: "August 2024",
        children: [{ kind: "file", label: "2 files" }],
      },
    ]);
  });

  it("uses singular 'file' for single-file folders and 'files' otherwise", () => {
    const tree = planToTree(
      plan([
        { source: "/src/a.jpg", target: "/dest/Solo/a.jpg" },
        { source: "/src/b.jpg", target: "/dest/Pair/b.jpg" },
        { source: "/src/c.jpg", target: "/dest/Pair/c.jpg" },
      ]),
    );

    expect(tree).toEqual([
      {
        kind: "folder",
        label: "Pair",
        children: [{ kind: "file", label: "2 files" }],
      },
      {
        kind: "folder",
        label: "Solo",
        children: [{ kind: "file", label: "1 file" }],
      },
    ]);
  });
});
