import type { RuntimeLaunchRequestSnapshot } from "./runtimeLaunchRequest";

export type RuntimeLaunchApprovalIntent = "idle" | "requested";
export type RuntimeLaunchApprovalState = "waiting" | "requestable" | "requested" | "blocked";

export interface RuntimeLaunchApprovalSnapshot {
  id: string;
  label: string;
  intent: RuntimeLaunchApprovalIntent;
  state: RuntimeLaunchApprovalState;
  canRequest: boolean;
  canCancel: boolean;
  statusLabel: string;
  primaryActionLabel: string;
  detail: string;
  safety: string;
}

const APPROVAL_SAFETY =
  "Local request only. No external process will start from this control.";

export function normalizeRuntimeLaunchApprovalIntent(
  value: unknown
): RuntimeLaunchApprovalIntent {
  return value === "requested" ? "requested" : "idle";
}

export function buildRuntimeLaunchApprovalSnapshot(
  request: RuntimeLaunchRequestSnapshot,
  intent: RuntimeLaunchApprovalIntent
): RuntimeLaunchApprovalSnapshot {
  const normalizedIntent = normalizeRuntimeLaunchApprovalIntent(intent);

  if (request.state === "blocked") {
    return {
      id: `${request.id}:approval`,
      label: `${request.label} approval`,
      intent: normalizedIntent,
      state: "blocked",
      canRequest: false,
      canCancel: normalizedIntent === "requested",
      statusLabel: "Blocked",
      primaryActionLabel: "Request",
      detail: "Approval is blocked by launch request state.",
      safety: APPROVAL_SAFETY
    };
  }

  if (normalizedIntent === "requested") {
    return {
      id: `${request.id}:approval`,
      label: `${request.label} approval`,
      intent: normalizedIntent,
      state: "requested",
      canRequest: false,
      canCancel: true,
      statusLabel: "Requested",
      primaryActionLabel: "Requested",
      detail: "Approval request is queued locally and execution remains locked.",
      safety: APPROVAL_SAFETY
    };
  }

  if (request.canRequest) {
    return {
      id: `${request.id}:approval`,
      label: `${request.label} approval`,
      intent: normalizedIntent,
      state: "requestable",
      canRequest: true,
      canCancel: false,
      statusLabel: "Ready",
      primaryActionLabel: "Request",
      detail: "Approval can be requested for the local handoff.",
      safety: APPROVAL_SAFETY
    };
  }

  return {
    id: `${request.id}:approval`,
    label: `${request.label} approval`,
    intent: normalizedIntent,
    state: "waiting",
    canRequest: false,
    canCancel: false,
    statusLabel: "Waiting",
    primaryActionLabel: "Request",
    detail: request.detail,
    safety: APPROVAL_SAFETY
  };
}
