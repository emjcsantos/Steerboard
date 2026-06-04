import { describe, expect, it } from "vitest";
import type { MockOrchestratorRun } from "./run";
import type { MockRunSessionSummary } from "./run";
import type { OrchestrationTask } from "./orchestration";
import { createCockpitMonitorLoop } from "./cockpitMonitorLoop";

function buildTask(overrides: Partial<OrchestrationTask>): OrchestrationTask {
  return {
    id: "task-implementation",
    projectId: "project-id",
    title: "Implementation task",
    role: "implementation",
    status: "implementing",
    attempt: 0,
    attemptLimit: 1,
    owner: "Mock worker",
    objective: "Build mock worker task.",
    scope: ["task scope"],
    fileOwnership: ["src/task.ts"],
    acceptanceCriteria: ["task completes"],
    validationCommands: ["Validate task"],
    dependencies: [],
    rollback: "No rollback needed.",
    ...overrides
  };
}

function buildSession(overrides: Partial<MockRunSessionSummary> = {}): MockRunSessionSummary {
  return {
    id: "session-implementation",
    projectId: "project-id",
    title: "Implementation session",
    role: "implementer",
    state: "implementing",
    branch: "feature/implementation",
    runtime: "Mock runtime",
    attempt: 0,
    validation: "task validation",
    files: ["src/task.ts"],
    transcript: ["Task started."],
    tools: ["Edit"],
    ...overrides
  };
}

function buildRun(overrides: Partial<MockOrchestratorRun> = {}): MockOrchestratorRun {
  return {
    id: "mock-run-id",
    projectId: "project-id",
    projectName: "Mock project",
    title: "Mock run",
    status: "running",
    createdAt: "2026-06-05T00:00:00.000Z",
    sourcePackageId: "source-package",
    summary: {
      objective: "Monitor loop behavior.",
      scopeCount: 1,
      fileAreaCount: 1,
      acceptanceCriteriaCount: 1,
      validationGateCount: 0,
      risk: "low"
    },
    sessions: [],
    tasks: [buildTask({ attemptLimit: 3 })],
    validationGates: [],
    ...overrides
  };
}

describe("createCockpitMonitorLoop", () => {
  it("returns no loop active state when no run is provided", () => {
    expect(createCockpitMonitorLoop(undefined)).toEqual({
      label: "No loop active",
      detail: "Stage a run to monitor worker attempts.",
      tone: "waiting",
      attemptLabel: "0/3",
      gateLabel: "0/0 gates",
      workerLabel: "0 panels"
    });
  });

  it("returns running state for active attempts with progress", () => {
    const run = buildRun({
      tasks: [buildTask({ attempt: 1, attemptLimit: 4 })],
      sessions: [buildSession({ attempt: 3 })],
      validationGates: []
    });

    const signal = createCockpitMonitorLoop(run);

    expect(signal).toEqual({
      label: "Loop running",
      detail: "Worker attempts are progressing.",
      tone: "running",
      attemptLabel: "3/4",
      gateLabel: "0/0 gates",
      workerLabel: "1 panel"
    });
  });

  it("returns validating when validation is active", () => {
    const run = buildRun({
      tasks: [buildTask({ status: "validating", attemptLimit: 3 })],
      validationGates: [{ id: "gate-1", label: "dispatch", command: "test", status: "pending", detail: "Running validation." }]
    });

    const signal = createCockpitMonitorLoop(run);

    expect(signal).toEqual({
      label: "Validation active",
      detail: "Validation gates are still running.",
      tone: "validating",
      attemptLabel: "0/3",
      gateLabel: "0/1 gates",
      workerLabel: "0 panels"
    });
  });

  it("returns blocked when a gate failed", () => {
    const run = buildRun({
      validationGates: [{ id: "gate-1", label: "dispatch", command: "test", status: "failed", detail: "Gate failed." }]
    });

    const signal = createCockpitMonitorLoop(run);

    expect(signal).toEqual({
      label: "Loop needs review",
      detail: "Worker attempts or validation gates need review.",
      tone: "blocked",
      attemptLabel: "0/3",
      gateLabel: "1 failed",
      workerLabel: "0 panels"
    });
  });

  it("returns blocked when any non-accepted task is exhausted", () => {
    const run = buildRun({
      tasks: [buildTask({ status: "implementing", attempt: 5, attemptLimit: 4 })],
      validationGates: []
    });

    const signal = createCockpitMonitorLoop(run);

    expect(signal.label).toBe("Loop needs review");
    expect(signal.tone).toBe("blocked");
    expect(signal.attemptLabel).toBe("4/4");
    expect(signal.detail).toBe("Worker attempts or validation gates need review.");
  });

  it("returns complete when run is complete and all gates passed", () => {
    const run = buildRun({
      status: "complete",
      tasks: [
        buildTask({ status: "accepted", attempt: 2, attemptLimit: 2 })
      ],
      validationGates: [
        { id: "gate-1", label: "dispatch", command: "test", status: "passed", detail: "Passed gate." },
        { id: "gate-2", label: "deploy", command: "deploy", status: "passed", detail: "Passed gate." }
      ]
    });

    const signal = createCockpitMonitorLoop(run);

    expect(signal).toEqual({
      label: "Loop complete",
      detail: "Worker handoffs and validation gates are complete.",
      tone: "complete",
      attemptLabel: "2/2",
      gateLabel: "2/2 gates",
      workerLabel: "0 panels"
    });
  });

  it("uses default attempt limit when no positive task limits exist", () => {
    const run = buildRun({
      tasks: [],
      sessions: [buildSession({ attempt: 4 }), buildSession({ attempt: 2 })],
      validationGates: []
    });

    const signal = createCockpitMonitorLoop(run);

    expect(signal.attemptLabel).toBe("3/3");
    expect(signal.gateLabel).toBe("0/0 gates");
    expect(signal.tone).toBe("running");
  });

  it("sanitizes and clamps attempts to attempt limit", () => {
    const run = buildRun({
      tasks: [buildTask({ attempt: -4.6, attemptLimit: 2.2 })],
      sessions: [buildSession({ attempt: 10.9 })],
      validationGates: []
    });

    const signal = createCockpitMonitorLoop(run);

    expect(signal.attemptLabel).toBe("2/2");
    expect(signal.tone).toBe("running");
  });

  it("pluralizes worker labels", () => {
    const runWithOneWorker = buildRun({
      sessions: [buildSession()],
      validationGates: []
    });
    const runWithTwoWorkers = buildRun({
      sessions: [buildSession({ id: "session-2" }), buildSession({ id: "session-3" })],
      validationGates: []
    });

    expect(createCockpitMonitorLoop(runWithOneWorker).workerLabel).toBe("1 panel");
    expect(createCockpitMonitorLoop(runWithTwoWorkers).workerLabel).toBe("2 panels");
  });
});
