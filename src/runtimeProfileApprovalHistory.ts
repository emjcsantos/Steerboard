import type { RuntimeProfileApprovalSnapshot } from "./runtimeProfileApproval";

export type RuntimeProfileApprovalRecordAction = "requested" | "cancelled";

export interface RuntimeProfileApprovalRecord {
  id: string;
  approvalId: string;
  action: RuntimeProfileApprovalRecordAction;
  createdAt: string;
  statusLabel: string;
  readiness: number;
  detail: string;
}

export const PROFILE_APPROVAL_HISTORY_STORAGE_KEY =
  "steerboard.runtimeProfileApprovalHistory.v1";

const validActions: RuntimeProfileApprovalRecordAction[] = ["requested", "cancelled"];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isAction(value: unknown): value is RuntimeProfileApprovalRecordAction {
  return validActions.includes(value as RuntimeProfileApprovalRecordAction);
}

function isRuntimeProfileApprovalRecord(
  value: unknown
): value is RuntimeProfileApprovalRecord {
  const record = asRecord(value);

  return (
    Boolean(record) &&
    hasNonEmptyString(record!.id) &&
    hasNonEmptyString(record!.approvalId) &&
    isAction(record!.action) &&
    hasNonEmptyString(record!.createdAt) &&
    hasNonEmptyString(record!.statusLabel) &&
    typeof record!.readiness === "number" &&
    Number.isFinite(record!.readiness) &&
    hasNonEmptyString(record!.detail)
  );
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
    const value = window.localStorage?.getItem?.(PROFILE_APPROVAL_HISTORY_STORAGE_KEY);
    return value === undefined ? null : value;
  } catch {
    return null;
  }
}

function writeHistoryStorage(records: RuntimeProfileApprovalRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage?.setItem?.(
      PROFILE_APPROVAL_HISTORY_STORAGE_KEY,
      JSON.stringify(records)
    );
  } catch {
    return;
  }
}

export function createRuntimeProfileApprovalRecord(
  approval: RuntimeProfileApprovalSnapshot,
  action: RuntimeProfileApprovalRecordAction,
  createdAt: string
): RuntimeProfileApprovalRecord {
  return {
    id: `${approval.id}:${action}:${createdAt}`,
    approvalId: approval.id,
    action,
    createdAt,
    statusLabel: approval.statusLabel,
    readiness: approval.readiness,
    detail: approval.detail
  };
}

export function appendRuntimeProfileApprovalRecord(
  records: readonly RuntimeProfileApprovalRecord[],
  record: RuntimeProfileApprovalRecord,
  limit = 8
): RuntimeProfileApprovalRecord[] {
  const normalizedLimit = normalizeLimit(limit);

  if (normalizedLimit === 0) {
    return [];
  }

  const deduped: RuntimeProfileApprovalRecord[] = [];
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

export function parseStoredRuntimeProfileApprovalHistory(
  serialized: string | null,
  limit = 8
): RuntimeProfileApprovalRecord[] {
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
    const repaired: RuntimeProfileApprovalRecord[] = [];

    for (const item of parsed) {
      if (!isRuntimeProfileApprovalRecord(item) || seenIds.has(item.id)) {
        continue;
      }

      seenIds.add(item.id);
      repaired.push(item);

      if (repaired.length >= normalizedLimit) {
        break;
      }
    }

    return repaired;
  } catch {
    return [];
  }
}

export function loadRuntimeProfileApprovalHistory(): RuntimeProfileApprovalRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseStoredRuntimeProfileApprovalHistory(readHistoryStorage());
}

export function saveRuntimeProfileApprovalHistory(records: RuntimeProfileApprovalRecord[]): void {
  writeHistoryStorage(records);
}
