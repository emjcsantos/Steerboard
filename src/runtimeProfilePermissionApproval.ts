import type { RuntimeProfilePermissionHandoffSnapshot } from "./runtimeProfilePermissionHandoff";

export type RuntimeProfilePermissionApprovalIntent = "idle" | "requested";
export type RuntimeProfilePermissionApprovalState = "blocked" | "requestable" | "requested" | "review";

export interface RuntimeProfilePermissionApprovalSnapshot {
  id: string;
  label: string;
  intent: RuntimeProfilePermissionApprovalIntent;
  state: RuntimeProfilePermissionApprovalState;
  statusLabel: string;
  primaryActionLabel: string;
  detail: string;
  safety: string;
  readiness: number;
  approvalRequired: boolean;
  executionLocked: boolean;
  canRequest: boolean;
  canCancel: boolean;
  bridgeState: RuntimeProfilePermissionHandoffSnapshot["bridgeState"];
  profileId?: string;
  profileLabel?: string;
}

const PERMISSION_APPROVAL_SAFETY =
  "No process execution, filesystem action, or network action is performed by this permission approval preview.";

function hasPairOfProfileFields(profileId: unknown, profileLabel: unknown): boolean {
  return (
    typeof profileId === "string" &&
    profileId.length > 0 &&
    typeof profileLabel === "string" &&
    profileLabel.length > 0
  );
}

function snapshotProfilePair(
  snapshot: RuntimeProfilePermissionHandoffSnapshot
):
  | Pick<RuntimeProfilePermissionApprovalSnapshot, "profileId" | "profileLabel">
  | Record<string, never> {
  if (!hasPairOfProfileFields(snapshot.profileId, snapshot.profileLabel)) {
    return {};
  }

  return {
    profileId: snapshot.profileId,
    profileLabel: snapshot.profileLabel
  };
}

function normalizeReadyValue(readiness: number): number {
  if (!Number.isFinite(readiness)) {
    return 0;
  }

  return Math.max(0, Math.min(100, readiness));
}

export function normalizeRuntimeProfilePermissionApprovalIntent(
  value: unknown
): RuntimeProfilePermissionApprovalIntent {
  return value === "requested" ? "requested" : "idle";
}

export function buildRuntimeProfilePermissionApprovalSnapshot(
  snapshot: RuntimeProfilePermissionHandoffSnapshot,
  intent: RuntimeProfilePermissionApprovalIntent
): RuntimeProfilePermissionApprovalSnapshot {
  const normalizedIntent = normalizeRuntimeProfilePermissionApprovalIntent(intent);
  const readiness = normalizeReadyValue(snapshot.readiness);
  const profilePair = snapshotProfilePair(snapshot);

  if (snapshot.state === "blocked") {
    return {
      id: `${snapshot.id}:permission-approval`,
      label: `${snapshot.label} approval`,
      intent: normalizedIntent,
      state: "blocked",
      canRequest: false,
      canCancel: normalizedIntent === "requested",
      statusLabel: "Blocked",
      primaryActionLabel: normalizedIntent === "requested" ? "Requested" : "Request",
      detail: "Permission approval is blocked by handoff readiness.",
      safety: PERMISSION_APPROVAL_SAFETY,
      readiness: 0,
      approvalRequired: false,
      executionLocked: true,
      bridgeState: snapshot.bridgeState,
      ...profilePair
    };
  }

  if (snapshot.state === "waiting" && !snapshot.canRequestPermission) {
    return {
      id: `${snapshot.id}:permission-approval`,
      label: `${snapshot.label} approval`,
      intent: normalizedIntent,
      state: "blocked",
      canRequest: false,
      canCancel: normalizedIntent === "requested",
      statusLabel: "Blocked",
      primaryActionLabel: normalizedIntent === "requested" ? "Requested" : "Request",
      detail:
        "Desktop permission request is unavailable until the handoff can request permission.",
      safety: PERMISSION_APPROVAL_SAFETY,
      readiness,
      approvalRequired: false,
      executionLocked: true,
      bridgeState: snapshot.bridgeState,
      ...profilePair
    };
  }

  if (normalizedIntent === "requested") {
    return {
      id: `${snapshot.id}:permission-approval`,
      label: `${snapshot.label} approval`,
      intent: normalizedIntent,
      state: "requested",
      canRequest: false,
      canCancel: true,
      statusLabel: "Requested",
      primaryActionLabel: "Requested",
      detail: "Desktop permission request is queued locally and no permission has been granted.",
      safety: PERMISSION_APPROVAL_SAFETY,
      readiness,
      approvalRequired: true,
      executionLocked: true,
      bridgeState: snapshot.bridgeState,
      ...profilePair
    };
  }

  if (snapshot.state === "waiting") {
    return {
      id: `${snapshot.id}:permission-approval`,
      label: `${snapshot.label} approval`,
      intent: normalizedIntent,
      state: "review",
      canRequest: true,
      canCancel: false,
      statusLabel: "Review",
      primaryActionLabel: "Request",
      detail: "Desktop permission review can be requested while bridge access remains locked.",
      safety: PERMISSION_APPROVAL_SAFETY,
      readiness,
      approvalRequired: true,
      executionLocked: true,
      bridgeState: snapshot.bridgeState,
      ...profilePair
    };
  }

  return {
    id: `${snapshot.id}:permission-approval`,
    label: `${snapshot.label} approval`,
    intent: normalizedIntent,
    state: "requestable",
    canRequest: true,
    canCancel: false,
    statusLabel: "Ready",
    primaryActionLabel: "Request",
    detail:
      "Permission approval can be requested before runtime handoff.",
    safety: PERMISSION_APPROVAL_SAFETY,
    readiness,
    approvalRequired: true,
    executionLocked: true,
    bridgeState: snapshot.bridgeState,
    ...profilePair
  };
}
