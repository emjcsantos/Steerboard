import {
  hydrateOrchestratorBackendStateFromSqlite,
  processAllQueuedOrchestratorEvents,
  type OrchestratorBackendState
} from "./orchestratorBackend";
import {
  drainNextOrchestratorRuntimeCommand,
  executeOrchestratorRuntimeCommand,
  type OrchestratorRuntimeCommandRequest,
  type OrchestratorRuntimeCommandResult,
  type OrchestratorRuntimeDrainResult
} from "./orchestratorRuntimeExecutor";
import {
  orchestratorRunController,
  type OrchestratorExecutionPolicy,
  type OrchestratorRunController
} from "./orchestratorRunController";
import {
  applyOrchestratorSqliteSnapshot,
  buildOrchestratorSqliteSnapshot,
  readOrchestratorSqliteSnapshot,
  type OrchestratorSqliteApplyResult,
  type OrchestratorSqliteSnapshot
} from "./orchestratorSqliteStore";
import { hydrateArtifactsFromSqlite } from "./orchestratorArtifacts";
import { applyCleanupRuntimeCommandResult } from "./orchestratorCleanup";
import {
  applyValidatorRuntimeCommandResult
} from "./orchestratorValidatorRuntimeReport";
import {
  applyIntegrationRuntimeCommandResult,
  queueIntegrationAfterWorkerCommitRuntime
} from "./orchestratorIntegration";
import { applyFinalizationRuntimeCommandResult, enqueueFinalRunReportIfReady } from "./orchestratorFinalReport";
import { applyOrchestratorTakeoverRuntimeResult } from "./orchestratorTakeover";

export interface OrchestratorQueuePumpCycleInput {
  repositoryRoot: string;
  processedAt: string;
  readSnapshot?: () => Promise<OrchestratorSqliteSnapshot>;
  applySnapshot?: (snapshot: OrchestratorSqliteSnapshot) => Promise<OrchestratorSqliteApplyResult>;
  execute?: (request: OrchestratorRuntimeCommandRequest) => Promise<OrchestratorRuntimeCommandResult>;
  executionPolicy?: OrchestratorExecutionPolicy;
  controller?: OrchestratorRunController;
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
  const controller = input.controller ?? orchestratorRunController;
  const lease = controller.claim(input.repositoryRoot, input.executionPolicy);

  if (!lease.acquired) {
    const snapshot = await readSnapshot();
    return {
      backendState: hydrateOrchestratorBackendStateFromSqlite(snapshot),
      commandDrained: false,
      eventsProcessed: 0,
      snapshotApplied: false,
      detail: "An orchestrator queue pump is already running for this repository."
    };
  }

  try {
  const snapshot = await readSnapshot();
  const restored = hydrateOrchestratorBackendStateFromSqlite(snapshot);
  const drained: OrchestratorRuntimeDrainResult = lease.canExecuteRuntimeCommand
    ? await drainNextOrchestratorRuntimeCommand(restored, {
        repositoryRoot: input.repositoryRoot,
        processedAt: input.processedAt,
        execute: input.execute ?? executeOrchestratorRuntimeCommand
      })
    : { backendState: restored, drained: false };
  const takeoverApplied = drained.command && drained.result
    ? applyOrchestratorTakeoverRuntimeResult({
        backendState: drained.backendState,
        command: drained.command,
        result: drained.result,
        createdAt: input.processedAt
      })
    : undefined;
  const loopApplied = !takeoverApplied && drained.command && drained.result
    ? applyValidatorRuntimeCommandResult({
        backendState: drained.backendState,
        command: drained.command,
        result: drained.result,
        createdAt: input.processedAt
      })
    : undefined;
  const integrationQueued = !loopApplied && drained.command && drained.result
    ? queueIntegrationAfterWorkerCommitRuntime({
        backendState: drained.backendState,
        command: drained.command,
        result: drained.result,
        createdAt: input.processedAt
      })
    : undefined;
  const integrationApplied = !loopApplied && !integrationQueued && drained.command && drained.result
    ? applyIntegrationRuntimeCommandResult({
        backendState: drained.backendState,
        command: drained.command,
        result: drained.result,
        createdAt: input.processedAt
      })
    : undefined;
  const cleanupApplied = !loopApplied && !integrationQueued && !integrationApplied && drained.command && drained.result
    ? applyCleanupRuntimeCommandResult({
        backendState: drained.backendState,
        command: drained.command,
        result: drained.result,
        createdAt: input.processedAt
      })
    : undefined;
  const finalizationApplied =
    !loopApplied && !integrationQueued && !integrationApplied && !cleanupApplied && drained.command && drained.result
      ? applyFinalizationRuntimeCommandResult({
          backendState: drained.backendState,
          command: drained.command,
          result: drained.result,
          createdAt: input.processedAt
        })
      : undefined;
  const stateAfterLoop =
    takeoverApplied?.backendState ??
    loopApplied?.backendState ??
    integrationQueued?.backendState ??
    integrationApplied?.backendState ??
    cleanupApplied?.backendState ??
    finalizationApplied?.backendState ??
    drained.backendState;
  const afterCommandQueued = queuedEventCount(stateAfterLoop);
  const processedState = processAllQueuedOrchestratorEvents(stateAfterLoop, input.processedAt);
  const reportQueued = enqueueFinalRunReportIfReady({
    backendState: processedState,
    artifacts: hydrateArtifactsFromSqlite(snapshot.artifacts),
    generatedAt: input.processedAt
  });
  const stateAfterReport = reportQueued.queued
    ? processAllQueuedOrchestratorEvents(reportQueued.backendState, input.processedAt)
    : processedState;
  const eventsProcessed = afterCommandQueued - queuedEventCount(processedState) + (reportQueued.queued ? 1 : 0);
  const changed = drained.drained || eventsProcessed > 0;

  if (!changed) {
    return {
      backendState: stateAfterReport,
      commandDrained: false,
      eventsProcessed: 0,
      snapshotApplied: false,
      detail: lease.reason === "continuous-gate-closed"
        ? "Continuous execution remains gated by readiness and permission approval."
        : "No queued orchestrator command or event was available."
    };
  }

  const nextSnapshot = {
    ...buildOrchestratorSqliteSnapshot(stateAfterReport),
    artifacts: snapshot.artifacts
  };
  const applyResult = await applySnapshot(nextSnapshot);

  return {
    backendState: stateAfterReport,
    commandDrained: drained.drained,
    eventsProcessed,
    snapshotApplied: true,
    applyResult,
    detail: drained.drained
      ? loopApplied
        ? "Drained one validator command, applied the validator loop decision, and persisted the ledger state."
        : takeoverApplied?.completed
        ? "Drained one orchestrator takeover, queued its accepted commit for normal integration, and persisted the ledger state."
        : takeoverApplied?.failed
        ? "Drained one orchestrator takeover, recorded takeover failure, and persisted the ledger state."
        : integrationQueued?.queued
        ? "Drained one worker commit, queued automatic integration, and persisted the ledger state."
        : integrationApplied?.completed
        ? "Drained one integration command, marked the run ready for finalization, queued cleanup, and persisted the ledger state."
        : cleanupApplied?.completed
        ? "Drained one cleanup command, recorded cleanup completion, and persisted the ledger state."
        : cleanupApplied?.failed
        ? "Drained one cleanup command, recorded cleanup failure, and persisted the ledger state."
        : finalizationApplied?.completed
        ? "Drained one finalization command, recorded finalization progress, and persisted the ledger state."
        : finalizationApplied?.failed
        ? "Drained one finalization command, recorded finalization failure, and persisted the ledger state."
        : "Drained one orchestrator runtime command and persisted the resulting ledger state."
      : "Processed queued orchestrator events and persisted the resulting ledger state."
  };
  } finally {
    lease.release();
  }
}
