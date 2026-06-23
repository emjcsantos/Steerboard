import { hasTauriRuntime } from "./tauriRuntime";

export type DesktopPermissionApprovalState = "unavailable" | "locked" | "ready" | "error";
export type DesktopPermissionApprovalSource = "browser" | "desktop";

export interface DesktopPermissionApprovalStatus {
  id: string;
  label: string;
  state: DesktopPermissionApprovalState;
  approvalCommandAvailable: boolean;
  permissionGranted: boolean;
  detail: string;
  safety: string;
  source: DesktopPermissionApprovalSource;
}

type PermissionApprovalCommandStatus = Omit<DesktopPermissionApprovalStatus, "source">;

const fallbackStatus: DesktopPermissionApprovalStatus = {
  id: "desktop-permission-approval",
  label: "Desktop permission approval",
  state: "unavailable",
  approvalCommandAvailable: false,
  permissionGranted: false,
  detail: "Desktop permission approval is unavailable in browser preview.",
  safety: "No process execution, filesystem access, or network action was performed.",
  source: "browser"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeState(value: unknown): DesktopPermissionApprovalState {
  if (value === "locked" || value === "ready" || value === "error") {
    return value;
  }

  return "unavailable";
}

function normalizeCommandStatus(value: unknown): DesktopPermissionApprovalStatus {
  const status = isRecord(value) ? value : {};
  const state = normalizeState(status.state);
  const isReady = state === "ready";
  const approvalCommandAvailable = isReady && status.approvalCommandAvailable === true;

  return {
    id: typeof status.id === "string" && status.id.trim() ? status.id : fallbackStatus.id,
    label: typeof status.label === "string" && status.label.trim() ? status.label : fallbackStatus.label,
    state,
    approvalCommandAvailable,
    permissionGranted: approvalCommandAvailable && status.permissionGranted === true,
    detail: typeof status.detail === "string" && status.detail.trim() ? status.detail : fallbackStatus.detail,
    safety: typeof status.safety === "string" && status.safety.trim() ? status.safety : fallbackStatus.safety,
    source: "desktop"
  };
}

async function invokePermissionApprovalStatus(): Promise<PermissionApprovalCommandStatus> {
  if (!hasTauriRuntime()) {
    return fallbackStatus;
  }

  const { invoke } = await import("@tauri-apps/api/core");

  return invoke<PermissionApprovalCommandStatus>("runtime_permission_approval_status");
}

export function getFallbackDesktopPermissionApprovalStatus(): DesktopPermissionApprovalStatus {
  return { ...fallbackStatus };
}

export async function loadDesktopPermissionApprovalStatus(
  invokeStatus: () => Promise<unknown> = invokePermissionApprovalStatus
): Promise<DesktopPermissionApprovalStatus> {
  try {
    if (!hasTauriRuntime() && invokeStatus === invokePermissionApprovalStatus) {
      return getFallbackDesktopPermissionApprovalStatus();
    }

    return normalizeCommandStatus(await invokeStatus());
  } catch {
    return {
      ...fallbackStatus,
      state: "error",
      detail: "Desktop permission approval status could not be loaded.",
      source: "desktop"
    };
  }
}
