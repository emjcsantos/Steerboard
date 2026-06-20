import type {
  Phase8PermissionAuditDepthSnapshot,
  Phase8PermissionAuditDepthState
} from "./phase8PermissionAuditDepth";
import type {
  Phase8RiskBlockerPriorityItem,
  Phase8RiskBlockerPrioritySummary
} from "./phase8RiskBlockerPriority";
import type { Phase8RiskTraceabilitySummary } from "./phase8RiskTraceability";

export type Phase8RiskClosureState = Phase8PermissionAuditDepthState;

export interface Phase8RiskClosureSummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase8RiskClosureState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canCloseBlockers: boolean;
  readonly mutationLocked: boolean;
  readonly openBlockerCount: number;
  readonly auditReviewAddressableCount: number;
  readonly ownerActionBlockerCount: number;
  readonly closureReadyCount: number;
  readonly openExceptionCount: number;
  readonly topClosureSourceId: string;
  readonly topClosureStatus: Phase8PermissionAuditDepthState | "ready";
  readonly phase8RiskClosureProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase8RiskClosureInput {
  readonly snapshot: Phase8PermissionAuditDepthSnapshot;
  readonly traceability: Phase8RiskTraceabilitySummary;
  readonly blockerPriority: Phase8RiskBlockerPrioritySummary;
}

const CLOSURE_ID = "phase-08-risk-closure";
const CLOSURE_LABEL = "Phase 8 risk closure";
const SAFETY =
  "Phase 8 risk closure is evidence-only. It classifies audit-review and owner-action blockers, but it does not request approval, grant access, run commands, mutate files, clear audit records, or unlock mutation-capable paths.";

const STATUS_LABELS: Record<Phase8RiskClosureState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function mutationLocked(snapshot: Phase8PermissionAuditDepthSnapshot): boolean {
  return snapshot.exceptions.every((exception) => {
    const text = exception.disabledPath.toLowerCase();
    return text.includes("disabled") || text.includes("locked");
  });
}

function resolveState(input: Phase8RiskClosureInput): Phase8RiskClosureState {
  if (
    input.snapshot.state === "blocked" ||
    input.traceability.state === "blocked" ||
    input.blockerPriority.state === "blocked" ||
    !mutationLocked(input.snapshot)
  ) {
    return "blocked";
  }

  if (input.blockerPriority.openBlockerCount === 0 && input.traceability.canTrustPermissionAudit) {
    return "ready";
  }

  if (input.blockerPriority.items.some((item) => item.status === "review")) {
    return "review";
  }

  return "waiting";
}

function readinessForState(
  state: Phase8RiskClosureState,
  blockerPriority: Phase8RiskBlockerPrioritySummary
): number {
  if (state === "ready") {
    return 100;
  }
  if (state === "blocked") {
    return 0;
  }
  if (blockerPriority.openBlockerCount === 0) {
    return blockerPriority.readiness;
  }
  return Math.max(35, Math.round(blockerPriority.readiness * 0.9));
}

function ownerActionBlockers(items: readonly Phase8RiskBlockerPriorityItem[]): number {
  return items.filter((item) => !item.canUseAuditReview).length;
}

function closureReadyCount(items: readonly Phase8RiskBlockerPriorityItem[]): number {
  return items.filter((item) => item.status === "ready").length;
}

function nextAction(input: Phase8RiskClosureInput, state: Phase8RiskClosureState): string {
  if (state === "blocked") {
    return "Repair blocked Phase 8 audit, traceability, or mutation-lock evidence before blocker closure can be trusted.";
  }
  if (state === "ready") {
    return "No Phase 8 blockers remain; keep closure proof attached while mutation paths stay locked for later phases.";
  }
  if (input.blockerPriority.auditReviewAddressableCount > 0) {
    return "Use owner audit review on the audit-review addressable blockers, then re-check blocker closure proof before Phase 8 completion.";
  }
  return input.blockerPriority.topPriorityAction;
}

function buildProof(summary: Omit<Phase8RiskClosureSummary, "ariaLabel" | "phase8RiskClosureProof">): string {
  return (
    `phase8RiskClosureProof=state=${summary.state} readiness=${summary.readiness} ` +
    `canClose=${summary.canCloseBlockers ? "yes" : "no"} ` +
    `open=${summary.openBlockerCount} auditReview=${summary.auditReviewAddressableCount} ` +
    `ownerAction=${summary.ownerActionBlockerCount} closureReady=${summary.closureReadyCount} ` +
    `openExceptions=${summary.openExceptionCount} mutation=${summary.mutationLocked ? "locked" : "unlocked"} ` +
    `top=${summary.topClosureSourceId} topStatus=${summary.topClosureStatus}`
  );
}

function buildAriaLabel(summary: Omit<Phase8RiskClosureSummary, "ariaLabel">): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `${summary.openBlockerCount} open blockers; ` +
    `${summary.auditReviewAddressableCount} audit-review addressable; ` +
    `${summary.ownerActionBlockerCount} owner-action blockers; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase8RiskClosure(
  input: Phase8RiskClosureInput
): Phase8RiskClosureSummary {
  const state = resolveState(input);
  const canCloseBlockers =
    state === "ready" &&
    input.blockerPriority.openBlockerCount === 0 &&
    input.traceability.canTrustPermissionAudit &&
    mutationLocked(input.snapshot);
  const draft = {
    id: CLOSURE_ID,
    label: CLOSURE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state, input.blockerPriority),
    canCloseBlockers,
    mutationLocked: mutationLocked(input.snapshot),
    openBlockerCount: input.blockerPriority.openBlockerCount,
    auditReviewAddressableCount: input.blockerPriority.auditReviewAddressableCount,
    ownerActionBlockerCount: ownerActionBlockers(input.blockerPriority.items),
    closureReadyCount: closureReadyCount(input.blockerPriority.items),
    openExceptionCount: input.snapshot.openExceptionCount,
    topClosureSourceId: input.blockerPriority.topPrioritySourceId,
    topClosureStatus: input.blockerPriority.topPriorityStatus,
    nextAction: nextAction(input, state),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase8RiskClosureProof: buildProof(draft)
  };

  return {
    ...withProof,
    ariaLabel: buildAriaLabel(withProof)
  };
}
