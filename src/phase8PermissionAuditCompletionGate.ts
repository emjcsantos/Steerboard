import type { Phase8AuditReviewArtifactVerification } from "./phase8AuditReviewArtifact";
import type { Phase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import type { Phase8PermissionAuditDepthSnapshot } from "./phase8PermissionAuditDepth";
import type { Phase8RiskBlockerPrioritySummary } from "./phase8RiskBlockerPriority";
import type { Phase8RiskTraceabilitySummary } from "./phase8RiskTraceability";

export type Phase8PermissionAuditCompletionGateState =
  | "complete"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase8PermissionAuditCompletionGate {
  readonly state: Phase8PermissionAuditCompletionGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly phaseComplete: boolean;
  readonly canAdvanceMutationPaths: boolean;
  readonly ownerReviewAttached: boolean;
  readonly artifactReady: boolean;
  readonly mutationLocked: boolean;
  readonly openBlockerCount: number;
  readonly openExceptionCount: number;
  readonly traceabilityTrusted: boolean;
  readonly reviewedBlockerProof: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly completionGateProof: string;
  readonly ariaLabel: string;
}

export interface Phase8PermissionAuditCompletionGateInput {
  readonly snapshot: Phase8PermissionAuditDepthSnapshot;
  readonly traceability: Phase8RiskTraceabilitySummary;
  readonly blockerPriority: Phase8RiskBlockerPrioritySummary;
  readonly artifactVerification?: Phase8AuditReviewArtifactVerification;
  readonly reviewRecord?: Phase8AuditReviewRecord;
}

const STATUS_LABELS: Record<Phase8PermissionAuditCompletionGateState, string> = {
  complete: "Complete",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function hasReviewedBlockerProof(record: Phase8AuditReviewRecord | undefined): boolean {
  return Boolean(
    record?.topBlockerSourceId &&
      record.topBlockerKind &&
      record.topBlockerStatus &&
      record.topBlockerAction
  );
}

function proof(
  gate: Omit<Phase8PermissionAuditCompletionGate, "completionGateProof" | "ariaLabel">
): string {
  return [
    "phase8PermissionAuditCompletionGate",
    `state=${gate.state}`,
    `phaseComplete=${gate.phaseComplete ? "yes" : "no"}`,
    `canAdvanceMutationPaths=${gate.canAdvanceMutationPaths ? "yes" : "no"}`,
    `ownerReview=${gate.ownerReviewAttached ? "attached" : "missing"}`,
    `artifact=${gate.artifactReady ? "ready" : "held"}`,
    `mutation=${gate.mutationLocked ? "locked" : "unlocked"}`,
    `openBlockers=${gate.openBlockerCount}`,
    `openExceptions=${gate.openExceptionCount}`,
    `traceability=${gate.traceabilityTrusted ? "ready" : "held"}`,
    `reviewedBlocker=${gate.reviewedBlockerProof ? "attached" : "missing"}`
  ].join(" ");
}

function ariaLabel(gate: Omit<Phase8PermissionAuditCompletionGate, "ariaLabel">): string {
  return (
    `Phase 8 permission audit completion gate: ${gate.statusLabel}; ` +
    `phase complete ${gate.phaseComplete ? "yes" : "no"}; ` +
    `mutation paths ${gate.canAdvanceMutationPaths ? "advanceable" : "locked"}; ` +
    `next action: ${gate.nextAction}`
  );
}

function result(
  state: Phase8PermissionAuditCompletionGateState,
  input: Phase8PermissionAuditCompletionGateInput,
  detail: string,
  nextAction: string
): Phase8PermissionAuditCompletionGate {
  const artifactReady = input.artifactVerification?.state === "ready";
  const ownerReviewAttached = Boolean(input.reviewRecord);
  const mutationLocked =
    input.snapshot.exceptions.every((exception) =>
      exception.disabledPath.toLowerCase().includes("disabled") ||
      exception.disabledPath.toLowerCase().includes("locked")
    ) && input.artifactVerification?.mutationLocked !== false;
  const draft = {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: state === "complete" ? 100 : state === "review" ? 85 : state === "waiting" ? 45 : 0,
    phaseComplete: state === "complete",
    canAdvanceMutationPaths: false,
    ownerReviewAttached,
    artifactReady,
    mutationLocked,
    openBlockerCount: input.blockerPriority.openBlockerCount,
    openExceptionCount: input.snapshot.openExceptionCount,
    traceabilityTrusted: input.traceability.canTrustPermissionAudit,
    reviewedBlockerProof: hasReviewedBlockerProof(input.reviewRecord),
    detail,
    nextAction
  };
  const gate = {
    ...draft,
    completionGateProof: proof(draft)
  };

  return {
    ...gate,
    ariaLabel: ariaLabel(gate)
  };
}

export function buildPhase8PermissionAuditCompletionGate(
  input: Phase8PermissionAuditCompletionGateInput
): Phase8PermissionAuditCompletionGate {
  if (
    input.snapshot.state === "blocked" ||
    input.traceability.state === "blocked" ||
    input.blockerPriority.state === "blocked" ||
    input.artifactVerification?.state === "blocked"
  ) {
    return result(
      "blocked",
      input,
      "Phase 8 permission audit completion is blocked by failed audit, traceability, or artifact evidence.",
      "Repair blocked Phase 8 permission, audit, rollback, traceability, and artifact evidence before closing the lane."
    );
  }

  if (
    input.snapshot.state === "waiting" ||
    input.traceability.state === "waiting" ||
    !input.artifactVerification ||
    !input.reviewRecord
  ) {
    return result(
      "waiting",
      input,
      "Phase 8 permission audit completion is waiting for owner review, artifact verification, and current audit evidence.",
      "Record owner audit review, verify the current Phase 8 audit artifact, and keep mutation paths locked before closing the lane."
    );
  }

  const reviewReady =
    input.snapshot.state === "ready" &&
    input.traceability.canTrustPermissionAudit &&
    input.blockerPriority.openBlockerCount === 0 &&
    input.snapshot.openExceptionCount === 0 &&
    input.artifactVerification.state === "ready" &&
    input.artifactVerification.hasReviewRecord &&
    input.artifactVerification.mutationLocked &&
    hasReviewedBlockerProof(input.reviewRecord);

  if (!reviewReady) {
    return result(
      "review",
      input,
      "Phase 8 permission audit completion remains in review until owner review, blocker closure, artifact verification, and reviewed-blocker proof are ready.",
      input.blockerPriority.nextAction
    );
  }

  return result(
    "complete",
    input,
    "Phase 8 permission and audit depth is complete as an owner-reviewed, artifact-verified audit lane; mutation-capable paths remain locked for later phases.",
    "Move active implementation to the next pending lane while preserving Phase 8 completion proof for Phase 9 runner approval."
  );
}
