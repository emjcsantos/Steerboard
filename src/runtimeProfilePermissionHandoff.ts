import type { DesktopRuntimeBridgeStatus } from "./desktopRuntimeBridge";
import type { RuntimeProfileActivationSnapshot } from "./runtimeProfileActivation";

export type RuntimeProfilePermissionHandoffState = "blocked" | "waiting" | "ready";

export interface RuntimeProfilePermissionHandoffSnapshot {
  id: string;
  label: string;
  state: RuntimeProfilePermissionHandoffState;
  statusLabel: string;
  detail: string;
  safety: string;
  readiness: number;
  bridgeState: DesktopRuntimeBridgeStatus["state"];
  bridgeSource: DesktopRuntimeBridgeStatus["source"];
  profileId?: string;
  profileLabel?: string;
  canRequestPermission: boolean;
  processExecutionAvailable: boolean;
  workspaceAccessAvailable: boolean;
}

const RUNTIME_PERMISSION_HANDOFF_ID = "runtime-profile-permission-handoff";
const RUNTIME_PERMISSION_HANDOFF_LABEL = "Runtime profile permission handoff";
const SAFETY_COPY =
  "No process execution, filesystem action, or network action is performed by this handoff preview.";

const BLOCKED_DETAIL =
  "An active runtime profile is required before desktop permission handoff can be reviewed.";
const BRIDGE_UNAVAILABLE_DETAIL =
  "Desktop bridge is unavailable in browser preview.";
const BRIDGE_LOCKED_DETAIL =
  "Active profile can be reviewed for desktop permission handoff, but process and workspace access are locked.";
const READY_DETAIL =
  "Active profile can proceed to the approved runtime handoff preview.";

function clampReadiness(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function profileOrFallback(
  activeProfile: RuntimeProfileActivationSnapshot | undefined
): Pick<RuntimeProfilePermissionHandoffSnapshot, "id" | "label" | "profileId" | "profileLabel"> {
  if (!activeProfile || activeProfile.state !== "active") {
    return {
      id: RUNTIME_PERMISSION_HANDOFF_ID,
      label: RUNTIME_PERMISSION_HANDOFF_LABEL,
      profileId: undefined,
      profileLabel: undefined
    };
  }

  return {
    id: `${activeProfile.profileId}:permission-handoff`,
    label: `${activeProfile.profileLabel} permission handoff`,
    profileId: activeProfile.profileId,
    profileLabel: activeProfile.profileLabel
  };
}

function missingPermissionDetail(
  processExecutionAvailable: boolean,
  workspaceAccessAvailable: boolean
): string {
  const missing: string[] = [];

  if (!processExecutionAvailable) {
    missing.push("process execution access");
  }
  if (!workspaceAccessAvailable) {
    missing.push("workspace access");
  }

  if (missing.length === 0) {
    return "";
  }

  return `Desktop permission handoff is blocked until ${missing.join(
    " and "
  )} is available.`;
}

export function buildRuntimeProfilePermissionHandoffSnapshot(
  activeProfile: RuntimeProfileActivationSnapshot | undefined,
  bridge: DesktopRuntimeBridgeStatus
): RuntimeProfilePermissionHandoffSnapshot {
  const base = profileOrFallback(activeProfile);

  if (!activeProfile) {
    return {
      ...base,
      state: "blocked",
      statusLabel: "Blocked",
      detail: BLOCKED_DETAIL,
      safety: SAFETY_COPY,
      readiness: 0,
      bridgeState: bridge.state,
      bridgeSource: bridge.source,
      canRequestPermission: false,
      processExecutionAvailable: false,
      workspaceAccessAvailable: false
    };
  }

  if (activeProfile.state !== "active") {
    return {
      ...base,
      state: "blocked",
      statusLabel: "Blocked",
      detail: BLOCKED_DETAIL,
      safety: SAFETY_COPY,
      readiness: 0,
      bridgeState: bridge.state,
      bridgeSource: bridge.source,
      canRequestPermission: false,
      processExecutionAvailable: false,
      workspaceAccessAvailable: false
    };
  }

  if (bridge.state === "error") {
    return {
      ...base,
      state: "blocked",
      statusLabel: "Blocked",
      detail: "Desktop bridge reported an error and cannot provide permission status.",
      safety: SAFETY_COPY,
      readiness: 0,
      bridgeState: bridge.state,
      bridgeSource: bridge.source,
      canRequestPermission: false,
      processExecutionAvailable: false,
      workspaceAccessAvailable: false
    };
  }

  if (bridge.source === "browser" || bridge.state === "unavailable") {
    return {
      ...base,
      state: "waiting",
      statusLabel: "Waiting",
      detail: BRIDGE_UNAVAILABLE_DETAIL,
      safety: SAFETY_COPY,
      readiness: clampReadiness(40),
      bridgeState: bridge.state,
      bridgeSource: bridge.source,
      canRequestPermission: false,
      processExecutionAvailable: false,
      workspaceAccessAvailable: false
    };
  }

  if (bridge.state === "locked") {
    return {
      ...base,
      state: "waiting",
      statusLabel: "Waiting",
      detail: BRIDGE_LOCKED_DETAIL,
      safety: SAFETY_COPY,
      readiness: clampReadiness(60),
      bridgeState: bridge.state,
      bridgeSource: bridge.source,
      canRequestPermission: true,
      processExecutionAvailable: bridge.processExecutionAvailable,
      workspaceAccessAvailable: bridge.workspaceAccessAvailable
    };
  }

  const waitingDetail = missingPermissionDetail(
    bridge.processExecutionAvailable,
    bridge.workspaceAccessAvailable
  );
  if (waitingDetail) {
    return {
      ...base,
      state: "waiting",
      statusLabel: "Waiting",
      detail: waitingDetail,
      safety: SAFETY_COPY,
      readiness: clampReadiness(75),
      bridgeState: bridge.state,
      bridgeSource: bridge.source,
      canRequestPermission: true,
      processExecutionAvailable: bridge.processExecutionAvailable,
      workspaceAccessAvailable: bridge.workspaceAccessAvailable
    };
  }

  return {
    ...base,
    state: "ready",
    statusLabel: "Ready",
    detail: READY_DETAIL,
    safety: SAFETY_COPY,
    readiness: clampReadiness(100),
    bridgeState: bridge.state,
    bridgeSource: bridge.source,
    canRequestPermission: true,
    processExecutionAvailable: bridge.processExecutionAvailable,
    workspaceAccessAvailable: bridge.workspaceAccessAvailable
  };
}
