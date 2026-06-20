import type { MigrationApplyDecisionGate, MigrationApplyDecisionState } from "./migrationApplyDecisionGate";

export type MigrationOwnerApprovalHandoffState = MigrationApplyDecisionState;

export interface MigrationOwnerApprovalHandoff {
  readonly id: string;
  readonly label: string;
  readonly state: MigrationOwnerApprovalHandoffState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canRequestOwnerApproval: boolean;
  readonly ownerApprovalRecorded: boolean;
  readonly canApplyMigration: boolean;
  readonly canActivateProfile: boolean;
  readonly sourceMutationLocked: boolean;
  readonly profileActivationLocked: boolean;
  readonly approvalRequired: boolean;
  readonly migrationOwnerApprovalHandoffProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface MigrationOwnerApprovalHandoffInput {
  readonly applyDecisionGate: MigrationApplyDecisionGate;
  readonly ownerApprovalRecorded?: boolean;
}

const HANDOFF_ID = "phase-5-migration-owner-approval-handoff";
const HANDOFF_LABEL = "Phase 5 migration owner approval handoff";
const SAFETY =
  "Phase 5 owner approval handoff is local review evidence only. It can identify that owner approval is requestable or recorded, but it does not apply migrations, activate profiles, mutate source data, run commands, copy secrets, or invoke providers.";

const STATUS_LABELS: Record<MigrationOwnerApprovalHandoffState, string> = {
  ready: "Approval recorded",
  review: "Review held",
  waiting: "Approval needed",
  blocked: "Blocked"
};

function resolveState(input: MigrationOwnerApprovalHandoffInput): MigrationOwnerApprovalHandoffState {
  if (input.applyDecisionGate.state === "blocked") {
    return "blocked";
  }

  if (input.ownerApprovalRecorded) {
    return "ready";
  }

  if (input.applyDecisionGate.state === "ready") {
    return "waiting";
  }

  return input.applyDecisionGate.state;
}

function readinessForState(state: MigrationOwnerApprovalHandoffState): number {
  if (state === "ready") {
    return 100;
  }

  if (state === "waiting") {
    return 85;
  }

  if (state === "review") {
    return 60;
  }

  return 0;
}

function nextActionForState(state: MigrationOwnerApprovalHandoffState): string {
  if (state === "blocked") {
    return "Repair blocked migration review evidence before owner approval can be requested.";
  }

  if (state === "review") {
    return "Finish held migration review rows before owner approval can be requested.";
  }

  if (state === "waiting") {
    return "Request explicit owner approval for the reviewed migration packet; migration apply and profile activation remain locked.";
  }

  return "Owner approval evidence is recorded locally; keep actual migration apply and profile activation behind a separate apply implementation gate.";
}

function buildProof(handoff: Omit<MigrationOwnerApprovalHandoff, "ariaLabel" | "migrationOwnerApprovalHandoffProof">): string {
  return (
    `handoff=${handoff.state} readiness=${handoff.readiness} ` +
    `requestable=${handoff.canRequestOwnerApproval ? "yes" : "no"} ` +
    `recorded=${handoff.ownerApprovalRecorded ? "yes" : "no"} ` +
    `canApply=${handoff.canApplyMigration ? "yes" : "no"} ` +
    `profileActivation=${handoff.profileActivationLocked ? "locked" : "unlocked"} ` +
    `sourceMutation=${handoff.sourceMutationLocked ? "locked" : "unlocked"} ` +
    `approval=${handoff.approvalRequired ? "required" : "recorded"}`
  );
}

function buildAriaLabel(handoff: Omit<MigrationOwnerApprovalHandoff, "ariaLabel">): string {
  return (
    `${handoff.label}: ${handoff.statusLabel}; ${handoff.readiness}% ready; ` +
    `requestable ${handoff.canRequestOwnerApproval ? "yes" : "no"}; ` +
    `recorded ${handoff.ownerApprovalRecorded ? "yes" : "no"}; ` +
    `can apply ${handoff.canApplyMigration ? "yes" : "no"}; ` +
    `profile activation ${handoff.profileActivationLocked ? "locked" : "unlocked"}; ` +
    `next action: ${handoff.nextAction}`
  );
}

export function buildMigrationOwnerApprovalHandoff(
  input: MigrationOwnerApprovalHandoffInput
): MigrationOwnerApprovalHandoff {
  const state = resolveState(input);
  const ownerApprovalRecorded = input.ownerApprovalRecorded === true;
  const draft = {
    id: HANDOFF_ID,
    label: HANDOFF_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    canRequestOwnerApproval:
      !ownerApprovalRecorded &&
      input.applyDecisionGate.state === "ready" &&
      input.applyDecisionGate.canStageApplyReview,
    ownerApprovalRecorded,
    canApplyMigration: false,
    canActivateProfile: false,
    sourceMutationLocked: true,
    profileActivationLocked: true,
    approvalRequired: !ownerApprovalRecorded,
    nextAction: nextActionForState(state),
    safety: SAFETY
  };
  const handoff = {
    ...draft,
    migrationOwnerApprovalHandoffProof: buildProof(draft)
  };

  return {
    ...handoff,
    ariaLabel: buildAriaLabel(handoff)
  };
}
