import { describe, expect, it } from "vitest";
import { createAdaptiveProjectPanelStack } from "./adaptiveCockpitProjectStack";

describe("createAdaptiveProjectPanelStack", () => {
  it("prefers project sessions by Arena role priority", () => {
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

  it("selects a single project panel first for project-focus and one fallback", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [
        { id: "implementer-a", projectId: "project-a", role: "implementer", state: "implementing" },
        { id: "orchestrator-a", projectId: "project-a", role: "orchestrator", state: "planning" },
        { id: "validator-a", projectId: "project-a", role: "validator", state: "validating" }
      ],
      fallbackSessionIds: ["fallback-a", "fallback-b", "fallback-c"],
      templateId: "project-focus",
      maxPanelCount: 3
    });

    expect(result.templateId).toBe("project-focus");
    expect(result.label).toBe("Project focus stack");
    expect(result.panelIds).toEqual(["orchestrator-a", "fallback-a"]);
    expect(result.primaryPanelId).toBe("orchestrator-a");
    expect(result.detail).toContain("1 project panel plus 1 monitor panel selected for project focus template.");
  });

  it("falls back to a project-monitor style stack with monitor panels filling after project panels", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [
        { id: "validator-a", projectId: "project-a", role: "validator", state: "validating" },
        { id: "orchestrator-a", projectId: "project-a", role: "orchestrator", state: "planning" },
        { id: "other-role", projectId: "project-a", role: "planner", state: "planning" },
        { id: "implementer-a", projectId: "project-a", role: "implementer", state: "implementing" },
        { id: "integration-a", projectId: "project-a", role: "integration", state: "idle" }
      ],
      fallbackSessionIds: ["fallback-a", "fallback-b"],
      templateId: "project-monitor",
      maxPanelCount: 4
    });

    expect(result.templateId).toBe("project-monitor");
    expect(result.label).toBe("Project monitor stack");
    expect(result.panelIds).toEqual(["orchestrator-a", "implementer-a", "validator-a", "integration-a"]);
    expect(result.detail).toContain("4 project panels selected for project monitor template.");
  });

  it("prefers orchestrator + implementer/validator/integration for project-orchestrator", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [
        { id: "planner", projectId: "project-a", role: "planner", state: "planning" },
        { id: "validator-a", projectId: "project-a", role: "validator", state: "validating" },
        { id: "orchestrator-a", projectId: "project-a", role: "orchestrator", state: "planning" },
        { id: "implementer-a", projectId: "project-a", role: "implementer", state: "implementing" },
        { id: "integration-a", projectId: "project-a", role: "integration", state: "idle" },
        { id: "other-role", projectId: "project-a", role: "observer", state: "planning" }
      ],
      fallbackSessionIds: ["fallback-a", "fallback-b"],
      templateId: "project-orchestrator",
      maxPanelCount: 5
    });

    expect(result.templateId).toBe("project-orchestrator");
    expect(result.label).toBe("Project orchestrator stack");
    expect(result.panelIds).toEqual(["orchestrator-a", "implementer-a", "validator-a", "integration-a", "fallback-a"]);
    expect(result.detail).toContain("4 project panels plus 1 monitor panel selected for project-orchestrator template.");
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

  it("falls back invalid requested templates to auto-stack behavior", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [{ id: "orchestrator-a", projectId: "project-a", role: "orchestrator" }],
      templateId: "not-a-template",
      maxPanelCount: 3
    });

    expect(result.templateId).toBe("project-stack");
    expect(result.label).toBe("Project panel stack");
    expect(result.detail).toContain("1 project panel");
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

  it("uses an honest monitor fallback when a requested project template has no project panels", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [{ id: "other", projectId: "project-b", role: "orchestrator" }],
      fallbackSessionIds: ["fallback-a"],
      templateId: "project-focus",
      maxPanelCount: 2
    });

    expect(result.panelIds).toEqual(["fallback-a"]);
    expect(result.templateId).toBe("fallback-stack");
    expect(result.label).toBe("Monitor panel stack");
    expect(result.detail).toContain("1 monitor panel selected for Adaptive Arena.");
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

  it("dedupes fallback IDs against selected project panels", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [{ id: "shared-panel", projectId: "project-a", role: "orchestrator" }],
      fallbackSessionIds: ["shared-panel", "shared-panel", "fallback-b", "fallback-b"],
      templateId: "project-focus",
      maxPanelCount: 3
    });

    expect(result.templateId).toBe("project-focus");
    expect(result.panelIds).toEqual(["shared-panel", "fallback-b"]);
  });

  it("respects max panel count for requested templates", () => {
    const result = createAdaptiveProjectPanelStack({
      projectId: "project-a",
      sessions: [
        { id: "orchestrator-a", projectId: "project-a", role: "orchestrator", state: "planning" },
        { id: "implementer-a", projectId: "project-a", role: "implementer", state: "implementing" },
        { id: "validator-a", projectId: "project-a", role: "validator", state: "validating" },
        { id: "integration-a", projectId: "project-a", role: "integration", state: "idle" }
      ],
      fallbackSessionIds: ["fallback-a", "fallback-b"],
      templateId: "project-orchestrator",
      maxPanelCount: 3
    });

    expect(result.templateId).toBe("project-orchestrator");
    expect(result.panelIds).toEqual(["orchestrator-a", "implementer-a", "validator-a"]);
  });
});
