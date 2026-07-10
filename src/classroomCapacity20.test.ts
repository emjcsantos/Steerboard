import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  hydrateOrchestratorBackendStateFromSqlite,
  serializeOrchestratorCommandsForSqlite,
  serializeOrchestratorEventsForSqlite,
  serializeOrchestratorLedgerForSqlite,
  serializeOrchestratorRunsForSqlite,
  type OrchestratorBackendState
} from "./orchestratorBackend";
import {
  hydrateClassroomParticipantProjection,
  selectClassroomDispatchContext
} from "./classroomParticipants";
import { projectOrchestratorRun } from "./orchestratorRunProjection";
import {
  DEFAULT_WORKER_MODEL_PROFILE,
  dispatchWorkerReadyTasks
} from "./orchestratorWorkerDispatch";
import {
  DEFAULT_PM_TASK_BUDGET,
  createPmTaskTemplateSnapshot,
  type PmWorkerReadyTask
} from "./pmLaneWorkerReady";

const createdAt = "2026-07-11T04:00:00.000Z";
const runId = "run-classroom-capacity";

function tasks(count: number): PmWorkerReadyTask[] {
  return Array.from({ length: count }, (_, index) => {
    const id = `task-${index + 1}`;
    return {
      id,
      title: `Capacity worker ${index + 1}`,
      objective: "Exercise deterministic Classroom capacity.",
      ownedFiles: [`src/capacity-${index + 1}.ts`],
      forbiddenFiles: [],
      dependencies: [],
      acceptanceCriteria: ["A unique seat is assigned."],
      validationCommands: ["npm.cmd test -- src/classroomCapacity20.test.ts"],
      rollbackPlan: "Remove the capacity test fixture.",
      budget: { ...DEFAULT_PM_TASK_BUDGET },
      priority: "normal",
      capabilityProfile: "workspace-write",
      evidenceKinds: ["unit-test"],
      provenance: {
        origin: "orchestrator",
        createdByRunId: runId,
        labels: ["orchestrator-created"]
      },
      templateSnapshot: createPmTaskTemplateSnapshot({
        taskId: id,
        templateId: "capacity-worker",
        resolvedAt: createdAt,
        templateJson: { validationCommandHints: ["npm.cmd test"] }
      }),
      status: "queued",
      createdAt,
      sequence: index + 1
    };
  });
}

function stateWithCapacity(capacity: number, taskCount = capacity): OrchestratorBackendState {
  return createBoundedOrchestratorRun(createOrchestratorBackendState(), {
    id: runId,
    projectId: "steerboard",
    scope: {
      mode: "task-list",
      taskIds: tasks(taskCount).map((task) => task.id),
      approvedWorkerCapacity: capacity
    },
    baseBranch: "main",
    createdAt
  });
}

function dispatchCapacity(capacity: number, taskCount = capacity) {
  const workerTasks = tasks(taskCount);
  return dispatchWorkerReadyTasks(stateWithCapacity(capacity, taskCount), workerTasks, {
    runId,
    repositoryRoot: "repo",
    worktreeRoot: ".steerboard/worktrees",
    createdAt,
    concurrencyLimit: capacity,
    activeWorkerJobs: []
  });
}

function reload(state: OrchestratorBackendState): OrchestratorBackendState {
  return hydrateOrchestratorBackendStateFromSqlite({
    runs: serializeOrchestratorRunsForSqlite(state.runs),
    events: serializeOrchestratorEventsForSqlite(state.eventQueue),
    commands: serializeOrchestratorCommandsForSqlite(state.commandQueue),
    ledger: serializeOrchestratorLedgerForSqlite(state.ledger)
  });
}

describe("Classroom capacity from one through twenty", () => {
  it.each([1, 5, 6, 12, 20])(
    "dispatches capacity %i into deterministic unique seats",
    (capacity) => {
      const result = dispatchCapacity(capacity);
      const projection = hydrateClassroomParticipantProjection(result.backendState);
      const seats = projection.participants.map((participant) => participant.seat);

      expect(result.queuedTaskIds).toEqual(tasks(capacity).map((task) => task.id));
      expect(seats).toEqual(Array.from({ length: capacity }, (_, index) => index + 1));
      expect(new Set(seats).size).toBe(capacity);
      expect(projectOrchestratorRun(result.backendState, "classroom", runId).capacity).toMatchObject({
        approved: capacity,
        occupiedSeats: capacity,
        emptySeats: 0
      });
    }
  );

  it("restores all twenty identities and seat assignments without drift", () => {
    const dispatched = dispatchCapacity(20);
    const before = hydrateClassroomParticipantProjection(dispatched.backendState);
    const after = hydrateClassroomParticipantProjection(reload(dispatched.backendState));

    expect(after).toEqual(before);
    expect(after.participants.map(({ id, seat }) => ({ id, seat }))).toEqual(
      Array.from({ length: 20 }, (_, index) => ({
        id: `${runId}:participant:task-${index + 1}`,
        seat: index + 1
      }))
    );
  });

  it("increasing approved capacity adds empty places without changing active participants", () => {
    const dispatched = dispatchCapacity(5);
    const state = structuredClone(dispatched.backendState);
    const participantsBefore = hydrateClassroomParticipantProjection(state).participants;
    const commandCountBefore = state.commandQueue.length;

    state.runs[0].scope.approvedWorkerCapacity = 12;

    expect(projectOrchestratorRun(state, "classroom", runId).capacity).toMatchObject({
      approved: 12,
      occupiedSeats: 5,
      emptySeats: 7
    });
    expect(hydrateClassroomParticipantProjection(state).participants).toEqual(participantsBefore);
    expect(state.commandQueue).toHaveLength(commandCountBefore);
  });

  it("decreasing capacity below active usage dispatches and cancels nothing", () => {
    const dispatched = dispatchCapacity(6, 7);
    const state = structuredClone(dispatched.backendState);
    state.runs[0].scope.approvedWorkerCapacity = 5;
    const context = selectClassroomDispatchContext(state, runId);
    const commandCountBefore = state.commandQueue.length;

    const result = dispatchWorkerReadyTasks(state, [tasks(7)[6]], {
      runId,
      repositoryRoot: "repo",
      worktreeRoot: ".steerboard/worktrees",
      createdAt,
      concurrencyLimit: 5,
      activeWorkerJobs: context.activeWorkerJobs,
      existingWorkerJobs: context.existingWorkerJobs,
      occupiedSeats: context.occupiedSeats
    });

    expect(projectOrchestratorRun(state, "classroom", runId).capacity).toMatchObject({
      approved: 5,
      occupiedSeats: 6,
      emptySeats: 0
    });
    expect(result.jobs).toEqual([]);
    expect(result.backendState.commandQueue).toHaveLength(commandCountBefore);
    expect(result.backendState.commandQueue.some((command) => command.kind === "worker.cancel")).toBe(false);
  });

  it("drops invalid and duplicate seats while limiting a malformed model snapshot", () => {
    const state = structuredClone(dispatchCapacity(5).backendState);
    state.eventQueue = [];
    const envelopes = state.commandQueue.map((command) => command.payload.classroom as any);
    envelopes[1].participant.seat = 1;
    envelopes[2].participant.seat = 21;
    envelopes[3].participant.modelProfileSnapshot = {
      ...DEFAULT_WORKER_MODEL_PROFILE,
      role: "worker",
      provider: "unknown-provider"
    };

    const projection = hydrateClassroomParticipantProjection(state);

    expect(projection.participants.map((participant) => participant.seat)).toEqual([1, 4, 5]);
    expect(projection.participants.find((participant) => participant.seat === 4)).toMatchObject({
      lifecycle: "limited",
      executionState: "limited",
      modelProfileSnapshot: { provider: "unknown" }
    });
    expect(projection.jobs.find((job) => job.participantId.endsWith(":task-4"))?.status).toBe("recovery-review");
  });
});
