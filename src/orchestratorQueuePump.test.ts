import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  enqueueOrchestratorCommand,
  enqueueOrchestratorEvent
} from "./orchestratorBackend";
import { runOrchestratorQueuePumpCycle } from "./orchestratorQueuePump";
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
});
