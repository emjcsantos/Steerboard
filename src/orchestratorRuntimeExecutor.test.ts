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
      worktreePath: "C:\\Users\\MJ\\Projects\\ProjectAtlas\\Steerboard\\.steerboard\\worktrees\\task-1"
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
        worktreePath: "C:\\Users\\MJ\\Projects\\ProjectAtlas\\Steerboard\\.steerboard\\worktrees\\task-1"
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

  it("blocks non-runtime commands instead of pretending they are executable", () => {
    expect(() =>
      buildRuntimeCommandRequest(
        command({
          kind: "validator.start"
        }),
        "repo"
      )
    ).toThrow("orchestrator_runtime_unsupported_command:validator.start");
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
  });
});
