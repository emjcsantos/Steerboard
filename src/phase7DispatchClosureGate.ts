import type { DispatchReviewClosureState, DispatchReviewRecord } from "./dispatchReviewRecord";
import type { Phase7DispatchReviewArtifactVerification } from "./phase7DispatchReviewArtifact";
import type { Phase7LiveWorkerLaunchGate } from "./phase7LiveWorkerLaunchGate";

export type Phase7DispatchClosureGateState = "ready" | "review" | "blocked" | "waiting";

export interface Phase7DispatchClosureGate {
  readonly state: Phase7DispatchClosureGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canCloseDispatchReview: boolean;
  readonly canSpawnLiveWorker: boolean;
  readonly closureState: DispatchReviewClosureState;
  readonly artifactVerificationState: Phase7DispatchReviewArtifactVerification["state"];
  readonly launchGateState: Phase7LiveWorkerLaunchGate["state"];
  readonly traceabilityLinkCount: number;
  readonly openBlockerCount: number;
  readonly approvalRequired: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly closureGateProof: string;
}

const STATUS_LABELS: Record<Phase7DispatchClosureGateState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function readiness(state: Phase7DispatchClosureGateState): number {
  switch (state) {
    case "ready":
      return 100;
    case "review":
      return 75;
    case "waiting":
      return 35;
    case "blocked":
    default:
      return 15;
  }
}

function proof(gate: Omit<Phase7DispatchClosureGate, "closureGateProof">): string {
  return [
    "phase7DispatchClosureGate",
    `state=${gate.state}`,
    `closure=${gate.closureState}`,
    `artifactVerification=${gate.artifactVerificationState}`,
    `launchGate=${gate.launchGateState}`,
    `canClose=${gate.canCloseDispatchReview ? "yes" : "no"}`,
    `canSpawn=${gate.canSpawnLiveWorker ? "yes" : "no"}`,
    `approval=${gate.approvalRequired ? "required" : "recorded"}`,
    `traceabilityLinks=${gate.traceabilityLinkCount}/5`,
    `open=${gate.openBlockerCount}`
  ].join(" ");
}

function result(
  state: Phase7DispatchClosureGateState,
  record: DispatchReviewRecord,
  artifactVerification: Phase7DispatchReviewArtifactVerification,
  launchGate: Phase7LiveWorkerLaunchGate,
  detail: string,
  nextAction: string,
  canCloseDispatchReview = false
): Phase7DispatchClosureGate {
  const gate = {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readiness(state),
    canCloseDispatchReview,
    canSpawnLiveWorker: false,
    closureState: record.closureState,
    artifactVerificationState: artifactVerification.state,
    launchGateState: launchGate.state,
    traceabilityLinkCount: record.traceabilityLinkCount,
    openBlockerCount: artifactVerification.openBlockerCount,
    approvalRequired: launchGate.approvalRequired,
    detail,
    nextAction
  };

  return {
    ...gate,
    closureGateProof: proof(gate)
  };
}

export function buildPhase7DispatchClosureGate(input: {
  readonly record: DispatchReviewRecord;
  readonly artifactVerification: Phase7DispatchReviewArtifactVerification;
  readonly launchGate: Phase7LiveWorkerLaunchGate;
}): Phase7DispatchClosureGate {
  const { record, artifactVerification, launchGate } = input;

  if (artifactVerification.state === "waiting" || launchGate.state === "waiting") {
    return result(
      "waiting",
      record,
      artifactVerification,
      launchGate,
      "Phase 7 dispatch closure is waiting for artifact verification and launch-gate evidence.",
      "Attach the Phase 7 dispatch artifact verification and launch-gate proof before closure review."
    );
  }

  if (
    artifactVerification.state === "blocked" ||
    launchGate.state === "blocked" ||
    launchGate.canSpawnLiveWorker
  ) {
    return result(
      "blocked",
      record,
      artifactVerification,
      launchGate,
      "Phase 7 dispatch closure is blocked because launch safety or artifact verification failed.",
      "Restore verified artifact evidence and locked live-worker launch proof before closure review."
    );
  }

  if (
    artifactVerification.state !== "ready" ||
    launchGate.state !== "locked" ||
    artifactVerification.openBlockerCount > 0 ||
    record.traceabilityLinkCount < 5
  ) {
    return result(
      "review",
      record,
      artifactVerification,
      launchGate,
      "Phase 7 dispatch closure remains in review until artifact, launch-gate, blocker, and traceability proof are all ready.",
      artifactVerification.nextAction
    );
  }

  return result(
    "ready",
    record,
    artifactVerification,
    launchGate,
    "Phase 7 dispatch review can close as a metadata handoff while live-worker spawning stays locked.",
    "Close the local dispatch review only as handoff proof; live-worker expansion still needs separate owner approval.",
    true
  );
}
