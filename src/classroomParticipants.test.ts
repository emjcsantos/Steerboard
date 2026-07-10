import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  hydrateOrchestratorBackendStateFromSqlite,
  serializeOrchestratorCommandsForSqlite,
  serializeOrchestratorEventsForSqlite,
  serializeOrchestratorLedgerForSqlite,
  serializeOrchestratorRunsForSqlite
} from "./orchestratorBackend";
import {
  hydrateClassroomParticipantProjection,
  summarizeClassroomParticipant
} from "./classroomParticipants";
import { dispatchWorkerReadyTasks } from "./orchestratorWorkerDispatch";
import { DEFAULT_PM_TASK_BUDGET, createPmTaskTemplateSnapshot } from "./pmLaneWorkerReady";

const createdAt = "2026-07-11T02:00:00.000Z";

function stateWithRun() {
  return createBoundedOrchestratorRun(createOrchestratorBackendState(), {
    id: "run-classroom",
    projectId: "steerboard",
    scope: { mode: "task-list", taskIds: ["task-1"] },
    baseBranch: "main",
    createdAt
  });
}

function dispatchOne() {
  return dispatchWorkerReadyTasks(stateWithRun(), [{
    id: "task-1",
    title: "Persist participant",
    objective: "Prove the durable Classroom path.",
    ownedFiles: ["src/classroomParticipants.ts"],
    forbiddenFiles: ["src/other.ts"],
    dependencies: [],
    acceptanceCriteria: ["Participant survives reload."],
    validationCommands: ["npm.cmd test"],
    rollbackPlan: "Remove the projection.",
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    priority: "normal",
    capabilityProfile: "workspace-write",
    evidenceKinds: ["unit-test"],
    provenance: {
      origin: "orchestrator",
      createdByRunId: "run-classroom",
      labels: ["orchestrator-created", "corrective"]
    },
    templateSnapshot: createPmTaskTemplateSnapshot({
      taskId: "task-1",
      templateId: "backend-worker",
      resolvedAt: createdAt,
      templateJson: { validationCommandHints: ["npm.cmd test"] }
    }),
    status: "queued",
    createdAt,
    sequence: 1
  }], {
    runId: "run-classroom",
    repositoryRoot: "repo",
    worktreeRoot: ".steerboard/worktrees",
    createdAt,
    concurrencyLimit: 1,
    activeWorkerJobs: []
  });
}

describe("classroom participant persistence projection", () => {
  it("returns a safe empty summary for empty and legacy durable state", () => {
    const empty = hydrateClassroomParticipantProjection(stateWithRun());
    const legacy = stateWithRun();
    legacy.commandQueue.push({
      id: "legacy-command",
      runId: "run-classroom",
      sequence: 1,
      kind: "worker.start",
      payload: { jobId: "legacy-job" },
      status: "queued",
      enqueuedAt: createdAt
    });

    expect(empty).toEqual({ participants: [], jobs: [], messages: [] });
    expect(summarizeClassroomParticipant(hydrateClassroomParticipantProjection(legacy))).toMatchObject({
      tone: "empty",
      messageCount: 0
    });
  });

  it("restores the same identity, seat, job, model snapshot, ownership, and actor-aware message", () => {
    const dispatched = dispatchOne();
    const source = hydrateClassroomParticipantProjection(dispatched.backendState);
    const restoredBackend = hydrateOrchestratorBackendStateFromSqlite({
      runs: serializeOrchestratorRunsForSqlite(dispatched.backendState.runs),
      events: serializeOrchestratorEventsForSqlite(dispatched.backendState.eventQueue),
      commands: serializeOrchestratorCommandsForSqlite(dispatched.backendState.commandQueue),
      ledger: serializeOrchestratorLedgerForSqlite(dispatched.backendState.ledger)
    });
    const restored = hydrateClassroomParticipantProjection(restoredBackend);

    expect(restored).toEqual(source);
    expect(restored.participants).toEqual([expect.objectContaining({
      id: "run-classroom:participant:task-1",
      seat: 1,
      currentJobId: "run-classroom:worker:task-1",
      executionState: "eligible",
      modelProfileSnapshot: expect.objectContaining({
        role: "worker",
        model: "gpt-5.3-spark",
        authRef: "codex-desktop",
        capabilities: expect.objectContaining({ tools: true, filesystem: true, shell: true })
      })
    })]);
    expect(restored.jobs[0]).toMatchObject({
      attempt: 1,
      branch: "codex/orch/task-1-persist-participant",
      worktreePath: ".steerboard/worktrees/task-1-persist-participant",
      ownership: {
        ownedFiles: ["src/classroomParticipants.ts"],
        forbiddenFiles: ["src/other.ts"]
      }
    });
    expect(restored.messages[0]).toMatchObject({
      actor: { kind: "participant", participantId: "run-classroom:participant:task-1" }
    });
    expect(summarizeClassroomParticipant(restored, "run-classroom")).toMatchObject({
      tone: "ready",
      seatLabel: "Seat 1",
      messageCount: 1
    });
  });

  it("deduplicates repeated durable envelopes instead of creating reload duplicates", () => {
    const dispatched = dispatchOne();
    const projection = hydrateClassroomParticipantProjection(dispatched.backendState);

    expect(dispatched.backendState.commandQueue[0].payload.classroom).toBeDefined();
    expect(dispatched.backendState.eventQueue[0].payload.classroom).toBeDefined();
    expect(projection.participants).toHaveLength(1);
    expect(projection.jobs).toHaveLength(1);
    expect(projection.messages).toHaveLength(1);
  });

  it("drops invalid seats and actors and limits unknown profile or lifecycle values", () => {
    const dispatched = dispatchOne();
    const validEnvelope = dispatched.backendState.commandQueue[0].payload.classroom as Record<string, unknown>;
    const invalidSeatState = structuredClone(dispatched.backendState);
    const invalidSeatEnvelope = invalidSeatState.commandQueue[0].payload.classroom as any;
    invalidSeatEnvelope.participant.seat = 21;
    invalidSeatState.eventQueue = [];
    expect(hydrateClassroomParticipantProjection(invalidSeatState).participants).toEqual([]);

    const invalidActorState = structuredClone(dispatched.backendState);
    const invalidActorEnvelope = invalidActorState.commandQueue[0].payload.classroom as any;
    invalidActorEnvelope.message.actor = { kind: "participant", participantId: "other" };
    invalidActorState.eventQueue = [];
    expect(hydrateClassroomParticipantProjection(invalidActorState).participants).toEqual([]);

    const limitedState = structuredClone(dispatched.backendState);
    const limitedEnvelope = limitedState.commandQueue[0].payload.classroom as any;
    limitedEnvelope.participant.lifecycle = "teleporting";
    limitedEnvelope.participant.modelProfileSnapshot = { id: "missing" };
    limitedState.eventQueue = [];
    const limited = hydrateClassroomParticipantProjection(limitedState);

    expect(validEnvelope).toBeDefined();
    expect(limited.participants[0]).toMatchObject({ lifecycle: "limited", executionState: "limited" });
    expect(limited.jobs[0].status).toBe("recovery-review");
    expect(limited.participants[0].modelProfileSnapshot.model).toBe("Unknown model");
  });
});
