export type RegistryProjectStatus = "active" | "queued" | "blocked";

export type RegistryRuntimeState = "ready" | "starting" | "stopped" | "error";

export type RegistryPermissionState = "allowed" | "review" | "blocked";

export interface RegistryEntry {
  projectId: string;
  projectName: string;
  status: RegistryProjectStatus;
  workspaceLabel: string;
  runtimeState: RegistryRuntimeState;
  permissionState: RegistryPermissionState;
  readiness: number;
}

const validProjectStatuses: RegistryProjectStatus[] = ["active", "queued", "blocked"];
const validRuntimeStates: RegistryRuntimeState[] = ["ready", "starting", "stopped", "error"];
const validPermissionStates: RegistryPermissionState[] = ["allowed", "review", "blocked"];

const defaultRegistryEntry: RegistryEntry = {
  projectId: "project-unknown",
  projectName: "Unnamed project",
  status: "queued",
  workspaceLabel: "Project workspace",
  runtimeState: "stopped",
  permissionState: "review",
  readiness: 0
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStatus(value: unknown): RegistryProjectStatus {
  return validProjectStatuses.includes(value as RegistryProjectStatus)
    ? (value as RegistryProjectStatus)
    : defaultRegistryEntry.status;
}

function asRuntimeState(value: unknown): RegistryRuntimeState {
  return validRuntimeStates.includes(value as RegistryRuntimeState)
    ? (value as RegistryRuntimeState)
    : defaultRegistryEntry.runtimeState;
}

function asPermissionState(value: unknown): RegistryPermissionState {
  return validPermissionStates.includes(value as RegistryPermissionState)
    ? (value as RegistryPermissionState)
    : defaultRegistryEntry.permissionState;
}

function asReadiness(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : defaultRegistryEntry.readiness;
}

function asWorkspaceLabel(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value
    .replace(/[\r\n\t]/g, " ")
    .replace(/[<>/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length === 0 ? fallback : normalized;
}

function asText(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized.length === 0 ? fallback : normalized;
}

export function normalizeRegistryEntry(entry: unknown): RegistryEntry {
  if (!isRecord(entry)) {
    return { ...defaultRegistryEntry };
  }

  const projectName = asText(entry.projectName, defaultRegistryEntry.projectName);
  const workspaceLabel = asWorkspaceLabel(
    entry.workspaceLabel,
    entry.workspaceLabel ? asText(entry.workspaceLabel, projectName) : projectName
  );

  return {
    projectId: asText(entry.projectId, defaultRegistryEntry.projectId),
    projectName,
    status: asStatus(entry.status),
    workspaceLabel,
    runtimeState: asRuntimeState(entry.runtimeState),
    permissionState: asPermissionState(entry.permissionState),
    readiness: asReadiness(entry.readiness)
  };
}

export interface RegistrySummary {
  total: number;
  byStatus: Record<RegistryProjectStatus, number>;
  byRuntimeState: Record<RegistryRuntimeState, number>;
}

export function summarizeRegistry(entries: RegistryEntry[]): RegistrySummary {
  const summary: RegistrySummary = {
    total: 0,
    byStatus: {
      active: 0,
      queued: 0,
      blocked: 0
    },
    byRuntimeState: {
      ready: 0,
      starting: 0,
      stopped: 0,
      error: 0
    }
  };

  for (const entry of entries) {
    summary.total += 1;
    summary.byStatus[entry.status] += 1;
    summary.byRuntimeState[entry.runtimeState] += 1;
  }

  return summary;
}

export function dispatchableRegistryEntries(entries: RegistryEntry[]): RegistryEntry[] {
  return entries.filter((entry) => entry.status === "active" && entry.runtimeState === "ready" && entry.readiness >= 80);
}
