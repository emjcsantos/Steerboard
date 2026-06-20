import type { Phase126PublishHoldBlockerPrioritySummary } from "./phase126PublishHoldBlockerPriority";
import type { Phase126PublishHoldTraceabilitySummary } from "./phase126PublishHoldTraceability";
import type { PhasePriorityEvidenceResult } from "./phasePriorityEvidence";

export type Phase126PublishHoldCloseoutStatusState =
  | "complete"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase126PublishHoldCloseoutStatus {
  readonly id: string;
  readonly label: string;
  readonly state: Phase126PublishHoldCloseoutStatusState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly implementationComplete: boolean;
  readonly priorityProofReady: boolean;
  readonly localHoldTrusted: boolean;
  readonly publishHeld: boolean;
  readonly pushPaused: boolean;
  readonly linkedPmTaskCount: number;
  readonly requiredPmTaskCount: number;
  readonly readyPriorityEvidenceCount: number;
  readonly requiredPriorityEvidenceCount: number;
  readonly openBlockerCount: number;
  readonly ownerReviewAddressableCount: number;
  readonly topHold: string;
  readonly localHoldEvidenceKey: string;
  readonly phase126PublishHoldCloseoutStatusProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase126PublishHoldCloseoutStatusInput {
  readonly phasePriorityEvidence: PhasePriorityEvidenceResult;
  readonly traceability: Phase126PublishHoldTraceabilitySummary;
  readonly blockerPriority: Phase126PublishHoldBlockerPrioritySummary;
}

const STATUS_LABELS: Record<Phase126PublishHoldCloseoutStatusState, string> = {
  complete: "Complete",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SAFETY =
  "Phase 1/2/6 publish-hold closeout status is evidence-only. It summarizes one-panel proof, two-panel isolation, PM staging, publish-hold traceability, blocker-priority, local-hold evidence, owner/remote publish hold, and push-paused proof without running live prompts, mutating files, changing saved sessions, pushing branches, or publishing release artifacts.";

function isIntentionalPublishHold(itemSourceId: string): boolean {
  return itemSourceId.includes("publish-hold") || itemSourceId.includes("publish-goal");
}

function effectiveOpenBlockerCount(
  blockerPriority: Phase126PublishHoldBlockerPrioritySummary
): number {
  return blockerPriority.items.filter((item) => !isIntentionalPublishHold(item.sourceId)).length;
}

function effectiveOwnerReviewCount(
  blockerPriority: Phase126PublishHoldBlockerPrioritySummary
): number {
  return blockerPriority.items.filter(
    (item) => item.ownerReviewAddressable && !isIntentionalPublishHold(item.sourceId)
  ).length;
}

function topHold(input: Phase126PublishHoldCloseoutStatusInput): string {
  if (
    input.phasePriorityEvidence.state !== "ready" ||
    input.traceability.readyPriorityEvidenceCount < input.traceability.requiredPriorityEvidenceCount
  ) {
    return "priority-proof";
  }
  if (
    !input.traceability.canTrustLocalHold ||
    input.traceability.linkedRequiredPmTaskCount < input.traceability.requiredPmTaskCount ||
    input.traceability.missingPmTaskIds.length > 0
  ) {
    return "local-hold-traceability";
  }
  if (effectiveOpenBlockerCount(input.blockerPriority) > 0) {
    return "blocker-priority";
  }
  return "owner-publish-hold";
}

function resolveState(
  input: Phase126PublishHoldCloseoutStatusInput,
  hold: string
): Phase126PublishHoldCloseoutStatusState {
  if (hold === "owner-publish-hold") {
    return "complete";
  }
  if (
    input.phasePriorityEvidence.state === "blocked" ||
    (
      hold === "local-hold-traceability" &&
      input.traceability.state === "blocked" &&
      !input.traceability.canTrustLocalHold
    )
  ) {
    return "blocked";
  }
  if (
    input.phasePriorityEvidence.state === "waiting" ||
    input.traceability.state === "waiting" ||
    input.blockerPriority.state === "waiting"
  ) {
    return "waiting";
  }
  return "review";
}

function readinessForState(state: Phase126PublishHoldCloseoutStatusState): number {
  if (state === "complete") {
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

function nextAction(
  input: Phase126PublishHoldCloseoutStatusInput,
  state: Phase126PublishHoldCloseoutStatusState,
  hold: string
): string {
  if (state === "complete") {
    return "Phase 1/2/6 local publish-hold closeout proof is ready; keep push paused until the owner restores the remote and explicitly says to push.";
  }
  if (state === "blocked") {
    return "Repair blocked Phase 1/2/6 proof, PM-link, traceability, or blocker-priority evidence before local publish-hold closeout can be trusted.";
  }
  if (hold === "priority-proof") {
    return input.phasePriorityEvidence.items.find((item) => item.state !== "ready")?.nextAction ??
      "Refresh Phase 1, Phase 2, or Phase 6 priority proof before local publish-hold closeout.";
  }
  if (hold === "local-hold-traceability") {
    return input.traceability.nextAction;
  }
  if (hold === "blocker-priority") {
    return input.blockerPriority.nextAction;
  }
  return "Keep the local publish-hold evidence attached while push remains paused.";
}

function proof(
  status: Omit<
    Phase126PublishHoldCloseoutStatus,
    "ariaLabel" | "phase126PublishHoldCloseoutStatusProof"
  >
): string {
  return (
    `phase126PublishHoldCloseoutStatusProof=state=${status.state} readiness=${status.readiness} ` +
    `implementationComplete=${status.implementationComplete ? "yes" : "no"} ` +
    `priority=${status.readyPriorityEvidenceCount}/${status.requiredPriorityEvidenceCount} ` +
    `localHold=${status.localHoldTrusted ? "ready" : "held"} ` +
    `publish=${status.publishHeld ? "held" : "ready"} ` +
    `push=${status.pushPaused ? "paused" : "review"} ` +
    `pmLinks=${status.linkedPmTaskCount}/${status.requiredPmTaskCount} ` +
    `open=${status.openBlockerCount} review=${status.ownerReviewAddressableCount} ` +
    `topHold=${status.topHold} evidence=${status.localHoldEvidenceKey}`
  );
}

function ariaLabel(status: Omit<Phase126PublishHoldCloseoutStatus, "ariaLabel">): string {
  return (
    `${status.label}: ${status.statusLabel}; ${status.readiness}% ready; ` +
    `local hold ${status.localHoldTrusted ? "ready" : "held"}; ` +
    `publish ${status.publishHeld ? "held" : "ready"}; ` +
    `push ${status.pushPaused ? "paused" : "review"}; ` +
    `next action: ${status.nextAction}`
  );
}

export function buildPhase126PublishHoldCloseoutStatus(
  input: Phase126PublishHoldCloseoutStatusInput
): Phase126PublishHoldCloseoutStatus {
  const hold = topHold(input);
  const state = resolveState(input, hold);
  const draft = {
    id: "phase-1-2-6-publish-hold-closeout-status",
    label: "Phase 1/2/6 publish-hold closeout status",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    implementationComplete: true,
    priorityProofReady: input.phasePriorityEvidence.state === "ready",
    localHoldTrusted: input.traceability.canTrustLocalHold,
    publishHeld: input.traceability.publishHoldStatus === "blocked",
    pushPaused: true,
    linkedPmTaskCount: input.traceability.linkedRequiredPmTaskCount,
    requiredPmTaskCount: input.traceability.requiredPmTaskCount,
    readyPriorityEvidenceCount: input.traceability.readyPriorityEvidenceCount,
    requiredPriorityEvidenceCount: input.traceability.requiredPriorityEvidenceCount,
    openBlockerCount: effectiveOpenBlockerCount(input.blockerPriority),
    ownerReviewAddressableCount: effectiveOwnerReviewCount(input.blockerPriority),
    topHold: hold,
    localHoldEvidenceKey: input.traceability.localHoldEvidenceKey,
    nextAction: nextAction(input, state, hold),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase126PublishHoldCloseoutStatusProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
