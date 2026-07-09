import {
  enqueueOrchestratorCommand,
  enqueueOrchestratorEvent,
  type OrchestratorBackendState,
  type OrchestratorQueuedCommand,
  type OrchestratorRunRecord
} from "./orchestratorBackend";
import { createCleanupJob } from "./orchestratorCleanup";
import type { OrchestratorRuntimeCommandResult } from "./orchestratorRuntimeExecutor";
import type { WorkerJobRecord } from "./orchestratorWorkerDispatch";
import type { ValidatorReport } from "./orchestratorValidatorLoop";

export interface AcceptedWorkerCommit {
  taskId: string;
  workerJobId: string;
  branch: string;
  worktreePath?: string;
  commitSha: string;
  committedAt: string;
  validationReportId: string;
  commandEvidence: string[];
}

export interface IntegrationGateInput {
  run: OrchestratorRunRecord;
  acceptedCommits: readonly AcceptedWorkerCommit[];
  unresolvedCorrectiveTaskIds: readonly string[];
  dependencyBlockerIds: readonly string[];
  fileOwnershipConflictIds: readonly string[];
  branchClean: boolean;
  mergeable: boolean;
  targetedValidationPassed: boolean;
  sharedSurfaceChanged: boolean;
}

export interface IntegrationGateCheck {
  id:
    | "accepted-commits"
    | "corrective-children"
    | "dependencies"
    | "file-ownership"
    | "branch-clean"
    | "mergeable"
    | "validation";
  passed: boolean;
  detail: string;
}

export interface IntegrationGateResult {
  canIntegrate: boolean;
  validationScope: "targeted" | "broad";
  checks: IntegrationGateCheck[];
  blockerIds: string[];
  finalMergeRequiresApproval: true;
}

export interface AutomaticIntegrationResult {
  backendState: OrchestratorBackendState;
  gate: IntegrationGateResult;
  queued: boolean;
}

export interface WorkerCommitRuntimeIntegrationResult {
  backendState: OrchestratorBackendState;
  acceptedCommit?: AcceptedWorkerCommit;
  queued: boolean;
  detail: string;
}

export interface IntegrationRuntimeApplyResult {
  backendState: OrchestratorBackendState;
  completed: boolean;
  cleanupQueued: number;
  detail: string;
}

function fallbackCommitSha(workerJob: WorkerJobRecord, report: ValidatorReport): string {
  const seed = `${workerJob.id}:${report.id}:${report.createdAt}`;
  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0").repeat(5).slice(0, 40);
}

export function createAcceptedWorkerCommit(
  backendState: OrchestratorBackendState,
  workerJob: WorkerJobRecord,
  report: ValidatorReport,
  input: {
    committedAt: string;
    commitSha?: string;
    commandEvidence: string[];
  }
): { backendState: OrchestratorBackendState; commit: AcceptedWorkerCommit } {
  if (report.verdict !== "pass") {
    throw new Error("Cannot accept worker commit without a passing validator report.");
  }

  const commit: AcceptedWorkerCommit = {
    taskId: workerJob.taskId,
    workerJobId: workerJob.id,
    branch: workerJob.branch,
    worktreePath: workerJob.worktreePath,
    commitSha: input.commitSha ?? fallbackCommitSha(workerJob, report),
    committedAt: input.committedAt,
    validationReportId: report.id,
    commandEvidence: [...input.commandEvidence]
  };
  const nextState = enqueueOrchestratorCommand(backendState, {
    id: `${workerJob.id}:commit`,
    runId: workerJob.runId,
    kind: "worker.commit",
    payload: {
      taskId: commit.taskId,
      workerJobId: commit.workerJobId,
      branch: commit.branch,
      worktreePath: workerJob.worktreePath,
      commitSha: commit.commitSha,
      validationReportId: commit.validationReportId,
      commandEvidence: commit.commandEvidence
    },
    enqueuedAt: input.committedAt
  });

  return {
    backendState: nextState,
    commit
  };
}

export function evaluateIntegrationGates(input: IntegrationGateInput): IntegrationGateResult {
  const checks: IntegrationGateCheck[] = [
    {
      id: "accepted-commits",
      passed: input.acceptedCommits.length > 0,
      detail: `${input.acceptedCommits.length} accepted commit${input.acceptedCommits.length === 1 ? "" : "s"}.`
    },
    {
      id: "corrective-children",
      passed: input.unresolvedCorrectiveTaskIds.length === 0,
      detail: `${input.unresolvedCorrectiveTaskIds.length} unresolved corrective task${input.unresolvedCorrectiveTaskIds.length === 1 ? "" : "s"}.`
    },
    {
      id: "dependencies",
      passed: input.dependencyBlockerIds.length === 0,
      detail: `${input.dependencyBlockerIds.length} dependency blocker${input.dependencyBlockerIds.length === 1 ? "" : "s"}.`
    },
    {
      id: "file-ownership",
      passed: input.fileOwnershipConflictIds.length === 0,
      detail: `${input.fileOwnershipConflictIds.length} file ownership conflict${input.fileOwnershipConflictIds.length === 1 ? "" : "s"}.`
    },
    {
      id: "branch-clean",
      passed: input.branchClean,
      detail: input.branchClean ? "Worker branch is clean." : "Worker branch has unexpected changes."
    },
    {
      id: "mergeable",
      passed: input.mergeable,
      detail: input.mergeable ? "Merge simulation passed." : "Merge simulation failed."
    },
    {
      id: "validation",
      passed: input.targetedValidationPassed,
      detail: input.sharedSurfaceChanged
        ? "Shared-surface change requires broader validation."
        : "Targeted integration validation passed."
    }
  ];
  const blockerIds = [
    ...input.unresolvedCorrectiveTaskIds,
    ...input.dependencyBlockerIds,
    ...input.fileOwnershipConflictIds,
    ...checks.filter((check) => !check.passed).map((check) => check.id)
  ];

  return {
    canIntegrate: checks.every((check) => check.passed),
    validationScope: input.sharedSurfaceChanged ? "broad" : "targeted",
    checks,
    blockerIds,
    finalMergeRequiresApproval: true
  };
}

export function queueAutomaticIntegration(
  backendState: OrchestratorBackendState,
  input: IntegrationGateInput,
  createdAt: string
): AutomaticIntegrationResult {
  const gate = evaluateIntegrationGates(input);

  if (!gate.canIntegrate) {
    return {
      backendState: enqueueOrchestratorEvent(backendState, {
        id: `${input.run.id}:integration:blocker:${createdAt}`,
        runId: input.run.id,
        kind: "integration.updated",
        payload: {
          phase: "Integration blocked.",
          integrationBranch: input.run.integrationBranch,
          blockerIds: gate.blockerIds,
          validationScope: gate.validationScope,
          finalMergeRequiresApproval: true
        },
        dedupeKey: `${input.run.id}:integration:blocker:${createdAt}`,
        enqueuedAt: createdAt
      }),
      gate,
      queued: false
    };
  }

  return {
    backendState: enqueueOrchestratorCommand(backendState, {
      id: `${input.run.id}:integration:start:${createdAt}`,
      runId: input.run.id,
      kind: "integration.start",
      payload: {
        integrationBranch: input.run.integrationBranch,
        baseBranch: input.run.baseBranch,
        commitShas: input.acceptedCommits.map((commit) => commit.commitSha),
        acceptedCommits: input.acceptedCommits.map((commit) => ({
          taskId: commit.taskId,
          workerJobId: commit.workerJobId,
          branch: commit.branch,
          worktreePath: commit.worktreePath,
          commitSha: commit.commitSha,
          validationReportId: commit.validationReportId
        })),
        validationScope: gate.validationScope,
        finalMergeRequiresApproval: true
      },
      enqueuedAt: createdAt
    }),
    gate,
    queued: true
  };
}

function payloadString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function payloadStringList(payload: Record<string, unknown>, key: string): string[] {
  const value = payload[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function resultString(result: OrchestratorRuntimeCommandResult, key: string): string | undefined {
  const output = result.structuredOutput;

  if (typeof output !== "object" || output === null || Array.isArray(output)) {
    return undefined;
  }

  const value = (output as Record<string, unknown>)[key];

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function queueIntegrationAfterWorkerCommitRuntime(input: {
  backendState: OrchestratorBackendState;
  command: OrchestratorQueuedCommand;
  result: OrchestratorRuntimeCommandResult;
  createdAt: string;
}): WorkerCommitRuntimeIntegrationResult | undefined {
  if (input.command.kind !== "worker.commit") {
    return undefined;
  }

  if (input.result.blocked || !input.result.executed) {
    return {
      backendState: input.backendState,
      queued: false,
      detail: "Worker commit runtime did not complete; integration was not queued."
    };
  }

  const run = input.backendState.runs.find((item) => item.id === input.command.runId);
  const taskId = payloadString(input.command.payload, "taskId");
  const workerJobId = payloadString(input.command.payload, "workerJobId");
  const branch = payloadString(input.command.payload, "branch");
  const validationReportId = payloadString(input.command.payload, "validationReportId");
  const commitSha = resultString(input.result, "commitSha") ?? payloadString(input.command.payload, "commitSha");

  if (!run || !taskId || !workerJobId || !branch || !validationReportId || !commitSha) {
    return {
      backendState: input.backendState,
      queued: false,
      detail: "Worker commit runtime result was missing integration metadata."
    };
  }

  const alreadyQueued = input.backendState.commandQueue.some((command) => {
    if (command.kind !== "integration.start") {
      return false;
    }

    const commitShas = payloadStringList(command.payload, "commitShas");

    return command.runId === run.id && commitShas.includes(commitSha);
  });

  const acceptedCommit: AcceptedWorkerCommit = {
    taskId,
    workerJobId,
    branch,
    worktreePath: payloadString(input.command.payload, "worktreePath"),
    commitSha,
    committedAt: input.createdAt,
    validationReportId,
    commandEvidence: payloadStringList(input.command.payload, "commandEvidence")
  };

  if (alreadyQueued) {
    return {
      backendState: input.backendState,
      acceptedCommit,
      queued: false,
      detail: "Integration was already queued for this accepted commit."
    };
  }

  const integration = queueAutomaticIntegration(
    input.backendState,
    {
      run,
      acceptedCommits: [acceptedCommit],
      unresolvedCorrectiveTaskIds: [],
      dependencyBlockerIds: [],
      fileOwnershipConflictIds: [],
      branchClean: true,
      mergeable: true,
      targetedValidationPassed: true,
      sharedSurfaceChanged: false
    },
    input.createdAt
  );

  return {
    backendState: integration.backendState,
    acceptedCommit,
    queued: integration.queued,
    detail: integration.queued
      ? "Queued automatic integration for accepted worker commit."
      : "Accepted worker commit did not pass integration gates."
  };
}

function resultStringList(result: OrchestratorRuntimeCommandResult, key: string): string[] {
  const output = result.structuredOutput;

  if (typeof output !== "object" || output === null || Array.isArray(output)) {
    return [];
  }

  return payloadStringList(output as Record<string, unknown>, key);
}

function cleanupTargetsFromCommand(command: OrchestratorQueuedCommand): Array<{
  taskId: string;
  workerJobId: string;
  path: string;
}> {
  const acceptedCommits = command.payload.acceptedCommits;

  if (!Array.isArray(acceptedCommits)) {
    return [];
  }

  return acceptedCommits.flatMap((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return [];
    }

    const record = item as Record<string, unknown>;
    const taskId = payloadString(record, "taskId");
    const workerJobId = payloadString(record, "workerJobId");
    const path = payloadString(record, "worktreePath");

    return taskId && workerJobId && path
      ? [
          {
            taskId,
            workerJobId,
            path
          }
        ]
      : [];
  });
}

export function applyIntegrationRuntimeCommandResult(input: {
  backendState: OrchestratorBackendState;
  command: OrchestratorQueuedCommand;
  result: OrchestratorRuntimeCommandResult;
  createdAt: string;
}): IntegrationRuntimeApplyResult | undefined {
  if (input.command.kind !== "integration.start") {
    return undefined;
  }

  const run = input.backendState.runs.find((item) => item.id === input.command.runId);

  if (!run) {
    return {
      backendState: input.backendState,
      completed: false,
      cleanupQueued: 0,
      detail: "Integration runtime result was ignored because the run no longer exists."
    };
  }

  const integrationBranch =
    resultString(input.result, "integrationBranch") ?? payloadString(input.command.payload, "integrationBranch") ?? run.integrationBranch;
  const commitShas =
    resultStringList(input.result, "commitShas").length > 0
      ? resultStringList(input.result, "commitShas")
      : payloadStringList(input.command.payload, "commitShas");

  if (input.result.blocked || !input.result.executed) {
    return {
      backendState: enqueueOrchestratorEvent(input.backendState, {
        id: `${run.id}:integration:failed:${input.createdAt}`,
        runId: run.id,
        kind: "integration.updated",
        payload: {
          phase: "Integration failed.",
          runStatus: "validation-failed",
          integrationBranch,
          commitShas,
          blockerIds: ["integration-runtime"],
          commandId: input.command.id,
          detail: input.result.detail,
          finalMergeRequiresApproval: true
        },
        dedupeKey: `${input.command.id}:integration-failed`,
        enqueuedAt: input.createdAt
      }),
      completed: false,
      cleanupQueued: 0,
      detail: "Integration runtime failed; finalization was blocked."
    };
  }

  let nextState = enqueueOrchestratorEvent(input.backendState, {
    id: `${run.id}:integration:ready:${input.createdAt}`,
    runId: run.id,
    kind: "integration.updated",
    payload: {
      phase: "Integration branch ready for finalization.",
      runStatus: "ready-for-finalization",
      integrationBranch,
      commitShas,
      validationScope: payloadString(input.command.payload, "validationScope") ?? resultString(input.result, "validationScope") ?? "targeted",
      commandId: input.command.id,
      detail: input.result.detail,
      finalMergeRequiresApproval: true
    },
    dedupeKey: `${input.command.id}:integration-ready`,
    enqueuedAt: input.createdAt
  });

  const cleanupTargets = cleanupTargetsFromCommand(input.command);

  cleanupTargets.forEach((target, index) => {
    const cleanupJob = createCleanupJob({
      id: `${run.id}:cleanup:${target.taskId}:${index + 1}`,
      runId: run.id,
      taskId: target.taskId,
      jobId: target.workerJobId,
      kind: "worker-worktree",
      path: target.path,
      reason: "Accepted worker output integrated.",
      createdAt: input.createdAt
    });
    const alreadyQueued = nextState.commandQueue.some(
      (command) =>
        command.kind === "cleanup.start" &&
        command.runId === run.id &&
        payloadString(command.payload, "path") === target.path
    );

    if (!alreadyQueued) {
      nextState = enqueueOrchestratorCommand(nextState, {
        id: `${cleanupJob.id}:start`,
        runId: run.id,
        kind: "cleanup.start",
        payload: {
          ...cleanupJob,
          policyMode: "automatic",
          keepOnFailure: true
        },
        enqueuedAt: input.createdAt
      });
    }
  });

  return {
    backendState: nextState,
    completed: true,
    cleanupQueued: cleanupTargets.length,
    detail: "Integration runtime completed; run is ready for finalization."
  };
}
