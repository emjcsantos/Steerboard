import type { Phase11EvidenceRecordsSnapshot } from "./phase11EvidenceRecords";
import type { Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import type { Phase11OwnerReleaseBlockerPrioritySummary } from "./phase11OwnerReleaseBlockerPriority";
import type { Phase11OwnerReleaseTraceabilitySummary } from "./phase11OwnerReleaseTraceability";
import type { Phase11ProofFreshnessDepthSnapshot } from "./phase11ProofFreshnessDepth";
import type { Phase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";
import type { Phase126PublishExecutionGate } from "./phase126PublishExecutionGate";

export type Phase11OwnerCommandCloseoutStatusState =
  | "complete"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase11OwnerCommandCloseoutStatus {
  readonly id: string;
  readonly label: string;
  readonly state: Phase11OwnerCommandCloseoutStatusState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly implementationComplete: boolean;
  readonly ownerCommandReady: boolean;
  readonly proofFreshnessTrusted: boolean;
  readonly evidenceRecordsReady: boolean;
  readonly traceabilityTrusted: boolean;
  readonly blockerPriorityClear: boolean;
  readonly releaseHeld: boolean;
  readonly packagingPaused: boolean;
  readonly publishExecutionGateState: Phase126PublishExecutionGate["state"] | "blocked";
  readonly publishExecutionHeld: boolean;
  readonly publishExecutionTopHold: string;
  readonly linkedPmTaskCount: number;
  readonly requiredPmTaskCount: number;
  readonly openBlockerCount: number;
  readonly ownerReviewAddressableCount: number;
  readonly topHold: string;
  readonly phase11OwnerCommandCloseoutStatusProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase11OwnerCommandCloseoutStatusInput {
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

const STATUS_LABELS: Record<Phase11OwnerCommandCloseoutStatusState, string> = {
  complete: "Complete",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const REQUIRED_PM_TASK_COUNT = 12;
const SAFETY =
  "Phase 11 owner command closeout status is evidence-only. It summarizes Owner Testing, proof freshness, evidence records, owner release traceability, blocker-priority, PM-link, release-hold, and packaging-paused proof without installing dependencies, running tests, building packages, pushing branches, calling networks, or resuming release actions.";

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

function packagingPaused(releaseReadiness: Phase11ReleaseReadinessSnapshot): boolean {
  const packagingItem = releaseReadiness.items.find((item) => item.kind === "packaging-lock");

  return (
    !releaseReadiness.canRecommendRelease ||
    packagingItem?.status === "ready" ||
    releaseReadiness.nextAction.toLowerCase().includes("packag")
  );
}

function topHold(input: Phase11OwnerCommandCloseoutStatusInput): string {
  if (!input.ownerCommandCenter.canRelease) {
    return "owner-command";
  }
  if (!input.proofFreshnessDepth.canTrustOwnerProof) {
    return "proof-freshness";
  }
  if (!evidenceRecordsReady(input.evidenceRecords)) {
    return "evidence-records";
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
  input: Phase11OwnerCommandCloseoutStatusInput,
  hold: string
): Phase11OwnerCommandCloseoutStatusState {
  if (
    input.ownerCommandCenter.state === "blocked" ||
    input.proofFreshnessDepth.state === "blocked" ||
    input.evidenceRecords.state === "blocked" ||
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
    input.traceability.state === "waiting" ||
    input.blockerPriority.state === "waiting"
  ) {
    return "waiting";
  }
  return "review";
}

function readinessForState(state: Phase11OwnerCommandCloseoutStatusState): number {
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
  input: Phase11OwnerCommandCloseoutStatusInput,
  state: Phase11OwnerCommandCloseoutStatusState,
  hold: string
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 11 Owner Testing, proof freshness, evidence records, traceability, or blocker-priority evidence before owner-command closeout can be trusted.";
  }
  if (state === "complete") {
    return "Phase 11 owner command closeout proof is ready; keep release, packaging, and publish execution actions paused until the owner explicitly resumes them.";
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
  if (hold === "pm-links" || hold === "traceability") {
    return input.traceability.nextAction;
  }
  if (hold === "blocker-priority") {
    return input.blockerPriority.nextAction;
  }
  return "Keep Phase 11 Owner Testing proof attached while release and packaging remain paused.";
}

function proof(
  status: Omit<
    Phase11OwnerCommandCloseoutStatus,
    "ariaLabel" | "phase11OwnerCommandCloseoutStatusProof"
  >
): string {
  return (
    `phase11OwnerCommandCloseoutStatusProof=state=${status.state} readiness=${status.readiness} ` +
    `implementationComplete=${status.implementationComplete ? "yes" : "no"} ` +
    `owner=${status.ownerCommandReady ? "ready" : "held"} ` +
    `proof=${status.proofFreshnessTrusted ? "ready" : "held"} ` +
    `evidence=${status.evidenceRecordsReady ? "ready" : "held"} ` +
    `traceability=${status.traceabilityTrusted ? "ready" : "held"} ` +
    `blockers=${status.blockerPriorityClear ? "clear" : "open"} ` +
    `release=${status.releaseHeld ? "held" : "ready"} ` +
    `packaging=${status.packagingPaused ? "paused" : "review"} ` +
    `publishExecution=${status.publishExecutionHeld ? "held" : "ready"} ` +
    `noPush=${status.publishExecutionHeld ? "active" : "cleared"} ` +
    `pmLinks=${status.linkedPmTaskCount}/${status.requiredPmTaskCount} ` +
    `open=${status.openBlockerCount} review=${status.ownerReviewAddressableCount} topHold=${status.topHold} ` +
    `publishTopHold=${status.publishExecutionTopHold}`
  );
}

function ariaLabel(status: Omit<Phase11OwnerCommandCloseoutStatus, "ariaLabel">): string {
  return (
    `${status.label}: ${status.statusLabel}; ${status.readiness}% ready; ` +
    `owner command ${status.ownerCommandReady ? "ready" : "held"}; ` +
    `release ${status.releaseHeld ? "held" : "ready"}; ` +
    `packaging ${status.packagingPaused ? "paused" : "review"}; ` +
    `next action: ${status.nextAction}`
  );
}

export function buildPhase11OwnerCommandCloseoutStatus(
  input: Phase11OwnerCommandCloseoutStatusInput
): Phase11OwnerCommandCloseoutStatus {
  const hold = topHold(input);
  const state = resolveState(input, hold);
  const publishExecutionHeld =
    input.publishExecutionGate?.noPushBoundaryActive ?? true;
  const draft = {
    id: "phase-11-owner-command-closeout-status",
    label: "Phase 11 owner command closeout status",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    implementationComplete: true,
    ownerCommandReady: input.ownerCommandCenter.canRelease,
    proofFreshnessTrusted: input.proofFreshnessDepth.canTrustOwnerProof,
    evidenceRecordsReady: evidenceRecordsReady(input.evidenceRecords),
    traceabilityTrusted: input.traceability.canTrustOwnerReleaseGate,
    blockerPriorityClear: input.blockerPriority.openBlockerCount === 0,
    releaseHeld: !input.releaseReadiness.canRecommendRelease,
    packagingPaused: packagingPaused(input.releaseReadiness),
    publishExecutionGateState: input.publishExecutionGate?.state ?? "blocked",
    publishExecutionHeld,
    publishExecutionTopHold: input.publishExecutionGate?.topHold ?? "owner-held",
    linkedPmTaskCount: input.traceability.linkedPmTaskCount,
    requiredPmTaskCount: REQUIRED_PM_TASK_COUNT,
    openBlockerCount: input.blockerPriority.openBlockerCount,
    ownerReviewAddressableCount: input.blockerPriority.ownerReviewAddressableCount,
    topHold: hold,
    nextAction: nextAction(input, state, hold),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase11OwnerCommandCloseoutStatusProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
