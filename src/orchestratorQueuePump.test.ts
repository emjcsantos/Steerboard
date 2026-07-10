import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  enqueueOrchestratorCommand,
  enqueueOrchestratorEvent
} from "./orchestratorBackend";
import { runOrchestratorQueuePumpCycle } from "./orchestratorQueuePump";
import { createCleanupJob } from "./orchestratorCleanup";
import { OrchestratorRunController } from "./orchestratorRunController";
import type { OrchestratorRuntimeCommandRequest } from "./orchestratorRuntimeExecutor";
import {
  buildOrchestratorSqliteSnapshot,
  type OrchestratorSqliteApplyResult,
  type OrchestratorSqliteSnapshot
} from "./orchestratorSqliteStore";

const createdAt = "2026-07-09T14:00:00.000Z";
const processedAt = "2026-07-09T14:01:00.000Z";

function applyResult(snapshot: OrchestratorSqliteSnapshot): OrchestratorSqliteApplyResult {
  return {
    databasePath: ".steerboard/orchestrator.sqlite",
    runsWritten: snapshot.runs.length,
    queueRowsWritten: snapshot.events.length + snapshot.commands.length,
    ledgerRowsWritten: snapshot.ledger.length,
    artifactsWritten: snapshot.artifacts.length,
    detail: "Applied"
  };
}

function stateWithRun() {
  return createBoundedOrchestratorRun(createOrchestratorBackendState(), {
    id: "run-123",
    projectId: "steerboard",
    scope: { mode: "task-list", taskIds: ["task-1"] },
    baseBranch: "main",
    createdAt
  });
}

describe("orchestrator queue pump", () => {
  it("restores durable state, drains one runtime command, processes its event, and persists the snapshot", async () => {
    const state = enqueueOrchestratorCommand(stateWithRun(), {
      id: "run-123:worker:task-1:start",
      runId: "run-123",
      kind: "worker.start",
      payload: {
        jobId: "run-123:worker:task-1",
        taskId: "task-1",
        branch: "codex/orch/task-1",
        worktreePath: "C:\\repo\\.steerboard\\worktrees\\task-1"
      },
      enqueuedAt: createdAt
    });
    let persisted: OrchestratorSqliteSnapshot | undefined;
    const result = await runOrchestratorQueuePumpCycle({
      repositoryRoot: "C:\\repo",
      processedAt,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(state),
      applySnapshot: async (snapshot) => {
        persisted = snapshot;
        return applyResult(snapshot);
      },
      execute: async (request) => ({
        commandId: request.commandId,
        runId: request.runId,
        kind: request.kind,
        executed: true,
        blocked: false,
        artifactPaths: ["C:\\repo\\.steerboard\\orchestrator-artifacts\\run-123\\worker.jsonl"],
        steps: [
          {
            label: "Launch Codex worker",
            command: "codex exec --json -m gpt-5.3-spark",
            status: "passed",
            detail: "Worker completed."
          }
        ],
        detail: "Worker completed."
      })
    });

    expect(result).toMatchObject({
      commandDrained: true,
      eventsProcessed: 1,
      snapshotApplied: true
    });
    expect(result.backendState.commandQueue[0]).toMatchObject({
      status: "processed",
      processedAt
    });
    expect(result.backendState.ledger.at(-1)).toMatchObject({
      kind: "worker.progress",
      message: "Runtime command completed: worker.start."
    });
    expect(persisted?.commands[0]).toMatchObject({
      status: "processed",
      processed_at: processedAt
    });
    expect(persisted?.ledger.at(-1)).toMatchObject({
      kind: "worker.progress"
    });
  });

  it("processes queued events even when no runtime command is queued", async () => {
    const state = enqueueOrchestratorEvent(stateWithRun(), {
      id: "event-1",
      runId: "run-123",
      kind: "validator.reported",
      payload: {
        phase: "Validator passed.",
        verdict: "pass",
        nextAction: "accept"
      },
      enqueuedAt: createdAt
    });
    let persisted = false;
    const result = await runOrchestratorQueuePumpCycle({
      repositoryRoot: "C:\\repo",
      processedAt,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(state),
      applySnapshot: async (snapshot) => {
        persisted = true;
        return applyResult(snapshot);
      }
    });

    expect(result.commandDrained).toBe(false);
    expect(result.eventsProcessed).toBe(1);
    expect(result.snapshotApplied).toBe(true);
    expect(persisted).toBe(true);
    expect(result.backendState.runs[0].phase).toBe("Validator passed.");
  });

  it("applies a structured validator pass while draining validator.start", async () => {
    const state = enqueueOrchestratorCommand(stateWithRun(), {
      id: "run-123:worker:task-1:validator:1:start",
      runId: "run-123",
      kind: "validator.start",
      payload: {
        jobId: "run-123:worker:task-1:validator:1",
        workerJobId: "run-123:worker:task-1",
        taskId: "task-1",
        branch: "codex/orch/task-1",
        worktreePath: "C:\\repo\\.steerboard\\worktrees\\task-1",
        capabilityProfile: "read-only",
        attempt: 1,
        ownedFiles: ["src/task-1.ts"],
        acceptanceCriteria: ["Task passes."],
        validationCommands: ["npm.cmd run test -- src/task-1.test.ts"]
      },
      enqueuedAt: createdAt
    });
    const result = await runOrchestratorQueuePumpCycle({
      repositoryRoot: "C:\\repo",
      processedAt,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(state),
      applySnapshot: async (snapshot) => applyResult(snapshot),
      execute: async (request) => ({
        commandId: request.commandId,
        runId: request.runId,
        kind: request.kind,
        executed: true,
        blocked: false,
        artifactPaths: ["C:\\repo\\.steerboard\\orchestrator-artifacts\\run-123\\validator.jsonl"],
        steps: [
          {
            label: "Launch read-only validator",
            command: "codex exec --json -m gpt-5.3-spark -s read-only",
            status: "passed",
            detail: "Validator completed."
          }
        ],
        detail: "Read-only validator execution completed.",
        structuredOutput: {
          verdict: "pass",
          nextAction: "accept",
          findings: [],
          acceptanceResults: [
            {
              criterion: "Task passes.",
              status: "pass",
              evidence: ["validator"]
            }
          ]
        }
      })
    });

    expect(result.detail).toBe("Drained one validator command, applied the validator loop decision, and persisted the ledger state.");
    expect(result.backendState.commandQueue[0]).toMatchObject({
      status: "processed"
    });
    expect(result.backendState.commandQueue.at(-1)).toMatchObject({
      kind: "worker.commit",
      status: "queued",
      payload: {
        taskId: "task-1",
        workerJobId: "run-123:worker:task-1",
        branch: "codex/orch/task-1",
        worktreePath: "C:\\repo\\.steerboard\\worktrees\\task-1"
      }
    });
    expect(result.backendState.ledger.at(-1)).toMatchObject({
      kind: "validator.reported",
      message: "Validator verdict: pass."
    });
  });

  it("queues a worker retry from structured validator revision output", async () => {
    const state = enqueueOrchestratorCommand(stateWithRun(), {
      id: "run-123:worker:task-1:validator:1:start",
      runId: "run-123",
      kind: "validator.start",
      payload: {
        jobId: "run-123:worker:task-1:validator:1",
        workerJobId: "run-123:worker:task-1",
        taskId: "task-1",
        worktreePath: "C:\\repo\\.steerboard\\worktrees\\task-1",
        capabilityProfile: "read-only",
        attempt: 1,
        ownedFiles: ["src/task-1.ts"],
        acceptanceCriteria: ["Task passes."],
        validationCommands: ["npm.cmd run test -- src/task-1.test.ts"]
      },
      enqueuedAt: createdAt
    });
    const result = await runOrchestratorQueuePumpCycle({
      repositoryRoot: "C:\\repo",
      processedAt,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(state),
      applySnapshot: async (snapshot) => applyResult(snapshot),
      execute: async (request) => ({
        commandId: request.commandId,
        runId: request.runId,
        kind: request.kind,
        executed: true,
        blocked: false,
        artifactPaths: [],
        steps: [
          {
            label: "Launch read-only validator",
            command: "codex exec --json -m gpt-5.3-spark -s read-only",
            status: "passed",
            detail: "Validator completed."
          }
        ],
        detail: "Read-only validator execution completed.",
        structuredOutput: {
          verdict: "revision-required",
          nextAction: "return-to-worker",
          findings: [
            {
              id: "missing-case",
              severity: "error",
              message: "Add one missing case.",
              files: ["src/task-1.test.ts"],
              sharedSurface: false,
              evidence: ["validator"]
            }
          ]
        }
      })
    });

    expect(result.backendState.commandQueue.at(-1)).toMatchObject({
      kind: "worker.start",
      payload: {
        attempt: 2,
        defectCount: 1
      }
    });
    expect(result.backendState.ledger.at(-1)).toMatchObject({
      kind: "validator.reported",
      message: "Validator verdict: revision-required."
    });
  });

  it("queues automatic integration after a successful worker commit runtime result", async () => {
    const state = enqueueOrchestratorCommand(stateWithRun(), {
      id: "run-123:worker:task-1:commit",
      runId: "run-123",
      kind: "worker.commit",
      payload: {
        taskId: "task-1",
        workerJobId: "run-123:worker:task-1",
        branch: "codex/orch/task-1",
        worktreePath: "C:\\repo\\.steerboard\\worktrees\\task-1",
        commitSha: "fallback123",
        validationReportId: "report-1",
        commandEvidence: ["npm.cmd run test -- src/task-1.test.ts"]
      },
      enqueuedAt: createdAt
    });
    let persisted: OrchestratorSqliteSnapshot | undefined;
    const result = await runOrchestratorQueuePumpCycle({
      repositoryRoot: "C:\\repo",
      processedAt,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(state),
      applySnapshot: async (snapshot) => {
        persisted = snapshot;
        return applyResult(snapshot);
      },
      execute: async (request) => ({
        commandId: request.commandId,
        runId: request.runId,
        kind: request.kind,
        executed: true,
        blocked: false,
        artifactPaths: [],
        steps: [
          {
            label: "Commit accepted worker output",
            command: "git commit -m <message>",
            status: "passed",
            detail: "Committed abc123."
          }
        ],
        detail: "Accepted worker output committed.",
        structuredOutput: {
          commitSha: "abc123",
          branch: "codex/orch/task-1"
        }
      })
    });

    expect(result.detail).toBe("Drained one worker commit, queued automatic integration, and persisted the ledger state.");
    expect(result.backendState.commandQueue[0]).toMatchObject({
      kind: "worker.commit",
      status: "processed"
    });
    expect(result.backendState.commandQueue.at(-1)).toMatchObject({
      kind: "integration.start",
      status: "queued",
      payload: {
        integrationBranch: "codex/orch/integration/run-123",
        commitShas: ["abc123"],
        finalMergeRequiresApproval: true
      }
    });
    expect(persisted?.commands.at(-1)).toMatchObject({
      kind: "integration.start",
      status: "queued"
    });
  });

  it("marks the run ready for finalization after a successful integration runtime result", async () => {
    const state = enqueueOrchestratorCommand(stateWithRun(), {
      id: "run-123:integration:start",
      runId: "run-123",
      kind: "integration.start",
      payload: {
        integrationBranch: "codex/orch/integration/run-123",
        baseBranch: "main",
        commitShas: ["abc123"],
        acceptedCommits: [
          {
            taskId: "task-1",
            workerJobId: "run-123:worker:task-1",
            branch: "codex/orch/task-1",
            worktreePath: "C:\\repo\\.steerboard\\worktrees\\task-1",
            commitSha: "abc123",
            validationReportId: "report-1"
          }
        ],
        validationScope: "targeted",
        finalMergeRequiresApproval: true
      },
      enqueuedAt: createdAt
    });
    let persisted: OrchestratorSqliteSnapshot | undefined;
    const result = await runOrchestratorQueuePumpCycle({
      repositoryRoot: "C:\\repo",
      processedAt,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(state),
      applySnapshot: async (snapshot) => {
        persisted = snapshot;
        return applyResult(snapshot);
      },
      execute: async (request) => ({
        commandId: request.commandId,
        runId: request.runId,
        kind: request.kind,
        executed: true,
        blocked: false,
        artifactPaths: ["C:\\repo\\.steerboard\\orchestrator-artifacts\\run-123\\integration.json"],
        steps: [
          {
            label: "Cherry-pick accepted commits",
            command: "git cherry-pick abc123",
            status: "passed",
            detail: "Integration branch contains abc123."
          }
        ],
        detail: "Integration branch validated.",
        structuredOutput: {
          integrationBranch: "codex/orch/integration/run-123",
          commitShas: ["abc123"]
        }
      })
    });

    expect(result.detail).toBe(
      "Drained one integration command, marked the run ready for finalization, queued cleanup, and persisted the ledger state."
    );
    expect(result.backendState.runs[0]).toMatchObject({
      status: "ready-for-finalization",
      phase: "Final run report generated."
    });
    expect(result.backendState.commandQueue[0]).toMatchObject({
      kind: "integration.start",
      status: "processed"
    });
    expect(result.backendState.commandQueue.at(-1)).toMatchObject({
      kind: "cleanup.start",
      status: "queued",
      payload: {
        kind: "worker-worktree",
        path: "C:\\repo\\.steerboard\\worktrees\\task-1",
        status: "retention-active"
      }
    });
    expect(persisted?.runs[0]).toMatchObject({
      status: "ready-for-finalization",
      phase: "Final run report generated."
    });
    expect(persisted?.commands.at(-1)).toMatchObject({
      kind: "cleanup.start",
      status: "queued"
    });
    expect(persisted?.ledger.at(-1)).toMatchObject({
      kind: "run.phase.changed",
      message: "Final run report generated."
    });
    expect(persisted?.ledger.at(-1)?.payload_json).toContain("# Orchestrator Run Report: run-123");
  });

  it("records cleanup completion after a successful cleanup runtime result", async () => {
    const cleanupJob = createCleanupJob({
      id: "run-123:cleanup:task-1:1",
      runId: "run-123",
      taskId: "task-1",
      jobId: "run-123:worker:task-1",
      kind: "worker-worktree",
      path: "C:\\repo\\.steerboard\\worktrees\\task-1",
      reason: "Accepted worker output integrated.",
      createdAt
    });
    const state = enqueueOrchestratorCommand(stateWithRun(), {
      id: "run-123:cleanup:task-1:1:start",
      runId: "run-123",
      kind: "cleanup.start",
      payload: {
        ...cleanupJob,
        policyMode: "automatic",
        keepOnFailure: true
      },
      enqueuedAt: createdAt
    });
    let persisted: OrchestratorSqliteSnapshot | undefined;
    const result = await runOrchestratorQueuePumpCycle({
      repositoryRoot: "C:\\repo",
      processedAt,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(state),
      applySnapshot: async (snapshot) => {
        persisted = snapshot;
        return applyResult(snapshot);
      },
      execute: async (request) => ({
        commandId: request.commandId,
        runId: request.runId,
        kind: request.kind,
        executed: true,
        blocked: false,
        artifactPaths: [],
        steps: [
          {
            label: "Remove cleanup target",
            command: "Remove-Item -LiteralPath <path> -Recurse",
            status: "passed",
            detail: "Removed worktree."
          }
        ],
        detail: "Removed worktree.",
        structuredOutput: {
          deletionResult: "Removed worktree path."
        }
      })
    });

    expect(result.detail).toBe("Drained one cleanup command, recorded cleanup completion, and persisted the ledger state.");
    expect(result.backendState.commandQueue[0]).toMatchObject({
      kind: "cleanup.start",
      status: "processed"
    });
    expect(result.backendState.ledger.at(-1)).toMatchObject({
      kind: "cleanup.updated",
      message: "Cleanup completed for worker-worktree."
    });
    expect(persisted?.ledger.at(-1)).toMatchObject({
      kind: "cleanup.updated"
    });
    expect(persisted?.ledger.at(-1)?.payload_json).toContain("\"cleanupStatus\":\"completed\"");
  });

  it("records final merge completion and manual remote push gating", async () => {
    const state = enqueueOrchestratorCommand(stateWithRun(), {
      id: "run-123:finalization:merge",
      runId: "run-123",
      kind: "finalization.merge",
      payload: {
        integrationBranch: "codex/orch/integration/run-123",
        targetBranch: "codex/steerboard-orchestrator-backend",
        expectedBaseBranch: "main",
        userApprovedFinalMerge: true,
        pushMode: "manual",
        allowedRemote: "origin",
        finalMergeRequiresApproval: true
      },
      enqueuedAt: createdAt
    });
    let persisted: OrchestratorSqliteSnapshot | undefined;
    const result = await runOrchestratorQueuePumpCycle({
      repositoryRoot: "C:\\repo",
      processedAt,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(state),
      applySnapshot: async (snapshot) => {
        persisted = snapshot;
        return applyResult(snapshot);
      },
      execute: async (request) => ({
        commandId: request.commandId,
        runId: request.runId,
        kind: request.kind,
        executed: true,
        blocked: false,
        artifactPaths: [],
        steps: [
          {
            label: "Merge integration branch",
            command: "git merge --no-ff <integration-branch>",
            status: "passed",
            detail: "Merged integration branch."
          }
        ],
        detail: "Final merge completed.",
        structuredOutput: {
          mergeCommitSha: "merge123"
        }
      })
    });

    expect(result.detail).toBe("Drained one finalization command, recorded finalization progress, and persisted the ledger state.");
    expect(result.backendState.runs[0]).toMatchObject({
      status: "completed",
      phase: "Final run report generated."
    });
    expect(result.backendState.commandQueue[0]).toMatchObject({
      kind: "finalization.merge",
      status: "processed"
    });
    expect(persisted?.ledger.some((entry) => entry.message === "Final merge completed.")).toBe(true);
    expect(persisted?.ledger.some((entry) => entry.message === "Remote push gated.")).toBe(true);
    expect(persisted?.ledger.at(-1)).toMatchObject({
      kind: "run.phase.changed",
      message: "Final run report generated."
    });
  });

  it("does not rewrite SQLite when no durable queue work exists", async () => {
    const result = await runOrchestratorQueuePumpCycle({
      repositoryRoot: "C:\\repo",
      processedAt,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(stateWithRun()),
      applySnapshot: async () => {
        throw new Error("should-not-write");
      }
    });

    expect(result).toMatchObject({
      commandDrained: false,
      eventsProcessed: 0,
      snapshotApplied: false,
      detail: "No queued orchestrator command or event was available."
    });
  });

  it("keeps continuous runtime execution behind readiness and permission gates", async () => {
    const state = enqueueOrchestratorCommand(stateWithRun(), {
      id: "command-gated",
      runId: "run-123",
      kind: "worker.start",
      payload: { jobId: "job-1", taskId: "task-1" },
      enqueuedAt: createdAt
    });
    const result = await runOrchestratorQueuePumpCycle({
      repositoryRoot: "C:\\repo-gated",
      processedAt,
      controller: new OrchestratorRunController(),
      executionPolicy: {
        mode: "continuous",
        readinessApproved: true,
        permissionApproved: false
      },
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(state),
      applySnapshot: async () => {
        throw new Error("should-not-write");
      },
      execute: async () => {
        throw new Error("should-not-execute");
      }
    });

    expect(result).toMatchObject({
      commandDrained: false,
      snapshotApplied: false,
      detail: "Continuous execution remains gated by readiness and permission approval."
    });
    expect(result.backendState.commandQueue[0].status).toBe("queued");
  });

  it("prevents simultaneous queue pumps from executing the same command twice", async () => {
    const state = enqueueOrchestratorCommand(stateWithRun(), {
      id: "command-once",
      runId: "run-123",
      kind: "worker.start",
      payload: { jobId: "job-1", taskId: "task-1" },
      enqueuedAt: createdAt
    });
    const controller = new OrchestratorRunController();
    let releaseExecution: (() => void) | undefined;
    const executionStarted = new Promise<void>((resolve) => {
      releaseExecution = resolve;
    });
    let executeCount = 0;
    const input = {
      repositoryRoot: "C:\\repo-concurrent",
      processedAt,
      controller,
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(state),
      applySnapshot: async (snapshot: OrchestratorSqliteSnapshot) => applyResult(snapshot),
      execute: async (request: OrchestratorRuntimeCommandRequest) => {
        executeCount += 1;
        await executionStarted;
        return {
          commandId: request.commandId,
          runId: request.runId,
          kind: request.kind,
          executed: true,
          blocked: false,
          artifactPaths: [],
          steps: [],
          detail: "Executed once."
        };
      }
    };
    const first = runOrchestratorQueuePumpCycle(input);
    await Promise.resolve();
    const concurrent = await runOrchestratorQueuePumpCycle(input);
    releaseExecution?.();
    await first;

    expect(concurrent.detail).toBe("An orchestrator queue pump is already running for this repository.");
    expect(executeCount).toBe(1);
  });

  it("drains takeover completion into the normal commit path without validator re-entry", async () => {
    const state = enqueueOrchestratorCommand(stateWithRun(), {
      id: "takeover:start",
      runId: "run-123",
      kind: "orchestrator.takeover",
      payload: {
        jobId: "takeover",
        jobKind: "orchestrator-takeover",
        taskId: "task-1",
        branch: "codex/orch/task-1",
        worktreePath: ".steerboard/worktrees/task-1",
        takeoverForReportId: "report-3"
      },
      enqueuedAt: createdAt
    });
    const result = await runOrchestratorQueuePumpCycle({
      repositoryRoot: "C:\\repo-takeover",
      processedAt,
      controller: new OrchestratorRunController(),
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(state),
      applySnapshot: async (snapshot) => applyResult(snapshot),
      execute: async (request) => ({
        commandId: request.commandId,
        runId: request.runId,
        kind: request.kind,
        executed: true,
        blocked: false,
        artifactPaths: ["takeover.jsonl"],
        steps: [],
        detail: "Takeover completed."
      })
    });

    expect(result.detail).toBe("Drained one orchestrator takeover, queued its accepted commit for normal integration, and persisted the ledger state.");
    expect(result.backendState.commandQueue.at(-1)).toMatchObject({
      kind: "worker.commit",
      payload: { workerJobId: "takeover", takeoverCompleted: true }
    });
    expect(result.backendState.commandQueue.some((command) => command.kind === "validator.start")).toBe(false);
    expect(result.backendState.ledger.some((entry) => entry.message === "Orchestrator takeover completed.")).toBe(true);
  });

  it("persists takeover failure without commit, integration, or validator commands", async () => {
    const state = enqueueOrchestratorCommand(stateWithRun(), {
      id: "takeover-failed:start",
      runId: "run-123",
      kind: "orchestrator.takeover",
      payload: { jobId: "takeover-failed", jobKind: "orchestrator-takeover", taskId: "task-1" },
      enqueuedAt: createdAt
    });
    const result = await runOrchestratorQueuePumpCycle({
      repositoryRoot: "C:\\repo-takeover-failed",
      processedAt,
      controller: new OrchestratorRunController(),
      readSnapshot: async () => buildOrchestratorSqliteSnapshot(state),
      applySnapshot: async (snapshot) => applyResult(snapshot),
      execute: async (request) => ({
        commandId: request.commandId,
        runId: request.runId,
        kind: request.kind,
        executed: false,
        blocked: true,
        artifactPaths: [],
        steps: [],
        detail: "Takeover blocked."
      })
    });

    expect(result.detail).toBe("Drained one orchestrator takeover, recorded takeover failure, and persisted the ledger state.");
    expect(result.backendState.commandQueue).toHaveLength(1);
    expect(result.backendState.ledger.some((entry) => entry.message === "Orchestrator takeover failed.")).toBe(true);
  });
});
