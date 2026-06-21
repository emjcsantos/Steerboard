import type { Phase4ProviderBlockerPrioritySummary } from "./phase4ProviderBlockerPriority";
import type { Phase4ProviderCatalogDepthSummary } from "./phase4ProviderCatalogDepth";
import type { Phase4ProviderSurfaceDepthSnapshot } from "./phase4ProviderSurfaceDepth";
import type { Phase4ProviderTraceabilitySummary } from "./phase4ProviderTraceability";
import type { Phase4RefreshSafetyDepthSummary } from "./phase4RefreshSafetyDepth";
import type { ProviderExecutionGate } from "./providerExecutionGate";

export type Phase4ProviderCompletionStatusState =
  | "complete"
  | "review"
  | "blocked"
  | "waiting";

export interface Phase4ProviderCompletionStatus {
  readonly id: string;
  readonly label: string;
  readonly state: Phase4ProviderCompletionStatusState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly phaseComplete: boolean;
  readonly canAdvanceMigrationReview: boolean;
  readonly providerExecutionLocked: boolean;
  readonly catalogCoverageReady: boolean;
  readonly refreshSafetyReady: boolean;
  readonly surfaceDepthReady: boolean;
  readonly traceabilityTrusted: boolean;
  readonly blockerPriorityClear: boolean;
  readonly providerExecutionGateHeld: boolean;
  readonly linkedPmTaskCount: number;
  readonly requiredPmTaskCount: number;
  readonly openBlockerCount: number;
  readonly topHold: string;
  readonly phase4ProviderCompletionStatusProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface Phase4ProviderCompletionStatusInput {
  readonly catalogDepth: Phase4ProviderCatalogDepthSummary;
  readonly refreshSafety: Phase4RefreshSafetyDepthSummary;
  readonly surfaceDepth: Phase4ProviderSurfaceDepthSnapshot;
  readonly traceability: Phase4ProviderTraceabilitySummary;
  readonly blockerPriority: Phase4ProviderBlockerPrioritySummary;
  readonly executionGate: ProviderExecutionGate;
}

const STATUS_LABELS: Record<Phase4ProviderCompletionStatusState, string> = {
  complete: "Complete",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

const REQUIRED_PM_TASK_COUNT = 16;
const SAFETY =
  "Phase 4 provider completion status is evidence-only. It summarizes existing provider catalog, refresh-safety, surface-depth, traceability, and blocker-priority proof without running commands, invoking skills, launching plugins or MCP tools, scheduling automations, mutating personalization, pushing branches, or unlocking provider execution.";

function catalogCoverageReady(catalogDepth: Phase4ProviderCatalogDepthSummary): boolean {
  return (
    catalogDepth.records.length === 6 &&
    catalogDepth.executionLockCount === 6 &&
    catalogDepth.catalogDepthProof.includes("metadataOnly=locked") &&
    catalogDepth.catalogDepthProof.includes("execution=locked") &&
    catalogDepth.commandSkillProof.includes("execution=locked") &&
    catalogDepth.pluginMcpProof.includes("execution=locked")
  );
}

function refreshSafetyReady(refreshSafety: Phase4RefreshSafetyDepthSummary): boolean {
  return (
    refreshSafety.records.length === 8 &&
    refreshSafety.blockedCount === 0 &&
    refreshSafety.refreshSmokeProof.includes("metadataOnly=locked") &&
    refreshSafety.refreshSmokeProof.includes("execution=locked") &&
    refreshSafety.refreshSafetyDepthProof.includes("metadataOnly=locked") &&
    refreshSafety.refreshSafetyDepthProof.includes("execution=locked")
  );
}

function surfaceDepthReady(surfaceDepth: Phase4ProviderSurfaceDepthSnapshot): boolean {
  return (
    surfaceDepth.items.length === 9 &&
    !surfaceDepth.canEnableExecution &&
    surfaceDepth.surfaceDepthProof.includes("metadataOnly=locked") &&
    surfaceDepth.surfaceDepthProof.includes("execution=locked") &&
    surfaceDepth.localRecordValidationProof.includes("metadataOnly=locked") &&
    surfaceDepth.localRecordValidationProof.includes("execution=locked")
  );
}

function providerExecutionLocked(input: Phase4ProviderCompletionStatusInput): boolean {
  return (
    input.catalogDepth.executionLockCount === 6 &&
    !input.surfaceDepth.canEnableExecution &&
    providerExecutionGateHeld(input.executionGate) &&
    input.catalogDepth.catalogDepthProof.includes("execution=locked") &&
    input.refreshSafety.refreshSafetyDepthProof.includes("execution=locked") &&
    input.surfaceDepth.surfaceDepthProof.includes("execution=locked") &&
    input.traceability.traceabilityProof.includes("execution=locked") &&
    input.blockerPriority.blockerPriorityProof.includes("execution=locked")
  );
}

function providerExecutionGateHeld(executionGate: ProviderExecutionGate): boolean {
  return (
    !executionGate.canRequestExecution &&
    executionGate.executionGateProof.includes("canRequest=no") &&
    executionGate.executionGateProof.includes("safety=metadata-only")
  );
}

function topHold(input: Phase4ProviderCompletionStatusInput): string {
  if (!catalogCoverageReady(input.catalogDepth)) {
    return "catalog-depth";
  }
  if (!refreshSafetyReady(input.refreshSafety)) {
    return "refresh-safety";
  }
  if (!surfaceDepthReady(input.surfaceDepth)) {
    return "surface-depth";
  }
  if (
    input.traceability.missingPmTaskIds.length > 0 ||
    input.traceability.linkedPmTaskCount < REQUIRED_PM_TASK_COUNT
  ) {
    return "pm-links";
  }
  if (!input.traceability.canTrustProviderReview) {
    return "traceability";
  }
  if (input.blockerPriority.openBlockerCount > 0) {
    return "blocker-priority";
  }
  if (!providerExecutionGateHeld(input.executionGate)) {
    return "provider-execution-gate";
  }
  if (!providerExecutionLocked(input)) {
    return "execution-lock";
  }
  return "none";
}

function resolveState(
  input: Phase4ProviderCompletionStatusInput,
  hold: string
): Phase4ProviderCompletionStatusState {
  if (
    input.refreshSafety.blockedCount > 0 ||
    input.surfaceDepth.state === "blocked" ||
    input.traceability.state === "blocked" ||
    input.blockerPriority.state === "blocked"
  ) {
    return "blocked";
  }
  if (hold === "none") {
    return "complete";
  }
  if (
    input.catalogDepth.records.length < 6 ||
    input.refreshSafety.records.length < 8 ||
    input.surfaceDepth.items.length < 9 ||
    input.traceability.items.length < 7
  ) {
    return "waiting";
  }
  return "review";
}

function readinessForState(state: Phase4ProviderCompletionStatusState): number {
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
  input: Phase4ProviderCompletionStatusInput,
  state: Phase4ProviderCompletionStatusState,
  hold: string
): string {
  if (state === "blocked") {
    return "Repair blocked Phase 4 catalog, refresh-safety, surface-depth, traceability, or blocker-priority evidence before completion can be trusted.";
  }
  if (state === "complete") {
    return "Phase 4 provider completion proof is attached; keep provider execution locked while Phase 5 migration review stays separate.";
  }
  if (hold === "catalog-depth") {
    return input.catalogDepth.nextAction;
  }
  if (hold === "refresh-safety") {
    return input.refreshSafety.nextAction;
  }
  if (hold === "surface-depth") {
    return input.surfaceDepth.nextAction;
  }
  if (hold === "pm-links" || hold === "traceability") {
    return input.traceability.nextAction;
  }
  if (hold === "blocker-priority") {
    return input.blockerPriority.nextAction;
  }
  if (hold === "provider-execution-gate") {
    return "Hold provider execution requests before treating Phase 4 completion as trusted.";
  }
  return "Restore provider execution lock proof before treating Phase 4 completion as trusted.";
}

function proof(
  status: Omit<
    Phase4ProviderCompletionStatus,
    "ariaLabel" | "phase4ProviderCompletionStatusProof"
  >
): string {
  return (
    `phase4ProviderCompletionStatusProof=state=${status.state} readiness=${status.readiness} ` +
    `phaseComplete=${status.phaseComplete ? "yes" : "no"} ` +
    `phase5=${status.canAdvanceMigrationReview ? "ready" : "held"} ` +
    `catalog=${status.catalogCoverageReady ? "ready" : "held"} ` +
    `refresh=${status.refreshSafetyReady ? "ready" : "held"} ` +
    `surface=${status.surfaceDepthReady ? "ready" : "held"} ` +
    `traceability=${status.traceabilityTrusted ? "ready" : "held"} ` +
    `blockers=${status.blockerPriorityClear ? "clear" : "open"} ` +
    `providerGate=${status.providerExecutionGateHeld ? "held" : "requestable"} ` +
    `pmLinks=${status.linkedPmTaskCount}/${status.requiredPmTaskCount} ` +
    `execution=${status.providerExecutionLocked ? "locked" : "review"} ` +
    `open=${status.openBlockerCount} topHold=${status.topHold}`
  );
}

function ariaLabel(
  status: Omit<Phase4ProviderCompletionStatus, "ariaLabel">
): string {
  return (
    `${status.label}: ${status.statusLabel}; ${status.readiness}% ready; ` +
    `phase complete ${status.phaseComplete ? "yes" : "no"}; ` +
    `Phase 5 ${status.canAdvanceMigrationReview ? "ready" : "held"}; ` +
    `provider execution ${status.providerExecutionLocked ? "locked" : "review"}; ` +
    `next action: ${status.nextAction}`
  );
}

export function buildPhase4ProviderCompletionStatus(
  input: Phase4ProviderCompletionStatusInput
): Phase4ProviderCompletionStatus {
  const hold = topHold(input);
  const state = resolveState(input, hold);
  const phaseComplete = state === "complete";
  const draft = {
    id: "phase-4-provider-completion-status",
    label: "Phase 4 provider completion status",
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    phaseComplete,
    canAdvanceMigrationReview: phaseComplete,
    providerExecutionLocked: providerExecutionLocked(input),
    catalogCoverageReady: catalogCoverageReady(input.catalogDepth),
    refreshSafetyReady: refreshSafetyReady(input.refreshSafety),
    surfaceDepthReady: surfaceDepthReady(input.surfaceDepth),
    traceabilityTrusted: input.traceability.canTrustProviderReview,
    blockerPriorityClear: input.blockerPriority.openBlockerCount === 0,
    providerExecutionGateHeld: providerExecutionGateHeld(input.executionGate),
    linkedPmTaskCount: input.traceability.linkedPmTaskCount,
    requiredPmTaskCount: REQUIRED_PM_TASK_COUNT,
    openBlockerCount: input.blockerPriority.openBlockerCount,
    topHold: hold,
    nextAction: nextAction(input, state, hold),
    safety: SAFETY
  };
  const withProof = {
    ...draft,
    phase4ProviderCompletionStatusProof: proof(draft)
  };

  return {
    ...withProof,
    ariaLabel: ariaLabel(withProof)
  };
}
