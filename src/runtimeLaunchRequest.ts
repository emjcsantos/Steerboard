import type { RuntimeAdapterBridgeSnapshot } from "./runtimeAdapterBridge";
import type { RuntimeSourceConnectionSnapshot } from "./runtimeSourceConnection";
import type { RuntimeEventSourceSnapshot } from "./runtimeEventSource";

export type RuntimeLaunchRequestState = "preview" | "waiting" | "ready" | "blocked";

export interface RuntimeLaunchRequestSnapshot {
  id: string;
  label: string;
  state: RuntimeLaunchRequestState;
  requiresApproval: boolean;
  canRequest: boolean;
  transport: string;
  eventCount: number;
  readiness: number;
  detail: string;
  safety: string;
}

function clampReadiness(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function buildBlockedDetail(
  bridge: RuntimeAdapterBridgeSnapshot,
  connection: RuntimeSourceConnectionSnapshot,
  source: RuntimeEventSourceSnapshot
): string {
  if (bridge.state === "blocked") {
    return "Bridge runtime state is blocked and blocks local handoff request.";
  }

  if (connection.state === "blocked") {
    return "Connection runtime state is blocked and blocks local handoff request.";
  }

  return "Event source state is blocked and blocks local handoff request.";
}

function buildSafety(): string {
  return "This is a local-only preview; no external process has started. External process execution requires approval.";
}

export function buildRuntimeLaunchRequestSnapshot(
  bridge: RuntimeAdapterBridgeSnapshot,
  connection: RuntimeSourceConnectionSnapshot,
  source: RuntimeEventSourceSnapshot
): RuntimeLaunchRequestSnapshot {
  const readiness = clampReadiness(bridge.readiness);
  const base = {
    id: `${bridge.id}:launch-request`,
    label: `${bridge.label} launch request`,
    transport: bridge.transport,
    eventCount: source.available,
    readiness
  };

  if (bridge.state === "blocked" || connection.state === "blocked" || source.state === "blocked") {
    return {
      ...base,
      state: "blocked",
      requiresApproval: false,
      canRequest: false,
      detail: buildBlockedDetail(bridge, connection, source),
      safety: buildSafety()
    };
  }

  if (!connection.canAttach) {
    return {
      ...base,
      state: "waiting",
      requiresApproval: false,
      canRequest: false,
      detail: connection.detail,
      safety: buildSafety()
    };
  }

  if (!bridge.attached) {
    return {
      ...base,
      state: "preview",
      requiresApproval: false,
      canRequest: false,
      detail: "Attach the local bridge before requesting runtime handoff.",
      safety: buildSafety()
    };
  }

  if (source.available === 0) {
    return {
      ...base,
      state: "waiting",
      requiresApproval: false,
      canRequest: false,
      detail: "No queued events are available for handoff.",
      safety: buildSafety()
    };
  }

  if (bridge.attached && bridge.canStream && source.available > 0) {
    return {
      ...base,
      state: "ready",
      requiresApproval: true,
      canRequest: true,
      detail: `Ready to request handoff through ${bridge.transport}.`,
      safety: buildSafety()
    };
  }

  return {
    ...base,
    state: "waiting",
    requiresApproval: false,
    canRequest: false,
    detail: "Runtime handoff request is waiting on local bridge readiness.",
    safety: buildSafety()
  };
}
