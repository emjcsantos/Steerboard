import type { RuntimeExecutionAuditSnapshot } from "./runtimeExecutionAudit";

export type RuntimeExecutionAuditRecordAction = "requested" | "cancelled";

export interface RuntimeExecutionAuditRecord {
  id: string;
  auditId: string;
  action: RuntimeExecutionAuditRecordAction;
  createdAt: string;
  statusLabel: string;
  eventCount: number;
  transport: string;
  executionLocked: boolean;
  detail: string;
}

export const EXECUTION_AUDIT_HISTORY_STORAGE_KEY =
  "steerboard.runtimeExecutionAuditHistory";

const validActions: RuntimeExecutionAuditRecordAction[] = ["requested", "cancelled"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isAction(value: unknown): value is RuntimeExecutionAuditRecordAction {
  return validActions.includes(value as RuntimeExecutionAuditRecordAction);
}

function normalizeLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit) || Number.isNaN(limit)) {
    return 8;
  }

  const normalizedLimit = Math.floor(limit);
  return normalizedLimit < 0 ? 0 : normalizedLimit;
}

function isRuntimeExecutionAuditRecord(value: unknown): value is RuntimeExecutionAuditRecord {
  return (
    isRecord(value) &&
    hasNonEmptyString(value.id) &&
    hasNonEmptyString(value.auditId) &&
    isAction(value.action) &&
    hasNonEmptyString(value.createdAt) &&
    hasNonEmptyString(value.statusLabel) &&
    typeof value.eventCount === "number" &&
    Number.isFinite(value.eventCount) &&
    hasNonEmptyString(value.transport) &&
    typeof value.executionLocked === "boolean" &&
    hasNonEmptyString(value.detail)
  );
}

export function createRuntimeExecutionAuditRecord(
  audit: RuntimeExecutionAuditSnapshot,
  action: RuntimeExecutionAuditRecordAction,
  createdAt: string
): RuntimeExecutionAuditRecord {
  return {
    id: `${audit.id}:${action}:${createdAt}`,
    auditId: audit.id,
    action,
    createdAt,
    statusLabel: audit.statusLabel,
    eventCount: audit.eventCount,
    transport: audit.transport,
    executionLocked: audit.executionLocked,
    detail: audit.detail
  };
}

export function appendRuntimeExecutionAuditRecord(
  records: readonly RuntimeExecutionAuditRecord[],
  record: RuntimeExecutionAuditRecord,
  limit = 8
): RuntimeExecutionAuditRecord[] {
  const normalizedLimit = normalizeLimit(limit);

  if (normalizedLimit === 0) {
    return [];
  }

  const deduped: RuntimeExecutionAuditRecord[] = [];
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

export function parseStoredRuntimeExecutionAuditHistory(
  serialized: string | null,
  limit = 8
): RuntimeExecutionAuditRecord[] {
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
    const repaired: RuntimeExecutionAuditRecord[] = [];

    for (const item of parsed) {
      if (!isRuntimeExecutionAuditRecord(item) || seenIds.has(item.id)) {
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

export function loadRuntimeExecutionAuditHistory(): RuntimeExecutionAuditRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseStoredRuntimeExecutionAuditHistory(
    window.localStorage.getItem(EXECUTION_AUDIT_HISTORY_STORAGE_KEY)
  );
}

export function saveRuntimeExecutionAuditHistory(records: RuntimeExecutionAuditRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    EXECUTION_AUDIT_HISTORY_STORAGE_KEY,
    JSON.stringify(records)
  );
}
