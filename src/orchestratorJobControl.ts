import {
  enqueueOrchestratorCommand,
  enqueueOrchestratorEvent,
  type OrchestratorCommandKind,
  type OrchestratorBackendState
} from "./orchestratorBackend";
import type { WorkerJobStatus } from "./orchestratorWorkerDispatch";

export type RuntimeJobKind = "worker" | "validator" | "integration" | "cleanup";
export type CleanupEligibility = "not-eligible" | "eligible-after-review" | "requires-review";
export type RecoveryAction =
  | "restart-worker"
  | "restart-validator"
  | "create-corrective-task"
  | "block-human-review"
  | "cleanup-safe";

export interface RuntimeJobLease {
  leaseOwner?: string;
  leasedAt?: string;
  heartbeatAt?: string;
}

export interface RuntimeJobControlRecord {
  id: string;
  runId: string;
  taskId?: string;
  kind: RuntimeJobKind;
  status: WorkerJobStatus;
  lease: RuntimeJobLease;
  lastObservedEventId?: string;
  lastCheckpointId?: string;
  worktreePath?: string;
  cancellationReason?: string;
  cleanupEligibility: CleanupEligibility;
  preventNewTurns: boolean;
  preventFileMutations: boolean;
  updatedAt: string;
}

export interface RecoveryAudit {
  jobId: string;
  processAlive: boolean;
  worktreeExists: boolean;
  branchExists: boolean;
  gitStatus: "clean" | "dirty" | "missing";
  lastEventId?: string;
  checkpointId?: string;
  hasUncommittedOutput: boolean;
}

export interface RecoveryReviewResult {
  job: RuntimeJobControlRecord;
  audit: RecoveryAudit;
  action: RecoveryAction;
  detail: string;
}

function pauseCommandKind(kind: RuntimeJobKind): OrchestratorCommandKind {
  return `${kind}.pause` as OrchestratorCommandKind;
}

function cancelCommandKind(kind: RuntimeJobKind): OrchestratorCommandKind {
  return `${kind}.cancel` as OrchestratorCommandKind;
}

export function createRuntimeJobControlRecord(input: {
  id: string;
  runId: string;
  taskId?: string;
  kind: RuntimeJobKind;
  status?: WorkerJobStatus;
  worktreePath?: string;
  updatedAt: string;
}): RuntimeJobControlRecord {
  return {
    id: input.id,
    runId: input.runId,
    taskId: input.taskId,
    kind: input.kind,
    status: input.status ?? "queued",
    lease: {},
    worktreePath: input.worktreePath,
    cleanupEligibility: "not-eligible",
    preventNewTurns: false,
    preventFileMutations: false,
    updatedAt: input.updatedAt
  };
}

export function leaseRuntimeJob(
  job: RuntimeJobControlRecord,
  leaseOwner: string,
  leasedAt: string
): RuntimeJobControlRecord {
  return {
    ...job,
    status: "leased",
    lease: {
      leaseOwner,
      leasedAt,
      heartbeatAt: leasedAt
    },
    updatedAt: leasedAt
  };
}

export function heartbeatRuntimeJob(
  job: RuntimeJobControlRecord,
  heartbeatAt: string,
  lastObservedEventId?: string
): RuntimeJobControlRecord {
  return {
    ...job,
    lease: {
      ...job.lease,
      heartbeatAt
    },
    lastObservedEventId: lastObservedEventId ?? job.lastObservedEventId,
    updatedAt: heartbeatAt
  };
}

export function requestPauseRuntimeJob(
  backendState: OrchestratorBackendState,
  job: RuntimeJobControlRecord,
  requestedAt: string
): { backendState: OrchestratorBackendState; job: RuntimeJobControlRecord } {
  const nextJob: RuntimeJobControlRecord = {
    ...job,
    status: "pausing",
    preventNewTurns: true,
    updatedAt: requestedAt
  };
  return {
    backendState: enqueueOrchestratorCommand(backendState, {
      id: `${job.id}:pause:${requestedAt}`,
      runId: job.runId,
      kind: pauseCommandKind(job.kind),
      payload: {
        jobId: job.id,
        taskId: job.taskId,
        reason: "pause-requested"
      },
      enqueuedAt: requestedAt
    }),
    job: nextJob
  };
}

export function acknowledgePauseRuntimeJob(
  job: RuntimeJobControlRecord,
  acknowledgedAt: string
): RuntimeJobControlRecord {
  return {
    ...job,
    status: "paused",
    preventNewTurns: true,
    preventFileMutations: true,
    updatedAt: acknowledgedAt
  };
}

export function cancelRuntimeJob(
  backendState: OrchestratorBackendState,
  job: RuntimeJobControlRecord,
  input: {
    reason: string;
    hasChanges: boolean;
    hasEvidence: boolean;
    cancelledAt: string;
  }
): { backendState: OrchestratorBackendState; job: RuntimeJobControlRecord } {
  const requiresReview = input.hasChanges || input.hasEvidence;
  const nextJob: RuntimeJobControlRecord = {
    ...job,
    status: "cancelled",
    lease: {},
    cancellationReason: input.reason.trim() || "cancelled",
    cleanupEligibility: requiresReview ? "requires-review" : "eligible-after-review",
    preventNewTurns: true,
    preventFileMutations: true,
    updatedAt: input.cancelledAt
  };

  return {
    backendState: enqueueOrchestratorEvent(enqueueOrchestratorCommand(backendState, {
      id: `${job.id}:cancel:${input.cancelledAt}`,
      runId: job.runId,
      kind: cancelCommandKind(job.kind),
      payload: {
        jobId: job.id,
        taskId: job.taskId,
        reason: nextJob.cancellationReason,
        hasChanges: input.hasChanges,
        hasEvidence: input.hasEvidence,
        retainedForReview: requiresReview
      },
      enqueuedAt: input.cancelledAt
    }), {
      id: `${job.id}:cancelled:${input.cancelledAt}`,
      runId: job.runId,
      kind: "cleanup.updated",
      payload: {
        phase: `Job cancelled: ${nextJob.cancellationReason}.`,
        jobId: job.id,
        taskId: job.taskId,
        cleanupEligibility: nextJob.cleanupEligibility,
        retainedForReview: requiresReview
      },
      dedupeKey: `${job.id}:cancelled:${input.cancelledAt}`,
      enqueuedAt: input.cancelledAt
    }),
    job: nextJob
  };
}

export function markStaleJobsForRecovery(
  jobs: readonly RuntimeJobControlRecord[],
  liveLeaseOwners: ReadonlySet<string>,
  checkedAt: string
): RuntimeJobControlRecord[] {
  return jobs.map((job) => {
    const activeStatus = job.status === "leased" || job.status === "running" || job.status === "pausing" || job.status === "cancelling";
    const leaseOwner = job.lease.leaseOwner;

    if (!activeStatus || (leaseOwner && liveLeaseOwners.has(leaseOwner))) {
      return job;
    }

    return {
      ...job,
      status: "recovery-review",
      lease: {},
      updatedAt: checkedAt
    };
  });
}

export function reviewStaleRuntimeJob(
  job: RuntimeJobControlRecord,
  audit: RecoveryAudit,
  reviewedAt: string
): RecoveryReviewResult {
  const reviewedJob: RuntimeJobControlRecord = {
    ...job,
    status: "recovery-review",
    lastObservedEventId: audit.lastEventId ?? job.lastObservedEventId,
    lastCheckpointId: audit.checkpointId ?? job.lastCheckpointId,
    updatedAt: reviewedAt
  };

  if (!audit.worktreeExists && !audit.hasUncommittedOutput) {
    return {
      job: reviewedJob,
      audit,
      action: "cleanup-safe",
      detail: "No worktree or uncommitted output remains; cleanup can proceed."
    };
  }

  if (audit.hasUncommittedOutput || audit.gitStatus === "dirty") {
    return {
      job: reviewedJob,
      audit,
      action: "create-corrective-task",
      detail: "Uncommitted output requires corrective PM review."
    };
  }

  if (!audit.processAlive && audit.worktreeExists && audit.branchExists && audit.gitStatus === "clean") {
    if (job.kind !== "worker" && job.kind !== "validator") {
      return {
        job: reviewedJob,
        audit,
        action: "block-human-review",
        detail: "Non-worker runtime job is clean but requires explicit recovery review before restart."
      };
    }

    return {
      job: reviewedJob,
      audit,
      action: job.kind === "validator" ? "restart-validator" : "restart-worker",
      detail: "Process is gone but clean worktree and branch can be restarted by orchestrator."
    };
  }

  return {
    job: reviewedJob,
    audit,
    action: "block-human-review",
    detail: "Recovery state is ambiguous and requires human review."
  };
}
