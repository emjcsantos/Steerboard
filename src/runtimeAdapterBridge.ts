import type { RuntimeSourceConnectionSnapshot } from "./runtimeSourceConnection";
import type { RuntimeStreamSnapshot } from "./runtimeStream";

export type RuntimeAdapterBridgeIntent = "detached" | "attaching" | "attached";

export type RuntimeAdapterBridgeState =
  | "detached"
  | "attachable"
  | "attaching"
  | "attached"
  | "live"
  | "paused"
  | "complete"
  | "blocked";

export interface RuntimeAdapterBridgeSnapshot {
  id: string;
  label: string;
  intent: RuntimeAdapterBridgeIntent;
  state: RuntimeAdapterBridgeState;
  attached: boolean;
  canAttach: boolean;
  canDetach: boolean;
  canStream: boolean;
  transport: string;
  readiness: number;
  detail: string;
}

function clampReadiness(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function normalizeIntent(value: unknown): RuntimeAdapterBridgeIntent {
  if (value === "attaching" || value === "attached") {
    return value;
  }

  return "detached";
}

export function buildRuntimeAdapterBridgeSnapshot(
  connection: RuntimeSourceConnectionSnapshot,
  stream: RuntimeStreamSnapshot,
  intent: RuntimeAdapterBridgeIntent
): RuntimeAdapterBridgeSnapshot {
  const resolvedIntent = normalizeIntent(intent);
  const readiness = clampReadiness(connection.readiness);

  if (connection.state === "blocked" || stream.state === "blocked") {
    return {
      id: `${connection.id}:bridge`,
      label: `${connection.label} bridge`,
      intent: resolvedIntent,
      state: "blocked",
      attached: resolvedIntent !== "detached",
      canAttach: false,
      canDetach: resolvedIntent !== "detached",
      canStream: false,
      transport: connection.transport,
      readiness,
      detail: "Adapter bridge is blocked."
    };
  }

  if (!connection.canAttach) {
    return {
      id: `${connection.id}:bridge`,
      label: `${connection.label} bridge`,
      intent: resolvedIntent,
      state: "detached",
      attached: false,
      canAttach: false,
      canDetach: false,
      canStream: false,
      transport: connection.transport,
      readiness,
      detail: connection.detail
    };
  }

  if (resolvedIntent === "detached") {
    return {
      id: `${connection.id}:bridge`,
      label: `${connection.label} bridge`,
      intent: resolvedIntent,
      state: "attachable",
      attached: false,
      canAttach: true,
      canDetach: false,
      canStream: false,
      transport: connection.transport,
      readiness,
      detail: "Ready to attach without starting external execution."
    };
  }

  if (resolvedIntent === "attaching") {
    return {
      id: `${connection.id}:bridge`,
      label: `${connection.label} bridge`,
      intent: resolvedIntent,
      state: "attaching",
      attached: false,
      canAttach: false,
      canDetach: true,
      canStream: false,
      transport: connection.transport,
      readiness,
      detail: "Adapter bridge is preparing the local stream handoff."
    };
  }

  if (stream.state === "streaming") {
    return {
      id: `${connection.id}:bridge`,
      label: `${connection.label} bridge`,
      intent: resolvedIntent,
      state: "live",
      attached: true,
      canAttach: false,
      canDetach: true,
      canStream: true,
      transport: connection.transport,
      readiness,
      detail: `Bridge is streaming through ${connection.transport}.`
    };
  }

  if (stream.state === "paused") {
    return {
      id: `${connection.id}:bridge`,
      label: `${connection.label} bridge`,
      intent: resolvedIntent,
      state: "paused",
      attached: true,
      canAttach: false,
      canDetach: true,
      canStream: true,
      transport: connection.transport,
      readiness,
      detail: "Bridge stream is paused."
    };
  }

  if (stream.state === "complete") {
    return {
      id: `${connection.id}:bridge`,
      label: `${connection.label} bridge`,
      intent: resolvedIntent,
      state: "complete",
      attached: true,
      canAttach: false,
      canDetach: true,
      canStream: true,
      transport: connection.transport,
      readiness,
      detail: "Bridge stream is complete."
    };
  }

  return {
    id: `${connection.id}:bridge`,
    label: `${connection.label} bridge`,
    intent: resolvedIntent,
    state: "attached",
    attached: true,
    canAttach: false,
    canDetach: true,
    canStream: true,
    transport: connection.transport,
    readiness,
    detail: `Bridge attached through ${connection.transport}.`
  };
}
