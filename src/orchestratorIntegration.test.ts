import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  processAllQueuedOrchestratorEvents
} from "./orchestratorBackend";
import {
  createAcceptedWorkerCommit,
  evaluateIntegrationGates,
  queueAutomaticIntegration
} from "./orchestratorIntegration";
import {
  DEFAULT_WORKER_MODEL_PROFILE,
  type WorkerJobRecord
} from "./orchestratorWorkerDispatch";
import { DEFAULT_PM_TASK_BUDGET } from "./pmLaneWorkerReady";
import type { ValidatorReport } from "./orchestratorValidatorLoop";

const createdAt = "2026-07-09T06:00:00.000Z";

function backendState() {
  return createBoundedOrchestratorRun(createOrchestratorBackendState(), {
    id: "run-123",
    projectId: "steerboard",
    scope: { mode: "task-list", taskIds: ["task-1"] },
    baseBranch: "main",
    createdAt
  });
}

function workerJob(): WorkerJobRecord {
  return {
    id: "run-123:worker:task-1",
    runId: "run-123",
    taskId: "task-1",
    branch: "codex/orch/task-1",
    worktreePath: ".steerboard/worktrees/task-1",
    status: "completed",
    modelProfileId: DEFAULT_WORKER_MODEL_PROFILE.id,
    capabilityProfile: "workspace-write",
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    ownedFiles: ["src/task-1.ts"],
    forbiddenFiles: [],
    attempt: 1,
    lease: {},
    createdAt
  };
}

function passingReport(): ValidatorReport {
  return {
    id: "report-1",
    runId: "run-123",
    taskId: "task-1",
    workerJobId: "run-123:worker:task-1",
    validatorJobId: "validator-1",
    attempt: 1,
    verdict: "pass",
    findings: [],
    commandsRun: [
      {
        command: "npm.cmd run test -- src/task-1.test.ts",
        status: "passed",
        detail: "Passed"
      }
    ],
    acceptanceResults: [
      {
        criterion: "Task passes.",
        status: "pass",
        evidence: ["vitest"]
      }
    ],
    changedFiles: ["src/task-1.ts"],
    evidenceReferences: ["artifact://report-1"],
    nextAction: "accept",
    createdAt
  };
}

describe("orchestrator integration", () => {
  it("creates an accepted worker commit from a passing validator report", () => {
    const result = createAcceptedWorkerCommit(backendState(), workerJob(), passingReport(), {
      committedAt: createdAt,
      commitSha: "abc123",
      commandEvidence: ["npm.cmd run test -- src/task-1.test.ts"]
    });

    expect(result.commit).toEqual({
      taskId: "task-1",
      workerJobId: "run-123:worker:task-1",
      branch: "codex/orch/task-1",
      commitSha: "abc123",
      committedAt: createdAt,
      validationReportId: "report-1",
      commandEvidence: ["npm.cmd run test -- src/task-1.test.ts"]
    });
    expect(result.backendState.commandQueue[0]).toMatchObject({
      kind: "worker.commit",
      status: "queued"
    });
  });

  it("rejects accepted commit creation without a passing report", () => {
    expect(() =>
      createAcceptedWorkerCommit(backendState(), workerJob(), { ...passingReport(), verdict: "blocked" }, {
        committedAt: createdAt,
        commandEvidence: []
      })
    ).toThrow("passing validator report");
  });

  it("evaluates integration gates and escalates shared surfaces to broad validation", () => {
    const accepted = createAcceptedWorkerCommit(backendState(), workerJob(), passingReport(), {
      committedAt: createdAt,
      commitSha: "abc123",
      commandEvidence: []
    }).commit;
    const run = backendState().runs[0];
    const gate = evaluateIntegrationGates({
      run,
      acceptedCommits: [accepted],
      unresolvedCorrectiveTaskIds: [],
      dependencyBlockerIds: [],
      fileOwnershipConflictIds: [],
      branchClean: true,
      mergeable: true,
      targetedValidationPassed: true,
      sharedSurfaceChanged: true
    });

    expect(gate.canIntegrate).toBe(true);
    expect(gate.validationScope).toBe("broad");
    expect(gate.finalMergeRequiresApproval).toBe(true);
    expect(gate.checks.every((check) => check.passed)).toBe(true);
  });

  it("queues automatic integration into the per-run integration branch when gates pass", () => {
    const state = backendState();
    const accepted = createAcceptedWorkerCommit(state, workerJob(), passingReport(), {
      committedAt: createdAt,
      commitSha: "abc123",
      commandEvidence: []
    }).commit;
    const result = queueAutomaticIntegration(
      state,
      {
        run: state.runs[0],
        acceptedCommits: [accepted],
        unresolvedCorrectiveTaskIds: [],
        dependencyBlockerIds: [],
        fileOwnershipConflictIds: [],
        branchClean: true,
        mergeable: true,
        targetedValidationPassed: true,
        sharedSurfaceChanged: false
      },
      createdAt
    );

    expect(result.queued).toBe(true);
    expect(result.backendState.commandQueue[0]).toMatchObject({
      kind: "integration.start"
    });
    expect(result.backendState.commandQueue[0].payload).toMatchObject({
      integrationBranch: "codex/orch/integration/run-123",
      baseBranch: "main",
      commitShas: ["abc123"],
      validationScope: "targeted",
      finalMergeRequiresApproval: true
    });
  });

  it("creates integration blocker evidence instead of touching the user branch when gates fail", () => {
    const state = backendState();
    const result = queueAutomaticIntegration(
      state,
      {
        run: state.runs[0],
        acceptedCommits: [],
        unresolvedCorrectiveTaskIds: ["task-1-corrective"],
        dependencyBlockerIds: [],
        fileOwnershipConflictIds: ["src/task-1.ts"],
        branchClean: false,
        mergeable: false,
        targetedValidationPassed: false,
        sharedSurfaceChanged: false
      },
      createdAt
    );

    expect(result.queued).toBe(false);
    expect(result.gate.canIntegrate).toBe(false);
    expect(result.gate.blockerIds).toEqual([
      "task-1-corrective",
      "src/task-1.ts",
      "accepted-commits",
      "corrective-children",
      "file-ownership",
      "branch-clean",
      "mergeable",
      "validation"
    ]);
    expect(result.backendState.commandQueue).toEqual([]);
    expect(result.backendState.eventQueue[0]).toMatchObject({
      kind: "integration.updated"
    });

    const processed = processAllQueuedOrchestratorEvents(result.backendState, "2026-07-09T06:01:00.000Z");

    expect(processed.runs[0].phase).toBe("Integration blocked.");
    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "integration.updated",
      message: "Integration blocked."
    });
  });
});
