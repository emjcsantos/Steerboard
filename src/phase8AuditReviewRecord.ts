import type {
  Phase8PermissionAuditDepthSnapshot,
  Phase8PermissionAuditDepthState
} from "./phase8PermissionAuditDepth";
import type {
  Phase8RiskBlockerPriorityKind,
  Phase8RiskBlockerPriorityState,
  Phase8RiskBlockerPrioritySummary
} from "./phase8RiskBlockerPriority";

export interface Phase8AuditReviewRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly state: Phase8PermissionAuditDepthState;
  readonly readiness: number;
  readonly auditRecordCount: number;
  readonly openExceptionCount: number;
  readonly disabledPathCount: number;
  readonly mutationLocked: boolean;
  readonly auditEvidenceFingerprint?: string;
  readonly topBlockerLabel?: string;
  readonly topBlockerSourceId?: string;
  readonly topBlockerKind?: Phase8RiskBlockerPriorityKind | "none";
  readonly topBlockerStatus?: Phase8RiskBlockerPriorityState | "ready";
  readonly topBlockerAction?: string;
  readonly rollbackEvidence: string;
  readonly detail: string;
}

export const PHASE8_AUDIT_REVIEW_RECORD_STORAGE_KEY =
  "steerboard.phase8.auditReviewRecord.v1";

const VALID_STATES: readonly Phase8PermissionAuditDepthState[] = [
  "ready",
  "review",
  "blocked",
  "waiting"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeState(value: unknown): Phase8PermissionAuditDepthState | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toLowerCase();
  return VALID_STATES.includes(normalized as Phase8PermissionAuditDepthState)
    ? (normalized as Phase8PermissionAuditDepthState)
    : undefined;
}

function clampPercent(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeCount(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.floor(value));
}

function publicText(value: string | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  const sanitized = value
    .replace(/[A-Za-z]:[\\/][^\s]+/g, "local path")
    .replace(/[\\/](Users|Projects|Documents|Desktop)[\\/][^\s]+/gi, "local path")
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "redacted token")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.length > 0 ? sanitized : fallback;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function shortHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function isOwnerAuditReviewEvidence(id: string): boolean {
  return id.includes("owner-audit-review");
}

export function buildPhase8AuditEvidenceFingerprint(
  snapshot: Phase8PermissionAuditDepthSnapshot
): string {
  const payload = {
    riskyActionCount: snapshot.riskyActionCount,
    auditRecordCount: snapshot.auditRecordCount,
    items: snapshot.items
      .filter((item) => !isOwnerAuditReviewEvidence(item.id))
      .map((item) => ({
        id: item.id,
        label: item.label,
        kind: item.kind,
        status: item.status,
        pmTaskId: item.pmTaskId,
        evidenceKey: item.evidenceKey,
        detail: item.detail,
        nextAction: item.nextAction
      })),
    exceptions: snapshot.exceptions
      .filter((exception) => !isOwnerAuditReviewEvidence(exception.id))
      .map((exception) => ({
        id: exception.id,
        label: exception.label,
        severity: exception.severity,
        status: exception.status,
        disabledPath: exception.disabledPath,
        evidenceRequired: exception.evidenceRequired,
        rollbackExpectation: exception.rollbackExpectation,
        auditSource: exception.auditSource,
        pmTaskId: exception.pmTaskId,
        evidenceKey: exception.evidenceKey
      }))
  };

  return `phase8-audit-${shortHash(stableJson(payload))}`;
}

function readStorage(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(PHASE8_AUDIT_REVIEW_RECORD_STORAGE_KEY);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeStorage(record: Phase8AuditReviewRecord): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(
      PHASE8_AUDIT_REVIEW_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
  } catch {
    return;
  }
}

export function clearPhase8AuditReviewRecord(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem?.(PHASE8_AUDIT_REVIEW_RECORD_STORAGE_KEY);
  } catch {
    return;
  }
}

export function parseStoredPhase8AuditReviewRecord(
  serialized: string | null
): Phase8AuditReviewRecord | undefined {
  if (!serialized) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return undefined;
    }

    const state = normalizeState(parsed.state);
    const readiness = clampPercent(parsed.readiness);
    const auditRecordCount = normalizeCount(parsed.auditRecordCount);
    const openExceptionCount = normalizeCount(parsed.openExceptionCount);
    const disabledPathCount = normalizeCount(parsed.disabledPathCount);

    if (
      !nonEmptyString(parsed.id) ||
      !nonEmptyString(parsed.createdAt) ||
      !state ||
      readiness === undefined ||
      auditRecordCount === undefined ||
      openExceptionCount === undefined ||
      disabledPathCount === undefined ||
      typeof parsed.mutationLocked !== "boolean" ||
      !nonEmptyString(parsed.rollbackEvidence)
    ) {
      return undefined;
    }

    return {
      id: parsed.id.trim(),
      createdAt: parsed.createdAt.trim(),
      state,
      readiness,
      auditRecordCount,
      openExceptionCount,
      disabledPathCount,
      mutationLocked: parsed.mutationLocked,
      auditEvidenceFingerprint: publicText(
        nonEmptyString(parsed.auditEvidenceFingerprint)
          ? parsed.auditEvidenceFingerprint
          : undefined,
        ""
      ),
      topBlockerLabel: nonEmptyString(parsed.topBlockerLabel)
        ? publicText(parsed.topBlockerLabel, "")
        : undefined,
      topBlockerSourceId: nonEmptyString(parsed.topBlockerSourceId)
        ? publicText(parsed.topBlockerSourceId, "")
        : undefined,
      topBlockerKind: nonEmptyString(parsed.topBlockerKind)
        ? publicText(parsed.topBlockerKind, "") as Phase8RiskBlockerPriorityKind | "none"
        : undefined,
      topBlockerStatus: nonEmptyString(parsed.topBlockerStatus)
        ? publicText(parsed.topBlockerStatus, "") as Phase8RiskBlockerPriorityState | "ready"
        : undefined,
      topBlockerAction: nonEmptyString(parsed.topBlockerAction)
        ? publicText(parsed.topBlockerAction, "")
        : undefined,
      rollbackEvidence: publicText(
        parsed.rollbackEvidence,
        "Rollback evidence remains required before mutation paths can unlock."
      ),
      detail: publicText(
        nonEmptyString(parsed.detail) ? parsed.detail : undefined,
        "Phase 8 owner audit review record is available."
      )
    };
  } catch {
    return undefined;
  }
}

export function loadPhase8AuditReviewRecord(): Phase8AuditReviewRecord | undefined {
  return parseStoredPhase8AuditReviewRecord(readStorage());
}

export function createPhase8AuditReviewRecord(
  snapshot: Phase8PermissionAuditDepthSnapshot,
  createdAt: string,
  blockerPriority?: Phase8RiskBlockerPrioritySummary
): Phase8AuditReviewRecord {
  const ownerReviewMissingOnly =
    snapshot.items.some(
      (item) =>
        item.id === "phase-08-permission-audit-depth:owner-audit-review" &&
        item.status === "waiting"
    ) &&
    snapshot.blockedCount === 0 &&
    snapshot.reviewCount === 0 &&
    snapshot.waitingCount === 1;
  const openExceptionCount = ownerReviewMissingOnly
    ? Math.max(0, snapshot.openExceptionCount - 1)
    : snapshot.openExceptionCount;
  const state = ownerReviewMissingOnly ? "ready" : snapshot.state;
  const readiness = ownerReviewMissingOnly ? 100 : snapshot.readiness;

  return {
    id: `phase8-audit-review:${createdAt}`,
    createdAt,
    state,
    readiness,
    auditRecordCount: snapshot.auditRecordCount,
    openExceptionCount,
    disabledPathCount: snapshot.disabledPathCount,
    mutationLocked: true,
    auditEvidenceFingerprint: buildPhase8AuditEvidenceFingerprint(snapshot),
    topBlockerLabel: blockerPriority?.topPriorityLabel,
    topBlockerSourceId: blockerPriority?.topPrioritySourceId,
    topBlockerKind: blockerPriority?.topPriorityKind,
    topBlockerStatus: blockerPriority?.topPriorityStatus,
    topBlockerAction: blockerPriority?.topPriorityAction,
    rollbackEvidence:
      "Runtime, profile, terminal, Git, MCP, plugin, automation, and external-service mutation paths remain locked; rollback evidence is required before future executed or failed mutation records can advance.",
    detail: publicText(
      `Owner-reviewed Phase 8 audit depth recorded locally at ${readiness}% readiness with ${openExceptionCount} open exceptions; mutation paths remain locked.`,
      "Phase 8 owner audit review record is available."
    )
  };
}

export function savePhase8AuditReviewRecord(record: Phase8AuditReviewRecord): void {
  writeStorage({
    ...record,
    auditEvidenceFingerprint: publicText(record.auditEvidenceFingerprint, ""),
    topBlockerLabel: record.topBlockerLabel
      ? publicText(record.topBlockerLabel, "")
      : undefined,
    topBlockerSourceId: record.topBlockerSourceId
      ? publicText(record.topBlockerSourceId, "")
      : undefined,
    topBlockerKind: record.topBlockerKind
      ? publicText(record.topBlockerKind, "") as Phase8RiskBlockerPriorityKind | "none"
      : undefined,
    topBlockerStatus: record.topBlockerStatus
      ? publicText(record.topBlockerStatus, "") as Phase8RiskBlockerPriorityState | "ready"
      : undefined,
    topBlockerAction: record.topBlockerAction
      ? publicText(record.topBlockerAction, "")
      : undefined,
    rollbackEvidence: publicText(
      record.rollbackEvidence,
      "Rollback evidence remains required before mutation paths can unlock."
    ),
    detail: publicText(record.detail, "Phase 8 owner audit review record is available.")
  });
}
