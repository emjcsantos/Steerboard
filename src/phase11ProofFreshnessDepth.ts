import type { Phase3ClearanceCommandPlan } from "./phase3ClearanceCommandPlan";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3CommandValidationRecordValidation } from "./phase3CommandValidationRecord";
import type { Phase3HandoffGate } from "./phase3HandoffGate";
import type { Phase3SmokeProofReadinessResult } from "./phase3SmokeProofReadiness";
import type { PhasePriorityEvidenceResult } from "./phasePriorityEvidence";

export type Phase11ProofFreshnessDepthState = "ready" | "review" | "blocked" | "waiting";

export type Phase11ProofFreshnessDepthItemKind =
  | "priority-proof"
  | "phase3-clearance"
  | "desktop-smoke"
  | "command-plan"
  | "command-validation"
  | "handoff-proof";

export interface Phase11ProofFreshnessDepthItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase11ProofFreshnessDepthItemKind;
  readonly status: Phase11ProofFreshnessDepthState;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase11ProofFreshnessDepthSnapshot {
  readonly id: string;
  readonly label: string;
  readonly state: Phase11ProofFreshnessDepthState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canTrustOwnerProof: boolean;
  readonly readyCount: number;
  readonly reviewCount: number;
  readonly blockedCount: number;
  readonly waitingCount: number;
  readonly openProofCount: number;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase11ProofFreshnessDepthItem[];
}

export interface Phase11ProofFreshnessDepthInput {
  readonly phasePriorityEvidence: PhasePriorityEvidenceResult;
  readonly phase3ClearancePackage: Phase3ClearancePackage;
  readonly phase3SmokeProofReadiness: Phase3SmokeProofReadinessResult;
  readonly phase3ClearanceCommandPlan: Phase3ClearanceCommandPlan;
  readonly phase3CommandValidationRecordValidation: Phase3CommandValidationRecordValidation;
  readonly phase3HandoffGate: Phase3HandoffGate;
}

const SNAPSHOT_ID = "phase-11-proof-freshness-depth";
const SNAPSHOT_LABEL = "Phase 11 proof freshness depth";
const SAFETY =
  "Phase 11 proof freshness depth is evidence-only. It does not run smoke commands, mutate runtime state, record handoff, install dependencies, build packages, push branches, or resume release actions.";

const STATUS_LABELS: Record<Phase11ProofFreshnessDepthState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase11ProofFreshnessDepthState): number {
  switch (state) {
    case "ready":
      return 100;
    case "review":
      return 65;
    case "waiting":
      return 35;
    case "blocked":
    default:
      return 0;
  }
}

function resolveState(
  items: readonly Phase11ProofFreshnessDepthItem[]
): Phase11ProofFreshnessDepthState {
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "review")) {
    return "review";
  }
  if (items.some((item) => item.status === "waiting")) {
    return "waiting";
  }
  return "ready";
}

function scoreItems(items: readonly Phase11ProofFreshnessDepthItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function firstNextAction(
  items: readonly Phase11ProofFreshnessDepthItem[]
): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Keep owner proof attached and fresh across reload and while the app remains open before release readiness is resumed."
  );
}

function priorityProofItem(
  phasePriorityEvidence: PhasePriorityEvidenceResult
): Phase11ProofFreshnessDepthItem {
  return {
    id: `${SNAPSHOT_ID}:priority-proof`,
    label: "Phase 1/2/6 priority proof",
    kind: "priority-proof",
    status: phasePriorityEvidence.state,
    detail: `${phasePriorityEvidence.counts.ready} ready, ${phasePriorityEvidence.counts.review} review, ${phasePriorityEvidence.counts.blocked} blocked, and ${phasePriorityEvidence.counts.waiting} waiting priority proof rows.`,
    nextAction:
      phasePriorityEvidence.state === "ready"
        ? "Keep Phase 1/2/6 proof attached until the publish blocker clears."
        : phasePriorityEvidence.detail
  };
}

function phase3ClearanceItem(
  phase3ClearancePackage: Phase3ClearancePackage
): Phase11ProofFreshnessDepthItem {
  const status = phase3ClearancePackage.canExit ? "ready" : phase3ClearancePackage.state;

  return {
    id: `${SNAPSHOT_ID}:phase3-clearance`,
    label: "Phase 3 clearance proof",
    kind: "phase3-clearance",
    status,
    detail: `${phase3ClearancePackage.readyCount} ready and ${phase3ClearancePackage.openCount} open Phase 3 clearance rows.`,
    nextAction:
      status === "ready"
        ? "Keep Phase 3 clearance proof attached before owner handoff."
        : phase3ClearancePackage.nextAction
  };
}

function desktopSmokeItem(
  phase3SmokeProofReadiness: Phase3SmokeProofReadinessResult
): Phase11ProofFreshnessDepthItem {
  const evaluationDetail =
    phase3SmokeProofReadiness.evaluatedAt === "unavailable"
      ? "freshness evaluation timestamp unavailable"
      : `freshness evaluated at ${phase3SmokeProofReadiness.evaluatedAt}`;

  return {
    id: `${SNAPSHOT_ID}:desktop-smoke`,
    label: "Desktop smoke proof",
    kind: "desktop-smoke",
    status: phase3SmokeProofReadiness.state,
    detail: `${phase3SmokeProofReadiness.counts.ready}/3 desktop smoke rows are ready; ${phase3SmokeProofReadiness.counts.review} review, ${phase3SmokeProofReadiness.counts.blocked} blocked, and ${phase3SmokeProofReadiness.counts.waiting} waiting; ${evaluationDetail}.`,
    nextAction:
      phase3SmokeProofReadiness.state === "ready"
        ? "Keep desktop smoke proof rows fresh across reload and while the app remains open."
        : "Use the Phase 3 command plan to refresh only the missing desktop smoke rows."
  };
}

function commandPlanItem(
  phase3ClearanceCommandPlan: Phase3ClearanceCommandPlan
): Phase11ProofFreshnessDepthItem {
  return {
    id: `${SNAPSHOT_ID}:command-plan`,
    label: "Desktop smoke command plan",
    kind: "command-plan",
    status: phase3ClearanceCommandPlan.state,
    detail: `${phase3ClearanceCommandPlan.command} is ${phase3ClearanceCommandPlan.canRunCommand ? "runnable" : "held"}; ${phase3ClearanceCommandPlan.readySmokeCount}/${phase3ClearanceCommandPlan.coveredSmokeCount} smoke proofs are ready.`,
    nextAction: phase3ClearanceCommandPlan.nextAction
  };
}

function commandValidationItem(
  phase3CommandValidationRecordValidation: Phase3CommandValidationRecordValidation
): Phase11ProofFreshnessDepthItem {
  return {
    id: `${SNAPSHOT_ID}:command-validation`,
    label: "CLI smoke validation record",
    kind: "command-validation",
    status: phase3CommandValidationRecordValidation.state,
    detail: phase3CommandValidationRecordValidation.detail,
    nextAction: phase3CommandValidationRecordValidation.nextAction
  };
}

function handoffProofItem(
  phase3HandoffGate: Phase3HandoffGate
): Phase11ProofFreshnessDepthItem {
  const status = phase3HandoffGate.canAdvanceProviderIntegration ? "ready" : phase3HandoffGate.state;

  return {
    id: `${SNAPSHOT_ID}:handoff-proof`,
    label: "Owner handoff proof",
    kind: "handoff-proof",
    status,
    detail: `${phase3HandoffGate.readyCount} handoff rows are ready; ${phase3HandoffGate.exactBlockerCount} exact blocker${phase3HandoffGate.exactBlockerCount === 1 ? "" : "s"} remain.`,
    nextAction:
      status === "ready"
        ? "Keep the owner handoff record attached, matching current evidence, and backed by trusted current active goal/PM traceability before provider or release readiness advances."
        : phase3HandoffGate.nextAction
  };
}

function buildAriaLabel(
  snapshot: Omit<Phase11ProofFreshnessDepthSnapshot, "ariaLabel">
): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.openProofCount} open proof rows; next action: ${snapshot.nextAction}`
  );
}

export function buildPhase11ProofFreshnessDepth(
  input: Phase11ProofFreshnessDepthInput
): Phase11ProofFreshnessDepthSnapshot {
  const items = [
    priorityProofItem(input.phasePriorityEvidence),
    phase3ClearanceItem(input.phase3ClearancePackage),
    desktopSmokeItem(input.phase3SmokeProofReadiness),
    commandPlanItem(input.phase3ClearanceCommandPlan),
    commandValidationItem(input.phase3CommandValidationRecordValidation),
    handoffProofItem(input.phase3HandoffGate)
  ];
  const state = resolveState(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const waitingCount = items.filter((item) => item.status === "waiting").length;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: scoreItems(items),
    canTrustOwnerProof: state === "ready" && readyCount === items.length,
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    openProofCount: items.length - readyCount,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
