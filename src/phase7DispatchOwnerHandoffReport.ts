import type { DispatchReviewRecord } from "./dispatchReviewRecord";
import type { Phase7DispatchCloseoutProof } from "./phase7DispatchCloseoutProof";

export type Phase7DispatchOwnerHandoffReportState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase7DispatchOwnerHandoffReport {
  readonly state: Phase7DispatchOwnerHandoffReportState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly finalValidationOwner: string;
  readonly commitPushReportingOwner: string;
  readonly pushApprovalRequired: boolean;
  readonly canCloseDispatchReview: boolean;
  readonly canSpawnLiveWorker: boolean;
  readonly handoffPacketCount: number;
  readonly validationGateCount: number;
  readonly traceabilityLinkCount: number;
  readonly closeoutState: Phase7DispatchCloseoutProof["state"];
  readonly detail: string;
  readonly nextAction: string;
  readonly ownerHandoffProof: string;
}

const STATUS_LABELS: Record<Phase7DispatchOwnerHandoffReportState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function hasMainOwner(value: string): boolean {
  return value.trim() === "Main Codex";
}

function proof(report: Omit<Phase7DispatchOwnerHandoffReport, "ownerHandoffProof">): string {
  return [
    "phase7DispatchOwnerHandoffReport",
    `state=${report.state}`,
    `closeout=${report.closeoutState}`,
    `finalValidationOwner=${report.finalValidationOwner}`,
    `commitPushReportingOwner=${report.commitPushReportingOwner}`,
    `pushApproval=${report.pushApprovalRequired ? "required" : "recorded"}`,
    `canClose=${report.canCloseDispatchReview ? "yes" : "no"}`,
    `canSpawn=${report.canSpawnLiveWorker ? "yes" : "no"}`,
    `packets=${report.handoffPacketCount}/4`,
    `validationGates=${report.validationGateCount}`,
    `traceabilityLinks=${report.traceabilityLinkCount}/5`
  ].join(" ");
}

function result(
  state: Phase7DispatchOwnerHandoffReportState,
  record: DispatchReviewRecord,
  closeout: Phase7DispatchCloseoutProof,
  detail: string,
  nextAction: string
): Phase7DispatchOwnerHandoffReport {
  const report = {
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: state === "ready" ? 100 : state === "review" ? 80 : state === "waiting" ? 35 : 15,
    finalValidationOwner: record.finalValidationOwner,
    commitPushReportingOwner: record.commitPushReportingOwner,
    pushApprovalRequired: true,
    canCloseDispatchReview: state === "ready" && closeout.canCloseDispatchReview,
    canSpawnLiveWorker: false,
    handoffPacketCount: record.handoffPackets.length,
    validationGateCount: record.validationGateCount,
    traceabilityLinkCount: record.traceabilityLinkCount,
    closeoutState: closeout.state,
    detail,
    nextAction
  };

  return {
    ...report,
    ownerHandoffProof: proof(report)
  };
}

export function buildPhase7DispatchOwnerHandoffReport(input: {
  readonly record: DispatchReviewRecord;
  readonly closeout: Phase7DispatchCloseoutProof;
}): Phase7DispatchOwnerHandoffReport {
  const { record, closeout } = input;

  if (closeout.state === "waiting") {
    return result(
      "waiting",
      record,
      closeout,
      "Phase 7 owner handoff is waiting for dispatch closeout proof.",
      "Attach aggregate closeout proof before owner handoff can be reviewed."
    );
  }

  if (closeout.state === "blocked" || closeout.canSpawnLiveWorker) {
    return result(
      "blocked",
      record,
      closeout,
      "Phase 7 owner handoff is blocked because closeout proof failed or live-worker spawning is not locked.",
      "Restore locked closeout proof before assigning final validation, push approval, and reporting handoff."
    );
  }

  if (
    closeout.state !== "ready" ||
    !closeout.canCloseDispatchReview ||
    !hasMainOwner(record.finalValidationOwner) ||
    !hasMainOwner(record.commitPushReportingOwner) ||
    record.handoffPackets.length < 4 ||
    record.validationGateCount <= 0 ||
    record.traceabilityLinkCount < 5
  ) {
    return result(
      "review",
      record,
      closeout,
      "Phase 7 owner handoff remains in review until closeout, owners, packets, validation, and traceability are ready.",
      closeout.nextAction
    );
  }

  return result(
    "ready",
    record,
    closeout,
    "Phase 7 owner handoff is ready for final validation, push approval, and reporting review while live-worker spawning stays locked.",
    "Use the owner handoff report for final review; push remains held until the owner explicitly approves."
  );
}
