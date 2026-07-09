import {
  enqueueOrchestratorEvent,
  type OrchestratorBackendState,
  type OrchestratorLedgerEntry,
  type OrchestratorRunRecord
} from "./orchestratorBackend";
import type { OrchestratorArtifact } from "./orchestratorArtifacts";
import type { CleanupJob, CleanupQueueSummary } from "./orchestratorCleanup";
import type { AcceptedWorkerCommit } from "./orchestratorIntegration";
import type { PmWorkerReadyTask } from "./pmLaneWorkerReady";

export type FinalizationStatus =
  | "not-ready"
  | "ready-for-approval"
  | "approved"
  | "blocked"
  | "completed";

export type RemotePushMode = "manual" | "automatic";

export interface OrchestratorRunReport {
  id: string;
  runId: string;
  generatedAt: string;
  markdown: string;
  summaryJson: {
    taskScope: string[];
    completedTaskIds: string[];
    acceptedCommitShas: string[];
    integrationBranch: string;
    validationEvidenceCount: number;
    correctiveTaskIds: string[];
    unresolvedBlockers: string[];
    cleanupStatus: string;
    finalizationStatus: FinalizationStatus;
    recommendedNextAction: string;
  };
}

export interface FinalizationGateInput {
  integrationValidationPassed: boolean;
  unresolvedCorrectiveTaskIds: readonly string[];
  blockerIds: readonly string[];
  targetBranchClean: boolean;
  expectedBaseMatches: boolean;
  userApprovedFinalMerge: boolean;
}

export interface FinalizationGateResult {
  status: FinalizationStatus;
  canMergeToTarget: boolean;
  missingGateIds: string[];
  detail: string;
}

export interface RemotePolicy {
  pushMode: RemotePushMode;
  allowedRemote: string;
  requireCleanValidation: true;
}

export interface RemotePushGateInput {
  policy: RemotePolicy;
  integrationValidationPassed: boolean;
  branchCommitted: boolean;
  remoteConfigured: boolean;
  secretsDetected: boolean;
  projectAllowsPush: boolean;
}

export interface RemotePushGateResult {
  canPush: boolean;
  mode: RemotePushMode;
  missingGateIds: string[];
  detail: string;
}

export const DEFAULT_REMOTE_POLICY: RemotePolicy = {
  pushMode: "manual",
  allowedRemote: "origin",
  requireCleanValidation: true
};

function listLines(items: readonly string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

function cleanupStatus(jobs: readonly CleanupJob[]): string {
  const open = jobs.filter((job) => job.status !== "completed" && job.status !== "cancelled");

  return open.length === 0 ? "cleanup complete" : `${open.length} cleanup job${open.length === 1 ? "" : "s"} open`;
}

export function evaluateFinalizationGates(input: FinalizationGateInput): FinalizationGateResult {
  const missingGateIds = [
    !input.integrationValidationPassed ? "integration-validation" : undefined,
    input.unresolvedCorrectiveTaskIds.length > 0 ? "corrective-tasks" : undefined,
    input.blockerIds.length > 0 ? "blockers" : undefined,
    !input.targetBranchClean ? "target-branch-clean" : undefined,
    !input.expectedBaseMatches ? "expected-base" : undefined,
    !input.userApprovedFinalMerge ? "user-approval" : undefined
  ].filter((value): value is string => Boolean(value));

  if (missingGateIds.length === 0) {
    return {
      status: "approved",
      canMergeToTarget: true,
      missingGateIds,
      detail: "Final merge is approved and all finalization gates passed."
    };
  }

  if (missingGateIds.length === 1 && missingGateIds[0] === "user-approval") {
    return {
      status: "ready-for-approval",
      canMergeToTarget: false,
      missingGateIds,
      detail: "Integration branch is ready; final merge requires explicit user approval."
    };
  }

  return {
    status: "blocked",
    canMergeToTarget: false,
    missingGateIds,
    detail: `Finalization blocked by ${missingGateIds.join(", ")}.`
  };
}

export function evaluateRemotePushGates(input: RemotePushGateInput): RemotePushGateResult {
  const missingGateIds = [
    input.policy.pushMode !== "automatic" ? "automatic-push-disabled" : undefined,
    !input.integrationValidationPassed ? "integration-validation" : undefined,
    !input.branchCommitted ? "branch-committed" : undefined,
    !input.remoteConfigured ? "remote-configured" : undefined,
    input.secretsDetected ? "secrets-detected" : undefined,
    !input.projectAllowsPush ? "project-policy" : undefined
  ].filter((value): value is string => Boolean(value));

  return {
    canPush: missingGateIds.length === 0,
    mode: input.policy.pushMode,
    missingGateIds,
    detail:
      missingGateIds.length === 0
        ? `Automatic push to ${input.policy.allowedRemote} is allowed.`
        : `Remote push gated: ${missingGateIds.join(", ")}.`
  };
}

export function recordRemotePushFailure(
  backendState: OrchestratorBackendState,
  input: {
    runId: string;
    branch: string;
    remote: string;
    error: string;
    createdAt: string;
  }
): OrchestratorBackendState {
  return enqueueOrchestratorEvent(backendState, {
    id: `${input.runId}:remote-push-failed:${input.createdAt}`,
    runId: input.runId,
    kind: "integration.updated",
    payload: {
      phase: "Remote push failed.",
      branch: input.branch,
      remote: input.remote,
      error: input.error
    },
    dedupeKey: `${input.runId}:remote-push-failed:${input.createdAt}`,
    enqueuedAt: input.createdAt
  });
}

export function generateOrchestratorRunReport(input: {
  run: OrchestratorRunRecord;
  tasks: readonly PmWorkerReadyTask[];
  acceptedCommits: readonly AcceptedWorkerCommit[];
  artifacts: readonly OrchestratorArtifact[];
  correctiveTasks: readonly PmWorkerReadyTask[];
  blockerIds: readonly string[];
  ledger: readonly OrchestratorLedgerEntry[];
  cleanupJobs: readonly CleanupJob[];
  cleanupSummary?: CleanupQueueSummary;
  finalization: FinalizationGateResult;
  generatedAt: string;
}): OrchestratorRunReport {
  const completedTaskIds = input.tasks
    .filter((task) => task.status === "queued" || input.acceptedCommits.some((commit) => commit.taskId === task.id))
    .map((task) => task.id);
  const validationEvidenceCount = input.artifacts.length;
  const recommendedNextAction =
    input.finalization.status === "ready-for-approval"
      ? "Approve final merge when ready."
      : input.finalization.status === "approved"
      ? "Merge integration branch into target branch."
      : input.blockerIds.length > 0
      ? "Resolve blockers before finalization."
      : "Review run report.";
  const summaryJson = {
    taskScope: input.run.scope.taskIds,
    completedTaskIds,
    acceptedCommitShas: input.acceptedCommits.map((commit) => commit.commitSha),
    integrationBranch: input.run.integrationBranch,
    validationEvidenceCount,
    correctiveTaskIds: input.correctiveTasks.map((task) => task.id),
    unresolvedBlockers: [...input.blockerIds],
    cleanupStatus: input.cleanupSummary?.detail ?? cleanupStatus(input.cleanupJobs),
    finalizationStatus: input.finalization.status,
    recommendedNextAction
  };
  const markdown = [
    `# Orchestrator Run Report: ${input.run.id}`,
    "",
    `Generated: ${input.generatedAt}`,
    `Project: ${input.run.projectId}`,
    `Status: ${input.run.status}`,
    `Integration branch: ${input.run.integrationBranch}`,
    "",
    "## Task Scope",
    listLines(summaryJson.taskScope),
    "",
    "## Completed Tasks",
    listLines(summaryJson.completedTaskIds),
    "",
    "## Accepted Worker Commits",
    listLines(input.acceptedCommits.map((commit) => `${commit.commitSha} ${commit.taskId} ${commit.branch}`)),
    "",
    "## Validation Evidence",
    listLines(input.artifacts.map((artifact) => `${artifact.kind} ${artifact.id} ${artifact.path}`)),
    "",
    "## Corrective Tasks",
    listLines(summaryJson.correctiveTaskIds),
    "",
    "## Unresolved Blockers",
    listLines(summaryJson.unresolvedBlockers),
    "",
    "## Budget Usage",
    listLines(input.tasks.map((task) => `${task.id}: ${task.budget.maxWorkerAttempts} attempts, ${task.budget.maxRuntimeMinutes} minutes`)),
    "",
    "## Approvals And Denials",
    listLines(input.ledger.filter((entry) => entry.kind === "approval.requested").map((entry) => entry.message)),
    "",
    "## Cleanup Status",
    summaryJson.cleanupStatus,
    "",
    "## Finalization",
    `${input.finalization.status}: ${input.finalization.detail}`,
    "",
    "## Recommended Next Action",
    recommendedNextAction
  ].join("\n");

  return {
    id: `${input.run.id}:report:${input.generatedAt}`,
    runId: input.run.id,
    generatedAt: input.generatedAt,
    markdown,
    summaryJson
  };
}
