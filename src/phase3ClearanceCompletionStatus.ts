import type { Phase3ClearanceBlockerPrioritySnapshot } from "./phase3ClearanceBlockerPriority";
import type { Phase3ClearanceCommandPlan } from "./phase3ClearanceCommandPlan";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3ClearanceTraceabilitySnapshot } from "./phase3ClearanceTraceability";
import type { Phase3CommandValidationRecordValidation } from "./phase3CommandValidationRecord";
import type { Phase3ExitGateEvidence } from "./phase3ExitGateEvidence";
import type { Phase3HandoffGate } from "./phase3HandoffGate";
import type { Phase3ProofExportVerification } from "./phase3ProofExport";
import type { Phase3SmokeProofReadinessResult } from "./phase3SmokeProofReadiness";
import type { Phase126PublishExecutionGate } from "./phase126PublishExecutionGate";

export type Phase3ClearanceCompletionStatusState =
  | "ready"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase3ClearanceCompletionStatus {
  readonly id: string;
  readonly label: string;
  readonly state: Phase3ClearanceCompletionStatusState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly phaseComplete: boolean;
  readonly canAdvancePhase4Review: boolean;
  readonly smokeRowsReady: boolean;
  readonly exitGateReady: boolean;
  readonly commandPlanReady: boolean;
  readonly cliValidationReady: boolean;
  readonly blockerPriorityClear: boolean;
  readonly traceabilityTrusted: boolean;
  readonly proofExportReady: boolean;
  readonly handoffReady: boolean;
  readonly publishExecutionGateState: Phase126PublishExecutionGate["state"] | "blocked";
  readonly publishExecutionHeld: boolean;
  readonly publishExecutionTopHold: string;
  readonly linkedPmTaskCount: number;
  readonly requiredPmTaskCount: number;
  readonly storageAttestedDesktopProofCount: number;
  readonly openBlockerCount: number;
  readonly topHold: string;
  readonly phase3ClearanceCompletionStatusProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase3ClearanceCompletionStatusInput {
  readonly smokeReadiness: Phase3SmokeProofReadinessResult;
  readonly exitGate: Phase3ExitGateEvidence;
  readonly clearancePackage: Phase3ClearancePackage;
  readonly commandPlan: Phase3ClearanceCommandPlan;
  readonly commandValidation: Phase3CommandValidationRecordValidation;
  readonly blockerPriority: Phase3ClearanceBlockerPrioritySnapshot;
  readonly traceability: Phase3ClearanceTraceabilitySnapshot;
  readonly proofExport: Phase3ProofExportVerification;
  readonly handoffGate: Phase3HandoffGate;
  readonly publishExecutionGate?: Pick<
    Phase126PublishExecutionGate,
    "state" | "noPushBoundaryActive" | "topHold" | "canPublish"
  >;
}

const STATUS_LABELS: Record<Phase3ClearanceCompletionStatusState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const SAFETY =
  "Phase 3 clearance completion status is evidence-only. It summarizes existing proof rows without running commands, mutating runtime state, recording handoff, launching providers, pushing branches, or unlocking Phase 4 review automatically.";

function hasState(
  input: Phase3ClearanceCompletionStatusInput,
  state: Phase3ClearanceCompletionStatusState
): boolean {
  return [
    input.smokeReadiness.state,
    input.exitGate.state,
    input.clearancePackage.state,
    input.commandPlan.state,
    input.commandValidation.state,
    input.blockerPriority.state,
    input.traceability.state,
    input.proofExport.state,
    input.handoffGate.state
  ].includes(state);
}

function topHold(input: Phase3ClearanceCompletionStatusInput): string {
  if (input.smokeReadiness.storageAttestedCount < 3 || input.smokeReadiness.state !== "ready") {
    return "smoke-rows";
  }
  if (!input.exitGate.pass || !input.clearancePackage.canExit) {
    return "exit-gate";
  }
  if (input.commandPlan.state !== "ready") {
    return "command-plan";
  }
  if (input.commandValidation.state !== "ready" || !input.commandValidation.isFresh) {
    return "cli-validation";
  }
  if (input.blockerPriority.openBlockerCount > 0) {
    return "blocker-priority";
  }
  if (!input.traceability.canTrustTrace) {
    return "traceability";
  }
  if (input.proofExport.state !== "ready" || !input.proofExport.canVerifyOffline) {
    return "proof-export";
  }
  if (!input.handoffGate.canAdvanceProviderIntegration) {
    return "handoff-gate";
  }
  return "none";
}

function resolveState(
  input: Phase3ClearanceCompletionStatusInput,
  hold: string
): Phase3ClearanceCompletionStatusState {
  if (hasState(input, "blocked")) {
    return "blocked";
  }
  if (hold === "none") {
    return "ready";
  }
  if (hasState(input, "review")) {
    return "review";
  }
  return "waiting";
}

function readinessForState(state: Phase3ClearanceCompletionStatusState): number {
  if (state === "ready") {
    return 100;
  }
  if (state === "review") {
    return 90;
  }
  if (state === "waiting") {
    return 75;
  }
  return 0;
}

function nextAction(
  input: Phase3ClearanceCompletionStatusInput,
  state: Phase3ClearanceCompletionStatusState,
  hold: string
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 3 smoke, exit, command, traceability, proof-export, or handoff evidence before completion can be trusted.";
  }
  if (state === "ready") {
    return "Phase 3 clearance completion proof is ready for Phase 4 provider review dependency; keep live execution and pushing owner-held through the publish execution gate.";
  }
  if (hold === "smoke-rows") {
    return "Refresh storage-attested Phase 3 desktop smoke proof rows before completion is trusted.";
  }
  if (hold === "exit-gate") {
    return input.clearancePackage.nextAction;
  }
  if (hold === "command-plan") {
    return input.commandPlan.nextAction;
  }
  if (hold === "cli-validation") {
    return input.commandValidation.nextAction;
  }
  if (hold === "blocker-priority") {
    return input.blockerPriority.nextAction;
  }
  if (hold === "traceability") {
    return input.traceability.nextAction;
  }
  if (hold === "proof-export") {
    return input.proofExport.nextAction;
  }
  return input.handoffGate.nextAction;
}

function proof(
  status: Omit<
    Phase3ClearanceCompletionStatus,
    "ariaLabel" | "phase3ClearanceCompletionStatusProof"
  >
): string {
  return (
    `phase3ClearanceCompletionStatusProof=state=${status.state} readiness=${status.readiness} ` +
    `phaseComplete=${status.phaseComplete ? "yes" : "no"} ` +
    `phase4=${status.canAdvancePhase4Review ? "ready" : "held"} ` +
    `smokeRows=${status.storageAttestedDesktopProofCount}/3 ` +
    `exit=${status.exitGateReady ? "ready" : "held"} ` +
    `commandPlan=${status.commandPlanReady ? "ready" : "held"} ` +
    `cli=${status.cliValidationReady ? "ready" : "held"} ` +
    `blockers=${status.blockerPriorityClear ? "clear" : "open"} ` +
    `traceability=${status.traceabilityTrusted ? "ready" : "held"} ` +
    `proofExport=${status.proofExportReady ? "ready" : "held"} ` +
    `handoff=${status.handoffReady ? "ready" : "held"} ` +
    `publishExecution=${status.publishExecutionHeld ? "held" : "ready"} ` +
    `noPush=${status.publishExecutionHeld ? "active" : "cleared"} ` +
    `pmLinks=${status.linkedPmTaskCount}/${status.requiredPmTaskCount} ` +
    `open=${status.openBlockerCount} topHold=${status.topHold} ` +
    `publishTopHold=${status.publishExecutionTopHold}`
  );
}

function ariaLabel(
  status: Omit<Phase3ClearanceCompletionStatus, "ariaLabel">
): string {
  return (
    `${status.label}: ${status.statusLabel}; ${status.readiness}% ready; ` +
    `phase complete ${status.phaseComplete ? "yes" : "no"}; ` +
    `Phase 4 ${status.canAdvancePhase4Review ? "ready" : "held"}; ` +
    `next action: ${status.nextAction}`
  );
}

export function buildPhase3ClearanceCompletionStatus(
  input: Phase3ClearanceCompletionStatusInput
): Phase3ClearanceCompletionStatus {
  const hold = topHold(input);
  const state = resolveState(input, hold);
  const phaseComplete = state === "ready";
  const publishExecutionHeld =
    input.publishExecutionGate?.noPushBoundaryActive ?? true;
  const draft = {
    id: "phase-3-clearance-completion-status",
    label: "Phase 3 clearance completion status",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    phaseComplete,
    canAdvancePhase4Review: phaseComplete && input.handoffGate.canAdvanceProviderIntegration,
    smokeRowsReady:
      input.smokeReadiness.state === "ready" &&
      input.smokeReadiness.storageAttestedCount >= 3,
    exitGateReady: input.exitGate.pass && input.clearancePackage.canExit,
    commandPlanReady: input.commandPlan.state === "ready",
    cliValidationReady:
      input.commandValidation.state === "ready" && input.commandValidation.isFresh,
    blockerPriorityClear: input.blockerPriority.openBlockerCount === 0,
    traceabilityTrusted: input.traceability.canTrustTrace,
    proofExportReady:
      input.proofExport.state === "ready" && input.proofExport.canVerifyOffline,
    handoffReady: input.handoffGate.canAdvanceProviderIntegration,
    publishExecutionGateState: input.publishExecutionGate?.state ?? "blocked",
    publishExecutionHeld,
    publishExecutionTopHold: input.publishExecutionGate?.topHold ?? "owner-held",
    linkedPmTaskCount: input.traceability.linkedPmTaskCount,
    requiredPmTaskCount: input.traceability.requiredPmTaskCount,
    storageAttestedDesktopProofCount: input.smokeReadiness.storageAttestedCount,
    openBlockerCount: input.blockerPriority.openBlockerCount,
    topHold: hold,
    nextAction: nextAction(input, state, hold),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase3ClearanceCompletionStatusProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
