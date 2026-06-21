import type { MigrationApplyDecisionGate } from "./migrationApplyDecisionGate";
import type { MigrationApplyImplementationBoundary } from "./migrationApplyImplementationBoundary";
import type { MigrationBlockerPrioritySummary } from "./migrationBlockerPriority";
import type { MigrationHardeningReadiness } from "./migrationHardeningReadiness";
import type { MigrationOwnerApprovalHandoff } from "./migrationOwnerApprovalHandoff";
import type { MigrationTraceabilitySummary } from "./migrationTraceability";

export type Phase5MigrationCompletionGateState = "complete" | "review" | "blocked" | "waiting";

export interface Phase5MigrationCompletionGate {
  readonly state: Phase5MigrationCompletionGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly phaseComplete: boolean;
  readonly reviewOnlyComplete: boolean;
  readonly canApplyMigration: boolean;
  readonly canActivateProfile: boolean;
  readonly profileActivationApprovalRequired: boolean;
  readonly profileActivationHandlerReady: boolean;
  readonly ownerApprovalRequestable: boolean;
  readonly ownerApprovalRecorded: boolean;
  readonly openBlockerCount: number;
  readonly traceabilityTrusted: boolean;
  readonly executorAvailable: boolean;
  readonly mutationPathAvailable: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly completionGateProof: string;
  readonly ariaLabel: string;
}

export interface Phase5MigrationCompletionGateInput {
  readonly readiness: MigrationHardeningReadiness;
  readonly traceability: MigrationTraceabilitySummary;
  readonly blockerPriority: MigrationBlockerPrioritySummary;
  readonly applyDecision: MigrationApplyDecisionGate;
  readonly ownerApprovalHandoff: MigrationOwnerApprovalHandoff;
  readonly applyImplementationBoundary: MigrationApplyImplementationBoundary;
}

const STATUS_LABELS: Record<Phase5MigrationCompletionGateState, string> = {
  complete: "Complete",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function proof(gate: Omit<Phase5MigrationCompletionGate, "completionGateProof" | "ariaLabel">): string {
  return [
    "phase5MigrationCompletionGate",
    `state=${gate.state}`,
    `phaseComplete=${gate.phaseComplete ? "yes" : "no"}`,
    `reviewOnly=${gate.reviewOnlyComplete ? "complete" : "held"}`,
    `canApply=${gate.canApplyMigration ? "yes" : "no"}`,
    `profileActivation=${gate.canActivateProfile ? "unlocked" : "locked"}`,
    `profileActivationApproval=${gate.profileActivationApprovalRequired ? "required" : "recorded"}`,
    `profileActivationHandler=${gate.profileActivationHandlerReady ? "ready" : "missing"}`,
    `ownerApprovalRequestable=${gate.ownerApprovalRequestable ? "yes" : "no"}`,
    `ownerApprovalRecorded=${gate.ownerApprovalRecorded ? "yes" : "no"}`,
    `openBlockers=${gate.openBlockerCount}`,
    `traceability=${gate.traceabilityTrusted ? "ready" : "held"}`,
    `executor=${gate.executorAvailable ? "available" : "missing"}`,
    `mutationPath=${gate.mutationPathAvailable ? "available" : "locked"}`
  ].join(" ");
}

function ariaLabel(gate: Omit<Phase5MigrationCompletionGate, "ariaLabel">): string {
  return (
    `Phase 5 migration completion gate: ${gate.statusLabel}; phase complete ${gate.phaseComplete ? "yes" : "no"}; ` +
    `review-only ${gate.reviewOnlyComplete ? "complete" : "held"}; can apply ${gate.canApplyMigration ? "yes" : "no"}; ` +
    `next action: ${gate.nextAction}`
  );
}

function result(
  state: Phase5MigrationCompletionGateState,
  input: Phase5MigrationCompletionGateInput,
  detail: string,
  nextAction: string
): Phase5MigrationCompletionGate {
  const draft = {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: state === "complete" ? 100 : state === "review" ? 85 : state === "waiting" ? 45 : 0,
    phaseComplete: state === "complete",
    reviewOnlyComplete: state === "complete",
    canApplyMigration: false,
    canActivateProfile: false,
    profileActivationApprovalRequired: true,
    profileActivationHandlerReady: false,
    ownerApprovalRequestable: input.ownerApprovalHandoff.canRequestOwnerApproval,
    ownerApprovalRecorded: input.ownerApprovalHandoff.ownerApprovalRecorded,
    openBlockerCount: input.blockerPriority.openBlockerCount,
    traceabilityTrusted: input.traceability.canTrustMigrationReview,
    executorAvailable: input.applyImplementationBoundary.executorAvailable,
    mutationPathAvailable: input.applyImplementationBoundary.mutationPathAvailable,
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

export function buildPhase5MigrationCompletionGate(
  input: Phase5MigrationCompletionGateInput
): Phase5MigrationCompletionGate {
  if (
    input.readiness.state === "blocked" ||
    input.traceability.state === "blocked" ||
    input.blockerPriority.state === "blocked" ||
    input.applyDecision.state === "blocked" ||
    input.ownerApprovalHandoff.state === "blocked" ||
    input.applyImplementationBoundary.state === "blocked"
  ) {
    return result(
      "blocked",
      input,
      "Phase 5 migration completion is blocked by failed review evidence.",
      "Repair blocked migration review evidence before Phase 5 can close."
    );
  }

  if (
    input.readiness.state === "waiting" ||
    input.traceability.state === "waiting" ||
    input.blockerPriority.state === "waiting" ||
    input.applyDecision.state === "waiting"
  ) {
    return result(
      "waiting",
      input,
      "Phase 5 migration completion is waiting for reviewed draft and traceability evidence.",
      "Finish migration review evidence before Phase 5 can close."
    );
  }

  const reviewReady =
    input.readiness.state === "ready" &&
    input.traceability.canTrustMigrationReview &&
    input.blockerPriority.openBlockerCount === 0 &&
    input.applyDecision.canStageApplyReview &&
    (input.ownerApprovalHandoff.canRequestOwnerApproval ||
      input.ownerApprovalHandoff.ownerApprovalRecorded) &&
    !input.applyDecision.canApplyMigration &&
    !input.applyDecision.canActivateProfile &&
    !input.applyImplementationBoundary.executorAvailable &&
    !input.applyImplementationBoundary.mutationPathAvailable &&
    !input.applyImplementationBoundary.canApplyMigration &&
    !input.applyImplementationBoundary.canActivateProfile;

  if (!reviewReady) {
    return result(
      "review",
      input,
      "Phase 5 migration completion remains in review until review-only proof, owner approval handoff, and no-apply boundary are ready.",
      input.applyImplementationBoundary.nextAction
    );
  }

  return result(
    "complete",
    input,
    "Phase 5 migration center is complete as a review-only migration workflow; actual apply execution remains unavailable and profile activation stays locked.",
    "Move active implementation to the next pending lane while preserving Phase 5 completion proof for owner review."
  );
}
