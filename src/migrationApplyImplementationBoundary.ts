import type {
  MigrationOwnerApprovalHandoff,
  MigrationOwnerApprovalRecord
} from "./migrationOwnerApprovalHandoff";

export type MigrationApplyImplementationBoundaryState =
  | "ready"
  | "review"
  | "waiting"
  | "blocked";

export interface MigrationApplyImplementationBoundary {
  readonly id: string;
  readonly label: string;
  readonly state: MigrationApplyImplementationBoundaryState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly ownerApprovalRecorded: boolean;
  readonly canEnterApplyImplementation: boolean;
  readonly canApplyMigration: boolean;
  readonly canActivateProfile: boolean;
  readonly sourceMutationLocked: boolean;
  readonly profileActivationLocked: boolean;
  readonly executorAvailable: boolean;
  readonly mutationPathAvailable: boolean;
  readonly applyImplementationBoundaryProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface MigrationApplyImplementationBoundaryInput {
  readonly ownerApprovalHandoff: MigrationOwnerApprovalHandoff;
  readonly ownerApprovalRecord?: MigrationOwnerApprovalRecord;
}

const BOUNDARY_ID = "phase-5-migration-apply-implementation-boundary";
const BOUNDARY_LABEL = "Phase 5 migration apply implementation boundary";
const SAFETY =
  "Phase 5 migration apply implementation boundary is a local safety gate. It proves whether the reviewed and owner-approved packet can enter a future implementation path, while keeping source mutation, profile activation, provider calls, command execution, and secret copying locked.";

const STATUS_LABELS: Record<MigrationApplyImplementationBoundaryState, string> = {
  ready: "Boundary ready",
  review: "Review held",
  waiting: "Approval needed",
  blocked: "Blocked"
};

function resolveState(
  input: MigrationApplyImplementationBoundaryInput
): MigrationApplyImplementationBoundaryState {
  if (input.ownerApprovalHandoff.state === "blocked") {
    return "blocked";
  }

  if (input.ownerApprovalRecord) {
    return "ready";
  }

  if (input.ownerApprovalHandoff.canRequestOwnerApproval) {
    return "waiting";
  }

  return input.ownerApprovalHandoff.state === "ready" ? "ready" : "review";
}

function readinessForState(state: MigrationApplyImplementationBoundaryState): number {
  if (state === "ready") {
    return 100;
  }

  if (state === "waiting") {
    return 80;
  }

  if (state === "review") {
    return 55;
  }

  return 0;
}

function nextActionForState(state: MigrationApplyImplementationBoundaryState): string {
  if (state === "blocked") {
    return "Repair blocked migration review evidence before any apply implementation can be designed.";
  }

  if (state === "review") {
    return "Finish held migration review or owner-approval evidence before apply implementation is considered.";
  }

  if (state === "waiting") {
    return "Record explicit owner approval locally before designing a separate reversible migration apply implementation.";
  }

  return "Owner approval is recorded; design any future apply executor as a separate reversible implementation while source mutation and profile activation remain locked here.";
}

function buildProof(
  boundary: Omit<
    MigrationApplyImplementationBoundary,
    "ariaLabel" | "applyImplementationBoundaryProof"
  >
): string {
  return (
    `boundary=${boundary.state} readiness=${boundary.readiness} ` +
    `ownerApproval=${boundary.ownerApprovalRecorded ? "recorded" : "missing"} ` +
    `enterImplementation=${boundary.canEnterApplyImplementation ? "yes" : "no"} ` +
    `executor=${boundary.executorAvailable ? "available" : "missing"} ` +
    `mutationPath=${boundary.mutationPathAvailable ? "available" : "locked"} ` +
    `canApply=${boundary.canApplyMigration ? "yes" : "no"} ` +
    `profileActivation=${boundary.profileActivationLocked ? "locked" : "unlocked"} ` +
    `sourceMutation=${boundary.sourceMutationLocked ? "locked" : "unlocked"}`
  );
}

function buildAriaLabel(
  boundary: Omit<MigrationApplyImplementationBoundary, "ariaLabel">
): string {
  return (
    `${boundary.label}: ${boundary.statusLabel}; ${boundary.readiness}% ready; ` +
    `owner approval ${boundary.ownerApprovalRecorded ? "recorded" : "missing"}; ` +
    `enter implementation ${boundary.canEnterApplyImplementation ? "yes" : "no"}; ` +
    `can apply ${boundary.canApplyMigration ? "yes" : "no"}; ` +
    `profile activation ${boundary.profileActivationLocked ? "locked" : "unlocked"}; ` +
    `next action: ${boundary.nextAction}`
  );
}

export function buildMigrationApplyImplementationBoundary(
  input: MigrationApplyImplementationBoundaryInput
): MigrationApplyImplementationBoundary {
  const state = resolveState(input);
  const ownerApprovalRecorded = Boolean(input.ownerApprovalRecord);
  const draft = {
    id: BOUNDARY_ID,
    label: BOUNDARY_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForState(state),
    ownerApprovalRecorded,
    canEnterApplyImplementation: ownerApprovalRecorded,
    canApplyMigration: false,
    canActivateProfile: false,
    sourceMutationLocked: true,
    profileActivationLocked: true,
    executorAvailable: false,
    mutationPathAvailable: false,
    nextAction: nextActionForState(state),
    safety: SAFETY
  };
  const boundary = {
    ...draft,
    applyImplementationBoundaryProof: buildProof(draft)
  };

  return {
    ...boundary,
    ariaLabel: buildAriaLabel(boundary)
  };
}
