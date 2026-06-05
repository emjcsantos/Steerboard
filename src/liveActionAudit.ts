export type LiveActionAuditAction =
  | "requested"
  | "approved"
  | "denied"
  | "executed"
  | "failed"
  | "timed-out"
  | "cancelled";

export type LiveActionRiskLevel = "low" | "medium" | "high";

export interface LiveActionAuditRecord {
  id: string;
  action: LiveActionAuditAction;
  what: string;
  why: string;
  provider: string;
  workspace: string;
  service: string;
  resultSummary: string;
  timestamp: string;
  risk: LiveActionRiskLevel;
  rawTranscript?: string[];
}

export interface LiveActionAuditRecordInput {
  what: string;
  why: string;
  provider: string;
  workspace: string;
  service: string;
  resultSummary: string;
  risk: LiveActionRiskLevel;
}

export const LIVE_ACTION_AUDIT_STORAGE_KEY =
  "steerboard.liveActionAudit.v1";

const validActions: LiveActionAuditAction[] = [
  "requested",
  "approved",
  "denied",
  "executed",
  "failed",
  "timed-out",
  "cancelled"
];

const validRiskLevels: LiveActionRiskLevel[] = ["low", "medium", "high"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return 8;
  }

  const normalizedLimit = Math.floor(limit);
  return normalizedLimit <= 0 ? 0 : normalizedLimit;
}

function isValidAction(value: unknown): value is LiveActionAuditAction {
  return validActions.includes(value as LiveActionAuditAction);
}

function isValidRisk(value: unknown): value is LiveActionRiskLevel {
  return validRiskLevels.includes(value as LiveActionRiskLevel);
}

function isValidTimestamp(value: unknown): value is string {
  if (!hasNonEmptyString(value)) {
    return false;
  }

  const parsedTime = Date.parse(value);
  return Number.isFinite(parsedTime);
}

function safeString(value: unknown, fallback: string): string {
  return hasNonEmptyString(value) ? value.trim() : fallback;
}

function safeRisk(value: unknown): LiveActionRiskLevel {
  return isValidRisk(value) ? value : "low";
}

function safeTimestamp(value: unknown): string {
  return isValidTimestamp(value) ? value : "1970-01-01T00:00:00.000Z";
}

function normalizeTranscript(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => hasNonEmptyString(entry));
}

export function repairLiveActionAuditRecord(
  value: unknown,
  fallbackAction: LiveActionAuditAction = "requested",
  sequence = 0
): LiveActionAuditRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const action = isValidAction(value.action) ? value.action : fallbackAction;
  const safeProvider = safeString(value.provider, "provider-unknown");
  const safeWorkspace = safeString(value.workspace, "workspace-unknown");
  const safeService = safeString(value.service, "service-unknown");
  const safeTimestampValue = safeTimestamp(value.timestamp);
  const safeWhat = safeString(value.what, "Unknown action");
  const safeWhy = safeString(value.why, "No reason provided.");
  const safeResultSummary = safeString(value.resultSummary, "No result summary.");

  const idCandidate = safeString(value.id, "");
  const id = idCandidate.length > 0
    ? idCandidate
    : `${safeProvider}:${safeService}:${action}:${safeTimestampValue}:${sequence}`;

  return {
    id,
    action,
    what: safeWhat,
    why: safeWhy,
    provider: safeProvider,
    workspace: safeWorkspace,
    service: safeService,
    resultSummary: safeResultSummary,
    timestamp: safeTimestampValue,
    risk: safeRisk(value.risk),
    rawTranscript: normalizeTranscript(value.rawTranscript)
  };
}

export function createLiveActionAuditRecord(
  input: LiveActionAuditRecordInput,
  action: LiveActionAuditAction,
  timestamp: string,
  rawTranscript?: readonly string[]
): LiveActionAuditRecord {
  return {
    id: `${safeString(input.provider, "provider-unknown")}:${safeString(
      input.service,
      "service-unknown"
    )}:${action}:${timestamp}`,
    action,
    what: input.what,
    why: input.why,
    provider: input.provider,
    workspace: input.workspace,
    service: input.service,
    resultSummary: input.resultSummary,
    timestamp,
    risk: input.risk,
    rawTranscript: rawTranscript ? [...rawTranscript] : undefined
  };
}

export function appendLiveActionAuditRecord(
  records: readonly LiveActionAuditRecord[],
  record: LiveActionAuditRecord,
  limit = 8
): LiveActionAuditRecord[] {
  const normalizedLimit = normalizeLimit(limit);

  if (normalizedLimit === 0) {
    return [];
  }

  const deduped: LiveActionAuditRecord[] = [];
  const seenIds = new Set<string>();

  for (const nextRecord of [record, ...records]) {
    if (seenIds.has(nextRecord.id)) {
      continue;
    }

    seenIds.add(nextRecord.id);
    deduped.push({
      ...nextRecord,
      rawTranscript: nextRecord.rawTranscript
        ? [...nextRecord.rawTranscript]
        : undefined
    });

    if (deduped.length >= normalizedLimit) {
      break;
    }
  }

  return deduped;
}

export function parseStoredLiveActionAuditRecords(
  serialized: string | null,
  limit = 8
): LiveActionAuditRecord[] {
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
    const repaired: LiveActionAuditRecord[] = [];

    parsed.forEach((item, index) => {
      const repairedRecord = repairLiveActionAuditRecord(item, "requested", index);

      if (!repairedRecord) {
        return;
      }

      if (seenIds.has(repairedRecord.id)) {
        return;
      }

      seenIds.add(repairedRecord.id);
      repaired.push(repairedRecord);

      if (repaired.length >= normalizedLimit) {
        return;
      }
    });

    return repaired.slice(0, normalizedLimit);
  } catch {
    return [];
  }
}

function readHistoryStorage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage?.getItem?.(LIVE_ACTION_AUDIT_STORAGE_KEY);
    return value === undefined ? null : value;
  } catch {
    return null;
  }
}

function writeHistoryStorage(records: LiveActionAuditRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage?.setItem?.(
      LIVE_ACTION_AUDIT_STORAGE_KEY,
      JSON.stringify(records)
    );
  } catch {
    return;
  }
}

export function loadLiveActionAuditRecords(
  limit = 8
): LiveActionAuditRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseStoredLiveActionAuditRecords(readHistoryStorage(), limit);
}

export function saveLiveActionAuditRecords(
  records: LiveActionAuditRecord[]
): void {
  writeHistoryStorage([...records]);
}

function sanitizePathTokens(value: string): string {
  return value
    .replace(
      /(?:[A-Za-z]:[\\/][^\s"'`]+|\\{2,}[^\s"'`]+|\/[^\s"'`]+)/g,
      "[redacted path]"
    );
}

function sanitizeSecretAssignments(value: string): string {
  return value
    .replace(
      /(\b(?:authorization|bearer|api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|cookie|session[_-]?token)\s*[:=]\s*)[^\s,;"'`]+/gi,
      "$1[redacted]"
    )
    .replace(
      /(?:\bsk-[A-Za-z0-9]{10,}\b|\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{10,}\b|\bya29\.[\w-]+\b)/g,
      "[redacted token]"
    );
}

function sanitizeForExport(value: string): string {
  return sanitizePathTokens(sanitizeSecretAssignments(value)).trim();
}

export function buildLiveActionAuditExportMarkdown(
  records: readonly LiveActionAuditRecord[],
  limit = 8
): string {
  const normalizedLimit = normalizeLimit(limit);
  const safeLimit = Math.max(0, normalizedLimit);
  const lines: string[] = ["# Live Action Audit", "", "## Entries"];

  for (const record of records.slice(0, safeLimit)) {
    const exportRecord = {
      what: sanitizeForExport(record.what),
      why: sanitizeForExport(record.why),
      provider: sanitizeForExport(record.provider),
      workspace: sanitizeForExport(record.workspace),
      service: sanitizeForExport(record.service),
      resultSummary: sanitizeForExport(record.resultSummary),
      timestamp: sanitizeForExport(record.timestamp),
      risk: sanitizeForExport(record.risk),
      action: sanitizeForExport(record.action)
    };

    lines.push(`### ${exportRecord.action} at ${exportRecord.timestamp}`);
    lines.push(`- what: ${exportRecord.what}`);
    lines.push(`- why: ${exportRecord.why}`);
    lines.push(`- provider: ${exportRecord.provider}`);
    lines.push(`- workspace: ${exportRecord.workspace}`);
    lines.push(`- service: ${exportRecord.service}`);
    lines.push(`- resultSummary: ${exportRecord.resultSummary}`);
    lines.push(`- risk: ${exportRecord.risk}`);
    lines.push("");
  }

  return lines.join("\n");
}
