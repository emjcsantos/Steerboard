import type {
  Phase8PermissionAuditDepthSnapshot,
  Phase8PermissionAuditDepthState
} from "./phase8PermissionAuditDepth";

export interface Phase8AuditReviewRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly state: Phase8PermissionAuditDepthState;
  readonly readiness: number;
  readonly auditRecordCount: number;
  readonly openExceptionCount: number;
  readonly disabledPathCount: number;
  readonly mutationLocked: boolean;
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
  createdAt: string
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
    rollbackEvidence: publicText(
      record.rollbackEvidence,
      "Rollback evidence remains required before mutation paths can unlock."
    ),
    detail: publicText(record.detail, "Phase 8 owner audit review record is available.")
  });
}
