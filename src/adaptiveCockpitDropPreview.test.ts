import { describe, expect, it } from "vitest";
import {
  buildProjectDropPayload,
  buildSessionDropPayload,
  type AdaptiveCockpitDropPayload
} from "./adaptiveCockpitDrop";
import { createAdaptiveCockpitDropPreview } from "./adaptiveCockpitDropPreview";

describe("adaptiveCockpitDropPreview", () => {
  it("returns ready for all supported payload sources", () => {
    const cases: AdaptiveCockpitDropPayload[] = [
      buildProjectDropPayload("project-1", "Project Atlas"),
      buildSessionDropPayload("session-1", "Session One"),
      {
        kind: "adaptive-cockpit-drop",
        version: 1,
        source: "run",
        runId: "run-1",
        runTitle: "Run 10"
      },
      {
        kind: "adaptive-cockpit-drop",
        version: 1,
        source: "task",
        taskId: "task-1",
        taskTitle: "Task A"
      },
      {
        kind: "adaptive-cockpit-drop",
        version: 1,
        source: "evidence",
        panelId: "panel-evidence"
      }
    ];

    for (const payload of cases) {
      const preview = createAdaptiveCockpitDropPreview(
        payload,
        "panel-alpha",
        { isAdaptiveMode: true }
      );

      expect(preview.status).toBe("ready");
      expect(preview.tone).toBe("success");
      expect(preview.label).toContain("Drop");
      expect(preview.detail).toContain("Ready to place");
      expect(preview.action).toBe("Release to place.");
    }
  });

  it("returns unsupported for unsupported payload source", () => {
    const preview = createAdaptiveCockpitDropPreview(
      {
        kind: "adaptive-cockpit-drop",
        version: 1,
        source: "artifact"
      } as unknown as AdaptiveCockpitDropPayload,
      "panel-alpha",
      { isAdaptiveMode: true }
    );

    expect(preview.status).toBe("unsupported");
    expect(preview.tone).toBe("warning");
    expect(preview.label).toBe("Unsupported drop item");
    expect(preview.detail).toContain("not supported");
  });

  it("returns unavailable when adaptive mode is disabled", () => {
    const preview = createAdaptiveCockpitDropPreview(
      buildProjectDropPayload("project-1", "Project Atlas"),
      "panel-alpha",
      { isAdaptiveMode: false }
    );

    expect(preview.status).toBe("unavailable");
    expect(preview.tone).toBe("danger");
    expect(preview.label).toBe("Adaptive drop unavailable");
    expect(preview.action).toBe("Enable adaptive mode.");
  });

  it("returns unavailable when payload is null", () => {
    const preview = createAdaptiveCockpitDropPreview(
      null,
      "panel-alpha",
      { isAdaptiveMode: true }
    );

    expect(preview.status).toBe("unavailable");
    expect(preview.label).toBe("Drop item unavailable");
    expect(preview.detail).toContain("No drop payload");
  });

  it("returns unavailable when target panel is unresolved", () => {
    const preview = createAdaptiveCockpitDropPreview(
      buildSessionDropPayload("session-1", "Session One"),
      null,
      { isAdaptiveMode: true }
    );

    expect(preview.status).toBe("unavailable");
    expect(preview.label).toBe("Drop target unavailable");
    expect(preview.detail).toContain("has no resolved adaptive panel target");
    expect(preview.action).toContain("Drop directly onto a valid panel");
  });

  it("supports malformed payload as unsupported rather than throwing", () => {
    const preview = createAdaptiveCockpitDropPreview(
      {
        kind: "adaptive-cockpit-drop",
        version: 1,
        source: "session",
        sessionId: "session-1"
      } as AdaptiveCockpitDropPayload,
      "panel-alpha",
      { isAdaptiveMode: true }
    );

    expect(preview.status).toBe("unsupported");
    expect(preview.label).toBe("Unsupported drop item");
    expect(preview.detail).toContain("missing required item details");
  });
});
