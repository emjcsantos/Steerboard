import type { Phase4RefreshSafetyDepthSummary } from "./phase4RefreshSafetyDepth";

export type Phase4ProviderApprovalRecordState = "ready" | "review" | "blocked" | "preview";

export interface Phase4ProviderApprovalRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly state: Phase4ProviderApprovalRecordState;
  readonly catalogFingerprint: string;
  readonly detail: string;
}

export interface Phase4ProviderApprovalRecordValidation {
  readonly state: Phase4ProviderApprovalRecordState;
  readonly detail: string;
  readonly nextAction: string;
  readonly expectedCatalogFingerprint?: string;
  readonly recordCatalogFingerprint?: string;
  readonly recordAgeMs?: number;
  readonly maxRecordAgeMs: number;
  readonly matchesCurrentCatalog: boolean;
  readonly refreshSafetyReady: boolean;
  readonly refreshSafetyProof: string;
}

export interface Phase4ProviderApprovalRecordValidationOptions {
  readonly evaluatedAt?: string | Date;
  readonly maxRecordAgeMs?: number;
}

export const PHASE4_PROVIDER_APPROVAL_RECORD_STORAGE_KEY =
  "steerboard.phase4.providerApprovalRecord.v1";
export const DEFAULT_PHASE4_PROVIDER_APPROVAL_RECORD_MAX_AGE_MS =
  24 * 60 * 60 * 1000;

const VALID_STATES: Phase4ProviderApprovalRecordState[] = [
  "ready",
  "review",
  "blocked",
  "preview"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function publicText(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
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

function normalizeState(value: unknown): Phase4ProviderApprovalRecordState | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toLowerCase();
  return VALID_STATES.includes(normalized as Phase4ProviderApprovalRecordState)
    ? (normalized as Phase4ProviderApprovalRecordState)
    : undefined;
}

function toTimestamp(value: string | Date | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function recordAgeMs(
  record: Phase4ProviderApprovalRecord,
  evaluatedAt: string | Date | undefined
): number | undefined {
  const evaluatedAtMs = toTimestamp(evaluatedAt);
  const createdAtMs = toTimestamp(record.createdAt);

  return evaluatedAtMs !== undefined && createdAtMs !== undefined
    ? evaluatedAtMs - createdAtMs
    : undefined;
}

function refreshSafetyReady(refreshSafety: Phase4RefreshSafetyDepthSummary): boolean {
  return refreshSafety.blockedCount === 0 && refreshSafety.previewCount === 0;
}

function refreshSafetyProof(refreshSafety: Phase4RefreshSafetyDepthSummary): string {
  const ready = refreshSafetyReady(refreshSafety);

  return (
    `refreshSafety=${ready ? "ready" : "review"} ` +
    `ready=${refreshSafety.readyCount} preview=${refreshSafety.previewCount} blocked=${refreshSafety.blockedCount}`
  );
}

function readStorage(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(PHASE4_PROVIDER_APPROVAL_RECORD_STORAGE_KEY);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeStorage(record: Phase4ProviderApprovalRecord): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(
      PHASE4_PROVIDER_APPROVAL_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
  } catch {
    return;
  }
}

export function createPhase4ProviderApprovalRecord(input: {
  readonly catalogFingerprint: string;
  readonly createdAt: string;
  readonly detail?: string;
}): Phase4ProviderApprovalRecord {
  return {
    id: `phase4-provider-approval:${input.createdAt}`,
    createdAt: input.createdAt,
    state: "ready",
    catalogFingerprint: publicText(input.catalogFingerprint, "missing"),
    detail: publicText(
      input.detail,
      "Owner approved Phase 4 provider metadata review while provider execution remains locked."
    )
  };
}

export function parseStoredPhase4ProviderApprovalRecord(
  serialized: string | null
): Phase4ProviderApprovalRecord | undefined {
  if (!serialized) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return undefined;
    }

    const state = normalizeState(parsed.state);
    if (
      !nonEmptyString(parsed.id) ||
      !nonEmptyString(parsed.createdAt) ||
      !state ||
      !nonEmptyString(parsed.catalogFingerprint)
    ) {
      return undefined;
    }

    return {
      id: parsed.id.trim(),
      createdAt: parsed.createdAt.trim(),
      state,
      catalogFingerprint: publicText(parsed.catalogFingerprint, "missing"),
      detail: publicText(
        parsed.detail,
        "Owner approved Phase 4 provider metadata review while provider execution remains locked."
      )
    };
  } catch {
    return undefined;
  }
}

export function loadPhase4ProviderApprovalRecord():
  | Phase4ProviderApprovalRecord
  | undefined {
  return parseStoredPhase4ProviderApprovalRecord(readStorage());
}

export function savePhase4ProviderApprovalRecord(
  record: Phase4ProviderApprovalRecord
): void {
  writeStorage({
    ...record,
    detail: publicText(
      record.detail,
      "Owner approved Phase 4 provider metadata review while provider execution remains locked."
    )
  });
}

export function clearPhase4ProviderApprovalRecord(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem?.(PHASE4_PROVIDER_APPROVAL_RECORD_STORAGE_KEY);
  } catch {
    return;
  }
}

export function derivePhase4ProviderApprovalRecordValidation(input: {
  readonly record?: Phase4ProviderApprovalRecord;
  readonly expectedCatalogFingerprint?: string;
  readonly refreshSafety: Phase4RefreshSafetyDepthSummary;
  readonly options?: Phase4ProviderApprovalRecordValidationOptions;
}): Phase4ProviderApprovalRecordValidation {
  const maxRecordAgeMs =
    input.options?.maxRecordAgeMs ??
    DEFAULT_PHASE4_PROVIDER_APPROVAL_RECORD_MAX_AGE_MS;
  const isRefreshSafetyReady = refreshSafetyReady(input.refreshSafety);
  const refreshProof = refreshSafetyProof(input.refreshSafety);

  if (!input.record) {
    return {
      state: "preview",
      detail: "Provider approval record is not attached yet.",
      nextAction:
        "Record owner approval after current six-surface catalog smoke proof is fresh and fingerprint-matched.",
      expectedCatalogFingerprint: input.expectedCatalogFingerprint,
      maxRecordAgeMs,
      matchesCurrentCatalog: false,
      refreshSafetyReady: isRefreshSafetyReady,
      refreshSafetyProof: refreshProof
    };
  }

  const ageMs = recordAgeMs(input.record, input.options?.evaluatedAt);
  const matchesCurrentCatalog =
    Boolean(input.expectedCatalogFingerprint) &&
    input.record.catalogFingerprint === input.expectedCatalogFingerprint;
  const base = {
    expectedCatalogFingerprint: input.expectedCatalogFingerprint,
    recordCatalogFingerprint: input.record.catalogFingerprint,
    ...(ageMs !== undefined ? { recordAgeMs: ageMs } : {}),
    maxRecordAgeMs,
    matchesCurrentCatalog,
    refreshSafetyReady: isRefreshSafetyReady,
    refreshSafetyProof: refreshProof
  };

  if (!input.expectedCatalogFingerprint) {
    return {
      state: "review",
      detail:
        "Provider approval record cannot be trusted because the current catalog fingerprint is missing.",
      nextAction: "Attach the current six-surface catalog fingerprint before provider approval.",
      ...base
    };
  }

  if (!matchesCurrentCatalog) {
    return {
      state: "review",
      detail:
        "Provider approval record does not match the current six-surface catalog fingerprint.",
      nextAction:
        "Clear and record provider approval again after the current catalog smoke proof is attached.",
      ...base
    };
  }

  if (!isRefreshSafetyReady) {
    return {
      state: "review",
      detail:
        "Provider approval record is held until refresh safety proof is ready and fingerprint-matched.",
      nextAction: input.refreshSafety.nextAction,
      ...base
    };
  }

  if (ageMs === undefined) {
    return {
      state: "review",
      detail:
        "Provider approval record cannot be freshness-checked without the current evaluation timestamp.",
      nextAction: "Review provider approval with the current Phase 4 evaluation time.",
      ...base
    };
  }

  if (ageMs < 0 || ageMs > maxRecordAgeMs) {
    return {
      state: "review",
      detail:
        "Provider approval record is stale or future-dated and must be recorded again.",
      nextAction: "Clear and record provider approval again from current Phase 4 evidence.",
      ...base
    };
  }

  if (input.record.state !== "ready") {
    return {
      state: "review",
      detail:
        "Provider approval record is attached but is not ready for the current Phase 4 evidence.",
      nextAction: "Clear and record provider approval again from current Phase 4 evidence.",
      ...base
    };
  }

  return {
    state: "ready",
    detail:
      "Provider approval record matches the current catalog fingerprint and fresh refresh-safety proof.",
    nextAction:
      "Keep provider approval attached while audit, rollback, permission, and execution locks remain held.",
    ...base
  };
}
