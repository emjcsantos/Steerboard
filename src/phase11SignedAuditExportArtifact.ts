import type {
  Phase11EvidenceRecordSnapshot,
  Phase11EvidenceRecordsSnapshot
} from "./phase11EvidenceRecords";
import type { Phase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";
import type { ReleasePrivacyReadinessSnapshot } from "./releasePrivacyReadiness";
import type { SecurityFinalReviewSnapshot } from "./securityFinalReview";

export type Phase11SignedAuditExportArtifactState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase11SignedAuditExportPayload {
  readonly exportedAt: string;
  readonly evaluatedAt: string;
  readonly signedAuditEvidence: Phase11EvidenceRecordSnapshot;
  readonly releaseReadiness: Phase11ReleaseReadinessSnapshot;
  readonly releasePrivacy: ReleasePrivacyReadinessSnapshot;
  readonly securityFinalReview: SecurityFinalReviewSnapshot;
  readonly rollbackReferences: readonly string[];
  readonly noMutationScope: readonly string[];
  readonly packagingPaused: boolean;
}

export interface Phase11SignedAuditExportArtifact {
  readonly schemaVersion: 1;
  readonly source: "steerboard.phase11.signed-audit-export.v1";
  readonly payload: Phase11SignedAuditExportPayload;
  readonly signature: string;
}

export interface Phase11SignedAuditExportArtifactVerification {
  readonly state: Phase11SignedAuditExportArtifactState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canVerifyOffline: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly signature: string;
  readonly expectedSignature: string;
  readonly rollbackReferenceCount: number;
  readonly noMutationScopeCount: number;
  readonly releasePrivacyState: string;
  readonly securityFinalReviewState: string;
  readonly signedAuditEvidenceState: string;
}

export interface Phase11SignedAuditExportArtifactBuildInput {
  readonly exportedAt?: string;
  readonly evaluatedAt?: string;
  readonly evidenceRecords: Phase11EvidenceRecordsSnapshot;
  readonly releaseReadiness: Phase11ReleaseReadinessSnapshot;
  readonly releasePrivacy: ReleasePrivacyReadinessSnapshot;
  readonly securityFinalReview: SecurityFinalReviewSnapshot;
  readonly rollbackReferences?: readonly string[];
  readonly noMutationScope?: readonly string[];
  readonly packagingPaused?: boolean;
}

const STATUS_LABELS: Record<Phase11SignedAuditExportArtifactState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const DEFAULT_ROLLBACK_REFERENCES = [
  "Phase 11 release readiness packaging lock",
  "Phase 11 release closeout packaging-paused evidence",
  "Project Management Phase 11 signed audit export child row"
];

const DEFAULT_NO_MUTATION_SCOPE = [
  "local JSON download only",
  "no filesystem write outside browser download",
  "no process execution",
  "no network call",
  "no Git push",
  "no packaging resume"
];

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function shortHash(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildSignature(payload: Phase11SignedAuditExportPayload): string {
  return `phase11-signed-audit:${shortHash(stableJson(payload))}`;
}

function evidenceRecordFromArtifact(
  artifact: Phase11SignedAuditExportArtifact | undefined
): Phase11EvidenceRecordSnapshot | undefined {
  return artifact?.payload.signedAuditEvidence;
}

function result(
  state: Phase11SignedAuditExportArtifactState,
  artifact: Phase11SignedAuditExportArtifact | undefined,
  detail: string,
  nextAction: string
): Phase11SignedAuditExportArtifactVerification {
  const expectedSignature = artifact ? buildSignature(artifact.payload) : "";
  const evidence = evidenceRecordFromArtifact(artifact);
  const readiness =
    state === "ready" ? 100 : state === "review" ? 70 : state === "blocked" ? 20 : 35;

  return {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    canVerifyOffline: state === "ready" || state === "review",
    detail,
    nextAction,
    signature: artifact?.signature ?? "",
    expectedSignature,
    rollbackReferenceCount: artifact?.payload.rollbackReferences.length ?? 0,
    noMutationScopeCount: artifact?.payload.noMutationScope.length ?? 0,
    releasePrivacyState: artifact?.payload.releasePrivacy.state ?? "missing",
    securityFinalReviewState: artifact?.payload.securityFinalReview.state ?? "missing",
    signedAuditEvidenceState: evidence?.state ?? "missing"
  };
}

export function buildPhase11SignedAuditExportArtifact(
  input: Phase11SignedAuditExportArtifactBuildInput
): Phase11SignedAuditExportArtifact {
  const now = new Date().toISOString();
  const payload: Phase11SignedAuditExportPayload = {
    exportedAt: input.exportedAt ?? now,
    evaluatedAt: input.evaluatedAt ?? now,
    signedAuditEvidence: input.evidenceRecords.records["signed-audit-export"],
    releaseReadiness: input.releaseReadiness,
    releasePrivacy: input.releasePrivacy,
    securityFinalReview: input.securityFinalReview,
    rollbackReferences: input.rollbackReferences ?? DEFAULT_ROLLBACK_REFERENCES,
    noMutationScope: input.noMutationScope ?? DEFAULT_NO_MUTATION_SCOPE,
    packagingPaused: input.packagingPaused ?? true
  };

  return {
    schemaVersion: 1,
    source: "steerboard.phase11.signed-audit-export.v1",
    payload,
    signature: buildSignature(payload)
  };
}

export function serializePhase11SignedAuditExportArtifact(
  artifact: Phase11SignedAuditExportArtifact
): string {
  return JSON.stringify(artifact, null, 2);
}

export function parsePhase11SignedAuditExportArtifact(
  serializedArtifact: string
): Phase11SignedAuditExportArtifact | undefined {
  try {
    const parsed = JSON.parse(serializedArtifact);

    if (
      !isRecord(parsed) ||
      parsed.schemaVersion !== 1 ||
      parsed.source !== "steerboard.phase11.signed-audit-export.v1" ||
      !isRecord(parsed.payload) ||
      typeof parsed.signature !== "string"
    ) {
      return undefined;
    }

    return parsed as unknown as Phase11SignedAuditExportArtifact;
  } catch {
    return undefined;
  }
}

export function verifyPhase11SignedAuditExportArtifact(
  artifact: Phase11SignedAuditExportArtifact | undefined
): Phase11SignedAuditExportArtifactVerification {
  if (!artifact) {
    return result(
      "waiting",
      undefined,
      "Phase 11 signed audit export artifact is missing or malformed.",
      "Export the Phase 11 signed audit artifact from current release readiness evidence."
    );
  }

  if (
    artifact.schemaVersion !== 1 ||
    artifact.source !== "steerboard.phase11.signed-audit-export.v1"
  ) {
    return result(
      "waiting",
      artifact,
      "Phase 11 signed audit export artifact has an unsupported schema.",
      "Re-export the Phase 11 signed audit artifact from the current Steerboard build."
    );
  }

  const expectedSignature = buildSignature(artifact.payload);
  if (artifact.signature !== expectedSignature) {
    return result(
      "blocked",
      artifact,
      "Phase 11 signed audit export artifact signature does not match its payload.",
      "Re-export the signed audit artifact after restoring the current release evidence."
    );
  }

  if (
    artifact.payload.signedAuditEvidence.gate !== "signed-audit-export" ||
    artifact.payload.signedAuditEvidence.state !== "ready" ||
    artifact.payload.signedAuditEvidence.freshness !== "fresh"
  ) {
    return result(
      "review",
      artifact,
      "Phase 11 signed audit export artifact is valid, but signed-audit evidence is not fresh and ready.",
      artifact.payload.signedAuditEvidence.nextAction
    );
  }

  if (
    artifact.payload.rollbackReferences.length === 0 ||
    artifact.payload.noMutationScope.length === 0
  ) {
    return result(
      "review",
      artifact,
      "Phase 11 signed audit export artifact needs rollback references and no-mutation scope.",
      "Attach rollback references and no-mutation scope before treating the signed audit export as delivered."
    );
  }

  if (!artifact.payload.packagingPaused) {
    return result(
      "blocked",
      artifact,
      "Phase 11 signed audit export artifact was created while packaging pause evidence was not active.",
      "Restore packaging pause before exporting the signed audit artifact."
    );
  }

  if (
    !artifact.payload.noMutationScope.some((scope) => scope.toLowerCase().includes("no git push")) ||
    !artifact.payload.noMutationScope.some((scope) => scope.toLowerCase().includes("no network"))
  ) {
    return result(
      "review",
      artifact,
      "Phase 11 signed audit export artifact no-mutation scope is incomplete.",
      "Include no Git push and no network scope in the signed audit export."
    );
  }

  if (
    artifact.payload.releasePrivacy.state !== "ready" ||
    !artifact.payload.releasePrivacy.canRecommendRelease
  ) {
    return result(
      "review",
      artifact,
      "Phase 11 signed audit export artifact is valid, but release privacy readiness is not closed.",
      artifact.payload.releasePrivacy.detail
    );
  }

  if (
    artifact.payload.securityFinalReview.state !== "ready" ||
    !artifact.payload.securityFinalReview.canCloseSecurity
  ) {
    return result(
      "review",
      artifact,
      "Phase 11 signed audit export artifact is valid, but final security closure is not ready.",
      artifact.payload.securityFinalReview.detail
    );
  }

  if (
    artifact.payload.releaseReadiness.items.some(
      (item) => item.kind === "signed-audit-export" && item.status !== "ready"
    )
  ) {
    return result(
      "review",
      artifact,
      "Phase 11 signed audit export artifact is valid, but release readiness has not accepted the signed audit row.",
      "Record fresh signed audit export evidence before release readiness can proceed."
    );
  }

  return result(
    "ready",
    artifact,
    "Phase 11 signed audit export artifact contains fresh signed-audit evidence, matching local signature, rollback references, no-mutation export scope, release privacy readiness, and final security closure evidence.",
    "Keep the signed audit export JSON attached while packaging remains paused and release actions stay owner-held."
  );
}

export function verifySerializedPhase11SignedAuditExportArtifact(
  serializedArtifact: string
): Phase11SignedAuditExportArtifactVerification {
  return verifyPhase11SignedAuditExportArtifact(
    parsePhase11SignedAuditExportArtifact(serializedArtifact)
  );
}
