import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  hydrateOrchestratorBackendStateFromSqlite,
  serializeOrchestratorRunsForSqlite
} from "./orchestratorBackend";
import {
  applyOrchestratorTakeoverRuntimeResult,
  queueOrchestratorTakeover
} from "./orchestratorTakeover";
import type { ValidatorReport } from "./orchestratorValidatorLoop";
import type { WorkerJobRecord, WorkerModelProfile } from "./orchestratorWorkerDispatch";
import { DEFAULT_PM_TASK_BUDGET } from "./pmLaneWorkerReady";

const createdAt = "2026-07-11T04:00:00.000Z";

function backendState() {
  return createBoundedOrchestratorRun(createOrchestratorBackendState(), {
    id: "run-1",
    projectId: "steerboard",
    scope: { mode: "task-list", taskIds: ["task-1"], validationExhaustionPolicy: "orchestrator-takeover" },
    baseBranch: "main",
    createdAt
  });
}

function worker(): WorkerJobRecord {
  return {
    id: "run-1:worker:task-1",
    runId: "run-1",
    taskId: "task-1",
    branch: "codex/orch/task-1",
    worktreePath: ".steerboard/worktrees/task-1",
    status: "completed",
    modelProfileId: "worker",
    capabilityProfile: "workspace-write",
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    ownedFiles: ["src/task.ts"],
    forbiddenFiles: ["src/other.ts"],
    attempt: 3,
    lease: { leaseOwner: "worker-agent", leasedAt: createdAt, heartbeatAt: createdAt },
    createdAt
  };
}

function report(): ValidatorReport {
  return {
    id: "report-third-failure",
    runId: "run-1",
    taskId: "task-1",
    workerJobId: worker().id,
    validatorJobId: `${worker().id}:validator:3`,
    attempt: 3,
    verdict: "revision-required",
    findings: [{ id: "failure", severity: "error", message: "Fix final defect.", files: ["src/task.ts"], sharedSurface: false, evidence: ["validator"] }],
    commandsRun: [],
    acceptanceResults: [],
    changedFiles: ["src/task.ts"],
    evidenceReferences: ["artifact://validator"],
    nextAction: "return-to-worker",
    createdAt
  };
}

function orchestratorProfile(): WorkerModelProfile {
  return {
    id: "teacher-high",
    role: "orchestrator",
    provider: "codex",
    model: "gpt-5.3-codex",
    reasoningEffort: "high",
    authRef: "codex-desktop",
    capabilities: { tools: true, filesystem: true, shell: true, browser: false, structuredOutput: true }
  };
}

describe("orchestrator takeover", () => {
  it("persists takeover and explicitly selected corrective exhaustion policies on the run", () => {
    const takeover = backendState();
    const corrective = createBoundedOrchestratorRun(createOrchestratorBackendState(), {
      id: "run-corrective",
      projectId: "steerboard",
      scope: { mode: "task-list", taskIds: ["task-1"], validationExhaustionPolicy: "corrective-task" },
      baseBranch: "main",
      createdAt
    });
    const restored = hydrateOrchestratorBackendStateFromSqlite({
      runs: serializeOrchestratorRunsForSqlite([...takeover.runs, ...corrective.runs]),
      events: [],
      commands: [],
      ledger: []
    });

    expect(restored.runs.map((run) => run.scope.validationExhaustionPolicy)).toEqual([
      "orchestrator-takeover",
      "corrective-task"
    ]);
  });

  it("transfers ownership before queueing exactly one distinct takeover with the orchestrator profile", () => {
    const first = queueOrchestratorTakeover({ backendState: backendState(), workerJob: worker(), report: report(), orchestratorProfile: orchestratorProfile() });
    const replay = queueOrchestratorTakeover({ backendState: first.backendState, workerJob: worker(), report: report(), orchestratorProfile: orchestratorProfile() });

    expect(first.queued).toBe(true);
    expect(replay.queued).toBe(false);
    expect(replay.backendState.commandQueue.filter((command) => command.kind === "orchestrator.takeover")).toHaveLength(1);
    expect(replay.backendState.commandQueue[0]).toMatchObject({
      id: "run-1:worker:task-1:orchestrator-takeover:start",
      payload: {
        jobKind: "orchestrator-takeover",
        modelProfile: { id: "teacher-high", role: "orchestrator", model: "gpt-5.3-codex" },
        ownership: {
          releasedWorkerJobId: "run-1:worker:task-1",
          transferredToJobId: "run-1:worker:task-1:orchestrator-takeover",
          ownedFiles: ["src/task.ts"]
        }
      }
    });
    expect(replay.backendState.eventQueue[0].payload.workState).toBe("takeover");
  });

  it("queues the normal accepted-commit path on completion without validator re-entry", () => {
    const queued = queueOrchestratorTakeover({ backendState: backendState(), workerJob: worker(), report: report(), orchestratorProfile: orchestratorProfile() });
    const command = queued.backendState.commandQueue[0];
    const applied = applyOrchestratorTakeoverRuntimeResult({
      backendState: queued.backendState,
      command,
      result: { commandId: command.id, runId: "run-1", kind: "orchestrator.takeover", executed: true, blocked: false, artifactPaths: ["takeover.jsonl"], steps: [], detail: "Takeover completed." },
      createdAt
    });

    expect(applied).toMatchObject({ completed: true, failed: false });
    expect(applied?.backendState.commandQueue.at(-1)).toMatchObject({
      kind: "worker.commit",
      payload: { workerJobId: "run-1:worker:task-1:orchestrator-takeover", takeoverCompleted: true }
    });
    expect(applied?.backendState.commandQueue.some((item) => item.kind === "validator.start")).toBe(false);
  });

  it("records takeover failure without queueing commit, integration, or validator work", () => {
    const queued = queueOrchestratorTakeover({ backendState: backendState(), workerJob: worker(), report: report(), orchestratorProfile: orchestratorProfile() });
    const command = queued.backendState.commandQueue[0];
    const applied = applyOrchestratorTakeoverRuntimeResult({
      backendState: queued.backendState,
      command,
      result: { commandId: command.id, runId: "run-1", kind: "orchestrator.takeover", executed: false, blocked: true, artifactPaths: [], steps: [], detail: "Takeover blocked." },
      createdAt
    });

    expect(applied).toMatchObject({ completed: false, failed: true });
    expect(applied?.backendState.commandQueue).toHaveLength(1);
    expect(applied?.backendState.eventQueue.at(-1)?.payload.workState).toBe("failed");
  });
});
