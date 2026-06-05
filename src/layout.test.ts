import { describe, expect, it } from "vitest";
import {
  defaultLayoutByMode,
  getAdaptivePlaceholderGrid,
  getDisplayGrid,
  getLayoutSpec,
  layoutAriaLabel,
  layoutOptions,
  maxVisibleCells,
  visibleSessionIds
} from "./layout";

describe("cockpit layout model", () => {
  it("keeps the visible cockpit maximum at nine cells", () => {
    for (const layout of layoutOptions) {
      expect(maxVisibleCells(layout.id)).toBeLessThanOrEqual(9);
    }
  });

  it("defines defaults for every cockpit mode", () => {
    expect(getLayoutSpec(defaultLayoutByMode.focus)).toMatchObject({ columns: 2, rows: 1 });
    expect(getLayoutSpec(defaultLayoutByMode.orchestrator)).toMatchObject({ columns: 2, rows: 2 });
    expect(getLayoutSpec(defaultLayoutByMode.monitor)).toMatchObject({ columns: 3, rows: 2 });
  });

  it("offers fixed presets plus the adaptive entry point in selector order", () => {
    expect(layoutOptions.map((layout) => layout.id)).toEqual([
      "1x1",
      "2x1",
      "1x2",
      "3x1",
      "1x3",
      "2x2",
      "2x3",
      "3x2",
      "3x3",
      "adaptive"
    ]);
    expect(getLayoutSpec("adaptive")).toMatchObject({
      label: "Adaptive",
      kind: "adaptive",
      columns: 3,
      rows: 3
    });
  });

  it("describes layout options for accessible dropdown labels", () => {
    expect(layoutAriaLabel(getLayoutSpec("2x1"))).toBe("2x1: Two panels side by side.");
    expect(layoutAriaLabel(getLayoutSpec("adaptive"))).toContain("Adaptive");
  });

  it("chooses a compact safe placeholder grid for adaptive layout", () => {
    expect(getAdaptivePlaceholderGrid(1)).toEqual({ columns: 1, rows: 1 });
    expect(getAdaptivePlaceholderGrid(2)).toEqual({ columns: 2, rows: 1 });
    expect(getAdaptivePlaceholderGrid(3)).toEqual({ columns: 3, rows: 1 });
    expect(getAdaptivePlaceholderGrid(4)).toEqual({ columns: 2, rows: 2 });
    expect(getAdaptivePlaceholderGrid(6)).toEqual({ columns: 3, rows: 2 });
    expect(getAdaptivePlaceholderGrid(9)).toEqual({ columns: 3, rows: 3 });
    expect(getAdaptivePlaceholderGrid(12)).toEqual({ columns: 3, rows: 3 });
  });

  it("uses fixed grid dimensions for presets and adaptive dimensions for adaptive", () => {
    expect(getDisplayGrid(getLayoutSpec("2x3"), 4)).toEqual({ columns: 2, rows: 3 });
    expect(getDisplayGrid(getLayoutSpec("adaptive"), 4)).toEqual({ columns: 2, rows: 2 });
  });

  it("returns only the sessions that fit the selected layout", () => {
    const sessions = Array.from({ length: 12 }, (_, index) => ({ id: `session-${index + 1}` }));

    expect(visibleSessionIds(sessions, "1x1")).toEqual(["session-1"]);
    expect(visibleSessionIds(sessions, "2x2")).toHaveLength(4);
    expect(visibleSessionIds(sessions, "3x3")).toHaveLength(9);
    expect(visibleSessionIds(sessions, "adaptive")).toHaveLength(9);
  });
});
