import type { Phase9RunnerApprovalDepthSummary } from "./phase9RunnerApprovalDepth";
import type { Phase9RunnerApprovalSnapshot } from "./phase9RunnerApproval";
import type { Phase9RunnerBlockerPrioritySummary } from "./phase9RunnerBlockerPriority";
import type { Phase9RunnerCompletionGate } from "./phase9RunnerCompletionGate";
import type {
  Phase9DesktopProbeGate,
  Phase9RunnerTraceabilitySummary
} from "./phase9RunnerTraceability";

export type Phase9RunnerCloseoutStatusState =
  | "complete"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase9RunnerCloseoutStatus {
  readonly id: string;
  readonly label: string;
  readonly state: Phase9RunnerCloseoutStatusState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly implementationComplete: boolean;
  readonly fixedProbeReady: boolean;
  readonly runnerExpansionLocked: boolean;
  readonly approvalSurfaceReady: boolean;
  readonly approvalDepthReady: boolean;
  readonly traceabilityTrusted: boolean;
  readonly blockerPriorityClear: boolean;
  readonly requestGateReady: boolean;
  readonly completionGateReady: boolean;
  readonly linkedPmTaskCount: number;
  readonly requiredPmTaskCount: number;
  readonly openBlockerCount: number;
  readonly topHold: string;
  readonly phase9RunnerCloseoutStatusProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase9RunnerCloseoutStatusInput {
  readonly approval: Phase9RunnerApprovalSnapshot;
  readonly approvalDepth: Phase9RunnerApprovalDepthSummary;
  readonly traceability: Phase9RunnerTraceabilitySummary;
  readonly blockerPriority: Phase9RunnerBlockerPrioritySummary;
  readonly requestGate: Phase9DesktopProbeGate;
  readonly completionGate: Phase9RunnerCompletionGate;
}

const STATUS_LABELS: Record<Phase9RunnerCloseoutStatusState, string> = {
  complete: "Complete",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const REQUIRED_PM_TASK_COUNT = 11;
const SAFETY =
  "Phase 9 runner closeout status is evidence-only. It summarizes the fixed terminal-readonly-probe approval, approval-depth, traceability, blocker-priority, request-gate, and completion-gate proof without running the probe, mutating files, writing Git state, calling external services, or unlocking broader runner actions.";

function approvalSurfaceReady(approval: Phase9RunnerApprovalSnapshot): boolean {
  return (
    approval.items.length === 8 &&
    approval.runnerApprovalProof.includes("items=8/8") &&
    approval.runnerApprovalProof.includes("execution=locked")
  );
}

function approvalDepthReady(depth: Phase9RunnerApprovalDepthSummary): boolean {
  return (
    depth.records.length === 8 &&
    depth.mutationLockCount >= 6 &&
    depth.runnerApprovalDepthProof.includes("records=8/8") &&
    depth.runnerApprovalDepthProof.includes("mutationLocks=6/6") &&
    depth.runnerApprovalDepthProof.includes("execution=locked")
  );
}

function runnerExpansionLocked(input: Phase9RunnerCloseoutStatusInput): boolean {
  return (
    !input.completionGate.canExpandRunnerActions &&
    input.approval.runnerApprovalProof.includes("execution=locked") &&
    input.approvalDepth.runnerApprovalDepthProof.includes("execution=locked") &&
    input.traceability.runnerTraceabilityProof.includes("execution=locked") &&
    input.requestGate.phase9RequestGateProof.includes("execution=locked") &&
    input.completionGate.completionGateProof.includes("runnerExpansion=locked")
  );
}

function topHold(input: Phase9RunnerCloseoutStatusInput): string {
  if (!approvalSurfaceReady(input.approval)) {
    return "approval-surface";
  }
  if (!approvalDepthReady(input.approvalDepth)) {
    return "approval-depth";
  }
  if (
    input.traceability.missingPmTaskIds.length > 0 ||
    input.traceability.linkedPmTaskCount < REQUIRED_PM_TASK_COUNT
  ) {
    return "pm-links";
  }
  if (!runnerExpansionLocked(input)) {
    return "runner-expansion-lock";
  }
  if (!input.traceability.canTrustRunnerApproval) {
    return "traceability";
  }
  if (input.blockerPriority.openBlockerCount > 0) {
    return "blocker-priority";
  }
  if (!input.requestGate.canRun) {
    return "request-gate";
  }
  if (!input.completionGate.phaseComplete) {
    return "completion-gate";
  }
  return "none";
}

function resolveState(
  input: Phase9RunnerCloseoutStatusInput,
  hold: string
): Phase9RunnerCloseoutStatusState {
  if (
    input.approval.state === "blocked" ||
    input.traceability.state === "blocked" ||
    input.blockerPriority.state === "blocked" ||
    input.requestGate.state === "blocked" ||
    input.completionGate.state === "blocked"
  ) {
    return "blocked";
  }
  if (hold === "none") {
    return "complete";
  }
  if (
    input.approval.state === "waiting" ||
    input.traceability.state === "waiting" ||
    input.requestGate.state === "waiting" ||
    input.completionGate.state === "waiting"
  ) {
    return "waiting";
  }
  return "review";
}

function readinessForState(state: Phase9RunnerCloseoutStatusState): number {
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
  input: Phase9RunnerCloseoutStatusInput,
  state: Phase9RunnerCloseoutStatusState,
  hold: string
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 9 approval, traceability, blocker-priority, request-gate, or completion-gate evidence before closeout can be trusted.";
  }
  if (state === "complete") {
    return "Phase 9 closeout is ready for the fixed terminal-readonly-probe only; keep broader runner actions locked.";
  }
  if (hold === "approval-surface") {
    return input.approval.nextAction;
  }
  if (hold === "approval-depth") {
    return "Restore the complete Phase 9 approval-depth proof before closeout can be trusted.";
  }
  if (hold === "pm-links" || hold === "traceability") {
    return input.traceability.nextAction;
  }
  if (hold === "blocker-priority") {
    return input.blockerPriority.nextAction;
  }
  if (hold === "request-gate") {
    return input.requestGate.holdReason;
  }
  if (hold === "completion-gate") {
    return input.completionGate.nextAction;
  }
  return "Restore runner-expansion lock proof before trusting Phase 9 closeout.";
}

function proof(
  status: Omit<Phase9RunnerCloseoutStatus, "ariaLabel" | "phase9RunnerCloseoutStatusProof">
): string {
  return (
    `phase9RunnerCloseoutStatusProof=state=${status.state} readiness=${status.readiness} ` +
    `implementationComplete=${status.implementationComplete ? "yes" : "no"} ` +
    `fixedProbe=${status.fixedProbeReady ? "ready" : "held"} ` +
    `runnerExpansion=${status.runnerExpansionLocked ? "locked" : "review"} ` +
    `approval=${status.approvalSurfaceReady ? "ready" : "held"} ` +
    `approvalDepth=${status.approvalDepthReady ? "ready" : "held"} ` +
    `traceability=${status.traceabilityTrusted ? "ready" : "held"} ` +
    `blockers=${status.blockerPriorityClear ? "clear" : "open"} ` +
    `requestGate=${status.requestGateReady ? "ready" : "held"} ` +
    `completionGate=${status.completionGateReady ? "ready" : "held"} ` +
    `pmLinks=${status.linkedPmTaskCount}/${status.requiredPmTaskCount} ` +
    `open=${status.openBlockerCount} topHold=${status.topHold}`
  );
}

function ariaLabel(status: Omit<Phase9RunnerCloseoutStatus, "ariaLabel">): string {
  return (
    `${status.label}: ${status.statusLabel}; ${status.readiness}% ready; ` +
    `fixed probe ${status.fixedProbeReady ? "ready" : "held"}; ` +
    `runner expansion ${status.runnerExpansionLocked ? "locked" : "review"}; ` +
    `next action: ${status.nextAction}`
  );
}

export function buildPhase9RunnerCloseoutStatus(
  input: Phase9RunnerCloseoutStatusInput
): Phase9RunnerCloseoutStatus {
  const hold = topHold(input);
  const state = resolveState(input, hold);
  const draft = {
    id: "phase-9-runner-closeout-status",
    label: "Phase 9 runner closeout status",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    implementationComplete: true,
    fixedProbeReady: input.completionGate.canAdvanceFixedProbe,
    runnerExpansionLocked: runnerExpansionLocked(input),
    approvalSurfaceReady: approvalSurfaceReady(input.approval),
    approvalDepthReady: approvalDepthReady(input.approvalDepth),
    traceabilityTrusted: input.traceability.canTrustRunnerApproval,
    blockerPriorityClear: input.blockerPriority.openBlockerCount === 0,
    requestGateReady: input.requestGate.canRun,
    completionGateReady: input.completionGate.phaseComplete,
    linkedPmTaskCount: input.traceability.linkedPmTaskCount,
    requiredPmTaskCount: REQUIRED_PM_TASK_COUNT,
    openBlockerCount: input.blockerPriority.openBlockerCount,
    topHold: hold,
    nextAction: nextAction(input, state, hold),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase9RunnerCloseoutStatusProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
