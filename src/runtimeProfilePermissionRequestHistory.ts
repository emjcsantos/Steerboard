import type { RuntimeProfilePermissionHandoffSnapshot } from "./runtimeProfilePermissionHandoff";

export type RuntimeProfilePermissionRequestAction = "requested" | "cancelled";

export interface RuntimeProfilePermissionRequestRecord {
  id: string;
  handoffId: string;
  action: RuntimeProfilePermissionRequestAction;
  createdAt: string;
  statusLabel: string;
  readiness: number;
  detail: string;
  bridgeState: RuntimeProfilePermissionHandoffSnapshot["bridgeState"];
  bridgeSource: RuntimeProfilePermissionHandoffSnapshot["bridgeSource"];
  profileId?: string;
  profileLabel?: string;
}

export const RUNTIME_PROFILE_PERMISSION_REQUEST_HISTORY_STORAGE_KEY =
  "steerboard.runtimeProfilePermissionRequestHistory.v1";

const validActions: RuntimeProfilePermissionRequestAction[] = [
  "requested",
  "cancelled"
];
const validBridgeStates: RuntimeProfilePermissionHandoffSnapshot["bridgeState"][] = [
  "unavailable",
  "locked",
  "ready",
  "error"
];
const validBridgeSources: RuntimeProfilePermissionHandoffSnapshot["bridgeSource"][] = [
  "browser",
  "desktop"
];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isAction(
  value: unknown
): value is RuntimeProfilePermissionRequestAction {
  return validActions.includes(value as RuntimeProfilePermissionRequestAction);
}

function isBridgeState(
  value: unknown
): value is RuntimeProfilePermissionHandoffSnapshot["bridgeState"] {
  return validBridgeStates.includes(value as RuntimeProfilePermissionHandoffSnapshot["bridgeState"]);
}

function isBridgeSource(
  value: unknown
): value is RuntimeProfilePermissionHandoffSnapshot["bridgeSource"] {
  return validBridgeSources.includes(value as RuntimeProfilePermissionHandoffSnapshot["bridgeSource"]);
}

function normalizeLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return 8;
  }

  const normalizedLimit = Math.floor(limit);
  return normalizedLimit <= 0 ? 0 : normalizedLimit;
}

function readHistoryStorage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage?.getItem?.(
      RUNTIME_PROFILE_PERMISSION_REQUEST_HISTORY_STORAGE_KEY
    );
    return value === undefined ? null : value;
  } catch {
    return null;
  }
}

function writeHistoryStorage(records: RuntimeProfilePermissionRequestRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage?.setItem?.(
      RUNTIME_PROFILE_PERMISSION_REQUEST_HISTORY_STORAGE_KEY,
      JSON.stringify(records)
    );
  } catch {
    return;
  }
}

function normalizeOptionalProfileFields<
  T extends {
    profileId?: unknown;
    profileLabel?: unknown;
  }
>(record: T):
  | Pick<RuntimeProfilePermissionRequestRecord, "profileId" | "profileLabel">
  | Record<string, never> {
  const profileId = record.profileId;
  const profileLabel = record.profileLabel;

  if (!hasNonEmptyString(profileId) || !hasNonEmptyString(profileLabel)) {
    return {};
  }

  return { profileId, profileLabel };
}

function isRuntimeProfilePermissionRequestRecord(
  value: unknown
): value is RuntimeProfilePermissionRequestRecord {
  const record = asRecord(value);

  if (!record) {
    return false;
  }

  return (
    hasNonEmptyString(record.id) &&
    hasNonEmptyString(record.handoffId) &&
    isAction(record.action) &&
    hasNonEmptyString(record.createdAt) &&
    hasNonEmptyString(record.statusLabel) &&
    typeof record.readiness === "number" &&
    Number.isFinite(record.readiness) &&
    hasNonEmptyString(record.detail) &&
    isBridgeState(record.bridgeState) &&
    isBridgeSource(record.bridgeSource)
  );
}

export function createRuntimeProfilePermissionRequestRecord(
  snapshot: RuntimeProfilePermissionHandoffSnapshot,
  action: RuntimeProfilePermissionRequestAction,
  createdAt: string
): RuntimeProfilePermissionRequestRecord {
  return {
    id: `${snapshot.id}:${action}:${createdAt}`,
    handoffId: snapshot.id,
    action,
    createdAt,
    statusLabel: snapshot.statusLabel,
    readiness: snapshot.readiness,
    detail: snapshot.detail,
    bridgeState: snapshot.bridgeState,
    bridgeSource: snapshot.bridgeSource,
    ...normalizeOptionalProfileFields(snapshot)
  };
}

export function appendRuntimeProfilePermissionRequestRecord(
  records: readonly RuntimeProfilePermissionRequestRecord[],
  record: RuntimeProfilePermissionRequestRecord,
  limit = 8
): RuntimeProfilePermissionRequestRecord[] {
  const normalizedLimit = normalizeLimit(limit);

  if (normalizedLimit === 0) {
    return [];
  }

  const deduped: RuntimeProfilePermissionRequestRecord[] = [];
  const seenIds = new Set<string>();

  for (const nextRecord of [record, ...records]) {
    if (seenIds.has(nextRecord.id)) {
      continue;
    }

    seenIds.add(nextRecord.id);
    deduped.push(nextRecord);

    if (deduped.length >= normalizedLimit) {
      break;
    }
  }

  return deduped;
}

export function parseStoredRuntimeProfilePermissionRequestHistory(
  serialized: string | null,
  limit = 8
): RuntimeProfilePermissionRequestRecord[] {
  if (!serialized) {
    return [];
  }

  try {
    const parsed = JSON.parse(serialized);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalizedLimit = normalizeLimit(limit);

    if (normalizedLimit === 0) {
      return [];
    }

    const seenIds = new Set<string>();
    const repaired: RuntimeProfilePermissionRequestRecord[] = [];

    for (const item of parsed) {
      if (!isRuntimeProfilePermissionRequestRecord(item) || seenIds.has(item.id)) {
        continue;
      }

      seenIds.add(item.id);

      const sanitized: RuntimeProfilePermissionRequestRecord = {
        id: item.id,
        handoffId: item.handoffId,
        action: item.action,
        createdAt: item.createdAt,
        statusLabel: item.statusLabel,
        readiness: item.readiness,
        detail: item.detail,
        bridgeState: item.bridgeState,
        bridgeSource: item.bridgeSource,
        ...normalizeOptionalProfileFields(item)
      };

      repaired.push(sanitized);

      if (repaired.length >= normalizedLimit) {
        break;
      }
    }

    return repaired;
  } catch {
    return [];
  }
}

export function loadRuntimeProfilePermissionRequestHistory():
  RuntimeProfilePermissionRequestRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseStoredRuntimeProfilePermissionRequestHistory(readHistoryStorage());
}

export function saveRuntimeProfilePermissionRequestHistory(
  records: RuntimeProfilePermissionRequestRecord[]
): void {
  writeHistoryStorage(records);
}
