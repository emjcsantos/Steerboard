import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  processAllQueuedOrchestratorEvents
} from "./orchestratorBackend";
import {
  applyValidatorReport,
  createCorrectivePmTasksFromReport,
  createValidatorJobForWorker,
  createWorkerRevisionPacket,
  type ValidatorReport
} from "./orchestratorValidatorLoop";
import {
  DEFAULT_PM_TASK_BUDGET,
  createPmTaskTemplateSnapshot,
  type PmWorkerReadyTask
} from "./pmLaneWorkerReady";
import {
  DEFAULT_WORKER_MODEL_PROFILE,
  type WorkerJobRecord
} from "./orchestratorWorkerDispatch";

const createdAt = "2026-07-09T04:00:00.000Z";

function backendState() {
  return createBoundedOrchestratorRun(createOrchestratorBackendState(), {
    id: "run-123",
    projectId: "steerboard",
    scope: { mode: "task-list", taskIds: ["task-1"] },
    baseBranch: "main",
    createdAt
  });
}

function sourceTask(overrides: Partial<PmWorkerReadyTask> = {}): PmWorkerReadyTask {
  return {
    id: "task-1",
    title: "Validator loop",
    objective: "Validate a worker branch.",
    ownedFiles: ["src/orchestratorValidatorLoop.ts"],
    forbiddenFiles: ["src/codexSession.ts"],
    dependencies: [],
    acceptanceCriteria: ["Validator produces a structured report.", "Corrective tasks are narrow."],
    validationCommands: ["npm.cmd run test -- src/orchestratorValidatorLoop.test.ts"],
    rollbackPlan: "Revert validator loop files.",
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    priority: "normal",
    capabilityProfile: "workspace-write",
    evidenceKinds: ["unit-test"],
    provenance: {
      origin: "orchestrator",
      labels: ["orchestrator-created", "corrective"]
    },
    templateSnapshot: createPmTaskTemplateSnapshot({
      taskId: "task-1",
      templateId: "validator-loop",
      resolvedAt: createdAt,
      templateJson: { kind: "validator" }
    }),
    status: "queued",
    createdAt,
    sequence: 1,
    ...overrides
  };
}

function workerJob(overrides: Partial<WorkerJobRecord> = {}): WorkerJobRecord {
  return {
    id: "run-123:worker:task-1",
    runId: "run-123",
    taskId: "task-1",
    branch: "codex/orch/task-1-validator-loop",
    worktreePath: ".steerboard/worktrees/task-1-validator-loop",
    status: "completed",
    modelProfileId: DEFAULT_WORKER_MODEL_PROFILE.id,
    capabilityProfile: "workspace-write",
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    ownedFiles: ["src/orchestratorValidatorLoop.ts"],
    forbiddenFiles: ["src/codexSession.ts"],
    attempt: 1,
    lease: {},
    createdAt,
    ...overrides
  };
}

function report(overrides: Partial<ValidatorReport> = {}): ValidatorReport {
  return {
    id: "report-1",
    runId: "run-123",
    taskId: "task-1",
    workerJobId: "run-123:worker:task-1",
    validatorJobId: "run-123:worker:task-1:validator:1",
    attempt: 1,
    verdict: "revision-required",
    findings: [
      {
        id: "missing-test",
        severity: "error",
        message: "Add focused validator loop coverage.",
        files: ["src/orchestratorValidatorLoop.test.ts"],
        sharedSurface: false,
        evidence: ["vitest failure"]
      }
    ],
    commandsRun: [
      {
        command: "npm.cmd run test -- src/orchestratorValidatorLoop.test.ts",
        status: "failed",
        detail: "Missing coverage"
      }
    ],
    acceptanceResults: [
      {
        criterion: "Validator produces a structured report.",
        status: "fail",
        evidence: ["missing assertion"]
      }
    ],
    changedFiles: ["src/orchestratorValidatorLoop.ts"],
    evidenceReferences: ["artifact://validator/report-1"],
    nextAction: "return-to-worker",
    createdAt,
    ...overrides
  };
}

describe("orchestrator validator loop", () => {
  it("creates a read-only validator job for a completed worker attempt", () => {
    const result = createValidatorJobForWorker(backendState(), sourceTask(), workerJob(), createdAt);

    expect(result.job).toMatchObject({
      id: "run-123:worker:task-1:validator:1",
      runId: "run-123",
      taskId: "task-1",
      workerJobId: "run-123:worker:task-1",
      capabilityProfile: "read-only",
      readonly: true,
      attempt: 1,
      status: "queued"
    });
    expect(result.job.validationScope).toMatchObject({
      ownedFiles: ["src/orchestratorValidatorLoop.ts"],
      validationCommands: ["npm.cmd run test -- src/orchestratorValidatorLoop.test.ts"]
    });
    expect(result.backendState.commandQueue[0]).toMatchObject({
      kind: "validator.start",
      status: "queued",
      payload: {
        branch: "codex/orch/task-1-validator-loop",
        capabilityProfile: "read-only",
        attempt: 1,
        ownedFiles: ["src/orchestratorValidatorLoop.ts"],
        acceptanceCriteria: ["Validator produces a structured report.", "Corrective tasks are narrow."],
        validationCommands: ["npm.cmd run test -- src/orchestratorValidatorLoop.test.ts"]
      }
    });
  });

  it("keeps validator reports structured and accepts passing reports", () => {
    const validator = createValidatorJobForWorker(backendState(), sourceTask(), workerJob(), createdAt);
    const loop = applyValidatorReport(
      validator.backendState,
      sourceTask(),
      workerJob(),
      validator.job,
      report({
        verdict: "pass",
        findings: [],
        commandsRun: [
          {
            command: "npm.cmd run test -- src/orchestratorValidatorLoop.test.ts",
            status: "passed",
            detail: "Passed"
          }
        ],
        acceptanceResults: [
          {
            criterion: "Validator produces a structured report.",
            status: "pass",
            evidence: ["vitest"]
          }
        ],
        nextAction: "accept"
      })
    );

    expect(loop.accepted).toBe(true);
    expect(loop.backendState.eventQueue[0]).toMatchObject({
      kind: "validator.reported",
      payload: {
        attempt: 1,
        verdict: "pass",
        nextAction: "accept",
        commandsRun: [
          {
            command: "npm.cmd run test -- src/orchestratorValidatorLoop.test.ts",
            status: "passed",
            detail: "Passed"
          }
        ],
        acceptanceResults: [
          {
            criterion: "Validator produces a structured report.",
            status: "pass",
            evidence: ["vitest"]
          }
        ]
      }
    });
  });

  it("returns a compact revision packet before the max attempt limit", () => {
    const packet = createWorkerRevisionPacket(report({ attempt: 2 }), 3);

    expect(packet).toMatchObject({
      taskId: "task-1",
      workerJobId: "run-123:worker:task-1",
      attempt: 2,
      nextAttempt: 3,
      requiredActions: ["Add focused validator loop coverage."]
    });
  });

  it("enqueues a same-worktree worker revision command when revision is allowed", () => {
    const validator = createValidatorJobForWorker(backendState(), sourceTask(), workerJob(), createdAt);
    const loop = applyValidatorReport(
      validator.backendState,
      sourceTask(),
      workerJob({ attempt: 1 }),
      validator.job,
      report({ attempt: 1 })
    );

    expect(loop.accepted).toBe(false);
    expect(loop.revisionPacket).toMatchObject({
      nextAttempt: 2
    });
    expect(loop.backendState.commandQueue.at(-1)).toMatchObject({
      kind: "worker.start"
    });
    expect(loop.backendState.commandQueue.at(-1)?.payload).toMatchObject({
      jobId: "run-123:worker:task-1",
      branch: "codex/orch/task-1-validator-loop",
      worktreePath: ".steerboard/worktrees/task-1-validator-loop",
      attempt: 2,
      reportId: "report-1",
      requiredActions: ["Add focused validator loop coverage."],
      ownership: {
        retainedByWorkerJobId: "run-123:worker:task-1",
        ownedFiles: ["src/orchestratorValidatorLoop.ts"]
      }
    });
  });

  it("returns the same worker and mutable scope for the second revision attempt", () => {
    const secondWorker = workerJob({ attempt: 2 });
    const validator = createValidatorJobForWorker(backendState(), sourceTask(), secondWorker, createdAt);
    const loop = applyValidatorReport(
      validator.backendState,
      sourceTask(),
      secondWorker,
      validator.job,
      report({ id: "report-2", attempt: 2 })
    );

    expect(loop.revisionPacket).toMatchObject({ attempt: 2, nextAttempt: 3 });
    expect(loop.backendState.commandQueue.at(-1)).toMatchObject({
      kind: "worker.start",
      payload: {
        jobId: "run-123:worker:task-1",
        branch: "codex/orch/task-1-validator-loop",
        worktreePath: ".steerboard/worktrees/task-1-validator-loop",
        attempt: 3,
        reportId: "report-2"
      }
    });
  });

  it("creates corrective PM tasks after max attempts instead of looping again", () => {
    const validator = createValidatorJobForWorker(backendState(), sourceTask(), workerJob({ attempt: 3 }), createdAt);
    const loop = applyValidatorReport(
      validator.backendState,
      sourceTask(),
      workerJob({ attempt: 3 }),
      validator.job,
      report({ attempt: 3 }),
      3
    );

    expect(loop.revisionPacket).toBeUndefined();
    expect(loop.corrective?.tasks).toHaveLength(1);
    expect(loop.corrective?.tasks[0]).toMatchObject({
      id: "task-1-corrective-missing-test",
      status: "queued",
      priority: "high",
      dependencies: ["task-1"],
      ownedFiles: ["src/orchestratorValidatorLoop.test.ts"],
      provenance: {
        origin: "orchestrator",
        createdFromTaskId: "task-1",
        createdFromFindingId: "missing-test",
        labels: ["orchestrator-created", "corrective", "validation-failure"]
      }
    });
  });

  it("marks corrective tasks as integration blockers when shared surfaces are affected", () => {
    const corrective = createCorrectivePmTasksFromReport(
      sourceTask(),
      report({
        findings: [
          {
            id: "shared-contract",
            severity: "error",
            message: "Fix shared backend contract.",
            files: ["src/orchestratorBackend.ts"],
            sharedSurface: true,
            evidence: ["contract mismatch"]
          }
        ]
      })
    );

    expect(corrective.blocksOriginalChain).toBe(true);
    expect(corrective.blocksIntegration).toBe(true);
    expect(corrective.tasks[0].priority).toBe("urgent");
  });

  it("validator report events update the ledger only through queue processing", () => {
    const validator = createValidatorJobForWorker(backendState(), sourceTask(), workerJob(), createdAt);
    const loop = applyValidatorReport(
      validator.backendState,
      sourceTask(),
      workerJob(),
      validator.job,
      report()
    );

    expect(loop.backendState.runs[0].phase).toBe("Run created");

    const processed = processAllQueuedOrchestratorEvents(loop.backendState, "2026-07-09T04:01:00.000Z");

    expect(processed.runs[0].phase).toBe("Validator verdict: revision-required.");
    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "validator.reported",
      message: "Validator verdict: revision-required."
    });
  });

  it("queues exactly one orchestrator takeover after the third failure and no fourth attempt", () => {
    const thirdWorker = workerJob({ attempt: 3, lease: { leaseOwner: "worker-agent", leasedAt: createdAt } });
    const validator = createValidatorJobForWorker(backendState(), sourceTask(), thirdWorker, createdAt);
    const orchestratorProfile = {
      ...DEFAULT_WORKER_MODEL_PROFILE,
      id: "teacher-high",
      role: "orchestrator" as const,
      model: "gpt-5.3-codex",
      reasoningEffort: "high" as const,
      capabilities: { ...DEFAULT_WORKER_MODEL_PROFILE.capabilities }
    };
    const thirdReport = report({ id: "report-third", attempt: 3 });
    const first = applyValidatorReport(
      validator.backendState,
      sourceTask(),
      thirdWorker,
      validator.job,
      thirdReport,
      3,
      "orchestrator-takeover",
      orchestratorProfile
    );
    const replay = applyValidatorReport(
      first.backendState,
      sourceTask(),
      thirdWorker,
      validator.job,
      thirdReport,
      3,
      "orchestrator-takeover",
      orchestratorProfile
    );

    expect(first.takeoverQueued).toBe(true);
    expect(replay.takeoverQueued).toBe(false);
    expect(replay.backendState.commandQueue.filter((command) => command.kind === "orchestrator.takeover")).toHaveLength(1);
    expect(replay.backendState.commandQueue.some((command) => command.payload.attempt === 4)).toBe(false);
    expect(replay.backendState.commandQueue.at(-1)?.payload.modelProfile).toMatchObject({
      id: "teacher-high",
      role: "orchestrator",
      reasoningEffort: "high"
    });
  });

  it("keeps blocked validation distinct from retry, takeover, and corrective exhaustion", () => {
    const validator = createValidatorJobForWorker(backendState(), sourceTask(), workerJob(), createdAt);
    const loop = applyValidatorReport(
      validator.backendState,
      sourceTask(),
      workerJob(),
      validator.job,
      report({ verdict: "blocked", nextAction: "escalate-human" }),
      3,
      "orchestrator-takeover"
    );

    expect(loop.accepted).toBe(false);
    expect(loop.revisionPacket).toBeUndefined();
    expect(loop.takeoverQueued).toBeUndefined();
    expect(loop.corrective).toBeUndefined();
    expect(loop.backendState.commandQueue).toHaveLength(1);
    expect(loop.backendState.commandQueue[0].kind).toBe("validator.start");
  });
});
