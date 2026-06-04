import type { ToolEvidenceReadinessSnapshot } from "./toolEvidenceReadiness";

export type ToolEvidenceCaptureRecordAction = "requested" | "cancelled";

export interface ToolEvidenceCaptureRecord {
  id: string;
  readinessId: string;
  action: ToolEvidenceCaptureRecordAction;
  createdAt: string;
  statusLabel: string;
  readiness: number;
  terminalLocked: boolean;
  gitLocked: boolean;
  canCapture: boolean;
  detail: string;
}

export const TOOL_EVIDENCE_CAPTURE_HISTORY_STORAGE_KEY =
  "steerboard.toolEvidenceCaptureHistory.v1";

const validActions: ToolEvidenceCaptureRecordAction[] = ["requested", "cancelled"];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isAction(value: unknown): value is ToolEvidenceCaptureRecordAction {
  return validActions.includes(value as ToolEvidenceCaptureRecordAction);
}

function isToolEvidenceCaptureRecord(
  value: unknown
): value is ToolEvidenceCaptureRecord {
  const record = asRecord(value);

  return (
    Boolean(record) &&
    hasNonEmptyString(record!.id) &&
    hasNonEmptyString(record!.readinessId) &&
    isAction(record!.action) &&
    hasNonEmptyString(record!.createdAt) &&
    hasNonEmptyString(record!.statusLabel) &&
    typeof record!.readiness === "number" &&
    Number.isFinite(record!.readiness) &&
    typeof record!.terminalLocked === "boolean" &&
    typeof record!.gitLocked === "boolean" &&
    typeof record!.canCapture === "boolean" &&
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
    const value = window.localStorage?.getItem?.(
      TOOL_EVIDENCE_CAPTURE_HISTORY_STORAGE_KEY
    );
    return value === undefined ? null : value;
  } catch {
    return null;
  }
}

function writeHistoryStorage(records: ToolEvidenceCaptureRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage?.setItem?.(
      TOOL_EVIDENCE_CAPTURE_HISTORY_STORAGE_KEY,
      JSON.stringify(records)
    );
  } catch {
    return;
  }
}

export function createToolEvidenceCaptureRecord(
  snapshot: ToolEvidenceReadinessSnapshot,
  action: ToolEvidenceCaptureRecordAction,
  createdAt: string
): ToolEvidenceCaptureRecord {
  return {
    id: `${snapshot.id}:${action}:${createdAt}`,
    readinessId: snapshot.id,
    action,
    createdAt,
    statusLabel: snapshot.statusLabel,
    readiness: snapshot.readiness,
    terminalLocked: snapshot.terminalLocked,
    gitLocked: snapshot.gitLocked,
    canCapture: snapshot.canCapture,
    detail: snapshot.detail
  };
}

export function appendToolEvidenceCaptureRecord(
  records: readonly ToolEvidenceCaptureRecord[],
  record: ToolEvidenceCaptureRecord,
  limit = 8
): ToolEvidenceCaptureRecord[] {
  const normalizedLimit = normalizeLimit(limit);

  if (normalizedLimit === 0) {
    return [];
  }

  const deduped: ToolEvidenceCaptureRecord[] = [];
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

export function parseStoredToolEvidenceCaptureHistory(
  serialized: string | null,
  limit = 8
): ToolEvidenceCaptureRecord[] {
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
    const repaired: ToolEvidenceCaptureRecord[] = [];

    for (const item of parsed) {
      if (!isToolEvidenceCaptureRecord(item) || seenIds.has(item.id)) {
        continue;
      }

      seenIds.add(item.id);

      const repairedRecord: ToolEvidenceCaptureRecord = {
        id: item.id,
        readinessId: item.readinessId,
        action: item.action,
        createdAt: item.createdAt,
        statusLabel: item.statusLabel,
        readiness: item.readiness,
        terminalLocked: item.terminalLocked,
        gitLocked: item.gitLocked,
        canCapture: item.canCapture,
        detail: item.detail
      };

      repaired.push(repairedRecord);

      if (repaired.length >= normalizedLimit) {
        break;
      }
    }

    return repaired;
  } catch {
    return [];
  }
}

export function loadToolEvidenceCaptureHistory(): ToolEvidenceCaptureRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseStoredToolEvidenceCaptureHistory(readHistoryStorage());
}

export function saveToolEvidenceCaptureHistory(records: ToolEvidenceCaptureRecord[]): void {
  writeHistoryStorage(records);
}
