import type { Phase8AuditReviewHandoff } from "./phase8AuditReviewHandoff";
import type { Phase8PermissionAuditCompletionGate } from "./phase8PermissionAuditCompletionGate";
import type { Phase8RiskClosureSummary } from "./phase8RiskClosure";

export type Phase8ClosureAuditStatusState = "complete" | "review" | "blocked" | "waiting";

export interface Phase8ClosureAuditStatus {
  readonly id: string;
  readonly label: string;
  readonly state: Phase8ClosureAuditStatusState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly phaseComplete: boolean;
  readonly canAdvanceMutationPaths: boolean;
  readonly openBlockerCount: number;
  readonly ownerActionBlockerCount: number;
  readonly auditReviewAddressableCount: number;
  readonly openExceptionCount: number;
  readonly blockedCategoryCount: number;
  readonly closureReady: boolean;
  readonly handoffReady: boolean;
  readonly completionGateReady: boolean;
  readonly closureState: string;
  readonly handoffState: string;
  readonly completionGateState: string;
  readonly topClosureSourceId: string;
  readonly topClosureStatus: string;
  readonly phase8ClosureAuditStatusProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase8ClosureAuditStatusInput {
  readonly riskClosure: Phase8RiskClosureSummary;
  readonly auditReviewHandoff: Phase8AuditReviewHandoff;
  readonly completionGate: Phase8PermissionAuditCompletionGate;
}

const STATUS_LABELS: Record<Phase8ClosureAuditStatusState, string> = {
  complete: "Complete",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SAFETY =
  "Phase 8 closure audit status is evidence-only. It summarizes remaining blocker categories without requesting approval, running actions, mutating files, exporting records, or unlocking mutation paths.";

function resolveState(input: Phase8ClosureAuditStatusInput): Phase8ClosureAuditStatusState {
  if (
    input.riskClosure.state === "blocked" ||
    input.auditReviewHandoff.state === "blocked" ||
    input.completionGate.state === "blocked"
  ) {
    return "blocked";
  }

  if (
    input.completionGate.phaseComplete &&
    input.riskClosure.canCloseBlockers &&
    input.auditReviewHandoff.state === "ready"
  ) {
    return "complete";
  }

  if (
    input.riskClosure.state === "waiting" ||
    input.auditReviewHandoff.state === "waiting" ||
    input.completionGate.state === "waiting"
  ) {
    return "waiting";
  }

  return "review";
}

function countBlockedCategories(input: Phase8ClosureAuditStatusInput): number {
  return [
    input.riskClosure.openBlockerCount > 0,
    input.riskClosure.ownerActionBlockerCount > 0,
    input.riskClosure.auditReviewAddressableCount > 0,
    input.riskClosure.openExceptionCount > 0,
    !input.riskClosure.canCloseBlockers,
    input.auditReviewHandoff.state !== "ready",
    !input.completionGate.phaseComplete
  ].filter(Boolean).length;
}

function readiness(input: Phase8ClosureAuditStatusInput, state: Phase8ClosureAuditStatusState): number {
  if (state === "complete") {
    return 100;
  }
  if (state === "blocked") {
    return 0;
  }
  return Math.min(
    99,
    Math.round(
      (input.riskClosure.readiness +
        input.auditReviewHandoff.readiness +
        input.completionGate.readiness) /
        3
    )
  );
}

function nextAction(input: Phase8ClosureAuditStatusInput, state: Phase8ClosureAuditStatusState): string {
  if (state === "blocked") {
    return "Repair blocked Phase 8 closure, handoff, or completion-gate evidence before closure status can be trusted.";
  }
  if (state === "complete") {
    return "Phase 8 closure is complete; preserve closure audit proof before Phase 9 runner approval advances.";
  }
  if (input.riskClosure.ownerActionBlockerCount > 0) {
    return "Resolve owner-action Phase 8 blockers before closure can complete.";
  }
  if (input.riskClosure.auditReviewAddressableCount > 0) {
    return "Use owner audit review on audit-review addressable blockers, then refresh closure audit status.";
  }
  if (input.riskClosure.openExceptionCount > 0) {
    return "Resolve open Phase 8 risk exceptions before closure can complete.";
  }
  if (input.auditReviewHandoff.state !== "ready") {
    return input.auditReviewHandoff.nextAction;
  }
  if (!input.completionGate.phaseComplete) {
    return input.completionGate.nextAction;
  }
  return input.riskClosure.nextAction;
}

function proof(summary: Omit<Phase8ClosureAuditStatus, "ariaLabel" | "phase8ClosureAuditStatusProof">): string {
  return (
    `phase8ClosureAuditStatusProof=state=${summary.state} readiness=${summary.readiness} ` +
    `phaseComplete=${summary.phaseComplete ? "yes" : "no"} ` +
    `mutationAdvance=${summary.canAdvanceMutationPaths ? "yes" : "no"} ` +
    `blockedCategories=${summary.blockedCategoryCount} openBlockers=${summary.openBlockerCount} ` +
    `ownerAction=${summary.ownerActionBlockerCount} auditReview=${summary.auditReviewAddressableCount} ` +
    `openExceptions=${summary.openExceptionCount} closure=${summary.closureState} ` +
    `handoff=${summary.handoffState} gate=${summary.completionGateState} ` +
    `top=${summary.topClosureSourceId} topStatus=${summary.topClosureStatus}`
  );
}

function ariaLabel(summary: Omit<Phase8ClosureAuditStatus, "ariaLabel">): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `${summary.blockedCategoryCount} blocked categories; phase complete ` +
    `${summary.phaseComplete ? "yes" : "no"}; next action: ${summary.nextAction}`
  );
}

export function buildPhase8ClosureAuditStatus(
  input: Phase8ClosureAuditStatusInput
): Phase8ClosureAuditStatus {
  const state = resolveState(input);
  const draft = {
    id: "phase-08-closure-audit-status",
    label: "Phase 8 closure audit status",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readiness(input, state),
    phaseComplete: input.completionGate.phaseComplete,
    canAdvanceMutationPaths: input.completionGate.canAdvanceMutationPaths,
    openBlockerCount: input.riskClosure.openBlockerCount,
    ownerActionBlockerCount: input.riskClosure.ownerActionBlockerCount,
    auditReviewAddressableCount: input.riskClosure.auditReviewAddressableCount,
    openExceptionCount: input.riskClosure.openExceptionCount,
    blockedCategoryCount: countBlockedCategories(input),
    closureReady: input.riskClosure.canCloseBlockers,
    handoffReady: input.auditReviewHandoff.state === "ready",
    completionGateReady: input.completionGate.phaseComplete,
    closureState: input.riskClosure.state,
    handoffState: input.auditReviewHandoff.state,
    completionGateState: input.completionGate.state,
    topClosureSourceId: input.riskClosure.topClosureSourceId,
    topClosureStatus: input.riskClosure.topClosureStatus,
    nextAction: nextAction(input, state),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase8ClosureAuditStatusProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
