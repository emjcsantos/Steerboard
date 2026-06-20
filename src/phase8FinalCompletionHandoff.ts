import type { Phase8ClosureAuditStatus } from "./phase8ClosureAuditStatus";
import type {
  Phase8OwnerReviewClosureReadiness
} from "./phase8OwnerReviewClosureReadiness";
import type {
  Phase8PermissionAuditCompletionGate
} from "./phase8PermissionAuditCompletionGate";
import type { Phase8RiskClosureSummary } from "./phase8RiskClosure";

export type Phase8FinalCompletionHandoffState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase8FinalCompletionHandoff {
  readonly id: string;
  readonly label: string;
  readonly state: Phase8FinalCompletionHandoffState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly phaseComplete: boolean;
  readonly canAdvancePhase9: boolean;
  readonly canAdvanceMutationPaths: boolean;
  readonly closureReady: boolean;
  readonly ownerReviewClosureReady: boolean;
  readonly completionGateReady: boolean;
  readonly ownerReviewRecorded: boolean;
  readonly openBlockerCount: number;
  readonly openExceptionCount: number;
  readonly auditReviewBlockersRemaining: number;
  readonly nextLane: string;
  readonly nextLaneStatus: "ready" | "held";
  readonly topHold: string;
  readonly phase8FinalCompletionHandoffProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase8FinalCompletionHandoffInput {
  readonly riskClosure: Phase8RiskClosureSummary;
  readonly closureAuditStatus: Phase8ClosureAuditStatus;
  readonly ownerReviewClosureReadiness: Phase8OwnerReviewClosureReadiness;
  readonly completionGate: Phase8PermissionAuditCompletionGate;
}

const STATUS_LABELS: Record<Phase8FinalCompletionHandoffState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SAFETY =
  "Phase 8 final completion handoff is evidence-only. It prepares the Phase 9 handoff without recording owner review, requesting approval, granting access, running actions, mutating files, exporting records, or unlocking mutation paths.";

function resolveState(input: Phase8FinalCompletionHandoffInput): Phase8FinalCompletionHandoffState {
  if (
    input.riskClosure.state === "blocked" ||
    input.closureAuditStatus.state === "blocked" ||
    input.ownerReviewClosureReadiness.state === "blocked" ||
    input.completionGate.state === "blocked"
  ) {
    return "blocked";
  }

  if (
    input.completionGate.phaseComplete &&
    input.ownerReviewClosureReadiness.canCloseOwnerReview &&
    input.riskClosure.canCloseBlockers
  ) {
    return "ready";
  }

  if (
    input.ownerReviewClosureReadiness.state === "review" ||
    input.completionGate.state === "review" ||
    input.closureAuditStatus.state === "review"
  ) {
    return "review";
  }

  return "waiting";
}

function readinessForState(state: Phase8FinalCompletionHandoffState): number {
  if (state === "ready") {
    return 100;
  }
  if (state === "review") {
    return 90;
  }
  if (state === "waiting") {
    return 70;
  }
  return 0;
}

function topHold(input: Phase8FinalCompletionHandoffInput): string {
  if (input.ownerReviewClosureReadiness.auditReviewBlockersRemaining > 0) {
    return "audit-review-blockers";
  }
  if (!input.ownerReviewClosureReadiness.ownerReviewRecorded) {
    return "owner-review-record";
  }
  if (!input.ownerReviewClosureReadiness.fingerprintCurrent) {
    return "current-fingerprint";
  }
  if (!input.ownerReviewClosureReadiness.reviewedBlockerProof) {
    return "reviewed-blocker-proof";
  }
  if (!input.riskClosure.canCloseBlockers) {
    return "risk-closure";
  }
  if (!input.completionGate.phaseComplete) {
    return "completion-gate";
  }
  return "none";
}

function nextAction(
  input: Phase8FinalCompletionHandoffInput,
  state: Phase8FinalCompletionHandoffState,
  hold: string
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 8 final handoff, closure, owner-review, or completion-gate evidence before Phase 9 can depend on Phase 8.";
  }
  if (state === "ready") {
    return "Phase 8 is ready for Phase 9 runner approval dependency; preserve completion proof while mutation paths remain locked.";
  }
  if (hold === "owner-review-record") {
    return "Record local owner audit review with current fingerprint and reviewed-blocker proof before Phase 8 can hand off to Phase 9.";
  }
  return input.ownerReviewClosureReadiness.nextAction;
}

function proof(
  summary: Omit<
    Phase8FinalCompletionHandoff,
    "ariaLabel" | "phase8FinalCompletionHandoffProof"
  >
): string {
  return (
    `phase8FinalCompletionHandoffProof=state=${summary.state} readiness=${summary.readiness} ` +
    `phaseComplete=${summary.phaseComplete ? "yes" : "no"} ` +
    `phase9=${summary.canAdvancePhase9 ? "ready" : "held"} ` +
    `mutationAdvance=${summary.canAdvanceMutationPaths ? "yes" : "no"} ` +
    `closure=${summary.closureReady ? "ready" : "held"} ` +
    `ownerReviewClosure=${summary.ownerReviewClosureReady ? "ready" : "held"} ` +
    `gate=${summary.completionGateReady ? "ready" : "held"} ` +
    `recorded=${summary.ownerReviewRecorded ? "yes" : "no"} ` +
    `open=${summary.openBlockerCount} openExceptions=${summary.openExceptionCount} ` +
    `auditReviewBlockers=${summary.auditReviewBlockersRemaining} ` +
    `nextLane=${summary.nextLane} nextLaneStatus=${summary.nextLaneStatus} ` +
    `topHold=${summary.topHold}`
  );
}

function ariaLabel(summary: Omit<Phase8FinalCompletionHandoff, "ariaLabel">): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `phase complete ${summary.phaseComplete ? "yes" : "no"}; ` +
    `Phase 9 ${summary.canAdvancePhase9 ? "ready" : "held"}; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase8FinalCompletionHandoff(
  input: Phase8FinalCompletionHandoffInput
): Phase8FinalCompletionHandoff {
  const state = resolveState(input);
  const hold = topHold(input);
  const phaseComplete =
    input.completionGate.phaseComplete &&
    input.ownerReviewClosureReadiness.canCloseOwnerReview &&
    input.riskClosure.canCloseBlockers;
  const draft = {
    id: "phase-8-final-completion-handoff",
    label: "Phase 8 final completion handoff",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    phaseComplete,
    canAdvancePhase9: phaseComplete,
    canAdvanceMutationPaths: false,
    closureReady: input.riskClosure.canCloseBlockers,
    ownerReviewClosureReady: input.ownerReviewClosureReadiness.canCloseOwnerReview,
    completionGateReady: input.completionGate.phaseComplete,
    ownerReviewRecorded: input.ownerReviewClosureReadiness.ownerReviewRecorded,
    openBlockerCount: input.riskClosure.openBlockerCount,
    openExceptionCount: input.riskClosure.openExceptionCount,
    auditReviewBlockersRemaining:
      input.ownerReviewClosureReadiness.auditReviewBlockersRemaining,
    nextLane: "Phase 9 runner approval",
    nextLaneStatus: (phaseComplete ? "ready" : "held") as "ready" | "held",
    topHold: hold,
    nextAction: nextAction(input, state, hold),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase8FinalCompletionHandoffProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
