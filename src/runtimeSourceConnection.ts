import type { RuntimeAdapter } from "./runtime";
import type { RuntimeEventSourceSnapshot } from "./runtimeEventSource";
import type { RuntimeIngestionEvent } from "./runtimeIngestion";

export type RuntimeSourceConnectionState = "mock" | "waiting" | "ready" | "blocked";

export interface RuntimeSourceConnectionSnapshot {
  id: string;
  label: string;
  state: RuntimeSourceConnectionState;
  canAttach: boolean;
  transport: string;
  readiness: number;
  requiredCapabilities: string[];
  missingCapabilities: string[];
  enabledPermissions: number;
  requiredPermissions: number;
  detail: string;
}

const eventKindToCapability: Record<RuntimeIngestionEvent["eventKind"], string> = {
  run: "Session stream",
  session: "Session stream",
  task: "Task state",
  validation: "Validation evidence"
};

function clampReadiness(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildRequiredCapabilities(events: readonly RuntimeIngestionEvent[]): string[] {
  const capabilities: string[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    const capability = eventKindToCapability[event.eventKind];
    if (!seen.has(capability)) {
      seen.add(capability);
      capabilities.push(capability);
    }
  }

  return capabilities;
}

function computeEnabledPermissionCount(adapter: RuntimeAdapter): number {
  return adapter.permissions.filter((permission) => permission.status === "enabled").length;
}

function hasProcessPermission(adapter: RuntimeAdapter): boolean {
  return adapter.permissions.some(
    (permission) => permission.permission === "process" && permission.status === "enabled"
  );
}

export function buildRuntimeSourceConnectionSnapshot(
  adapter: RuntimeAdapter | undefined,
  source: RuntimeEventSourceSnapshot
): RuntimeSourceConnectionSnapshot {
  const requiredCapabilities = buildRequiredCapabilities(source.events);

  if (adapter === undefined) {
    return {
      id: `${source.id}:connection`,
      label: `${source.label} connection`,
      state: "mock",
      canAttach: false,
      transport: source.transport,
      readiness: 0,
      requiredCapabilities,
      missingCapabilities: [...requiredCapabilities],
      enabledPermissions: 0,
      requiredPermissions: 0,
      detail: "Using local event queue until an adapter is configured."
    };
  }

  const transport = adapter.transport;
  const readiness = clampReadiness(adapter.readiness);
  const enabledPermissions = computeEnabledPermissionCount(adapter);
  const requiredPermissions = adapter.requiredPermissions.length;
  const missingCapabilities = requiredCapabilities.filter(
    (capability) => !adapter.capabilities.includes(capability)
  );

  if (source.state === "blocked") {
    return {
      id: `${source.id}:connection`,
      label: `${source.label} connection`,
      state: "blocked",
      canAttach: false,
      transport,
      readiness: 0,
      requiredCapabilities,
      missingCapabilities,
      enabledPermissions,
      requiredPermissions,
      detail: "Connection is blocked by the event source."
    };
  }

  if (adapter.state === "blocked") {
    return {
      id: `${source.id}:connection`,
      label: `${source.label} connection`,
      state: "blocked",
      canAttach: false,
      transport,
      readiness,
      requiredCapabilities,
      missingCapabilities,
      enabledPermissions,
      requiredPermissions,
      detail: "Connection is blocked by adapter state."
    };
  }

  if (adapter.state === "checking" || adapter.state === "limited" || adapter.state === "not_configured") {
    return {
      id: `${source.id}:connection`,
      label: `${source.label} connection`,
      state: "waiting",
      canAttach: false,
      transport,
      readiness,
      requiredCapabilities,
      missingCapabilities,
      enabledPermissions,
      requiredPermissions,
      detail: "Adapter connection is waiting for setup."
    };
  }

  if (missingCapabilities.length > 0) {
    return {
      id: `${source.id}:connection`,
      label: `${source.label} connection`,
      state: "waiting",
      canAttach: false,
      transport,
      readiness,
      requiredCapabilities,
      missingCapabilities,
      enabledPermissions,
      requiredPermissions,
      detail: "Adapter is missing required event capabilities."
    };
  }

  if (adapter.requiredPermissions.includes("process") && !hasProcessPermission(adapter)) {
    return {
      id: `${source.id}:connection`,
      label: `${source.label} connection`,
      state: "waiting",
      canAttach: false,
      transport,
      readiness,
      requiredCapabilities,
      missingCapabilities,
      enabledPermissions,
      requiredPermissions,
      detail: "Adapter process permission is not enabled."
    };
  }

  if (source.available === 0) {
    return {
      id: `${source.id}:connection`,
      label: `${source.label} connection`,
      state: "waiting",
      canAttach: false,
      transport,
      readiness,
      requiredCapabilities,
      missingCapabilities,
      enabledPermissions,
      requiredPermissions,
      detail: "No queued events are ready to attach."
    };
  }

  return {
    id: `${source.id}:connection`,
    label: `${source.label} connection`,
    state: "ready",
    canAttach: true,
    transport,
    readiness,
    requiredCapabilities,
    missingCapabilities,
    enabledPermissions,
    requiredPermissions,
    detail: `Ready to attach via ${adapter.transport}.`
  };
}
