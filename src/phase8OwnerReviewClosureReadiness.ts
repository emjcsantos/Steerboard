import type {
  Phase8AuditReviewBlockerHandoff
} from "./phase8AuditReviewBlockerHandoff";
import type { Phase8AuditReviewHandoff } from "./phase8AuditReviewHandoff";
import type {
  Phase8PermissionAuditCompletionGate
} from "./phase8PermissionAuditCompletionGate";
import type { Phase8RiskClosureSummary } from "./phase8RiskClosure";

export type Phase8OwnerReviewClosureReadinessState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase8OwnerReviewClosureReadiness {
  readonly id: string;
  readonly label: string;
  readonly state: Phase8OwnerReviewClosureReadinessState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly ownerReviewRecorded: boolean;
  readonly ownerReviewRecordable: boolean;
  readonly auditReviewBlockersRemaining: number;
  readonly openBlockerCount: number;
  readonly openExceptionCount: number;
  readonly artifactReady: boolean;
  readonly fingerprintCurrent: boolean;
  readonly reviewedBlockerProof: boolean;
  readonly handoffReady: boolean;
  readonly completionGateReady: boolean;
  readonly phaseComplete: boolean;
  readonly canCloseOwnerReview: boolean;
  readonly topAuditReviewSourceId: string;
  readonly phase8OwnerReviewClosureReadinessProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase8OwnerReviewClosureReadinessInput {
  readonly riskClosure: Phase8RiskClosureSummary;
  readonly auditReviewHandoff: Phase8AuditReviewHandoff;
  readonly auditReviewBlockerHandoff: Phase8AuditReviewBlockerHandoff;
  readonly completionGate: Phase8PermissionAuditCompletionGate;
}

const STATUS_LABELS: Record<Phase8OwnerReviewClosureReadinessState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SAFETY =
  "Phase 8 owner-review closure readiness is evidence-only. It summarizes owner-review closure gates without recording review, requesting approval, granting access, running actions, mutating files, exporting records, or unlocking mutation paths.";

function resolveState(
  input: Phase8OwnerReviewClosureReadinessInput
): Phase8OwnerReviewClosureReadinessState {
  if (
    input.riskClosure.state === "blocked" ||
    input.auditReviewHandoff.state === "blocked" ||
    input.auditReviewBlockerHandoff.state === "blocked" ||
    input.completionGate.state === "blocked"
  ) {
    return "blocked";
  }

  if (
    input.completionGate.phaseComplete &&
    input.auditReviewHandoff.state === "ready" &&
    input.auditReviewBlockerHandoff.auditReviewBlockerCount === 0
  ) {
    return "ready";
  }

  if (
    input.auditReviewHandoff.ownerReviewRecorded ||
    input.auditReviewHandoff.state === "review" ||
    input.completionGate.state === "review"
  ) {
    return "review";
  }

  return "waiting";
}

function readinessForState(state: Phase8OwnerReviewClosureReadinessState): number {
  if (state === "ready") {
    return 100;
  }
  if (state === "review") {
    return 85;
  }
  if (state === "waiting") {
    return 60;
  }
  return 0;
}

function nextAction(
  input: Phase8OwnerReviewClosureReadinessInput,
  state: Phase8OwnerReviewClosureReadinessState
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 8 owner-review, audit-review blocker, closure, or completion-gate evidence before owner-review closure can be trusted.";
  }

  if (state === "ready") {
    return "Owner-review closure is ready; preserve Phase 8 completion proof for Phase 9 runner approval.";
  }

  if (input.auditReviewBlockerHandoff.auditReviewBlockerCount > 0) {
    return input.auditReviewBlockerHandoff.nextAction;
  }

  if (!input.auditReviewHandoff.ownerReviewRecorded) {
    return "Record local owner audit review with current fingerprint and reviewed-blocker proof before Phase 8 closure.";
  }

  if (!input.auditReviewHandoff.auditFingerprintCurrent) {
    return "Re-record owner audit review from the current Phase 8 evidence before closure.";
  }

  if (!input.auditReviewHandoff.reviewedBlockerProof) {
    return "Re-record owner audit review with complete reviewed-blocker proof before closure.";
  }

  if (!input.completionGate.phaseComplete) {
    return input.completionGate.nextAction;
  }

  return input.auditReviewHandoff.nextAction;
}

function proof(
  summary: Omit<
    Phase8OwnerReviewClosureReadiness,
    "ariaLabel" | "phase8OwnerReviewClosureReadinessProof"
  >
): string {
  return (
    `phase8OwnerReviewClosureReadinessProof=state=${summary.state} readiness=${summary.readiness} ` +
    `recorded=${summary.ownerReviewRecorded ? "yes" : "no"} ` +
    `recordable=${summary.ownerReviewRecordable ? "yes" : "no"} ` +
    `auditReviewBlockers=${summary.auditReviewBlockersRemaining} ` +
    `open=${summary.openBlockerCount} openExceptions=${summary.openExceptionCount} ` +
    `artifact=${summary.artifactReady ? "ready" : "held"} ` +
    `fingerprint=${summary.fingerprintCurrent ? "current" : "held"} ` +
    `reviewedBlocker=${summary.reviewedBlockerProof ? "attached" : "missing"} ` +
    `handoff=${summary.handoffReady ? "ready" : "held"} ` +
    `gate=${summary.completionGateReady ? "ready" : "held"} ` +
    `phaseComplete=${summary.phaseComplete ? "yes" : "no"} ` +
    `canClose=${summary.canCloseOwnerReview ? "yes" : "no"} ` +
    `top=${summary.topAuditReviewSourceId}`
  );
}

function ariaLabel(summary: Omit<Phase8OwnerReviewClosureReadiness, "ariaLabel">): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `owner review recorded ${summary.ownerReviewRecorded ? "yes" : "no"}; ` +
    `${summary.auditReviewBlockersRemaining} audit-review blockers; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase8OwnerReviewClosureReadiness(
  input: Phase8OwnerReviewClosureReadinessInput
): Phase8OwnerReviewClosureReadiness {
  const state = resolveState(input);
  const canCloseOwnerReview =
    state === "ready" &&
    input.auditReviewHandoff.ownerReviewRecorded &&
    input.auditReviewHandoff.auditFingerprintCurrent &&
    input.auditReviewHandoff.reviewedBlockerProof &&
    input.completionGate.phaseComplete;
  const draft = {
    id: "phase-8-owner-review-closure-readiness",
    label: "Phase 8 owner-review closure readiness",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    ownerReviewRecorded: input.auditReviewHandoff.ownerReviewRecorded,
    ownerReviewRecordable: input.auditReviewHandoff.canRecordOwnerReview,
    auditReviewBlockersRemaining:
      input.auditReviewBlockerHandoff.auditReviewBlockerCount,
    openBlockerCount: input.riskClosure.openBlockerCount,
    openExceptionCount: input.riskClosure.openExceptionCount,
    artifactReady: input.auditReviewHandoff.artifactVerified,
    fingerprintCurrent: input.auditReviewHandoff.auditFingerprintCurrent,
    reviewedBlockerProof: input.auditReviewHandoff.reviewedBlockerProof,
    handoffReady: input.auditReviewHandoff.state === "ready",
    completionGateReady: input.completionGate.phaseComplete,
    phaseComplete: input.completionGate.phaseComplete,
    canCloseOwnerReview,
    topAuditReviewSourceId: input.auditReviewBlockerHandoff.topAuditReviewSourceId,
    nextAction: nextAction(input, state),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase8OwnerReviewClosureReadinessProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
