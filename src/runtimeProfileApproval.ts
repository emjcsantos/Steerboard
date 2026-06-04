import type { RuntimeProfile, RuntimeProfileReadiness } from "./runtimeProfile";

export type RuntimeProfileApprovalIntent = "idle" | "requested";
export type RuntimeProfileApprovalState = "blocked" | "review" | "requestable" | "requested";

export interface RuntimeProfileApprovalSnapshot {
  id: string;
  label: string;
  intent: RuntimeProfileApprovalIntent;
  state: RuntimeProfileApprovalState;
  canRequest: boolean;
  canCancel: boolean;
  statusLabel: string;
  primaryActionLabel: string;
  detail: string;
  safety: string;
  readiness: number;
}

const PROFILE_APPROVAL_SAFETY =
  "Local request only. No profile activation or process execution will start from this control.";

export function normalizeRuntimeProfileApprovalIntent(
  value: unknown
): RuntimeProfileApprovalIntent {
  return value === "requested" ? "requested" : "idle";
}

export function buildRuntimeProfileApprovalSnapshot(
  profile: RuntimeProfile,
  readiness: RuntimeProfileReadiness,
  intent: RuntimeProfileApprovalIntent
): RuntimeProfileApprovalSnapshot {
  const normalizedIntent = normalizeRuntimeProfileApprovalIntent(intent);

  if (readiness.state === "blocked") {
    return {
      id: `${profile.id}:approval`,
      label: `${profile.label} approval`,
      intent: normalizedIntent,
      state: "blocked",
      canRequest: false,
      canCancel: normalizedIntent === "requested",
      statusLabel: "Blocked",
      primaryActionLabel: normalizedIntent === "requested" ? "Requested" : "Request",
      detail: "Approval is blocked because draft readiness prevents profile approval.",
      safety: PROFILE_APPROVAL_SAFETY,
      readiness: readiness.readiness
    };
  }

  if (normalizedIntent === "requested") {
    return {
      id: `${profile.id}:approval`,
      label: `${profile.label} approval`,
      intent: normalizedIntent,
      state: "requested",
      canRequest: false,
      canCancel: true,
      statusLabel: "Requested",
      primaryActionLabel: "Requested",
      detail: "Approval request is queued locally and no profile is activated.",
      safety: PROFILE_APPROVAL_SAFETY,
      readiness: readiness.readiness
    };
  }

  if (readiness.state === "review") {
    return {
      id: `${profile.id}:approval`,
      label: `${profile.label} approval`,
      intent: normalizedIntent,
      state: "review",
      canRequest: true,
      canCancel: false,
      statusLabel: "Review",
      primaryActionLabel: "Request",
      detail: "Approval review can be requested.",
      safety: PROFILE_APPROVAL_SAFETY,
      readiness: readiness.readiness
    };
  }

  return {
    id: `${profile.id}:approval`,
    label: `${profile.label} approval`,
    intent: normalizedIntent,
    state: "requestable",
    canRequest: true,
    canCancel: false,
    statusLabel: "Ready",
    primaryActionLabel: "Request",
    detail: "This profile can be requested for approval.",
    safety: PROFILE_APPROVAL_SAFETY,
    readiness: readiness.readiness
  };
}
