import type { PipelineItemDispatchPreview } from "./pipelineItemDispatchPreview";

export type PipelineDispatchRequestAction = "requested" | "cancelled";

export interface PipelineDispatchRequestRecord {
  id: string;
  itemId: string;
  action: PipelineDispatchRequestAction;
  createdAt: string;
  title: string;
  state: PipelineItemDispatchPreview["state"];
  readiness: PipelineItemDispatchPreview["readiness"];
  risk: PipelineItemDispatchPreview["risk"];
  owner: string;
  canDispatch: boolean;
  detail: string;
}

export const PIPELINE_DISPATCH_REQUEST_HISTORY_STORAGE_KEY =
  "steerboard.pipelineDispatchRequestHistory.v1";

const validActions: PipelineDispatchRequestAction[] = ["requested", "cancelled"];
const validStates: PipelineItemDispatchPreview["state"][] = ["ready", "blocked", "review"];
const validRisks: PipelineItemDispatchPreview["risk"][] = ["low", "medium", "high"];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isAction(value: unknown): value is PipelineDispatchRequestAction {
  return validActions.includes(value as PipelineDispatchRequestAction);
}

function isState(value: unknown): value is PipelineItemDispatchPreview["state"] {
  return validStates.includes(value as PipelineItemDispatchPreview["state"]);
}

function isRisk(value: unknown): value is PipelineItemDispatchPreview["risk"] {
  return validRisks.includes(value as PipelineItemDispatchPreview["risk"]);
}

function isPipelineDispatchRequestRecord(
  value: unknown
): value is PipelineDispatchRequestRecord {
  const record = asRecord(value);

  return (
    Boolean(record) &&
    hasNonEmptyString(record!.id) &&
    hasNonEmptyString(record!.itemId) &&
    isAction(record!.action) &&
    hasNonEmptyString(record!.createdAt) &&
    hasNonEmptyString(record!.title) &&
    isState(record!.state) &&
    typeof record!.readiness === "number" &&
    Number.isFinite(record!.readiness) &&
    isRisk(record!.risk) &&
    hasNonEmptyString(record!.owner) &&
    typeof record!.canDispatch === "boolean" &&
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
      PIPELINE_DISPATCH_REQUEST_HISTORY_STORAGE_KEY
    );
    return value === undefined ? null : value;
  } catch {
    return null;
  }
}

function writeHistoryStorage(records: PipelineDispatchRequestRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage?.setItem?.(
      PIPELINE_DISPATCH_REQUEST_HISTORY_STORAGE_KEY,
      JSON.stringify(records)
    );
  } catch {
    return;
  }
}

export function createPipelineDispatchRequestRecord(
  preview: PipelineItemDispatchPreview,
  action: PipelineDispatchRequestAction,
  createdAt: string
): PipelineDispatchRequestRecord {
  return {
    id: `${preview.itemId}:${action}:${createdAt}`,
    itemId: preview.itemId,
    action,
    createdAt,
    title: preview.title,
    state: preview.state,
    readiness: preview.readiness,
    risk: preview.risk,
    owner: preview.owner,
    canDispatch: preview.canDispatch,
    detail: preview.detail
  };
}

export function appendPipelineDispatchRequestRecord(
  records: readonly PipelineDispatchRequestRecord[],
  record: PipelineDispatchRequestRecord,
  limit = 8
): PipelineDispatchRequestRecord[] {
  const normalizedLimit = normalizeLimit(limit);

  if (normalizedLimit === 0) {
    return [];
  }

  const deduped: PipelineDispatchRequestRecord[] = [];
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

export function parseStoredPipelineDispatchRequestHistory(
  serialized: string | null,
  limit = 8
): PipelineDispatchRequestRecord[] {
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
    const repaired: PipelineDispatchRequestRecord[] = [];

    for (const item of parsed) {
      if (!isPipelineDispatchRequestRecord(item) || seenIds.has(item.id)) {
        continue;
      }

      seenIds.add(item.id);

      const repairedRecord: PipelineDispatchRequestRecord = {
        id: item.id,
        itemId: item.itemId,
        action: item.action,
        createdAt: item.createdAt,
        title: item.title,
        state: item.state,
        readiness: item.readiness,
        risk: item.risk,
        owner: item.owner,
        canDispatch: item.canDispatch,
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

export function loadPipelineDispatchRequestHistory():
  PipelineDispatchRequestRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseStoredPipelineDispatchRequestHistory(readHistoryStorage());
}

export function savePipelineDispatchRequestHistory(records: PipelineDispatchRequestRecord[]): void {
  writeHistoryStorage(records);
}
