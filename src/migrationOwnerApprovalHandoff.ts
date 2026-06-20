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
  readonly ownerApprovalRecordId?: string;
  readonly migrationOwnerApprovalHandoffProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
}

export interface MigrationOwnerApprovalHandoffInput {
  readonly applyDecisionGate: MigrationApplyDecisionGate;
  readonly ownerApprovalRecorded?: boolean;
  readonly ownerApprovalRecord?: MigrationOwnerApprovalRecord;
}

export interface MigrationOwnerApprovalRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly state: "ready";
  readonly handoffProof: string;
  readonly detail: string;
}

export const MIGRATION_OWNER_APPROVAL_RECORD_STORAGE_KEY =
  "steerboard.migrationOwnerApprovalRecord.v1";

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

  if (input.ownerApprovalRecorded || input.ownerApprovalRecord) {
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
    `approval=${handoff.approvalRequired ? "required" : "recorded"} ` +
    `record=${handoff.ownerApprovalRecordId ?? "missing"}`
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
  const ownerApprovalRecord = input.ownerApprovalRecord;
  const ownerApprovalRecorded = input.ownerApprovalRecorded === true || Boolean(ownerApprovalRecord);
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
    ownerApprovalRecordId: ownerApprovalRecord?.id,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function publicText(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }

  const sanitized = value
    .replace(/[A-Za-z]:[\\/][^\s]+/g, "local path")
    .replace(/[\\/](Users|Projects|Documents|Desktop)[\\/][^\s]+/gi, "local path")
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "redacted token")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.length > 0 ? sanitized : fallback;
}

function readStorage(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem?.(MIGRATION_OWNER_APPROVAL_RECORD_STORAGE_KEY);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

function writeStorage(record: MigrationOwnerApprovalRecord): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem?.(
      MIGRATION_OWNER_APPROVAL_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
  } catch {
    return;
  }
}

function clearStorage(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem?.(MIGRATION_OWNER_APPROVAL_RECORD_STORAGE_KEY);
  } catch {
    return;
  }
}

export function createMigrationOwnerApprovalRecord(input: {
  readonly handoff: MigrationOwnerApprovalHandoff;
  readonly createdAt: string;
  readonly detail?: string;
}): MigrationOwnerApprovalRecord {
  const createdAt = publicText(input.createdAt, new Date().toISOString());

  return {
    id: `phase5-migration-owner-approval:${createdAt}`,
    createdAt,
    state: "ready",
    handoffProof: publicText(
      input.handoff.migrationOwnerApprovalHandoffProof,
      "handoff=waiting requestable=yes recorded=no canApply=no"
    ),
    detail: publicText(
      input.detail,
      "Owner approval recorded locally for Phase 5 migration review while migration apply and profile activation remain locked."
    )
  };
}

export function parseStoredMigrationOwnerApprovalRecord(
  serialized: string | null
): MigrationOwnerApprovalRecord | undefined {
  if (!serialized) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return undefined;
    }

    if (
      typeof parsed.id !== "string" ||
      typeof parsed.createdAt !== "string" ||
      parsed.state !== "ready" ||
      typeof parsed.handoffProof !== "string"
    ) {
      return undefined;
    }

    return {
      id: publicText(parsed.id, "phase5-migration-owner-approval:missing"),
      createdAt: publicText(parsed.createdAt, "missing"),
      state: "ready",
      handoffProof: publicText(parsed.handoffProof, "handoff=review"),
      detail: publicText(
        parsed.detail,
        "Owner approval recorded locally for Phase 5 migration review while migration apply and profile activation remain locked."
      )
    };
  } catch {
    return undefined;
  }
}

export function loadMigrationOwnerApprovalRecord(): MigrationOwnerApprovalRecord | undefined {
  return parseStoredMigrationOwnerApprovalRecord(readStorage());
}

export function saveMigrationOwnerApprovalRecord(record: MigrationOwnerApprovalRecord): void {
  writeStorage(record);
}

export function clearMigrationOwnerApprovalRecord(): void {
  clearStorage();
}
