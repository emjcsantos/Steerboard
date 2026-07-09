import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  processAllQueuedOrchestratorEvents
} from "./orchestratorBackend";
import {
  acknowledgePauseRuntimeJob,
  cancelRuntimeJob,
  createRuntimeJobControlRecord,
  heartbeatRuntimeJob,
  leaseRuntimeJob,
  markStaleJobsForRecovery,
  requestPauseRuntimeJob,
  reviewStaleRuntimeJob
} from "./orchestratorJobControl";

const createdAt = "2026-07-09T07:00:00.000Z";

function backendState() {
  return createBoundedOrchestratorRun(createOrchestratorBackendState(), {
    id: "run-123",
    projectId: "steerboard",
    scope: { mode: "task-list", taskIds: ["task-1"] },
    baseBranch: "main",
    createdAt
  });
}

describe("orchestrator job control", () => {
  it("records lease owner, heartbeat, status, and last observed event", () => {
    const job = heartbeatRuntimeJob(
      leaseRuntimeJob(
        createRuntimeJobControlRecord({
          id: "worker-1",
          runId: "run-123",
          taskId: "task-1",
          kind: "worker",
          updatedAt: createdAt
        }),
        "pid-123",
        createdAt
      ),
      "2026-07-09T07:01:00.000Z",
      "event-1"
    );

    expect(job).toMatchObject({
      status: "leased",
      lease: {
        leaseOwner: "pid-123",
        leasedAt: createdAt,
        heartbeatAt: "2026-07-09T07:01:00.000Z"
      },
      lastObservedEventId: "event-1"
    });
  });

  it("pause requests stop new turns and acknowledged pause blocks file mutations", () => {
    const leased = leaseRuntimeJob(
      createRuntimeJobControlRecord({
        id: "worker-1",
        runId: "run-123",
        taskId: "task-1",
        kind: "worker",
        updatedAt: createdAt
      }),
      "pid-123",
      createdAt
    );
    const requested = requestPauseRuntimeJob(backendState(), leased, "2026-07-09T07:02:00.000Z");
    const paused = acknowledgePauseRuntimeJob(requested.job, "2026-07-09T07:03:00.000Z");

    expect(requested.job).toMatchObject({
      status: "pausing",
      preventNewTurns: true,
      preventFileMutations: false
    });
    expect(requested.backendState.commandQueue[0]).toMatchObject({
      kind: "worker.pause"
    });
    expect(paused).toMatchObject({
      status: "paused",
      preventNewTurns: true,
      preventFileMutations: true
    });
  });

  it("routes validator, integration, and cleanup pause controls by job kind", () => {
    const jobs = ["validator", "integration", "cleanup"] as const;
    const commandKinds = jobs.map((kind) => {
      const result = requestPauseRuntimeJob(
        backendState(),
        createRuntimeJobControlRecord({
          id: `${kind}-1`,
          runId: "run-123",
          kind,
          updatedAt: createdAt
        }),
        "2026-07-09T07:02:00.000Z"
      );

      return result.backendState.commandQueue[0].kind;
    });

    expect(commandKinds).toEqual(["validator.pause", "integration.pause", "cleanup.pause"]);
  });

  it("cancel before changes releases the lease and becomes review-eligible", () => {
    const leased = leaseRuntimeJob(
      createRuntimeJobControlRecord({
        id: "worker-1",
        runId: "run-123",
        taskId: "task-1",
        kind: "worker",
        updatedAt: createdAt
      }),
      "pid-123",
      createdAt
    );
    const cancelled = cancelRuntimeJob(backendState(), leased, {
      reason: "user changed direction",
      hasChanges: false,
      hasEvidence: false,
      cancelledAt: "2026-07-09T07:04:00.000Z"
    });

    expect(cancelled.job).toMatchObject({
      status: "cancelled",
      lease: {},
      cancellationReason: "user changed direction",
      cleanupEligibility: "eligible-after-review"
    });
    expect(cancelled.backendState.commandQueue[0]).toMatchObject({
      kind: "worker.cancel",
      payload: {
        reason: "user changed direction",
        retainedForReview: false
      }
    });
  });

  it("routes validator, integration, and cleanup cancel controls by job kind", () => {
    const jobs = ["validator", "integration", "cleanup"] as const;
    const commandKinds = jobs.map((kind) => {
      const result = cancelRuntimeJob(
        backendState(),
        createRuntimeJobControlRecord({
          id: `${kind}-1`,
          runId: "run-123",
          kind,
          updatedAt: createdAt
        }),
        {
          reason: `${kind} stop`,
          hasChanges: false,
          hasEvidence: false,
          cancelledAt: "2026-07-09T07:04:00.000Z"
        }
      );

      return result.backendState.commandQueue[0].kind;
    });

    expect(commandKinds).toEqual(["validator.cancel", "integration.cancel", "cleanup.cancel"]);
  });

  it("cancel with changes retains worktree for review and writes ledger evidence through queue", () => {
    const job = createRuntimeJobControlRecord({
      id: "worker-1",
      runId: "run-123",
      taskId: "task-1",
      kind: "worker",
      worktreePath: ".steerboard/worktrees/task-1",
      updatedAt: createdAt
    });
    const cancelled = cancelRuntimeJob(backendState(), job, {
      reason: "wrong task",
      hasChanges: true,
      hasEvidence: true,
      cancelledAt: "2026-07-09T07:04:00.000Z"
    });

    expect(cancelled.job.cleanupEligibility).toBe("requires-review");

    const processed = processAllQueuedOrchestratorEvents(cancelled.backendState, "2026-07-09T07:05:00.000Z");

    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "cleanup.updated",
      message: "Job cancelled: wrong task."
    });
  });

  it("marks active jobs without live leases as recovery review after restart", () => {
    const stale = leaseRuntimeJob(
      createRuntimeJobControlRecord({
        id: "worker-stale",
        runId: "run-123",
        kind: "worker",
        updatedAt: createdAt
      }),
      "pid-dead",
      createdAt
    );
    const alive = leaseRuntimeJob(
      createRuntimeJobControlRecord({
        id: "worker-alive",
        runId: "run-123",
        kind: "worker",
        updatedAt: createdAt
      }),
      "pid-live",
      createdAt
    );

    expect(
      markStaleJobsForRecovery([stale, alive], new Set(["pid-live"]), "2026-07-09T07:06:00.000Z")
        .map((job) => [job.id, job.status])
    ).toEqual([
      ["worker-stale", "recovery-review"],
      ["worker-alive", "leased"]
    ]);
  });

  it("reviews stale jobs into restart, corrective, cleanup, or human-review outcomes", () => {
    const base = createRuntimeJobControlRecord({
      id: "worker-1",
      runId: "run-123",
      kind: "worker",
      status: "recovery-review",
      updatedAt: createdAt
    });

    expect(
      reviewStaleRuntimeJob(
        base,
        {
          jobId: base.id,
          processAlive: false,
          worktreeExists: true,
          branchExists: true,
          gitStatus: "clean",
          hasUncommittedOutput: false
        },
        "2026-07-09T07:07:00.000Z"
      ).action
    ).toBe("restart-worker");
    expect(
      reviewStaleRuntimeJob(
        { ...base, kind: "validator" },
        {
          jobId: base.id,
          processAlive: false,
          worktreeExists: true,
          branchExists: true,
          gitStatus: "clean",
          hasUncommittedOutput: false
        },
        "2026-07-09T07:07:00.000Z"
      ).action
    ).toBe("restart-validator");
    expect(
      reviewStaleRuntimeJob(
        { ...base, kind: "integration" },
        {
          jobId: base.id,
          processAlive: false,
          worktreeExists: true,
          branchExists: true,
          gitStatus: "clean",
          hasUncommittedOutput: false
        },
        "2026-07-09T07:07:00.000Z"
      ).action
    ).toBe("block-human-review");
    expect(
      reviewStaleRuntimeJob(
        base,
        {
          jobId: base.id,
          processAlive: false,
          worktreeExists: true,
          branchExists: true,
          gitStatus: "dirty",
          hasUncommittedOutput: true
        },
        "2026-07-09T07:07:00.000Z"
      ).action
    ).toBe("create-corrective-task");
    expect(
      reviewStaleRuntimeJob(
        base,
        {
          jobId: base.id,
          processAlive: false,
          worktreeExists: false,
          branchExists: false,
          gitStatus: "missing",
          hasUncommittedOutput: false
        },
        "2026-07-09T07:07:00.000Z"
      ).action
    ).toBe("cleanup-safe");
    expect(
      reviewStaleRuntimeJob(
        base,
        {
          jobId: base.id,
          processAlive: true,
          worktreeExists: true,
          branchExists: false,
          gitStatus: "clean",
          hasUncommittedOutput: false
        },
        "2026-07-09T07:07:00.000Z"
      ).action
    ).toBe("block-human-review");
  });
});
