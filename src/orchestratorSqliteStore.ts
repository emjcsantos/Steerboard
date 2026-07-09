import {
  serializeOrchestratorCommandsForSqlite,
  serializeOrchestratorEventsForSqlite,
  serializeOrchestratorLedgerForSqlite,
  serializeOrchestratorRunsForSqlite,
  type OrchestratorBackendState,
  type OrchestratorLedgerSqliteRow,
  type OrchestratorQueueSqliteRow,
  type OrchestratorRunSqliteRow
} from "./orchestratorBackend";
import {
  serializeArtifactsForSqlite,
  type OrchestratorArtifact,
  type OrchestratorArtifactSqliteRow
} from "./orchestratorArtifacts";
import { hasTauriRuntime } from "./tauriRuntime";

export interface OrchestratorSqliteSnapshot {
  runs: OrchestratorRunSqliteRow[];
  events: OrchestratorQueueSqliteRow[];
  commands: OrchestratorQueueSqliteRow[];
  ledger: OrchestratorLedgerSqliteRow[];
  artifacts: OrchestratorArtifactSqliteRow[];
}

export interface OrchestratorSqliteApplyResult {
  databasePath: string;
  runsWritten: number;
  queueRowsWritten: number;
  ledgerRowsWritten: number;
  artifactsWritten: number;
  detail: string;
}

export function buildOrchestratorSqliteSnapshot(
  state: OrchestratorBackendState,
  artifacts: readonly OrchestratorArtifact[] = []
): OrchestratorSqliteSnapshot {
  return {
    runs: serializeOrchestratorRunsForSqlite(state.runs),
    events: serializeOrchestratorEventsForSqlite(state.eventQueue),
    commands: serializeOrchestratorCommandsForSqlite(state.commandQueue),
    ledger: serializeOrchestratorLedgerForSqlite(state.ledger),
    artifacts: serializeArtifactsForSqlite(artifacts)
  };
}

export async function applyOrchestratorSqliteSnapshot(
  snapshot: OrchestratorSqliteSnapshot
): Promise<OrchestratorSqliteApplyResult> {
  if (!hasTauriRuntime()) {
    throw new Error("orchestrator_sqlite_tauri_unavailable");
  }

  const { invoke } = await import("@tauri-apps/api/core");

  return invoke<OrchestratorSqliteApplyResult>("orchestrator_sqlite_apply_snapshot", {
    snapshot
  });
}

export async function readOrchestratorSqliteSnapshot(): Promise<OrchestratorSqliteSnapshot> {
  if (!hasTauriRuntime()) {
    throw new Error("orchestrator_sqlite_tauri_unavailable");
  }

  const { invoke } = await import("@tauri-apps/api/core");

  return invoke<OrchestratorSqliteSnapshot>("orchestrator_sqlite_read_snapshot");
}
