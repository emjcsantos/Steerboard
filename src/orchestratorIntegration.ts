import {
  enqueueOrchestratorCommand,
  enqueueOrchestratorEvent,
  type OrchestratorBackendState,
  type OrchestratorRunRecord
} from "./orchestratorBackend";
import type { WorkerJobRecord } from "./orchestratorWorkerDispatch";
import type { ValidatorReport } from "./orchestratorValidatorLoop";

export interface AcceptedWorkerCommit {
  taskId: string;
  workerJobId: string;
  branch: string;
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
        validationScope: gate.validationScope,
        finalMergeRequiresApproval: true
      },
      enqueuedAt: createdAt
    }),
    gate,
    queued: true
  };
}
