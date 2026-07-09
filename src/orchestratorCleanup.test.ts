import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  processAllQueuedOrchestratorEvents
} from "./orchestratorBackend";
import {
  DEFAULT_CLEANUP_POLICY,
  applyCleanupRuntimeCommandResult,
  cancelCleanupJob,
  createCleanupJob,
  evaluateCleanupBlockReasons,
  markCleanupCompleted,
  markCleanupRunning,
  refreshCleanupJobStatus,
  summarizeCleanupQueue
} from "./orchestratorCleanup";
import type { OrchestratorArtifact } from "./orchestratorArtifacts";

const createdAt = "2026-07-09T09:00:00.000Z";

function backendState() {
  return createBoundedOrchestratorRun(createOrchestratorBackendState(), {
    id: "run-123",
    projectId: "steerboard",
    scope: { mode: "task-list", taskIds: ["task-1"] },
    baseBranch: "main",
    createdAt
  });
}

function artifact(id = "artifact-1"): OrchestratorArtifact {
  return {
    id,
    runId: "run-123",
    taskId: "task-1",
    kind: "validator-report",
    path: ".steerboard/artifacts/run-123/task-1/artifact-1.md",
    sha256: "a".repeat(64),
    sizeBytes: 10,
    createdAt
  };
}

describe("orchestrator cleanup queue", () => {
  it("creates visible automatic cleanup jobs with retention", () => {
    const job = createCleanupJob({
      id: "cleanup-1",
      runId: "run-123",
      taskId: "task-1",
      jobId: "worker-1",
      kind: "worker-worktree",
      path: ".steerboard/worktrees/task-1",
      reason: "Accepted work integrated.",
      createdAt
    });

    expect(job).toMatchObject({
      status: "retention-active",
      retentionExpiresAt: "2026-07-09T10:00:00.000Z",
      reason: "Accepted work integrated."
    });
    expect(DEFAULT_CLEANUP_POLICY).toMatchObject({
      mode: "automatic",
      retentionMinutes: 60,
      keepOnFailure: true,
      keepOnIntegrationFailure: true
    });
  });

  it("creates cleanup jobs for every retained orchestrator resource kind", () => {
    const jobs = [
      createCleanupJob({
        id: "cleanup-worktree",
        runId: "run-123",
        taskId: "task-1",
        jobId: "worker-1",
        kind: "worker-worktree",
        path: ".steerboard/worktrees/task-1",
        reason: "Accepted work integrated.",
        createdAt
      }),
      createCleanupJob({
        id: "cleanup-artifact",
        runId: "run-123",
        taskId: "task-1",
        jobId: "validator-1",
        kind: "validator-artifact",
        path: ".steerboard/artifacts/run-123/task-1/validator.log",
        reason: "Validator temp artifact retention.",
        createdAt
      }),
      createCleanupJob({
        id: "cleanup-runtime",
        runId: "run-123",
        kind: "runtime-state",
        path: ".steerboard/runtime/run-123",
        reason: "Transient runtime state.",
        createdAt
      }),
      createCleanupJob({
        id: "cleanup-process",
        runId: "run-123",
        jobId: "worker-stale",
        kind: "stale-process-handle",
        path: "pid-123",
        reason: "Stale process handle.",
        createdAt
      })
    ];

    expect(jobs.map((job) => job.kind)).toEqual([
      "worker-worktree",
      "validator-artifact",
      "runtime-state",
      "stale-process-handle"
    ]);
    expect(jobs.every((job) => job.status === "retention-active")).toBe(true);
    expect(jobs.every((job) => job.retentionExpiresAt === "2026-07-09T10:00:00.000Z")).toBe(true);
  });

  it("blocks cleanup on every unsafe condition", () => {
    expect(
      evaluateCleanupBlockReasons({
        taskClosed: false,
        correctiveChildrenOpen: true,
        integrationFailed: true,
        validationFailedAfterIntegration: true,
        importantUncommittedFiles: true,
        referencedAcceptedArtifactIds: new Set(["artifact-1"]),
        artifact: artifact("artifact-1"),
        runPinned: true
      })
    ).toEqual([
      "task-not-closed",
      "corrective-children-open",
      "integration-failed",
      "validation-failed-after-integration",
      "important-uncommitted-files",
      "accepted-evidence-artifact",
      "run-pinned"
    ]);
  });

  it("moves jobs from retention-active to ready only after retention and safety gates pass", () => {
    const job = createCleanupJob({
      id: "cleanup-1",
      runId: "run-123",
      kind: "runtime-state",
      path: ".steerboard/runtime/run-123",
      reason: "Transient state",
      createdAt
    });
    const safeInput = {
      taskClosed: true,
      correctiveChildrenOpen: false,
      integrationFailed: false,
      validationFailedAfterIntegration: false,
      importantUncommittedFiles: false,
      referencedAcceptedArtifactIds: new Set<string>(),
      runPinned: false
    };

    expect(refreshCleanupJobStatus(job, safeInput, "2026-07-09T09:30:00.000Z").status).toBe("retention-active");
    expect(refreshCleanupJobStatus(job, safeInput, "2026-07-09T10:01:00.000Z").status).toBe("ready");
  });

  it("marks cleanup blocked with reasons when safety gates fail", () => {
    const job = createCleanupJob({
      id: "cleanup-1",
      runId: "run-123",
      kind: "validator-artifact",
      path: ".steerboard/artifacts/run-123/task-1/artifact-1.md",
      reason: "Artifact retention",
      createdAt
    });
    const blocked = refreshCleanupJobStatus(
      job,
      {
        taskClosed: true,
        correctiveChildrenOpen: false,
        integrationFailed: false,
        validationFailedAfterIntegration: false,
        importantUncommittedFiles: false,
        referencedAcceptedArtifactIds: new Set(["artifact-1"]),
        artifact: artifact("artifact-1"),
        runPinned: false
      },
      "2026-07-09T10:01:00.000Z"
    );

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockedReasons).toEqual(["accepted-evidence-artifact"]);
  });

  it("writes cleanup completion ledger events while preserving durable metadata", () => {
    const job = refreshCleanupJobStatus(
      createCleanupJob({
        id: "cleanup-1",
        runId: "run-123",
        taskId: "task-1",
        kind: "worker-worktree",
        path: ".steerboard/worktrees/task-1",
        reason: "Integrated",
        createdAt
      }),
      {
        taskClosed: true,
        correctiveChildrenOpen: false,
        integrationFailed: false,
        validationFailedAfterIntegration: false,
        importantUncommittedFiles: false,
        referencedAcceptedArtifactIds: new Set<string>(),
        runPinned: false
      },
      "2026-07-09T10:01:00.000Z"
    );
    const completed = markCleanupCompleted(backendState(), job, {
      completedAt: "2026-07-09T10:02:00.000Z",
      deletionResult: "Removed worktree."
    });

    expect(completed.job).toMatchObject({
      status: "completed",
      deletionResult: "Removed worktree."
    });

    const processed = processAllQueuedOrchestratorEvents(completed.backendState, "2026-07-09T10:03:00.000Z");

    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "cleanup.updated",
      message: "Cleanup completed for worker-worktree."
    });
  });

  it("records running and cancelled cleanup transitions as visible ledger events", () => {
    const job = {
      ...createCleanupJob({
        id: "cleanup-1",
        runId: "run-123",
        taskId: "task-1",
        kind: "runtime-state",
        path: ".steerboard/runtime/run-123",
        reason: "Transient state",
        createdAt
      }),
      status: "scheduled" as const
    };
    const running = markCleanupRunning(backendState(), job, "2026-07-09T10:01:00.000Z");
    const cancelled = cancelCleanupJob(running.backendState, running.job, {
      cancelledAt: "2026-07-09T10:02:00.000Z",
      reason: "Run was pinned before cleanup."
    });
    const processed = processAllQueuedOrchestratorEvents(
      cancelled.backendState,
      "2026-07-09T10:03:00.000Z"
    );

    expect(job.status).toBe("scheduled");
    expect(running.job.status).toBe("running");
    expect(cancelled.job).toMatchObject({
      status: "cancelled",
      deletionResult: "Run was pinned before cleanup."
    });
    expect(processed.ledger.at(-2)).toMatchObject({
      kind: "cleanup.updated",
      message: "Cleanup running for runtime-state."
    });
    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "cleanup.updated",
      message: "Cleanup cancelled for runtime-state."
    });
  });

  it("applies successful cleanup runtime results as durable cleanup completion evidence", () => {
    const job = createCleanupJob({
      id: "cleanup-1",
      runId: "run-123",
      taskId: "task-1",
      jobId: "worker-1",
      kind: "worker-worktree",
      path: ".steerboard/worktrees/task-1",
      reason: "Integrated",
      createdAt
    });
    const applied = applyCleanupRuntimeCommandResult({
      backendState: backendState(),
      command: {
        id: "cleanup-1:start",
        runId: "run-123",
        sequence: 1,
        kind: "cleanup.start",
        payload: { ...job },
        status: "queued",
        enqueuedAt: createdAt
      },
      result: {
        commandId: "cleanup-1:start",
        runId: "run-123",
        kind: "cleanup.start",
        executed: true,
        blocked: false,
        artifactPaths: [],
        steps: [],
        detail: "Removed worktree.",
        structuredOutput: {
          deletionResult: "Removed worktree path."
        }
      },
      createdAt: "2026-07-09T10:02:00.000Z"
    });

    expect(applied?.completed).toBe(true);
    expect(applied?.job).toMatchObject({
      status: "completed",
      completedAt: "2026-07-09T10:02:00.000Z",
      deletionResult: "Removed worktree path."
    });

    const processed = processAllQueuedOrchestratorEvents(
      applied?.backendState ?? backendState(),
      "2026-07-09T10:03:00.000Z"
    );

    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "cleanup.updated",
      message: "Cleanup completed for worker-worktree.",
      payload: {
        cleanupJobId: "cleanup-1",
        cleanupStatus: "completed",
        completedAt: "2026-07-09T10:02:00.000Z",
        deletionResult: "Removed worktree path."
      }
    });
  });

  it("records blocked cleanup runtime results as visible retained failures", () => {
    const job = createCleanupJob({
      id: "cleanup-1",
      runId: "run-123",
      kind: "runtime-state",
      path: ".steerboard/runtime/run-123",
      reason: "Transient state",
      createdAt
    });
    const applied = applyCleanupRuntimeCommandResult({
      backendState: backendState(),
      command: {
        id: "cleanup-1:start",
        runId: "run-123",
        sequence: 1,
        kind: "cleanup.start",
        payload: { ...job },
        status: "queued",
        enqueuedAt: createdAt
      },
      result: {
        commandId: "cleanup-1:start",
        runId: "run-123",
        kind: "cleanup.start",
        executed: false,
        blocked: true,
        artifactPaths: [],
        steps: [],
        detail: "Path is pinned."
      },
      createdAt: "2026-07-09T10:02:00.000Z"
    });

    expect(applied?.failed).toBe(true);
    expect(applied?.job).toMatchObject({
      status: "failed",
      deletionResult: "Path is pinned."
    });
    expect(applied?.backendState.eventQueue.at(-1)).toMatchObject({
      kind: "cleanup.updated",
      payload: {
        cleanupJobId: "cleanup-1",
        cleanupStatus: "failed",
        deletionResult: "Path is pinned."
      }
    });
  });

  it("summarizes cleanup queue status for a visible UI row", () => {
    const jobs = [
      createCleanupJob({
        id: "cleanup-1",
        runId: "run-123",
        kind: "worker-worktree",
        path: ".steerboard/worktrees/task-1",
        reason: "Retention",
        createdAt
      }),
      {
        ...createCleanupJob({
          id: "cleanup-2",
          runId: "run-123",
          kind: "runtime-state",
          path: ".steerboard/runtime/run-123",
          reason: "Runtime",
          createdAt
        }),
        status: "blocked" as const,
        blockedReasons: ["run-pinned" as const]
      },
      {
        ...createCleanupJob({
          id: "cleanup-3",
          runId: "run-123",
          kind: "stale-process-handle",
          path: "pid-1",
          reason: "Stale",
          createdAt
        }),
        status: "completed" as const
      },
      {
        ...createCleanupJob({
          id: "cleanup-4",
          runId: "run-123",
          kind: "runtime-state",
          path: ".steerboard/runtime/run-456",
          reason: "Runtime",
          createdAt
        }),
        status: "scheduled" as const
      },
      {
        ...createCleanupJob({
          id: "cleanup-5",
          runId: "run-123",
          kind: "runtime-state",
          path: ".steerboard/runtime/run-789",
          reason: "Runtime",
          createdAt
        }),
        status: "running" as const
      },
      {
        ...createCleanupJob({
          id: "cleanup-6",
          runId: "run-123",
          kind: "runtime-state",
          path: ".steerboard/runtime/run-cancelled",
          reason: "Runtime",
          createdAt
        }),
        status: "cancelled" as const
      }
    ];

    expect(summarizeCleanupQueue(jobs)).toMatchObject({
      total: 6,
      scheduled: 1,
      retentionActive: 1,
      running: 1,
      blocked: 1,
      completed: 1,
      cancelled: 1,
      detail: "6 cleanup jobs; 0 ready; 1 blocked; 1 in retention."
    });
  });
});
