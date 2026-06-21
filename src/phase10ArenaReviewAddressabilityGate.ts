import type {
  Phase10ArenaPolishBlockerPriorityItem,
  Phase10ArenaPolishBlockerPrioritySummary
} from "./phase10ArenaPolishBlockerPriority";
import type { Phase10ArenaPolishCloseoutStatus } from "./phase10ArenaPolishCloseoutStatus";

export type Phase10ArenaReviewAddressabilityGateState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase10ArenaReviewApprovalEvidence {
  readonly ownerArenaReviewApprovalRecorded?: boolean;
}

export interface Phase10ArenaReviewAddressabilityGate {
  readonly id: string;
  readonly label: string;
  readonly state: Phase10ArenaReviewAddressabilityGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canRequestArenaReview: boolean;
  readonly closeoutState: Phase10ArenaPolishCloseoutStatus["state"];
  readonly packagingPaused: boolean;
  readonly mutationLocked: boolean;
  readonly ownerArenaReviewApprovalRecorded: boolean;
  readonly openBlockerCount: number;
  readonly addressableSourceCount: number;
  readonly blockedSourceCount: number;
  readonly topSourceId: string;
  readonly topSourceKind: Phase10ArenaPolishBlockerPriorityItem["kind"] | "none";
  readonly topSourceStatus: Phase10ArenaPolishBlockerPriorityItem["status"] | "none";
  readonly topSourceAddressable: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly arenaReviewAddressabilityGateProof: string;
  readonly ariaLabel: string;
}

const STATUS_LABELS: Record<Phase10ArenaReviewAddressabilityGateState, string> = {
  ready: "Ready",
  review: "Review held",
  blocked: "Blocked",
  waiting: "Waiting"
};

function sourceList(
  blockerPriority: Phase10ArenaPolishBlockerPrioritySummary,
  predicate: (item: Phase10ArenaPolishBlockerPriorityItem) => boolean
): readonly Phase10ArenaPolishBlockerPriorityItem[] {
  return blockerPriority.items.filter(predicate);
}

function proof(
  gate: Omit<
    Phase10ArenaReviewAddressabilityGate,
    "arenaReviewAddressabilityGateProof" | "ariaLabel"
  >
): string {
  return [
    "phase10ArenaReviewAddressabilityGate",
    `state=${gate.state}`,
    `canRequest=${gate.canRequestArenaReview ? "yes" : "no"}`,
    `closeout=${gate.closeoutState}`,
    `packaging=${gate.packagingPaused ? "paused" : "review"}`,
    `mutation=${gate.mutationLocked ? "locked" : "review"}`,
    `ownerReview=${gate.ownerArenaReviewApprovalRecorded ? "recorded" : "required"}`,
    `open=${gate.openBlockerCount}`,
    `addressable=${gate.addressableSourceCount}`,
    `blockedSources=${gate.blockedSourceCount}`,
    `topSource=${gate.topSourceId || "none"}`,
    `topKind=${gate.topSourceKind}`,
    `topStatus=${gate.topSourceStatus}`,
    `topAddressable=${gate.topSourceAddressable ? "yes" : "no"}`
  ].join(" ");
}

function ariaLabel(
  gate: Omit<Phase10ArenaReviewAddressabilityGate, "ariaLabel">
): string {
  return (
    `${gate.label}: ${gate.statusLabel}; ${gate.readiness}% ready; ` +
    `${gate.addressableSourceCount} source-aware Arena-review blockers; ` +
    `can request Arena review ${gate.canRequestArenaReview ? "yes" : "no"}; ` +
    `next action: ${gate.nextAction}`
  );
}

function result(
  state: Phase10ArenaReviewAddressabilityGateState,
  blockerPriority: Phase10ArenaPolishBlockerPrioritySummary,
  closeoutStatus: Phase10ArenaPolishCloseoutStatus,
  evidence: Phase10ArenaReviewApprovalEvidence | undefined,
  detail: string,
  nextAction: string
): Phase10ArenaReviewAddressabilityGate {
  const addressableItems = sourceList(blockerPriority, (item) => item.canUseArenaReview);
  const blockedItems = sourceList(blockerPriority, (item) => item.status === "blocked");
  const topItem = blockerPriority.items[0];
  const ownerArenaReviewApprovalRecorded =
    evidence?.ownerArenaReviewApprovalRecorded === true;
  const canRequestArenaReview =
    state === "ready" &&
    ownerArenaReviewApprovalRecorded &&
    closeoutStatus.packagingPaused &&
    addressableItems.length > 0;
  const draft = {
    id: "phase-10-arena-review-addressability-gate",
    label: "Phase 10 Arena review addressability gate",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: state === "ready" ? 100 : state === "review" ? 75 : state === "waiting" ? 55 : 0,
    canRequestArenaReview,
    closeoutState: closeoutStatus.state,
    packagingPaused: closeoutStatus.packagingPaused,
    mutationLocked: true,
    ownerArenaReviewApprovalRecorded,
    openBlockerCount: blockerPriority.openBlockerCount,
    addressableSourceCount: addressableItems.length,
    blockedSourceCount: blockedItems.length,
    topSourceId: topItem?.sourceId ?? "",
    topSourceKind: topItem?.kind ?? "none",
    topSourceStatus: topItem?.status ?? "none",
    topSourceAddressable: topItem?.canUseArenaReview === true,
    detail,
    nextAction
  };
  const gate = {
    ...draft,
    arenaReviewAddressabilityGateProof: proof(draft)
  };

  return {
    ...gate,
    ariaLabel: ariaLabel(gate)
  };
}

export function buildPhase10ArenaReviewAddressabilityGate(
  blockerPriority: Phase10ArenaPolishBlockerPrioritySummary,
  closeoutStatus: Phase10ArenaPolishCloseoutStatus,
  evidence?: Phase10ArenaReviewApprovalEvidence
): Phase10ArenaReviewAddressabilityGate {
  if (blockerPriority.state === "blocked" || closeoutStatus.state === "blocked") {
    return result(
      "blocked",
      blockerPriority,
      closeoutStatus,
      evidence,
      "Phase 10 Arena review addressability is blocked because Arena polish or closeout evidence has a critical blocker.",
      blockerPriority.nextAction
    );
  }

  if (!closeoutStatus.packagingPaused) {
    return result(
      "blocked",
      blockerPriority,
      closeoutStatus,
      evidence,
      "Phase 10 Arena review addressability is blocked because packaging is not paused.",
      "Restore packaging-paused proof before source-aware Arena review can be considered."
    );
  }

  if (blockerPriority.openBlockerCount === 0) {
    return result(
      "ready",
      blockerPriority,
      closeoutStatus,
      evidence,
      "Phase 10 has no open Arena-review blockers; addressability proof is ready and packaging remains paused.",
      "Keep this proof attached while Phase 11 release readiness decides whether packaging can resume."
    );
  }

  if (blockerPriority.arenaReviewAddressableCount === 0) {
    return result(
      "waiting",
      blockerPriority,
      closeoutStatus,
      evidence,
      "Phase 10 has open blockers, but none are source-aware Arena-review addressable.",
      blockerPriority.nextAction
    );
  }

  if (!evidence?.ownerArenaReviewApprovalRecorded) {
    return result(
      "review",
      blockerPriority,
      closeoutStatus,
      evidence,
      "Phase 10 has source-aware Arena-review blockers, but Arena review is waiting for explicit owner approval.",
      "Record owner approval before requesting Arena review for the source-aware Phase 10 blocker list."
    );
  }

  return result(
    "ready",
    blockerPriority,
    closeoutStatus,
    evidence,
    "Phase 10 Arena review addressability is ready because source-aware blockers and owner review approval are both present while packaging remains paused.",
    "Use Arena review only for the listed source-aware blockers, then re-run Phase 10 owner-visible proof."
  );
}
