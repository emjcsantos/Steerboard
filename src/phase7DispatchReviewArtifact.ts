import type { DispatchReviewRecord } from "./dispatchReviewRecord";
import type { Phase7DispatchBlockerPrioritySummary } from "./phase7DispatchBlockerPriority";
import type { Phase7DispatchReviewDepthSnapshot } from "./phase7DispatchReviewDepth";
import type { Phase7DispatchTraceabilitySummary } from "./phase7DispatchTraceability";
import type { Phase7IntegrationOwnershipDepthSnapshot } from "./phase7IntegrationOwnershipDepth";

export type Phase7DispatchReviewArtifactState = "ready" | "review" | "blocked" | "waiting";

export interface Phase7DispatchReviewArtifact {
  readonly schemaVersion: 1;
  readonly source: "steerboard.phase7.dispatch-review.v1";
  readonly exportedAt: string;
  readonly evaluatedAt: string;
  readonly record: DispatchReviewRecord;
  readonly depth: Phase7DispatchReviewDepthSnapshot;
  readonly ownership: Phase7IntegrationOwnershipDepthSnapshot;
  readonly traceability: Phase7DispatchTraceabilitySummary;
  readonly blockerPriority: Phase7DispatchBlockerPrioritySummary;
}

export interface Phase7DispatchReviewArtifactVerification {
  readonly state: Phase7DispatchReviewArtifactState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canVerifyOffline: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly latestRecordId?: string;
  readonly reviewRecordCount: number;
  readonly openDepthCount: number;
  readonly openOwnershipCount: number;
  readonly openBlockerCount: number;
  readonly linkedPmTaskCount: number;
  readonly liveWorkerLockCount: number;
  readonly recordEvidenceFingerprint?: string;
  readonly currentEvidenceFingerprint?: string;
  readonly expectedEvidenceFingerprint?: string;
  readonly matchesExpectedEvidence?: boolean;
  readonly executionLocked: boolean;
  readonly handoffPacketCount: number;
}

export interface Phase7DispatchReviewArtifactBuildInput {
  readonly exportedAt?: string;
  readonly evaluatedAt?: string;
  readonly record: DispatchReviewRecord;
  readonly depth: Phase7DispatchReviewDepthSnapshot;
  readonly ownership: Phase7IntegrationOwnershipDepthSnapshot;
  readonly traceability: Phase7DispatchTraceabilitySummary;
  readonly blockerPriority: Phase7DispatchBlockerPrioritySummary;
}

export interface Phase7DispatchReviewArtifactVerifyOptions {
  readonly verifiedAt?: string | Date;
  readonly maxArtifactAgeMs?: number;
  readonly expectedEvidenceFingerprint?: string;
}

const STATUS_LABELS: Record<Phase7DispatchReviewArtifactState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const DEFAULT_MAX_ARTIFACT_AGE_MS = 24 * 60 * 60 * 1000;
const REQUIRED_ROLES = ["orchestrator", "implementer", "validator", "integration"] as const;
const REQUIRED_DEPTH_PROOF_TERMS = [
  "records=",
  "open=0",
  "roles=4/4",
  "handoffTasks=",
  "validationGates=",
  "recordFingerprint=",
  "currentFingerprint=",
  "execution=locked"
] as const;
const REQUIRED_OWNERSHIP_PROOF_TERMS = [
  "items=5/5",
  "open=0",
  "ready=5",
  "integrationOwner=Main Codex",
  "finalValidationOwner=Main Codex",
  "commitPushReportingOwner=Main Codex",
  "traceabilityLinks=5/5",
  "execution=locked"
] as const;
const REQUIRED_TRACEABILITY_PROOF_TERMS = [
  "items=5/5",
  "ready=5",
  "pmLinks=10/10",
  "missingPm=0",
  "liveWorkerLocks=2/2",
  "trust=ready",
  "execution=locked"
] as const;
const REQUIRED_BLOCKER_PRIORITY_PROOF_TERMS = [
  "open=0",
  "dispatchReviewAddressable=0",
  "traceability=ready",
  "pmLinks=10/10",
  "liveWorkerLocks=2/2",
  "execution=locked"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function timestamp(value: string | Date | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isFresh(createdAt: string, verifiedAt: string | Date | undefined, maxAgeMs: number): boolean {
  const createdAtMs = timestamp(createdAt);
  const verifiedAtMs = verifiedAt ? timestamp(verifiedAt) : Date.now();

  if (createdAtMs === undefined || verifiedAtMs === undefined) {
    return false;
  }

  const ageMs = verifiedAtMs - createdAtMs;
  return ageMs >= 0 && ageMs <= maxAgeMs;
}

function includesAll(source: string | undefined, terms: readonly string[]): boolean {
  return Boolean(source && terms.every((term) => source.includes(term)));
}

function executionLocked(record: DispatchReviewRecord | undefined): boolean {
  const note = record?.noRuntimeExecutionNote.toLowerCase() ?? "";

  return (
    note.includes("local metadata") &&
    note.includes("do not launch") &&
    note.includes("execute runtime")
  );
}

function handoffPacketsReady(record: DispatchReviewRecord | undefined): boolean {
  if (!record || record.handoffPackets.length < REQUIRED_ROLES.length) {
    return false;
  }

  return REQUIRED_ROLES.every((role) => {
    const packet = record.handoffPackets.find((item) => item.role === role);
    const packetLock = packet?.noRuntimeExecutionNote.toLowerCase() ?? "";

    return Boolean(
      packet &&
        packet.owner.trim() &&
        packet.ownedAreas.length > 0 &&
        packet.validationLabel.trim() &&
        (packetLock.includes("no runtime execution") || packetLock.includes("local preview"))
    );
  });
}

function counts(
  artifact: Phase7DispatchReviewArtifact | undefined,
  expectedEvidenceFingerprint?: string
): Pick<
  Phase7DispatchReviewArtifactVerification,
  | "latestRecordId"
  | "reviewRecordCount"
  | "openDepthCount"
  | "openOwnershipCount"
  | "openBlockerCount"
  | "linkedPmTaskCount"
  | "liveWorkerLockCount"
  | "recordEvidenceFingerprint"
  | "currentEvidenceFingerprint"
  | "expectedEvidenceFingerprint"
  | "matchesExpectedEvidence"
  | "executionLocked"
  | "handoffPacketCount"
> {
  const recordEvidenceFingerprint = artifact?.record.reviewEvidenceFingerprint.trim();
  const expected = expectedEvidenceFingerprint?.trim();

  return {
    latestRecordId: artifact?.record.id,
    reviewRecordCount: artifact?.depth.reviewRecordCount ?? 0,
    openDepthCount: artifact?.depth.openDepthCount ?? 0,
    openOwnershipCount: artifact?.ownership.openDepthCount ?? 0,
    openBlockerCount: artifact?.blockerPriority.openBlockerCount ?? 0,
    linkedPmTaskCount: artifact?.traceability.linkedPmTaskCount ?? 0,
    liveWorkerLockCount: artifact?.traceability.liveWorkerLockCount ?? 0,
    recordEvidenceFingerprint: recordEvidenceFingerprint || undefined,
    currentEvidenceFingerprint: artifact?.depth.currentEvidenceFingerprint,
    expectedEvidenceFingerprint: expected || undefined,
    matchesExpectedEvidence: artifact && expected ? recordEvidenceFingerprint === expected : undefined,
    executionLocked: executionLocked(artifact?.record),
    handoffPacketCount: artifact?.record.handoffPackets.length ?? 0
  };
}

function result(
  state: Phase7DispatchReviewArtifactState,
  artifact: Phase7DispatchReviewArtifact | undefined,
  detail: string,
  nextAction: string,
  expectedEvidenceFingerprint?: string
): Phase7DispatchReviewArtifactVerification {
  return {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: state === "ready" ? 100 : state === "review" ? 70 : state === "blocked" ? 20 : 35,
    canVerifyOffline: state === "ready" || state === "review",
    detail,
    nextAction,
    ...counts(artifact, expectedEvidenceFingerprint)
  };
}

function firstMissingProof(
  artifact: Phase7DispatchReviewArtifact
): { detail: string; nextAction: string } | undefined {
  const checks: Array<{
    label: string;
    proof: string | undefined;
    terms: readonly string[];
    nextAction: string;
  }> = [
    {
      label: "dispatch review depth",
      proof: artifact.depth.dispatchReviewDepthProof,
      terms: REQUIRED_DEPTH_PROOF_TERMS,
      nextAction:
        "Re-export Phase 7 dispatch review evidence after review depth includes role, handoff, validation, fingerprint, and execution-lock proof."
    },
    {
      label: "integration ownership",
      proof: artifact.ownership.integrationOwnershipProof,
      terms: REQUIRED_OWNERSHIP_PROOF_TERMS,
      nextAction:
        "Re-export Phase 7 dispatch review evidence after main integration ownership proof is complete."
    },
    {
      label: "dispatch traceability",
      proof: artifact.traceability.dispatchTraceabilityProof,
      terms: REQUIRED_TRACEABILITY_PROOF_TERMS,
      nextAction:
        "Re-export Phase 7 dispatch review evidence after traceability includes PM links, live-worker locks, and trust proof."
    },
    {
      label: "dispatch blocker priority",
      proof: artifact.blockerPriority.dispatchBlockerPriorityProof,
      terms: REQUIRED_BLOCKER_PRIORITY_PROOF_TERMS,
      nextAction:
        "Re-export Phase 7 dispatch review evidence after blocker priority shows no open blockers and locked execution."
    }
  ];

  for (const check of checks) {
    if (!check.proof?.trim()) {
      return {
        detail: `Phase 7 dispatch review artifact is missing ${check.label} aggregate proof.`,
        nextAction: check.nextAction
      };
    }

    const missingTerms = check.terms.filter((term) => !check.proof?.includes(term));
    if (missingTerms.length > 0) {
      return {
        detail: `Phase 7 dispatch review artifact has incomplete ${check.label} aggregate proof: missing ${missingTerms.join(", ")}.`,
        nextAction: check.nextAction
      };
    }
  }

  return undefined;
}

export function buildPhase7DispatchReviewArtifact(
  input: Phase7DispatchReviewArtifactBuildInput
): Phase7DispatchReviewArtifact {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    source: "steerboard.phase7.dispatch-review.v1",
    exportedAt: input.exportedAt ?? now,
    evaluatedAt: input.evaluatedAt ?? now,
    record: input.record,
    depth: input.depth,
    ownership: input.ownership,
    traceability: input.traceability,
    blockerPriority: input.blockerPriority
  };
}

export function serializePhase7DispatchReviewArtifact(
  artifact: Phase7DispatchReviewArtifact
): string {
  return JSON.stringify(artifact, null, 2);
}

export function parsePhase7DispatchReviewArtifact(
  serializedArtifact: string
): Phase7DispatchReviewArtifact | undefined {
  try {
    const parsed = JSON.parse(serializedArtifact);

    if (
      !isRecord(parsed) ||
      parsed.schemaVersion !== 1 ||
      parsed.source !== "steerboard.phase7.dispatch-review.v1" ||
      typeof parsed.exportedAt !== "string" ||
      typeof parsed.evaluatedAt !== "string" ||
      !isRecord(parsed.record) ||
      !isRecord(parsed.depth) ||
      !isRecord(parsed.ownership) ||
      !isRecord(parsed.traceability) ||
      !isRecord(parsed.blockerPriority)
    ) {
      return undefined;
    }

    return parsed as unknown as Phase7DispatchReviewArtifact;
  } catch {
    return undefined;
  }
}

export function verifyPhase7DispatchReviewArtifact(
  artifact: Phase7DispatchReviewArtifact | undefined,
  options: Phase7DispatchReviewArtifactVerifyOptions = {}
): Phase7DispatchReviewArtifactVerification {
  const expectedEvidenceFingerprint = options.expectedEvidenceFingerprint?.trim();

  if (!artifact) {
    return result(
      "waiting",
      undefined,
      "Phase 7 dispatch review artifact is missing or malformed.",
      "Export or import a Phase 7 dispatch review artifact before offline verification.",
      expectedEvidenceFingerprint
    );
  }

  if (artifact.schemaVersion !== 1 || artifact.source !== "steerboard.phase7.dispatch-review.v1") {
    return result(
      "waiting",
      artifact,
      "Phase 7 dispatch review artifact has an unsupported schema.",
      "Re-export the Phase 7 dispatch review artifact from the current Steerboard build.",
      expectedEvidenceFingerprint
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
      "Phase 7 dispatch review artifact is stale or future-dated.",
      "Re-export Phase 7 dispatch review evidence from the current dispatch review record.",
      expectedEvidenceFingerprint
    );
  }

  if (!artifact.record.reviewEvidenceFingerprint.trim()) {
    return result(
      "review",
      artifact,
      "Phase 7 dispatch review artifact is missing the saved review evidence fingerprint.",
      "Restage the dispatch review record so saved evidence can be matched offline.",
      expectedEvidenceFingerprint
    );
  }

  if (
    expectedEvidenceFingerprint &&
    artifact.record.reviewEvidenceFingerprint.trim() !== expectedEvidenceFingerprint
  ) {
    return result(
      "review",
      artifact,
      "Phase 7 dispatch review artifact evidence fingerprint does not match the expected dispatch record.",
      "Re-export Phase 7 dispatch review evidence from the current role-panel run.",
      expectedEvidenceFingerprint
    );
  }

  if (artifact.depth.recordEvidenceFingerprint !== artifact.record.reviewEvidenceFingerprint) {
    return result(
      "review",
      artifact,
      "Phase 7 dispatch review depth fingerprint does not match the exported dispatch record.",
      "Rebuild review depth from the selected dispatch review record before exporting.",
      expectedEvidenceFingerprint
    );
  }

  if (!handoffPacketsReady(artifact.record)) {
    return result(
      "review",
      artifact,
      "Phase 7 dispatch review artifact is missing complete per-role handoff packet evidence.",
      "Restage the dispatch review so orchestrator, implementer, validator, and integration packets can be verified.",
      expectedEvidenceFingerprint
    );
  }

  if (!executionLocked(artifact.record) || artifact.traceability.liveWorkerLockCount < 2) {
    return result(
      "blocked",
      artifact,
      "Phase 7 dispatch review artifact cannot be trusted because live-worker execution is not locked.",
      "Restore the local metadata-only no-runtime execution boundary before exporting dispatch review evidence.",
      expectedEvidenceFingerprint
    );
  }

  if (artifact.depth.state !== "ready" || artifact.ownership.state !== "ready") {
    return result(
      "review",
      artifact,
      "Phase 7 dispatch review artifact still has open review-depth or integration-ownership rows.",
      artifact.depth.state !== "ready" ? artifact.depth.nextAction : artifact.ownership.nextAction,
      expectedEvidenceFingerprint
    );
  }

  if (!artifact.traceability.canTrustDispatchReview) {
    return result(
      "review",
      artifact,
      "Phase 7 dispatch review artifact has untrusted traceability.",
      artifact.traceability.nextAction,
      expectedEvidenceFingerprint
    );
  }

  if (artifact.blockerPriority.openBlockerCount > 0) {
    return result(
      "review",
      artifact,
      `Phase 7 dispatch review artifact is valid but still has ${artifact.blockerPriority.openBlockerCount} open blocker${artifact.blockerPriority.openBlockerCount === 1 ? "" : "s"}.`,
      artifact.blockerPriority.topPriorityAction,
      expectedEvidenceFingerprint
    );
  }

  const missingProof = firstMissingProof(artifact);
  if (missingProof) {
    return result(
      "review",
      artifact,
      missingProof.detail,
      missingProof.nextAction,
      expectedEvidenceFingerprint
    );
  }

  return result(
    "ready",
    artifact,
    "Phase 7 dispatch review artifact contains current handoff packet, review depth, integration ownership, traceability, blocker priority, and live-worker lock evidence.",
    "Keep the Phase 7 dispatch review artifact attached while live worker spawning remains locked.",
    expectedEvidenceFingerprint
  );
}

export function verifySerializedPhase7DispatchReviewArtifact(
  serializedArtifact: string,
  options: Phase7DispatchReviewArtifactVerifyOptions = {}
): Phase7DispatchReviewArtifactVerification {
  return verifyPhase7DispatchReviewArtifact(
    parsePhase7DispatchReviewArtifact(serializedArtifact),
    options
  );
}

export function verifyRecordedPhase7DispatchReviewArtifact(
  serializedArtifact: string,
  options: Omit<Phase7DispatchReviewArtifactVerifyOptions, "expectedEvidenceFingerprint"> = {}
): Phase7DispatchReviewArtifactVerification {
  const artifact = parsePhase7DispatchReviewArtifact(serializedArtifact);

  return verifyPhase7DispatchReviewArtifact(artifact, {
    ...options,
    expectedEvidenceFingerprint: artifact?.record.reviewEvidenceFingerprint
  });
}
