import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_COCKPIT_LAYOUT_STORAGE_KEY,
  parseStoredAdaptiveCockpitLayout
} from "./adaptiveCockpitLayoutStorage";

describe("adaptive Arena layout storage", () => {
  it("repairs persisted layout payloads", () => {
    const parsed = parseStoredAdaptiveCockpitLayout(
      JSON.stringify({
        columns: 7,
        rows: 7,
        panels: [
          { id: "orchestrator", x: 0, y: 0, w: 1, h: 1, hidden: false },
          { id: "worker", x: 4, y: 4, w: 4, h: 4, hidden: true }
        ]
      })
    );

    expect(parsed.columns).toBe(3);
    expect(parsed.rows).toBe(3);
    expect(parsed.panels).toHaveLength(2);
    expect(parsed.panels[1]).toMatchObject({
      id: "worker",
      x: 2,
      y: 2,
      w: 1,
      h: 1,
      hidden: true
    });
  });

  it("falls back for malformed storage and exposes a stable key", () => {
    const parsed = parseStoredAdaptiveCockpitLayout("{");

    expect(ADAPTIVE_COCKPIT_LAYOUT_STORAGE_KEY).toBe("steerboard.adaptive.cockpit.layout");
    expect(parsed.panels[0].id).toBe("panel-1");
  });
});
