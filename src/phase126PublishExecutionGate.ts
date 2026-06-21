import type { Phase126PublishHoldCloseoutStatus } from "./phase126PublishHoldCloseoutStatus";

export type Phase126PublishExecutionGateState = "ready" | "review" | "blocked" | "waiting";

export interface Phase126PublishExecutionGateInput {
  readonly closeoutStatus: Phase126PublishHoldCloseoutStatus;
  readonly publicRemoteRestored?: boolean;
  readonly ownerPushApprovalRecorded?: boolean;
  readonly branchTargetVerified?: boolean;
  readonly localProofCommitQueueHeld?: boolean;
  readonly targetBranch?: string;
}

export interface Phase126PublishExecutionGate {
  readonly id: string;
  readonly label: string;
  readonly state: Phase126PublishExecutionGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly closeoutState: Phase126PublishHoldCloseoutStatus["state"];
  readonly closeoutReady: boolean;
  readonly publicRemoteRestored: boolean;
  readonly ownerPushApprovalRecorded: boolean;
  readonly branchTargetVerified: boolean;
  readonly canPush: boolean;
  readonly canPublish: boolean;
  readonly noPushBoundaryActive: boolean;
  readonly localProofCommitQueueHeld: boolean;
  readonly targetBranch: string;
  readonly topHold: string;
  readonly phase126PublishExecutionGateProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

const STATUS_LABELS: Record<Phase126PublishExecutionGateState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SAFETY =
  "Phase 1/2/6 publish execution gate is evidence-only. It checks local closeout proof, public remote restoration, owner push approval, and branch target verification without running Git commands, pushing branches, changing remotes, publishing artifacts, or mutating saved sessions.";

function topHold(input: Phase126PublishExecutionGateInput): string {
  if (input.closeoutStatus.state !== "complete") {
    return "local-closeout";
  }
  if (!input.publicRemoteRestored) {
    return "public-remote";
  }
  if (!input.ownerPushApprovalRecorded) {
    return "owner-push-approval";
  }
  if (!input.branchTargetVerified) {
    return "branch-target";
  }
  return "none";
}

function stateForHold(
  input: Phase126PublishExecutionGateInput,
  hold: string
): Phase126PublishExecutionGateState {
  if (hold === "none") {
    return "ready";
  }
  if (hold === "local-closeout") {
    if (input.closeoutStatus.state === "waiting") {
      return "waiting";
    }
    if (input.closeoutStatus.state === "review") {
      return "review";
    }
  }
  return "blocked";
}

function readinessForState(state: Phase126PublishExecutionGateState, hold: string): number {
  if (state === "ready") {
    return 100;
  }
  if (hold === "branch-target") {
    return 90;
  }
  if (hold === "owner-push-approval") {
    return 82;
  }
  if (hold === "public-remote") {
    return 75;
  }
  if (state === "review") {
    return 60;
  }
  if (state === "waiting") {
    return 40;
  }
  return 0;
}

function nextAction(input: Phase126PublishExecutionGateInput, hold: string): string {
  if (hold === "none") {
    return "Phase 1/2/6 publish execution can be considered through the owner-approved push path with the local proof commit queue released.";
  }
  if (hold === "local-closeout") {
    return input.closeoutStatus.nextAction;
  }
  if (hold === "public-remote") {
    return "Restore the Steerboard public remote before any Phase 1/2/6 push or publish execution is considered.";
  }
  if (hold === "owner-push-approval") {
    return "Record explicit owner approval to push before any Phase 1/2/6 publish execution is considered.";
  }
  return "Verify the exact branch publish target before any Phase 1/2/6 push or publish execution is considered.";
}

function yesNo(value: boolean): "yes" | "no" {
  return value ? "yes" : "no";
}

function proof(
  gate: Omit<Phase126PublishExecutionGate, "ariaLabel" | "phase126PublishExecutionGateProof">
): string {
  return (
    `phase126PublishExecutionGateProof=state=${gate.state} readiness=${gate.readiness} ` +
    `closeout=${gate.closeoutState} remote=${gate.publicRemoteRestored ? "restored" : "missing"} ` +
    `ownerApproval=${gate.ownerPushApprovalRecorded ? "recorded" : "missing"} ` +
    `target=${gate.branchTargetVerified ? "verified" : "unverified"} ` +
    `canPush=${yesNo(gate.canPush)} canPublish=${yesNo(gate.canPublish)} ` +
    `noPush=${gate.noPushBoundaryActive ? "active" : "cleared"} ` +
    `proofCommits=${gate.localProofCommitQueueHeld ? "held" : "released"} ` +
    `topHold=${gate.topHold} ` +
    `branch=${gate.targetBranch}`
  );
}

function ariaLabel(gate: Omit<Phase126PublishExecutionGate, "ariaLabel">): string {
  return (
    `${gate.label}: ${gate.statusLabel}; ${gate.readiness}% ready; ` +
    `closeout ${gate.closeoutState}; remote ${
      gate.publicRemoteRestored ? "restored" : "missing"
    }; owner approval ${gate.ownerPushApprovalRecorded ? "recorded" : "missing"}; ` +
    `push ${gate.canPush ? "allowed" : "held"}; next action: ${gate.nextAction}`
  );
}

export function buildPhase126PublishExecutionGate(
  input: Phase126PublishExecutionGateInput
): Phase126PublishExecutionGate {
  const hold = topHold(input);
  const state = stateForHold(input, hold);
  const canPush =
    state === "ready" &&
    input.closeoutStatus.state === "complete" &&
    input.publicRemoteRestored === true &&
    input.ownerPushApprovalRecorded === true &&
    input.branchTargetVerified === true;
  const localProofCommitQueueHeld =
    input.localProofCommitQueueHeld ?? !canPush;
  const draft = {
    id: "phase-1-2-6-publish-execution-gate",
    label: "Phase 1/2/6 publish execution gate",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state, hold),
    closeoutState: input.closeoutStatus.state,
    closeoutReady: input.closeoutStatus.state === "complete",
    publicRemoteRestored: input.publicRemoteRestored === true,
    ownerPushApprovalRecorded: input.ownerPushApprovalRecorded === true,
    branchTargetVerified: input.branchTargetVerified === true,
    canPush,
    canPublish: canPush,
    noPushBoundaryActive: !canPush,
    localProofCommitQueueHeld,
    targetBranch: input.targetBranch ?? "current-local-branch",
    topHold: hold,
    nextAction: nextAction(input, hold),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase126PublishExecutionGateProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
