import type { Phase10ArenaPolishCloseoutStatus } from "./phase10ArenaPolishCloseoutStatus";

export type Phase10PackagingResumeGateState = "ready" | "review" | "blocked" | "waiting";

export interface Phase10PackagingResumeApprovalEvidence {
  readonly ownerResumeApproved?: boolean;
}

export interface Phase10PackagingResumeGate {
  readonly id: string;
  readonly label: string;
  readonly state: Phase10PackagingResumeGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canResumePackaging: boolean;
  readonly closeoutReady: boolean;
  readonly ownerResumeApproved: boolean;
  readonly installPathLocked: boolean;
  readonly desktopPackagingLocked: boolean;
  readonly releaseGateRequired: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly phase10PackagingResumeGateProof: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

const GATE_ID = "phase-10-packaging-resume-gate";
const GATE_LABEL = "Phase 10 packaging resume gate";
const SAFETY =
  "Phase 10 packaging resume gate is evidence-only. It summarizes Arena closeout and explicit owner resume approval without installing dependencies, preparing installers, building packages, signing artifacts, pushing Git state, mutating files, or running release actions.";

const STATUS_LABELS: Record<Phase10PackagingResumeGateState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function closeoutReady(closeout: Phase10ArenaPolishCloseoutStatus): boolean {
  return (
    closeout.state === "complete" &&
    closeout.implementationComplete &&
    closeout.arenaPolishReady &&
    closeout.traceabilityTrusted &&
    closeout.blockerPriorityClear &&
    closeout.packagingPaused &&
    closeout.phase10ArenaPolishCloseoutStatusProof.includes("packaging=paused")
  );
}

function resolveState(
  closeout: Phase10ArenaPolishCloseoutStatus,
  isCloseoutReady: boolean,
  ownerResumeApproved: boolean
): Phase10PackagingResumeGateState {
  if (closeout.state === "blocked") {
    return "blocked";
  }
  if (!isCloseoutReady) {
    return closeout.state === "waiting" ? "waiting" : "review";
  }
  return ownerResumeApproved ? "ready" : "review";
}

function readinessForState(state: Phase10PackagingResumeGateState): number {
  if (state === "ready") {
    return 100;
  }
  if (state === "review") {
    return 80;
  }
  if (state === "waiting") {
    return 55;
  }
  return 0;
}

function detail(
  state: Phase10PackagingResumeGateState,
  isCloseoutReady: boolean,
  ownerResumeApproved: boolean
): string {
  if (state === "blocked") {
    return "Packaging resume is blocked by Phase 10 Arena closeout evidence.";
  }
  if (!isCloseoutReady) {
    return "Packaging resume is held until Phase 10 Arena closeout proof is complete and packaging remains paused.";
  }
  if (!ownerResumeApproved) {
    return "Phase 10 Arena closeout is ready, but packaging remains paused until explicit owner resume approval.";
  }
  return "Phase 10 Arena closeout and owner resume approval are ready for the next release gate.";
}

function nextAction(
  closeout: Phase10ArenaPolishCloseoutStatus,
  isCloseoutReady: boolean,
  ownerResumeApproved: boolean
): string {
  if (!isCloseoutReady) {
    return closeout.nextAction;
  }
  if (!ownerResumeApproved) {
    return "Record explicit owner approval before packaging, installer, signing, Git push, or release work resumes.";
  }
  return "Continue only into the Phase 11 release-readiness gate before any packaging action runs.";
}

function proof(input: {
  readonly state: Phase10PackagingResumeGateState;
  readonly canResumePackaging: boolean;
  readonly closeoutReady: boolean;
  readonly ownerResumeApproved: boolean;
  readonly installPathLocked: boolean;
  readonly desktopPackagingLocked: boolean;
  readonly releaseGateRequired: boolean;
}): string {
  return (
    `phase10PackagingResumeGateProof=state=${input.state} ` +
    `canResume=${input.canResumePackaging ? "yes" : "no"} ` +
    `closeout=${input.closeoutReady ? "ready" : "held"} ` +
    `ownerResume=${input.ownerResumeApproved ? "approved" : "missing"} ` +
    `installPath=${input.installPathLocked ? "locked" : "review"} ` +
    `desktopPackaging=${input.desktopPackagingLocked ? "locked" : "review"} ` +
    `releaseGate=${input.releaseGateRequired ? "required" : "not-required"} safety=metadata-only`
  );
}

function ariaLabel(gate: Omit<Phase10PackagingResumeGate, "ariaLabel">): string {
  return (
    `${gate.label}: ${gate.statusLabel}; ${gate.readiness}% ready; ` +
    `can resume packaging ${gate.canResumePackaging ? "yes" : "no"}; ` +
    `install path ${gate.installPathLocked ? "locked" : "review"}; ` +
    `desktop packaging ${gate.desktopPackagingLocked ? "locked" : "review"}; ` +
    `next action: ${gate.nextAction}`
  );
}

export function buildPhase10PackagingResumeGate(
  closeout: Phase10ArenaPolishCloseoutStatus,
  approvals: Phase10PackagingResumeApprovalEvidence = {}
): Phase10PackagingResumeGate {
  const isCloseoutReady = closeoutReady(closeout);
  const ownerResumeApproved = approvals.ownerResumeApproved === true;
  const state = resolveState(closeout, isCloseoutReady, ownerResumeApproved);
  const canResumePackaging = isCloseoutReady && ownerResumeApproved;
  const draft = {
    id: GATE_ID,
    label: GATE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    canResumePackaging,
    closeoutReady: isCloseoutReady,
    ownerResumeApproved,
    installPathLocked: true,
    desktopPackagingLocked: true,
    releaseGateRequired: true,
    detail: detail(state, isCloseoutReady, ownerResumeApproved),
    nextAction: nextAction(closeout, isCloseoutReady, ownerResumeApproved),
    safety: SAFETY
  };
  const gate = {
    ...draft,
    phase10PackagingResumeGateProof: proof(draft)
  };

  return {
    ...gate,
    ariaLabel: ariaLabel(gate)
  };
}
