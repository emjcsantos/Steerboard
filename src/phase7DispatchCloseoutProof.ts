import type { Phase7DispatchClosureGate } from "./phase7DispatchClosureGate";
import type { Phase7DispatchReviewArtifactVerification } from "./phase7DispatchReviewArtifact";
import type { Phase7LiveWorkerLaunchGate } from "./phase7LiveWorkerLaunchGate";

export type Phase7DispatchCloseoutProofState = "ready" | "review" | "blocked" | "waiting";

export interface Phase7DispatchCloseoutProof {
  readonly state: Phase7DispatchCloseoutProofState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canCloseDispatchReview: boolean;
  readonly canSpawnLiveWorker: boolean;
  readonly artifactVerificationState: Phase7DispatchReviewArtifactVerification["state"];
  readonly launchGateState: Phase7LiveWorkerLaunchGate["state"];
  readonly closureGateState: Phase7DispatchClosureGate["state"];
  readonly openBlockerCount: number;
  readonly approvalRequired: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly closeoutProof: string;
}

const STATUS_LABELS: Record<Phase7DispatchCloseoutProofState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function proof(closeout: Omit<Phase7DispatchCloseoutProof, "closeoutProof">): string {
  return [
    "phase7DispatchCloseoutProof",
    `state=${closeout.state}`,
    `artifactVerification=${closeout.artifactVerificationState}`,
    `launchGate=${closeout.launchGateState}`,
    `closureGate=${closeout.closureGateState}`,
    `canClose=${closeout.canCloseDispatchReview ? "yes" : "no"}`,
    `canSpawn=${closeout.canSpawnLiveWorker ? "yes" : "no"}`,
    `approval=${closeout.approvalRequired ? "required" : "recorded"}`,
    `open=${closeout.openBlockerCount}`
  ].join(" ");
}

function result(
  state: Phase7DispatchCloseoutProofState,
  artifactVerification: Phase7DispatchReviewArtifactVerification,
  launchGate: Phase7LiveWorkerLaunchGate,
  closureGate: Phase7DispatchClosureGate,
  detail: string,
  nextAction: string
): Phase7DispatchCloseoutProof {
  const closeout = {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: state === "ready" ? 100 : state === "review" ? 80 : state === "waiting" ? 35 : 15,
    canCloseDispatchReview: state === "ready" && closureGate.canCloseDispatchReview,
    canSpawnLiveWorker: false,
    artifactVerificationState: artifactVerification.state,
    launchGateState: launchGate.state,
    closureGateState: closureGate.state,
    openBlockerCount: Math.max(
      artifactVerification.openBlockerCount,
      launchGate.openBlockerCount,
      closureGate.openBlockerCount
    ),
    approvalRequired: launchGate.approvalRequired || closureGate.approvalRequired,
    detail,
    nextAction
  };

  return {
    ...closeout,
    closeoutProof: proof(closeout)
  };
}

export function buildPhase7DispatchCloseoutProof(input: {
  readonly artifactVerification: Phase7DispatchReviewArtifactVerification;
  readonly launchGate: Phase7LiveWorkerLaunchGate;
  readonly closureGate: Phase7DispatchClosureGate;
}): Phase7DispatchCloseoutProof {
  const { artifactVerification, launchGate, closureGate } = input;

  if (
    artifactVerification.state === "waiting" ||
    launchGate.state === "waiting" ||
    closureGate.state === "waiting"
  ) {
    return result(
      "waiting",
      artifactVerification,
      launchGate,
      closureGate,
      "Phase 7 dispatch closeout is waiting for artifact, launch, and closure gate evidence.",
      "Attach all Phase 7 gate proofs before closeout can be trusted."
    );
  }

  if (
    artifactVerification.state === "blocked" ||
    launchGate.state === "blocked" ||
    closureGate.state === "blocked" ||
    launchGate.canSpawnLiveWorker ||
    closureGate.canSpawnLiveWorker
  ) {
    return result(
      "blocked",
      artifactVerification,
      launchGate,
      closureGate,
      "Phase 7 dispatch closeout is blocked because one or more gate proofs failed or spawning is not locked.",
      "Restore artifact verification, launch lock, and closure-gate proof before closeout."
    );
  }

  if (
    artifactVerification.state !== "ready" ||
    launchGate.state !== "locked" ||
    closureGate.state !== "ready" ||
    !closureGate.canCloseDispatchReview
  ) {
    return result(
      "review",
      artifactVerification,
      launchGate,
      closureGate,
      "Phase 7 dispatch closeout remains in review until artifact, launch, and closure gates are ready.",
      closureGate.nextAction
    );
  }

  return result(
    "ready",
    artifactVerification,
    launchGate,
    closureGate,
    "Phase 7 dispatch closeout is ready as a local metadata handoff; live-worker spawning remains locked.",
    "Use this closeout proof for owner review, then keep live-worker expansion behind separate approval."
  );
}
