import type { DesktopPermissionApprovalStatus } from "./desktopPermissionApproval";
import type { DesktopRuntimeBridgeStatus } from "./desktopRuntimeBridge";

export type DesktopPackagingReadinessState = "blocked" | "waiting" | "ready";
export type DesktopPackagingReadinessItemStatus =
  | "blocked"
  | "waiting"
  | "ready"
  | "locked";

export interface DesktopPackagingReadinessItem {
  id: string;
  label: string;
  status: DesktopPackagingReadinessItemStatus;
  detail: string;
}

export interface DesktopPackagingReadinessSnapshot {
  id: string;
  label: string;
  state: DesktopPackagingReadinessState;
  statusLabel: string;
  readiness: number;
  canPackage: boolean;
  packagingLocked: boolean;
  detail: string;
  safety: string;
  items: DesktopPackagingReadinessItem[];
}

const DESKTOP_PACKAGING_READINESS_ID = "desktop-packaging-readiness";
const DESKTOP_PACKAGING_READINESS_LABEL = "Desktop packaging readiness";
const PREVIEW_SAFETY =
  "No process execution, filesystem action, signing, or network action is performed by this packaging readiness preview.";
const READY_READINESS = 80;
const WAITING_READINESS = 55;
const BLOCKED_READINESS = 10;

function hasBlockedSource(
  bridge: DesktopRuntimeBridgeStatus,
  permission: DesktopPermissionApprovalStatus
): boolean {
  return bridge.source === "browser" || permission.source === "browser";
}

function isBlockedState(state: string): boolean {
  return state === "unavailable" || state === "error";
}

function isRuntimeBridgeBlocked(
  bridge: DesktopRuntimeBridgeStatus
): boolean {
  return isBlockedState(bridge.state);
}

function isPermissionBlocked(
  permission: DesktopPermissionApprovalStatus
): boolean {
  return isBlockedState(permission.state);
}

function isRuntimeBridgeLocked(bridge: DesktopRuntimeBridgeStatus): boolean {
  return bridge.state === "locked";
}

function isPermissionLocked(permission: DesktopPermissionApprovalStatus): boolean {
  return permission.state === "locked";
}

function isPermissionReady(permission: DesktopPermissionApprovalStatus): boolean {
  return (
    permission.state === "ready" &&
    permission.approvalCommandAvailable &&
    permission.permissionGranted
  );
}

function isBridgeReady(bridge: DesktopRuntimeBridgeStatus): boolean {
  return (
    bridge.state === "ready" &&
    bridge.processExecutionAvailable &&
    bridge.workspaceAccessAvailable
  );
}

function buildDesktopShellStatus(
  bridge: DesktopRuntimeBridgeStatus,
  permission: DesktopPermissionApprovalStatus
): DesktopPackagingReadinessItemStatus {
  if (
    hasBlockedSource(bridge, permission) ||
    isRuntimeBridgeBlocked(bridge) ||
    isPermissionBlocked(permission)
  ) {
    return "blocked";
  }

  if (isRuntimeBridgeLocked(bridge) || isPermissionLocked(permission)) {
    return "locked";
  }

  if (isBridgeReady(bridge) && isPermissionReady(permission)) {
    return "ready";
  }

  return "waiting";
}

function buildRuntimeBridgeItemStatus(
  bridge: DesktopRuntimeBridgeStatus
): DesktopPackagingReadinessItemStatus {
  if (isRuntimeBridgeBlocked(bridge)) {
    return "blocked";
  }

  if (isRuntimeBridgeLocked(bridge)) {
    return "locked";
  }

  return isBridgeReady(bridge) ? "ready" : "waiting";
}

function buildPermissionItemStatus(
  permission: DesktopPermissionApprovalStatus
): DesktopPackagingReadinessItemStatus {
  if (isPermissionBlocked(permission)) {
    return "blocked";
  }

  if (isPermissionLocked(permission)) {
    return "locked";
  }

  return isPermissionReady(permission) ? "ready" : "waiting";
}

function clampReadiness(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function blockedDetail(
  bridge: DesktopRuntimeBridgeStatus,
  permission: DesktopPermissionApprovalStatus
): string {
  if (hasBlockedSource(bridge, permission)) {
    return "Browser preview does not expose desktop packaging readiness controls.";
  }

  if (bridge.state === "error" || permission.state === "error") {
    return "Desktop packaging readiness is blocked by a runtime error.";
  }

  return "Desktop packaging readiness is unavailable.";
}

function waitingDetail(
  bridge: DesktopRuntimeBridgeStatus,
  permission: DesktopPermissionApprovalStatus
): string {
  const reasons: string[] = [];

  if (bridge.state === "locked") {
    reasons.push("desktop shell and runtime bridge access are locked");
  }

  if (permission.state === "locked") {
    reasons.push("permission approval is locked");
  }

  if (!bridge.processExecutionAvailable || !bridge.workspaceAccessAvailable) {
    reasons.push("desktop bridge capabilities are not fully available");
  }

  if (!isPermissionReady(permission)) {
    reasons.push("permission grant is not yet confirmed");
  }

  if (reasons.length === 0) {
    return "Waiting for final desktop readiness confirmation.";
  }

  return `Waiting for desktop readiness (${reasons.join(", ")}).`;
}

export function buildDesktopPackagingReadinessSnapshot(
  bridge: DesktopRuntimeBridgeStatus,
  permission: DesktopPermissionApprovalStatus
): DesktopPackagingReadinessSnapshot {
  if (
    hasBlockedSource(bridge, permission) ||
    isRuntimeBridgeBlocked(bridge) ||
    isPermissionBlocked(permission)
  ) {
    const state: DesktopPackagingReadinessState = "blocked";
    const statusLabel = hasBlockedSource(bridge, permission) ? "Browser preview" : "Blocked";
    const readiness = isRuntimeBridgeBlocked(bridge) || isPermissionBlocked(permission)
      ? BLOCKED_READINESS
      : BLOCKED_READINESS;

    return {
      id: DESKTOP_PACKAGING_READINESS_ID,
      label: DESKTOP_PACKAGING_READINESS_LABEL,
      state,
      statusLabel,
      readiness: clampReadiness(readiness),
      canPackage: false,
      packagingLocked: true,
      detail: blockedDetail(bridge, permission),
      safety: PREVIEW_SAFETY,
      items: [
        {
          id: `${DESKTOP_PACKAGING_READINESS_ID}:desktop-shell`,
          label: "Desktop shell",
          status: buildDesktopShellStatus(bridge, permission),
          detail: "Desktop shell runtime checks are blocked in this context."
        },
        {
          id: `${DESKTOP_PACKAGING_READINESS_ID}:runtime-bridge`,
          label: "Runtime bridge",
          status: buildRuntimeBridgeItemStatus(bridge),
          detail: "Runtime bridge status is blocked."
        },
        {
          id: `${DESKTOP_PACKAGING_READINESS_ID}:permission-approval`,
          label: "Permission approval",
          status: buildPermissionItemStatus(permission),
          detail: "Permission approval is blocked."
        },
        {
          id: `${DESKTOP_PACKAGING_READINESS_ID}:packaging-lock`,
          label: "Packaging lock",
          status: "locked",
          detail: "Packaging remains locked in this preview state."
        }
      ]
    };
  }

  if (
    isBridgeReady(bridge) &&
    isPermissionReady(permission)
  ) {
    return {
      id: DESKTOP_PACKAGING_READINESS_ID,
      label: DESKTOP_PACKAGING_READINESS_LABEL,
      state: "ready",
      statusLabel: "Ready",
      readiness: READY_READINESS,
      canPackage: false,
      packagingLocked: true,
      detail:
        "Desktop packaging inputs are prepared, but packaging actions stay locked in this preview.",
      safety: PREVIEW_SAFETY,
      items: [
        {
          id: `${DESKTOP_PACKAGING_READINESS_ID}:desktop-shell`,
          label: "Desktop shell",
          status: "ready",
          detail: "Desktop shell is available."
        },
        {
          id: `${DESKTOP_PACKAGING_READINESS_ID}:runtime-bridge`,
          label: "Runtime bridge",
          status: buildRuntimeBridgeItemStatus(bridge),
          detail:
            "Runtime bridge is ready with process execution and workspace access."
        },
        {
          id: `${DESKTOP_PACKAGING_READINESS_ID}:permission-approval`,
          label: "Permission approval",
          status: buildPermissionItemStatus(permission),
          detail: "Permission approval is available and granted."
        },
        {
          id: `${DESKTOP_PACKAGING_READINESS_ID}:packaging-lock`,
          label: "Packaging lock",
          status: "locked",
          detail: "Packaging remains locked in this preview state."
        }
      ]
    };
  }

  return {
    id: DESKTOP_PACKAGING_READINESS_ID,
    label: DESKTOP_PACKAGING_READINESS_LABEL,
    state: "waiting",
    statusLabel: "Waiting",
    readiness: WAITING_READINESS,
    canPackage: false,
    packagingLocked: true,
    detail: waitingDetail(bridge, permission),
    safety: PREVIEW_SAFETY,
    items: [
      {
        id: `${DESKTOP_PACKAGING_READINESS_ID}:desktop-shell`,
        label: "Desktop shell",
        status: buildDesktopShellStatus(bridge, permission),
        detail: "Desktop shell readiness is being completed."
      },
      {
        id: `${DESKTOP_PACKAGING_READINESS_ID}:runtime-bridge`,
        label: "Runtime bridge",
        status: buildRuntimeBridgeItemStatus(bridge),
        detail: "Runtime bridge is not yet fully ready."
      },
      {
        id: `${DESKTOP_PACKAGING_READINESS_ID}:permission-approval`,
        label: "Permission approval",
        status: buildPermissionItemStatus(permission),
        detail: "Permission approval is not fully confirmed."
      },
      {
        id: `${DESKTOP_PACKAGING_READINESS_ID}:packaging-lock`,
        label: "Packaging lock",
        status: "locked",
        detail: "Packaging remains locked in this preview state."
      }
    ]
  };
}
