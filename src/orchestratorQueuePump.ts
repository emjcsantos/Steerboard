import {
  hydrateOrchestratorBackendStateFromSqlite,
  processAllQueuedOrchestratorEvents,
  type OrchestratorBackendState
} from "./orchestratorBackend";
import {
  drainNextOrchestratorRuntimeCommand,
  executeOrchestratorRuntimeCommand,
  type OrchestratorRuntimeCommandRequest,
  type OrchestratorRuntimeCommandResult
} from "./orchestratorRuntimeExecutor";
import {
  applyOrchestratorSqliteSnapshot,
  buildOrchestratorSqliteSnapshot,
  readOrchestratorSqliteSnapshot,
  type OrchestratorSqliteApplyResult,
  type OrchestratorSqliteSnapshot
} from "./orchestratorSqliteStore";

export interface OrchestratorQueuePumpCycleInput {
  repositoryRoot: string;
  processedAt: string;
  readSnapshot?: () => Promise<OrchestratorSqliteSnapshot>;
  applySnapshot?: (snapshot: OrchestratorSqliteSnapshot) => Promise<OrchestratorSqliteApplyResult>;
  execute?: (request: OrchestratorRuntimeCommandRequest) => Promise<OrchestratorRuntimeCommandResult>;
}

export interface OrchestratorQueuePumpCycleResult {
  backendState: OrchestratorBackendState;
  commandDrained: boolean;
  eventsProcessed: number;
  snapshotApplied: boolean;
  applyResult?: OrchestratorSqliteApplyResult;
  detail: string;
}

function queuedEventCount(state: OrchestratorBackendState): number {
  return state.eventQueue.filter((event) => event.status === "queued").length;
}

export async function runOrchestratorQueuePumpCycle(
  input: OrchestratorQueuePumpCycleInput
): Promise<OrchestratorQueuePumpCycleResult> {
  const readSnapshot = input.readSnapshot ?? readOrchestratorSqliteSnapshot;
  const applySnapshot = input.applySnapshot ?? applyOrchestratorSqliteSnapshot;
  const snapshot = await readSnapshot();
  const restored = hydrateOrchestratorBackendStateFromSqlite(snapshot);
  const drained = await drainNextOrchestratorRuntimeCommand(restored, {
    repositoryRoot: input.repositoryRoot,
    processedAt: input.processedAt,
    execute: input.execute ?? executeOrchestratorRuntimeCommand
  });
  const afterCommandQueued = queuedEventCount(drained.backendState);
  const processedState = processAllQueuedOrchestratorEvents(drained.backendState, input.processedAt);
  const eventsProcessed = afterCommandQueued - queuedEventCount(processedState);
  const changed = drained.drained || eventsProcessed > 0;

  if (!changed) {
    return {
      backendState: processedState,
      commandDrained: false,
      eventsProcessed: 0,
      snapshotApplied: false,
      detail: "No queued orchestrator command or event was available."
    };
  }

  const nextSnapshot = {
    ...buildOrchestratorSqliteSnapshot(processedState),
    artifacts: snapshot.artifacts
  };
  const applyResult = await applySnapshot(nextSnapshot);

  return {
    backendState: processedState,
    commandDrained: drained.drained,
    eventsProcessed,
    snapshotApplied: true,
    applyResult,
    detail: drained.drained
      ? "Drained one orchestrator runtime command and persisted the resulting ledger state."
      : "Processed queued orchestrator events and persisted the resulting ledger state."
  };
}
