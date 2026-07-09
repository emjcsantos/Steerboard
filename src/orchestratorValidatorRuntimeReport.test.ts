import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  processAllQueuedOrchestratorEvents
} from "./orchestratorBackend";
import {
  createValidatorJobForWorker,
  type ValidatorJobRecord
} from "./orchestratorValidatorLoop";
import {
  applyValidatorRuntimeResult,
  validatorReportFromRuntimeResult
} from "./orchestratorValidatorRuntimeReport";
import {
  DEFAULT_PM_TASK_BUDGET,
  createPmTaskTemplateSnapshot,
  type PmWorkerReadyTask
} from "./pmLaneWorkerReady";
import {
  DEFAULT_WORKER_MODEL_PROFILE,
  type WorkerJobRecord
} from "./orchestratorWorkerDispatch";
import type { OrchestratorRuntimeCommandResult } from "./orchestratorRuntimeExecutor";

const createdAt = "2026-07-09T16:00:00.000Z";

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
    title: "Parse validator runtime",
    objective: "Parse validator output into loop decisions.",
    ownedFiles: ["src/orchestratorValidatorRuntimeReport.ts"],
    forbiddenFiles: ["src/codexSession.ts"],
    dependencies: [],
    acceptanceCriteria: ["Validator reports are structured."],
    validationCommands: ["npm.cmd run test -- src/orchestratorValidatorRuntimeReport.test.ts"],
    rollbackPlan: "Remove validator runtime parser.",
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
      templateId: "validator-runtime",
      resolvedAt: createdAt,
      templateJson: { kind: "validator-runtime" }
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
    branch: "codex/orch/task-1-runtime-parser",
    worktreePath: ".steerboard/worktrees/task-1-runtime-parser",
    status: "completed",
    modelProfileId: DEFAULT_WORKER_MODEL_PROFILE.id,
    capabilityProfile: "workspace-write",
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    ownedFiles: ["src/orchestratorValidatorRuntimeReport.ts"],
    forbiddenFiles: ["src/codexSession.ts"],
    attempt: 1,
    lease: {},
    createdAt,
    ...overrides
  };
}

function validatorJob(overrides: Partial<ValidatorJobRecord> = {}): ValidatorJobRecord {
  return createValidatorJobForWorker(backendState(), sourceTask(), workerJob(overrides.workerJobId ? {} : undefined), createdAt).job;
}

function runtimeResult(overrides: Partial<OrchestratorRuntimeCommandResult> = {}): OrchestratorRuntimeCommandResult {
  return {
    commandId: "run-123:worker:task-1:validator:1:start",
    runId: "run-123",
    kind: "validator.start",
    executed: true,
    blocked: false,
    artifactPaths: ["C:\\repo\\.steerboard\\orchestrator-artifacts\\run-123\\validator-stdout.jsonl"],
    steps: [
      {
        label: "Launch read-only validator",
        command: "codex exec --json -m gpt-5.3-spark -s read-only",
        status: "passed",
        detail: "Validator completed."
      }
    ],
    detail: "Read-only validator execution completed.",
    ...overrides
  };
}

describe("orchestrator validator runtime report", () => {
  it("parses structured validator JSON into a passing report", () => {
    const report = validatorReportFromRuntimeResult({
      result: runtimeResult(),
      sourceTask: sourceTask(),
      workerJob: workerJob(),
      validatorJob: validatorJob(),
      createdAt,
      structuredOutput: {
        verdict: "pass",
        nextAction: "accept",
        findings: [],
        commandsRun: [
          {
            command: "npm.cmd run test -- src/orchestratorValidatorRuntimeReport.test.ts",
            status: "passed",
            detail: "Passed"
          }
        ],
        acceptanceResults: [
          {
            criterion: "Validator reports are structured.",
            status: "pass",
            evidence: ["vitest"]
          }
        ],
        changedFiles: ["src/orchestratorValidatorRuntimeReport.ts"],
        evidenceReferences: ["artifact://validator/report"]
      }
    });

    expect(report).toMatchObject({
      runId: "run-123",
      taskId: "task-1",
      verdict: "pass",
      nextAction: "accept",
      findings: [],
      changedFiles: ["src/orchestratorValidatorRuntimeReport.ts"]
    });
    expect(report.evidenceReferences).toEqual([
      "artifact://validator/report",
      "C:\\repo\\.steerboard\\orchestrator-artifacts\\run-123\\validator-stdout.jsonl"
    ]);
  });

  it("applies revision-required validator output and queues a worker retry before max attempts", () => {
    const validator = createValidatorJobForWorker(backendState(), sourceTask(), workerJob(), createdAt);
    const applied = applyValidatorRuntimeResult({
      backendState: validator.backendState,
      sourceTask: sourceTask(),
      workerJob: workerJob(),
      validatorJob: validator.job,
      result: runtimeResult(),
      createdAt,
      structuredOutput: {
        verdict: "revision-required",
        nextAction: "return-to-worker",
        findings: [
          {
            id: "missing-test",
            severity: "error",
            message: "Add missing parser tests.",
            files: ["src/orchestratorValidatorRuntimeReport.test.ts"],
            sharedSurface: false,
            evidence: ["validator stdout"]
          }
        ],
        commandsRun: [
          {
            command: "npm.cmd run test -- src/orchestratorValidatorRuntimeReport.test.ts",
            status: "failed",
            detail: "Missing assertion."
          }
        ]
      }
    });

    expect(applied.accepted).toBe(false);
    expect(applied.revisionQueued).toBe(true);
    expect(applied.correctiveTaskCount).toBe(0);
    expect(applied.backendState.commandQueue.at(-1)).toMatchObject({
      kind: "worker.start",
      payload: {
        attempt: 2,
        defectCount: 1
      }
    });
  });

  it("falls back to a blocked report when validator runtime returns no structured output", () => {
    const report = validatorReportFromRuntimeResult({
      result: runtimeResult({
        executed: false,
        blocked: true,
        detail: "orchestrator_runtime_validator_requires_read_only",
        steps: [
          {
            label: "Preflight",
            command: "orchestrator runtime executor",
            status: "blocked",
            detail: "Validator must be read-only."
          }
        ]
      }),
      sourceTask: sourceTask(),
      workerJob: workerJob(),
      validatorJob: validatorJob(),
      createdAt
    });

    expect(report).toMatchObject({
      verdict: "blocked",
      nextAction: "escalate-human",
      findings: [
        {
          id: "validator-runtime-unstructured",
          severity: "error",
          message: "orchestrator_runtime_validator_requires_read_only"
        }
      ]
    });
  });

  it("creates corrective work after max attempts from parsed validator output", () => {
    const maxWorker = workerJob({ attempt: 3 });
    const validator = createValidatorJobForWorker(backendState(), sourceTask(), maxWorker, createdAt);
    const applied = applyValidatorRuntimeResult({
      backendState: validator.backendState,
      sourceTask: sourceTask(),
      workerJob: maxWorker,
      validatorJob: validator.job,
      result: runtimeResult(),
      createdAt,
      maxAttempts: 3,
      structuredOutput: {
        verdict: "revision-required",
        nextAction: "return-to-worker",
        attempt: 3,
        findings: [
          {
            id: "shared-contract",
            severity: "error",
            message: "Fix shared contract.",
            files: ["src/orchestratorBackend.ts"],
            sharedSurface: true,
            evidence: ["validator stdout"]
          }
        ]
      }
    });

    expect(applied.accepted).toBe(false);
    expect(applied.revisionQueued).toBe(false);
    expect(applied.correctiveTaskCount).toBe(1);

    const processed = processAllQueuedOrchestratorEvents(applied.backendState, "2026-07-09T16:01:00.000Z");

    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "validator.reported",
      message: "Validator verdict: revision-required."
    });
  });
});
