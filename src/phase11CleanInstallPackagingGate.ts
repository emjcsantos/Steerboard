import type {
  Phase11ReleaseReadinessItemKind,
  Phase11ReleaseReadinessSnapshot
} from "./phase11ReleaseReadiness";
import type { Phase11ReleaseCloseoutStatus } from "./phase11ReleaseCloseoutStatus";

export type Phase11CleanInstallPackagingGateState = "ready" | "review" | "blocked" | "waiting";

export interface Phase11CleanInstallPackagingApprovalEvidence {
  readonly ownerInstallPackagingApproved?: boolean;
}

export interface Phase11CleanInstallPackagingGate {
  readonly id: string;
  readonly label: string;
  readonly state: Phase11CleanInstallPackagingGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canPrepareInstallPackage: boolean;
  readonly releaseCloseoutReady: boolean;
  readonly cleanInstallEvidenceReady: boolean;
  readonly buildTestEvidenceReady: boolean;
  readonly smokeProofReady: boolean;
  readonly packagingLockReady: boolean;
  readonly ownerInstallPackagingApproved: boolean;
  readonly gitInstallPathLocked: boolean;
  readonly desktopPackagingLocked: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly phase11CleanInstallPackagingGateProof: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

const GATE_ID = "phase-11-clean-install-packaging-gate";
const GATE_LABEL = "Phase 11 clean install packaging gate";
const SAFETY =
  "Phase 11 clean install packaging gate is evidence-only. It summarizes clean checkout, build/test, smoke proof, release closeout, and explicit owner install/package approval without running installs, package builds, signing, installer generation, Git pushes, filesystem mutations, or network actions.";

const STATUS_LABELS: Record<Phase11CleanInstallPackagingGateState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function itemReady(
  readiness: Phase11ReleaseReadinessSnapshot,
  kind: Phase11ReleaseReadinessItemKind
): boolean {
  return readiness.items.some((item) => item.kind === kind && item.status === "ready");
}

function releaseCloseoutReady(closeout: Phase11ReleaseCloseoutStatus): boolean {
  return (
    closeout.state === "complete" &&
    closeout.canRecommendRelease &&
    closeout.packagingPaused &&
    closeout.phase11ReleaseCloseoutStatusProof.includes("release=ready") &&
    closeout.phase11ReleaseCloseoutStatusProof.includes("packaging=paused")
  );
}

function resolveState(input: {
  readonly closeout: Phase11ReleaseCloseoutStatus;
  readonly readiness: Phase11ReleaseReadinessSnapshot;
  readonly prerequisiteReady: boolean;
  readonly ownerApproved: boolean;
}): Phase11CleanInstallPackagingGateState {
  if (input.closeout.state === "blocked" || input.readiness.state === "blocked") {
    return "blocked";
  }
  if (!input.prerequisiteReady) {
    return input.closeout.state === "waiting" || input.readiness.state === "waiting"
      ? "waiting"
      : "review";
  }
  return input.ownerApproved ? "ready" : "review";
}

function readinessForState(state: Phase11CleanInstallPackagingGateState): number {
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

function detail(input: {
  readonly state: Phase11CleanInstallPackagingGateState;
  readonly releaseCloseoutReady: boolean;
  readonly cleanInstallEvidenceReady: boolean;
  readonly buildTestEvidenceReady: boolean;
  readonly smokeProofReady: boolean;
  readonly packagingLockReady: boolean;
  readonly ownerApproved: boolean;
}): string {
  if (input.state === "blocked") {
    return "Clean install packaging prep is blocked by Phase 11 release readiness or closeout evidence.";
  }
  if (
    !input.releaseCloseoutReady ||
    !input.cleanInstallEvidenceReady ||
    !input.buildTestEvidenceReady ||
    !input.smokeProofReady ||
    !input.packagingLockReady
  ) {
    return "Clean install packaging prep is held until release closeout, clean checkout, build/test, smoke proof, and packaging lock evidence are all ready.";
  }
  if (!input.ownerApproved) {
    return "Clean install packaging prerequisites are ready, but install/package preparation remains held until explicit owner approval.";
  }
  return "Clean install packaging prerequisites and explicit owner approval are ready for the next packaging workflow gate.";
}

function nextAction(
  closeout: Phase11ReleaseCloseoutStatus,
  prerequisiteReady: boolean,
  ownerApproved: boolean
): string {
  if (!prerequisiteReady) {
    return closeout.nextAction;
  }
  if (!ownerApproved) {
    return "Record explicit owner approval before preparing a clean Git install path, desktop package, installer, signing pass, Git push, or release artifact.";
  }
  return "Proceed only through an owner-approved packaging workflow; keep install, package, signing, and Git actions separately gated.";
}

function proof(input: {
  readonly state: Phase11CleanInstallPackagingGateState;
  readonly canPrepareInstallPackage: boolean;
  readonly releaseCloseoutReady: boolean;
  readonly cleanInstallEvidenceReady: boolean;
  readonly buildTestEvidenceReady: boolean;
  readonly smokeProofReady: boolean;
  readonly packagingLockReady: boolean;
  readonly ownerInstallPackagingApproved: boolean;
  readonly gitInstallPathLocked: boolean;
  readonly desktopPackagingLocked: boolean;
}): string {
  return (
    `phase11CleanInstallPackagingGateProof=state=${input.state} ` +
    `canPrepare=${input.canPrepareInstallPackage ? "yes" : "no"} ` +
    `closeout=${input.releaseCloseoutReady ? "ready" : "held"} ` +
    `cleanInstall=${input.cleanInstallEvidenceReady ? "ready" : "held"} ` +
    `buildTest=${input.buildTestEvidenceReady ? "ready" : "held"} ` +
    `smoke=${input.smokeProofReady ? "ready" : "held"} ` +
    `packagingLock=${input.packagingLockReady ? "ready" : "held"} ` +
    `ownerInstallPackaging=${input.ownerInstallPackagingApproved ? "approved" : "missing"} ` +
    `gitInstallPath=${input.gitInstallPathLocked ? "locked" : "review"} ` +
    `desktopPackaging=${input.desktopPackagingLocked ? "locked" : "review"} safety=metadata-only`
  );
}

function ariaLabel(gate: Omit<Phase11CleanInstallPackagingGate, "ariaLabel">): string {
  return (
    `${gate.label}: ${gate.statusLabel}; ${gate.readiness}% ready; ` +
    `prepare install package ${gate.canPrepareInstallPackage ? "yes" : "no"}; ` +
    `Git install path ${gate.gitInstallPathLocked ? "locked" : "review"}; ` +
    `desktop packaging ${gate.desktopPackagingLocked ? "locked" : "review"}; ` +
    `next action: ${gate.nextAction}`
  );
}

export function buildPhase11CleanInstallPackagingGate(
  closeout: Phase11ReleaseCloseoutStatus,
  releaseReadiness: Phase11ReleaseReadinessSnapshot,
  approvals: Phase11CleanInstallPackagingApprovalEvidence = {}
): Phase11CleanInstallPackagingGate {
  const closeoutReady = releaseCloseoutReady(closeout);
  const cleanInstallReady =
    itemReady(releaseReadiness, "fresh-checkout") &&
    itemReady(releaseReadiness, "clean-checkout");
  const buildTestReady = itemReady(releaseReadiness, "build-test");
  const smokeReady = itemReady(releaseReadiness, "smoke-proof");
  const packagingLockReady = itemReady(releaseReadiness, "packaging-lock");
  const prerequisiteReady =
    closeoutReady &&
    cleanInstallReady &&
    buildTestReady &&
    smokeReady &&
    packagingLockReady;
  const ownerApproved = approvals.ownerInstallPackagingApproved === true;
  const state = resolveState({
    closeout,
    readiness: releaseReadiness,
    prerequisiteReady,
    ownerApproved
  });
  const canPrepareInstallPackage = prerequisiteReady && ownerApproved;
  const draft = {
    id: GATE_ID,
    label: GATE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    canPrepareInstallPackage,
    releaseCloseoutReady: closeoutReady,
    cleanInstallEvidenceReady: cleanInstallReady,
    buildTestEvidenceReady: buildTestReady,
    smokeProofReady: smokeReady,
    packagingLockReady,
    ownerInstallPackagingApproved: ownerApproved,
    gitInstallPathLocked: true,
    desktopPackagingLocked: true,
    detail: detail({
      state,
      releaseCloseoutReady: closeoutReady,
      cleanInstallEvidenceReady: cleanInstallReady,
      buildTestEvidenceReady: buildTestReady,
      smokeProofReady: smokeReady,
      packagingLockReady,
      ownerApproved
    }),
    nextAction: nextAction(closeout, prerequisiteReady, ownerApproved),
    safety: SAFETY
  };
  const gate = {
    ...draft,
    phase11CleanInstallPackagingGateProof: proof(draft)
  };

  return {
    ...gate,
    ariaLabel: ariaLabel(gate)
  };
}
