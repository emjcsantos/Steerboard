import type { Phase10ArenaPolishSnapshot } from "./phase10ArenaPolish";
import type { Phase10ArenaPolishBlockerPrioritySummary } from "./phase10ArenaPolishBlockerPriority";
import type { Phase10ArenaPolishTraceabilitySummary } from "./phase10ArenaPolishTraceability";

export type Phase10ArenaPolishCloseoutStatusState =
  | "complete"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase10ArenaPolishCloseoutStatus {
  readonly id: string;
  readonly label: string;
  readonly state: Phase10ArenaPolishCloseoutStatusState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly implementationComplete: boolean;
  readonly arenaPolishReady: boolean;
  readonly traceabilityTrusted: boolean;
  readonly blockerPriorityClear: boolean;
  readonly flexLayoutDeferred: boolean;
  readonly packagingPaused: boolean;
  readonly canResumePackaging: boolean;
  readonly ownerResumeApproved: boolean;
  readonly installPathLocked: boolean;
  readonly desktopPackagingLocked: boolean;
  readonly releaseGateRequired: boolean;
  readonly linkedPmTaskCount: number;
  readonly requiredPmTaskCount: number;
  readonly openBlockerCount: number;
  readonly arenaReviewAddressableCount: number;
  readonly topHold: string;
  readonly phase10ArenaPolishCloseoutStatusProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase10ArenaPolishCloseoutStatusInput {
  readonly snapshot: Phase10ArenaPolishSnapshot;
  readonly traceability: Phase10ArenaPolishTraceabilitySummary;
  readonly blockerPriority: Phase10ArenaPolishBlockerPrioritySummary;
}

const STATUS_LABELS: Record<Phase10ArenaPolishCloseoutStatusState, string> = {
  complete: "Complete",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const REQUIRED_PM_TASK_COUNT = 10;
const SAFETY =
  "Phase 10 Arena polish closeout status is evidence-only. It summarizes adaptive layout regression, density, keyboard, focus, terminology, acceptance, FlexLayout decision, traceability, blocker-priority, PM-link, and packaging-paused proof without launching runtime, mutating sources, changing saved sessions, or resuming packaging.";

function flexLayoutDeferred(snapshot: Phase10ArenaPolishSnapshot): boolean {
  const flexLayoutItem = snapshot.items.find((item) => item.kind === "docking-spike");

  return (
    flexLayoutItem?.status === "review" &&
    (
      flexLayoutItem.detail.includes("decision=defer") ||
      flexLayoutItem.nextAction.toLowerCase().includes("defer package installation")
    )
  );
}

function deferredFlexLayoutBlockerCount(
  blockerPriority: Phase10ArenaPolishBlockerPrioritySummary
): number {
  return blockerPriority.items.filter(
    (item) =>
      item.status === "review" &&
      item.sourceId.includes("docking-spike") &&
      (
        item.detail.includes("decision=defer") ||
        item.nextAction.toLowerCase().includes("defer package installation")
      )
  ).length;
}

function arenaPolishReady(snapshot: Phase10ArenaPolishSnapshot): boolean {
  if (snapshot.state === "ready") {
    return true;
  }

  if (!flexLayoutDeferred(snapshot)) {
    return false;
  }

  return snapshot.items.every(
    (item) => item.status === "ready" || item.kind === "docking-spike"
  );
}

function effectiveOpenBlockerCount(
  input: Phase10ArenaPolishCloseoutStatusInput
): number {
  return Math.max(
    0,
    input.blockerPriority.openBlockerCount -
      deferredFlexLayoutBlockerCount(input.blockerPriority)
  );
}

function topHold(input: Phase10ArenaPolishCloseoutStatusInput): string {
  if (!arenaPolishReady(input.snapshot)) {
    return "arena-polish";
  }
  if (
    input.traceability.missingPmTaskIds.length > 0 ||
    input.traceability.linkedPmTaskCount < REQUIRED_PM_TASK_COUNT
  ) {
    return "pm-links";
  }
  if (!input.traceability.canTrustArenaPolish) {
    return "traceability";
  }
  if (effectiveOpenBlockerCount(input) > 0) {
    return "blocker-priority";
  }
  return "none";
}

function resolveState(
  input: Phase10ArenaPolishCloseoutStatusInput,
  hold: string
): Phase10ArenaPolishCloseoutStatusState {
  if (
    input.snapshot.state === "blocked" ||
    input.traceability.state === "blocked" ||
    input.blockerPriority.state === "blocked"
  ) {
    return "blocked";
  }
  if (hold === "none") {
    return "complete";
  }
  if (
    input.snapshot.state === "waiting" ||
    input.traceability.state === "waiting" ||
    input.blockerPriority.state === "waiting"
  ) {
    return "waiting";
  }
  return "review";
}

function readinessForState(state: Phase10ArenaPolishCloseoutStatusState): number {
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
  input: Phase10ArenaPolishCloseoutStatusInput,
  state: Phase10ArenaPolishCloseoutStatusState,
  hold: string
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 10 Arena polish, traceability, PM-link, or blocker-priority evidence before closeout can be trusted.";
  }
  if (state === "complete") {
    return "Phase 10 Arena polish closeout proof is ready; keep packaging paused, install paths locked, and release-gate review required until the owner explicitly resumes release actions.";
  }
  if (hold === "arena-polish") {
    return input.snapshot.nextAction;
  }
  if (hold === "pm-links" || hold === "traceability") {
    return input.traceability.nextAction;
  }
  if (hold === "blocker-priority") {
    return input.blockerPriority.nextAction;
  }
  return "Keep Phase 10 Arena polish evidence attached while packaging remains paused.";
}

function proof(
  status: Omit<
    Phase10ArenaPolishCloseoutStatus,
    "ariaLabel" | "phase10ArenaPolishCloseoutStatusProof"
  >
): string {
  return (
    `phase10ArenaPolishCloseoutStatusProof=state=${status.state} readiness=${status.readiness} ` +
    `implementationComplete=${status.implementationComplete ? "yes" : "no"} ` +
    `polish=${status.arenaPolishReady ? "ready" : "held"} ` +
    `traceability=${status.traceabilityTrusted ? "ready" : "held"} ` +
    `blockers=${status.blockerPriorityClear ? "clear" : "open"} ` +
    `flexLayout=${status.flexLayoutDeferred ? "defer" : "ready"} ` +
    `packaging=${status.packagingPaused ? "paused" : "review"} ` +
    `canResumePackaging=${status.canResumePackaging ? "yes" : "no"} ` +
    `ownerResume=${status.ownerResumeApproved ? "approved" : "missing"} ` +
    `installPath=${status.installPathLocked ? "locked" : "review"} ` +
    `desktopPackaging=${status.desktopPackagingLocked ? "locked" : "review"} ` +
    `releaseGate=${status.releaseGateRequired ? "required" : "not-required"} ` +
    `pmLinks=${status.linkedPmTaskCount}/${status.requiredPmTaskCount} ` +
    `open=${status.openBlockerCount} review=${status.arenaReviewAddressableCount} topHold=${status.topHold}`
  );
}

function ariaLabel(status: Omit<Phase10ArenaPolishCloseoutStatus, "ariaLabel">): string {
  return (
    `${status.label}: ${status.statusLabel}; ${status.readiness}% ready; ` +
    `polish ${status.arenaPolishReady ? "ready" : "held"}; ` +
    `FlexLayout ${status.flexLayoutDeferred ? "deferred" : "ready"}; ` +
    `packaging ${status.packagingPaused ? "paused" : "review"}; ` +
    `next action: ${status.nextAction}`
  );
}

export function buildPhase10ArenaPolishCloseoutStatus(
  input: Phase10ArenaPolishCloseoutStatusInput
): Phase10ArenaPolishCloseoutStatus {
  const hold = topHold(input);
  const state = resolveState(input, hold);
  const effectiveOpen = effectiveOpenBlockerCount(input);
  const draft = {
    id: "phase-10-arena-polish-closeout-status",
    label: "Phase 10 Arena polish closeout status",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    implementationComplete: true,
    arenaPolishReady: arenaPolishReady(input.snapshot),
    traceabilityTrusted: input.traceability.canTrustArenaPolish,
    blockerPriorityClear: effectiveOpen === 0,
    flexLayoutDeferred: flexLayoutDeferred(input.snapshot),
    packagingPaused: true,
    canResumePackaging: false,
    ownerResumeApproved: false,
    installPathLocked: true,
    desktopPackagingLocked: true,
    releaseGateRequired: true,
    linkedPmTaskCount: input.traceability.linkedPmTaskCount,
    requiredPmTaskCount: REQUIRED_PM_TASK_COUNT,
    openBlockerCount: effectiveOpen,
    arenaReviewAddressableCount: Math.max(
      0,
      input.blockerPriority.arenaReviewAddressableCount -
        deferredFlexLayoutBlockerCount(input.blockerPriority)
    ),
    topHold: hold,
    nextAction: nextAction(input, state, hold),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase10ArenaPolishCloseoutStatusProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
