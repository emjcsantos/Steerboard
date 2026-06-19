import type {
  Phase4ProviderApprovalRecord,
  Phase4ProviderApprovalRecordValidation
} from "./phase4ProviderApprovalRecord";
import type {
  Phase4ProviderAuditRecord,
  Phase4ProviderAuditRecordValidation
} from "./phase4ProviderAuditRecord";
import type { Phase4ProviderBlockerPrioritySummary } from "./phase4ProviderBlockerPriority";
import type { Phase4ProviderCatalogDepthSummary } from "./phase4ProviderCatalogDepth";
import type {
  Phase4ProviderPermissionRecord,
  Phase4ProviderPermissionRecordValidation
} from "./phase4ProviderPermissionRecord";
import type {
  Phase4ProviderRollbackRecord,
  Phase4ProviderRollbackRecordValidation
} from "./phase4ProviderRollbackRecord";
import type { Phase4ProviderSurfaceDepthSnapshot } from "./phase4ProviderSurfaceDepth";
import type { Phase4ProviderTraceabilitySummary } from "./phase4ProviderTraceability";
import type { Phase4RefreshSafetyDepthSummary } from "./phase4RefreshSafetyDepth";

export type Phase4ProviderReviewArtifactState = "ready" | "review" | "blocked" | "waiting";

export interface Phase4ProviderReviewArtifact {
  readonly schemaVersion: 1;
  readonly source: "steerboard.phase4.provider-review.v1";
  readonly exportedAt: string;
  readonly evaluatedAt: string;
  readonly currentCatalogFingerprint: string;
  readonly catalogDepth: Phase4ProviderCatalogDepthSummary;
  readonly refreshSafety: Phase4RefreshSafetyDepthSummary;
  readonly surfaceDepth: Phase4ProviderSurfaceDepthSnapshot;
  readonly traceability: Phase4ProviderTraceabilitySummary;
  readonly blockerPriority: Phase4ProviderBlockerPrioritySummary;
  readonly approvalRecord?: Phase4ProviderApprovalRecord;
  readonly approvalValidation?: Phase4ProviderApprovalRecordValidation;
  readonly auditRecord?: Phase4ProviderAuditRecord;
  readonly auditValidation?: Phase4ProviderAuditRecordValidation;
  readonly rollbackRecord?: Phase4ProviderRollbackRecord;
  readonly rollbackValidation?: Phase4ProviderRollbackRecordValidation;
  readonly permissionRecord?: Phase4ProviderPermissionRecord;
  readonly permissionValidation?: Phase4ProviderPermissionRecordValidation;
}

export interface Phase4ProviderReviewArtifactVerification {
  readonly state: Phase4ProviderReviewArtifactState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canVerifyOffline: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly catalogDepthRecordCount: number;
  readonly refreshSafetyRecordCount: number;
  readonly surfaceDepthItemCount: number;
  readonly traceabilityItemCount: number;
  readonly openBlockerCount: number;
  readonly executionLocked: boolean;
  readonly hasApprovalRecord: boolean;
  readonly hasAuditRecord: boolean;
  readonly hasRollbackRecord: boolean;
  readonly hasPermissionRecord: boolean;
}

export interface Phase4ProviderReviewArtifactBuildInput {
  readonly exportedAt?: string;
  readonly evaluatedAt?: string;
  readonly currentCatalogFingerprint: string;
  readonly catalogDepth: Phase4ProviderCatalogDepthSummary;
  readonly refreshSafety: Phase4RefreshSafetyDepthSummary;
  readonly surfaceDepth: Phase4ProviderSurfaceDepthSnapshot;
  readonly traceability: Phase4ProviderTraceabilitySummary;
  readonly blockerPriority: Phase4ProviderBlockerPrioritySummary;
  readonly approvalRecord?: Phase4ProviderApprovalRecord;
  readonly approvalValidation?: Phase4ProviderApprovalRecordValidation;
  readonly auditRecord?: Phase4ProviderAuditRecord;
  readonly auditValidation?: Phase4ProviderAuditRecordValidation;
  readonly rollbackRecord?: Phase4ProviderRollbackRecord;
  readonly rollbackValidation?: Phase4ProviderRollbackRecordValidation;
  readonly permissionRecord?: Phase4ProviderPermissionRecord;
  readonly permissionValidation?: Phase4ProviderPermissionRecordValidation;
}

export interface Phase4ProviderReviewArtifactVerifyOptions {
  readonly verifiedAt?: string | Date;
  readonly maxArtifactAgeMs?: number;
  readonly expectedCatalogFingerprint?: string;
}

const STATUS_LABELS: Record<Phase4ProviderReviewArtifactState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const DEFAULT_MAX_ARTIFACT_AGE_MS = 24 * 60 * 60 * 1000;
const REQUIRED_PROVIDER_SURFACE_COUNT = 6;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toTimestamp(value: string | Date | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function isFresh(
  createdAt: string | undefined,
  verifiedAt: string | Date | undefined,
  maxAgeMs: number
): boolean {
  const createdAtMs = toTimestamp(createdAt);
  const verifiedAtMs = verifiedAt ? toTimestamp(verifiedAt) : Date.now();

  if (createdAtMs === undefined || verifiedAtMs === undefined) {
    return false;
  }

  const ageMs = verifiedAtMs - createdAtMs;
  return ageMs >= 0 && ageMs <= maxAgeMs;
}

function counts(
  artifact: Phase4ProviderReviewArtifact | undefined
): Pick<
  Phase4ProviderReviewArtifactVerification,
  | "catalogDepthRecordCount"
  | "refreshSafetyRecordCount"
  | "surfaceDepthItemCount"
  | "traceabilityItemCount"
  | "openBlockerCount"
  | "executionLocked"
  | "hasApprovalRecord"
  | "hasAuditRecord"
  | "hasRollbackRecord"
  | "hasPermissionRecord"
> {
  return {
    catalogDepthRecordCount: artifact?.catalogDepth.records.length ?? 0,
    refreshSafetyRecordCount: artifact?.refreshSafety.records.length ?? 0,
    surfaceDepthItemCount: artifact?.surfaceDepth.items.length ?? 0,
    traceabilityItemCount: artifact?.traceability.items.length ?? 0,
    openBlockerCount: artifact?.blockerPriority.openBlockerCount ?? 0,
    executionLocked: artifact ? !artifact.surfaceDepth.canEnableExecution : false,
    hasApprovalRecord: Boolean(artifact?.approvalRecord),
    hasAuditRecord: Boolean(artifact?.auditRecord),
    hasRollbackRecord: Boolean(artifact?.rollbackRecord),
    hasPermissionRecord: Boolean(artifact?.permissionRecord)
  };
}

function result(
  state: Phase4ProviderReviewArtifactState,
  artifact: Phase4ProviderReviewArtifact | undefined,
  detail: string,
  nextAction: string
): Phase4ProviderReviewArtifactVerification {
  const readiness =
    state === "ready" ? 100 : state === "review" ? 70 : state === "blocked" ? 20 : 35;

  return {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    canVerifyOffline: state === "ready" || state === "review",
    detail,
    nextAction,
    ...counts(artifact)
  };
}

export function buildPhase4ProviderReviewArtifact(
  input: Phase4ProviderReviewArtifactBuildInput
): Phase4ProviderReviewArtifact {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    source: "steerboard.phase4.provider-review.v1",
    exportedAt: input.exportedAt ?? now,
    evaluatedAt: input.evaluatedAt ?? now,
    currentCatalogFingerprint: input.currentCatalogFingerprint,
    catalogDepth: input.catalogDepth,
    refreshSafety: input.refreshSafety,
    surfaceDepth: input.surfaceDepth,
    traceability: input.traceability,
    blockerPriority: input.blockerPriority,
    ...(input.approvalRecord ? { approvalRecord: input.approvalRecord } : {}),
    ...(input.approvalValidation ? { approvalValidation: input.approvalValidation } : {}),
    ...(input.auditRecord ? { auditRecord: input.auditRecord } : {}),
    ...(input.auditValidation ? { auditValidation: input.auditValidation } : {}),
    ...(input.rollbackRecord ? { rollbackRecord: input.rollbackRecord } : {}),
    ...(input.rollbackValidation ? { rollbackValidation: input.rollbackValidation } : {}),
    ...(input.permissionRecord ? { permissionRecord: input.permissionRecord } : {}),
    ...(input.permissionValidation ? { permissionValidation: input.permissionValidation } : {})
  };
}

export function serializePhase4ProviderReviewArtifact(
  artifact: Phase4ProviderReviewArtifact
): string {
  return JSON.stringify(artifact, null, 2);
}

export function parsePhase4ProviderReviewArtifact(
  serializedArtifact: string
): Phase4ProviderReviewArtifact | undefined {
  try {
    const parsed = JSON.parse(serializedArtifact);

    if (
      !isRecord(parsed) ||
      parsed.schemaVersion !== 1 ||
      parsed.source !== "steerboard.phase4.provider-review.v1" ||
      typeof parsed.exportedAt !== "string" ||
      typeof parsed.evaluatedAt !== "string" ||
      typeof parsed.currentCatalogFingerprint !== "string" ||
      !isRecord(parsed.catalogDepth) ||
      !isRecord(parsed.refreshSafety) ||
      !isRecord(parsed.surfaceDepth) ||
      !isRecord(parsed.traceability) ||
      !isRecord(parsed.blockerPriority)
    ) {
      return undefined;
    }

    return parsed as unknown as Phase4ProviderReviewArtifact;
  } catch {
    return undefined;
  }
}

export function verifyPhase4ProviderReviewArtifact(
  artifact: Phase4ProviderReviewArtifact | undefined,
  options: Phase4ProviderReviewArtifactVerifyOptions = {}
): Phase4ProviderReviewArtifactVerification {
  if (!artifact) {
    return result(
      "waiting",
      undefined,
      "Phase 4 provider review artifact is missing or malformed.",
      "Export or import a Phase 4 provider review artifact before offline verification."
    );
  }

  if (
    artifact.schemaVersion !== 1 ||
    artifact.source !== "steerboard.phase4.provider-review.v1"
  ) {
    return result(
      "waiting",
      artifact,
      "Phase 4 provider review artifact has an unsupported schema.",
      "Re-export the Phase 4 provider review artifact from the current Steerboard build."
    );
  }

  if (
    !isFresh(
      artifact.evaluatedAt,
      options.verifiedAt,
      options.maxArtifactAgeMs ?? DEFAULT_MAX_ARTIFACT_AGE_MS
    )
  ) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact is stale or future-dated.",
      "Re-export Phase 4 provider review evidence from the current provider readiness state."
    );
  }

  if (!artifact.currentCatalogFingerprint.trim()) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact is missing the current six-surface catalog fingerprint.",
      "Run the metadata-only provider catalog review, then export again with the current fingerprint attached."
    );
  }

  const expectedCatalogFingerprint = options.expectedCatalogFingerprint?.trim();
  if (
    expectedCatalogFingerprint &&
    artifact.currentCatalogFingerprint.trim() !== expectedCatalogFingerprint
  ) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact catalog fingerprint does not match the current six-surface catalog.",
      "Re-export Phase 4 provider review evidence after the current metadata-only provider catalog refresh."
    );
  }

  if (artifact.catalogDepth.records.length < REQUIRED_PROVIDER_SURFACE_COUNT) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact does not include all six catalog-depth records.",
      "Export again after command, skill, plugin, MCP, automation, and personalization catalog-depth rows are visible."
    );
  }

  if (artifact.refreshSafety.records.length === 0) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact is missing refresh-safety records.",
      "Attach metadata-only refresh-safety proof before exporting the provider review artifact."
    );
  }

  if (artifact.surfaceDepth.items.length === 0 || artifact.traceability.items.length === 0) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact is missing surface-depth or traceability rows.",
      "Export again after Phase 4 surface-depth and traceability rows render in Owner review."
    );
  }

  if (artifact.surfaceDepth.canEnableExecution) {
    return result(
      "blocked",
      artifact,
      "Phase 4 provider review artifact cannot be trusted because provider execution is enabled.",
      "Restore the provider execution lock and export metadata-only review evidence again."
    );
  }

  if (artifact.traceability.executionLockCount < REQUIRED_PROVIDER_SURFACE_COUNT) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact is missing six provider execution locks.",
      "Keep command, skill, plugin, MCP, automation, and personalization execution locks visible before exporting."
    );
  }

  if (artifact.blockerPriority.openBlockerCount > 0) {
    return result(
      "review",
      artifact,
      `Phase 4 provider review artifact is valid but still has ${artifact.blockerPriority.openBlockerCount} open blocker${artifact.blockerPriority.openBlockerCount === 1 ? "" : "s"}.`,
      artifact.blockerPriority.topPriorityAction
    );
  }

  if (!artifact.traceability.canTrustProviderReview) {
    return result(
      "review",
      artifact,
      "Phase 4 provider review artifact has no open blockers, but traceability is not trusted yet.",
      artifact.traceability.nextAction
    );
  }

  return result(
    "ready",
    artifact,
    "Phase 4 provider review artifact contains current catalog depth, refresh safety, surface depth, traceability, blocker priority, and execution-lock evidence.",
    "Keep the Phase 4 provider review artifact attached while provider execution remains locked."
  );
}

export function verifySerializedPhase4ProviderReviewArtifact(
  serializedArtifact: string,
  options: Phase4ProviderReviewArtifactVerifyOptions = {}
): Phase4ProviderReviewArtifactVerification {
  return verifyPhase4ProviderReviewArtifact(
    parsePhase4ProviderReviewArtifact(serializedArtifact),
    options
  );
}
