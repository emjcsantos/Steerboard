import {
  enqueueOrchestratorEvent,
  type OrchestratorBackendState
} from "./orchestratorBackend";
import type { OrchestratorArtifact } from "./orchestratorArtifacts";

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
        taskId: job.taskId,
        path: job.path,
        deletionResult: input.deletionResult
      },
      dedupeKey: `${job.id}:cleanup-completed:${input.completedAt}`,
      enqueuedAt: input.completedAt
    }),
    job: completedJob
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
