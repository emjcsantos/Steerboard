import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  processAllQueuedOrchestratorEvents,
  serializeOrchestratorCommandsForSqlite
} from "./orchestratorBackend";
import {
  DEFAULT_WORKER_MODEL_PROFILE,
  dispatchWorkerReadyTasks,
  type WorkerJobRecord
} from "./orchestratorWorkerDispatch";
import {
  DEFAULT_PM_TASK_BUDGET,
  createPmTaskTemplateSnapshot,
  type PmWorkerReadyTask
} from "./pmLaneWorkerReady";

const createdAt = "2026-07-09T03:00:00.000Z";

function task(overrides: Partial<PmWorkerReadyTask> = {}): PmWorkerReadyTask {
  const id = overrides.id ?? "task-1";

  return {
    id,
    title: "Implement worker dispatch",
    objective: "Create a worker dispatch slice.",
    ownedFiles: [`src/${id}.ts`],
    forbiddenFiles: ["src/codexSession.ts"],
    dependencies: [],
    acceptanceCriteria: ["Worker job is queued."],
    validationCommands: ["npm.cmd run test -- src/orchestratorWorkerDispatch.test.ts"],
    rollbackPlan: "Remove the dispatch slice.",
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    priority: "normal",
    capabilityProfile: "workspace-write",
    evidenceKinds: ["unit-test"],
    provenance: {
      origin: "orchestrator",
      createdByRunId: "run-123",
      labels: ["orchestrator-created", "corrective"]
    },
    templateSnapshot: createPmTaskTemplateSnapshot({
      taskId: id,
      templateId: "backend-worker",
      resolvedAt: createdAt,
      templateJson: { validationCommandHints: ["npm.cmd run test"] }
    }),
    status: "queued",
    createdAt,
    sequence: 1,
    ...overrides
  };
}

function backendState() {
  return createBoundedOrchestratorRun(createOrchestratorBackendState(), {
    id: "run-123",
    projectId: "steerboard",
    scope: { mode: "task-list", taskIds: ["task-1", "task-2", "task-3"] },
    baseBranch: "main",
    createdAt
  });
}

function dispatch(tasks: PmWorkerReadyTask[], activeWorkerJobs: WorkerJobRecord[] = []) {
  return dispatchWorkerReadyTasks(backendState(), tasks, {
    runId: "run-123",
    repositoryRoot: "C:\\Users\\MJ\\Projects\\ProjectAtlas\\Steerboard",
    worktreeRoot: "C:\\Users\\MJ\\Projects\\ProjectAtlas\\Steerboard\\.steerboard\\worktrees",
    createdAt,
    concurrencyLimit: 3,
    activeWorkerJobs
  });
}

describe("orchestrator worker dispatch", () => {
  it("dispatches dependency-ready tasks by priority and FIFO capacity", () => {
    const result = dispatchWorkerReadyTasks(
      backendState(),
      [
        task({ id: "normal-old", priority: "normal", sequence: 1 }),
        task({ id: "urgent-new", priority: "urgent", sequence: 3 }),
        task({ id: "normal-new", priority: "normal", sequence: 2 })
      ],
      {
        runId: "run-123",
        repositoryRoot: "repo",
        worktreeRoot: ".steerboard/worktrees",
        createdAt,
        concurrencyLimit: 2,
        activeWorkerJobs: []
      }
    );

    expect(result.queuedTaskIds).toEqual(["urgent-new", "normal-old"]);
    expect(result.skippedTaskIds).toEqual(["normal-new"]);
    expect(result.jobs).toHaveLength(2);
    expect(result.backendState.commandQueue).toHaveLength(2);
    expect(result.backendState.eventQueue).toHaveLength(2);
  });

  it("blocks tasks with unmet dependencies until completed worker jobs exist", () => {
    const blocked = dispatch([
      task({
        id: "dependent",
        dependencies: ["setup"]
      })
    ]);
    const completedJob: WorkerJobRecord = {
      id: "completed-setup",
      runId: "run-123",
      taskId: "setup",
      branch: "codex/orch/setup",
      worktreePath: ".steerboard/worktrees/setup",
      status: "completed",
      modelProfileId: DEFAULT_WORKER_MODEL_PROFILE.id,
      capabilityProfile: "workspace-write",
      budget: { ...DEFAULT_PM_TASK_BUDGET },
      ownedFiles: ["src/setup.ts"],
      forbiddenFiles: [],
      attempt: 1,
      lease: {},
      createdAt
    };
    const unblocked = dispatchWorkerReadyTasks(
      backendState(),
      [
        task({
          id: "dependent",
          dependencies: ["setup"]
        })
      ],
      {
        runId: "run-123",
        repositoryRoot: "repo",
        worktreeRoot: ".steerboard/worktrees",
        createdAt,
        concurrencyLimit: 2,
        activeWorkerJobs: [completedJob],
        existingWorkerJobs: [completedJob]
      }
    );

    expect(blocked.blockedTaskIds).toEqual(["dependent"]);
    expect(unblocked.queuedTaskIds).toEqual(["dependent"]);
  });

  it("prevents concurrent ownership overlap across files and module folders", () => {
    const activeJob = dispatch([task({ id: "active", ownedFiles: ["src/shared"] })]).jobs[0];
    const result = dispatch(
      [
        task({
          id: "overlap",
          ownedFiles: ["src/shared/index.ts"]
        }),
        task({
          id: "safe",
          ownedFiles: ["src/safe.ts"]
        })
      ],
      [activeJob]
    );

    expect(result.blockedTaskIds).toEqual(["overlap"]);
    expect(result.queuedTaskIds).toEqual(["safe"]);
  });

  it("creates unique branch and worktree contracts for worker jobs", () => {
    const result = dispatch([task({ id: "task-1", title: "Worker Dispatch!" })]);

    expect(result.jobs[0]).toMatchObject({
      id: "run-123:worker:task-1",
      taskId: "task-1",
      branch: "codex/orch/task-1-worker-dispatch",
      worktreePath:
        "C:\\Users\\MJ\\Projects\\ProjectAtlas\\Steerboard\\.steerboard\\worktrees\\task-1-worker-dispatch",
      status: "queued",
      attempt: 1,
      lease: {}
    });
  });

  it("records model profile, capability profile, budget, owned files, forbidden files, and command payload", () => {
    const result = dispatch([task({ id: "task-1" })]);
    const commandRows = serializeOrchestratorCommandsForSqlite(result.backendState.commandQueue);

    expect(result.jobs[0]).toMatchObject({
      modelProfileId: DEFAULT_WORKER_MODEL_PROFILE.id,
      capabilityProfile: "workspace-write",
      budget: DEFAULT_PM_TASK_BUDGET,
      ownedFiles: ["src/task-1.ts"],
      forbiddenFiles: ["src/codexSession.ts"]
    });
    expect(commandRows[0]).toMatchObject({
      queue_name: "command",
      kind: "worker.start",
      status: "queued"
    });
    expect(JSON.parse(commandRows[0].payload_json)).toMatchObject({
      jobId: "run-123:worker:task-1",
      modelProfileId: DEFAULT_WORKER_MODEL_PROFILE.id,
      capabilityProfile: "workspace-write",
      attempt: 1,
      ownedFiles: ["src/task-1.ts"],
      acceptanceCriteria: ["Worker job is queued."],
      validationCommands: ["npm.cmd run test -- src/orchestratorWorkerDispatch.test.ts"]
    });
  });

  it("routes capability escalation to approval instead of dispatching silently", () => {
    const result = dispatch([
      task({
        id: "full-agent-task",
        capabilityProfile: "full-agent"
      })
    ]);

    expect(result.jobs).toEqual([]);
    expect(result.approvalRequests).toHaveLength(1);
    expect(result.approvalRequests[0]).toMatchObject({
      taskId: "full-agent-task",
      requestedProfile: "full-agent",
      allowedProfile: "workspace-write"
    });
    expect(result.backendState.eventQueue[0]).toMatchObject({
      kind: "approval.requested",
      runId: "run-123"
    });
  });

  it("worker progress events enter the queue and ledger without directly mutating run state", () => {
    const result = dispatch([task({ id: "task-1" })]);

    expect(result.backendState.runs[0].phase).toBe("Run created");
    expect(result.backendState.eventQueue[0]).toMatchObject({
      kind: "worker.progress",
      status: "queued"
    });

    const processed = processAllQueuedOrchestratorEvents(result.backendState, "2026-07-09T03:01:00.000Z");

    expect(processed.runs[0].phase).toBe("Worker queued for Implement worker dispatch.");
    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "worker.progress",
      message: "Worker queued for Implement worker dispatch."
    });
  });
});
