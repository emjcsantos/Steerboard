import { describe, expect, it } from "vitest";
import { defaultLayoutByMode, getLayoutSpec, layoutOptions, maxVisibleCells, visibleSessionIds } from "./layout";

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

  it("returns only the sessions that fit the selected layout", () => {
    const sessions = Array.from({ length: 12 }, (_, index) => ({ id: `session-${index + 1}` }));

    expect(visibleSessionIds(sessions, "1x1")).toEqual(["session-1"]);
    expect(visibleSessionIds(sessions, "2x2")).toHaveLength(4);
    expect(visibleSessionIds(sessions, "3x3")).toHaveLength(9);
  });
});
