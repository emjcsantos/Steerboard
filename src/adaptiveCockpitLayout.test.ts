import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_LAYOUT_COLUMNS,
  ADAPTIVE_LAYOUT_ROWS,
  ADAPTIVE_LAYOUT_MAX_PANELS,
  addAdaptiveCockpitPanel,
  createAdaptiveCockpitLayoutForPanelIds,
  createDefaultAdaptiveCockpitLayout,
  hiddenAdaptiveCockpitPanels,
  hideAdaptiveCockpitPanel,
  moveAdaptiveCockpitPanel,
  repairAdaptiveCockpitLayout,
  removeAdaptiveCockpitPanel,
  resizeAdaptiveCockpitPanel,
  revealAdaptiveCockpitPanel,
  syncAdaptiveCockpitLayoutToPanelIds,
  visibleAdaptiveCockpitPanels
} from "./adaptiveCockpitLayout";

describe("adaptive cockpit layout model", () => {
  it("creates a bounded default layout with one visible panel", () => {
    const layout = createDefaultAdaptiveCockpitLayout();

    expect(layout.columns).toBe(ADAPTIVE_LAYOUT_COLUMNS);
    expect(layout.rows).toBe(ADAPTIVE_LAYOUT_ROWS);
    expect(layout.panels).toHaveLength(1);
    expect(layout.panels[0]).toMatchObject({
      id: "panel-1",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      hidden: false
    });
  });

  it("adds a panel while enforcing max panel count", () => {
    let layout = createDefaultAdaptiveCockpitLayout();
    for (let index = 2; index <= ADAPTIVE_LAYOUT_MAX_PANELS; index++) {
      layout = addAdaptiveCockpitPanel(layout, {
        id: `panel-${index}`,
        x: index - 1,
        y: 0,
        w: 1,
        h: 1
      });
    }

    expect(layout.panels).toHaveLength(ADAPTIVE_LAYOUT_MAX_PANELS);

    const overflow = addAdaptiveCockpitPanel(layout, { id: "overflow", x: 0, y: 1, w: 1, h: 1 });
    expect(overflow.panels).toHaveLength(ADAPTIVE_LAYOUT_MAX_PANELS);
    expect(overflow).toBe(layout);
  });

  it("moves a panel with collision resolution by shifting within grid", () => {
    let layout = createDefaultAdaptiveCockpitLayout();
    layout = addAdaptiveCockpitPanel(layout, { id: "panel-2", x: 1, y: 0 });
    layout = addAdaptiveCockpitPanel(layout, { id: "panel-3", x: 2, y: 0 });
    const moved = moveAdaptiveCockpitPanel(layout, "panel-1", { x: 1, y: 0 });

    expect(moved.panels.find((panel) => panel.id === "panel-1")).toMatchObject({
      x: 0,
      y: 1,
      w: 1,
      h: 1
    });
  });

  it("resizes a panel with collision and shifts it if needed", () => {
    let layout = createDefaultAdaptiveCockpitLayout();
    layout = addAdaptiveCockpitPanel(layout, { id: "panel-2", x: 1, y: 0 });
    layout = addAdaptiveCockpitPanel(layout, { id: "panel-3", x: 0, y: 1 });
    layout = addAdaptiveCockpitPanel(layout, { id: "panel-4", x: 2, y: 0 });
    const resized = resizeAdaptiveCockpitPanel(layout, "panel-1", { w: 2, h: 1 });

    expect(resized.panels.find((panel) => panel.id === "panel-1")).toMatchObject({
      x: 1,
      y: 1,
      w: 2,
      h: 1
    });
  });

  it("hides and reveals a panel", () => {
    let layout = createDefaultAdaptiveCockpitLayout();
    layout = addAdaptiveCockpitPanel(layout, { id: "panel-2", x: 1, y: 0 });
    layout = addAdaptiveCockpitPanel(layout, { id: "panel-3", x: 0, y: 1 });

    const hidden = hideAdaptiveCockpitPanel(layout, "panel-2");
    expect(hidden.panels.find((panel) => panel.id === "panel-2")?.hidden).toBe(true);

    const revealed = revealAdaptiveCockpitPanel(hidden, "panel-2");
    expect(revealed.panels.find((panel) => panel.id === "panel-2")).toMatchObject({
      hidden: false,
      x: 1,
      y: 0
    });
  });

  it("removes a panel and preserves other panel geometry", () => {
    let layout = createDefaultAdaptiveCockpitLayout();
    layout = addAdaptiveCockpitPanel(layout, { id: "panel-2", x: 1, y: 0 });
    const removed = removeAdaptiveCockpitPanel(layout, "panel-1");

    expect(removed.panels).toHaveLength(1);
    expect(removed.panels[0].id).toBe("panel-2");
  });

  it("keeps the previous rect when no non-colliding placement exists", () => {
    let layout = createDefaultAdaptiveCockpitLayout();
    for (let index = 2; index <= ADAPTIVE_LAYOUT_MAX_PANELS; index++) {
      layout = addAdaptiveCockpitPanel(layout, {
        id: `panel-${index}`,
        x: (index - 1) % ADAPTIVE_LAYOUT_COLUMNS,
        y: Math.floor((index - 1) / ADAPTIVE_LAYOUT_COLUMNS)
      });
    }

    const before = layout.panels.find((panel) => panel.id === "panel-1");
    const resized = resizeAdaptiveCockpitPanel(layout, "panel-1", { w: 3, h: 3 });

    expect(before).toEqual(resized.panels.find((panel) => panel.id === "panel-1"));
  });

  it("repairs malformed saved layouts and resolves collisions safely", () => {
    const repaired = repairAdaptiveCockpitLayout({
      columns: 4,
      rows: 4,
      panels: [
        { id: "panel-1", x: 0, y: 0, w: 1, h: 1, hidden: false },
        { id: "panel-1", x: 0, y: 0, w: 1, h: 1, hidden: false },
        { id: 5, x: 2, y: 0, w: 1, h: 1, hidden: "yes" },
        { id: "panel-3", x: 1.6, y: 1.6, w: 1.2, h: 1.4, hidden: false }
      ]
    });

    expect(repaired.panels).toHaveLength(3);
    expect(repaired.columns).toBe(3);
    expect(repaired.rows).toBe(3);
    expect(repaired.panels.map((panel) => panel.id)).toEqual(["panel-1", "panel-1-2", "panel-3"]);
    expect(repaired.panels.some((panel) => panel.hidden)).toBe(false);
    expect(new Set(repaired.panels.map((panel) => panel.id)).size).toBe(repaired.panels.length);
    for (const panel of repaired.panels) {
      expect(panel.x).toBeGreaterThanOrEqual(0);
      expect(panel.y).toBeGreaterThanOrEqual(0);
      expect(panel.w).toBeGreaterThanOrEqual(1);
      expect(panel.h).toBeGreaterThanOrEqual(1);
      expect(panel.x + panel.w).toBeLessThanOrEqual(repaired.columns);
      expect(panel.y + panel.h).toBeLessThanOrEqual(repaired.rows);
    }
  });

  it("creates adaptive layouts from real cockpit panel ids", () => {
    const layout = createAdaptiveCockpitLayoutForPanelIds(
      ["orchestrator", "worker", "validator", "integration", "worker"],
      2
    );

    expect(layout.panels.map((panel) => panel.id)).toEqual([
      "orchestrator",
      "worker",
      "validator",
      "integration"
    ]);
    expect(visibleAdaptiveCockpitPanels(layout).map((panel) => panel.id)).toEqual([
      "orchestrator",
      "worker"
    ]);
    expect(hiddenAdaptiveCockpitPanels(layout).map((panel) => panel.id)).toEqual([
      "validator",
      "integration"
    ]);
  });

  it("syncs saved adaptive layout to the active cockpit sessions", () => {
    const saved = repairAdaptiveCockpitLayout({
      panels: [
        { id: "removed", x: 0, y: 0, w: 1, h: 1, hidden: false },
        { id: "worker", x: 1, y: 0, w: 1, h: 1, hidden: true }
      ]
    });
    const synced = syncAdaptiveCockpitLayoutToPanelIds(
      saved,
      ["orchestrator", "worker", "validator"],
      2
    );

    expect(synced.panels.map((panel) => panel.id)).toEqual([
      "worker",
      "orchestrator",
      "validator"
    ]);
    expect(synced.panels.some((panel) => panel.id === "removed")).toBe(false);
    expect(visibleAdaptiveCockpitPanels(synced).length).toBeGreaterThan(0);
  });
});
