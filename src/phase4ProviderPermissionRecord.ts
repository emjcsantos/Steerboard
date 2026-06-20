import type {
  Phase4ProviderApprovalRecord,
  Phase4ProviderApprovalRecordState
} from "./phase4ProviderApprovalRecord";
import type { Phase4ProviderAuditRecord } from "./phase4ProviderAuditRecord";
import type {
  Phase4ProviderRollbackRecord,
  Phase4ProviderRollbackRecordValidation
} from "./phase4ProviderRollbackRecord";
import type { Phase4ProviderSurfaceDepthSnapshot } from "./phase4ProviderSurfaceDepth";

export type Phase4ProviderPermissionRecordState = Phase4ProviderApprovalRecordState;

export const EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES = [
  "command",
  "skill",
  "plugin",
  "mcp",
  "automation",
  "personalization"
] as const;

export type Phase4ProviderPermissionSurfaceScope =
  (typeof EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES)[number];

export interface Phase4ProviderPermissionRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly state: Phase4ProviderPermissionRecordState;
  readonly catalogFingerprint: string;
  readonly approvalRecordId: string;
  readonly auditRecordId: string;
  readonly rollbackRecordId: string;
  readonly auditEvidenceFingerprint: string;
  readonly rollbackEvidenceFingerprint: string;
  readonly surfaceDepthEvidenceFingerprint: string;
  readonly permissionEvidenceFingerprint: string;
  readonly providerSurfaceScopes: readonly Phase4ProviderPermissionSurfaceScope[];
  readonly permissionOwner: string;
  readonly permissionScope: string;
  readonly permissionAction: string;
  readonly mutationLocked: boolean;
  readonly detail: string;
}

export interface Phase4ProviderPermissionRecordValidation {
  readonly state: Phase4ProviderPermissionRecordState;
  readonly detail: string;
  readonly nextAction: string;
  readonly expectedCatalogFingerprint?: string;
  readonly recordCatalogFingerprint?: string;
  readonly expectedApprovalRecordId?: string;
  readonly recordApprovalRecordId?: string;
  readonly expectedAuditRecordId?: string;
  readonly recordAuditRecordId?: string;
  readonly expectedRollbackRecordId?: string;
  readonly recordRollbackRecordId?: string;
  readonly expectedAuditEvidenceFingerprint?: string;
  readonly recordAuditEvidenceFingerprint?: string;
  readonly expectedRollbackEvidenceFingerprint?: string;
  readonly recordRollbackEvidenceFingerprint?: string;
  readonly expectedSurfaceDepthEvidenceFingerprint?: string;
  readonly recordSurfaceDepthEvidenceFingerprint?: string;
  readonly expectedPermissionEvidenceFingerprint?: string;
  readonly recordPermissionEvidenceFingerprint?: string;
  readonly recordAgeMs?: number;
  readonly maxRecordAgeMs: number;
  readonly matchesCurrentCatalog: boolean;
  readonly matchesCurrentApproval: boolean;
  readonly matchesCurrentAudit: boolean;
  readonly matchesCurrentRollback: boolean;
  readonly matchesCurrentAuditEvidence: boolean;
  readonly matchesCurrentRollbackEvidence: boolean;
  readonly matchesCurrentSurfaceDepthEvidence: boolean;
  readonly matchesCurrentPermissionEvidence: boolean;
  readonly mutationLocked: boolean;
  readonly coveredSurfaceCount: number;
  readonly missingSurfaceScopes: readonly Phase4ProviderPermissionSurfaceScope[];
  readonly permissionChainProof: string;
}

export interface Phase4ProviderPermissionRecordValidationOptions {
  readonly evaluatedAt?: string | Date;
  readonly maxRecordAgeMs?: number;
}

export const PHASE4_PROVIDER_PERMISSION_RECORD_STORAGE_KEY =
  "steerboard.phase4.providerPermissionRecord.v1";
export const DEFAULT_PHASE4_PROVIDER_PERMISSION_RECORD_MAX_AGE_MS =
  24 * 60 * 60 * 1000;

const VALID_STATES: Phase4ProviderPermissionRecordState[] = [
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

function normalizeState(
  value: unknown
): Phase4ProviderPermissionRecordState | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toLowerCase();
  return VALID_STATES.includes(normalized as Phase4ProviderPermissionRecordState)
    ? (normalized as Phase4ProviderPermissionRecordState)
    : undefined;
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

function toTimestamp(value: string | Date | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function recordAgeMs(
  record: Phase4ProviderPermissionRecord,
  evaluatedAt: string | Date | undefined
): number | undefined {
  const evaluatedAtMs = toTimestamp(evaluatedAt);
  const createdAtMs = toTimestamp(record.createdAt);

  return evaluatedAtMs !== undefined && createdAtMs !== undefined
    ? evaluatedAtMs - createdAtMs
    : undefined;
}

function valueOrMissing(value: string | undefined): string {
  return value ?? "missing";
}

function buildPermissionChainProof(input: {
  readonly expectedCatalogFingerprint?: string;
  readonly recordCatalogFingerprint?: string;
  readonly expectedApprovalRecordId?: string;
  readonly recordApprovalRecordId?: string;
  readonly expectedAuditRecordId?: string;
  readonly recordAuditRecordId?: string;
  readonly expectedRollbackRecordId?: string;
  readonly recordRollbackRecordId?: string;
  readonly rollbackValidationState: Phase4ProviderRollbackRecordValidation["state"];
  readonly rollbackChainProof: string;
  readonly expectedAuditEvidenceFingerprint?: string;
  readonly recordAuditEvidenceFingerprint?: string;
  readonly expectedRollbackEvidenceFingerprint?: string;
  readonly recordRollbackEvidenceFingerprint?: string;
  readonly expectedSurfaceDepthEvidenceFingerprint?: string;
  readonly recordSurfaceDepthEvidenceFingerprint?: string;
  readonly expectedPermissionEvidenceFingerprint?: string;
  readonly recordPermissionEvidenceFingerprint?: string;
  readonly matchesCurrentCatalog: boolean;
  readonly matchesCurrentApproval: boolean;
  readonly matchesCurrentAudit: boolean;
  readonly matchesCurrentRollback: boolean;
  readonly matchesCurrentAuditEvidence: boolean;
  readonly matchesCurrentRollbackEvidence: boolean;
  readonly matchesCurrentSurfaceDepthEvidence: boolean;
  readonly matchesCurrentPermissionEvidence: boolean;
  readonly coveredSurfaceCount: number;
  readonly missingSurfaceScopes: readonly Phase4ProviderPermissionSurfaceScope[];
  readonly ownerPresent: boolean;
  readonly scopePresent: boolean;
  readonly actionPresent: boolean;
  readonly mutationLocked: boolean;
}): string {
  const missingScopes = input.missingSurfaceScopes.join(",") || "none";

  return (
    `approval=${valueOrMissing(input.recordApprovalRecordId)} expectedApproval=${valueOrMissing(input.expectedApprovalRecordId)} ` +
    `audit=${valueOrMissing(input.recordAuditRecordId)} expectedAudit=${valueOrMissing(input.expectedAuditRecordId)} ` +
    `rollback=${valueOrMissing(input.recordRollbackRecordId)} expectedRollback=${valueOrMissing(input.expectedRollbackRecordId)} ` +
    `rollbackValidation=${input.rollbackValidationState} ` +
    `rollbackChain=${input.rollbackChainProof.trim() ? "present" : "missing"} ` +
    `catalog=${valueOrMissing(input.recordCatalogFingerprint)} expectedCatalog=${valueOrMissing(input.expectedCatalogFingerprint)} ` +
    `auditEvidence=${valueOrMissing(input.recordAuditEvidenceFingerprint)} expectedAuditEvidence=${valueOrMissing(input.expectedAuditEvidenceFingerprint)} ` +
    `rollbackEvidence=${valueOrMissing(input.recordRollbackEvidenceFingerprint)} expectedRollbackEvidence=${valueOrMissing(input.expectedRollbackEvidenceFingerprint)} ` +
    `surfaceDepth=${valueOrMissing(input.recordSurfaceDepthEvidenceFingerprint)} expectedSurfaceDepth=${valueOrMissing(input.expectedSurfaceDepthEvidenceFingerprint)} ` +
    `permissionEvidence=${valueOrMissing(input.recordPermissionEvidenceFingerprint)} expectedPermissionEvidence=${valueOrMissing(input.expectedPermissionEvidenceFingerprint)} ` +
    `surfaces=${input.coveredSurfaceCount}/6 missingScopes=${missingScopes} ` +
    `approvalMatch=${input.matchesCurrentApproval ? "matched" : "review"} ` +
    `auditMatch=${input.matchesCurrentAudit ? "matched" : "review"} ` +
    `rollbackMatch=${input.matchesCurrentRollback ? "matched" : "review"} ` +
    `catalogMatch=${input.matchesCurrentCatalog ? "matched" : "review"} ` +
    `auditEvidenceMatch=${input.matchesCurrentAuditEvidence ? "matched" : "review"} ` +
    `rollbackEvidenceMatch=${input.matchesCurrentRollbackEvidence ? "matched" : "review"} ` +
    `surfaceMatch=${input.matchesCurrentSurfaceDepthEvidence ? "matched" : "review"} ` +
    `permissionMatch=${input.matchesCurrentPermissionEvidence ? "matched" : "review"} ` +
    `owner=${input.ownerPresent ? "present" : "review"} ` +
    `scope=${input.scopePresent ? "present" : "review"} ` +
    `action=${input.actionPresent ? "present" : "review"} ` +
    `mutation=${input.mutationLocked ? "locked" : "review"} execution=locked`
  );
}

function normalizeSurfaceScopes(
  scopes: readonly unknown[]
): readonly Phase4ProviderPermissionSurfaceScope[] {
  const received = new Set(scopes.filter(nonEmptyString).map((scope) => scope.trim()));

  return EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES.filter((surface) =>
    received.has(surface)
  );
}

function missingSurfaceScopes(
  scopes: readonly Phase4ProviderPermissionSurfaceScope[]
): readonly Phase4ProviderPermissionSurfaceScope[] {
  const received = new Set(scopes);

  return EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES.filter(
    (surface) => !received.has(surface)
  );
}

function readStorage(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(
      PHASE4_PROVIDER_PERMISSION_RECORD_STORAGE_KEY
    );
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeStorage(record: Phase4ProviderPermissionRecord): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(
      PHASE4_PROVIDER_PERMISSION_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
  } catch {
    return;
  }
}

export function buildPhase4ProviderPermissionEvidenceFingerprint(
  snapshot: Phase4ProviderSurfaceDepthSnapshot
): string {
  const payload = {
    readiness: snapshot.readiness,
    items: snapshot.items
      .filter((item) => item.kind !== "permission-gate")
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

  return `phase4-provider-permission-${shortHash(stableJson(payload))}`;
}

export function createPhase4ProviderPermissionRecord(input: {
  readonly approvalRecord: Phase4ProviderApprovalRecord;
  readonly auditRecord: Phase4ProviderAuditRecord;
  readonly rollbackRecord: Phase4ProviderRollbackRecord;
  readonly catalogFingerprint: string;
  readonly createdAt: string;
  readonly surfaceDepthEvidenceFingerprint: string;
  readonly permissionEvidenceFingerprint: string;
  readonly providerSurfaceScopes: readonly unknown[];
  readonly permissionOwner?: string;
  readonly permissionScope?: string;
  readonly permissionAction?: string;
  readonly detail?: string;
}): Phase4ProviderPermissionRecord {
  return {
    id: `phase4-provider-permission:${input.createdAt}`,
    createdAt: input.createdAt,
    state: "ready",
    catalogFingerprint: publicText(input.catalogFingerprint, "missing"),
    approvalRecordId: publicText(input.approvalRecord.id, "missing-approval-record"),
    auditRecordId: publicText(input.auditRecord.id, "missing-audit-record"),
    rollbackRecordId: publicText(input.rollbackRecord.id, "missing-rollback-record"),
    auditEvidenceFingerprint: publicText(
      input.auditRecord.auditEvidenceFingerprint,
      "missing-audit-evidence"
    ),
    rollbackEvidenceFingerprint: publicText(
      input.rollbackRecord.surfaceDepthEvidenceFingerprint,
      "missing-rollback-evidence"
    ),
    surfaceDepthEvidenceFingerprint: publicText(
      input.surfaceDepthEvidenceFingerprint,
      "missing-surface-depth-evidence"
    ),
    permissionEvidenceFingerprint: publicText(
      input.permissionEvidenceFingerprint,
      "missing-permission-evidence"
    ),
    providerSurfaceScopes: normalizeSurfaceScopes(input.providerSurfaceScopes),
    permissionOwner: publicText(input.permissionOwner, "Owner"),
    permissionScope: publicText(
      input.permissionScope,
      "Command, skill, plugin, MCP, automation, and personalization metadata permission review; provider execution remains locked."
    ),
    permissionAction: publicText(
      input.permissionAction,
      "Keep provider execution locked until explicit execution gates are implemented."
    ),
    mutationLocked: true,
    detail: publicText(
      input.detail,
      "Owner reviewed Phase 4 provider permissions while provider execution remains locked."
    )
  };
}

export function parseStoredPhase4ProviderPermissionRecord(
  serialized: string | null
): Phase4ProviderPermissionRecord | undefined {
  if (!serialized) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed) || !Array.isArray(parsed.providerSurfaceScopes)) {
      return undefined;
    }

    const state = normalizeState(parsed.state);
    const providerSurfaceScopes = normalizeSurfaceScopes(parsed.providerSurfaceScopes);
    if (
      !nonEmptyString(parsed.id) ||
      !nonEmptyString(parsed.createdAt) ||
      !state ||
      !nonEmptyString(parsed.catalogFingerprint) ||
      !nonEmptyString(parsed.approvalRecordId) ||
      !nonEmptyString(parsed.auditRecordId) ||
      !nonEmptyString(parsed.rollbackRecordId) ||
      !nonEmptyString(parsed.auditEvidenceFingerprint) ||
      !nonEmptyString(parsed.rollbackEvidenceFingerprint) ||
      !nonEmptyString(parsed.surfaceDepthEvidenceFingerprint) ||
      !nonEmptyString(parsed.permissionEvidenceFingerprint) ||
      providerSurfaceScopes.length === 0 ||
      !nonEmptyString(parsed.permissionOwner) ||
      !nonEmptyString(parsed.permissionScope) ||
      !nonEmptyString(parsed.permissionAction) ||
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
      rollbackRecordId: publicText(parsed.rollbackRecordId, "missing-rollback-record"),
      auditEvidenceFingerprint: publicText(
        parsed.auditEvidenceFingerprint,
        "missing-audit-evidence"
      ),
      rollbackEvidenceFingerprint: publicText(
        parsed.rollbackEvidenceFingerprint,
        "missing-rollback-evidence"
      ),
      surfaceDepthEvidenceFingerprint: publicText(
        parsed.surfaceDepthEvidenceFingerprint,
        "missing-surface-depth-evidence"
      ),
      permissionEvidenceFingerprint: publicText(
        parsed.permissionEvidenceFingerprint,
        "missing-permission-evidence"
      ),
      providerSurfaceScopes,
      permissionOwner: publicText(parsed.permissionOwner, "Owner"),
      permissionScope: publicText(
        parsed.permissionScope,
        "Command, skill, plugin, MCP, automation, and personalization metadata permission review; provider execution remains locked."
      ),
      permissionAction: publicText(
        parsed.permissionAction,
        "Keep provider execution locked until explicit execution gates are implemented."
      ),
      mutationLocked: parsed.mutationLocked,
      detail: publicText(
        parsed.detail,
        "Owner reviewed Phase 4 provider permissions while provider execution remains locked."
      )
    };
  } catch {
    return undefined;
  }
}

export function loadPhase4ProviderPermissionRecord():
  | Phase4ProviderPermissionRecord
  | undefined {
  return parseStoredPhase4ProviderPermissionRecord(readStorage());
}

export function savePhase4ProviderPermissionRecord(
  record: Phase4ProviderPermissionRecord
): void {
  writeStorage({
    ...record,
    approvalRecordId: publicText(record.approvalRecordId, "missing-approval-record"),
    auditRecordId: publicText(record.auditRecordId, "missing-audit-record"),
    rollbackRecordId: publicText(record.rollbackRecordId, "missing-rollback-record"),
    auditEvidenceFingerprint: publicText(
      record.auditEvidenceFingerprint,
      "missing-audit-evidence"
    ),
    rollbackEvidenceFingerprint: publicText(
      record.rollbackEvidenceFingerprint,
      "missing-rollback-evidence"
    ),
    surfaceDepthEvidenceFingerprint: publicText(
      record.surfaceDepthEvidenceFingerprint,
      "missing-surface-depth-evidence"
    ),
    permissionEvidenceFingerprint: publicText(
      record.permissionEvidenceFingerprint,
      "missing-permission-evidence"
    ),
    providerSurfaceScopes: normalizeSurfaceScopes(record.providerSurfaceScopes),
    permissionOwner: publicText(record.permissionOwner, "Owner"),
    permissionScope: publicText(
      record.permissionScope,
      "Command, skill, plugin, MCP, automation, and personalization metadata permission review; provider execution remains locked."
    ),
    permissionAction: publicText(
      record.permissionAction,
      "Keep provider execution locked until explicit execution gates are implemented."
    ),
    detail: publicText(
      record.detail,
      "Owner reviewed Phase 4 provider permissions while provider execution remains locked."
    )
  });
}

export function clearPhase4ProviderPermissionRecord(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem?.(PHASE4_PROVIDER_PERMISSION_RECORD_STORAGE_KEY);
  } catch {
    return;
  }
}

export function derivePhase4ProviderPermissionRecordValidation(input: {
  readonly record?: Phase4ProviderPermissionRecord;
  readonly approvalRecord?: Phase4ProviderApprovalRecord;
  readonly auditRecord?: Phase4ProviderAuditRecord;
  readonly rollbackRecord?: Phase4ProviderRollbackRecord;
  readonly rollbackValidation: Phase4ProviderRollbackRecordValidation;
  readonly expectedCatalogFingerprint?: string;
  readonly expectedSurfaceDepthEvidenceFingerprint?: string;
  readonly expectedPermissionEvidenceFingerprint?: string;
  readonly options?: Phase4ProviderPermissionRecordValidationOptions;
}): Phase4ProviderPermissionRecordValidation {
  const maxRecordAgeMs =
    input.options?.maxRecordAgeMs ??
    DEFAULT_PHASE4_PROVIDER_PERMISSION_RECORD_MAX_AGE_MS;
  const expectedAuditEvidenceFingerprint = input.auditRecord?.auditEvidenceFingerprint;
  const expectedRollbackEvidenceFingerprint =
    input.rollbackRecord?.surfaceDepthEvidenceFingerprint;

  if (!input.record) {
    const missingSurfaceScopes = EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES;

    return {
      state: "preview",
      detail: "Provider permission record is not attached yet.",
      nextAction:
        "Record provider permission review after rollback evidence is fresh and matched to the current approval, audit, catalog, and surface-depth proof.",
      expectedCatalogFingerprint: input.expectedCatalogFingerprint,
      expectedApprovalRecordId: input.approvalRecord?.id,
      expectedAuditRecordId: input.auditRecord?.id,
      expectedRollbackRecordId: input.rollbackRecord?.id,
      expectedAuditEvidenceFingerprint,
      expectedRollbackEvidenceFingerprint,
      expectedSurfaceDepthEvidenceFingerprint:
        input.expectedSurfaceDepthEvidenceFingerprint,
      expectedPermissionEvidenceFingerprint: input.expectedPermissionEvidenceFingerprint,
      maxRecordAgeMs,
      matchesCurrentCatalog: false,
      matchesCurrentApproval: false,
      matchesCurrentAudit: false,
      matchesCurrentRollback: false,
      matchesCurrentAuditEvidence: false,
      matchesCurrentRollbackEvidence: false,
      matchesCurrentSurfaceDepthEvidence: false,
      matchesCurrentPermissionEvidence: false,
      mutationLocked: false,
      coveredSurfaceCount: 0,
      missingSurfaceScopes,
      permissionChainProof: buildPermissionChainProof({
        expectedCatalogFingerprint: input.expectedCatalogFingerprint,
        expectedApprovalRecordId: input.approvalRecord?.id,
        expectedAuditRecordId: input.auditRecord?.id,
        expectedRollbackRecordId: input.rollbackRecord?.id,
        rollbackValidationState: input.rollbackValidation.state,
        rollbackChainProof: input.rollbackValidation.rollbackChainProof,
        expectedAuditEvidenceFingerprint,
        expectedRollbackEvidenceFingerprint,
        expectedSurfaceDepthEvidenceFingerprint:
          input.expectedSurfaceDepthEvidenceFingerprint,
        expectedPermissionEvidenceFingerprint:
          input.expectedPermissionEvidenceFingerprint,
        matchesCurrentCatalog: false,
        matchesCurrentApproval: false,
        matchesCurrentAudit: false,
        matchesCurrentRollback: false,
        matchesCurrentAuditEvidence: false,
        matchesCurrentRollbackEvidence: false,
        matchesCurrentSurfaceDepthEvidence: false,
        matchesCurrentPermissionEvidence: false,
        coveredSurfaceCount: 0,
        missingSurfaceScopes,
        ownerPresent: false,
        scopePresent: false,
        actionPresent: false,
        mutationLocked: false
      })
    };
  }

  const ageMs = recordAgeMs(input.record, input.options?.evaluatedAt);
  const missingScopes = missingSurfaceScopes(input.record.providerSurfaceScopes);
  const matchesCurrentCatalog =
    Boolean(input.expectedCatalogFingerprint) &&
    input.record.catalogFingerprint === input.expectedCatalogFingerprint;
  const matchesCurrentApproval =
    Boolean(input.approvalRecord?.id) &&
    input.record.approvalRecordId === input.approvalRecord?.id;
  const matchesCurrentAudit =
    Boolean(input.auditRecord?.id) &&
    input.record.auditRecordId === input.auditRecord?.id;
  const matchesCurrentRollback =
    Boolean(input.rollbackRecord?.id) &&
    input.record.rollbackRecordId === input.rollbackRecord?.id;
  const matchesCurrentAuditEvidence =
    Boolean(expectedAuditEvidenceFingerprint) &&
    input.record.auditEvidenceFingerprint === expectedAuditEvidenceFingerprint;
  const matchesCurrentRollbackEvidence =
    Boolean(expectedRollbackEvidenceFingerprint) &&
    input.record.rollbackEvidenceFingerprint === expectedRollbackEvidenceFingerprint;
  const matchesCurrentSurfaceDepthEvidence =
    Boolean(input.expectedSurfaceDepthEvidenceFingerprint) &&
    input.record.surfaceDepthEvidenceFingerprint ===
      input.expectedSurfaceDepthEvidenceFingerprint;
  const matchesCurrentPermissionEvidence =
    Boolean(input.expectedPermissionEvidenceFingerprint) &&
    input.record.permissionEvidenceFingerprint ===
      input.expectedPermissionEvidenceFingerprint;
  const ownerPresent = input.record.permissionOwner.trim().length > 0;
  const scopePresent = input.record.permissionScope.trim().length > 0;
  const actionPresent = input.record.permissionAction.trim().length > 0;
  const mutationLocked = input.record.mutationLocked;
  const base = {
    expectedCatalogFingerprint: input.expectedCatalogFingerprint,
    recordCatalogFingerprint: input.record.catalogFingerprint,
    expectedApprovalRecordId: input.approvalRecord?.id,
    recordApprovalRecordId: input.record.approvalRecordId,
    expectedAuditRecordId: input.auditRecord?.id,
    recordAuditRecordId: input.record.auditRecordId,
    expectedRollbackRecordId: input.rollbackRecord?.id,
    recordRollbackRecordId: input.record.rollbackRecordId,
    expectedAuditEvidenceFingerprint,
    recordAuditEvidenceFingerprint: input.record.auditEvidenceFingerprint,
    expectedRollbackEvidenceFingerprint,
    recordRollbackEvidenceFingerprint: input.record.rollbackEvidenceFingerprint,
    expectedSurfaceDepthEvidenceFingerprint:
      input.expectedSurfaceDepthEvidenceFingerprint,
    recordSurfaceDepthEvidenceFingerprint:
      input.record.surfaceDepthEvidenceFingerprint,
    expectedPermissionEvidenceFingerprint: input.expectedPermissionEvidenceFingerprint,
    recordPermissionEvidenceFingerprint: input.record.permissionEvidenceFingerprint,
    ...(ageMs !== undefined ? { recordAgeMs: ageMs } : {}),
    maxRecordAgeMs,
    matchesCurrentCatalog,
    matchesCurrentApproval,
    matchesCurrentAudit,
    matchesCurrentRollback,
    matchesCurrentAuditEvidence,
    matchesCurrentRollbackEvidence,
    matchesCurrentSurfaceDepthEvidence,
    matchesCurrentPermissionEvidence,
    mutationLocked,
    coveredSurfaceCount: input.record.providerSurfaceScopes.length,
    missingSurfaceScopes: missingScopes,
    permissionChainProof: buildPermissionChainProof({
      expectedCatalogFingerprint: input.expectedCatalogFingerprint,
      recordCatalogFingerprint: input.record.catalogFingerprint,
      expectedApprovalRecordId: input.approvalRecord?.id,
      recordApprovalRecordId: input.record.approvalRecordId,
      expectedAuditRecordId: input.auditRecord?.id,
      recordAuditRecordId: input.record.auditRecordId,
      expectedRollbackRecordId: input.rollbackRecord?.id,
      recordRollbackRecordId: input.record.rollbackRecordId,
      rollbackValidationState: input.rollbackValidation.state,
      rollbackChainProof: input.rollbackValidation.rollbackChainProof,
      expectedAuditEvidenceFingerprint,
      recordAuditEvidenceFingerprint: input.record.auditEvidenceFingerprint,
      expectedRollbackEvidenceFingerprint,
      recordRollbackEvidenceFingerprint: input.record.rollbackEvidenceFingerprint,
      expectedSurfaceDepthEvidenceFingerprint:
        input.expectedSurfaceDepthEvidenceFingerprint,
      recordSurfaceDepthEvidenceFingerprint:
        input.record.surfaceDepthEvidenceFingerprint,
      expectedPermissionEvidenceFingerprint:
        input.expectedPermissionEvidenceFingerprint,
      recordPermissionEvidenceFingerprint: input.record.permissionEvidenceFingerprint,
      matchesCurrentCatalog,
      matchesCurrentApproval,
      matchesCurrentAudit,
      matchesCurrentRollback,
      matchesCurrentAuditEvidence,
      matchesCurrentRollbackEvidence,
      matchesCurrentSurfaceDepthEvidence,
      matchesCurrentPermissionEvidence,
      coveredSurfaceCount: input.record.providerSurfaceScopes.length,
      missingSurfaceScopes: missingScopes,
      ownerPresent,
      scopePresent,
      actionPresent,
      mutationLocked
    })
  };

  if (input.rollbackValidation.state !== "ready") {
    return {
      state: "review",
      detail: "Provider permission record is held until provider rollback evidence is ready.",
      nextAction: input.rollbackValidation.nextAction,
      ...base
    };
  }

  if (!input.expectedCatalogFingerprint) {
    return {
      state: "review",
      detail:
        "Provider permission record cannot be trusted because the current catalog fingerprint is missing.",
      nextAction:
        "Attach the current six-surface catalog fingerprint before provider permission review.",
      ...base
    };
  }

  if (!matchesCurrentCatalog) {
    return {
      state: "review",
      detail:
        "Provider permission record does not match the current six-surface catalog fingerprint.",
      nextAction:
        "Clear and record provider permission review again after current rollback and catalog proof are attached.",
      ...base
    };
  }

  if (!matchesCurrentApproval || !matchesCurrentAudit || !matchesCurrentRollback) {
    return {
      state: "review",
      detail:
        "Provider permission record does not match the current approval, audit, and rollback record chain.",
      nextAction:
        "Clear and record provider permission review again after the current approval, audit, and rollback records are ready.",
      ...base
    };
  }

  if (!matchesCurrentAuditEvidence || !matchesCurrentRollbackEvidence) {
    return {
      state: "review",
      detail:
        "Provider permission record does not match the current audit and rollback evidence fingerprints.",
      nextAction:
        "Clear and record provider permission review again after the current evidence fingerprints are attached.",
      ...base
    };
  }

  if (!matchesCurrentSurfaceDepthEvidence || !matchesCurrentPermissionEvidence) {
    return {
      state: "review",
      detail:
        "Provider permission record does not match the current surface-depth permission evidence fingerprints.",
      nextAction:
        "Clear and record provider permission review again after the current surface-depth evidence is attached.",
      ...base
    };
  }

  if (missingScopes.length > 0) {
    return {
      state: "review",
      detail:
        "Provider permission record does not cover every provider surface scope.",
      nextAction:
        "Clear and record provider permission review again with command, skill, plugin, MCP, automation, and personalization scopes.",
      ...base
    };
  }

  if (ageMs === undefined) {
    return {
      state: "review",
      detail:
        "Provider permission record cannot be freshness-checked without the current evaluation timestamp.",
      nextAction:
        "Review provider permission evidence with the current Phase 4 evaluation time.",
      ...base
    };
  }

  if (ageMs < 0 || ageMs > maxRecordAgeMs) {
    return {
      state: "review",
      detail:
        "Provider permission record is stale or future-dated and must be recorded again.",
      nextAction:
        "Clear and record provider permission review again from current Phase 4 evidence.",
      ...base
    };
  }

  if (input.record.state !== "ready") {
    return {
      state: "review",
      detail:
        "Provider permission record is attached but is not ready for the current Phase 4 evidence.",
      nextAction:
        "Clear and record provider permission review again from current Phase 4 evidence.",
      ...base
    };
  }

  if (
    !ownerPresent ||
    !scopePresent ||
    !actionPresent
  ) {
    return {
      state: "review",
      detail:
        "Provider permission record is missing owner, scope, or action evidence.",
      nextAction:
        "Clear and record provider permission review again with owner/scope/action evidence.",
      ...base
    };
  }

  if (!mutationLocked) {
    return {
      state: "review",
      detail:
        "Provider permission record cannot be trusted because the mutation lock was not retained.",
      nextAction:
        "Clear and record provider permission review again while provider execution remains locked.",
      ...base
    };
  }

  return {
    state: "ready",
    detail:
      "Provider permission record matches the current approval, audit, rollback, catalog, surface-depth, permission evidence, and freshness window.",
    nextAction:
      "Keep provider permission review attached while explicit execution gates remain held.",
    ...base
  };
}
