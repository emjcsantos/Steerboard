import { describe, expect, it } from "vitest";
import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  enqueueOrchestratorEvent,
  hydrateOrchestratorBackendStateFromSqlite,
  processAllQueuedOrchestratorEvents,
  processNextOrchestratorEvent,
  serializeOrchestratorCommandsForSqlite,
  serializeOrchestratorEventsForSqlite,
  serializeOrchestratorLedgerForSqlite,
  serializeOrchestratorRunsForSqlite,
  summarizeOrchestratorRunQueue
} from "./orchestratorBackend";

const createdAt = "2026-07-09T01:00:00.000Z";
const processedAt = "2026-07-09T01:01:00.000Z";

function stateWithRun() {
  return createBoundedOrchestratorRun(createOrchestratorBackendState(), {
    id: "run-123",
    projectId: "steerboard",
    scope: {
      mode: "task-list",
      taskIds: ["task-1", "task-2"]
    },
    baseBranch: "main",
    createdAt
  });
}

describe("orchestrator backend queue and ledger", () => {
  it("creates a bounded run with a reserved per-run integration branch", () => {
    const state = stateWithRun();

    expect(state.runs).toHaveLength(1);
    expect(state.runs[0]).toMatchObject({
      id: "run-123",
      projectId: "steerboard",
      baseBranch: "main",
      integrationBranch: "codex/orch/integration/run-123",
      status: "planning",
      phase: "Run created"
    });
    expect(state.runs[0].scope).toMatchObject({
      mode: "task-list",
      taskIds: ["task-1", "task-2"],
      includeCorrectiveChildren: true,
      includeSplitChildren: true,
      includeNewMatchingFilterTasks: false
    });
    expect(state.ledger[0].kind).toBe("run.created");
  });

  it("serializes run, event, and ledger state into SQLite row contracts", () => {
    const queued = enqueueOrchestratorEvent(stateWithRun(), {
      id: "event-1",
      runId: "run-123",
      kind: "worker.progress",
      payload: { phase: "Worker started" },
      dedupeKey: "worker-started",
      enqueuedAt: createdAt
    });
    const processed = processNextOrchestratorEvent(queued, processedAt);

    const runRows = serializeOrchestratorRunsForSqlite(processed.runs);
    const eventRows = serializeOrchestratorEventsForSqlite(processed.eventQueue);
    const ledgerRows = serializeOrchestratorLedgerForSqlite(processed.ledger);

    expect(runRows[0]).toMatchObject({
      id: "run-123",
      project_id: "steerboard",
      integration_branch: "codex/orch/integration/run-123",
      status: "running"
    });
    expect(JSON.parse(runRows[0].scope_json)).toMatchObject({ taskIds: ["task-1", "task-2"] });
    expect(eventRows[0]).toMatchObject({
      queue_name: "event",
      sequence: 1,
      status: "processed",
      dedupe_key: "worker-started"
    });
    expect(JSON.parse(eventRows[0].payload_json)).toEqual({ phase: "Worker started" });
    expect(ledgerRows.at(-1)).toMatchObject({
      run_id: "run-123",
      event_id: "event-1",
      kind: "worker.progress",
      message: "Worker started"
    });
  });

  it("processes queued worker events in FIFO order", () => {
    const queued = [
      {
        id: "event-1",
        runId: "run-123",
        kind: "worker.progress" as const,
        payload: { phase: "Worker A claimed worktree" },
        enqueuedAt: createdAt
      },
      {
        id: "event-2",
        runId: "run-123",
        kind: "validator.reported" as const,
        payload: { phase: "Validator queued after worker" },
        enqueuedAt: createdAt
      }
    ].reduce(enqueueOrchestratorEvent, stateWithRun());

    const processed = processAllQueuedOrchestratorEvents(queued, processedAt);

    expect(processed.eventQueue.map((event) => event.status)).toEqual(["processed", "processed"]);
    expect(processed.ledger.map((entry) => entry.message)).toEqual([
      "Created bounded orchestrator run for steerboard.",
      "Worker A claimed worktree",
      "Validator queued after worker"
    ]);
    expect(processed.runs[0].phase).toBe("Validator queued after worker");
  });

  it("ignores duplicate events without corrupting canonical run state", () => {
    const queued = [
      {
        id: "event-1",
        runId: "run-123",
        kind: "worker.progress" as const,
        payload: { phase: "Worker started" },
        dedupeKey: "same-provider-event",
        enqueuedAt: createdAt
      },
      {
        id: "event-2",
        runId: "run-123",
        kind: "worker.progress" as const,
        payload: { phase: "Duplicate should not win" },
        dedupeKey: "same-provider-event",
        enqueuedAt: createdAt
      }
    ].reduce(enqueueOrchestratorEvent, stateWithRun());

    const processed = processAllQueuedOrchestratorEvents(queued, processedAt);

    expect(processed.eventQueue.map((event) => event.status)).toEqual(["processed", "ignored"]);
    expect(processed.eventQueue[1].ignoredReason).toBe("duplicate-event");
    expect(processed.runs[0].phase).toBe("Worker started");
    expect(processed.ledger.at(-1)).toMatchObject({
      kind: "event.ignored",
      message: "Ignored duplicate event event-2."
    });
  });

  it("records stale events for missing runs without creating phantom runs", () => {
    const queued = enqueueOrchestratorEvent(createOrchestratorBackendState(), {
      id: "event-stale",
      runId: "missing-run",
      kind: "worker.progress",
      payload: { phase: "Should not create a run" },
      enqueuedAt: createdAt
    });

    const processed = processNextOrchestratorEvent(queued, processedAt);

    expect(processed.runs).toEqual([]);
    expect(processed.eventQueue[0]).toMatchObject({
      status: "ignored",
      ignoredReason: "stale-run"
    });
    expect(processed.ledger[0]).toMatchObject({
      runId: "missing-run",
      kind: "event.ignored",
      severity: "warning"
    });
  });

  it("summarizes active run queue state for the planning UI", () => {
    const queued = enqueueOrchestratorEvent(stateWithRun(), {
      id: "event-1",
      runId: "run-123",
      kind: "worker.progress",
      payload: { phase: "Worker waiting for lease" },
      enqueuedAt: createdAt
    });

    const queuedSummary = summarizeOrchestratorRunQueue(queued, "run-123");
    const processedSummary = summarizeOrchestratorRunQueue(
      processNextOrchestratorEvent(queued, processedAt),
      "run-123"
    );

    expect(queuedSummary).toMatchObject({
      label: "Orchestrator backend queue",
      tone: "running",
      queuedEventCount: 1,
      ledgerEntryCount: 1,
      integrationBranch: "codex/orch/integration/run-123"
    });
    expect(processedSummary).toMatchObject({
      queuedEventCount: 0,
      ledgerEntryCount: 2,
      phaseLabel: "Worker waiting for lease",
      lastLedgerEvent: "Worker waiting for lease"
    });
    expect(processedSummary.ariaLabel).toContain("0 queued events");
  });

  it("hydrates durable SQLite rows back into backend state with dedupe keys", () => {
    const queued = enqueueOrchestratorEvent(stateWithRun(), {
      id: "event-1",
      runId: "run-123",
      kind: "worker.progress",
      payload: { phase: "Worker queued.", taskId: "task-1" },
      dedupeKey: "worker-task-1",
      enqueuedAt: createdAt
    });
    const processed = processAllQueuedOrchestratorEvents(queued, processedAt);
    const hydrated = hydrateOrchestratorBackendStateFromSqlite({
      runs: serializeOrchestratorRunsForSqlite(processed.runs),
      events: serializeOrchestratorEventsForSqlite(processed.eventQueue),
      commands: serializeOrchestratorCommandsForSqlite(processed.commandQueue),
      ledger: serializeOrchestratorLedgerForSqlite(processed.ledger)
    });

    expect(hydrated.runs[0]).toMatchObject({
      id: "run-123",
      projectId: "steerboard",
      phase: "Worker queued."
    });
    expect(hydrated.eventQueue[0]).toMatchObject({
      id: "event-1",
      kind: "worker.progress",
      status: "processed",
      dedupeKey: "worker-task-1"
    });
    expect(hydrated.ledger.at(-1)).toMatchObject({
      kind: "worker.progress",
      payload: { phase: "Worker queued.", taskId: "task-1" }
    });
    expect(hydrated.processedEventKeys).toEqual(["worker-task-1"]);
  });
});
