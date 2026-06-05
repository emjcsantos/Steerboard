import { describe, expect, it } from "vitest";
import { buildDispatchPackage } from "./dispatch";
import { createMockRunFromDispatchPackage } from "./run";
import type { MockOrchestratorRun, MockRunStatus } from "./run";
import type { PlanningDraft } from "./planning";
import { recordWorkerValidationAttemptResult, transitionMockRunStatus } from "./runLifecycle";

const testProject = {
  id: "lifecycle-project",
  name: "Lifecycle Mock Project"
};

const baseDraft: PlanningDraft = {
  title: "Mock run lifecycle fixture",
  objective: "Verify transition behavior across mock run status changes.",
  targetProjectId: testProject.id,
  scope: ["scope-a", "scope-b", "scope-c"],
  fileAreas: ["src/run.ts", "src/runLifecycle.ts"],
  acceptanceCriteria: ["criterion-a", "criterion-b"],
  validationPlan: ["npm run test -- src/runLifecycle.test.ts", "npm run build"],
  risk: "low",
  rollbackNote: "No runtime state is changed.",
  deployMode: "staged"
};

function buildRun(status: MockRunStatus): MockOrchestratorRun {
  const dispatchPackage = buildDispatchPackage(baseDraft, testProject, {
    idSeed: "lifecycle-run-seed",
    createdAt: "2026-06-04T09:00:00.000Z",
    status: status === "queued" ? "staged" : "ready"
  });

  return createMockRunFromDispatchPackage(dispatchPackage, {
    idSeed: "lifecycle-run-seed",
    createdAt: "2026-06-04T09:00:00.000Z",
    status
  });
}

describe("run status transition", () => {
  it("transitions to running with role-aware task and session states", () => {
    const run = buildRun("queued");
    const running = transitionMockRunStatus(run, "running");

    expect(running.status).toBe("running");
    for (const task of running.tasks) {
      if (task.role === "validation") {
        expect(task.status).toBe("validating");
      } else {
        expect(task.status).toBe("implementing");
      }
    }

    for (const task of running.tasks) {
      const session = running.sessions.find((candidate) => candidate.id === `${run.id}:${task.id}`);
      expect(session).toBeDefined();

      if (task.role === "validation") {
        expect(session?.state).toBe("validating");
      } else {
        expect(session?.state).toBe("implementing");
      }

      expect(session?.transcript.some((line) => line.startsWith("Status:"))).toBe(true);
      expect(session?.transcript).toContain(`Status: ${task.status}`);
      expect(session?.transcript).toContain(`Gate status: ${running.status}`);
    }

    expect(running.validationGates.every((gate) => gate.status === "pending")).toBe(true);
  });

  it("transitions to complete with accepted tasks, completed sessions, and passed gates", () => {
    const run = buildRun("running");
    const completed = transitionMockRunStatus(run, "complete");

    expect(completed.status).toBe("complete");
    expect(completed.tasks.every((task) => task.status === "accepted")).toBe(true);
    expect(completed.sessions.every((session) => session.state === "complete")).toBe(true);
    expect(completed.validationGates.every((gate) => gate.status === "passed")).toBe(true);
    expect(
      completed.sessions.every((session) => session.transcript.some((line) => line === "Gate status: complete"))
    ).toBe(true);
  });

  it("maps blocked runs to blocked tasks, blocked sessions, and failed gates", () => {
    const run = buildRun("running");
    const terminal = transitionMockRunStatus(run, "blocked");

    expect(terminal.status).toBe("blocked");
    expect(terminal.tasks.every((task) => task.status === "blocked")).toBe(true);
    expect(terminal.sessions.every((session) => session.state === "blocked")).toBe(true);
    expect(terminal.validationGates.every((gate) => gate.status === "failed")).toBe(true);
    expect(terminal.sessions.every((session) => session.transcript.some((line) => line === "Status: blocked"))).toBe(true);
    expect(
      terminal.sessions.every((session) => session.transcript.some((line) => line === "Gate status: blocked"))
    ).toBe(true);
  });

  it("maps failed runs to blocked tasks, failed sessions, and failed gates", () => {
    const run = buildRun("running");
    const terminal = transitionMockRunStatus(run, "failed");

    expect(terminal.status).toBe("failed");
    expect(terminal.tasks.every((task) => task.status === "blocked")).toBe(true);
    expect(terminal.sessions.every((session) => session.state === "failed")).toBe(true);
    expect(terminal.validationGates.every((gate) => gate.status === "failed")).toBe(true);
    expect(terminal.sessions.every((session) => session.transcript.some((line) => line === "Status: blocked"))).toBe(true);
    expect(
      terminal.sessions.every((session) => session.transcript.some((line) => line === "Gate status: failed"))
    ).toBe(true);
  });

  it("transitions to queued and resets task sessions to planning, with pending gates", () => {
    const run = buildRun("running");
    const queued = transitionMockRunStatus(run, "queued");

    expect(queued.status).toBe("queued");
    expect(queued.tasks.every((task) => task.status === "queued")).toBe(true);
    expect(queued.sessions.every((session) => session.state === "planning")).toBe(true);
    expect(queued.validationGates.every((gate) => gate.status === "pending")).toBe(true);
    expect(
      queued.sessions.every(
        (session) =>
          session.transcript.some((line) => line === "Status: queued") &&
          session.transcript.some((line) => line === "Gate status: queued")
      )
    ).toBe(true);
  });

  it("does not mutate the input run and returns new nested objects", () => {
    const run = buildRun("running");
    const orphanSession = {
      ...run.sessions[0],
      id: `${run.id}:unmatched-session`,
      transcript: ["Orphan session record"]
    };
    const runWithExtraSession: MockOrchestratorRun = {
      ...run,
      sessions: [...run.sessions, orphanSession]
    };

    const next = transitionMockRunStatus(runWithExtraSession, "failed");

    expect(runWithExtraSession.status).toBe("running");
    expect(next.status).toBe("failed");
    expect(next).not.toBe(runWithExtraSession);
    expect(next.tasks).not.toBe(runWithExtraSession.tasks);
    expect(next.sessions).not.toBe(runWithExtraSession.sessions);
    expect(next.validationGates).not.toBe(runWithExtraSession.validationGates);
    expect(next.tasks[0]).not.toBe(runWithExtraSession.tasks[0]);
    expect(next.sessions[0]).not.toBe(runWithExtraSession.sessions[0]);
    expect(next.validationGates[0]).not.toBe(runWithExtraSession.validationGates[0]);
    expect(next.tasks[0].scope).not.toBe(runWithExtraSession.tasks[0].scope);
    expect(next.sessions[0].tools).not.toBe(runWithExtraSession.sessions[0].tools);
    expect(next.validationGates.at(-1)?.status).toBe("failed");
    expect(next.sessions.at(-1)?.state).toBe("failed");
    expect(next.sessions.at(-1)?.transcript).toContain("Status: blocked");
    expect(next.sessions.at(-1)?.transcript).toContain("Gate status: failed");
  });
});

describe("worker validation attempts", () => {
  it("records a passing validation result as accepted and completes the task session", () => {
    const run = buildRun("running");
    const task = run.tasks.find((candidate) => candidate.role === "validation");
    const sessionId = task ? `${run.id}:${task.id}` : "missing";

    if (!task) {
      throw new Error("Expected validation task fixture");
    }

    const next = recordWorkerValidationAttemptResult(run, {
      taskId: task.id,
      sessionId,
      outcome: "pass"
    });

    const updatedTask = next.tasks.find((candidate) => candidate.id === task.id);
    const updatedSession = next.sessions.find((candidate) => candidate.id === sessionId);

    expect(updatedTask?.status).toBe("accepted");
    expect(updatedTask?.attempt).toBe(task.attempt);
    expect(updatedSession?.state).toBe("complete");
    expect(updatedSession?.transcript).toContain(`Status: accepted`);
    expect(next.validationGates.every((gate) => gate.status === "pending")).toBe(true);
    expect(next.status).toBe("running");
  });

  it("records a failed validation attempt by incrementing attempt and preserving active state for retry", () => {
    const run = buildRun("running");
    const task = run.tasks.find((candidate) => candidate.role === "validation");
    const sessionId = task ? `${run.id}:${task.id}` : "missing";

    if (!task) {
      throw new Error("Expected validation task fixture");
    }

    const next = recordWorkerValidationAttemptResult(run, {
      taskId: task.id,
      sessionId,
      outcome: "fail"
    });

    const updatedTask = next.tasks.find((candidate) => candidate.id === task.id);
    const updatedSession = next.sessions.find((candidate) => candidate.id === sessionId);

    expect(updatedTask?.attempt).toBe(task.attempt + 1);
    expect(updatedTask?.status).toBe("validating");
    expect(updatedSession?.attempt).toBe(task.attempt + 1);
    expect(updatedSession?.state).toBe("validating");
    expect(updatedSession?.transcript).toContain(`Status: validating`);
    expect(updatedSession?.transcript).toContain(`Gate status: running`);
    expect(next.validationGates.every((gate) => gate.status === "pending")).toBe(true);
    expect(next.status).toBe("running");
  });

  it("caps validation attempts at attemptLimit and blocks the task and run when exhausted", () => {
    const run = buildRun("running");
    const task = run.tasks.find((candidate) => candidate.role === "validation");
    const sessionId = task ? `${run.id}:${task.id}` : "missing";

    if (!task) {
      throw new Error("Expected validation task fixture");
    }

    const cappedRun = {
      ...run,
      tasks: run.tasks.map((candidate) =>
        candidate.id === task.id ? { ...candidate, attemptLimit: 3 } : candidate
      )
    };

    let next = cappedRun;
    for (let index = 0; index < 5; index += 1) {
      next = recordWorkerValidationAttemptResult(next, {
        taskId: task.id,
        sessionId,
        outcome: "fail"
      });
    }

    const updatedTask = next.tasks.find((candidate) => candidate.id === task.id);
    const updatedSession = next.sessions.find((candidate) => candidate.id === sessionId);

    expect(updatedTask?.attempt).toBe(3);
    expect(updatedTask?.status).toBe("blocked");
    expect(updatedSession?.attempt).toBe(3);
    expect(updatedSession?.state).toBe("failed");
    expect(next.status).toBe("failed");
    expect(next.validationGates.every((gate) => gate.status === "failed")).toBe(true);
  });

  it("does not mutate input run object for validation attempts", () => {
    const run = buildRun("running");
    const task = run.tasks.find((candidate) => candidate.role === "validation");
    const sessionId = task ? `${run.id}:${task.id}` : "missing";

    if (!task) {
      throw new Error("Expected validation task fixture");
    }

    const baseline = JSON.parse(JSON.stringify(run));
    const next = recordWorkerValidationAttemptResult(run, {
      taskId: task.id,
      sessionId,
      outcome: "fail"
    });

    expect(next).not.toBe(run);
    expect(next.tasks).not.toBe(run.tasks);
    expect(next.sessions).not.toBe(run.sessions);
    expect(next.validationGates).not.toBe(run.validationGates);
    expect(next.tasks[0]).not.toBe(run.tasks[0]);
    expect(next.sessions[0]).not.toBe(run.sessions[0]);
    expect(next.validationGates[0]).not.toBe(run.validationGates[0]);
    expect(run).toEqual(baseline);
  });
});
