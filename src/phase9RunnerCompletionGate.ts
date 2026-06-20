import type { Phase9DesktopProbeGate } from "./phase9RunnerTraceability";
import type { Phase9RunnerApprovalSnapshot } from "./phase9RunnerApproval";
import type { Phase9RunnerBlockerPrioritySummary } from "./phase9RunnerBlockerPriority";
import type { Phase9RunnerTraceabilitySummary } from "./phase9RunnerTraceability";

export type Phase9RunnerCompletionGateState =
  | "complete"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase9RunnerCompletionGate {
  readonly id: string;
  readonly label: string;
  readonly state: Phase9RunnerCompletionGateState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly phaseComplete: boolean;
  readonly canAdvanceFixedProbe: boolean;
  readonly canExpandRunnerActions: boolean;
  readonly approvalReady: boolean;
  readonly traceabilityTrusted: boolean;
  readonly blockerPriorityClear: boolean;
  readonly requestGateReady: boolean;
  readonly openBlockerCount: number;
  readonly phase8OpenExceptionCount: number;
  readonly mutationLockCount: number;
  readonly topHold: string;
  readonly completionGateProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase9RunnerCompletionGateInput {
  readonly approval: Phase9RunnerApprovalSnapshot;
  readonly traceability: Phase9RunnerTraceabilitySummary;
  readonly blockerPriority: Phase9RunnerBlockerPrioritySummary;
  readonly requestGate: Phase9DesktopProbeGate;
}

const STATUS_LABELS: Record<Phase9RunnerCompletionGateState, string> = {
  complete: "Complete",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SAFETY =
  "Phase 9 runner completion gate is evidence-only. It may allow only the fixed terminal-readonly-probe dependency and never expands broad terminal, Git, MCP, plugin, automation, runtime, profile, filesystem, or external-service runner actions.";

function resolveState(input: Phase9RunnerCompletionGateInput): Phase9RunnerCompletionGateState {
  if (
    input.approval.state === "blocked" ||
    input.traceability.state === "blocked" ||
    input.blockerPriority.state === "blocked" ||
    input.requestGate.state === "blocked"
  ) {
    return "blocked";
  }

  if (
    input.approval.state === "ready" &&
    input.traceability.canTrustRunnerApproval &&
    input.blockerPriority.openBlockerCount === 0 &&
    input.requestGate.canRun
  ) {
    return "complete";
  }

  if (
    input.approval.state === "review" ||
    input.traceability.state === "review" ||
    input.blockerPriority.state === "review" ||
    input.requestGate.state === "review"
  ) {
    return "review";
  }

  return "waiting";
}

function readinessForState(state: Phase9RunnerCompletionGateState): number {
  if (state === "complete") {
    return 100;
  }
  if (state === "review") {
    return 85;
  }
  if (state === "waiting") {
    return 60;
  }
  return 0;
}

function topHold(input: Phase9RunnerCompletionGateInput): string {
  if (!input.requestGate.canRun) {
    return "request-gate";
  }
  if (!input.traceability.canTrustRunnerApproval) {
    return "traceability";
  }
  if (input.blockerPriority.openBlockerCount > 0) {
    return "blocker-priority";
  }
  if (input.approval.state !== "ready") {
    return "approval";
  }
  return "none";
}

function nextAction(
  input: Phase9RunnerCompletionGateInput,
  state: Phase9RunnerCompletionGateState,
  hold: string
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 9 approval, traceability, blocker-priority, or request-gate evidence before the fixed probe can advance.";
  }
  if (state === "complete") {
    return "Phase 9 can advance only the fixed terminal-readonly-probe; keep all broader runner actions locked.";
  }
  if (hold === "request-gate") {
    return input.requestGate.holdReason;
  }
  if (hold === "traceability") {
    return input.traceability.nextAction;
  }
  if (hold === "blocker-priority") {
    return input.blockerPriority.nextAction;
  }
  return input.approval.nextAction;
}

function proof(
  gate: Omit<Phase9RunnerCompletionGate, "ariaLabel" | "completionGateProof">
): string {
  return (
    `phase9RunnerCompletionGateProof=state=${gate.state} readiness=${gate.readiness} ` +
    `phaseComplete=${gate.phaseComplete ? "yes" : "no"} ` +
    `fixedProbe=${gate.canAdvanceFixedProbe ? "ready" : "held"} ` +
    `runnerExpansion=${gate.canExpandRunnerActions ? "ready" : "locked"} ` +
    `approval=${gate.approvalReady ? "ready" : "held"} ` +
    `traceability=${gate.traceabilityTrusted ? "ready" : "held"} ` +
    `blockers=${gate.blockerPriorityClear ? "clear" : "open"} ` +
    `requestGate=${gate.requestGateReady ? "ready" : "held"} ` +
    `open=${gate.openBlockerCount} phase8Exceptions=${gate.phase8OpenExceptionCount} ` +
    `mutationLocks=${gate.mutationLockCount}/6 topHold=${gate.topHold}`
  );
}

function ariaLabel(gate: Omit<Phase9RunnerCompletionGate, "ariaLabel">): string {
  return (
    `${gate.label}: ${gate.statusLabel}; ${gate.readiness}% ready; ` +
    `fixed probe ${gate.canAdvanceFixedProbe ? "ready" : "held"}; ` +
    `runner expansion ${gate.canExpandRunnerActions ? "ready" : "locked"}; ` +
    `next action: ${gate.nextAction}`
  );
}

export function buildPhase9RunnerCompletionGate(
  input: Phase9RunnerCompletionGateInput
): Phase9RunnerCompletionGate {
  const state = resolveState(input);
  const hold = topHold(input);
  const phaseComplete = state === "complete";
  const draft = {
    id: "phase-9-runner-completion-gate",
    label: "Phase 9 runner completion gate",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    phaseComplete,
    canAdvanceFixedProbe: input.requestGate.canRun && phaseComplete,
    canExpandRunnerActions: false,
    approvalReady: input.approval.state === "ready",
    traceabilityTrusted: input.traceability.canTrustRunnerApproval,
    blockerPriorityClear: input.blockerPriority.openBlockerCount === 0,
    requestGateReady: input.requestGate.canRun,
    openBlockerCount: input.blockerPriority.openBlockerCount,
    phase8OpenExceptionCount: input.traceability.phase8OpenExceptionCount,
    mutationLockCount: input.traceability.mutationLockCount,
    topHold: hold,
    nextAction: nextAction(input, state, hold),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    completionGateProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
