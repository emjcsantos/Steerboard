import {
  enqueueOrchestratorCommand,
  enqueueOrchestratorEvent,
  type OrchestratorBackendState,
  type OrchestratorQueuedCommand,
  type OrchestratorLedgerEntry,
  type OrchestratorRunRecord
} from "./orchestratorBackend";
import type { OrchestratorArtifact } from "./orchestratorArtifacts";
import { summarizeCleanupQueue, type CleanupJob, type CleanupQueueSummary } from "./orchestratorCleanup";
import type { AcceptedWorkerCommit } from "./orchestratorIntegration";
import type { OrchestratorRuntimeCommandResult } from "./orchestratorRuntimeExecutor";
import { DEFAULT_PM_TASK_BUDGET, type PmWorkerReadyTask } from "./pmLaneWorkerReady";

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

export interface FinalRunReportEventResult {
  backendState: OrchestratorBackendState;
  report?: OrchestratorRunReport;
  queued: boolean;
  detail: string;
}

export interface FinalMergeQueueResult {
  backendState: OrchestratorBackendState;
  finalization: FinalizationGateResult;
  queued: boolean;
  approvalRequired: boolean;
  detail: string;
}

export interface FinalizationRuntimeApplyResult {
  backendState: OrchestratorBackendState;
  completed: boolean;
  remoteQueued: boolean;
  failed: boolean;
  detail: string;
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

function remotePolicyFromPayload(payload: Record<string, unknown>): RemotePolicy {
  const pushMode = payloadString(payload, "pushMode");
  const allowedRemote = payloadString(payload, "allowedRemote");

  return {
    pushMode: pushMode === "automatic" ? "automatic" : "manual",
    allowedRemote: allowedRemote ?? DEFAULT_REMOTE_POLICY.allowedRemote,
    requireCleanValidation: true
  };
}

function listLines(items: readonly string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

function cleanupStatus(jobs: readonly CleanupJob[]): string {
  const open = jobs.filter((job) => job.status !== "completed" && job.status !== "cancelled");

  return open.length === 0 ? "cleanup complete" : `${open.length} cleanup job${open.length === 1 ? "" : "s"} open`;
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

function payloadNumber(payload: Record<string, unknown>, key: string): number | undefined {
  const value = payload[key];

  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function resultString(result: OrchestratorRuntimeCommandResult, key: string): string | undefined {
  const output = result.structuredOutput;

  if (typeof output !== "object" || output === null || Array.isArray(output)) {
    return undefined;
  }

  return payloadString(output as Record<string, unknown>, key);
}

function cleanupJobFromCommand(command: OrchestratorQueuedCommand): CleanupJob | undefined {
  if (command.kind !== "cleanup.start") {
    return undefined;
  }

  const id = payloadString(command.payload, "id");
  const path = payloadString(command.payload, "path");
  const kind = payloadString(command.payload, "kind");
  const status = payloadString(command.payload, "status");
  const retentionExpiresAt = payloadString(command.payload, "retentionExpiresAt");
  const reason = payloadString(command.payload, "reason");
  const createdAt = payloadString(command.payload, "createdAt");
  const updatedAt = payloadString(command.payload, "updatedAt");

  if (
    !id ||
    !path ||
    !kind ||
    !status ||
    !retentionExpiresAt ||
    !reason ||
    !createdAt ||
    !updatedAt ||
    (kind !== "worker-worktree" &&
      kind !== "validator-artifact" &&
      kind !== "runtime-state" &&
      kind !== "stale-process-handle") ||
    (status !== "scheduled" &&
      status !== "retention-active" &&
      status !== "ready" &&
      status !== "running" &&
      status !== "blocked" &&
      status !== "completed" &&
      status !== "failed" &&
      status !== "cancelled")
  ) {
    return undefined;
  }

  return {
    id,
    runId: command.runId,
    taskId: payloadString(command.payload, "taskId"),
    jobId: payloadString(command.payload, "jobId"),
    kind,
    path,
    reason,
    status,
    retentionExpiresAt,
    blockedReasons: [],
    createdAt,
    updatedAt,
    completedAt: payloadString(command.payload, "completedAt"),
    deletionResult: payloadString(command.payload, "deletionResult")
  };
}

function cleanupStatusFromPayload(payload: Record<string, unknown>): CleanupJob["status"] | undefined {
  const value = payloadString(payload, "cleanupStatus");

  return value === "scheduled" ||
    value === "retention-active" ||
    value === "ready" ||
    value === "running" ||
    value === "blocked" ||
    value === "completed" ||
    value === "failed" ||
    value === "cancelled"
    ? value
    : undefined;
}

function cleanupJobsWithLedgerUpdates(
  jobs: readonly CleanupJob[],
  ledger: readonly OrchestratorLedgerEntry[]
): CleanupJob[] {
  return jobs.map((job) => {
    const latest = [...ledger]
      .filter((entry) => payloadString(entry.payload, "cleanupJobId") === job.id)
      .sort((first, second) => first.createdAt.localeCompare(second.createdAt))
      .at(-1);
    const cleanupStatus = latest ? cleanupStatusFromPayload(latest.payload) : undefined;

    if (!latest || !cleanupStatus) {
      return job;
    }

    return {
      ...job,
      status: cleanupStatus,
      completedAt: payloadString(latest.payload, "completedAt") ?? job.completedAt,
      deletionResult: payloadString(latest.payload, "deletionResult") ?? job.deletionResult,
      updatedAt: latest.createdAt
    };
  });
}

function acceptedCommitsFromCommand(command: OrchestratorQueuedCommand): AcceptedWorkerCommit[] {
  if (command.kind !== "integration.start" || !Array.isArray(command.payload.acceptedCommits)) {
    return [];
  }

  return command.payload.acceptedCommits.flatMap((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return [];
    }

    const record = item as Record<string, unknown>;
    const taskId = payloadString(record, "taskId");
    const workerJobId = payloadString(record, "workerJobId");
    const branch = payloadString(record, "branch");
    const commitSha = payloadString(record, "commitSha");
    const validationReportId = payloadString(record, "validationReportId");

    return taskId && workerJobId && branch && commitSha && validationReportId
      ? [
          {
            taskId,
            workerJobId,
            branch,
            worktreePath: payloadString(record, "worktreePath"),
            commitSha,
            committedAt: command.processedAt ?? command.enqueuedAt,
            validationReportId,
            commandEvidence: payloadStringList(record, "commandEvidence")
          }
        ]
      : [];
  });
}

function taskFromRunScope(run: OrchestratorRunRecord, taskId: string, sequence: number): PmWorkerReadyTask {
  return {
    id: taskId,
    title: `Orchestrator task ${taskId}`,
    objective: `Task ${taskId} from orchestrator run ${run.id}.`,
    ownedFiles: [],
    forbiddenFiles: [],
    dependencies: [],
    acceptanceCriteria: [],
    validationCommands: [],
    rollbackPlan: "Review orchestrator ledger before rollback.",
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    priority: "normal",
    capabilityProfile: "workspace-write",
    evidenceKinds: [],
    provenance: {
      origin: "orchestrator",
      labels: ["orchestrator-created"]
    },
    templateSnapshot: {
      taskId,
      templateId: "durable-run-report",
      resolvedAt: run.updatedAt,
      templateJson: {
        runId: run.id
      }
    },
    status: "queued",
    createdAt: run.createdAt,
    sequence
  };
}

function blockerIdsFromLedger(ledger: readonly OrchestratorLedgerEntry[], runId: string): string[] {
  return [
    ...new Set(
      ledger
        .filter((entry) => entry.runId === runId)
        .flatMap((entry) => payloadStringList(entry.payload, "blockerIds"))
    )
  ];
}

function correctiveTaskIdsFromLedger(ledger: readonly OrchestratorLedgerEntry[], runId: string): string[] {
  return [
    ...new Set(
      ledger
        .filter((entry) => entry.runId === runId)
        .flatMap((entry) => {
          const correctiveTaskIds = payloadStringList(entry.payload, "correctiveTaskIds");
          const correctiveTaskCount = payloadNumber(entry.payload, "correctiveTaskCount") ?? 0;

          return correctiveTaskIds.length > 0
            ? correctiveTaskIds
            : correctiveTaskCount > 0
            ? [`${entry.id}:corrective-tasks:${correctiveTaskCount}`]
            : [];
        })
    )
  ];
}

function shouldGenerateFinalReport(run: OrchestratorRunRecord): boolean {
  return (
    run.status === "ready-for-finalization" ||
    run.status === "completed" ||
    run.status === "cancelled" ||
    run.status === "validation-failed"
  );
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

export function queueFinalMergeAfterApproval(input: {
  backendState: OrchestratorBackendState;
  runId: string;
  targetBranch: string;
  integrationValidationPassed: boolean;
  unresolvedCorrectiveTaskIds: readonly string[];
  blockerIds: readonly string[];
  targetBranchClean: boolean;
  expectedBaseMatches: boolean;
  userApprovedFinalMerge: boolean;
  remotePolicy?: RemotePolicy;
  createdAt: string;
}): FinalMergeQueueResult {
  const run = input.backendState.runs.find((item) => item.id === input.runId);
  const finalization = evaluateFinalizationGates({
    integrationValidationPassed: input.integrationValidationPassed,
    unresolvedCorrectiveTaskIds: input.unresolvedCorrectiveTaskIds,
    blockerIds: input.blockerIds,
    targetBranchClean: input.targetBranchClean,
    expectedBaseMatches: input.expectedBaseMatches,
    userApprovedFinalMerge: input.userApprovedFinalMerge
  });

  if (!run) {
    return {
      backendState: input.backendState,
      finalization,
      queued: false,
      approvalRequired: false,
      detail: "Final merge could not be queued because the run no longer exists."
    };
  }

  if (finalization.status === "ready-for-approval") {
    return {
      backendState: enqueueOrchestratorEvent(input.backendState, {
        id: `${run.id}:finalization:approval-required:${input.createdAt}`,
        runId: run.id,
        kind: "approval.requested",
        payload: {
          phase: "Final merge requires explicit approval.",
          integrationBranch: run.integrationBranch,
          targetBranch: input.targetBranch,
          missingGateIds: finalization.missingGateIds,
          finalMergeRequiresApproval: true
        },
        dedupeKey: `${run.id}:finalization:approval-required:${input.createdAt}`,
        enqueuedAt: input.createdAt
      }),
      finalization,
      queued: false,
      approvalRequired: true,
      detail: "Final merge requires explicit user approval."
    };
  }

  if (!finalization.canMergeToTarget) {
    return {
      backendState: enqueueOrchestratorEvent(input.backendState, {
        id: `${run.id}:finalization:blocked:${input.createdAt}`,
        runId: run.id,
        kind: "integration.updated",
        payload: {
          phase: "Finalization blocked.",
          runStatus: "ready-for-finalization",
          integrationBranch: run.integrationBranch,
          targetBranch: input.targetBranch,
          blockerIds: finalization.missingGateIds,
          finalMergeRequiresApproval: true
        },
        dedupeKey: `${run.id}:finalization:blocked:${input.createdAt}`,
        enqueuedAt: input.createdAt
      }),
      finalization,
      queued: false,
      approvalRequired: false,
      detail: finalization.detail
    };
  }

  const remotePolicy = input.remotePolicy ?? DEFAULT_REMOTE_POLICY;
  const approvedState = enqueueOrchestratorEvent(input.backendState, {
    id: `${run.id}:finalization:approved:${input.createdAt}`,
    runId: run.id,
    kind: "approval.requested",
    payload: {
      phase: "Final merge approved.",
      integrationBranch: run.integrationBranch,
      targetBranch: input.targetBranch,
      userApprovedFinalMerge: true,
      finalMergeRequiresApproval: true
    },
    dedupeKey: `${run.id}:finalization:approved:${input.createdAt}`,
    enqueuedAt: input.createdAt
  });

  return {
    backendState: enqueueOrchestratorCommand(approvedState, {
      id: `${run.id}:finalization:merge:${input.createdAt}`,
      runId: run.id,
      kind: "finalization.merge",
      payload: {
        integrationBranch: run.integrationBranch,
        targetBranch: input.targetBranch,
        expectedBaseBranch: run.baseBranch,
        userApprovedFinalMerge: true,
        pushMode: remotePolicy.pushMode,
        allowedRemote: remotePolicy.allowedRemote,
        requireCleanValidation: remotePolicy.requireCleanValidation,
        finalMergeRequiresApproval: true
      },
      enqueuedAt: input.createdAt
    }),
    finalization,
    queued: true,
    approvalRequired: false,
    detail: "Queued final merge into the user target branch."
  };
}

export function applyFinalizationRuntimeCommandResult(input: {
  backendState: OrchestratorBackendState;
  command: OrchestratorQueuedCommand;
  result: OrchestratorRuntimeCommandResult;
  createdAt: string;
}): FinalizationRuntimeApplyResult | undefined {
  if (input.command.kind !== "finalization.merge" && input.command.kind !== "remote.push") {
    return undefined;
  }

  if (input.command.kind === "remote.push") {
    if (input.result.blocked || !input.result.executed) {
      const failed = recordRemotePushFailure(input.backendState, {
        runId: input.command.runId,
        branch: payloadString(input.command.payload, "branch") ?? "",
        remote: payloadString(input.command.payload, "remote") ?? DEFAULT_REMOTE_POLICY.allowedRemote,
        error: input.result.detail,
        createdAt: input.createdAt
      });

      return {
        backendState: failed,
        completed: false,
        remoteQueued: false,
        failed: true,
        detail: "Remote push failed and was recorded as ledger evidence."
      };
    }

    return {
      backendState: enqueueOrchestratorEvent(input.backendState, {
        id: `${input.command.runId}:remote-push-completed:${input.createdAt}`,
        runId: input.command.runId,
        kind: "integration.updated",
        payload: {
          phase: "Remote push completed.",
          runStatus: "completed",
          branch: payloadString(input.command.payload, "branch"),
          remote: payloadString(input.command.payload, "remote"),
          pushedRef: resultString(input.result, "pushedRef") ?? payloadString(input.command.payload, "branch")
        },
        dedupeKey: `${input.command.id}:remote-push-completed`,
        enqueuedAt: input.createdAt
      }),
      completed: true,
      remoteQueued: false,
      failed: false,
      detail: "Remote push completed."
    };
  }

  const integrationBranch = payloadString(input.command.payload, "integrationBranch") ?? "";
  const targetBranch = payloadString(input.command.payload, "targetBranch") ?? "";

  if (input.result.blocked || !input.result.executed) {
    return {
      backendState: enqueueOrchestratorEvent(input.backendState, {
        id: `${input.command.runId}:finalization:merge-failed:${input.createdAt}`,
        runId: input.command.runId,
        kind: "integration.updated",
        payload: {
          phase: "Final merge failed.",
          runStatus: "validation-failed",
          integrationBranch,
          targetBranch,
          blockerIds: ["finalization-runtime"],
          detail: input.result.detail
        },
        dedupeKey: `${input.command.id}:finalization-merge-failed`,
        enqueuedAt: input.createdAt
      }),
      completed: false,
      remoteQueued: false,
      failed: true,
      detail: "Final merge runtime failed."
    };
  }

  let nextState = enqueueOrchestratorEvent(input.backendState, {
    id: `${input.command.runId}:finalization:merge-completed:${input.createdAt}`,
    runId: input.command.runId,
    kind: "integration.updated",
    payload: {
      phase: "Final merge completed.",
      runStatus: "completed",
      integrationBranch,
      targetBranch,
      mergeCommitSha: resultString(input.result, "mergeCommitSha"),
      finalMergeRequiresApproval: true
    },
    dedupeKey: `${input.command.id}:finalization-merge-completed`,
    enqueuedAt: input.createdAt
  });
  const policy = remotePolicyFromPayload(input.command.payload);
  const pushGate = evaluateRemotePushGates({
    policy,
    integrationValidationPassed: true,
    branchCommitted: true,
    remoteConfigured: Boolean(policy.allowedRemote),
    secretsDetected: false,
    projectAllowsPush: true
  });

  if (pushGate.canPush) {
    nextState = enqueueOrchestratorCommand(nextState, {
      id: `${input.command.runId}:remote-push:${input.createdAt}`,
      runId: input.command.runId,
      kind: "remote.push",
      payload: {
        remote: policy.allowedRemote,
        branch: targetBranch,
        pushMode: policy.pushMode,
        mergeCommitSha: resultString(input.result, "mergeCommitSha")
      },
      enqueuedAt: input.createdAt
    });
  } else {
    nextState = enqueueOrchestratorEvent(nextState, {
      id: `${input.command.runId}:remote-push-gated:${input.createdAt}`,
      runId: input.command.runId,
      kind: "integration.updated",
      payload: {
        phase: "Remote push gated.",
        runStatus: "completed",
        branch: targetBranch,
        remote: policy.allowedRemote,
        pushMode: policy.pushMode,
        missingGateIds: pushGate.missingGateIds,
        detail: pushGate.detail
      },
      dedupeKey: `${input.command.id}:remote-push-gated`,
      enqueuedAt: input.createdAt
    });
  }

  return {
    backendState: nextState,
    completed: true,
    remoteQueued: pushGate.canPush,
    failed: false,
    detail: pushGate.canPush
      ? "Final merge completed and automatic remote push was queued."
      : "Final merge completed; remote push remained gated by policy."
  };
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

export function generateOrchestratorRunReportFromDurableState(input: {
  backendState: OrchestratorBackendState;
  run: OrchestratorRunRecord;
  artifacts: readonly OrchestratorArtifact[];
  generatedAt: string;
}): OrchestratorRunReport {
  const runLedger = input.backendState.ledger.filter((entry) => entry.runId === input.run.id);
  const acceptedCommits = input.backendState.commandQueue.flatMap(acceptedCommitsFromCommand);
  const cleanupJobs = cleanupJobsWithLedgerUpdates(
    input.backendState.commandQueue
    .map(cleanupJobFromCommand)
      .filter((job): job is CleanupJob => Boolean(job)),
    input.backendState.ledger
  );
  const blockerIds = blockerIdsFromLedger(input.backendState.ledger, input.run.id);
  const correctiveTaskIds = correctiveTaskIdsFromLedger(input.backendState.ledger, input.run.id);
  const taskIds = [
    ...new Set([
      ...input.run.scope.taskIds,
      ...acceptedCommits.map((commit) => commit.taskId),
      ...correctiveTaskIds
    ])
  ];
  const tasks = taskIds.map((taskId, index) => taskFromRunScope(input.run, taskId, index + 1));
  const correctiveTasks = correctiveTaskIds.map((taskId, index) => taskFromRunScope(input.run, taskId, taskIds.length + index + 1));
  const finalization = evaluateFinalizationGates({
    integrationValidationPassed: input.run.status !== "validation-failed",
    unresolvedCorrectiveTaskIds: input.run.status === "ready-for-finalization" ? [] : correctiveTaskIds,
    blockerIds,
    targetBranchClean: true,
    expectedBaseMatches: true,
    userApprovedFinalMerge: false
  });

  return generateOrchestratorRunReport({
    run: input.run,
    tasks,
    acceptedCommits,
    artifacts: input.artifacts.filter((artifact) => artifact.runId === input.run.id),
    correctiveTasks,
    blockerIds,
    ledger: runLedger,
    cleanupJobs,
    cleanupSummary: summarizeCleanupQueue(cleanupJobs),
    finalization,
    generatedAt: input.generatedAt
  });
}

export function enqueueFinalRunReportIfReady(input: {
  backendState: OrchestratorBackendState;
  artifacts: readonly OrchestratorArtifact[];
  generatedAt: string;
  runId?: string;
}): FinalRunReportEventResult {
  const run = input.runId
    ? input.backendState.runs.find((item) => item.id === input.runId)
    : [...input.backendState.runs]
        .filter(shouldGenerateFinalReport)
        .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))[0];

  if (!run || !shouldGenerateFinalReport(run)) {
    return {
      backendState: input.backendState,
      queued: false,
      detail: "No run is ready for final report generation."
    };
  }

  const dedupeKey = `${run.id}:final-report:${run.status}:${run.updatedAt}`;

  if (
    input.backendState.processedEventKeys.includes(dedupeKey) ||
    input.backendState.eventQueue.some((event) => (event.dedupeKey ?? event.id) === dedupeKey)
  ) {
    return {
      backendState: input.backendState,
      queued: false,
      detail: "Final report already exists for this run state."
    };
  }

  const report = generateOrchestratorRunReportFromDurableState({
    backendState: input.backendState,
    run,
    artifacts: input.artifacts,
    generatedAt: input.generatedAt
  });

  return {
    backendState: enqueueOrchestratorEvent(input.backendState, {
      id: report.id,
      runId: run.id,
      kind: "run.phase.changed",
      payload: {
        phase: "Final run report generated.",
        runStatus: run.status,
        reportId: report.id,
        reportMarkdown: report.markdown,
        summaryJson: report.summaryJson,
        exportFormats: ["markdown"],
        recommendedNextAction: report.summaryJson.recommendedNextAction
      },
      dedupeKey,
      enqueuedAt: input.generatedAt
    }),
    report,
    queued: true,
    detail: "Queued final run report event."
  };
}
