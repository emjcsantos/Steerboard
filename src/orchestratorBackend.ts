export type OrchestratorRunStatus =
  | "planning"
  | "dispatching"
  | "running"
  | "integrating"
  | "validation-failed"
  | "ready-for-finalization"
  | "completed"
  | "cancelled";

export type OrchestratorRunScopeMode = "task-list" | "filter" | "sprint" | "project-slice";

export interface OrchestratorRunScope {
  mode: OrchestratorRunScopeMode;
  taskIds: string[];
  filter?: string;
  sprintId?: string;
  projectSliceId?: string;
  includeCorrectiveChildren: boolean;
  includeSplitChildren: boolean;
  includeNewMatchingFilterTasks: boolean;
  approvedWorkerCapacity: number;
}

export interface OrchestratorRunRecord {
  id: string;
  projectId: string;
  scope: OrchestratorRunScope;
  baseBranch: string;
  integrationBranch: string;
  status: OrchestratorRunStatus;
  phase: string;
  createdAt: string;
  updatedAt: string;
}

export type OrchestratorQueueStatus = "queued" | "processed" | "ignored";

export type OrchestratorEventKind =
  | "run.created"
  | "run.phase.changed"
  | "worker.progress"
  | "validator.reported"
  | "approval.requested"
  | "integration.updated"
  | "cleanup.updated"
  | "unknown";

export interface OrchestratorQueuedEvent {
  id: string;
  runId: string;
  sequence: number;
  kind: OrchestratorEventKind;
  payload: Record<string, unknown>;
  dedupeKey?: string;
  status: OrchestratorQueueStatus;
  enqueuedAt: string;
  processedAt?: string;
  ignoredReason?: string;
}

export type OrchestratorCommandKind =
  | "worker.commit"
  | "worker.start"
  | "worker.pause"
  | "worker.cancel"
  | "validator.start"
  | "validator.pause"
  | "validator.cancel"
  | "integration.start"
  | "integration.pause"
  | "integration.cancel"
  | "cleanup.start"
  | "cleanup.pause"
  | "cleanup.cancel"
  | "finalization.merge"
  | "remote.push";

export interface OrchestratorQueuedCommand {
  id: string;
  runId: string;
  sequence: number;
  kind: OrchestratorCommandKind;
  payload: Record<string, unknown>;
  status: OrchestratorQueueStatus;
  enqueuedAt: string;
  processedAt?: string;
}

export interface OrchestratorLedgerEntry {
  id: string;
  runId: string;
  sequence: number;
  eventId?: string;
  kind: OrchestratorEventKind | "event.ignored";
  severity: "info" | "warning" | "error";
  message: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface OrchestratorBackendState {
  runs: OrchestratorRunRecord[];
  eventQueue: OrchestratorQueuedEvent[];
  commandQueue: OrchestratorQueuedCommand[];
  ledger: OrchestratorLedgerEntry[];
  processedEventKeys: string[];
}

export interface OrchestratorRunCreateInput {
  id: string;
  projectId: string;
  scope: Partial<OrchestratorRunScope>;
  baseBranch: string;
  createdAt: string;
}

export interface OrchestratorRunQueueSummary {
  label: string;
  detail: string;
  tone: "ready" | "running" | "blocked" | "empty";
  statusLabel: string;
  phaseLabel: string;
  queuedEventCount: number;
  ledgerEntryCount: number;
  lastLedgerEvent?: string;
  integrationBranch?: string;
  ariaLabel: string;
}

export interface OrchestratorRunSqliteRow {
  id: string;
  project_id: string;
  scope_json: string;
  base_branch: string;
  integration_branch: string;
  status: OrchestratorRunStatus;
  phase: string;
  created_at: string;
  updated_at: string;
}

export interface OrchestratorQueueSqliteRow {
  id: string;
  run_id: string;
  queue_name: "event" | "command";
  sequence: number;
  kind: string;
  payload_json: string;
  dedupe_key: string | null;
  status: OrchestratorQueueStatus;
  enqueued_at: string;
  processed_at: string | null;
  ignored_reason: string | null;
}

export interface OrchestratorLedgerSqliteRow {
  id: string;
  run_id: string;
  sequence: number;
  event_id: string | null;
  kind: string;
  severity: OrchestratorLedgerEntry["severity"];
  message: string;
  payload_json: string;
  created_at: string;
}

const DEFAULT_SCOPE: OrchestratorRunScope = {
  mode: "task-list",
  taskIds: [],
  includeCorrectiveChildren: true,
  includeSplitChildren: true,
  includeNewMatchingFilterTasks: false,
  approvedWorkerCapacity: 5
};

function normalizeIdSegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 64) || "run";
}

function nextSequence(items: readonly { sequence: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.sequence), 0) + 1;
}

function runMessageForStatus(status: OrchestratorRunStatus): string {
  switch (status) {
    case "planning":
      return "Run is planning.";
    case "dispatching":
      return "Run is dispatching worker-ready tasks.";
    case "running":
      return "Run is processing worker and validator events.";
    case "integrating":
      return "Run is integrating accepted worker commits.";
    case "validation-failed":
      return "Run has validation blockers.";
    case "ready-for-finalization":
      return "Run is ready for finalization approval.";
    case "completed":
      return "Run completed.";
    case "cancelled":
      return "Run cancelled.";
  }
}

function normalizeScope(scope: Partial<OrchestratorRunScope>): OrchestratorRunScope {
  const requestedCapacity = Number(scope.approvedWorkerCapacity);
  return {
    ...DEFAULT_SCOPE,
    ...scope,
    taskIds: Array.isArray(scope.taskIds) ? scope.taskIds : DEFAULT_SCOPE.taskIds,
    approvedWorkerCapacity:
      Number.isInteger(requestedCapacity) && requestedCapacity >= 1 && requestedCapacity <= 20
        ? requestedCapacity
        : DEFAULT_SCOPE.approvedWorkerCapacity
  };
}

export function createOrchestratorBackendState(): OrchestratorBackendState {
  return {
    runs: [],
    eventQueue: [],
    commandQueue: [],
    ledger: [],
    processedEventKeys: []
  };
}

export function createBoundedOrchestratorRun(
  state: OrchestratorBackendState,
  input: OrchestratorRunCreateInput
): OrchestratorBackendState {
  const scope = normalizeScope(input.scope);
  const integrationBranch = `codex/orch/integration/${normalizeIdSegment(input.id)}`;
  const run: OrchestratorRunRecord = {
    id: input.id,
    projectId: input.projectId,
    scope,
    baseBranch: input.baseBranch.trim() || "main",
    integrationBranch,
    status: "planning",
    phase: "Run created",
    createdAt: input.createdAt,
    updatedAt: input.createdAt
  };
  const ledgerEntry: OrchestratorLedgerEntry = {
    id: `${input.id}:ledger:1`,
    runId: input.id,
    sequence: 1,
    kind: "run.created",
    severity: "info",
    message: `Created bounded orchestrator run for ${input.projectId}.`,
    payload: {
      scope,
      baseBranch: run.baseBranch,
      integrationBranch
    },
    createdAt: input.createdAt
  };

  return {
    ...state,
    runs: [...state.runs.filter((existing) => existing.id !== run.id), run],
    ledger: [...state.ledger, ledgerEntry]
  };
}

export function enqueueOrchestratorEvent(
  state: OrchestratorBackendState,
  event: Omit<OrchestratorQueuedEvent, "sequence" | "status">
): OrchestratorBackendState {
  return {
    ...state,
    eventQueue: [
      ...state.eventQueue,
      {
        ...event,
        sequence: nextSequence(state.eventQueue),
        status: "queued"
      }
    ]
  };
}

export function enqueueOrchestratorCommand(
  state: OrchestratorBackendState,
  command: Omit<OrchestratorQueuedCommand, "sequence" | "status">
): OrchestratorBackendState {
  return {
    ...state,
    commandQueue: [
      ...state.commandQueue,
      {
        ...command,
        sequence: nextSequence(state.commandQueue),
        status: "queued"
      }
    ]
  };
}

export function processNextOrchestratorEvent(
  state: OrchestratorBackendState,
  processedAt: string
): OrchestratorBackendState {
  const nextEvent = [...state.eventQueue]
    .filter((event) => event.status === "queued")
    .sort((first, second) => first.sequence - second.sequence)[0];

  if (!nextEvent) {
    return state;
  }

  const run = state.runs.find((item) => item.id === nextEvent.runId);
  const dedupeKey = nextEvent.dedupeKey ?? nextEvent.id;
  const isDuplicate = state.processedEventKeys.includes(dedupeKey);
  const ignoredReason = !run
    ? "stale-run"
    : isDuplicate
    ? "duplicate-event"
    : undefined;
  const eventQueue = state.eventQueue.map((event) =>
    event.id === nextEvent.id
      ? {
          ...event,
          status: ignoredReason ? "ignored" as const : "processed" as const,
          processedAt,
          ignoredReason
        }
      : event
  );
  const ledgerSequence = nextSequence(state.ledger);

  if (ignoredReason || !run) {
    const ledgerEntry: OrchestratorLedgerEntry = {
      id: `${nextEvent.runId}:ledger:${ledgerSequence}`,
      runId: nextEvent.runId,
      sequence: ledgerSequence,
      eventId: nextEvent.id,
      kind: "event.ignored",
      severity: "warning",
      message:
        ignoredReason === "stale-run"
          ? `Ignored stale event ${nextEvent.id} for missing run ${nextEvent.runId}.`
          : `Ignored duplicate event ${nextEvent.id}.`,
      payload: {
        ignoredReason,
        originalKind: nextEvent.kind
      },
      createdAt: processedAt
    };

    return {
      ...state,
      eventQueue,
      ledger: [...state.ledger, ledgerEntry]
    };
  }

  const requestedStatus = payloadRunStatus(nextEvent.payload);
  const nextStatus =
    requestedStatus ??
    (nextEvent.kind === "integration.updated"
      ? "integrating"
      : nextEvent.kind === "worker.progress" || nextEvent.kind === "validator.reported"
      ? "running"
      : run.status);
  const nextPhase =
    typeof nextEvent.payload.phase === "string" && nextEvent.payload.phase.trim().length > 0
      ? nextEvent.payload.phase.trim()
      : runMessageForStatus(nextStatus);
  const runs = state.runs.map((item) =>
    item.id === run.id
      ? {
          ...item,
          status: nextStatus,
          phase: nextPhase,
          updatedAt: processedAt
        }
      : item
  );
  const ledgerEntry: OrchestratorLedgerEntry = {
    id: `${run.id}:ledger:${ledgerSequence}`,
    runId: run.id,
    sequence: ledgerSequence,
    eventId: nextEvent.id,
    kind: nextEvent.kind,
    severity: "info",
    message: nextPhase,
    payload: nextEvent.payload,
    createdAt: processedAt
  };

  return {
    ...state,
    runs,
    eventQueue,
    ledger: [...state.ledger, ledgerEntry],
    processedEventKeys: [...state.processedEventKeys, dedupeKey]
  };
}

export function processAllQueuedOrchestratorEvents(
  state: OrchestratorBackendState,
  processedAt: string
): OrchestratorBackendState {
  let current = state;
  let previousQueuedCount = -1;

  while (previousQueuedCount !== current.eventQueue.filter((event) => event.status === "queued").length) {
    previousQueuedCount = current.eventQueue.filter((event) => event.status === "queued").length;
    current = processNextOrchestratorEvent(current, processedAt);
  }

  return current;
}

export function summarizeOrchestratorRunQueue(
  state: OrchestratorBackendState,
  runId?: string
): OrchestratorRunQueueSummary {
  const run = runId
    ? state.runs.find((item) => item.id === runId)
    : [...state.runs].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))[0];

  if (!run) {
    return {
      label: "No orchestrator run",
      detail: "No durable orchestrator run has been created for this project yet.",
      tone: "empty",
      statusLabel: "No run",
      phaseLabel: "Idle",
      queuedEventCount: 0,
      ledgerEntryCount: 0,
      ariaLabel: "No orchestrator run. 0 queued events. 0 ledger entries."
    };
  }

  const queuedEventCount = state.eventQueue.filter(
    (event) => event.runId === run.id && event.status === "queued"
  ).length;
  const runLedger = state.ledger.filter((entry) => entry.runId === run.id);
  const lastLedgerEvent = runLedger.at(-1)?.message;
  const tone: OrchestratorRunQueueSummary["tone"] =
    run.status === "validation-failed" || runLedger.at(-1)?.severity === "error"
      ? "blocked"
      : queuedEventCount > 0 || run.status === "running" || run.status === "integrating"
      ? "running"
      : "ready";

  return {
    label: "Orchestrator backend queue",
    detail:
      `${run.phase} ${queuedEventCount} queued event${queuedEventCount === 1 ? "" : "s"}; ` +
      `${runLedger.length} ledger entr${runLedger.length === 1 ? "y" : "ies"}.`,
    tone,
    statusLabel: run.status,
    phaseLabel: run.phase,
    queuedEventCount,
    ledgerEntryCount: runLedger.length,
    lastLedgerEvent,
    integrationBranch: run.integrationBranch,
    ariaLabel:
      `Orchestrator backend queue: ${run.status}; ${run.phase}; ` +
      `${queuedEventCount} queued events; ${runLedger.length} ledger entries.`
  };
}

export function serializeOrchestratorRunsForSqlite(
  runs: readonly OrchestratorRunRecord[]
): OrchestratorRunSqliteRow[] {
  return runs.map((run) => ({
    id: run.id,
    project_id: run.projectId,
    scope_json: JSON.stringify(run.scope),
    base_branch: run.baseBranch,
    integration_branch: run.integrationBranch,
    status: run.status,
    phase: run.phase,
    created_at: run.createdAt,
    updated_at: run.updatedAt
  }));
}

export function serializeOrchestratorEventsForSqlite(
  events: readonly OrchestratorQueuedEvent[]
): OrchestratorQueueSqliteRow[] {
  return events.map((event) => ({
    id: event.id,
    run_id: event.runId,
    queue_name: "event",
    sequence: event.sequence,
    kind: event.kind,
    payload_json: JSON.stringify(event.payload),
    dedupe_key: event.dedupeKey ?? null,
    status: event.status,
    enqueued_at: event.enqueuedAt,
    processed_at: event.processedAt ?? null,
    ignored_reason: event.ignoredReason ?? null
  }));
}

export function serializeOrchestratorCommandsForSqlite(
  commands: readonly OrchestratorQueuedCommand[]
): OrchestratorQueueSqliteRow[] {
  return commands.map((command) => ({
    id: command.id,
    run_id: command.runId,
    queue_name: "command",
    sequence: command.sequence,
    kind: command.kind,
    payload_json: JSON.stringify(command.payload),
    dedupe_key: null,
    status: command.status,
    enqueued_at: command.enqueuedAt,
    processed_at: command.processedAt ?? null,
    ignored_reason: null
  }));
}

export function serializeOrchestratorLedgerForSqlite(
  ledger: readonly OrchestratorLedgerEntry[]
): OrchestratorLedgerSqliteRow[] {
  return ledger.map((entry) => ({
    id: entry.id,
    run_id: entry.runId,
    sequence: entry.sequence,
    event_id: entry.eventId ?? null,
    kind: entry.kind,
    severity: entry.severity,
    message: entry.message,
    payload_json: JSON.stringify(entry.payload),
    created_at: entry.createdAt
  }));
}

function safeParseRecord(serialized: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(serialized);

    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function safeParseScope(serialized: string): OrchestratorRunScope {
  return normalizeScope(safeParseRecord(serialized));
}

function normalizeRunStatus(value: string): OrchestratorRunStatus {
  return value === "planning" ||
    value === "dispatching" ||
    value === "running" ||
    value === "integrating" ||
    value === "validation-failed" ||
    value === "ready-for-finalization" ||
    value === "completed" ||
    value === "cancelled"
    ? value
    : "planning";
}

function payloadRunStatus(payload: Record<string, unknown>): OrchestratorRunStatus | undefined {
  const value = payload.runStatus;

  return typeof value === "string" &&
    (value === "planning" ||
      value === "dispatching" ||
      value === "running" ||
      value === "integrating" ||
      value === "validation-failed" ||
      value === "ready-for-finalization" ||
      value === "completed" ||
      value === "cancelled")
    ? value
    : undefined;
}

function normalizeQueueStatus(value: string): OrchestratorQueueStatus {
  return value === "queued" || value === "processed" || value === "ignored" ? value : "ignored";
}

function normalizeEventKind(value: string): OrchestratorEventKind {
  return value === "run.created" ||
    value === "run.phase.changed" ||
    value === "worker.progress" ||
    value === "validator.reported" ||
    value === "approval.requested" ||
    value === "integration.updated" ||
    value === "cleanup.updated"
    ? value
    : "unknown";
}

function normalizeCommandKind(value: string): OrchestratorCommandKind {
  return value === "worker.commit" ||
    value === "worker.start" ||
    value === "worker.pause" ||
    value === "worker.cancel" ||
    value === "validator.start" ||
    value === "validator.pause" ||
    value === "validator.cancel" ||
    value === "integration.start" ||
    value === "integration.pause" ||
    value === "integration.cancel" ||
    value === "cleanup.start" ||
    value === "cleanup.pause" ||
    value === "cleanup.cancel" ||
    value === "finalization.merge" ||
    value === "remote.push"
    ? value
    : "validator.start";
}

function normalizeLedgerKind(value: string): OrchestratorLedgerEntry["kind"] {
  return value === "event.ignored" ? "event.ignored" : normalizeEventKind(value);
}

function normalizeSeverity(value: string): OrchestratorLedgerEntry["severity"] {
  return value === "warning" || value === "error" || value === "info" ? value : "info";
}

export function hydrateOrchestratorBackendStateFromSqlite(input: {
  runs: readonly OrchestratorRunSqliteRow[];
  events: readonly OrchestratorQueueSqliteRow[];
  commands: readonly OrchestratorQueueSqliteRow[];
  ledger: readonly OrchestratorLedgerSqliteRow[];
}): OrchestratorBackendState {
  const eventQueue: OrchestratorQueuedEvent[] = input.events.map((row) => ({
    id: row.id,
    runId: row.run_id,
    sequence: row.sequence,
    kind: normalizeEventKind(row.kind),
    payload: safeParseRecord(row.payload_json),
    dedupeKey: row.dedupe_key ?? undefined,
    status: normalizeQueueStatus(row.status),
    enqueuedAt: row.enqueued_at,
    processedAt: row.processed_at ?? undefined,
    ignoredReason: row.ignored_reason ?? undefined
  }));

  return {
    runs: input.runs.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      scope: safeParseScope(row.scope_json),
      baseBranch: row.base_branch,
      integrationBranch: row.integration_branch,
      status: normalizeRunStatus(row.status),
      phase: row.phase,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })),
    eventQueue,
    commandQueue: input.commands.map((row) => ({
      id: row.id,
      runId: row.run_id,
      sequence: row.sequence,
      kind: normalizeCommandKind(row.kind),
      payload: safeParseRecord(row.payload_json),
      status: normalizeQueueStatus(row.status),
      enqueuedAt: row.enqueued_at,
      processedAt: row.processed_at ?? undefined
    })),
    ledger: input.ledger.map((row) => ({
      id: row.id,
      runId: row.run_id,
      sequence: row.sequence,
      eventId: row.event_id ?? undefined,
      kind: normalizeLedgerKind(row.kind),
      severity: normalizeSeverity(row.severity),
      message: row.message,
      payload: safeParseRecord(row.payload_json),
      createdAt: row.created_at
    })),
    processedEventKeys: eventQueue
      .filter((event) => event.status === "processed")
      .map((event) => event.dedupeKey ?? event.id)
  };
}
