import type { Phase11EvidenceRecordsSnapshot } from "./phase11EvidenceRecords";
import type { Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import type { Phase11OwnerReleaseBlockerPrioritySummary } from "./phase11OwnerReleaseBlockerPriority";
import type { Phase11OwnerReleaseTraceabilitySummary } from "./phase11OwnerReleaseTraceability";
import type { Phase11ProofFreshnessDepthSnapshot } from "./phase11ProofFreshnessDepth";
import type { Phase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";
import type { Phase126PublishExecutionGate } from "./phase126PublishExecutionGate";

export type Phase11ReleaseCloseoutStatusState =
  | "complete"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase11ReleaseCloseoutStatus {
  readonly id: string;
  readonly label: string;
  readonly state: Phase11ReleaseCloseoutStatusState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly implementationComplete: boolean;
  readonly canRecommendRelease: boolean;
  readonly packagingPaused: boolean;
  readonly ownerCommandReady: boolean;
  readonly proofFreshnessTrusted: boolean;
  readonly evidenceRecordsReady: boolean;
  readonly releaseReadinessReady: boolean;
  readonly publishExecutionGateState: Phase126PublishExecutionGate["state"] | "blocked";
  readonly publishExecutionHeld: boolean;
  readonly publishExecutionTopHold: string;
  readonly traceabilityTrusted: boolean;
  readonly blockerPriorityClear: boolean;
  readonly linkedPmTaskCount: number;
  readonly requiredPmTaskCount: number;
  readonly openBlockerCount: number;
  readonly releaseHoldCount: number;
  readonly topHold: string;
  readonly phase11ReleaseCloseoutStatusProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase11ReleaseCloseoutStatusInput {
  readonly ownerCommandCenter: Phase11OwnerCommandCenterSnapshot;
  readonly proofFreshnessDepth: Phase11ProofFreshnessDepthSnapshot;
  readonly evidenceRecords: Phase11EvidenceRecordsSnapshot;
  readonly releaseReadiness: Phase11ReleaseReadinessSnapshot;
  readonly traceability: Phase11OwnerReleaseTraceabilitySummary;
  readonly blockerPriority: Phase11OwnerReleaseBlockerPrioritySummary;
  readonly publishExecutionGate?: Pick<
    Phase126PublishExecutionGate,
    "state" | "noPushBoundaryActive" | "topHold" | "canPublish"
  >;
}

const STATUS_LABELS: Record<Phase11ReleaseCloseoutStatusState, string> = {
  complete: "Complete",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const REQUIRED_PM_TASK_COUNT = 12;
const SAFETY =
  "Phase 11 release closeout status is evidence-only. It summarizes Owner Testing, proof freshness, evidence records, release readiness, traceability, blocker-priority, PM-link, and packaging-hold proof without installing dependencies, running tests, building packages, pushing branches, signing artifacts, calling networks, or resuming release actions.";

function packagingPaused(releaseReadiness: Phase11ReleaseReadinessSnapshot): boolean {
  const packagingItem = releaseReadiness.items.find((item) => item.kind === "packaging-lock");

  return (
    !releaseReadiness.canRecommendRelease ||
    packagingItem?.status === "ready" ||
    releaseReadiness.nextAction.toLowerCase().includes("packag")
  );
}

function evidenceRecordsReady(evidenceRecords: Phase11EvidenceRecordsSnapshot): boolean {
  return (
    evidenceRecords.totalGateCount >= 5 &&
    evidenceRecords.openGateCount === 0 &&
    evidenceRecords.readyCount === evidenceRecords.totalGateCount &&
    evidenceRecords.staleCount === 0 &&
    evidenceRecords.missingCount === 0 &&
    evidenceRecords.malformedCount === 0
  );
}

function topHold(input: Phase11ReleaseCloseoutStatusInput): string {
  if (!input.ownerCommandCenter.canRelease) {
    return "owner-command";
  }
  if (!input.proofFreshnessDepth.canTrustOwnerProof) {
    return "proof-freshness";
  }
  if (!evidenceRecordsReady(input.evidenceRecords)) {
    return "evidence-records";
  }
  if (!input.releaseReadiness.canRecommendRelease) {
    return "release-readiness";
  }
  if (
    input.traceability.missingPmTaskIds.length > 0 ||
    input.traceability.linkedPmTaskCount < REQUIRED_PM_TASK_COUNT
  ) {
    return "pm-links";
  }
  if (!input.traceability.canTrustOwnerReleaseGate) {
    return "traceability";
  }
  if (input.blockerPriority.openBlockerCount > 0) {
    return "blocker-priority";
  }
  return "none";
}

function resolveState(
  input: Phase11ReleaseCloseoutStatusInput,
  hold: string
): Phase11ReleaseCloseoutStatusState {
  if (
    input.ownerCommandCenter.state === "blocked" ||
    input.proofFreshnessDepth.state === "blocked" ||
    input.evidenceRecords.state === "blocked" ||
    input.releaseReadiness.state === "blocked" ||
    input.traceability.state === "blocked" ||
    input.blockerPriority.state === "blocked"
  ) {
    return "blocked";
  }
  if (hold === "none") {
    return "complete";
  }
  if (
    input.ownerCommandCenter.state === "waiting" ||
    input.proofFreshnessDepth.state === "waiting" ||
    input.evidenceRecords.state === "waiting" ||
    input.releaseReadiness.state === "waiting" ||
    input.traceability.state === "waiting" ||
    input.blockerPriority.state === "waiting"
  ) {
    return "waiting";
  }
  return "review";
}

function readinessForState(state: Phase11ReleaseCloseoutStatusState): number {
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
  input: Phase11ReleaseCloseoutStatusInput,
  state: Phase11ReleaseCloseoutStatusState,
  hold: string
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 11 Owner Testing, proof freshness, evidence records, release readiness, traceability, or blocker-priority evidence before closeout can be trusted.";
  }
  if (state === "complete") {
    return "Phase 11 release closeout proof is ready; keep packaging paused and publish execution owner-held until the owner explicitly resumes release actions.";
  }
  if (hold === "owner-command") {
    return input.ownerCommandCenter.nextAction;
  }
  if (hold === "proof-freshness") {
    return input.proofFreshnessDepth.nextAction;
  }
  if (hold === "evidence-records") {
    return input.evidenceRecords.nextAction;
  }
  if (hold === "release-readiness") {
    return input.releaseReadiness.nextAction;
  }
  if (hold === "pm-links" || hold === "traceability") {
    return input.traceability.nextAction;
  }
  if (hold === "blocker-priority") {
    return input.blockerPriority.nextAction;
  }
  return "Keep Phase 11 release evidence attached while packaging remains paused.";
}

function proof(
  status: Omit<Phase11ReleaseCloseoutStatus, "ariaLabel" | "phase11ReleaseCloseoutStatusProof">
): string {
  return (
    `phase11ReleaseCloseoutStatusProof=state=${status.state} readiness=${status.readiness} ` +
    `implementationComplete=${status.implementationComplete ? "yes" : "no"} ` +
    `release=${status.canRecommendRelease ? "ready" : "held"} ` +
    `packaging=${status.packagingPaused ? "paused" : "review"} ` +
    `owner=${status.ownerCommandReady ? "ready" : "held"} ` +
    `proof=${status.proofFreshnessTrusted ? "ready" : "held"} ` +
    `evidence=${status.evidenceRecordsReady ? "ready" : "held"} ` +
    `readiness=${status.releaseReadinessReady ? "ready" : "held"} ` +
    `publishExecution=${status.publishExecutionHeld ? "held" : "ready"} ` +
    `noPush=${status.publishExecutionHeld ? "active" : "cleared"} ` +
    `traceability=${status.traceabilityTrusted ? "ready" : "held"} ` +
    `blockers=${status.blockerPriorityClear ? "clear" : "open"} ` +
    `pmLinks=${status.linkedPmTaskCount}/${status.requiredPmTaskCount} ` +
    `open=${status.openBlockerCount} holds=${status.releaseHoldCount} topHold=${status.topHold} ` +
    `publishTopHold=${status.publishExecutionTopHold}`
  );
}

function ariaLabel(status: Omit<Phase11ReleaseCloseoutStatus, "ariaLabel">): string {
  return (
    `${status.label}: ${status.statusLabel}; ${status.readiness}% ready; ` +
    `release ${status.canRecommendRelease ? "ready" : "held"}; ` +
    `packaging ${status.packagingPaused ? "paused" : "review"}; ` +
    `next action: ${status.nextAction}`
  );
}

export function buildPhase11ReleaseCloseoutStatus(
  input: Phase11ReleaseCloseoutStatusInput
): Phase11ReleaseCloseoutStatus {
  const hold = topHold(input);
  const state = resolveState(input, hold);
  const publishExecutionHeld =
    input.publishExecutionGate?.noPushBoundaryActive ?? true;
  const draft = {
    id: "phase-11-release-closeout-status",
    label: "Phase 11 release closeout status",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    implementationComplete: true,
    canRecommendRelease: input.releaseReadiness.canRecommendRelease,
    packagingPaused: packagingPaused(input.releaseReadiness),
    ownerCommandReady: input.ownerCommandCenter.canRelease,
    proofFreshnessTrusted: input.proofFreshnessDepth.canTrustOwnerProof,
    evidenceRecordsReady: evidenceRecordsReady(input.evidenceRecords),
    releaseReadinessReady: input.releaseReadiness.canRecommendRelease,
    publishExecutionGateState: input.publishExecutionGate?.state ?? "blocked",
    publishExecutionHeld,
    publishExecutionTopHold: input.publishExecutionGate?.topHold ?? "owner-held",
    traceabilityTrusted: input.traceability.canTrustOwnerReleaseGate,
    blockerPriorityClear: input.blockerPriority.openBlockerCount === 0,
    linkedPmTaskCount: input.traceability.linkedPmTaskCount,
    requiredPmTaskCount: REQUIRED_PM_TASK_COUNT,
    openBlockerCount: input.blockerPriority.openBlockerCount,
    releaseHoldCount: input.releaseReadiness.releaseHoldCount,
    topHold: hold,
    nextAction: nextAction(input, state, hold),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase11ReleaseCloseoutStatusProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
