import type { RuntimeAdapter } from "./runtime";
import type { RuntimeStreamSnapshot } from "./runtimeStream";

export type RuntimeAdapterSessionState =
  | "offline"
  | "connecting"
  | "ready"
  | "live"
  | "paused"
  | "complete"
  | "blocked";

export type RuntimeAdapterSessionHealth =
  | "quiet"
  | "emitting"
  | "review"
  | "blocked";

export interface RuntimeAdapterSessionSnapshot {
  id: string;
  label: string;
  state: RuntimeAdapterSessionState;
  health: RuntimeAdapterSessionHealth;
  transport: string;
  readiness: number;
  emitted: number;
  pending: number;
  accepted: number;
  review: number;
  blocked: number;
  enabledPermissions: number;
  requiredPermissions: number;
  heartbeat: string;
  latestEventLabel: string;
}

const missingAdapterHeartbeat = "No adapter is configured.";
const defaultLatestEventLabel = "No emitted events";

function clampReadiness(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveSessionState(
  adapter: RuntimeAdapter,
  stream: RuntimeStreamSnapshot
): RuntimeAdapterSessionState {
  if (adapter.state === "blocked" || stream.state === "blocked" || stream.blocked > 0) {
    return "blocked";
  }

  if (stream.state === "streaming") {
    return "live";
  }

  if (stream.state === "paused") {
    return "paused";
  }

  if (stream.state === "complete") {
    return "complete";
  }

  if (adapter.state === "checking" || adapter.state === "limited") {
    return "connecting";
  }

  if (adapter.state === "ready") {
    return "ready";
  }

  return "offline";
}

function resolveSessionHealth(
  sessionState: RuntimeAdapterSessionState,
  stream: RuntimeStreamSnapshot
): RuntimeAdapterSessionHealth {
  if (sessionState === "blocked") {
    return "blocked";
  }

  if (stream.review > 0) {
    return "review";
  }

  if (stream.emitted > 0 && stream.pending > 0) {
    return "emitting";
  }

  return "quiet";
}

function resolveHeartbeat(sessionState: RuntimeAdapterSessionState, stream: RuntimeStreamSnapshot): string {
  if (sessionState === "blocked") {
    return "Session needs attention.";
  }

  if (sessionState === "live") {
    return `Streaming ${stream.emitted} of ${stream.total} events.`;
  }

  if (sessionState === "paused") {
    return `Paused after ${stream.emitted} events.`;
  }

  if (sessionState === "complete") {
    return `Completed ${stream.total} events.`;
  }

  if (sessionState === "connecting") {
    return "Adapter session is preparing.";
  }

  if (sessionState === "ready") {
    return "Adapter session is ready.";
  }

  return "Adapter session is offline.";
}

export function buildRuntimeAdapterSessionSnapshot(
  adapter: RuntimeAdapter | undefined,
  stream: RuntimeStreamSnapshot
): RuntimeAdapterSessionSnapshot {
  if (!adapter) {
    return {
      id: "adapter:missing",
      label: "Missing runtime adapter",
      state: "offline",
      health: "blocked",
      transport: "not configured",
      readiness: 0,
      emitted: stream.emitted,
      pending: stream.pending,
      accepted: stream.accepted,
      review: stream.review,
      blocked: stream.blocked,
      enabledPermissions: 0,
      requiredPermissions: 0,
      heartbeat: missingAdapterHeartbeat,
      latestEventLabel: stream.latestEvent?.label ?? defaultLatestEventLabel
    };
  }

  const sessionState = resolveSessionState(adapter, stream);
  const sessionHealth = resolveSessionHealth(sessionState, stream);
  const heartbeat = resolveHeartbeat(sessionState, stream);
  const adapterReadiness = clampReadiness(adapter.readiness);
  const streamReadiness = clampReadiness(stream.readiness);
  const readiness =
    stream.emitted > 0 ? clampReadiness(Math.min(adapterReadiness, streamReadiness)) : adapterReadiness;

  return {
    id: adapter.id,
    label: adapter.label,
    state: sessionState,
    health: sessionHealth,
    transport: adapter.transport,
    readiness,
    emitted: stream.emitted,
    pending: stream.pending,
    accepted: stream.accepted,
    review: stream.review,
    blocked: stream.blocked,
    enabledPermissions: adapter.permissions.filter((permission) => permission.status === "enabled")
      .length,
    requiredPermissions: adapter.requiredPermissions.length,
    heartbeat,
    latestEventLabel: stream.latestEvent?.label ?? defaultLatestEventLabel
  };
}
