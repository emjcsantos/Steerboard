import { describe, expect, it } from "vitest";
import { createAdaptiveProjectPanelStack } from "./adaptiveCockpitProjectStack";

describe("createAdaptiveProjectPanelStack", () => {
  it("prefers project sessions by cockpit role priority", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [
        { id: "validator", projectId: "project-a", role: "validator", state: "validating" },
        { id: "orchestrator", projectId: "project-a", role: "orchestrator", state: "planning" },
        { id: "implementer", projectId: "project-a", role: "implementer", state: "implementing" },
        { id: "integration", projectId: "project-a", role: "integration", state: "idle" },
        { id: "other-project", projectId: "project-b", role: "orchestrator", state: "planning" }
      ],
      fallbackSessionIds: ["fallback-a"],
      maxPanelCount: 4
    });

    expect(result.panelIds).toEqual(["orchestrator", "implementer", "validator", "integration"]);
    expect(result.primaryPanelId).toBe("orchestrator");
    expect(result.templateId).toBe("project-stack");
    expect(result.detail).toContain("4 project panels");
  });

  it("uses state priority inside the same role before source order", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [
        { id: "idle-worker", projectId: "project-a", role: "implementer", state: "idle" },
        { id: "active-worker", projectId: "project-a", role: "implementer", state: "implementing" },
        { id: "blocked-worker", projectId: "project-a", role: "implementer", state: "blocked" }
      ],
      maxPanelCount: 3
    });

    expect(result.panelIds).toEqual(["active-worker", "blocked-worker", "idle-worker"]);
  });

  it("fills remaining slots from fallback ids without duplicates", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [{ id: "project-panel", projectId: "project-a", role: "orchestrator" }],
      fallbackSessionIds: ["project-panel", "fallback-a", "", "fallback-b"],
      maxPanelCount: 3
    });

    expect(result.panelIds).toEqual(["project-panel", "fallback-a", "fallback-b"]);
    expect(result.detail).toContain("plus 2 monitor panels");
  });

  it("ignores malformed ids and caps output to max panel count", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [
        { id: "  ", projectId: "project-a", role: "orchestrator" },
        { id: "valid-a", projectId: "project-a", role: "validator" },
        { id: null, projectId: "project-a", role: "implementer" }
      ],
      fallbackSessionIds: ["valid-b", 42, "valid-c"],
      maxPanelCount: 2
    });

    expect(result.panelIds).toEqual(["valid-a", "valid-b"]);
  });

  it("falls back to monitor panels when the project has no sessions", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [{ id: "other", projectId: "project-b", role: "orchestrator" }],
      fallbackSessionIds: ["fallback-a", "fallback-b"],
      maxPanelCount: 2
    });

    expect(result.panelIds).toEqual(["fallback-a", "fallback-b"]);
    expect(result.templateId).toBe("fallback-stack");
    expect(result.label).toBe("Monitor panel stack");
    expect(result.primaryPanelId).toBe("fallback-a");
  });

  it("returns unavailable when no usable project or fallback panels exist", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [
        { id: "", projectId: "project-a", role: "orchestrator" },
        { id: "other", projectId: "project-b", role: "implementer" }
      ],
      fallbackSessionIds: ["", null],
      maxPanelCount: 2
    });

    expect(result.panelIds).toEqual([]);
    expect(result.primaryPanelId).toBe("");
    expect(result.templateId).toBe("unavailable");
    expect(result.label).toContain("unavailable");
  });
});
