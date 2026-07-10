import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  hydrateOrchestratorBackendStateFromSqlite,
  serializeOrchestratorCommandsForSqlite,
  serializeOrchestratorEventsForSqlite,
  serializeOrchestratorLedgerForSqlite,
  serializeOrchestratorRunsForSqlite,
  type OrchestratorBackendState,
  type OrchestratorLedgerEntry
} from "./orchestratorBackend";
import { buildClassroomWorkerEnvelope } from "./classroomParticipants";
import {
  OrchestratorProgressThrottle,
  projectOrchestratorRun,
  sanitizeOrchestratorProgress,
  transitionOrchestratorWorkState,
  type OrchestratorWorkState
} from "./orchestratorRunProjection";
import {
  DEFAULT_WORKER_MODEL_PROFILE,
  type WorkerJobRecord
} from "./orchestratorWorkerDispatch";
import { DEFAULT_PM_TASK_BUDGET } from "./pmLaneWorkerReady";

const createdAt = "2026-07-11T03:00:00.000Z";

function durableState(): OrchestratorBackendState {
  const state = createBoundedOrchestratorRun(createOrchestratorBackendState(), {
    id: "run-1",
    projectId: "steerboard",
    scope: { mode: "task-list", taskIds: ["task-1"] },
    baseBranch: "main",
    createdAt
  });
  const job: WorkerJobRecord = {
    id: "run-1:worker:task-1",
    runId: "run-1",
    taskId: "task-1",
    branch: "codex/orch/task-1",
    worktreePath: ".steerboard/worktrees/task-1",
    status: "completed",
    modelProfileId: DEFAULT_WORKER_MODEL_PROFILE.id,
    capabilityProfile: "workspace-write",
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    ownedFiles: ["src/task.ts"],
    forbiddenFiles: [],
    attempt: 1,
    lease: {},
    createdAt
  };
  const classroom = buildClassroomWorkerEnvelope({
    job,
    modelProfile: DEFAULT_WORKER_MODEL_PROFILE,
    seat: 1,
    messageId: "message-1",
    message: "Worker submitted a concise result."
  });
  state.commandQueue.push({
    id: "command-1",
    runId: "run-1",
    sequence: 1,
    kind: "worker.start",
    payload: { classroom },
    status: "processed",
    enqueuedAt: createdAt,
    processedAt: createdAt
  });
  const workStates: OrchestratorWorkState[] = ["assigned", "running", "submitted", "validating", "accepted"];
  state.ledger.push(...workStates.map((workState, index): OrchestratorLedgerEntry => ({
    id: `ledger-${index + 2}`,
    runId: "run-1",
    sequence: index + 2,
    kind: workState === "validating" || workState === "accepted" ? "validator.reported" : "worker.progress",
    severity: "info",
    message: workState === "accepted" ? "Validator passed." : `Public ${workState} update.`,
    payload: {
      taskId: "task-1",
      workState,
      ...(workState === "accepted" ? { verdict: "pass" } : {})
    },
    createdAt
  })));
  state.runs[0] = { ...state.runs[0], status: "completed", phase: "Run completed." };
  return state;
}

describe("orchestrator run projection", () => {
  it("supports every business state while rejecting impossible terminal regressions", () => {
    const states: OrchestratorWorkState[] = [
      "queued", "assigned", "running", "submitted", "validating", "revision-required",
      "accepted", "blocked", "failed", "escalated", "takeover", "integrating", "completed"
    ];
    expect(states).toHaveLength(13);
    expect(transitionOrchestratorWorkState("queued", "assigned")).toBe("assigned");
    expect(transitionOrchestratorWorkState("validating", "revision-required")).toBe("revision-required");
    expect(transitionOrchestratorWorkState("blocked", "escalated")).toBe("escalated");
    expect(transitionOrchestratorWorkState("escalated", "takeover")).toBe("takeover");
    expect(transitionOrchestratorWorkState("takeover", "accepted")).toBe("accepted");
    expect(transitionOrchestratorWorkState("takeover", "failed")).toBe("failed");
    expect(transitionOrchestratorWorkState("accepted", "integrating")).toBe("integrating");
    expect(transitionOrchestratorWorkState("integrating", "completed")).toBe("completed");
    expect(transitionOrchestratorWorkState("completed", "running")).toBe("completed");
  });

  it("returns matching Professional and Classroom counts from the same reloaded snapshot", () => {
    const state = durableState();
    const restored = hydrateOrchestratorBackendStateFromSqlite({
      runs: serializeOrchestratorRunsForSqlite(state.runs),
      events: serializeOrchestratorEventsForSqlite(state.eventQueue),
      commands: serializeOrchestratorCommandsForSqlite(state.commandQueue),
      ledger: serializeOrchestratorLedgerForSqlite(state.ledger)
    });
    const professional = projectOrchestratorRun(restored, "professional", "run-1");
    const classroom = projectOrchestratorRun(restored, "classroom", "run-1");

    expect(professional.counts).toEqual(classroom.counts);
    expect(professional).toMatchObject({
      runId: "run-1",
      runStatus: "completed",
      counts: { runs: 1, tasks: 1, participants: 1, jobs: 1, messages: 1, validations: 2, completed: 1 },
      completionPercent: 100,
      taskStates: { "task-1": "completed" }
    });
    expect(professional.capacity).toMatchObject({
      approved: 5,
      occupiedSeats: 1,
      emptySeats: 4
    });
  });

  it("assigns two deterministic teacher standing slots and keeps overflow visible in queue", () => {
    const state = createBoundedOrchestratorRun(createOrchestratorBackendState(), {
      id: "run-capacity",
      projectId: "steerboard",
      scope: { mode: "task-list", taskIds: ["one", "two", "three"], approvedWorkerCapacity: 5 },
      baseBranch: "main",
      createdAt
    });
    ["one", "two", "three"].forEach((taskId, index) => {
      const job: WorkerJobRecord = {
        id: `run-capacity:worker:${taskId}`,
        runId: "run-capacity",
        taskId,
        branch: `codex/orch/${taskId}`,
        worktreePath: `.steerboard/worktrees/${taskId}`,
        status: "queued",
        modelProfileId: DEFAULT_WORKER_MODEL_PROFILE.id,
        capabilityProfile: "workspace-write",
        budget: { ...DEFAULT_PM_TASK_BUDGET },
        ownedFiles: [`src/${taskId}.ts`],
        forbiddenFiles: [],
        attempt: 1,
        lease: {},
        createdAt
      };
      const classroom = buildClassroomWorkerEnvelope({
        job,
        modelProfile: DEFAULT_WORKER_MODEL_PROFILE,
        seat: index + 1,
        messageId: `message-${taskId}`,
        message: `Queued ${taskId}.`
      });
      state.commandQueue.push({
        id: `command-${taskId}`,
        runId: "run-capacity",
        sequence: index + 1,
        kind: "worker.start",
        payload: { classroom },
        status: "queued",
        enqueuedAt: createdAt
      });
    });

    expect(projectOrchestratorRun(state, "classroom", "run-capacity").capacity).toEqual({
      approved: 5,
      occupiedSeats: 3,
      emptySeats: 2,
      queued: 3,
      active: 0,
      waiting: 0,
      validating: 0,
      blocked: 0,
      teacherStandingParticipantIds: [
        "run-capacity:participant:one",
        "run-capacity:participant:two"
      ],
      visibleQueueParticipantIds: ["run-capacity:participant:three"]
    });
  });

  it("bounds and sanitizes progress without exposing private reasoning", () => {
    const sanitized = sanitizeOrchestratorProgress(
      `<think>secret tokens</think> Public update. Private reasoning: hidden. ${"x".repeat(400)}`
    );

    expect(sanitized).not.toContain("secret tokens");
    expect(sanitized).not.toContain("Private reasoning");
    expect(sanitized?.length).toBeLessThanOrEqual(240);
  });

  it("throttles rapid progress and retains only a bounded recent window", () => {
    const throttle = new OrchestratorProgressThrottle(100, 2);

    expect(throttle.push("one", 0)).toBe(true);
    expect(throttle.push("too fast", 50)).toBe(false);
    expect(throttle.push("two", 100)).toBe(true);
    expect(throttle.push("three", 200)).toBe(true);
    expect(throttle.messages).toEqual(["two", "three"]);
  });

  it("rejects out-of-order impossible transitions in task projections", () => {
    const state = durableState();
    state.runs[0] = { ...state.runs[0], status: "running" };
    state.ledger.push({
      id: "late-regression",
      runId: "run-1",
      sequence: 99,
      kind: "worker.progress",
      severity: "info",
      message: "Late running update.",
      payload: { taskId: "task-1", workState: "running" },
      createdAt
    });

    expect(projectOrchestratorRun(state, "professional", "run-1").taskStates["task-1"]).toBe("accepted");
  });
});
