import type { Phase7DispatchOwnerHandoffReport } from "./phase7DispatchOwnerHandoffReport";

export type Phase7DispatchCompletionGateState = "complete" | "review" | "blocked" | "waiting";

export interface Phase7DispatchCompletionGate {
  readonly state: Phase7DispatchCompletionGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly phaseComplete: boolean;
  readonly canSpawnLiveWorker: boolean;
  readonly ownerHandoffState: Phase7DispatchOwnerHandoffReport["state"];
  readonly pushApprovalRequired: boolean;
  readonly finalValidationOwner: string;
  readonly commitPushReportingOwner: string;
  readonly handoffPacketCount: number;
  readonly validationGateCount: number;
  readonly traceabilityLinkCount: number;
  readonly detail: string;
  readonly nextAction: string;
  readonly completionGateProof: string;
}

const STATUS_LABELS: Record<Phase7DispatchCompletionGateState, string> = {
  complete: "Complete",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function proof(gate: Omit<Phase7DispatchCompletionGate, "completionGateProof">): string {
  return [
    "phase7DispatchCompletionGate",
    `state=${gate.state}`,
    `phaseComplete=${gate.phaseComplete ? "yes" : "no"}`,
    `ownerHandoff=${gate.ownerHandoffState}`,
    `pushApproval=${gate.pushApprovalRequired ? "required" : "recorded"}`,
    `canSpawn=${gate.canSpawnLiveWorker ? "yes" : "no"}`,
    `finalValidationOwner=${gate.finalValidationOwner}`,
    `commitPushReportingOwner=${gate.commitPushReportingOwner}`,
    `packets=${gate.handoffPacketCount}/4`,
    `validationGates=${gate.validationGateCount}`,
    `traceabilityLinks=${gate.traceabilityLinkCount}/5`
  ].join(" ");
}

function result(
  state: Phase7DispatchCompletionGateState,
  report: Phase7DispatchOwnerHandoffReport,
  detail: string,
  nextAction: string
): Phase7DispatchCompletionGate {
  const gate = {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: state === "complete" ? 100 : state === "review" ? 85 : state === "waiting" ? 35 : 15,
    phaseComplete: state === "complete",
    canSpawnLiveWorker: false,
    ownerHandoffState: report.state,
    pushApprovalRequired: report.pushApprovalRequired,
    finalValidationOwner: report.finalValidationOwner,
    commitPushReportingOwner: report.commitPushReportingOwner,
    handoffPacketCount: report.handoffPacketCount,
    validationGateCount: report.validationGateCount,
    traceabilityLinkCount: report.traceabilityLinkCount,
    detail,
    nextAction
  };

  return {
    ...gate,
    completionGateProof: proof(gate)
  };
}

export function buildPhase7DispatchCompletionGate(
  report: Phase7DispatchOwnerHandoffReport
): Phase7DispatchCompletionGate {
  if (report.state === "waiting") {
    return result(
      "waiting",
      report,
      "Phase 7 dispatch completion is waiting for owner handoff report proof.",
      "Attach the owner handoff report before Phase 7 can leave active implementation."
    );
  }

  if (report.state === "blocked" || report.canSpawnLiveWorker) {
    return result(
      "blocked",
      report,
      "Phase 7 dispatch completion is blocked because owner handoff failed or live-worker spawning is not locked.",
      "Restore owner handoff proof and no-spawn state before Phase 7 can close."
    );
  }

  if (
    report.state !== "ready" ||
    !report.canCloseDispatchReview ||
    report.handoffPacketCount < 4 ||
    report.validationGateCount <= 0 ||
    report.traceabilityLinkCount < 5
  ) {
    return result(
      "review",
      report,
      "Phase 7 dispatch completion remains in review until owner handoff, packets, validation, and traceability are ready.",
      report.nextAction
    );
  }

  return result(
    "complete",
    report,
    "Phase 7 dispatch loop is complete as a local metadata handoff; live-worker spawning remains locked behind separate owner approval.",
    "Move active implementation to the next pending lane while preserving Phase 7 completion proof for owner review."
  );
}
