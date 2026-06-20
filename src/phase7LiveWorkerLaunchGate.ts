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
  readonly preflightState: Phase7LiveWorkerLaunchPreflightState;
  readonly readyPreflightCount: number;
  readonly requiredPreflightCount: number;
  readonly artifactVerificationState: Phase7DispatchReviewArtifactState;
  readonly executionLocked: boolean;
  readonly openBlockerCount: number;
  readonly liveWorkerLockCount: number;
  readonly handoffPacketCount: number;
  readonly detail: string;
  readonly nextAction: string;
  readonly launchGateProof: string;
}

export type Phase7LiveWorkerLaunchPreflightState =
  | "ready"
  | "review"
  | "blocked"
  | "missing";

export interface Phase7LiveWorkerLaunchPreflightEvidence {
  readonly riskExceptionsReady?: boolean;
  readonly disabledPathsReady?: boolean;
  readonly permissionApprovalsReady?: boolean;
  readonly auditPersistenceReady?: boolean;
  readonly rollbackEvidenceReady?: boolean;
}

const STATUS_LABELS: Record<Phase7LiveWorkerLaunchGateState, string> = {
  locked: "Locked",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const REQUIRED_PREFLIGHT_COUNT = 5;

function preflightState(
  evidence: Phase7LiveWorkerLaunchPreflightEvidence | undefined
): Phase7LiveWorkerLaunchPreflightState {
  if (!evidence) {
    return "missing";
  }

  const values = [
    evidence.riskExceptionsReady,
    evidence.disabledPathsReady,
    evidence.permissionApprovalsReady,
    evidence.auditPersistenceReady,
    evidence.rollbackEvidenceReady
  ];

  if (values.some((value) => value === false)) {
    return "blocked";
  }

  if (values.every((value) => value === true)) {
    return "ready";
  }

  return "review";
}

function readyPreflightCount(
  evidence: Phase7LiveWorkerLaunchPreflightEvidence | undefined
): number {
  if (!evidence) {
    return 0;
  }

  return [
    evidence.riskExceptionsReady,
    evidence.disabledPathsReady,
    evidence.permissionApprovalsReady,
    evidence.auditPersistenceReady,
    evidence.rollbackEvidenceReady
  ].filter((value) => value === true).length;
}

function proof(gate: Omit<Phase7LiveWorkerLaunchGate, "launchGateProof">): string {
  return [
    "phase7LiveWorkerLaunchGate",
    `state=${gate.state}`,
    `artifactVerification=${gate.artifactVerificationState}`,
    `preflight=${gate.preflightState}`,
    `preflightReady=${gate.readyPreflightCount}/${gate.requiredPreflightCount}`,
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
  preflight: Phase7LiveWorkerLaunchPreflightEvidence | undefined,
  detail: string,
  nextAction: string
): Phase7LiveWorkerLaunchGate {
  const resolvedPreflightState = preflightState(preflight);
  const gate = {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: state === "locked" ? 95 : state === "review" ? 70 : state === "blocked" ? 15 : 35,
    canSpawnLiveWorker: false,
    approvalRequired: true,
    preflightState: resolvedPreflightState,
    readyPreflightCount: readyPreflightCount(preflight),
    requiredPreflightCount: REQUIRED_PREFLIGHT_COUNT,
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
  verification: Phase7DispatchReviewArtifactVerification,
  preflight?: Phase7LiveWorkerLaunchPreflightEvidence
): Phase7LiveWorkerLaunchGate {
  if (verification.state === "waiting") {
    return result(
      "waiting",
      verification,
      preflight,
      "Phase 7 live-worker spawning is waiting for a dispatch review artifact verification record.",
      "Export or attach a Phase 7 dispatch review artifact before any live worker launch request can be reviewed."
    );
  }

  if (!verification.executionLocked || verification.state === "blocked") {
    return result(
      "blocked",
      verification,
      preflight,
      "Phase 7 live-worker spawning is blocked because the dispatch artifact does not prove the execution lock.",
      "Restore the local metadata-only no-runtime execution boundary before reviewing live worker expansion."
    );
  }

  if (preflightState(preflight) === "blocked") {
    return result(
      "blocked",
      verification,
      preflight,
      "Phase 7 live-worker spawning is blocked because live-session preflight evidence contradicts a required safety prerequisite.",
      "Restore risk-exception, disabled-path, permission-approval, audit-persistence, and rollback evidence before live worker expansion is reviewed."
    );
  }

  if (verification.state !== "ready" || verification.openBlockerCount > 0) {
    return result(
      "review",
      verification,
      preflight,
      "Phase 7 live-worker spawning remains locked while dispatch artifact verification needs review.",
      verification.nextAction
    );
  }

  if (preflightState(preflight) !== "ready") {
    return result(
      "locked",
      verification,
      preflight,
      "Phase 7 dispatch artifact is verified, but live-worker spawning remains locked because live-session preflight evidence is incomplete.",
      "Attach risk exception, disabled-path, permission approval, audit persistence, and rollback evidence before live worker or session creation can be reviewed."
    );
  }

  return result(
    "locked",
    verification,
    preflight,
    "Phase 7 dispatch artifact and live-session preflight evidence are verified, but live-worker spawning remains locked until the owner approves a separate live-worker expansion.",
    "Keep dispatch work in local metadata review and use the verified artifact plus preflight proof only as handoff evidence."
  );
}
