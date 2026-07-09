import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  processAllQueuedOrchestratorEvents,
  type OrchestratorQueuedCommand
} from "./orchestratorBackend";
import {
  buildRuntimeCommandRequest,
  drainNextOrchestratorRuntimeCommand
} from "./orchestratorRuntimeExecutor";

function command(overrides: Partial<OrchestratorQueuedCommand> = {}): OrchestratorQueuedCommand {
  return {
    id: "run-123:worker:task-1:start",
    runId: "run-123",
    sequence: 1,
    kind: "worker.start",
    payload: {
      jobId: "run-123:worker:task-1",
      taskId: "task-1",
      branch: "codex/orch/task-1",
      worktreePath: "C:\\Users\\MJ\\Projects\\ProjectAtlas\\Steerboard\\.steerboard\\worktrees\\task-1",
      attempt: 1,
      ownedFiles: ["src/task-1.ts"],
      acceptanceCriteria: ["Task is complete."],
      validationCommands: ["npm.cmd run test -- src/task-1.test.ts"]
    },
    status: "queued",
    enqueuedAt: "2026-07-09T07:00:00.000Z",
    ...overrides
  };
}

describe("orchestrator runtime executor", () => {
  it("builds a Tauri runtime request from a queued worker command", () => {
    expect(
      buildRuntimeCommandRequest(command(), "C:\\Users\\MJ\\Projects\\ProjectAtlas\\Steerboard")
    ).toEqual({
      commandId: "run-123:worker:task-1:start",
      runId: "run-123",
      kind: "worker.start",
      repositoryRoot: "C:\\Users\\MJ\\Projects\\ProjectAtlas\\Steerboard",
      payload: {
        jobId: "run-123:worker:task-1",
        taskId: "task-1",
        branch: "codex/orch/task-1",
        worktreePath: "C:\\Users\\MJ\\Projects\\ProjectAtlas\\Steerboard\\.steerboard\\worktrees\\task-1",
        attempt: 1,
        ownedFiles: ["src/task-1.ts"],
        acceptanceCriteria: ["Task is complete."],
        validationCommands: ["npm.cmd run test -- src/task-1.test.ts"]
      }
    });
  });

  it("keeps integration commands executable through the same single-writer boundary", () => {
    const request = buildRuntimeCommandRequest(
      command({
        id: "run-123:integration:start",
        kind: "integration.start",
        payload: {
          integrationBranch: "codex/orch/integration/run-123",
          baseBranch: "main",
          commitShas: ["abc123"],
          validationScope: "targeted"
        }
      }),
      "repo"
    );

    expect(request.kind).toBe("integration.start");
    expect(request.payload).toMatchObject({
      integrationBranch: "codex/orch/integration/run-123",
      baseBranch: "main",
      commitShas: ["abc123"]
    });
  });

  it("keeps finalization and remote push commands executable only through the runtime boundary", () => {
    const finalization = buildRuntimeCommandRequest(
      command({
        id: "run-123:finalization:merge",
        kind: "finalization.merge",
        payload: {
          integrationBranch: "codex/orch/integration/run-123",
          targetBranch: "codex/steerboard-orchestrator-backend",
          userApprovedFinalMerge: true,
          pushMode: "manual"
        }
      }),
      "repo"
    );
    const remotePush = buildRuntimeCommandRequest(
      command({
        id: "run-123:remote-push",
        kind: "remote.push",
        payload: {
          remote: "origin",
          branch: "codex/steerboard-orchestrator-backend",
          pushMode: "automatic"
        }
      }),
      "repo"
    );

    expect(finalization.kind).toBe("finalization.merge");
    expect(finalization.payload).toMatchObject({
      userApprovedFinalMerge: true,
      pushMode: "manual"
    });
    expect(remotePush.kind).toBe("remote.push");
    expect(remotePush.payload).toMatchObject({
      remote: "origin",
      pushMode: "automatic"
    });
  });

  it("keeps validator commands executable through the read-only runtime boundary", () => {
    const request = buildRuntimeCommandRequest(
      command({
        id: "run-123:worker:task-1:validator:1:start",
        kind: "validator.start",
        payload: {
          jobId: "run-123:worker:task-1:validator:1",
          workerJobId: "run-123:worker:task-1",
          taskId: "task-1",
          worktreePath: "C:\\repo\\.steerboard\\worktrees\\task-1",
          capabilityProfile: "read-only",
          validationCommands: ["npm.cmd run test -- src/task-1.test.ts"]
        }
      }),
      "repo"
    );

    expect(request.kind).toBe("validator.start");
    expect(request.payload).toMatchObject({
      capabilityProfile: "read-only",
      validationCommands: ["npm.cmd run test -- src/task-1.test.ts"]
    });
  });

  it("blocks non-runtime commands instead of pretending they are executable", () => {
    expect(() =>
      buildRuntimeCommandRequest(
        command({
          kind: "worker.pause"
        }),
        "repo"
      )
    ).toThrow("orchestrator_runtime_unsupported_command:worker.pause");
  });

  it("drains worker pause as a durable control event without invoking Tauri", async () => {
    const state = {
      ...createBoundedOrchestratorRun(createOrchestratorBackendState(), {
        id: "run-123",
        projectId: "steerboard",
        scope: { mode: "task-list", taskIds: ["task-1"] },
        baseBranch: "main",
        createdAt: "2026-07-09T07:00:00.000Z"
      }),
      commandQueue: [
        command({
          id: "run-123:worker:task-1:pause",
          kind: "worker.pause",
          payload: {
            jobId: "run-123:worker:task-1",
            taskId: "task-1",
            reason: "pause-requested"
          }
        })
      ]
    };
    const drained = await drainNextOrchestratorRuntimeCommand(state, {
      repositoryRoot: "repo",
      processedAt: "2026-07-09T07:01:00.000Z",
      execute: async () => {
        throw new Error("pause should not invoke Tauri runtime");
      }
    });

    expect(drained.result).toMatchObject({
      kind: "worker.pause",
      executed: true,
      blocked: false,
      detail: "Worker pause acknowledged for run-123:worker:task-1: pause-requested."
    });
    expect(drained.backendState.commandQueue[0]).toMatchObject({
      status: "processed",
      processedAt: "2026-07-09T07:01:00.000Z"
    });
    expect(drained.backendState.eventQueue[0]).toMatchObject({
      kind: "worker.progress",
      status: "queued",
      payload: {
        commandKind: "worker.pause",
        detail: "Worker pause acknowledged for run-123:worker:task-1: pause-requested."
      }
    });

    const processed = processAllQueuedOrchestratorEvents(
      drained.backendState,
      "2026-07-09T07:02:00.000Z"
    );

    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "worker.progress",
      message: "Worker pause acknowledged for run-123:worker:task-1: pause-requested."
    });
  });

  it("drains worker cancel with retained-review evidence as cleanup ledger output", async () => {
    const state = {
      ...createBoundedOrchestratorRun(createOrchestratorBackendState(), {
        id: "run-123",
        projectId: "steerboard",
        scope: { mode: "task-list", taskIds: ["task-1"] },
        baseBranch: "main",
        createdAt: "2026-07-09T07:00:00.000Z"
      }),
      commandQueue: [
        command({
          id: "run-123:worker:task-1:cancel",
          kind: "worker.cancel",
          payload: {
            jobId: "run-123:worker:task-1",
            taskId: "task-1",
            reason: "superseded",
            hasChanges: true
          }
        })
      ]
    };
    const drained = await drainNextOrchestratorRuntimeCommand(state, {
      repositoryRoot: "repo",
      processedAt: "2026-07-09T07:01:00.000Z",
      execute: async () => {
        throw new Error("cancel should not invoke Tauri runtime");
      }
    });

    expect(drained.backendState.eventQueue[0]).toMatchObject({
      kind: "cleanup.updated",
      payload: {
        commandKind: "worker.cancel",
        structuredOutput: {
          retainedForReview: true,
          preventFileMutations: true
        }
      }
    });

    const processed = processAllQueuedOrchestratorEvents(
      drained.backendState,
      "2026-07-09T07:02:00.000Z"
    );

    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "cleanup.updated",
      message: "Worker cancel acknowledged for run-123:worker:task-1: superseded."
    });
  });

  it("drains validator, integration, and cleanup controls without invoking Tauri", async () => {
    const state = {
      ...createBoundedOrchestratorRun(createOrchestratorBackendState(), {
        id: "run-123",
        projectId: "steerboard",
        scope: { mode: "task-list", taskIds: ["task-1"] },
        baseBranch: "main",
        createdAt: "2026-07-09T07:00:00.000Z"
      }),
      commandQueue: [
        command({
          id: "validator-1:pause",
          kind: "validator.pause",
          payload: {
            jobId: "validator-1",
            taskId: "task-1",
            reason: "operator pause"
          }
        }),
        command({
          id: "integration-1:cancel",
          sequence: 2,
          kind: "integration.cancel",
          payload: {
            jobId: "integration-1",
            reason: "merge blocked"
          }
        }),
        command({
          id: "cleanup-1:cancel",
          sequence: 3,
          kind: "cleanup.cancel",
          payload: {
            jobId: "cleanup-1",
            reason: "retention hold"
          }
        })
      ]
    };
    const first = await drainNextOrchestratorRuntimeCommand(state, {
      repositoryRoot: "repo",
      processedAt: "2026-07-09T07:01:00.000Z",
      execute: async () => {
        throw new Error("control should not invoke Tauri runtime");
      }
    });
    const second = await drainNextOrchestratorRuntimeCommand(first.backendState, {
      repositoryRoot: "repo",
      processedAt: "2026-07-09T07:02:00.000Z",
      execute: async () => {
        throw new Error("control should not invoke Tauri runtime");
      }
    });
    const third = await drainNextOrchestratorRuntimeCommand(second.backendState, {
      repositoryRoot: "repo",
      processedAt: "2026-07-09T07:03:00.000Z",
      execute: async () => {
        throw new Error("control should not invoke Tauri runtime");
      }
    });

    expect(first.backendState.eventQueue[0]).toMatchObject({
      kind: "validator.reported",
      payload: {
        commandKind: "validator.pause",
        detail: "Validator pause acknowledged for validator-1: operator pause."
      }
    });
    expect(second.backendState.eventQueue[1]).toMatchObject({
      kind: "integration.updated",
      payload: {
        commandKind: "integration.cancel",
        detail: "Integration cancel acknowledged for integration-1: merge blocked."
      }
    });
    expect(third.backendState.eventQueue[2]).toMatchObject({
      kind: "cleanup.updated",
      payload: {
        commandKind: "cleanup.cancel",
        detail: "Cleanup cancel acknowledged for cleanup-1: retention hold."
      }
    });
  });

  it("drains the next queued command through a compact FIFO runtime event", async () => {
    const state = createBoundedOrchestratorRun(createOrchestratorBackendState(), {
      id: "run-123",
      projectId: "steerboard",
      scope: { mode: "task-list", taskIds: ["task-1"] },
      baseBranch: "main",
      createdAt: "2026-07-09T07:00:00.000Z"
    });
    const commandState = {
      ...state,
      commandQueue: [command()]
    };
    const drained = await drainNextOrchestratorRuntimeCommand(commandState, {
      repositoryRoot: "repo",
      processedAt: "2026-07-09T07:01:00.000Z",
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
        detail: "Worker execution completed."
      })
    });

    expect(drained.drained).toBe(true);
    expect(drained.backendState.commandQueue[0]).toMatchObject({
      id: "run-123:worker:task-1:start",
      status: "processed",
      processedAt: "2026-07-09T07:01:00.000Z"
    });
    expect(drained.backendState.commandQueue[1]).toMatchObject({
      id: "run-123:worker:task-1:validator:1:start",
      kind: "validator.start",
      status: "queued",
      payload: {
        jobId: "run-123:worker:task-1:validator:1",
        workerJobId: "run-123:worker:task-1",
        taskId: "task-1",
        capabilityProfile: "read-only",
        validationCommands: ["npm.cmd run test -- src/task-1.test.ts"]
      }
    });
    expect(drained.backendState.eventQueue[0]).toMatchObject({
      kind: "worker.progress",
      status: "queued"
    });
    expect(drained.backendState.eventQueue[0].payload).toMatchObject({
      phase: "Runtime command completed: worker.start.",
      artifactPaths: ["C:\\repo\\.steerboard\\orchestrator-artifacts\\run-123\\worker.jsonl"]
    });
    expect(JSON.stringify(drained.backendState.eventQueue[0].payload)).not.toContain("raw transcript");

    const processed = processAllQueuedOrchestratorEvents(
      drained.backendState,
      "2026-07-09T07:02:00.000Z"
    );

    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "worker.progress",
      message: "Runtime command completed: worker.start."
    });
  });

  it("marks blocked runtime commands ignored while still creating visible blocker evidence", async () => {
    const state = {
      ...createBoundedOrchestratorRun(createOrchestratorBackendState(), {
        id: "run-123",
        projectId: "steerboard",
        scope: { mode: "task-list", taskIds: ["task-1"] },
        baseBranch: "main",
        createdAt: "2026-07-09T07:00:00.000Z"
      }),
      commandQueue: [command()]
    };
    const drained = await drainNextOrchestratorRuntimeCommand(state, {
      repositoryRoot: "repo",
      processedAt: "2026-07-09T07:01:00.000Z",
      execute: async (request) => ({
        commandId: request.commandId,
        runId: request.runId,
        kind: request.kind,
        executed: false,
        blocked: true,
        artifactPaths: [],
        steps: [
          {
            label: "Preflight",
            command: "orchestrator runtime executor",
            status: "blocked",
            detail: "Unsafe branch."
          }
        ],
        detail: "orchestrator_runtime_unsafe_branch"
      })
    });

    expect(drained.backendState.commandQueue[0]).toMatchObject({
      status: "ignored"
    });
    expect(drained.backendState.eventQueue[0].payload).toMatchObject({
      phase: "Runtime command blocked: worker.start.",
      blocked: true,
      detail: "orchestrator_runtime_unsafe_branch"
    });
    expect(drained.backendState.commandQueue).toHaveLength(1);
  });

  it("drains validator starts into validator ledger events", async () => {
    const state = {
      ...createBoundedOrchestratorRun(createOrchestratorBackendState(), {
        id: "run-123",
        projectId: "steerboard",
        scope: { mode: "task-list", taskIds: ["task-1"] },
        baseBranch: "main",
        createdAt: "2026-07-09T07:00:00.000Z"
      }),
      commandQueue: [
        command({
          id: "run-123:worker:task-1:validator:1:start",
          kind: "validator.start",
          payload: {
            jobId: "run-123:worker:task-1:validator:1",
            workerJobId: "run-123:worker:task-1",
            taskId: "task-1",
            worktreePath: "C:\\repo\\.steerboard\\worktrees\\task-1",
            capabilityProfile: "read-only",
            validationCommands: ["npm.cmd run test -- src/task-1.test.ts"]
          }
        })
      ]
    };
    const drained = await drainNextOrchestratorRuntimeCommand(state, {
      repositoryRoot: "repo",
      processedAt: "2026-07-09T07:01:00.000Z",
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
        detail: "Read-only validator execution completed."
      })
    });

    expect(drained.backendState.eventQueue[0]).toMatchObject({
      kind: "validator.reported"
    });
    expect(drained.backendState.eventQueue[0].payload).toMatchObject({
      phase: "Runtime command completed: validator.start.",
      commandKind: "validator.start",
      executed: true
    });
  });
});
