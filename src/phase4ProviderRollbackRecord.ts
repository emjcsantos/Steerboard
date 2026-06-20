import type {
  Phase4ProviderApprovalRecord,
  Phase4ProviderApprovalRecordState
} from "./phase4ProviderApprovalRecord";
import type {
  Phase4ProviderAuditRecord,
  Phase4ProviderAuditRecordValidation
} from "./phase4ProviderAuditRecord";
import type { Phase4ProviderSurfaceDepthSnapshot } from "./phase4ProviderSurfaceDepth";

export type Phase4ProviderRollbackRecordState = Phase4ProviderApprovalRecordState;

export interface Phase4ProviderRollbackRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly state: Phase4ProviderRollbackRecordState;
  readonly catalogFingerprint: string;
  readonly approvalRecordId: string;
  readonly auditRecordId: string;
  readonly auditEvidenceFingerprint: string;
  readonly surfaceDepthEvidenceFingerprint: string;
  readonly rollbackOwner: string;
  readonly rollbackAction: string;
  readonly mutationLocked: boolean;
  readonly detail: string;
}

export interface Phase4ProviderRollbackRecordValidation {
  readonly state: Phase4ProviderRollbackRecordState;
  readonly detail: string;
  readonly nextAction: string;
  readonly expectedCatalogFingerprint?: string;
  readonly recordCatalogFingerprint?: string;
  readonly expectedApprovalRecordId?: string;
  readonly recordApprovalRecordId?: string;
  readonly expectedAuditRecordId?: string;
  readonly recordAuditRecordId?: string;
  readonly expectedAuditEvidenceFingerprint?: string;
  readonly recordAuditEvidenceFingerprint?: string;
  readonly expectedSurfaceDepthEvidenceFingerprint?: string;
  readonly recordSurfaceDepthEvidenceFingerprint?: string;
  readonly recordAgeMs?: number;
  readonly maxRecordAgeMs: number;
  readonly matchesCurrentCatalog: boolean;
  readonly matchesCurrentApproval: boolean;
  readonly matchesCurrentAudit: boolean;
  readonly matchesCurrentAuditEvidence: boolean;
  readonly matchesCurrentSurfaceDepthEvidence: boolean;
  readonly mutationLocked: boolean;
  readonly rollbackChainProof: string;
}

export interface Phase4ProviderRollbackRecordValidationOptions {
  readonly evaluatedAt?: string | Date;
  readonly maxRecordAgeMs?: number;
}

export const PHASE4_PROVIDER_ROLLBACK_RECORD_STORAGE_KEY =
  "steerboard.phase4.providerRollbackRecord.v1";
export const DEFAULT_PHASE4_PROVIDER_ROLLBACK_RECORD_MAX_AGE_MS =
  24 * 60 * 60 * 1000;

const VALID_STATES: Phase4ProviderRollbackRecordState[] = [
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

function normalizeState(value: unknown): Phase4ProviderRollbackRecordState | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toLowerCase();
  return VALID_STATES.includes(normalized as Phase4ProviderRollbackRecordState)
    ? (normalized as Phase4ProviderRollbackRecordState)
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
  record: Phase4ProviderRollbackRecord,
  evaluatedAt: string | Date | undefined
): number | undefined {
  const evaluatedAtMs = toTimestamp(evaluatedAt);
  const createdAtMs = toTimestamp(record.createdAt);

  return evaluatedAtMs !== undefined && createdAtMs !== undefined
    ? evaluatedAtMs - createdAtMs
    : undefined;
}

function valueOrMissing(value: string | undefined): string {
  return value && value.trim().length > 0 ? value : "missing";
}

function rollbackChainProof(input: {
  readonly record?: Phase4ProviderRollbackRecord;
  readonly approvalRecord?: Phase4ProviderApprovalRecord;
  readonly auditRecord?: Phase4ProviderAuditRecord;
  readonly auditValidation: Phase4ProviderAuditRecordValidation;
  readonly expectedCatalogFingerprint?: string;
  readonly expectedSurfaceDepthEvidenceFingerprint?: string;
  readonly matchesCurrentCatalog: boolean;
  readonly matchesCurrentApproval: boolean;
  readonly matchesCurrentAudit: boolean;
  readonly matchesCurrentAuditEvidence: boolean;
  readonly matchesCurrentSurfaceDepthEvidence: boolean;
}): string {
  const hasOwner = Boolean(input.record?.rollbackOwner.trim());
  const hasAction = Boolean(input.record?.rollbackAction.trim());

  return (
    `approval=${valueOrMissing(input.record?.approvalRecordId)} ` +
    `expectedApproval=${valueOrMissing(input.approvalRecord?.id)} ` +
    `audit=${valueOrMissing(input.record?.auditRecordId)} ` +
    `expectedAudit=${valueOrMissing(input.auditRecord?.id)} ` +
    `auditValidation=${input.auditValidation.state} ` +
    `auditChain=${input.auditValidation.auditChainProof.trim() ? "present" : "missing"} ` +
    `catalog=${valueOrMissing(input.record?.catalogFingerprint)} ` +
    `expectedCatalog=${valueOrMissing(input.expectedCatalogFingerprint)} ` +
    `auditEvidence=${valueOrMissing(input.record?.auditEvidenceFingerprint)} ` +
    `expectedAuditEvidence=${valueOrMissing(input.auditRecord?.auditEvidenceFingerprint)} ` +
    `surfaceDepth=${valueOrMissing(input.record?.surfaceDepthEvidenceFingerprint)} ` +
    `expectedSurfaceDepth=${valueOrMissing(input.expectedSurfaceDepthEvidenceFingerprint)} ` +
    `approvalMatch=${input.matchesCurrentApproval ? "matched" : "review"} ` +
    `auditMatch=${input.matchesCurrentAudit ? "matched" : "review"} ` +
    `auditEvidenceMatch=${input.matchesCurrentAuditEvidence ? "matched" : "review"} ` +
    `surfaceMatch=${input.matchesCurrentSurfaceDepthEvidence ? "matched" : "review"} ` +
    `owner=${hasOwner ? "present" : "missing"} action=${hasAction ? "present" : "missing"} ` +
    `mutation=${input.record?.mutationLocked ? "locked" : "review"} execution=locked`
  );
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

export function buildPhase4ProviderRollbackEvidenceFingerprint(
  snapshot: Phase4ProviderSurfaceDepthSnapshot
): string {
  const payload = {
    readiness: snapshot.readiness,
    items: snapshot.items
      .filter((item) => item.kind !== "rollback-gate")
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

  return `phase4-provider-rollback-${shortHash(stableJson(payload))}`;
}

function readStorage(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(
      PHASE4_PROVIDER_ROLLBACK_RECORD_STORAGE_KEY
    );
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeStorage(record: Phase4ProviderRollbackRecord): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(
      PHASE4_PROVIDER_ROLLBACK_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
  } catch {
    return;
  }
}

export function createPhase4ProviderRollbackRecord(input: {
  readonly approvalRecord: Phase4ProviderApprovalRecord;
  readonly auditRecord: Phase4ProviderAuditRecord;
  readonly catalogFingerprint: string;
  readonly createdAt: string;
  readonly surfaceDepthEvidenceFingerprint: string;
  readonly rollbackAction?: string;
  readonly rollbackOwner?: string;
  readonly detail?: string;
}): Phase4ProviderRollbackRecord {
  return {
    id: `phase4-provider-rollback:${input.createdAt}`,
    createdAt: input.createdAt,
    state: "ready",
    catalogFingerprint: publicText(input.catalogFingerprint, "missing"),
    approvalRecordId: publicText(input.approvalRecord.id, "missing-approval-record"),
    auditRecordId: publicText(input.auditRecord.id, "missing-audit-record"),
    auditEvidenceFingerprint: publicText(
      input.auditRecord.auditEvidenceFingerprint,
      "missing-audit-evidence"
    ),
    surfaceDepthEvidenceFingerprint: publicText(
      input.surfaceDepthEvidenceFingerprint,
      "missing-surface-depth-evidence"
    ),
    rollbackOwner: publicText(input.rollbackOwner, "Owner"),
    rollbackAction: publicText(
      input.rollbackAction,
      "Keep provider execution locked and review rollback evidence before any provider action can run."
    ),
    mutationLocked: true,
    detail: publicText(
      input.detail,
      "Owner reviewed Phase 4 provider rollback evidence while provider execution remains locked."
    )
  };
}

export function parseStoredPhase4ProviderRollbackRecord(
  serialized: string | null
): Phase4ProviderRollbackRecord | undefined {
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
      !nonEmptyString(parsed.auditRecordId) ||
      !nonEmptyString(parsed.auditEvidenceFingerprint) ||
      !nonEmptyString(parsed.surfaceDepthEvidenceFingerprint) ||
      !nonEmptyString(parsed.rollbackOwner) ||
      !nonEmptyString(parsed.rollbackAction) ||
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
      auditRecordId: publicText(parsed.auditRecordId, "missing-audit-record"),
      auditEvidenceFingerprint: publicText(
        parsed.auditEvidenceFingerprint,
        "missing-audit-evidence"
      ),
      surfaceDepthEvidenceFingerprint: publicText(
        parsed.surfaceDepthEvidenceFingerprint,
        "missing-surface-depth-evidence"
      ),
      rollbackOwner: publicText(parsed.rollbackOwner, "Owner"),
      rollbackAction: publicText(
        parsed.rollbackAction,
        "Keep provider execution locked and review rollback evidence before any provider action can run."
      ),
      mutationLocked: parsed.mutationLocked,
      detail: publicText(
        parsed.detail,
        "Owner reviewed Phase 4 provider rollback evidence while provider execution remains locked."
      )
    };
  } catch {
    return undefined;
  }
}

export function loadPhase4ProviderRollbackRecord():
  | Phase4ProviderRollbackRecord
  | undefined {
  return parseStoredPhase4ProviderRollbackRecord(readStorage());
}

export function savePhase4ProviderRollbackRecord(
  record: Phase4ProviderRollbackRecord
): void {
  writeStorage({
    ...record,
    approvalRecordId: publicText(record.approvalRecordId, "missing-approval-record"),
    auditRecordId: publicText(record.auditRecordId, "missing-audit-record"),
    auditEvidenceFingerprint: publicText(
      record.auditEvidenceFingerprint,
      "missing-audit-evidence"
    ),
    surfaceDepthEvidenceFingerprint: publicText(
      record.surfaceDepthEvidenceFingerprint,
      "missing-surface-depth-evidence"
    ),
    rollbackOwner: publicText(record.rollbackOwner, "Owner"),
    rollbackAction: publicText(
      record.rollbackAction,
      "Keep provider execution locked and review rollback evidence before any provider action can run."
    ),
    detail: publicText(
      record.detail,
      "Owner reviewed Phase 4 provider rollback evidence while provider execution remains locked."
    )
  });
}

export function clearPhase4ProviderRollbackRecord(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem?.(PHASE4_PROVIDER_ROLLBACK_RECORD_STORAGE_KEY);
  } catch {
    return;
  }
}

export function derivePhase4ProviderRollbackRecordValidation(input: {
  readonly record?: Phase4ProviderRollbackRecord;
  readonly approvalRecord?: Phase4ProviderApprovalRecord;
  readonly auditRecord?: Phase4ProviderAuditRecord;
  readonly auditValidation: Phase4ProviderAuditRecordValidation;
  readonly expectedCatalogFingerprint?: string;
  readonly expectedSurfaceDepthEvidenceFingerprint?: string;
  readonly options?: Phase4ProviderRollbackRecordValidationOptions;
}): Phase4ProviderRollbackRecordValidation {
  const maxRecordAgeMs =
    input.options?.maxRecordAgeMs ??
    DEFAULT_PHASE4_PROVIDER_ROLLBACK_RECORD_MAX_AGE_MS;

  if (!input.record) {
    const matchesCurrentCatalog = false;
    const matchesCurrentApproval = false;
    const matchesCurrentAudit = false;
    const matchesCurrentAuditEvidence = false;
    const matchesCurrentSurfaceDepthEvidence = false;

    return {
      state: "preview",
      detail: "Provider rollback record is not attached yet.",
      nextAction:
        "Record provider rollback review after audit evidence is fresh and matched to the current approval and catalog proof.",
      expectedCatalogFingerprint: input.expectedCatalogFingerprint,
      expectedApprovalRecordId: input.approvalRecord?.id,
      expectedAuditRecordId: input.auditRecord?.id,
      expectedAuditEvidenceFingerprint: input.auditRecord?.auditEvidenceFingerprint,
      expectedSurfaceDepthEvidenceFingerprint: input.expectedSurfaceDepthEvidenceFingerprint,
      maxRecordAgeMs,
      matchesCurrentCatalog,
      matchesCurrentApproval,
      matchesCurrentAudit,
      matchesCurrentAuditEvidence,
      matchesCurrentSurfaceDepthEvidence,
      mutationLocked: false,
      rollbackChainProof: rollbackChainProof({
        approvalRecord: input.approvalRecord,
        auditRecord: input.auditRecord,
        auditValidation: input.auditValidation,
        expectedCatalogFingerprint: input.expectedCatalogFingerprint,
        expectedSurfaceDepthEvidenceFingerprint: input.expectedSurfaceDepthEvidenceFingerprint,
        matchesCurrentCatalog,
        matchesCurrentApproval,
        matchesCurrentAudit,
        matchesCurrentAuditEvidence,
        matchesCurrentSurfaceDepthEvidence
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
  const matchesCurrentAudit =
    Boolean(input.auditRecord?.id) &&
    input.record.auditRecordId === input.auditRecord?.id;
  const matchesCurrentAuditEvidence =
    Boolean(input.auditRecord?.auditEvidenceFingerprint) &&
    input.record.auditEvidenceFingerprint === input.auditRecord?.auditEvidenceFingerprint;
  const matchesCurrentSurfaceDepthEvidence =
    Boolean(input.expectedSurfaceDepthEvidenceFingerprint) &&
    input.record.surfaceDepthEvidenceFingerprint ===
      input.expectedSurfaceDepthEvidenceFingerprint;
  const base = {
    expectedCatalogFingerprint: input.expectedCatalogFingerprint,
    recordCatalogFingerprint: input.record.catalogFingerprint,
    expectedApprovalRecordId: input.approvalRecord?.id,
    recordApprovalRecordId: input.record.approvalRecordId,
    expectedAuditRecordId: input.auditRecord?.id,
    recordAuditRecordId: input.record.auditRecordId,
    expectedAuditEvidenceFingerprint: input.auditRecord?.auditEvidenceFingerprint,
    recordAuditEvidenceFingerprint: input.record.auditEvidenceFingerprint,
    expectedSurfaceDepthEvidenceFingerprint: input.expectedSurfaceDepthEvidenceFingerprint,
    recordSurfaceDepthEvidenceFingerprint: input.record.surfaceDepthEvidenceFingerprint,
    ...(ageMs !== undefined ? { recordAgeMs: ageMs } : {}),
    maxRecordAgeMs,
    matchesCurrentCatalog,
    matchesCurrentApproval,
    matchesCurrentAudit,
    matchesCurrentAuditEvidence,
    matchesCurrentSurfaceDepthEvidence,
    mutationLocked: input.record.mutationLocked,
    rollbackChainProof: rollbackChainProof({
      record: input.record,
      approvalRecord: input.approvalRecord,
      auditRecord: input.auditRecord,
      auditValidation: input.auditValidation,
      expectedCatalogFingerprint: input.expectedCatalogFingerprint,
      expectedSurfaceDepthEvidenceFingerprint: input.expectedSurfaceDepthEvidenceFingerprint,
      matchesCurrentCatalog,
      matchesCurrentApproval,
      matchesCurrentAudit,
      matchesCurrentAuditEvidence,
      matchesCurrentSurfaceDepthEvidence
    })
  };

  if (input.auditValidation.state !== "ready") {
    return {
      state: "review",
      detail: "Provider rollback record is held until provider audit evidence is ready.",
      nextAction: input.auditValidation.nextAction,
      ...base
    };
  }

  if (!input.expectedCatalogFingerprint) {
    return {
      state: "review",
      detail:
        "Provider rollback record cannot be trusted because the current catalog fingerprint is missing.",
      nextAction:
        "Attach the current six-surface catalog fingerprint before provider rollback review.",
      ...base
    };
  }

  if (!matchesCurrentCatalog) {
    return {
      state: "review",
      detail:
        "Provider rollback record does not match the current six-surface catalog fingerprint.",
      nextAction:
        "Clear and record provider rollback review again after current audit and catalog proof are attached.",
      ...base
    };
  }

  if (!matchesCurrentApproval) {
    return {
      state: "review",
      detail: "Provider rollback record does not match the current provider approval record.",
      nextAction:
        "Clear and record provider rollback review again after the current approval record is ready.",
      ...base
    };
  }

  if (!matchesCurrentAudit) {
    return {
      state: "review",
      detail: "Provider rollback record does not match the current provider audit record.",
      nextAction:
        "Clear and record provider rollback review again after the current audit record is ready.",
      ...base
    };
  }

  if (!matchesCurrentAuditEvidence) {
    return {
      state: "review",
      detail:
        "Provider rollback record does not match the current audit evidence fingerprint.",
      nextAction:
        "Clear and record provider rollback review again after the current audit evidence is attached.",
      ...base
    };
  }

  if (!matchesCurrentSurfaceDepthEvidence) {
    return {
      state: "review",
      detail:
        "Provider rollback record does not match the current surface-depth evidence fingerprint.",
      nextAction:
        "Clear and record provider rollback review again after the current surface-depth evidence is attached.",
      ...base
    };
  }

  if (ageMs === undefined) {
    return {
      state: "review",
      detail:
        "Provider rollback record cannot be freshness-checked without the current evaluation timestamp.",
      nextAction: "Review provider rollback evidence with the current Phase 4 evaluation time.",
      ...base
    };
  }

  if (ageMs < 0 || ageMs > maxRecordAgeMs) {
    return {
      state: "review",
      detail: "Provider rollback record is stale or future-dated and must be recorded again.",
      nextAction:
        "Clear and record provider rollback review again from current Phase 4 evidence.",
      ...base
    };
  }

  if (input.record.state !== "ready") {
    return {
      state: "review",
      detail:
        "Provider rollback record is attached but is not ready for the current Phase 4 evidence.",
      nextAction:
        "Clear and record provider rollback review again from current Phase 4 evidence.",
      ...base
    };
  }

  if (!input.record.rollbackOwner.trim() || !input.record.rollbackAction.trim()) {
    return {
      state: "review",
      detail: "Provider rollback record is missing rollback owner or rollback action evidence.",
      nextAction: "Clear and record provider rollback review again with owner/action evidence.",
      ...base
    };
  }

  if (!input.record.mutationLocked) {
    return {
      state: "review",
      detail:
        "Provider rollback record cannot be trusted because the mutation lock was not retained.",
      nextAction:
        "Clear and record provider rollback review again while provider execution remains locked.",
      ...base
    };
  }

  return {
    state: "ready",
    detail:
      "Provider rollback record matches the current approval record, audit record, catalog fingerprint, surface-depth evidence fingerprint, and freshness window.",
    nextAction:
      "Keep provider rollback review attached while permission and execution locks remain held.",
    ...base
  };
}
