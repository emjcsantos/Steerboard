import type {
  Phase4ProviderApprovalRecord,
  Phase4ProviderApprovalRecordValidation,
  Phase4ProviderApprovalRecordState
} from "./phase4ProviderApprovalRecord";
import type { Phase4ProviderSurfaceDepthSnapshot } from "./phase4ProviderSurfaceDepth";

export type Phase4ProviderAuditRecordState = Phase4ProviderApprovalRecordState;

export interface Phase4ProviderAuditRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly state: Phase4ProviderAuditRecordState;
  readonly catalogFingerprint: string;
  readonly approvalRecordId: string;
  readonly auditEvidenceFingerprint: string;
  readonly mutationLocked: boolean;
  readonly detail: string;
}

export interface Phase4ProviderAuditRecordValidation {
  readonly state: Phase4ProviderAuditRecordState;
  readonly detail: string;
  readonly nextAction: string;
  readonly expectedCatalogFingerprint?: string;
  readonly recordCatalogFingerprint?: string;
  readonly expectedApprovalRecordId?: string;
  readonly recordApprovalRecordId?: string;
  readonly expectedAuditEvidenceFingerprint?: string;
  readonly recordAuditEvidenceFingerprint?: string;
  readonly recordAgeMs?: number;
  readonly maxRecordAgeMs: number;
  readonly matchesCurrentCatalog: boolean;
  readonly matchesCurrentApproval: boolean;
  readonly matchesCurrentAuditEvidence: boolean;
  readonly mutationLocked: boolean;
  readonly auditChainProof: string;
}

export interface Phase4ProviderAuditRecordValidationOptions {
  readonly evaluatedAt?: string | Date;
  readonly maxRecordAgeMs?: number;
}

export const PHASE4_PROVIDER_AUDIT_RECORD_STORAGE_KEY =
  "steerboard.phase4.providerAuditRecord.v1";
export const DEFAULT_PHASE4_PROVIDER_AUDIT_RECORD_MAX_AGE_MS =
  24 * 60 * 60 * 1000;

const VALID_STATES: Phase4ProviderAuditRecordState[] = [
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

function normalizeState(value: unknown): Phase4ProviderAuditRecordState | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toLowerCase();
  return VALID_STATES.includes(normalized as Phase4ProviderAuditRecordState)
    ? (normalized as Phase4ProviderAuditRecordState)
    : undefined;
}

function toTimestamp(value: string | Date | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
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

function valueOrMissing(value: string | undefined): string {
  return value ?? "missing";
}

function auditChainProof(input: {
  readonly record?: Phase4ProviderAuditRecord;
  readonly approvalRecord?: Phase4ProviderApprovalRecord;
  readonly approvalValidation: Phase4ProviderApprovalRecordValidation;
  readonly expectedCatalogFingerprint?: string;
  readonly expectedAuditEvidenceFingerprint?: string;
  readonly matchesCurrentCatalog: boolean;
  readonly matchesCurrentApproval: boolean;
  readonly matchesCurrentAuditEvidence: boolean;
}): string {
  return (
    `approval=${valueOrMissing(input.record?.approvalRecordId)} ` +
    `expectedApproval=${valueOrMissing(input.approvalRecord?.id)} ` +
    `approvalValidation=${input.approvalValidation.state} ` +
    `approvalChain=${input.approvalValidation.approvalChainProof.trim() ? "present" : "missing"} ` +
    `catalog=${valueOrMissing(input.record?.catalogFingerprint)} ` +
    `expectedCatalog=${valueOrMissing(input.expectedCatalogFingerprint)} ` +
    `auditEvidence=${valueOrMissing(input.record?.auditEvidenceFingerprint)} ` +
    `expectedAuditEvidence=${valueOrMissing(input.expectedAuditEvidenceFingerprint)} ` +
    `approvalMatch=${input.matchesCurrentApproval ? "matched" : "review"} ` +
    `catalogMatch=${input.matchesCurrentCatalog ? "matched" : "review"} ` +
    `auditMatch=${input.matchesCurrentAuditEvidence ? "matched" : "review"} ` +
    `mutation=${input.record?.mutationLocked ? "locked" : "review"} execution=locked`
  );
}

export function buildPhase4ProviderAuditEvidenceFingerprint(
  snapshot: Phase4ProviderSurfaceDepthSnapshot
): string {
  const payload = {
    readiness: snapshot.readiness,
    items: snapshot.items
      .filter((item) => item.kind !== "audit-gate")
      .map((item) => ({
        id: item.id,
        label: item.label,
        kind: item.kind,
        status: item.status,
        evidenceKey: item.evidenceKey,
        detail: item.detail,
        nextAction: item.nextAction
      }))
  };

  return `phase4-provider-audit-${shortHash(stableJson(payload))}`;
}

function recordAgeMs(
  record: Phase4ProviderAuditRecord,
  evaluatedAt: string | Date | undefined
): number | undefined {
  const evaluatedAtMs = toTimestamp(evaluatedAt);
  const createdAtMs = toTimestamp(record.createdAt);

  return evaluatedAtMs !== undefined && createdAtMs !== undefined
    ? evaluatedAtMs - createdAtMs
    : undefined;
}

function readStorage(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(PHASE4_PROVIDER_AUDIT_RECORD_STORAGE_KEY);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeStorage(record: Phase4ProviderAuditRecord): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(
      PHASE4_PROVIDER_AUDIT_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
  } catch {
    return;
  }
}

export function createPhase4ProviderAuditRecord(input: {
  readonly approvalRecord: Phase4ProviderApprovalRecord;
  readonly auditEvidenceFingerprint: string;
  readonly catalogFingerprint: string;
  readonly createdAt: string;
  readonly detail?: string;
}): Phase4ProviderAuditRecord {
  return {
    id: `phase4-provider-audit:${input.createdAt}`,
    createdAt: input.createdAt,
    state: "ready",
    catalogFingerprint: publicText(input.catalogFingerprint, "missing"),
    approvalRecordId: publicText(input.approvalRecord.id, "missing-approval-record"),
    auditEvidenceFingerprint: publicText(input.auditEvidenceFingerprint, "missing-audit-evidence"),
    mutationLocked: true,
    detail: publicText(
      input.detail,
      "Owner reviewed Phase 4 provider audit evidence while provider execution remains locked."
    )
  };
}

export function parseStoredPhase4ProviderAuditRecord(
  serialized: string | null
): Phase4ProviderAuditRecord | undefined {
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
      !nonEmptyString(parsed.catalogFingerprint) ||
      !nonEmptyString(parsed.approvalRecordId) ||
      !nonEmptyString(parsed.auditEvidenceFingerprint) ||
      typeof parsed.mutationLocked !== "boolean"
    ) {
      return undefined;
    }

    return {
      id: parsed.id.trim(),
      createdAt: parsed.createdAt.trim(),
      state,
      catalogFingerprint: publicText(parsed.catalogFingerprint, "missing"),
      approvalRecordId: publicText(parsed.approvalRecordId, "missing-approval-record"),
      auditEvidenceFingerprint: publicText(
        parsed.auditEvidenceFingerprint,
        "missing-audit-evidence"
      ),
      mutationLocked: parsed.mutationLocked,
      detail: publicText(
        parsed.detail,
        "Owner reviewed Phase 4 provider audit evidence while provider execution remains locked."
      )
    };
  } catch {
    return undefined;
  }
}

export function loadPhase4ProviderAuditRecord(): Phase4ProviderAuditRecord | undefined {
  return parseStoredPhase4ProviderAuditRecord(readStorage());
}

export function savePhase4ProviderAuditRecord(
  record: Phase4ProviderAuditRecord
): void {
  writeStorage({
    ...record,
    approvalRecordId: publicText(record.approvalRecordId, "missing-approval-record"),
    auditEvidenceFingerprint: publicText(
      record.auditEvidenceFingerprint,
      "missing-audit-evidence"
    ),
    detail: publicText(
      record.detail,
      "Owner reviewed Phase 4 provider audit evidence while provider execution remains locked."
    )
  });
}

export function clearPhase4ProviderAuditRecord(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem?.(PHASE4_PROVIDER_AUDIT_RECORD_STORAGE_KEY);
  } catch {
    return;
  }
}

export function derivePhase4ProviderAuditRecordValidation(input: {
  readonly record?: Phase4ProviderAuditRecord;
  readonly approvalRecord?: Phase4ProviderApprovalRecord;
  readonly approvalValidation: Phase4ProviderApprovalRecordValidation;
  readonly expectedAuditEvidenceFingerprint?: string;
  readonly expectedCatalogFingerprint?: string;
  readonly options?: Phase4ProviderAuditRecordValidationOptions;
}): Phase4ProviderAuditRecordValidation {
  const maxRecordAgeMs =
    input.options?.maxRecordAgeMs ?? DEFAULT_PHASE4_PROVIDER_AUDIT_RECORD_MAX_AGE_MS;

  if (!input.record) {
    const matchesCurrentCatalog = false;
    const matchesCurrentApproval = false;
    const matchesCurrentAuditEvidence = false;

    return {
      state: "preview",
      detail: "Provider audit record is not attached yet.",
      nextAction:
        "Record provider audit review after approval is fresh and matched to the current catalog fingerprint.",
      expectedCatalogFingerprint: input.expectedCatalogFingerprint,
      expectedApprovalRecordId: input.approvalRecord?.id,
      expectedAuditEvidenceFingerprint: input.expectedAuditEvidenceFingerprint,
      maxRecordAgeMs,
      matchesCurrentCatalog,
      matchesCurrentApproval,
      matchesCurrentAuditEvidence,
      mutationLocked: false,
      auditChainProof: auditChainProof({
        approvalRecord: input.approvalRecord,
        approvalValidation: input.approvalValidation,
        expectedCatalogFingerprint: input.expectedCatalogFingerprint,
        expectedAuditEvidenceFingerprint: input.expectedAuditEvidenceFingerprint,
        matchesCurrentCatalog,
        matchesCurrentApproval,
        matchesCurrentAuditEvidence
      })
    };
  }

  const ageMs = recordAgeMs(input.record, input.options?.evaluatedAt);
  const matchesCurrentCatalog =
    Boolean(input.expectedCatalogFingerprint) &&
    input.record.catalogFingerprint === input.expectedCatalogFingerprint;
  const matchesCurrentApproval =
    Boolean(input.approvalRecord?.id) &&
    input.record.approvalRecordId === input.approvalRecord?.id;
  const matchesCurrentAuditEvidence =
    Boolean(input.expectedAuditEvidenceFingerprint) &&
    input.record.auditEvidenceFingerprint === input.expectedAuditEvidenceFingerprint;
  const base = {
    expectedCatalogFingerprint: input.expectedCatalogFingerprint,
    recordCatalogFingerprint: input.record.catalogFingerprint,
    expectedApprovalRecordId: input.approvalRecord?.id,
    recordApprovalRecordId: input.record.approvalRecordId,
    expectedAuditEvidenceFingerprint: input.expectedAuditEvidenceFingerprint,
    recordAuditEvidenceFingerprint: input.record.auditEvidenceFingerprint,
    ...(ageMs !== undefined ? { recordAgeMs: ageMs } : {}),
    maxRecordAgeMs,
    matchesCurrentCatalog,
    matchesCurrentApproval,
    matchesCurrentAuditEvidence,
    mutationLocked: input.record.mutationLocked,
    auditChainProof: auditChainProof({
      record: input.record,
      approvalRecord: input.approvalRecord,
      approvalValidation: input.approvalValidation,
      expectedCatalogFingerprint: input.expectedCatalogFingerprint,
      expectedAuditEvidenceFingerprint: input.expectedAuditEvidenceFingerprint,
      matchesCurrentCatalog,
      matchesCurrentApproval,
      matchesCurrentAuditEvidence
    })
  };

  if (input.approvalValidation.state !== "ready") {
    return {
      state: "review",
      detail: "Provider audit record is held until provider approval is ready.",
      nextAction: input.approvalValidation.nextAction,
      ...base
    };
  }

  if (!input.expectedCatalogFingerprint) {
    return {
      state: "review",
      detail:
        "Provider audit record cannot be trusted because the current catalog fingerprint is missing.",
      nextAction: "Attach the current six-surface catalog fingerprint before provider audit review.",
      ...base
    };
  }

  if (!matchesCurrentCatalog) {
    return {
      state: "review",
      detail:
        "Provider audit record does not match the current six-surface catalog fingerprint.",
      nextAction:
        "Clear and record provider audit review again after current approval and catalog proof are attached.",
      ...base
    };
  }

  if (!matchesCurrentApproval) {
    return {
      state: "review",
      detail: "Provider audit record does not match the current provider approval record.",
      nextAction:
        "Clear and record provider audit review again after the current approval record is ready.",
      ...base
    };
  }

  if (!matchesCurrentAuditEvidence) {
    return {
      state: "review",
      detail: "Provider audit record does not match the current audit evidence fingerprint.",
      nextAction:
        "Clear and record provider audit review again after the current surface-depth evidence is attached.",
      ...base
    };
  }

  if (ageMs === undefined) {
    return {
      state: "review",
      detail:
        "Provider audit record cannot be freshness-checked without the current evaluation timestamp.",
      nextAction: "Review provider audit evidence with the current Phase 4 evaluation time.",
      ...base
    };
  }

  if (ageMs < 0 || ageMs > maxRecordAgeMs) {
    return {
      state: "review",
      detail: "Provider audit record is stale or future-dated and must be recorded again.",
      nextAction: "Clear and record provider audit review again from current Phase 4 evidence.",
      ...base
    };
  }

  if (input.record.state !== "ready") {
    return {
      state: "review",
      detail:
        "Provider audit record is attached but is not ready for the current Phase 4 evidence.",
      nextAction: "Clear and record provider audit review again from current Phase 4 evidence.",
      ...base
    };
  }

  if (!input.record.mutationLocked) {
    return {
      state: "review",
      detail: "Provider audit record cannot be trusted because the mutation lock was not retained.",
      nextAction: "Clear and record provider audit review again while provider execution remains locked.",
      ...base
    };
  }

  return {
    state: "ready",
    detail:
      "Provider audit record matches the current approval record, catalog fingerprint, and freshness window.",
    nextAction:
      "Keep provider audit review attached while rollback, permission, and execution locks remain held.",
    ...base
  };
}
