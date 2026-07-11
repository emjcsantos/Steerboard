export type ClassroomRolloutState = "off" | "internal-preview" | "owner-approved" | "rolled-back";

export interface ClassroomOwnerApproval {
  approvedBy: string;
  approvedAt: string;
  evidence: string;
}

export interface ClassroomRollbackRecord {
  rolledBackBy: string;
  rolledBackAt: string;
  reason: string;
}

export interface ClassroomRolloutConfig {
  state: ClassroomRolloutState;
  ownerApproval?: ClassroomOwnerApproval;
  rollback?: ClassroomRollbackRecord;
}

export interface ClassroomRolloutAuditEvidence {
  decision: ClassroomRolloutState;
  presentation: "professional" | "classroom";
  reason: string;
  repaired: boolean;
  ownerApproval?: ClassroomOwnerApproval;
  rollback?: ClassroomRollbackRecord;
}

export interface ClassroomRolloutDecision<T> {
  state: ClassroomRolloutState;
  presentation: "professional" | "classroom";
  available: boolean;
  ownerApproved: boolean;
  config: ClassroomRolloutConfig;
  durableState: T;
  audit: ClassroomRolloutAuditEvidence;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validApproval(value: unknown): value is ClassroomOwnerApproval {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ClassroomOwnerApproval>;
  return nonEmpty(candidate.approvedBy) && nonEmpty(candidate.approvedAt) && nonEmpty(candidate.evidence);
}

function validRollback(value: unknown): value is ClassroomRollbackRecord {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ClassroomRollbackRecord>;
  return nonEmpty(candidate.rolledBackBy) && nonEmpty(candidate.rolledBackAt) && nonEmpty(candidate.reason);
}

/**
 * Resolves presentation availability without copying or changing durable run state.
 * Invalid or incomplete rollout data fails closed to Professional mode.
 */
export function resolveClassroomRollout<T>(configValue: unknown, durableState: T): ClassroomRolloutDecision<T> {
  const candidate = configValue && typeof configValue === "object"
    ? configValue as Partial<ClassroomRolloutConfig>
    : undefined;
  const knownState = candidate?.state === "off"
    || candidate?.state === "internal-preview"
    || candidate?.state === "owner-approved"
    || candidate?.state === "rolled-back";
  const approvalValid = validApproval(candidate?.ownerApproval);
  const rollbackValid = validRollback(candidate?.rollback);
  const state: ClassroomRolloutState = knownState
    && (candidate!.state !== "owner-approved" || approvalValid)
    && (candidate!.state !== "rolled-back" || rollbackValid)
      ? candidate!.state!
      : "off";
  const repaired = !knownState || state !== candidate?.state;
  const presentation = state === "internal-preview" || state === "owner-approved" ? "classroom" : "professional";
  const available = presentation === "classroom";
  const reason = repaired
    ? "Malformed or incomplete rollout configuration repaired to off."
    : state === "off"
      ? "Classroom Mode feature flag is off."
      : state === "internal-preview"
        ? "Classroom Mode is enabled for internal preview only."
        : state === "owner-approved"
          ? "Classroom Mode is enabled by an explicit owner approval record."
          : "Classroom Mode was rolled back to Professional mode.";
  const normalized: ClassroomRolloutConfig = { state };
  if (state === "owner-approved" && approvalValid) normalized.ownerApproval = { ...candidate!.ownerApproval! };
  if (state === "rolled-back" && rollbackValid) normalized.rollback = { ...candidate!.rollback! };

  return {
    state,
    presentation,
    available,
    ownerApproved: state === "owner-approved",
    config: normalized,
    durableState,
    audit: {
      decision: state,
      presentation,
      reason,
      repaired,
      ...(normalized.ownerApproval ? { ownerApproval: { ...normalized.ownerApproval } } : {}),
      ...(normalized.rollback ? { rollback: { ...normalized.rollback } } : {})
    }
  };
}

export function createClassroomInternalPreview(): ClassroomRolloutConfig {
  return { state: "internal-preview" };
}

export function approveClassroomRollout(ownerApproval: ClassroomOwnerApproval): ClassroomRolloutConfig {
  if (!validApproval(ownerApproval)) return { state: "off" };
  return { state: "owner-approved", ownerApproval: { ...ownerApproval } };
}

export function disableClassroomRollout(): ClassroomRolloutConfig {
  return { state: "off" };
}

export function rollbackClassroomRollout(rollback: ClassroomRollbackRecord): ClassroomRolloutConfig {
  if (!validRollback(rollback)) return { state: "off" };
  return { state: "rolled-back", rollback: { ...rollback } };
}
