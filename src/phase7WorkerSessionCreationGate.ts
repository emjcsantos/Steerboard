import type { Phase7DispatchCompletionGate } from "./phase7DispatchCompletionGate";
import type { Phase7LiveWorkerLaunchGate } from "./phase7LiveWorkerLaunchGate";

export type Phase7WorkerSessionCreationGateState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase7WorkerSessionCreationApprovalEvidence {
  readonly ownerSessionCreationApprovalRecorded?: boolean;
  readonly liveSessionHandlerReady?: boolean;
}

export interface Phase7WorkerSessionCreationGate {
  readonly state: Phase7WorkerSessionCreationGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canCreateWorkerSession: boolean;
  readonly completionState: Phase7DispatchCompletionGate["state"];
  readonly launchGateState: Phase7LiveWorkerLaunchGate["state"];
  readonly preflightState: Phase7LiveWorkerLaunchGate["preflightState"];
  readonly phaseComplete: boolean;
  readonly ownerApprovalRecorded: boolean;
  readonly liveSessionHandlerReady: boolean;
  readonly executionLocked: boolean;
  readonly handoffPacketCount: number;
  readonly detail: string;
  readonly nextAction: string;
  readonly sessionCreationProof: string;
}

const STATUS_LABELS: Record<Phase7WorkerSessionCreationGateState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function proof(
  gate: Omit<Phase7WorkerSessionCreationGate, "sessionCreationProof">
): string {
  return [
    "phase7WorkerSessionCreationGate",
    `state=${gate.state}`,
    `phaseComplete=${gate.phaseComplete ? "yes" : "no"}`,
    `completion=${gate.completionState}`,
    `launch=${gate.launchGateState}`,
    `preflight=${gate.preflightState}`,
    `ownerApproval=${gate.ownerApprovalRecorded ? "recorded" : "required"}`,
    `handler=${gate.liveSessionHandlerReady ? "ready" : "missing"}`,
    `canCreate=${gate.canCreateWorkerSession ? "yes" : "no"}`,
    `execution=${gate.executionLocked ? "locked" : "unlocked"}`,
    `packets=${gate.handoffPacketCount}/4`
  ].join(" ");
}

function result(
  state: Phase7WorkerSessionCreationGateState,
  completionGate: Phase7DispatchCompletionGate,
  launchGate: Phase7LiveWorkerLaunchGate,
  evidence: Phase7WorkerSessionCreationApprovalEvidence | undefined,
  detail: string,
  nextAction: string
): Phase7WorkerSessionCreationGate {
  const ownerApprovalRecorded = evidence?.ownerSessionCreationApprovalRecorded === true;
  const liveSessionHandlerReady = evidence?.liveSessionHandlerReady === true;
  const canCreateWorkerSession =
    state === "ready" &&
    completionGate.phaseComplete &&
    launchGate.preflightState === "ready" &&
    ownerApprovalRecorded &&
    liveSessionHandlerReady;
  const gate = {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: state === "ready" ? 100 : state === "review" ? 75 : state === "waiting" ? 45 : 15,
    canCreateWorkerSession,
    completionState: completionGate.state,
    launchGateState: launchGate.state,
    preflightState: launchGate.preflightState,
    phaseComplete: completionGate.phaseComplete,
    ownerApprovalRecorded,
    liveSessionHandlerReady,
    executionLocked: launchGate.executionLocked && !completionGate.canSpawnLiveWorker,
    handoffPacketCount: completionGate.handoffPacketCount,
    detail,
    nextAction
  };

  return {
    ...gate,
    sessionCreationProof: proof(gate)
  };
}

export function buildPhase7WorkerSessionCreationGate(
  completionGate: Phase7DispatchCompletionGate,
  launchGate: Phase7LiveWorkerLaunchGate,
  evidence?: Phase7WorkerSessionCreationApprovalEvidence
): Phase7WorkerSessionCreationGate {
  if (!launchGate.executionLocked || completionGate.canSpawnLiveWorker) {
    return result(
      "blocked",
      completionGate,
      launchGate,
      evidence,
      "Phase 7 worker/session creation is blocked because live execution is not locked.",
      "Restore the no-spawn execution boundary before any worker/session creation request is reviewed."
    );
  }

  if (completionGate.state === "waiting" || launchGate.state === "waiting") {
    return result(
      "waiting",
      completionGate,
      launchGate,
      evidence,
      "Phase 7 worker/session creation is waiting for dispatch completion and live-worker launch-gate evidence.",
      "Attach dispatch completion and launch-gate proof before session creation can be reviewed."
    );
  }

  if (completionGate.state === "blocked" || launchGate.state === "blocked") {
    return result(
      "blocked",
      completionGate,
      launchGate,
      evidence,
      "Phase 7 worker/session creation is blocked by dispatch completion or launch-gate evidence.",
      "Resolve the Phase 7 completion or launch-gate blocker before session creation can be reviewed."
    );
  }

  if (!completionGate.phaseComplete || completionGate.state !== "complete") {
    return result(
      "review",
      completionGate,
      launchGate,
      evidence,
      "Phase 7 worker/session creation remains in review until the dispatch completion gate is complete.",
      completionGate.nextAction
    );
  }

  if (launchGate.preflightState !== "ready") {
    return result(
      "review",
      completionGate,
      launchGate,
      evidence,
      "Phase 7 worker/session creation remains locked until live-session preflight evidence is ready.",
      "Attach risk exception, disabled-path, permission approval, audit persistence, and rollback evidence before requesting session creation."
    );
  }

  if (!evidence?.ownerSessionCreationApprovalRecorded) {
    return result(
      "waiting",
      completionGate,
      launchGate,
      evidence,
      "Phase 7 dispatch is complete and preflight is ready, but worker/session creation is waiting for explicit owner approval.",
      "Record owner approval for Phase 7 live worker/session creation before enabling a handler."
    );
  }

  if (!evidence.liveSessionHandlerReady) {
    return result(
      "review",
      completionGate,
      launchGate,
      evidence,
      "Phase 7 worker/session creation has owner approval, but no live session creation handler is ready.",
      "Connect a permissioned live session creation handler before creating a worker session."
    );
  }

  return result(
    "ready",
    completionGate,
    launchGate,
    evidence,
    "Phase 7 worker/session creation is ready because completion, preflight, owner approval, and live handler evidence are present.",
    "Create the live worker/session only through the approved permissioned handler and preserve this proof with the dispatch record."
  );
}
