import {
  buildPhase8AuditEvidenceFingerprint,
  type Phase8AuditReviewRecord
} from "./phase8AuditReviewRecord";
import type { Phase8PermissionAuditDepthSnapshot } from "./phase8PermissionAuditDepth";
import type { Phase8RiskBlockerPrioritySummary } from "./phase8RiskBlockerPriority";
import type { Phase8RiskTraceabilitySummary } from "./phase8RiskTraceability";

export type Phase8AuditReviewArtifactState = "ready" | "review" | "blocked" | "waiting";

export interface Phase8AuditReviewArtifact {
  readonly schemaVersion: 1;
  readonly source: "steerboard.phase8.audit-review.v1";
  readonly exportedAt: string;
  readonly evaluatedAt: string;
  readonly snapshot: Phase8PermissionAuditDepthSnapshot;
  readonly traceability: Phase8RiskTraceabilitySummary;
  readonly blockerPriority: Phase8RiskBlockerPrioritySummary;
  readonly reviewRecord?: Phase8AuditReviewRecord;
}

export interface Phase8AuditReviewArtifactVerification {
  readonly state: Phase8AuditReviewArtifactState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canVerifyOffline: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly auditDepthItemCount: number;
  readonly exceptionCount: number;
  readonly openExceptionCount: number;
  readonly disabledPathCount: number;
  readonly evidenceKeyCount: number;
  readonly openBlockerCount: number;
  readonly mutationLocked: boolean;
  readonly hasReviewRecord: boolean;
}

export interface Phase8AuditReviewArtifactBuildInput {
  readonly exportedAt?: string;
  readonly evaluatedAt?: string;
  readonly snapshot: Phase8PermissionAuditDepthSnapshot;
  readonly traceability: Phase8RiskTraceabilitySummary;
  readonly blockerPriority: Phase8RiskBlockerPrioritySummary;
  readonly reviewRecord?: Phase8AuditReviewRecord;
}

export interface Phase8AuditReviewArtifactVerifyOptions {
  readonly verifiedAt?: string | Date;
  readonly maxArtifactAgeMs?: number;
}

const STATUS_LABELS: Record<Phase8AuditReviewArtifactState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const DEFAULT_MAX_ARTIFACT_AGE_MS = 24 * 60 * 60 * 1000;

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

function snapshotMutationLocked(snapshot: Phase8PermissionAuditDepthSnapshot): boolean {
  return (
    snapshot.exceptions.length > 0 &&
    snapshot.disabledPathCount === snapshot.exceptions.length &&
    snapshot.exceptions.every((exception) => {
      const disabledPath = exception.disabledPath.toLowerCase();
      return disabledPath.includes("disabled") || disabledPath.includes("locked");
    })
  );
}

function hasCompleteReviewedBlockerProof(record: Phase8AuditReviewRecord): boolean {
  const values = [
    record.topBlockerLabel,
    record.topBlockerSourceId,
    record.topBlockerKind,
    record.topBlockerStatus,
    record.topBlockerAction
  ];
  const presentCount = values.filter(
    (value) => typeof value === "string" && value.trim().length > 0
  ).length;

  return presentCount === 0 || presentCount === values.length;
}

function hasCurrentReviewRecordFingerprint(
  artifact: Phase8AuditReviewArtifact,
  record: Phase8AuditReviewRecord
): boolean {
  return (
    typeof record.auditEvidenceFingerprint === "string" &&
    record.auditEvidenceFingerprint === buildPhase8AuditEvidenceFingerprint(artifact.snapshot)
  );
}

function counts(
  artifact: Phase8AuditReviewArtifact | undefined
): Pick<
  Phase8AuditReviewArtifactVerification,
  | "auditDepthItemCount"
  | "exceptionCount"
  | "openExceptionCount"
  | "disabledPathCount"
  | "evidenceKeyCount"
  | "openBlockerCount"
  | "mutationLocked"
  | "hasReviewRecord"
> {
  return {
    auditDepthItemCount: artifact?.snapshot.items.length ?? 0,
    exceptionCount: artifact?.snapshot.exceptions.length ?? 0,
    openExceptionCount: artifact?.snapshot.openExceptionCount ?? 0,
    disabledPathCount: artifact?.snapshot.disabledPathCount ?? 0,
    evidenceKeyCount: artifact?.traceability.evidenceKeyCount ?? 0,
    openBlockerCount: artifact?.blockerPriority.openBlockerCount ?? 0,
    mutationLocked: artifact ? snapshotMutationLocked(artifact.snapshot) : false,
    hasReviewRecord: Boolean(artifact?.reviewRecord)
  };
}

function result(
  state: Phase8AuditReviewArtifactState,
  artifact: Phase8AuditReviewArtifact | undefined,
  detail: string,
  nextAction: string
): Phase8AuditReviewArtifactVerification {
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

export function buildPhase8AuditReviewArtifact(
  input: Phase8AuditReviewArtifactBuildInput
): Phase8AuditReviewArtifact {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    source: "steerboard.phase8.audit-review.v1",
    exportedAt: input.exportedAt ?? now,
    evaluatedAt: input.evaluatedAt ?? now,
    snapshot: input.snapshot,
    traceability: input.traceability,
    blockerPriority: input.blockerPriority,
    ...(input.reviewRecord ? { reviewRecord: input.reviewRecord } : {})
  };
}

export function serializePhase8AuditReviewArtifact(
  artifact: Phase8AuditReviewArtifact
): string {
  return JSON.stringify(artifact, null, 2);
}

export function parsePhase8AuditReviewArtifact(
  serializedArtifact: string
): Phase8AuditReviewArtifact | undefined {
  try {
    const parsed = JSON.parse(serializedArtifact);

    if (
      !isRecord(parsed) ||
      parsed.schemaVersion !== 1 ||
      parsed.source !== "steerboard.phase8.audit-review.v1" ||
      typeof parsed.exportedAt !== "string" ||
      typeof parsed.evaluatedAt !== "string" ||
      !isRecord(parsed.snapshot) ||
      !isRecord(parsed.traceability) ||
      !isRecord(parsed.blockerPriority)
    ) {
      return undefined;
    }

    return parsed as unknown as Phase8AuditReviewArtifact;
  } catch {
    return undefined;
  }
}

export function verifyPhase8AuditReviewArtifact(
  artifact: Phase8AuditReviewArtifact | undefined,
  options: Phase8AuditReviewArtifactVerifyOptions = {}
): Phase8AuditReviewArtifactVerification {
  if (!artifact) {
    return result(
      "waiting",
      undefined,
      "Phase 8 audit review artifact is missing or malformed.",
      "Export or import a Phase 8 audit review artifact before offline verification."
    );
  }

  if (
    artifact.schemaVersion !== 1 ||
    artifact.source !== "steerboard.phase8.audit-review.v1"
  ) {
    return result(
      "waiting",
      artifact,
      "Phase 8 audit review artifact has an unsupported schema.",
      "Re-export the Phase 8 audit review artifact from the current Steerboard build."
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
      "Phase 8 audit review artifact is stale or future-dated.",
      "Re-export Phase 8 audit review evidence from the current permission and audit state."
    );
  }

  if (artifact.snapshot.items.length === 0 || artifact.snapshot.exceptions.length === 0) {
    return result(
      "review",
      artifact,
      "Phase 8 audit review artifact is missing audit-depth or exception rows.",
      "Export again after permission, approval, evidence, rollback, exception, and disabled-path rows render."
    );
  }

  if (!snapshotMutationLocked(artifact.snapshot)) {
    return result(
      "blocked",
      artifact,
      "Phase 8 audit review artifact cannot be trusted because disabled-path mutation locks are incomplete.",
      "Restore disabled or locked path explanations for every exception row before exporting."
    );
  }

  if (
    artifact.traceability.evidenceKeyCount !==
    artifact.snapshot.items.length + artifact.snapshot.exceptions.length
  ) {
    return result(
      "review",
      artifact,
      "Phase 8 audit review artifact has incomplete evidence-key traceability.",
      "Restore unique evidence keys across audit-depth and exception rows before exporting."
    );
  }

  if (artifact.reviewRecord && !artifact.reviewRecord.mutationLocked) {
    return result(
      "blocked",
      artifact,
      "Phase 8 audit review artifact includes an owner review record that does not preserve the mutation lock.",
      "Clear and recreate the owner audit review record while mutation-capable paths remain locked."
    );
  }

  if (
    artifact.reviewRecord &&
    !hasCurrentReviewRecordFingerprint(artifact, artifact.reviewRecord)
  ) {
    return result(
      "review",
      artifact,
      "Phase 8 audit review artifact includes an owner review record with a stale or missing current audit evidence fingerprint.",
      "Re-record owner audit review from the current Phase 8 audit evidence before treating persistence as closure proof."
    );
  }

  if (artifact.reviewRecord && !hasCompleteReviewedBlockerProof(artifact.reviewRecord)) {
    return result(
      "review",
      artifact,
      "Phase 8 audit review artifact has incomplete reviewed top-blocker proof.",
      "Re-record owner audit review so label, source, kind, status, and action for the reviewed blocker stay attached together."
    );
  }

  if (artifact.blockerPriority.openBlockerCount > 0) {
    return result(
      "review",
      artifact,
      `Phase 8 audit review artifact is valid but still has ${artifact.blockerPriority.openBlockerCount} open blocker${artifact.blockerPriority.openBlockerCount === 1 ? "" : "s"}.`,
      artifact.blockerPriority.topPriorityAction
    );
  }

  if (!artifact.traceability.canTrustPermissionAudit) {
    return result(
      "review",
      artifact,
      "Phase 8 audit review artifact has no open blockers, but permission/audit traceability is not trusted yet.",
      artifact.traceability.nextAction
    );
  }

  if (!artifact.reviewRecord) {
    return result(
      "review",
      artifact,
      "Phase 8 audit review artifact has trusted evidence but no owner audit review record attached.",
      "Record owner audit review before treating Phase 8 permission and audit evidence as ready."
    );
  }

  return result(
    "ready",
    artifact,
    "Phase 8 audit review artifact contains current audit-depth, risk exception, disabled-path, traceability, blocker-priority, and owner-review evidence while mutation paths remain locked.",
    "Keep the Phase 8 audit review artifact attached before Phase 9 runner approval advances."
  );
}

export function verifySerializedPhase8AuditReviewArtifact(
  serializedArtifact: string,
  options: Phase8AuditReviewArtifactVerifyOptions = {}
): Phase8AuditReviewArtifactVerification {
  return verifyPhase8AuditReviewArtifact(
    parsePhase8AuditReviewArtifact(serializedArtifact),
    options
  );
}
