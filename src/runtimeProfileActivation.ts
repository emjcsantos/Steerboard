import type {
  RuntimeProfile,
  RuntimeProfileReadiness,
  RuntimeTransport,
  RuntimeWorkspaceMode
} from "./runtimeProfile";

export type RuntimeProfileActivationState = "inactive" | "active" | "blocked";

export interface RuntimeProfileActivationSnapshot {
  id: string;
  profileId: string;
  profileLabel: string;
  adapterId: string;
  transport: RuntimeTransport;
  workspaceMode: RuntimeWorkspaceMode;
  readiness: number;
  state: RuntimeProfileActivationState;
  statusLabel: string;
  detail: string;
  safety: string;
  activatedAt?: string;
}

export const RUNTIME_PROFILE_ACTIVATION_STORAGE_KEY =
  "steerboard.runtimeProfileActivation.v1";

const SAFETY_COPY =
  "Local Arena state only. No process execution is performed by this activation helper.";
const ACTIVE_DETAIL =
  "Profile activation is tracked as local Arena state only and does not execute processes.";
const INACTIVE_DETAIL =
  "Profile is ready locally. Activate in the Arena to persist this local state. This is local state only and does not execute processes.";
const BLOCKED_DETAIL =
  "Profile activation is blocked due to readiness status. This is local state only and does not execute processes.";

const VALID_STATES: RuntimeProfileActivationState[] = ["inactive", "active", "blocked"];
const VALID_TRANSPORTS: RuntimeTransport[] = ["local-process", "remote-endpoint", "mock"];
const VALID_WORKSPACE_MODES: RuntimeWorkspaceMode[] = [
  "read-only",
  "read-write",
  "isolated"
];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function trimOrEmpty(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function isRuntimeProfileActivationState(
  value: unknown
): value is RuntimeProfileActivationState {
  return (
    typeof value === "string" &&
    VALID_STATES.includes(value as RuntimeProfileActivationState)
  );
}

function isTransport(value: unknown): value is RuntimeTransport {
  return (
    typeof value === "string" &&
    VALID_TRANSPORTS.includes(value as RuntimeTransport)
  );
}

function isWorkspaceMode(value: unknown): value is RuntimeWorkspaceMode {
  return (
    typeof value === "string" &&
    VALID_WORKSPACE_MODES.includes(value as RuntimeWorkspaceMode)
  );
}

export function canActivateRuntimeProfile(readiness: RuntimeProfileReadiness): boolean {
  return readiness.state === "ready" && readiness.readiness === 100;
}

export function buildRuntimeProfileActivationSnapshot(
  profile: RuntimeProfile,
  readiness: RuntimeProfileReadiness,
  activatedAt?: string
): RuntimeProfileActivationSnapshot {
  if (!canActivateRuntimeProfile(readiness)) {
    return {
      id: `${profile.id}:activation`,
      profileId: profile.id,
      profileLabel: profile.label,
      adapterId: profile.adapterId,
      transport: profile.transport,
      workspaceMode: profile.workspaceMode,
      readiness: readiness.readiness,
      state: "blocked",
      statusLabel: "Blocked",
      detail: BLOCKED_DETAIL,
      safety: SAFETY_COPY
    };
  }

  const timestamp = trimOrEmpty(activatedAt);
  if (!timestamp) {
    return {
      id: `${profile.id}:activation`,
      profileId: profile.id,
      profileLabel: profile.label,
      adapterId: profile.adapterId,
      transport: profile.transport,
      workspaceMode: profile.workspaceMode,
      readiness: readiness.readiness,
      state: "inactive",
      statusLabel: "Ready",
      detail: INACTIVE_DETAIL,
      safety: SAFETY_COPY
    };
  }

  return {
    id: `${profile.id}:activation`,
    profileId: profile.id,
    profileLabel: profile.label,
    adapterId: profile.adapterId,
    transport: profile.transport,
    workspaceMode: profile.workspaceMode,
    readiness: readiness.readiness,
    state: "active",
    statusLabel: "Active",
    detail: ACTIVE_DETAIL,
    safety: SAFETY_COPY,
    activatedAt: timestamp
  };
}

export function createRuntimeProfileActivationRecord(
  profile: RuntimeProfile,
  readiness: RuntimeProfileReadiness,
  activatedAt: string
): RuntimeProfileActivationSnapshot {
  return buildRuntimeProfileActivationSnapshot(profile, readiness, activatedAt);
}

function readActivationStorage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage?.getItem?.(RUNTIME_PROFILE_ACTIVATION_STORAGE_KEY);
    return value === undefined ? null : value;
  } catch {
    return null;
  }
}

function writeActivationStorage(value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage?.setItem?.(RUNTIME_PROFILE_ACTIVATION_STORAGE_KEY, value);
  } catch {
    return;
  }
}

function removeActivationStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage?.removeItem?.(RUNTIME_PROFILE_ACTIVATION_STORAGE_KEY);
  } catch {
    return;
  }
}

export function parseStoredRuntimeProfileActivation(
  value: string | null
): RuntimeProfileActivationSnapshot | undefined {
  if (!value) {
    return undefined;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(value);
  } catch {
    return undefined;
  }

  const record = asRecord(payload);
  if (!record) {
    return undefined;
  }

  const profileId = trimOrEmpty(record.profileId);
  const profileLabel = trimOrEmpty(record.profileLabel);
  const adapterId = trimOrEmpty(record.adapterId);

  if (!profileId || !profileLabel || !adapterId) {
    return undefined;
  }

  const state = isRuntimeProfileActivationState(record.state)
    ? (record.state as RuntimeProfileActivationState)
    : undefined;
  if (!state) {
    return undefined;
  }

  const readiness = typeof record.readiness === "number" ? record.readiness : NaN;
  if (!Number.isFinite(readiness)) {
    return undefined;
  }

  const transport = isTransport(record.transport)
    ? (record.transport as RuntimeTransport)
    : undefined;
  const workspaceMode = isWorkspaceMode(record.workspaceMode)
    ? (record.workspaceMode as RuntimeWorkspaceMode)
    : undefined;
  if (!transport || !workspaceMode) {
    return undefined;
  }

  const statusLabel = trimOrEmpty(record.statusLabel);
  const detail = trimOrEmpty(record.detail);
  const safety = trimOrEmpty(record.safety);
  if (!statusLabel || !detail || !safety) {
    return undefined;
  }

  const id = trimOrEmpty(record.id);
  if (!id || id !== `${profileId}:activation`) {
    return undefined;
  }

  const activatedAtValue =
    typeof record.activatedAt === "string" ? record.activatedAt.trim() : "";
  const hasActivatedAt = activatedAtValue.length > 0;

  if (state === "active") {
    if (!hasActivatedAt || readiness !== 100) {
      return undefined;
    }
  } else if (hasActivatedAt) {
    return undefined;
  }

  const snapshot: RuntimeProfileActivationSnapshot = {
    id,
    profileId,
    profileLabel,
    adapterId,
    transport,
    workspaceMode,
    readiness,
    state,
    statusLabel,
    detail,
    safety
  };

  if (hasActivatedAt) {
    snapshot.activatedAt = activatedAtValue;
  }

  return snapshot;
}

export function loadRuntimeProfileActivation():
  | RuntimeProfileActivationSnapshot
  | undefined {
  return parseStoredRuntimeProfileActivation(readActivationStorage());
}

export function saveRuntimeProfileActivation(
  snapshot: RuntimeProfileActivationSnapshot | undefined
): void {
  if (!snapshot) {
    removeActivationStorage();
    return;
  }

  writeActivationStorage(JSON.stringify(snapshot));
}
