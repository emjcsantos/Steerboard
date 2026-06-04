import { describe, expect, it } from "vitest";
import { buildDispatchPackage } from "./dispatch";
import type { PlanningDraft } from "./planning";
import { createMockRunFromDispatchPackage } from "./run";
import type { MockOrchestratorRun } from "./run";
import { transitionMockRunStatus } from "./runLifecycle";
import { buildRunTimeline, summarizeRunTimeline } from "./runEvents";

const testProject = {
  id: "timeline-project",
  name: "Timeline Mock Project"
};

const baseDraft: PlanningDraft = {
  title: "Timeline fixture",
  objective: "Build a deterministic timeline view for a mock orchestrator run.",
  targetProjectId: testProject.id,
  scope: ["timeline scopes"],
  fileAreas: ["src/run.ts"],
  acceptanceCriteria: ["Timeline data is deterministic.", "Counts are stable for status transitions."],
  validationPlan: ["npm run test -- src/runEvents.test.ts", "npm run test -- runLifecycle.test.ts"],
  risk: "low",
  rollbackNote: "No operational rollback is required.",
  deployMode: "dry-run"
};

describe("run event timeline building", () => {
  it("returns run, task, session, and validation events in sequence with stable IDs", () => {
    const dispatchPackage = buildDispatchPackage(baseDraft, testProject, {
      idSeed: "timeline-seed",
      createdAt: "2026-06-04T09:00:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "timeline-run-seed",
      createdAt: "2026-06-04T09:00:00.000Z",
      status: "running"
    });
    const events = buildRunTimeline(run);
    const expectedLength = 1 + run.tasks.length + run.sessions.length + run.validationGates.length;

    expect(events).toHaveLength(expectedLength);
    expect(events.map((event) => event.sequence)).toEqual(events.map((_, index) => index));

    const [runEvent, ...rest] = events;
    expect(runEvent).toEqual({
      id: `${run.id}:timeline:run`,
      kind: "run",
      label: `Run ${run.status}`,
      detail: run.title,
      actor: "Orchestrator",
      status: run.status,
      sequence: 0,
      createdAt: run.createdAt
    });

    const expectedTaskEvents = run.tasks.map((task, index) => ({
      id: `${run.id}:timeline:task:${task.id}`,
      kind: "task" as const,
      label: task.title,
      detail: `Role: ${task.role}; First validation command: ${task.validationCommands[0]}`,
      actor: task.owner,
      status: task.status,
      sequence: index + 1,
      createdAt: run.createdAt
    }));

    const expectedSessionEvents = run.sessions.map((session, index) => ({
      id: `${run.id}:timeline:session:${session.id}`,
      kind: "session" as const,
      label: session.title,
      detail: `Validation: ${session.validation}`,
      actor: session.role,
      status: session.state,
      sequence: index + 1 + run.tasks.length,
      createdAt: run.createdAt
    }));

    const gateSequenceStart = 1 + run.tasks.length + run.sessions.length;
    const expectedValidationEvents = run.validationGates.map((gate, index) => ({
      id: `${run.id}:timeline:gate:${gate.id}`,
      kind: "validation" as const,
      label: gate.label,
      detail: `Command: ${gate.command}`,
      actor: "Validation",
      status: gate.status,
      sequence: gateSequenceStart + index,
      createdAt: run.createdAt
    }));

    const eventSnapshot = [
      ...expectedTaskEvents,
      ...expectedSessionEvents,
      ...expectedValidationEvents
    ];

    expect(rest).toEqual(eventSnapshot);
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
  });
});

describe("run event timeline summary", () => {
  const buildRun = (status: "queued" | "running" | "complete" | "failed"): MockOrchestratorRun => {
    const dispatchPackage = buildDispatchPackage(baseDraft, testProject, {
      idSeed: "summary-seed",
      createdAt: "2026-06-04T10:00:00.000Z",
      status: "ready"
    });

    return transitionMockRunStatus(
      createMockRunFromDispatchPackage(dispatchPackage, {
        idSeed: "summary-run-seed",
        createdAt: "2026-06-04T10:00:00.000Z",
        status
      }),
      status
    );
  };

  it("counts active events after lifecycle transition to running", () => {
    const running = buildRun("running");
    const summary = summarizeRunTimeline(buildRunTimeline(running));

    expect(summary.activeCount).toBe(1 + running.tasks.length + running.sessions.length + running.validationGates.length);
    expect(summary.issueCount).toBe(0);
    expect(summary.completeCount).toBe(0);
  });

  it("counts complete events after lifecycle transition to complete", () => {
    const complete = buildRun("complete");
    const summary = summarizeRunTimeline(buildRunTimeline(complete));

    expect(summary.issueCount).toBe(0);
    expect(summary.activeCount).toBe(0);
    expect(summary.completeCount).toBe(summary.total);
  });

  it("counts issue events after lifecycle transition to failed", () => {
    const failed = buildRun("failed");
    const summary = summarizeRunTimeline(buildRunTimeline(failed));

    expect(summary.completeCount).toBe(0);
    expect(summary.activeCount).toBe(0);
    expect(summary.issueCount).toBe(summary.total);
  });

  it("does not mutate the source run when building timeline events", () => {
    const dispatchPackage = buildDispatchPackage(baseDraft, testProject, {
      idSeed: "immutable-seed",
      createdAt: "2026-06-04T11:00:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "immutable-run-seed",
      createdAt: "2026-06-04T11:00:00.000Z",
      status: "running"
    });
    const baseline = JSON.parse(JSON.stringify(run)) as MockOrchestratorRun;

    buildRunTimeline(run);

    expect(run).toEqual(baseline);
  });
});
