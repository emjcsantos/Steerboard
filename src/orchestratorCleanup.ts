import {
  enqueueOrchestratorEvent,
  type OrchestratorBackendState,
  type OrchestratorQueuedCommand
} from "./orchestratorBackend";
import type { OrchestratorArtifact } from "./orchestratorArtifacts";
import type { OrchestratorRuntimeCommandResult } from "./orchestratorRuntimeExecutor";

export type CleanupJobKind =
  | "worker-worktree"
  | "validator-artifact"
  | "runtime-state"
  | "stale-process-handle";

export type CleanupJobStatus =
  | "scheduled"
  | "retention-active"
  | "ready"
  | "running"
  | "blocked"
  | "completed"
  | "failed"
  | "cancelled";

export type CleanupBlockReason =
  | "task-not-closed"
  | "corrective-children-open"
  | "integration-failed"
  | "validation-failed-after-integration"
  | "important-uncommitted-files"
  | "accepted-evidence-artifact"
  | "run-pinned";

export interface CleanupPolicy {
  mode: "automatic";
  retentionMinutes: number;
  keepOnFailure: true;
  keepOnIntegrationFailure: true;
}

export interface CleanupJob {
  id: string;
  runId: string;
  taskId?: string;
  jobId?: string;
  kind: CleanupJobKind;
  path: string;
  reason: string;
  policyMode: CleanupPolicy["mode"];
  keepOnFailure: true;
  keepOnIntegrationFailure: true;
  status: CleanupJobStatus;
  retentionExpiresAt: string;
  blockedReasons: CleanupBlockReason[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deletionResult?: string;
}

export interface CleanupEligibilityInput {
  taskClosed: boolean;
  correctiveChildrenOpen: boolean;
  integrationFailed: boolean;
  validationFailedAfterIntegration: boolean;
  importantUncommittedFiles: boolean;
  referencedAcceptedArtifactIds: ReadonlySet<string>;
  artifact?: OrchestratorArtifact;
  runPinned: boolean;
}

export interface CleanupQueueSummary {
  total: number;
  scheduled: number;
  retentionActive: number;
  ready: number;
  running: number;
  blocked: number;
  completed: number;
  failed: number;
  cancelled: number;
  detail: string;
}

export interface CleanupRuntimeApplyResult {
  backendState: OrchestratorBackendState;
  completed: boolean;
  failed: boolean;
  job?: CleanupJob;
  detail: string;
}

export const DEFAULT_CLEANUP_POLICY: CleanupPolicy = {
  mode: "automatic",
  retentionMinutes: 60,
  keepOnFailure: true,
  keepOnIntegrationFailure: true
};

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function createCleanupJob(input: {
  id: string;
  runId: string;
  taskId?: string;
  jobId?: string;
  kind: CleanupJobKind;
  path: string;
  reason: string;
  createdAt: string;
  policy?: CleanupPolicy;
}): CleanupJob {
  const policy = input.policy ?? DEFAULT_CLEANUP_POLICY;

  return {
    id: input.id,
    runId: input.runId,
    taskId: input.taskId,
    jobId: input.jobId,
    kind: input.kind,
    path: input.path,
    reason: input.reason.trim() || "Cleanup scheduled.",
    policyMode: policy.mode,
    keepOnFailure: policy.keepOnFailure,
    keepOnIntegrationFailure: policy.keepOnIntegrationFailure,
    status: "retention-active",
    retentionExpiresAt: addMinutes(input.createdAt, policy.retentionMinutes),
    blockedReasons: [],
    createdAt: input.createdAt,
    updatedAt: input.createdAt
  };
}

export function evaluateCleanupBlockReasons(input: CleanupEligibilityInput): CleanupBlockReason[] {
  const reasons: CleanupBlockReason[] = [];

  if (!input.taskClosed) {
    reasons.push("task-not-closed");
  }

  if (input.correctiveChildrenOpen) {
    reasons.push("corrective-children-open");
  }

  if (input.integrationFailed) {
    reasons.push("integration-failed");
  }

  if (input.validationFailedAfterIntegration) {
    reasons.push("validation-failed-after-integration");
  }

  if (input.importantUncommittedFiles) {
    reasons.push("important-uncommitted-files");
  }

  if (input.artifact && input.referencedAcceptedArtifactIds.has(input.artifact.id)) {
    reasons.push("accepted-evidence-artifact");
  }

  if (input.runPinned) {
    reasons.push("run-pinned");
  }

  return reasons;
}

export function refreshCleanupJobStatus(
  job: CleanupJob,
  input: CleanupEligibilityInput,
  checkedAt: string
): CleanupJob {
  if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
    return job;
  }

  const blockedReasons = evaluateCleanupBlockReasons(input);

  if (blockedReasons.length > 0) {
    return {
      ...job,
      status: "blocked",
      blockedReasons,
      updatedAt: checkedAt
    };
  }

  if (checkedAt < job.retentionExpiresAt) {
    return {
      ...job,
      status: "retention-active",
      blockedReasons: [],
      updatedAt: checkedAt
    };
  }

  return {
    ...job,
    status: "ready",
    blockedReasons: [],
    updatedAt: checkedAt
  };
}

export function markCleanupCompleted(
  backendState: OrchestratorBackendState,
  job: CleanupJob,
  input: {
    completedAt: string;
    deletionResult: string;
  }
): { backendState: OrchestratorBackendState; job: CleanupJob } {
  const completedJob: CleanupJob = {
    ...job,
    status: "completed",
    completedAt: input.completedAt,
    deletionResult: input.deletionResult,
    updatedAt: input.completedAt
  };

  return {
    backendState: enqueueOrchestratorEvent(backendState, {
      id: `${job.id}:cleanup-completed:${input.completedAt}`,
      runId: job.runId,
      kind: "cleanup.updated",
      payload: {
        phase: `Cleanup completed for ${job.kind}.`,
        cleanupJobId: job.id,
        cleanupStatus: "completed",
        taskId: job.taskId,
        path: job.path,
        completedAt: input.completedAt,
        deletionResult: input.deletionResult
      },
      dedupeKey: `${job.id}:cleanup-completed:${input.completedAt}`,
      enqueuedAt: input.completedAt
    }),
    job: completedJob
  };
}

export function markCleanupRunning(
  backendState: OrchestratorBackendState,
  job: CleanupJob,
  startedAt: string
): { backendState: OrchestratorBackendState; job: CleanupJob } {
  const runningJob: CleanupJob = {
    ...job,
    status: "running",
    updatedAt: startedAt
  };

  return {
    backendState: enqueueOrchestratorEvent(backendState, {
      id: `${job.id}:cleanup-running:${startedAt}`,
      runId: job.runId,
      kind: "cleanup.updated",
      payload: {
        phase: `Cleanup running for ${job.kind}.`,
        cleanupJobId: job.id,
        cleanupStatus: "running",
        taskId: job.taskId,
        path: job.path,
        startedAt
      },
      dedupeKey: `${job.id}:cleanup-running:${startedAt}`,
      enqueuedAt: startedAt
    }),
    job: runningJob
  };
}

export function cancelCleanupJob(
  backendState: OrchestratorBackendState,
  job: CleanupJob,
  input: {
    cancelledAt: string;
    reason: string;
  }
): { backendState: OrchestratorBackendState; job: CleanupJob } {
  const cancelledJob: CleanupJob = {
    ...job,
    status: "cancelled",
    deletionResult: input.reason.trim() || "Cleanup cancelled.",
    updatedAt: input.cancelledAt
  };

  return {
    backendState: enqueueOrchestratorEvent(backendState, {
      id: `${job.id}:cleanup-cancelled:${input.cancelledAt}`,
      runId: job.runId,
      kind: "cleanup.updated",
      payload: {
        phase: `Cleanup cancelled for ${job.kind}.`,
        cleanupJobId: job.id,
        cleanupStatus: "cancelled",
        taskId: job.taskId,
        path: job.path,
        cancelledAt: input.cancelledAt,
        deletionResult: cancelledJob.deletionResult
      },
      dedupeKey: `${job.id}:cleanup-cancelled:${input.cancelledAt}`,
      enqueuedAt: input.cancelledAt
    }),
    job: cancelledJob
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

function cleanupJobKind(value: string | undefined): CleanupJobKind | undefined {
  return value === "worker-worktree" ||
    value === "validator-artifact" ||
    value === "runtime-state" ||
    value === "stale-process-handle"
    ? value
    : undefined;
}

function cleanupJobStatus(value: string | undefined): CleanupJobStatus | undefined {
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

function cleanupJobFromCommand(command: OrchestratorQueuedCommand): CleanupJob | undefined {
  if (command.kind !== "cleanup.start") {
    return undefined;
  }

  const id = payloadString(command.payload, "id");
  const path = payloadString(command.payload, "path");
  const kind = cleanupJobKind(payloadString(command.payload, "kind"));
  const status = cleanupJobStatus(payloadString(command.payload, "status"));
  const retentionExpiresAt = payloadString(command.payload, "retentionExpiresAt");
  const reason = payloadString(command.payload, "reason");
  const createdAt = payloadString(command.payload, "createdAt");
  const updatedAt = payloadString(command.payload, "updatedAt");

  if (!id || !path || !kind || !status || !retentionExpiresAt || !reason || !createdAt || !updatedAt) {
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
    policyMode: "automatic",
    keepOnFailure: true,
    keepOnIntegrationFailure: true,
    status,
    retentionExpiresAt,
    blockedReasons: payloadStringList(command.payload, "blockedReasons") as CleanupBlockReason[],
    createdAt,
    updatedAt,
    completedAt: payloadString(command.payload, "completedAt"),
    deletionResult: payloadString(command.payload, "deletionResult")
  };
}

export function applyCleanupRuntimeCommandResult(input: {
  backendState: OrchestratorBackendState;
  command: OrchestratorQueuedCommand;
  result: OrchestratorRuntimeCommandResult;
  createdAt: string;
}): CleanupRuntimeApplyResult | undefined {
  const job = cleanupJobFromCommand(input.command);

  if (!job) {
    return input.command.kind === "cleanup.start"
      ? {
          backendState: input.backendState,
          completed: false,
          failed: true,
          detail: "Cleanup command was missing durable cleanup job metadata."
        }
      : undefined;
  }

  if (input.result.blocked || !input.result.executed) {
    const failedJob: CleanupJob = {
      ...job,
      status: "failed",
      blockedReasons: ["important-uncommitted-files"],
      updatedAt: input.createdAt,
      deletionResult: input.result.detail
    };

    return {
      backendState: enqueueOrchestratorEvent(input.backendState, {
        id: `${job.id}:cleanup-failed:${input.createdAt}`,
        runId: job.runId,
        kind: "cleanup.updated",
        payload: {
          phase: `Cleanup failed for ${job.kind}.`,
          cleanupJobId: job.id,
          cleanupStatus: "failed",
          taskId: job.taskId,
          path: job.path,
          blockedReasons: failedJob.blockedReasons,
          deletionResult: input.result.detail
        },
        dedupeKey: `${job.id}:cleanup-failed:${input.createdAt}`,
        enqueuedAt: input.createdAt
      }),
      completed: false,
      failed: true,
      job: failedJob,
      detail: "Cleanup runtime failed; cleanup was retained for review."
    };
  }

  const completed = markCleanupCompleted(input.backendState, job, {
    completedAt: input.createdAt,
    deletionResult: resultString(input.result, "deletionResult") ?? input.result.detail
  });

  return {
    backendState: completed.backendState,
    completed: true,
    failed: false,
    job: completed.job,
    detail: "Cleanup runtime completed and durable cleanup evidence was queued."
  };
}

export function summarizeCleanupQueue(jobs: readonly CleanupJob[]): CleanupQueueSummary {
  const summary = jobs.reduce(
    (acc, job) => ({
      ...acc,
      total: acc.total + 1,
      scheduled: acc.scheduled + (job.status === "scheduled" ? 1 : 0),
      retentionActive: acc.retentionActive + (job.status === "retention-active" ? 1 : 0),
      ready: acc.ready + (job.status === "ready" ? 1 : 0),
      running: acc.running + (job.status === "running" ? 1 : 0),
      blocked: acc.blocked + (job.status === "blocked" ? 1 : 0),
      completed: acc.completed + (job.status === "completed" ? 1 : 0),
      failed: acc.failed + (job.status === "failed" ? 1 : 0),
      cancelled: acc.cancelled + (job.status === "cancelled" ? 1 : 0)
    }),
    {
      total: 0,
      scheduled: 0,
      retentionActive: 0,
      ready: 0,
      running: 0,
      blocked: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    }
  );

  return {
    ...summary,
    detail:
      `${summary.total} cleanup job${summary.total === 1 ? "" : "s"}; ` +
      `${summary.ready} ready; ${summary.blocked} blocked; ` +
      `${summary.retentionActive} in retention.`
  };
}
