export type RuntimeAdapterState = "not_configured" | "checking" | "ready" | "limited" | "blocked";
export type RuntimePermission = "workspace_read" | "workspace_write" | "process" | "network";
export type RuntimePermissionStatus = "enabled" | "review" | "disabled";

export interface RuntimePermissionState {
  permission: RuntimePermission;
  status: RuntimePermissionStatus;
}

export interface RuntimeAdapter {
  id: string;
  label: string;
  state: RuntimeAdapterState;
  readiness: number;
  transport: string;
  capabilities: string[];
  requiredPermissions: RuntimePermission[];
  permissions: RuntimePermissionState[];
}

export interface RuntimeSummary {
  total: number;
  ready: number;
  limited: number;
  blocked: number;
  needsSetup: number;
}

const validRuntimeStates: RuntimeAdapterState[] = [
  "not_configured",
  "checking",
  "ready",
  "limited",
  "blocked"
];
const validPermissions: RuntimePermission[] = ["workspace_read", "workspace_write", "process", "network"];
const validPermissionStatuses: RuntimePermissionStatus[] = ["enabled", "review", "disabled"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampReadiness(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizePermission(value: unknown): RuntimePermissionState | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const permission = value.permission as RuntimePermission;
  const status = value.status as RuntimePermissionStatus;

  if (!validPermissions.includes(permission)) {
    return undefined;
  }

  return {
    permission,
    status: validPermissionStatuses.includes(status) ? status : "review"
  };
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeRequiredPermissions(value: unknown): RuntimePermission[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((permission): permission is RuntimePermission =>
    validPermissions.includes(permission as RuntimePermission)
  );
}

export function normalizeRuntimeAdapter(value: unknown): RuntimeAdapter {
  const adapter = isRecord(value) ? value : {};
  const rawPermissions = Array.isArray(adapter.permissions) ? adapter.permissions : [];
  const permissions = rawPermissions
    .map((permission) => normalizePermission(permission))
    .filter((permission): permission is RuntimePermissionState => Boolean(permission));
  const state = adapter.state as RuntimeAdapterState;

  return {
    id: typeof adapter.id === "string" && adapter.id.trim() ? adapter.id : "runtime",
    label: typeof adapter.label === "string" && adapter.label.trim() ? adapter.label : "Local runtime",
    state: validRuntimeStates.includes(state) ? state : "not_configured",
    readiness: clampReadiness(adapter.readiness),
    transport:
      typeof adapter.transport === "string" && adapter.transport.trim()
        ? adapter.transport.trim()
        : "mock-transport",
    capabilities: normalizeStringList(adapter.capabilities),
    requiredPermissions: normalizeRequiredPermissions(adapter.requiredPermissions),
    permissions
  };
}

export function summarizeRuntimeAdapters(adapters: RuntimeAdapter[]): RuntimeSummary {
  return adapters.reduce<RuntimeSummary>(
    (summary, adapter) => ({
      total: summary.total + 1,
      ready: summary.ready + (adapter.state === "ready" ? 1 : 0),
      limited: summary.limited + (adapter.state === "limited" ? 1 : 0),
      blocked: summary.blocked + (adapter.state === "blocked" ? 1 : 0),
      needsSetup:
        summary.needsSetup + (adapter.state === "not_configured" || adapter.state === "checking" ? 1 : 0)
    }),
    {
      total: 0,
      ready: 0,
      limited: 0,
      blocked: 0,
      needsSetup: 0
    }
  );
}

export function canRunWithAdapter(adapter: RuntimeAdapter): boolean {
  const hasProcessAccess = adapter.permissions.some(
    (permission) => permission.permission === "process" && permission.status === "enabled"
  );

  return adapter.state === "ready" && adapter.readiness >= 80 && hasProcessAccess;
}

export function runtimeStateLabel(state: RuntimeAdapterState): string {
  const labels: Record<RuntimeAdapterState, string> = {
    not_configured: "Needs setup",
    checking: "Checking",
    ready: "Ready",
    limited: "Limited",
    blocked: "Blocked"
  };

  return labels[state];
}
