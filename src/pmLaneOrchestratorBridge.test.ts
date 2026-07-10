import { describe, expect, it } from "vitest";
import {
  convertPmTaskToWorkerReadyTask,
  dispatchPmLaneToOrchestrator,
  selectPmWorkerReadyTasks
} from "./pmLaneOrchestratorBridge";
import {
  buildOrchestratorSqliteSnapshot,
  type OrchestratorSqliteApplyResult,
  type OrchestratorSqliteSnapshot
} from "./orchestratorSqliteStore";
import {
  createOrchestratorBackendState
} from "./orchestratorBackend";
import type { ProjectManagementTask } from "./projectManagementHierarchy";

const createdAt = "2026-07-09T15:00:00.000Z";
const project = {
  id: "steerboard",
  name: "Steerboard"
};

function task(overrides: Partial<ProjectManagementTask> = {}): ProjectManagementTask {
  return {
    id: "task-1",
    type: "child",
    title: "Queue worker",
    description: "Create a worker-ready task.",
    status: "todo",
    completionPercent: 0,
    complexity: "medium",
    sourceDocument: "PM lane",
    parentId: "parent-1",
    runState: "idle",
    ...overrides
  };
}

function applyResult(snapshot: OrchestratorSqliteSnapshot): OrchestratorSqliteApplyResult {
  return {
    databasePath: ".steerboard/orchestrator.sqlite",
    runsWritten: snapshot.runs.length,
    queueRowsWritten: snapshot.events.length + snapshot.commands.length,
    ledgerRowsWritten: snapshot.ledger.length,
    artifactsWritten: snapshot.artifacts.length,
    detail: "Applied"
  };
}

describe("PM lane orchestrator bridge", () => {
  it("defaults new durable runs to five approved worker places", async () => {
    const result = await dispatchPmLaneToOrchestrator({
      project,
      tasks: [],
      repositoryRoot: "C:\\repo",
      worktreeRoot: "C:\\repo\\.steerboard\\worktrees",
      createdAt,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(createOrchestratorBackendState()),
      applySnapshot: async (snapshot) => applyResult(snapshot)
    });

    expect(result.backendState.runs[0].scope.approvedWorkerCapacity).toBe(5);
    expect(result.dispatch.jobs).toEqual([]);
  });

  it("converts PM child rows into strict worker-ready tasks", () => {
    const workerTask = convertPmTaskToWorkerReadyTask({
      task: task({ id: "phase-11-child-live-loop", complexity: "extra_high" }),
      project,
      createdAt,
      sequence: 1
    });

    expect(workerTask).toMatchObject({
      id: "phase-11-child-live-loop",
      title: "Queue worker",
      objective: "Create a worker-ready task.",
      status: "worker-ready",
      priority: "high",
      capabilityProfile: "workspace-write",
      ownedFiles: [".steerboard/pm-lane/phase-11-child-live-loop.md"]
    });
    expect(workerTask.provenance).toMatchObject({
      origin: "project-manager",
      labels: ["pm-lane-source-of-truth"]
    });
    expect(workerTask.templateSnapshot.templateJson).toMatchObject({
      projectId: "steerboard",
      sourceDocument: "PM lane",
      complexity: "extra_high"
    });
  });

  it("selects incomplete PM child rows and excludes completed, canceled, parent, and epic rows", () => {
    const selected = selectPmWorkerReadyTasks({
      project,
      createdAt,
      tasks: [
        task({ id: "ready" }),
        task({ id: "done", status: "completed", completionPercent: 100 }),
        task({ id: "cancel", status: "canceled" }),
        task({ id: "parent", type: "parent" }),
        task({ id: "epic", type: "epic" })
      ]
    });

    expect(selected.map((item) => item.id)).toEqual(["ready"]);
  });

  it("creates a durable orchestrator run and enqueues worker starts from PM source of truth", async () => {
    let persisted: OrchestratorSqliteSnapshot | undefined;
    const result = await dispatchPmLaneToOrchestrator({
      project,
      tasks: [task({ id: "task-a" }), task({ id: "task-b", complexity: "extra_high" })],
      repositoryRoot: "C:\\repo",
      worktreeRoot: "C:\\repo\\.steerboard\\worktrees",
      createdAt,
      concurrencyLimit: 1,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(createOrchestratorBackendState()),
      applySnapshot: async (snapshot) => {
        persisted = snapshot;
        return applyResult(snapshot);
      }
    });

    expect(result.runId).toBe("pm-steerboard-orchestrator");
    expect(result.workerReadyTasks.map((item) => item.id)).toEqual(["task-a", "task-b"]);
    expect(result.dispatch.queuedTaskIds).toEqual(["task-b"]);
    expect(result.dispatch.skippedTaskIds).toEqual(["task-a"]);
    expect(result.backendState.runs[0]).toMatchObject({
      id: "pm-steerboard-orchestrator",
      projectId: "steerboard",
      integrationBranch: "codex/orch/integration/pm-steerboard-orchestrator"
    });
    expect(result.backendState.commandQueue[0]).toMatchObject({
      kind: "worker.start",
      status: "queued"
    });
    expect(persisted?.commands[0]).toMatchObject({
      queue_name: "command",
      kind: "worker.start",
      status: "queued"
    });
    expect(JSON.parse(persisted?.commands[0].payload_json ?? "{}")).toMatchObject({
      repositoryRoot: "C:\\repo",
      modelProfileId: "codex-gpt-5-3-spark-extra-high"
    });
  });

  it("restores durable capacity and does not over-dispatch a second active worker", async () => {
    const first = await dispatchPmLaneToOrchestrator({
      project,
      tasks: [task({ id: "task-a" })],
      repositoryRoot: "C:\\repo",
      worktreeRoot: "C:\\repo\\.steerboard\\worktrees",
      createdAt,
      concurrencyLimit: 1,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(createOrchestratorBackendState()),
      applySnapshot: async (snapshot) => applyResult(snapshot)
    });
    const second = await dispatchPmLaneToOrchestrator({
      project,
      tasks: [task({ id: "task-b" })],
      repositoryRoot: "C:\\repo",
      worktreeRoot: "C:\\repo\\.steerboard\\worktrees",
      createdAt: "2026-07-09T15:01:00.000Z",
      concurrencyLimit: 1,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(first.backendState),
      applySnapshot: async (snapshot) => applyResult(snapshot)
    });

    expect(second.backendState.runs).toHaveLength(1);
    expect(second.backendState.ledger[0]).toMatchObject({
      kind: "run.created"
    });
    expect(second.backendState.commandQueue).toHaveLength(1);
    expect(second.dispatch.skippedTaskIds).toEqual(["task-b"]);
    expect(second.backendState.runs[0].scope.approvedWorkerCapacity).toBe(1);
  });
});
