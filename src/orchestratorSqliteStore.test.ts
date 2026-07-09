import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  enqueueOrchestratorEvent,
  processAllQueuedOrchestratorEvents
} from "./orchestratorBackend";
import { createArtifactMetadataFromText } from "./orchestratorArtifacts";
import {
  buildOrchestratorSqliteSnapshot,
  readOrchestratorSqliteSnapshot
} from "./orchestratorSqliteStore";

const createdAt = "2026-07-09T12:00:00.000Z";

describe("orchestrator SQLite store adapter", () => {
  it("packages backend state and artifacts for the Tauri SQLite command", async () => {
    const state = processAllQueuedOrchestratorEvents(
      enqueueOrchestratorEvent(
        createBoundedOrchestratorRun(createOrchestratorBackendState(), {
          id: "run-123",
          projectId: "steerboard",
          scope: { mode: "task-list", taskIds: ["task-1"] },
          baseBranch: "main",
          createdAt
        }),
        {
          id: "event-1",
          runId: "run-123",
          kind: "worker.progress",
          payload: { phase: "Worker queued.", taskId: "task-1" },
          enqueuedAt: createdAt
        }
      ),
      "2026-07-09T12:01:00.000Z"
    );
    const artifact = await createArtifactMetadataFromText({
      artifactRoot: ".steerboard/artifacts",
      id: "artifact-1",
      runId: "run-123",
      taskId: "task-1",
      kind: "validator-report",
      content: "report",
      createdAt
    });
    const snapshot = buildOrchestratorSqliteSnapshot(state, [artifact]);

    expect(snapshot.runs[0]).toMatchObject({
      id: "run-123",
      project_id: "steerboard",
      integration_branch: "codex/orch/integration/run-123"
    });
    expect(snapshot.events[0]).toMatchObject({
      id: "event-1",
      run_id: "run-123",
      queue_name: "event",
      status: "processed"
    });
    expect(snapshot.ledger).toHaveLength(2);
    expect(snapshot.artifacts[0]).toMatchObject({
      id: "artifact-1",
      run_id: "run-123",
      task_id: "task-1",
      kind: "validator-report"
    });
  });

  it("requires the Tauri runtime before reading the durable snapshot", async () => {
    await expect(readOrchestratorSqliteSnapshot()).rejects.toThrow(
      "orchestrator_sqlite_tauri_unavailable"
    );
  });
});
