import type { MigrationApplyImplementationBoundary } from "./migrationApplyImplementationBoundary";
import type { Phase5MigrationCompletionGate } from "./phase5MigrationCompletionGate";

export type Phase5ProfileActivationGateState = "ready" | "review" | "waiting" | "blocked";

export interface Phase5ProfileActivationEvidence {
  readonly ownerProfileActivationApprovalRecorded?: boolean;
  readonly profileActivationHandlerReady?: boolean;
}

export interface Phase5ProfileActivationGate {
  readonly id: string;
  readonly label: string;
  readonly state: Phase5ProfileActivationGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canActivateProfile: boolean;
  readonly phaseComplete: boolean;
  readonly reviewOnlyComplete: boolean;
  readonly completionState: Phase5MigrationCompletionGate["state"];
  readonly implementationBoundaryState: MigrationApplyImplementationBoundary["state"];
  readonly ownerActivationApprovalRecorded: boolean;
  readonly profileActivationHandlerReady: boolean;
  readonly sourceMutationLocked: boolean;
  readonly applyMigrationLocked: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly profileActivationGateProof: string;
  readonly ariaLabel: string;
}

const GATE_ID = "phase-5-profile-activation-gate";
const GATE_LABEL = "Phase 5 profile activation gate";

const STATUS_LABELS: Record<Phase5ProfileActivationGateState, string> = {
  ready: "Ready",
  review: "Review held",
  waiting: "Activation approval needed",
  blocked: "Blocked"
};

function proof(
  gate: Omit<Phase5ProfileActivationGate, "profileActivationGateProof" | "ariaLabel">
): string {
  return [
    "phase5ProfileActivationGate",
    `state=${gate.state}`,
    `phaseComplete=${gate.phaseComplete ? "yes" : "no"}`,
    `reviewOnly=${gate.reviewOnlyComplete ? "complete" : "held"}`,
    `completion=${gate.completionState}`,
    `implementationBoundary=${gate.implementationBoundaryState}`,
    `ownerActivationApproval=${gate.ownerActivationApprovalRecorded ? "recorded" : "required"}`,
    `handler=${gate.profileActivationHandlerReady ? "ready" : "missing"}`,
    `canActivate=${gate.canActivateProfile ? "yes" : "no"}`,
    `sourceMutation=${gate.sourceMutationLocked ? "locked" : "unlocked"}`,
    `apply=${gate.applyMigrationLocked ? "locked" : "unlocked"}`
  ].join(" ");
}

function ariaLabel(gate: Omit<Phase5ProfileActivationGate, "ariaLabel">): string {
  return (
    `${gate.label}: ${gate.statusLabel}; ${gate.readiness}% ready; ` +
    `phase complete ${gate.phaseComplete ? "yes" : "no"}; ` +
    `activation approval ${gate.ownerActivationApprovalRecorded ? "recorded" : "required"}; ` +
    `handler ${gate.profileActivationHandlerReady ? "ready" : "missing"}; ` +
    `can activate ${gate.canActivateProfile ? "yes" : "no"}; ` +
    `next action: ${gate.nextAction}`
  );
}

function result(
  state: Phase5ProfileActivationGateState,
  completionGate: Phase5MigrationCompletionGate,
  implementationBoundary: MigrationApplyImplementationBoundary,
  evidence: Phase5ProfileActivationEvidence | undefined,
  detail: string,
  nextAction: string
): Phase5ProfileActivationGate {
  const ownerActivationApprovalRecorded =
    evidence?.ownerProfileActivationApprovalRecorded === true;
  const profileActivationHandlerReady = evidence?.profileActivationHandlerReady === true;
  const canActivateProfile =
    state === "ready" &&
    completionGate.phaseComplete &&
    completionGate.reviewOnlyComplete &&
    ownerActivationApprovalRecorded &&
    profileActivationHandlerReady &&
    !completionGate.canApplyMigration &&
    !implementationBoundary.canApplyMigration;
  const draft = {
    id: GATE_ID,
    label: GATE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: state === "ready" ? 100 : state === "waiting" ? 80 : state === "review" ? 60 : 0,
    canActivateProfile,
    phaseComplete: completionGate.phaseComplete,
    reviewOnlyComplete: completionGate.reviewOnlyComplete,
    completionState: completionGate.state,
    implementationBoundaryState: implementationBoundary.state,
    ownerActivationApprovalRecorded,
    profileActivationHandlerReady,
    sourceMutationLocked:
      implementationBoundary.sourceMutationLocked && !completionGate.mutationPathAvailable,
    applyMigrationLocked:
      !completionGate.canApplyMigration && !implementationBoundary.canApplyMigration,
    detail,
    nextAction
  };
  const gate = {
    ...draft,
    profileActivationGateProof: proof(draft)
  };

  return {
    ...gate,
    ariaLabel: ariaLabel(gate)
  };
}

export function buildPhase5ProfileActivationGate(
  completionGate: Phase5MigrationCompletionGate,
  implementationBoundary: MigrationApplyImplementationBoundary,
  evidence?: Phase5ProfileActivationEvidence
): Phase5ProfileActivationGate {
  if (
    completionGate.state === "blocked" ||
    implementationBoundary.state === "blocked" ||
    completionGate.canApplyMigration ||
    implementationBoundary.canApplyMigration ||
    !implementationBoundary.sourceMutationLocked
  ) {
    return result(
      "blocked",
      completionGate,
      implementationBoundary,
      evidence,
      "Phase 5 profile activation is blocked because review-only completion or mutation locks are not trustworthy.",
      "Restore Phase 5 completion proof and locked apply/source-mutation boundaries before activation can be reviewed."
    );
  }

  if (completionGate.state === "waiting") {
    return result(
      "waiting",
      completionGate,
      implementationBoundary,
      evidence,
      "Phase 5 profile activation is waiting for migration review evidence.",
      completionGate.nextAction
    );
  }

  if (!completionGate.phaseComplete || !completionGate.reviewOnlyComplete) {
    return result(
      "review",
      completionGate,
      implementationBoundary,
      evidence,
      "Phase 5 profile activation remains held until review-only migration completion is proven.",
      completionGate.nextAction
    );
  }

  if (!evidence?.ownerProfileActivationApprovalRecorded) {
    return result(
      "waiting",
      completionGate,
      implementationBoundary,
      evidence,
      "Phase 5 review-only migration is complete, but profile activation is waiting for separate owner approval.",
      "Record explicit owner approval for profile activation before connecting an activation handler."
    );
  }

  if (!evidence.profileActivationHandlerReady) {
    return result(
      "review",
      completionGate,
      implementationBoundary,
      evidence,
      "Phase 5 profile activation has owner approval, but no activation handler is ready.",
      "Connect a permissioned profile activation handler before activating a migration profile."
    );
  }

  return result(
    "ready",
    completionGate,
    implementationBoundary,
    evidence,
    "Phase 5 profile activation is ready because review-only completion, owner activation approval, and handler evidence are present.",
    "Activate a profile only through the approved handler and preserve this proof with the migration review record."
  );
}
