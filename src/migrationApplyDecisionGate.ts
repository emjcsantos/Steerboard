import type {
  MigrationHardeningReadiness,
  MigrationHardeningReadinessState
} from "./migrationHardeningReadiness";
import type { MigrationBlockerPrioritySummary } from "./migrationBlockerPriority";
import type { MigrationTraceabilitySummary } from "./migrationTraceability";

export type MigrationApplyDecisionState = MigrationHardeningReadinessState;

export interface MigrationApplyDecisionGate {
  readonly id: string;
  readonly label: string;
  readonly state: MigrationApplyDecisionState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canStageApplyReview: boolean;
  readonly canApplyMigration: boolean;
  readonly canActivateProfile: boolean;
  readonly ownerApprovalRequired: boolean;
  readonly sourceMutationLocked: boolean;
  readonly profileActivationLocked: boolean;
  readonly localApplyReviewAuditReady: boolean;
  readonly rollbackReady: boolean;
  readonly sensitiveExclusionsReady: boolean;
  readonly openBlockerCount: number;
  readonly migrationApplyDecisionProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface MigrationApplyDecisionGateInput {
  readonly readiness: MigrationHardeningReadiness;
  readonly traceability: MigrationTraceabilitySummary;
  readonly blockerPriority: MigrationBlockerPrioritySummary;
}

const GATE_ID = "phase-5-migration-apply-decision-gate";
const GATE_LABEL = "Phase 5 migration apply decision gate";
const SAFETY =
  "Phase 5 migration apply decision is review-only. Ready evidence can stage owner review, but it does not apply migrations, activate profiles, mutate source data, copy secrets, run commands, invoke providers, or unlock automation.";

const STATUS_LABELS: Record<MigrationApplyDecisionState, string> = {
  ready: "Review ready",
  review: "Review held",
  waiting: "Waiting",
  blocked: "Blocked"
};

function depthReady(readiness: MigrationHardeningReadiness, kind: string): boolean {
  return readiness.reviewDepthItems.some((item) => item.kind === kind && item.status === "ready");
}

function resolveState(input: MigrationApplyDecisionGateInput): MigrationApplyDecisionState {
  if (
    input.readiness.state === "blocked" ||
    input.traceability.state === "blocked" ||
    input.blockerPriority.state === "blocked"
  ) {
    return "blocked";
  }

  if (
    input.readiness.state === "waiting" ||
    input.traceability.state === "waiting" ||
    input.blockerPriority.state === "waiting"
  ) {
    return "waiting";
  }

  if (
    input.readiness.state === "ready" &&
    input.traceability.canTrustMigrationReview &&
    input.blockerPriority.openBlockerCount === 0
  ) {
    return "ready";
  }

  return "review";
}

function readinessScore(input: MigrationApplyDecisionGateInput): number {
  const checks = [
    input.readiness.state === "ready",
    input.traceability.canTrustMigrationReview,
    input.blockerPriority.openBlockerCount === 0,
    input.readiness.canStageApplyIntent,
    input.readiness.canRollback,
    depthReady(input.readiness, "apply-review-staging"),
    depthReady(input.readiness, "exclusion"),
    depthReady(input.readiness, "profile-lock")
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function nextActionForState(state: MigrationApplyDecisionState): string {
  if (state === "blocked") {
    return "Repair blocked migration evidence before owner apply review can be staged.";
  }

  if (state === "waiting") {
    return "Finish draft, audit, rollback, and sensitive-exclusion evidence before apply review is staged.";
  }

  if (state === "review") {
    return "Resolve held migration review rows while keeping apply, profile activation, and source mutation locked.";
  }

  return "Owner review can be staged locally; migration apply and profile activation remain locked until explicit owner approval.";
}

function buildProof(input: {
  readonly gate: Omit<MigrationApplyDecisionGate, "ariaLabel" | "migrationApplyDecisionProof">;
  readonly traceability: MigrationTraceabilitySummary;
}): string {
  return (
    `decision=${input.gate.state} readiness=${input.gate.readiness} ` +
    `stageApplyReview=${input.gate.canStageApplyReview ? "yes" : "no"} ` +
    `canApply=${input.gate.canApplyMigration ? "yes" : "no"} ` +
    `profileActivation=${input.gate.profileActivationLocked ? "locked" : "unlocked"} ` +
    `sourceMutation=${input.gate.sourceMutationLocked ? "locked" : "unlocked"} ` +
    `approval=${input.gate.ownerApprovalRequired ? "required" : "not-required"} ` +
    `localAudit=${input.gate.localApplyReviewAuditReady ? "ready" : "held"} ` +
    `rollback=${input.gate.rollbackReady ? "ready" : "held"} ` +
    `sensitiveExclusions=${input.gate.sensitiveExclusionsReady ? "ready" : "held"} ` +
    `openBlockers=${input.gate.openBlockerCount} traceability=${input.traceability.canTrustMigrationReview ? "ready" : input.traceability.state}`
  );
}

function buildAriaLabel(gate: Omit<MigrationApplyDecisionGate, "ariaLabel">): string {
  return (
    `${gate.label}: ${gate.statusLabel}; ${gate.readiness}% ready; ` +
    `stage apply review ${gate.canStageApplyReview ? "yes" : "no"}; ` +
    `can apply ${gate.canApplyMigration ? "yes" : "no"}; ` +
    `profile activation ${gate.profileActivationLocked ? "locked" : "unlocked"}; ` +
    `source mutation ${gate.sourceMutationLocked ? "locked" : "unlocked"}; ` +
    `owner approval ${gate.ownerApprovalRequired ? "required" : "not required"}; ` +
    `next action: ${gate.nextAction}`
  );
}

export function buildMigrationApplyDecisionGate(
  input: MigrationApplyDecisionGateInput
): MigrationApplyDecisionGate {
  const state = resolveState(input);
  const draft = {
    id: GATE_ID,
    label: GATE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessScore(input),
    canStageApplyReview:
      state === "ready" &&
      input.readiness.canStageApplyIntent &&
      input.traceability.canTrustMigrationReview &&
      input.blockerPriority.openBlockerCount === 0,
    canApplyMigration: false,
    canActivateProfile: false,
    ownerApprovalRequired: true,
    sourceMutationLocked: true,
    profileActivationLocked: true,
    localApplyReviewAuditReady: depthReady(input.readiness, "apply-review-staging"),
    rollbackReady: input.readiness.canRollback && depthReady(input.readiness, "rollback"),
    sensitiveExclusionsReady: depthReady(input.readiness, "exclusion"),
    openBlockerCount: input.blockerPriority.openBlockerCount,
    nextAction: nextActionForState(state),
    safety: SAFETY
  };
  const gate = {
    ...draft,
    migrationApplyDecisionProof: buildProof({
      gate: draft,
      traceability: input.traceability
    })
  };

  return {
    ...gate,
    ariaLabel: buildAriaLabel(gate)
  };
}
