import type { RuntimeIngestionEvent } from "./runtimeIngestion";

export type RuntimeStreamPlaybackState =
  | "idle"
  | "streaming"
  | "paused"
  | "complete"
  | "blocked";

export interface RuntimeStreamSnapshot {
  state: RuntimeStreamPlaybackState;
  cursor: number;
  total: number;
  emitted: number;
  pending: number;
  accepted: number;
  review: number;
  blocked: number;
  readiness: number;
  latestEvent?: RuntimeIngestionEvent;
  emittedEvents: RuntimeIngestionEvent[];
}

export interface RuntimeStreamRouteMetadata {
  panelId: string;
  provider: string;
  sessionId: string;
  turnId: string;
  turnSequence: number;
}

export type RuntimeRoutedIngestionEvent = RuntimeIngestionEvent & RuntimeStreamRouteMetadata;

export interface RuntimeStreamEventBatch {
  panelId: string;
  provider: string;
  sessionId: string;
  turnId: string;
  turnSequence: number;
  events: readonly RuntimeIngestionEvent[];
}

export interface RuntimeStreamPanelOwnership {
  panelId: string;
  provider: string;
  sessionId: string;
  currentTurnSequence?: number;
}

export type RuntimeStreamQuarantineReason =
  | "unknown-panel"
  | "unknown-session"
  | "stale-turn";

export interface RuntimeStreamQuarantineRecord {
  event: RuntimeRoutedIngestionEvent;
  reason: RuntimeStreamQuarantineReason;
  detail: string;
}

export interface RuntimeStreamPanelLog {
  panelId: string;
  provider: string;
  sessionId: string;
  events: RuntimeRoutedIngestionEvent[];
  latestTurnSequence: number;
  state: RuntimeStreamPlaybackState;
}

export interface RuntimeStreamPanelRouterState {
  panelLogs: Record<string, RuntimeStreamPanelLog>;
  quarantinedEvents: RuntimeStreamQuarantineRecord[];
}

export interface RuntimePanelLatestStatus {
  panelId: string;
  latestEvent?: RuntimeRoutedIngestionEvent;
  latestStatus?: RuntimeRoutedIngestionEvent["adapterStatus"];
  isActive: boolean;
  isRunning: boolean;
}

export interface RuntimeStreamIsolationProof {
  panelCount: number;
  activePanelCount: number;
  routedEventCount: number;
  quarantinedEventCount: number;
  unknownPanelCount: number;
  unknownSessionCount: number;
  staleTurnCount: number;
  panelEventCounts: Record<string, number>;
  crossTalkDetected: boolean;
  detail: string;
}

const buildPanelLog = (
  ownership: RuntimeStreamPanelOwnership
): RuntimeStreamPanelLog => ({
  panelId: ownership.panelId,
  provider: ownership.provider,
  sessionId: ownership.sessionId,
  events: [],
  latestTurnSequence: Number.isFinite(ownership.currentTurnSequence ?? NaN)
    ? Math.max(0, Math.floor(ownership.currentTurnSequence ?? 0))
    : -1,
  state: "idle"
});

function nextEventIdFromLog(
  currentTurnSequence: number,
  candidateTurnSequence: number
): number {
  return Math.max(currentTurnSequence, candidateTurnSequence);
}

function quarantineEvent(
  event: RuntimeRoutedIngestionEvent,
  reason: RuntimeStreamQuarantineReason,
  detail: string
): RuntimeStreamQuarantineRecord {
  return {
    event,
    reason,
    detail
  };
}

function isStaleTurnSequence(
  log: RuntimeStreamPanelLog,
  event: RuntimeRoutedIngestionEvent
): boolean {
  if (log.latestTurnSequence < 0) {
    return false;
  }

  return event.turnSequence < log.latestTurnSequence;
}

export function createRuntimeStreamPanelRouterState(
  ownedPanels: readonly RuntimeStreamPanelOwnership[] = []
): RuntimeStreamPanelRouterState {
  const panelLogs = ownedPanels.reduce<Record<string, RuntimeStreamPanelLog>>(
    (acc, owner) => {
      acc[owner.panelId] = buildPanelLog(owner);
      return acc;
    },
    {}
  );

  return { panelLogs, quarantinedEvents: [] };
}

function appendRoutedEventBatchToPanelLog(
  panelLog: RuntimeStreamPanelLog,
  batch: RuntimeStreamEventBatch
): RuntimeStreamPanelLog {
  const routedEvents = batch.events.map((event) => ({
    ...event,
    panelId: batch.panelId,
    provider: batch.provider,
    sessionId: batch.sessionId,
    turnId: batch.turnId,
    turnSequence: batch.turnSequence
  }));

  return {
    ...panelLog,
    state: "streaming",
    events: [...panelLog.events, ...routedEvents],
    latestTurnSequence: routedEvents.reduce(
      (currentTurnSequence, event) =>
        nextEventIdFromLog(currentTurnSequence, event.turnSequence),
      panelLog.latestTurnSequence
    )
  };
}

function addQuarantinedBatchEvents(
  batch: RuntimeStreamEventBatch,
  reason: RuntimeStreamQuarantineReason,
  detail: string
): RuntimeStreamQuarantineRecord[] {
  const fallbackPanelId = batch.panelId;
  return batch.events.map((event) =>
    quarantineEvent(
      {
        ...event,
        panelId: fallbackPanelId,
        provider: batch.provider,
        sessionId: batch.sessionId,
        turnId: batch.turnId,
        turnSequence: batch.turnSequence
      },
      reason,
      detail
    )
  );
}

export function reduceRuntimeStreamPanelRouter(
  state: RuntimeStreamPanelRouterState,
  batches: readonly RuntimeStreamEventBatch[]
): RuntimeStreamPanelRouterState {
  let next = {
    ...state,
    panelLogs: { ...state.panelLogs },
    quarantinedEvents: [...state.quarantinedEvents]
  };

  for (const batch of batches) {
    const panelLog = next.panelLogs[batch.panelId];
    if (!panelLog) {
      next.quarantinedEvents = [
        ...next.quarantinedEvents,
        ...addQuarantinedBatchEvents(
          batch,
          "unknown-panel",
          `No panel route found for ${batch.panelId}.`
        )
      ];
      continue;
    }

    if (batch.provider !== panelLog.provider || batch.sessionId !== panelLog.sessionId) {
      next.quarantinedEvents = [
        ...next.quarantinedEvents,
        ...addQuarantinedBatchEvents(
          batch,
          "unknown-session",
          `Session/provider mismatch for panel ${batch.panelId}.`
        )
      ];
      continue;
    }

    const nextTurnEvents = batch.events.map((event) => ({
      ...event,
      panelId: batch.panelId,
      provider: batch.provider,
      sessionId: batch.sessionId,
      turnId: batch.turnId,
      turnSequence: batch.turnSequence
    }));

    const staleEvent = nextTurnEvents.find((event) => isStaleTurnSequence(panelLog, event));
    if (staleEvent) {
      next.quarantinedEvents = [
        ...next.quarantinedEvents,
        ...addQuarantinedBatchEvents(
          batch,
          "stale-turn",
          `Stale turn sequence ${staleEvent.turnSequence} for panel ${batch.panelId}.`
        )
      ];
      continue;
    }

    next.panelLogs[batch.panelId] = appendRoutedEventBatchToPanelLog(panelLog, batch);
  }

  return next;
}

export function selectPanelRuntimeEvents(
  state: RuntimeStreamPanelRouterState,
  panelId: string
): RuntimeRoutedIngestionEvent[] {
  return [...(state.panelLogs[panelId]?.events ?? [])];
}

export function selectPanelLatestRuntimeStatus(
  state: RuntimeStreamPanelRouterState,
  panelId: string
): RuntimePanelLatestStatus | undefined {
  const panelLog = state.panelLogs[panelId];
  if (!panelLog) {
    return undefined;
  }

  const latestEvent = panelLog.events.at(-1);
  return {
    panelId,
    latestEvent,
    latestStatus: latestEvent?.adapterStatus,
    isActive: panelLog.events.length > 0,
    isRunning: panelLog.state === "streaming"
  };
}

export function selectActiveRuntimePanels(
  state: RuntimeStreamPanelRouterState
): string[] {
  return Object.keys(state.panelLogs).filter((panelId) => {
    const panelLog = state.panelLogs[panelId];
    return panelLog.events.length > 0;
  });
}

export function selectRunningRuntimePanels(
  state: RuntimeStreamPanelRouterState
): string[] {
  return Object.keys(state.panelLogs).filter((panelId) => {
    const panelLog = state.panelLogs[panelId];
    return panelLog.state === "streaming";
  });
}

export function selectRuntimeStreamQuarantineEvents(
  state: RuntimeStreamPanelRouterState,
  reason?: RuntimeStreamQuarantineReason
): RuntimeStreamQuarantineRecord[] {
  const events = [...state.quarantinedEvents];
  return reason ? events.filter((item) => item.reason === reason) : events;
}

export function buildRuntimeStreamIsolationProof(
  state: RuntimeStreamPanelRouterState
): RuntimeStreamIsolationProof {
  const panelEventCounts: Record<string, number> = {};
  let routedEventCount = 0;
  let crossTalkDetected = false;

  for (const panelId of Object.keys(state.panelLogs).sort()) {
    const panelLog = state.panelLogs[panelId];
    panelEventCounts[panelId] = panelLog.events.length;
    routedEventCount += panelLog.events.length;

    if (
      panelLog.events.some(
        (event) =>
          event.panelId !== panelLog.panelId ||
          event.provider !== panelLog.provider ||
          event.sessionId !== panelLog.sessionId
      )
    ) {
      crossTalkDetected = true;
    }
  }

  const unknownPanelCount = selectRuntimeStreamQuarantineEvents(state, "unknown-panel").length;
  const unknownSessionCount = selectRuntimeStreamQuarantineEvents(state, "unknown-session").length;
  const staleTurnCount = selectRuntimeStreamQuarantineEvents(state, "stale-turn").length;
  const quarantinedEventCount = state.quarantinedEvents.length;
  const panelCount = Object.keys(state.panelLogs).length;
  const activePanelCount = Object.values(panelEventCounts).filter((count) => count > 0).length;

  let detail = "No runtime stream panel routes are registered.";
  if (panelCount > 0) {
    detail =
      `Route isolation proof has ${activePanelCount}/${panelCount} active panels, ` +
      `${routedEventCount} routed events, ${quarantinedEventCount} quarantined events, ` +
      `${unknownPanelCount} unknown-panel, ${unknownSessionCount} session/provider, ` +
      `${staleTurnCount} stale-turn, and ${crossTalkDetected ? "mismatched" : "zero mismatched"} owned events.`;
  }

  return {
    panelCount,
    activePanelCount,
    routedEventCount,
    quarantinedEventCount,
    unknownPanelCount,
    unknownSessionCount,
    staleTurnCount,
    panelEventCounts,
    crossTalkDetected,
    detail
  };
}

const clampToInteger = (value: number): number =>
  Number.isFinite(value) ? Math.floor(value) : 0;

export function clampRuntimeStreamPosition(
  cursor: number,
  total: number
): number {
  const safePosition = clampToInteger(cursor);
  const safeTotal = Math.max(0, clampToInteger(total));

  if (!Number.isFinite(cursor) || safePosition < 0) {
    return 0;
  }

  if (safePosition > safeTotal) {
    return safeTotal;
  }

  return safePosition;
}

export function nextRuntimeStreamPosition(cursor: number, total: number): number {
  return clampRuntimeStreamPosition(cursor + 1, total);
}

export function buildRuntimeStreamSnapshot(
  events: readonly RuntimeIngestionEvent[],
  cursor: number,
  requestedState: RuntimeStreamPlaybackState
): RuntimeStreamSnapshot {
  const total = events.length;
  const clampedPosition = clampRuntimeStreamPosition(cursor, total);
  const emittedEvents = events.slice(0, clampedPosition);

  const { accepted, review, blocked } = emittedEvents.reduce(
    (acc, event) => {
      if (event.adapterStatus === "accepted") {
        acc.accepted += 1;
      } else if (event.adapterStatus === "review") {
        acc.review += 1;
      } else if (event.adapterStatus === "blocked") {
        acc.blocked += 1;
      }

      return acc;
    },
    { accepted: 0, review: 0, blocked: 0 }
  );

  const emitted = emittedEvents.length;
  const pending = total - emitted;
  const latestEvent = emittedEvents.at(-1);
  const readiness = emitted === 0 ? 0 : Math.round((accepted / emitted) * 100);
  const hasBlocked = blocked > 0;

  let state = requestedState;
  if (hasBlocked && !(requestedState === "idle" && emitted === 0)) {
    state = "blocked";
  } else if (requestedState === "streaming" && emitted >= total) {
    state = "complete";
  }

  return {
    state,
    cursor: clampedPosition,
    total,
    emitted,
    pending,
    accepted,
    review,
    blocked,
    readiness,
    latestEvent,
    emittedEvents
  };
}
