import type { Phase11EvidenceRecordsSnapshot } from "./phase11EvidenceRecords";
import type { Phase11ReleaseCloseoutStatus } from "./phase11ReleaseCloseoutStatus";

export type Phase11ExternalDeliveryGateState = "ready" | "review" | "blocked" | "waiting";

export interface Phase11ExternalDeliveryApprovalEvidence {
  readonly ownerDeliveryApproved?: boolean;
}

export interface Phase11ExternalDeliveryGate {
  readonly id: string;
  readonly label: string;
  readonly state: Phase11ExternalDeliveryGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canDeliverExternally: boolean;
  readonly releaseCloseoutReady: boolean;
  readonly signedAuditReady: boolean;
  readonly rollbackReferenceReady: boolean;
  readonly releaseDecisionReady: boolean;
  readonly ownerDeliveryApproved: boolean;
  readonly deliveryLocked: boolean;
  readonly signingLocked: boolean;
  readonly packageUploadLocked: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly phase11ExternalDeliveryGateProof: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

const GATE_ID = "phase-11-external-delivery-gate";
const GATE_LABEL = "Phase 11 external delivery gate";
const SAFETY =
  "Phase 11 external delivery gate is evidence-only. It summarizes release closeout, signed audit, rollback reference, release decision, and owner delivery approval without signing artifacts, building installers, uploading packages, pushing Git state, calling external services, or resuming release actions.";

const STATUS_LABELS: Record<Phase11ExternalDeliveryGateState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function evidenceReady(
  evidenceRecords: Phase11EvidenceRecordsSnapshot,
  gate: "signed-audit-export" | "release-decision"
): boolean {
  const record = evidenceRecords.records[gate];

  return record?.state === "ready" && record.freshness === "fresh";
}

function rollbackReferenceReady(evidenceRecords: Phase11EvidenceRecordsSnapshot): boolean {
  const record = evidenceRecords.records["signed-audit-export"];

  return (
    record?.state === "ready" &&
    record.freshness === "fresh" &&
    (
      record.detail.toLowerCase().includes("rollback") ||
      record.nextAction.toLowerCase().includes("rollback")
    )
  );
}

function releaseCloseoutReady(closeout: Phase11ReleaseCloseoutStatus): boolean {
  return (
    closeout.state === "complete" &&
    closeout.implementationComplete &&
    closeout.canRecommendRelease &&
    closeout.packagingPaused &&
    closeout.phase11ReleaseCloseoutStatusProof.includes("release=ready") &&
    closeout.phase11ReleaseCloseoutStatusProof.includes("packaging=paused")
  );
}

function resolveState(input: {
  readonly closeout: Phase11ReleaseCloseoutStatus;
  readonly releaseCloseoutReady: boolean;
  readonly signedAuditReady: boolean;
  readonly rollbackReferenceReady: boolean;
  readonly releaseDecisionReady: boolean;
  readonly ownerDeliveryApproved: boolean;
}): Phase11ExternalDeliveryGateState {
  if (input.closeout.state === "blocked") {
    return "blocked";
  }
  if (
    !input.releaseCloseoutReady ||
    !input.signedAuditReady ||
    !input.rollbackReferenceReady ||
    !input.releaseDecisionReady
  ) {
    return input.closeout.state === "waiting" ? "waiting" : "review";
  }
  return input.ownerDeliveryApproved ? "ready" : "review";
}

function readinessForState(state: Phase11ExternalDeliveryGateState): number {
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
  readonly state: Phase11ExternalDeliveryGateState;
  readonly releaseCloseoutReady: boolean;
  readonly signedAuditReady: boolean;
  readonly rollbackReferenceReady: boolean;
  readonly releaseDecisionReady: boolean;
  readonly ownerDeliveryApproved: boolean;
}): string {
  if (input.state === "blocked") {
    return "External delivery is blocked by Phase 11 release closeout evidence.";
  }
  if (!input.releaseCloseoutReady) {
    return "External delivery is held until Phase 11 release closeout recommends release while packaging remains paused.";
  }
  if (!input.signedAuditReady || !input.rollbackReferenceReady || !input.releaseDecisionReady) {
    return "External delivery is held until signed audit, rollback reference, and release decision evidence are fresh and ready.";
  }
  if (!input.ownerDeliveryApproved) {
    return "External delivery evidence is ready, but package delivery remains locked until explicit owner approval.";
  }
  return "External delivery prerequisites and explicit owner delivery approval are ready.";
}

function nextAction(
  closeout: Phase11ReleaseCloseoutStatus,
  releaseCloseoutIsReady: boolean,
  ownerDeliveryApproved: boolean
): string {
  if (!releaseCloseoutIsReady) {
    return closeout.nextAction;
  }
  if (!ownerDeliveryApproved) {
    return "Record explicit owner delivery approval before signing, installer, package upload, Git push, or external delivery can proceed.";
  }
  return "Proceed only through an owner-approved delivery workflow; keep signing, upload, and Git actions separately gated.";
}

function proof(input: {
  readonly state: Phase11ExternalDeliveryGateState;
  readonly canDeliverExternally: boolean;
  readonly releaseCloseoutReady: boolean;
  readonly signedAuditReady: boolean;
  readonly rollbackReferenceReady: boolean;
  readonly releaseDecisionReady: boolean;
  readonly ownerDeliveryApproved: boolean;
  readonly deliveryLocked: boolean;
  readonly signingLocked: boolean;
  readonly packageUploadLocked: boolean;
}): string {
  return (
    `phase11ExternalDeliveryGateProof=state=${input.state} ` +
    `canDeliver=${input.canDeliverExternally ? "yes" : "no"} ` +
    `closeout=${input.releaseCloseoutReady ? "ready" : "held"} ` +
    `signedAudit=${input.signedAuditReady ? "ready" : "held"} ` +
    `rollback=${input.rollbackReferenceReady ? "ready" : "held"} ` +
    `releaseDecision=${input.releaseDecisionReady ? "ready" : "held"} ` +
    `ownerDelivery=${input.ownerDeliveryApproved ? "approved" : "missing"} ` +
    `delivery=${input.deliveryLocked ? "locked" : "review"} ` +
    `signing=${input.signingLocked ? "locked" : "review"} ` +
    `upload=${input.packageUploadLocked ? "locked" : "review"} safety=metadata-only`
  );
}

function ariaLabel(gate: Omit<Phase11ExternalDeliveryGate, "ariaLabel">): string {
  return (
    `${gate.label}: ${gate.statusLabel}; ${gate.readiness}% ready; ` +
    `external delivery ${gate.canDeliverExternally ? "ready" : "held"}; ` +
    `signing ${gate.signingLocked ? "locked" : "review"}; ` +
    `upload ${gate.packageUploadLocked ? "locked" : "review"}; ` +
    `next action: ${gate.nextAction}`
  );
}

export function buildPhase11ExternalDeliveryGate(
  closeout: Phase11ReleaseCloseoutStatus,
  evidenceRecords: Phase11EvidenceRecordsSnapshot,
  approvals: Phase11ExternalDeliveryApprovalEvidence = {}
): Phase11ExternalDeliveryGate {
  const isReleaseCloseoutReady = releaseCloseoutReady(closeout);
  const signedAuditIsReady = evidenceReady(evidenceRecords, "signed-audit-export");
  const rollbackIsReady = rollbackReferenceReady(evidenceRecords);
  const releaseDecisionIsReady = evidenceReady(evidenceRecords, "release-decision");
  const ownerDeliveryApproved = approvals.ownerDeliveryApproved === true;
  const state = resolveState({
    closeout,
    releaseCloseoutReady: isReleaseCloseoutReady,
    signedAuditReady: signedAuditIsReady,
    rollbackReferenceReady: rollbackIsReady,
    releaseDecisionReady: releaseDecisionIsReady,
    ownerDeliveryApproved
  });
  const canDeliverExternally =
    isReleaseCloseoutReady &&
    signedAuditIsReady &&
    rollbackIsReady &&
    releaseDecisionIsReady &&
    ownerDeliveryApproved;
  const draft = {
    id: GATE_ID,
    label: GATE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    canDeliverExternally,
    releaseCloseoutReady: isReleaseCloseoutReady,
    signedAuditReady: signedAuditIsReady,
    rollbackReferenceReady: rollbackIsReady,
    releaseDecisionReady: releaseDecisionIsReady,
    ownerDeliveryApproved,
    deliveryLocked: true,
    signingLocked: true,
    packageUploadLocked: true,
    detail: detail({
      state,
      releaseCloseoutReady: isReleaseCloseoutReady,
      signedAuditReady: signedAuditIsReady,
      rollbackReferenceReady: rollbackIsReady,
      releaseDecisionReady: releaseDecisionIsReady,
      ownerDeliveryApproved
    }),
    nextAction: nextAction(closeout, isReleaseCloseoutReady, ownerDeliveryApproved),
    safety: SAFETY
  };
  const gate = {
    ...draft,
    phase11ExternalDeliveryGateProof: proof(draft)
  };

  return {
    ...gate,
    ariaLabel: ariaLabel(gate)
  };
}
