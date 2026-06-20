import type {
  Phase8ClosureAuditStatus
} from "./phase8ClosureAuditStatus";
import type {
  Phase8RiskBlockerPriorityItem,
  Phase8RiskBlockerPrioritySummary
} from "./phase8RiskBlockerPriority";
import type { Phase8RiskClosureSummary } from "./phase8RiskClosure";

export type Phase8OwnerActionHandoffState = "ready" | "review" | "blocked" | "waiting";

export interface Phase8OwnerActionHandoff {
  readonly id: string;
  readonly label: string;
  readonly state: Phase8OwnerActionHandoffState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly ownerActionBlockerCount: number;
  readonly auditReviewAddressableCount: number;
  readonly openBlockerCount: number;
  readonly canContinueAuditReview: boolean;
  readonly topOwnerActionSourceId: string;
  readonly topOwnerActionLabel: string;
  readonly topOwnerActionStatus: string;
  readonly topOwnerActionKind: string;
  readonly topOwnerActionPriority: number;
  readonly topOwnerActionNextAction: string;
  readonly phase8OwnerActionHandoffProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase8OwnerActionHandoffInput {
  readonly riskClosure: Phase8RiskClosureSummary;
  readonly blockerPriority: Phase8RiskBlockerPrioritySummary;
  readonly closureAuditStatus: Phase8ClosureAuditStatus;
}

const STATUS_LABELS: Record<Phase8OwnerActionHandoffState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SAFETY =
  "Phase 8 owner-action handoff is evidence-only. It identifies non-audit-review owner blockers without requesting approval, granting access, running actions, mutating files, exporting records, or unlocking mutation paths.";

function ownerActionItems(
  blockerPriority: Phase8RiskBlockerPrioritySummary
): readonly Phase8RiskBlockerPriorityItem[] {
  return blockerPriority.items.filter(
    (item) => item.status !== "ready" && !item.canUseAuditReview
  );
}

function resolveState(
  input: Phase8OwnerActionHandoffInput,
  items: readonly Phase8RiskBlockerPriorityItem[]
): Phase8OwnerActionHandoffState {
  if (
    input.riskClosure.state === "blocked" ||
    input.closureAuditStatus.state === "blocked" ||
    items.some((item) => item.status === "blocked")
  ) {
    return "blocked";
  }

  if (items.length === 0) {
    return "ready";
  }

  if (items.some((item) => item.status === "review")) {
    return "review";
  }

  return "waiting";
}

function readiness(state: Phase8OwnerActionHandoffState): number {
  if (state === "ready") {
    return 100;
  }
  if (state === "review") {
    return 70;
  }
  if (state === "waiting") {
    return 45;
  }
  return 0;
}

function nextAction(
  input: Phase8OwnerActionHandoffInput,
  state: Phase8OwnerActionHandoffState,
  topItem: Phase8RiskBlockerPriorityItem | undefined
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 8 owner-action, closure, or traceability evidence before owner-action handoff can be trusted.";
  }

  if (!topItem) {
    if (input.riskClosure.auditReviewAddressableCount > 0) {
      return "Owner-action blockers are clear; continue with audit-review addressable Phase 8 blockers while mutation paths stay locked.";
    }
    return "Owner-action blockers are clear; keep Phase 8 closure and completion-gate proof attached.";
  }

  return `Resolve owner-action blocker ${topItem.sourceId}: ${topItem.nextAction}`;
}

function proof(summary: Omit<Phase8OwnerActionHandoff, "ariaLabel" | "phase8OwnerActionHandoffProof">): string {
  return (
    `phase8OwnerActionHandoffProof=state=${summary.state} readiness=${summary.readiness} ` +
    `ownerAction=${summary.ownerActionBlockerCount} auditReview=${summary.auditReviewAddressableCount} ` +
    `open=${summary.openBlockerCount} canContinueAuditReview=${summary.canContinueAuditReview ? "yes" : "no"} ` +
    `top=${summary.topOwnerActionSourceId} topStatus=${summary.topOwnerActionStatus} ` +
    `topKind=${summary.topOwnerActionKind} topPriority=${summary.topOwnerActionPriority}`
  );
}

function ariaLabel(summary: Omit<Phase8OwnerActionHandoff, "ariaLabel">): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `${summary.ownerActionBlockerCount} owner-action blockers; ` +
    `${summary.auditReviewAddressableCount} audit-review blockers; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase8OwnerActionHandoff(
  input: Phase8OwnerActionHandoffInput
): Phase8OwnerActionHandoff {
  const items = ownerActionItems(input.blockerPriority);
  const topItem = items[0];
  const state = resolveState(input, items);
  const draft = {
    id: "phase-8-owner-action-handoff",
    label: "Phase 8 owner-action handoff",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readiness(state),
    ownerActionBlockerCount: items.length,
    auditReviewAddressableCount: input.riskClosure.auditReviewAddressableCount,
    openBlockerCount: input.riskClosure.openBlockerCount,
    canContinueAuditReview: state === "ready" && input.closureAuditStatus.state !== "blocked",
    topOwnerActionSourceId: topItem?.sourceId ?? "phase8.owner-action.none",
    topOwnerActionLabel: topItem?.label ?? "No owner-action blocker",
    topOwnerActionStatus: topItem?.status ?? "ready",
    topOwnerActionKind: topItem?.kind ?? "none",
    topOwnerActionPriority: topItem?.priority ?? 0,
    topOwnerActionNextAction:
      topItem?.nextAction ??
      "No owner-action blockers remain before audit-review blockers continue.",
    nextAction: nextAction(input, state, topItem),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase8OwnerActionHandoffProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
