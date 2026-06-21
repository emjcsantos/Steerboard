import type {
  Phase8FinalCompletionHandoff
} from "./phase8FinalCompletionHandoff";
import type {
  Phase8OwnerReviewClosureReadiness
} from "./phase8OwnerReviewClosureReadiness";

export type Phase8CloseoutStatusState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase8CloseoutStatus {
  readonly id: string;
  readonly label: string;
  readonly state: Phase8CloseoutStatusState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly phaseComplete: boolean;
  readonly phase9DependencyReady: boolean;
  readonly mutationPathsLocked: boolean;
  readonly canAdvanceMutationPaths: boolean;
  readonly mutationExpansionHeld: boolean;
  readonly approvedMutationSurfaceCount: number;
  readonly handlerMutationSurfaceCount: number;
  readonly requiredMutationSurfaceCount: number;
  readonly ownerReviewClosed: boolean;
  readonly finalHandoffReady: boolean;
  readonly ownerReviewRecorded: boolean;
  readonly openBlockerCount: number;
  readonly openExceptionCount: number;
  readonly auditReviewBlockersRemaining: number;
  readonly topHold: string;
  readonly phase8CloseoutStatusProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase8CloseoutStatusInput {
  readonly ownerReviewClosureReadiness: Phase8OwnerReviewClosureReadiness;
  readonly finalCompletionHandoff: Phase8FinalCompletionHandoff;
  readonly approvedMutationSurfaceCount?: number;
  readonly handlerMutationSurfaceCount?: number;
}

const STATUS_LABELS: Record<Phase8CloseoutStatusState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SAFETY =
  "Phase 8 closeout status is evidence-only. It closes the Phase 8 proof surface for Phase 9 dependency review without recording owner review, requesting approval, running actions, mutating files, exporting records, or unlocking mutation paths.";
const REQUIRED_MUTATION_SURFACE_COUNT = 9;

function resolveState(input: Phase8CloseoutStatusInput): Phase8CloseoutStatusState {
  if (
    input.ownerReviewClosureReadiness.state === "blocked" ||
    input.finalCompletionHandoff.state === "blocked"
  ) {
    return "blocked";
  }

  if (
    input.ownerReviewClosureReadiness.canCloseOwnerReview &&
    input.finalCompletionHandoff.phaseComplete &&
    input.finalCompletionHandoff.canAdvancePhase9
  ) {
    return "ready";
  }

  if (
    input.ownerReviewClosureReadiness.state === "review" ||
    input.finalCompletionHandoff.state === "review"
  ) {
    return "review";
  }

  return "waiting";
}

function readinessForState(state: Phase8CloseoutStatusState): number {
  if (state === "ready") {
    return 100;
  }
  if (state === "review") {
    return 90;
  }
  if (state === "waiting") {
    return 75;
  }
  return 0;
}

function topHold(input: Phase8CloseoutStatusInput): string {
  if (input.ownerReviewClosureReadiness.auditReviewBlockersRemaining > 0) {
    return "audit-review-blockers";
  }
  if (!input.ownerReviewClosureReadiness.canCloseOwnerReview) {
    return "owner-review-closure";
  }
  if (!input.finalCompletionHandoff.phaseComplete) {
    return "final-handoff";
  }
  if (!input.finalCompletionHandoff.canAdvancePhase9) {
    return "phase-9-dependency";
  }
  return "none";
}

function nextAction(
  input: Phase8CloseoutStatusInput,
  state: Phase8CloseoutStatusState,
  hold: string
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 8 owner-review closure or final handoff evidence before closeout can be trusted.";
  }
  if (state === "ready") {
    return "Phase 8 closeout proof is ready for Phase 9 dependency review; keep mutation paths locked.";
  }
  if (hold === "owner-review-closure") {
    return input.ownerReviewClosureReadiness.nextAction;
  }
  return input.finalCompletionHandoff.nextAction;
}

function proof(
  summary: Omit<Phase8CloseoutStatus, "ariaLabel" | "phase8CloseoutStatusProof">
): string {
  return (
    `phase8CloseoutStatusProof=state=${summary.state} readiness=${summary.readiness} ` +
    `phaseComplete=${summary.phaseComplete ? "yes" : "no"} ` +
    `phase9Dependency=${summary.phase9DependencyReady ? "ready" : "held"} ` +
    `mutationPaths=${summary.mutationPathsLocked ? "locked" : "unlocked"} ` +
    `mutationExpansion=${summary.mutationExpansionHeld ? "held" : "ready"} ` +
    `approvals=${summary.approvedMutationSurfaceCount}/${summary.requiredMutationSurfaceCount} ` +
    `handlers=${summary.handlerMutationSurfaceCount}/${summary.requiredMutationSurfaceCount} ` +
    `canAdvanceMutation=${summary.canAdvanceMutationPaths ? "yes" : "no"} ` +
    `ownerReviewClose=${summary.ownerReviewClosed ? "ready" : "held"} ` +
    `finalHandoff=${summary.finalHandoffReady ? "ready" : "held"} ` +
    `recorded=${summary.ownerReviewRecorded ? "yes" : "no"} ` +
    `open=${summary.openBlockerCount} openExceptions=${summary.openExceptionCount} ` +
    `auditReviewBlockers=${summary.auditReviewBlockersRemaining} topHold=${summary.topHold}`
  );
}

function ariaLabel(summary: Omit<Phase8CloseoutStatus, "ariaLabel">): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `phase complete ${summary.phaseComplete ? "yes" : "no"}; ` +
    `Phase 9 dependency ${summary.phase9DependencyReady ? "ready" : "held"}; ` +
    `mutation paths ${summary.mutationPathsLocked ? "locked" : "unlocked"}; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase8CloseoutStatus(
  input: Phase8CloseoutStatusInput
): Phase8CloseoutStatus {
  const state = resolveState(input);
  const hold = topHold(input);
  const phaseComplete =
    state === "ready" && input.finalCompletionHandoff.phaseComplete;
  const approvedMutationSurfaceCount = input.approvedMutationSurfaceCount ?? 0;
  const handlerMutationSurfaceCount = input.handlerMutationSurfaceCount ?? 0;
  const canAdvanceMutationPaths = false;
  const draft = {
    id: "phase-8-closeout-status",
    label: "Phase 8 closeout status",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    phaseComplete,
    phase9DependencyReady:
      phaseComplete && input.finalCompletionHandoff.canAdvancePhase9,
    mutationPathsLocked: true,
    canAdvanceMutationPaths,
    mutationExpansionHeld: !canAdvanceMutationPaths,
    approvedMutationSurfaceCount,
    handlerMutationSurfaceCount,
    requiredMutationSurfaceCount: REQUIRED_MUTATION_SURFACE_COUNT,
    ownerReviewClosed: input.ownerReviewClosureReadiness.canCloseOwnerReview,
    finalHandoffReady: input.finalCompletionHandoff.phaseComplete,
    ownerReviewRecorded: input.ownerReviewClosureReadiness.ownerReviewRecorded,
    openBlockerCount: input.finalCompletionHandoff.openBlockerCount,
    openExceptionCount: input.finalCompletionHandoff.openExceptionCount,
    auditReviewBlockersRemaining:
      input.finalCompletionHandoff.auditReviewBlockersRemaining,
    topHold: hold,
    nextAction: nextAction(input, state, hold),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase8CloseoutStatusProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
