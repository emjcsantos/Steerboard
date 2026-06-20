import type {
  Phase7DispatchReviewArtifactState,
  Phase7DispatchReviewArtifactVerification
} from "./phase7DispatchReviewArtifact";

export type Phase7LiveWorkerLaunchGateState = "locked" | "review" | "blocked" | "waiting";

export interface Phase7LiveWorkerLaunchGate {
  readonly state: Phase7LiveWorkerLaunchGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canSpawnLiveWorker: boolean;
  readonly approvalRequired: boolean;
  readonly artifactVerificationState: Phase7DispatchReviewArtifactState;
  readonly executionLocked: boolean;
  readonly openBlockerCount: number;
  readonly liveWorkerLockCount: number;
  readonly handoffPacketCount: number;
  readonly detail: string;
  readonly nextAction: string;
  readonly launchGateProof: string;
}

const STATUS_LABELS: Record<Phase7LiveWorkerLaunchGateState, string> = {
  locked: "Locked",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function proof(gate: Omit<Phase7LiveWorkerLaunchGate, "launchGateProof">): string {
  return [
    "phase7LiveWorkerLaunchGate",
    `state=${gate.state}`,
    `artifactVerification=${gate.artifactVerificationState}`,
    `approval=${gate.approvalRequired ? "required" : "recorded"}`,
    `canSpawn=${gate.canSpawnLiveWorker ? "yes" : "no"}`,
    `execution=${gate.executionLocked ? "locked" : "unlocked"}`,
    `locks=${gate.liveWorkerLockCount}/2`,
    `packets=${gate.handoffPacketCount}/4`,
    `open=${gate.openBlockerCount}`
  ].join(" ");
}

function result(
  state: Phase7LiveWorkerLaunchGateState,
  verification: Phase7DispatchReviewArtifactVerification,
  detail: string,
  nextAction: string
): Phase7LiveWorkerLaunchGate {
  const gate = {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: state === "locked" ? 95 : state === "review" ? 70 : state === "blocked" ? 15 : 35,
    canSpawnLiveWorker: false,
    approvalRequired: true,
    artifactVerificationState: verification.state,
    executionLocked: verification.executionLocked,
    openBlockerCount: verification.openBlockerCount,
    liveWorkerLockCount: verification.liveWorkerLockCount,
    handoffPacketCount: verification.handoffPacketCount,
    detail,
    nextAction
  };

  return {
    ...gate,
    launchGateProof: proof(gate)
  };
}

export function buildPhase7LiveWorkerLaunchGate(
  verification: Phase7DispatchReviewArtifactVerification
): Phase7LiveWorkerLaunchGate {
  if (verification.state === "waiting") {
    return result(
      "waiting",
      verification,
      "Phase 7 live-worker spawning is waiting for a dispatch review artifact verification record.",
      "Export or attach a Phase 7 dispatch review artifact before any live worker launch request can be reviewed."
    );
  }

  if (!verification.executionLocked || verification.state === "blocked") {
    return result(
      "blocked",
      verification,
      "Phase 7 live-worker spawning is blocked because the dispatch artifact does not prove the execution lock.",
      "Restore the local metadata-only no-runtime execution boundary before reviewing live worker expansion."
    );
  }

  if (verification.state !== "ready" || verification.openBlockerCount > 0) {
    return result(
      "review",
      verification,
      "Phase 7 live-worker spawning remains locked while dispatch artifact verification needs review.",
      verification.nextAction
    );
  }

  return result(
    "locked",
    verification,
    "Phase 7 dispatch artifact is verified, but live-worker spawning remains locked until the owner approves a separate live-worker expansion.",
    "Keep dispatch work in local metadata review and use the verified artifact only as handoff proof."
  );
}
