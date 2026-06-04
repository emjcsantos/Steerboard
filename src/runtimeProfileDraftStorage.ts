import {
  createBlankRuntimeProfile,
  type RuntimePermissionState,
  type RuntimePermissionStatus,
  type RuntimeProfile,
  type RuntimeTransport,
  type RuntimeWorkspaceMode
} from "./runtimeProfile";

const RUNTIME_PROFILE_DRAFT_STORAGE_KEY = "steerboard.runtimeProfileDraft.v1";
const DEFAULT_DRAFT_PROFILE = createBlankRuntimeProfile({
  id: "runtime-profile-draft",
  label: "Runtime profile draft"
});
const VALID_TRANSPORTS: RuntimeTransport[] = ["local-process", "remote-endpoint", "mock"];
const VALID_WORKSPACE_MODES: RuntimeWorkspaceMode[] = ["read-only", "read-write", "isolated"];
const VALID_PERMISSION_STATUSES: RuntimePermissionStatus[] = ["enabled", "review", "blocked"];

function isRuntimeTransport(value: unknown): value is RuntimeTransport {
  return typeof value === "string" && VALID_TRANSPORTS.includes(value as RuntimeTransport);
}

function isRuntimeWorkspaceMode(value: unknown): value is RuntimeWorkspaceMode {
  return (
    typeof value === "string" &&
    VALID_WORKSPACE_MODES.includes(value as RuntimeWorkspaceMode)
  );
}

function isRuntimePermissionStatus(value: unknown): value is RuntimePermissionStatus {
  return (
    typeof value === "string" &&
    VALID_PERMISSION_STATUSES.includes(value as RuntimePermissionStatus)
  );
}

function asObject(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function trimAndFilterStrings(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const next: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    next.push(trimmed);
  }

  return next;
}

function repairedText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function repairedOptionalText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function repairPermissionState(value: unknown): RuntimePermissionState[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const repaired: RuntimePermissionState[] = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      continue;
    }

    const entry = item as Record<string, unknown>;
    const permission = typeof entry.permission === "string" ? entry.permission.trim() : "";

    if (!permission) {
      continue;
    }

    const statusCandidate = typeof entry.status === "string" ? entry.status.trim() : "";
    const status: RuntimePermissionStatus = isRuntimePermissionStatus(statusCandidate)
      ? statusCandidate
      : "review";

    repaired.push({ permission, status });
  }

  return repaired;
}

function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage?.getItem?.(key);
    return value === undefined ? null : value;
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage?.setItem?.(key, value);
  } catch {
    return;
  }
}

export function repairRuntimeProfileDraft(
  value: unknown,
  fallback: RuntimeProfile = DEFAULT_DRAFT_PROFILE
): RuntimeProfile {
  const record = asObject(value);

  return {
    id: repairedText(record?.id, fallback.id),
    label: repairedText(record?.label, fallback.label),
    adapterId: repairedOptionalText(record?.adapterId, fallback.adapterId),
    transport: isRuntimeTransport(record?.transport) ? (record?.transport as RuntimeTransport) : fallback.transport,
    command: repairedOptionalText(record?.command, fallback.command),
    args: trimAndFilterStrings(record?.args),
    workspaceMode: isRuntimeWorkspaceMode(record?.workspaceMode)
      ? (record?.workspaceMode as RuntimeWorkspaceMode)
      : fallback.workspaceMode,
    permissionState: repairPermissionState(record?.permissionState),
    enabled: record?.enabled === true,
    requiredPermissions: trimAndFilterStrings(record?.requiredPermissions),
    capabilities: trimAndFilterStrings(record?.capabilities)
  };
}

export function loadRuntimeProfileDraft(defaultProfile: RuntimeProfile = DEFAULT_DRAFT_PROFILE): RuntimeProfile {
  const storageValue = readLocalStorage(RUNTIME_PROFILE_DRAFT_STORAGE_KEY);

  if (storageValue === null) {
    return repairRuntimeProfileDraft(undefined, defaultProfile);
  }

  try {
    return repairRuntimeProfileDraft(JSON.parse(storageValue), defaultProfile);
  } catch {
    return repairRuntimeProfileDraft(undefined, defaultProfile);
  }
}

export function saveRuntimeProfileDraft(profile: RuntimeProfile): void {
  const repaired = repairRuntimeProfileDraft(profile);
  writeLocalStorage(RUNTIME_PROFILE_DRAFT_STORAGE_KEY, JSON.stringify(repaired));
}
