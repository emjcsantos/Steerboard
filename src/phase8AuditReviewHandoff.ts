import type { Phase8AuditReviewArtifactVerification } from "./phase8AuditReviewArtifact";
import type { Phase8AuditReviewRecord } from "./phase8AuditReviewRecord";
import type { Phase8PermissionAuditDepthSnapshot } from "./phase8PermissionAuditDepth";
import type { Phase8RiskBlockerPrioritySummary } from "./phase8RiskBlockerPriority";
import type { Phase8RiskTraceabilitySummary } from "./phase8RiskTraceability";

export type Phase8AuditReviewHandoffState = "ready" | "review" | "blocked" | "waiting";

export interface Phase8AuditReviewHandoff {
  readonly id: string;
  readonly label: string;
  readonly state: Phase8AuditReviewHandoffState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canRecordOwnerReview: boolean;
  readonly ownerReviewRecorded: boolean;
  readonly mutationLocked: boolean;
  readonly artifactVerified: boolean;
  readonly traceabilityTrusted: boolean;
  readonly openBlockerCount: number;
  readonly openExceptionCount: number;
  readonly topBlockerSourceId: string;
  readonly topBlockerStatus: string;
  readonly topBlockerReviewable: boolean;
  readonly reviewRecordId?: string;
  readonly phase8AuditReviewHandoffProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase8AuditReviewHandoffInput {
  readonly snapshot: Phase8PermissionAuditDepthSnapshot;
  readonly traceability: Phase8RiskTraceabilitySummary;
  readonly blockerPriority: Phase8RiskBlockerPrioritySummary;
  readonly artifactVerification?: Phase8AuditReviewArtifactVerification;
  readonly reviewRecord?: Phase8AuditReviewRecord;
}

const HANDOFF_ID = "phase-8-audit-review-handoff";
const HANDOFF_LABEL = "Phase 8 audit review handoff";
const SAFETY =
  "Phase 8 audit review handoff is local review evidence only. It can record owner review of permission, audit, rollback, artifact, and blocker evidence, but it does not request approval, grant access, run commands, mutate files, export audit records, or unlock mutation-capable paths.";

const STATUS_LABELS: Record<Phase8AuditReviewHandoffState, string> = {
  ready: "Review recorded",
  review: "Review held",
  blocked: "Blocked",
  waiting: "Review recordable"
};

function mutationLocked(input: Phase8AuditReviewHandoffInput): boolean {
  return (
    input.artifactVerification?.mutationLocked !== false &&
    input.snapshot.exceptions.every((exception) => {
      const text = exception.disabledPath.toLowerCase();
      return text.includes("disabled") || text.includes("locked");
    })
  );
}

function resolveState(input: Phase8AuditReviewHandoffInput): Phase8AuditReviewHandoffState {
  if (
    input.snapshot.state === "blocked" ||
    input.traceability.state === "blocked" ||
    input.blockerPriority.state === "blocked" ||
    input.artifactVerification?.state === "blocked" ||
    !mutationLocked(input)
  ) {
    return "blocked";
  }

  if (input.reviewRecord) {
    return input.artifactVerification?.state === "waiting" ? "review" : "ready";
  }

  if (input.snapshot.state === "waiting" || !input.artifactVerification) {
    return "waiting";
  }

  return "review";
}

function readinessForState(state: Phase8AuditReviewHandoffState): number {
  if (state === "ready") {
    return 100;
  }
  if (state === "review") {
    return 70;
  }
  if (state === "waiting") {
    return 60;
  }
  return 0;
}

function nextActionForState(
  state: Phase8AuditReviewHandoffState,
  input: Phase8AuditReviewHandoffInput
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 8 audit, traceability, artifact, or mutation-lock evidence before owner review can be recorded.";
  }
  if (state === "waiting") {
    return "Record local owner audit review of the current Phase 8 evidence; mutation paths remain locked and completion still requires artifact and blocker closure proof.";
  }
  if (state === "review") {
    return input.blockerPriority.topPriorityAction;
  }
  return "Owner audit review is recorded locally; keep artifact, reviewed-blocker, and mutation-lock proof attached for Phase 8 completion.";
}

function buildProof(handoff: Omit<Phase8AuditReviewHandoff, "ariaLabel" | "phase8AuditReviewHandoffProof">): string {
  return (
    `phase8AuditReviewHandoffProof=state=${handoff.state} readiness=${handoff.readiness} ` +
    `recordable=${handoff.canRecordOwnerReview ? "yes" : "no"} ` +
    `recorded=${handoff.ownerReviewRecorded ? "yes" : "no"} ` +
    `artifact=${handoff.artifactVerified ? "verified" : "held"} ` +
    `mutation=${handoff.mutationLocked ? "locked" : "unlocked"} ` +
    `traceability=${handoff.traceabilityTrusted ? "ready" : "held"} ` +
    `openBlockers=${handoff.openBlockerCount} openExceptions=${handoff.openExceptionCount} ` +
    `topBlocker=${handoff.topBlockerSourceId} topStatus=${handoff.topBlockerStatus} ` +
    `reviewable=${handoff.topBlockerReviewable ? "yes" : "no"} ` +
    `record=${handoff.reviewRecordId ?? "missing"}`
  );
}

function buildAriaLabel(handoff: Omit<Phase8AuditReviewHandoff, "ariaLabel">): string {
  return (
    `${handoff.label}: ${handoff.statusLabel}; ${handoff.readiness}% ready; ` +
    `recordable ${handoff.canRecordOwnerReview ? "yes" : "no"}; ` +
    `recorded ${handoff.ownerReviewRecorded ? "yes" : "no"}; ` +
    `mutation ${handoff.mutationLocked ? "locked" : "unlocked"}; ` +
    `next action: ${handoff.nextAction}`
  );
}

export function buildPhase8AuditReviewHandoff(
  input: Phase8AuditReviewHandoffInput
): Phase8AuditReviewHandoff {
  const state = resolveState(input);
  const ownerReviewRecorded = Boolean(input.reviewRecord);
  const handoff = {
    id: HANDOFF_ID,
    label: HANDOFF_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    canRecordOwnerReview:
      !ownerReviewRecorded && state !== "blocked" && mutationLocked(input),
    ownerReviewRecorded,
    mutationLocked: mutationLocked(input),
    artifactVerified: input.artifactVerification?.state === "ready",
    traceabilityTrusted: input.traceability.canTrustPermissionAudit,
    openBlockerCount: input.blockerPriority.openBlockerCount,
    openExceptionCount: input.snapshot.openExceptionCount,
    topBlockerSourceId: input.blockerPriority.topPrioritySourceId,
    topBlockerStatus: input.blockerPriority.topPriorityStatus,
    topBlockerReviewable: input.blockerPriority.auditReviewCanAddressTopBlocker,
    reviewRecordId: input.reviewRecord?.id,
    nextAction: nextActionForState(state, input),
    safety: SAFETY
  };
  const withProof = {
    ...handoff,
    phase8AuditReviewHandoffProof: buildProof(handoff)
  };

  return {
    ...withProof,
    ariaLabel: buildAriaLabel(withProof)
  };
}
