import type {
  Phase8ClosureAuditStatus
} from "./phase8ClosureAuditStatus";
import type { Phase8OwnerActionHandoff } from "./phase8OwnerActionHandoff";
import type {
  Phase8RiskBlockerPriorityItem,
  Phase8RiskBlockerPrioritySummary
} from "./phase8RiskBlockerPriority";
import type { Phase8RiskClosureSummary } from "./phase8RiskClosure";

export type Phase8AuditReviewBlockerHandoffState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase8AuditReviewBlockerHandoff {
  readonly id: string;
  readonly label: string;
  readonly state: Phase8AuditReviewBlockerHandoffState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly auditReviewBlockerCount: number;
  readonly ownerActionBlockerCount: number;
  readonly openBlockerCount: number;
  readonly ownerActionClear: boolean;
  readonly canRecordAuditReview: boolean;
  readonly topAuditReviewSourceId: string;
  readonly topAuditReviewLabel: string;
  readonly topAuditReviewStatus: string;
  readonly topAuditReviewKind: string;
  readonly topAuditReviewPriority: number;
  readonly topAuditReviewNextAction: string;
  readonly phase8AuditReviewBlockerHandoffProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase8AuditReviewBlockerHandoffInput {
  readonly riskClosure: Phase8RiskClosureSummary;
  readonly blockerPriority: Phase8RiskBlockerPrioritySummary;
  readonly closureAuditStatus: Phase8ClosureAuditStatus;
  readonly ownerActionHandoff: Phase8OwnerActionHandoff;
}

const STATUS_LABELS: Record<Phase8AuditReviewBlockerHandoffState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SAFETY =
  "Phase 8 audit-review blocker handoff is evidence-only. It names audit-review addressable blockers without requesting approval, recording review, granting access, running actions, mutating files, exporting records, or unlocking mutation paths.";

function auditReviewItems(
  blockerPriority: Phase8RiskBlockerPrioritySummary
): readonly Phase8RiskBlockerPriorityItem[] {
  return blockerPriority.items.filter(
    (item) => item.status !== "ready" && item.canUseAuditReview
  );
}

function resolveState(
  input: Phase8AuditReviewBlockerHandoffInput,
  items: readonly Phase8RiskBlockerPriorityItem[]
): Phase8AuditReviewBlockerHandoffState {
  if (
    input.riskClosure.state === "blocked" ||
    input.closureAuditStatus.state === "blocked" ||
    input.ownerActionHandoff.state === "blocked" ||
    items.some((item) => item.status === "blocked")
  ) {
    return "blocked";
  }

  if (input.ownerActionHandoff.state !== "ready") {
    return "waiting";
  }

  if (items.length === 0) {
    return "ready";
  }

  if (items.some((item) => item.status === "review")) {
    return "review";
  }

  return "waiting";
}

function readiness(state: Phase8AuditReviewBlockerHandoffState): number {
  if (state === "ready") {
    return 100;
  }
  if (state === "review") {
    return 75;
  }
  if (state === "waiting") {
    return 50;
  }
  return 0;
}

function nextAction(
  input: Phase8AuditReviewBlockerHandoffInput,
  state: Phase8AuditReviewBlockerHandoffState,
  topItem: Phase8RiskBlockerPriorityItem | undefined
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 8 audit-review, owner-action, closure, or traceability evidence before audit-review handoff can be trusted.";
  }

  if (input.ownerActionHandoff.state !== "ready") {
    return input.ownerActionHandoff.nextAction;
  }

  if (!topItem) {
    return "No audit-review addressable blockers remain; keep Phase 8 closure and completion-gate proof attached.";
  }

  return `Review audit-review blocker ${topItem.sourceId}: ${topItem.nextAction}`;
}

function proof(
  summary: Omit<
    Phase8AuditReviewBlockerHandoff,
    "ariaLabel" | "phase8AuditReviewBlockerHandoffProof"
  >
): string {
  return (
    `phase8AuditReviewBlockerHandoffProof=state=${summary.state} readiness=${summary.readiness} ` +
    `auditReview=${summary.auditReviewBlockerCount} ownerAction=${summary.ownerActionBlockerCount} ` +
    `open=${summary.openBlockerCount} ownerActionClear=${summary.ownerActionClear ? "yes" : "no"} ` +
    `canRecordAuditReview=${summary.canRecordAuditReview ? "yes" : "no"} ` +
    `top=${summary.topAuditReviewSourceId} topStatus=${summary.topAuditReviewStatus} ` +
    `topKind=${summary.topAuditReviewKind} topPriority=${summary.topAuditReviewPriority}`
  );
}

function ariaLabel(summary: Omit<Phase8AuditReviewBlockerHandoff, "ariaLabel">): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `${summary.auditReviewBlockerCount} audit-review blockers; ` +
    `owner action clear ${summary.ownerActionClear ? "yes" : "no"}; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase8AuditReviewBlockerHandoff(
  input: Phase8AuditReviewBlockerHandoffInput
): Phase8AuditReviewBlockerHandoff {
  const items = auditReviewItems(input.blockerPriority);
  const topItem = items[0];
  const state = resolveState(input, items);
  const ownerActionClear = input.ownerActionHandoff.state === "ready";
  const draft = {
    id: "phase-8-audit-review-blocker-handoff",
    label: "Phase 8 audit-review blocker handoff",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readiness(state),
    auditReviewBlockerCount: items.length,
    ownerActionBlockerCount: input.ownerActionHandoff.ownerActionBlockerCount,
    openBlockerCount: input.riskClosure.openBlockerCount,
    ownerActionClear,
    canRecordAuditReview: ownerActionClear && items.length > 0 && state !== "blocked",
    topAuditReviewSourceId: topItem?.sourceId ?? "phase8.audit-review.none",
    topAuditReviewLabel: topItem?.label ?? "No audit-review blocker",
    topAuditReviewStatus: topItem?.status ?? "ready",
    topAuditReviewKind: topItem?.kind ?? "none",
    topAuditReviewPriority: topItem?.priority ?? 0,
    topAuditReviewNextAction:
      topItem?.nextAction ??
      "No audit-review addressable blockers remain before closure proof continues.",
    nextAction: nextAction(input, state, topItem),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase8AuditReviewBlockerHandoffProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
