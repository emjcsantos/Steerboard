import { describe, expect, it } from "vitest";
import { createCockpitPanelRoster } from "./cockpitPanelRoster";
import type { SessionSummary } from "./fixtures";

function buildSession(overrides: Partial<SessionSummary>): SessionSummary {
  return {
    id: "session-id",
    projectId: "project-id",
    title: "Arena panel",
    role: "implementer",
    state: "implementing",
    branch: "feature/cockpit",
    runtime: "Mock runtime",
    attempt: 1,
    validation: "Pending validation",
    files: ["src/cockpit.ts"],
    transcript: ["Session started."],
    tools: ["Edit"],
    ...overrides
  };
}

describe("createCockpitPanelRoster", () => {
  it("returns waiting signal for no sessions", () => {
    const roster = createCockpitPanelRoster([], 0, 0);

    expect(roster).toEqual({
      label: "No panels",
      detail: "No Arena panels are available.",
      tone: "waiting",
      visibleLabel: "0/0 visible",
      hiddenLabel: "0 hidden",
      metrics: [
        { label: "Orchestrator", value: "0", tone: "orchestrator" },
        { label: "Workers", value: "0", tone: "worker" },
        { label: "Validators", value: "0", tone: "validator" },
        { label: "Integration", value: "0", tone: "integration" }
      ]
    });
  });

  it("returns active signal with ordered role metrics from visible panels", () => {
    const sessions = [
      buildSession({ id: "session-orchestrator", role: "orchestrator", state: "planning" }),
      buildSession({ id: "session-worker", role: "implementer", state: "implementing" }),
      buildSession({ id: "session-validator", role: "validator", state: "validating" }),
      buildSession({ id: "session-integration", role: "integration", state: "idle" }),
      buildSession({ id: "session-hidden", role: "implementer", state: "idle" })
    ];

    const roster = createCockpitPanelRoster(sessions, 4, 0);

    expect(roster).toEqual({
      label: "Panels active",
      detail: "Monitor active roles across the Arena grid.",
      tone: "active",
      visibleLabel: "4/5 visible",
      hiddenLabel: "1 hidden",
      metrics: [
        { label: "Orchestrator", value: "1", tone: "orchestrator" },
        { label: "Workers", value: "1", tone: "worker" },
        { label: "Validators", value: "1", tone: "validator" },
        { label: "Integration", value: "1", tone: "integration" }
      ]
    });
  });

  it("prioritizes review tone when any visible panel is blocked or failed", () => {
    const sessions = [
      buildSession({ role: "orchestrator", state: "complete", id: "session-orchestrator" }),
      buildSession({ role: "implementer", state: "failed", id: "session-failed" }),
      buildSession({ role: "validator", state: "complete", id: "session-validator" })
    ];

    const roster = createCockpitPanelRoster(sessions, 3, 2);

    expect(roster).toEqual({
      label: "Panel review needed",
      detail: "Blocked or failed panels need attention.",
      tone: "blocked",
      visibleLabel: "2/3 visible",
      hiddenLabel: "1 hidden",
      metrics: [
        { label: "Orchestrator", value: "1", tone: "orchestrator" },
        { label: "Workers", value: "1", tone: "worker" },
        { label: "Validators", value: "0", tone: "validator" },
        { label: "Integration", value: "0", tone: "integration" }
      ]
    });
  });

  it("returns complete signal when visible panels are all complete", () => {
    const sessions = [
      buildSession({ role: "orchestrator", state: "complete", id: "session-orchestrator" }),
      buildSession({ role: "implementer", state: "complete", id: "session-worker" }),
      buildSession({ role: "validator", state: "complete", id: "session-validator" })
    ];

    const roster = createCockpitPanelRoster(sessions, 5, 0);

    expect(roster).toEqual({
      label: "All panels complete",
      detail: "Every visible panel is complete.",
      tone: "complete",
      visibleLabel: "3/3 visible",
      hiddenLabel: "0 hidden",
      metrics: [
        { label: "Orchestrator", value: "1", tone: "orchestrator" },
        { label: "Workers", value: "1", tone: "worker" },
        { label: "Validators", value: "1", tone: "validator" },
        { label: "Integration", value: "0", tone: "integration" }
      ]
    });
  });

  it("respects maxVisible clamp when calculating visible and hidden labels", () => {
    const sessions = Array.from({ length: 6 }, (_, index) =>
      buildSession({
        id: `session-${index}`,
        role: index % 2 === 0 ? "implementer" : "validator",
        state: index % 2 === 0 ? "implementing" : "planning"
      })
    );

    const roster = createCockpitPanelRoster(sessions, 5, 4);

    expect(roster.visibleLabel).toBe("4/6 visible");
    expect(roster.hiddenLabel).toBe("2 hidden");
    expect(roster.metrics).toEqual([
      { label: "Orchestrator", value: "0", tone: "orchestrator" },
      { label: "Workers", value: "2", tone: "worker" },
      { label: "Validators", value: "2", tone: "validator" },
      { label: "Integration", value: "0", tone: "integration" }
    ]);
  });

  it("treats maxVisible as 0 as unlimited", () => {
    const sessions = [
      buildSession({ id: "session-1", role: "orchestrator" }),
      buildSession({ id: "session-2", role: "implementer" }),
      buildSession({ id: "session-3", role: "validator" }),
      buildSession({ id: "session-4", role: "integration" }),
      buildSession({ id: "session-5", role: "implementer" })
    ];

    const roster = createCockpitPanelRoster(sessions, 4, 0);

    expect(roster.visibleLabel).toBe("4/5 visible");
    expect(roster.hiddenLabel).toBe("1 hidden");
    expect(roster.label).toBe("Panels active");
  });

  it("sanitizes negative and decimal visible/max counts", () => {
    const sessions = [
      buildSession({ role: "orchestrator" }),
      buildSession({ role: "implementer" }),
      buildSession({ role: "validator" })
    ];

    const roster = createCockpitPanelRoster(sessions, -1.8, 2.9);

    expect(roster.visibleLabel).toBe("0/3 visible");
    expect(roster.hiddenLabel).toBe("3 hidden");
    expect(roster.label).toBe("Panels active");
    expect(roster.metrics).toEqual([
      { label: "Orchestrator", value: "0", tone: "orchestrator" },
      { label: "Workers", value: "0", tone: "worker" },
      { label: "Validators", value: "0", tone: "validator" },
      { label: "Integration", value: "0", tone: "integration" }
    ]);
  });
});
