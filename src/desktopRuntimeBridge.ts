import { hasTauriRuntime } from "./tauriRuntime";

export type DesktopRuntimeBridgeState = "unavailable" | "locked" | "ready" | "error";
export type DesktopRuntimeBridgeSource = "browser" | "desktop";

export interface DesktopRuntimeBridgeStatus {
  id: string;
  label: string;
  state: DesktopRuntimeBridgeState;
  processExecutionAvailable: boolean;
  workspaceAccessAvailable: boolean;
  detail: string;
  safety: string;
  source: DesktopRuntimeBridgeSource;
}

type RuntimeBridgeCommandStatus = Omit<DesktopRuntimeBridgeStatus, "source">;

const fallbackStatus: DesktopRuntimeBridgeStatus = {
  id: "desktop-runtime-bridge",
  label: "Desktop runtime bridge",
  state: "unavailable",
  processExecutionAvailable: false,
  workspaceAccessAvailable: false,
  detail: "Desktop bridge is unavailable in browser preview.",
  safety: "No process execution, filesystem access, or network action was performed.",
  source: "browser"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeState(value: unknown): DesktopRuntimeBridgeState {
  if (value === "locked" || value === "ready" || value === "error") {
    return value;
  }

  return "unavailable";
}

function normalizeCommandStatus(value: unknown): DesktopRuntimeBridgeStatus {
  const status = isRecord(value) ? value : {};
  const state = normalizeState(status.state);
  const isReady = state === "ready";

  return {
    id: typeof status.id === "string" && status.id.trim() ? status.id : fallbackStatus.id,
    label: typeof status.label === "string" && status.label.trim() ? status.label : fallbackStatus.label,
    state,
    processExecutionAvailable: isReady && status.processExecutionAvailable === true,
    workspaceAccessAvailable: isReady && status.workspaceAccessAvailable === true,
    detail: typeof status.detail === "string" && status.detail.trim() ? status.detail : fallbackStatus.detail,
    safety: typeof status.safety === "string" && status.safety.trim() ? status.safety : fallbackStatus.safety,
    source: "desktop"
  };
}

async function invokeRuntimeBridgeStatus(): Promise<RuntimeBridgeCommandStatus> {
  if (!hasTauriRuntime()) {
    return fallbackStatus;
  }

  const { invoke } = await import("@tauri-apps/api/core");

  return invoke<RuntimeBridgeCommandStatus>("runtime_bridge_status");
}

export function getFallbackDesktopRuntimeBridgeStatus(): DesktopRuntimeBridgeStatus {
  return { ...fallbackStatus };
}

export async function loadDesktopRuntimeBridgeStatus(
  invokeStatus: () => Promise<unknown> = invokeRuntimeBridgeStatus
): Promise<DesktopRuntimeBridgeStatus> {
  try {
    if (!hasTauriRuntime() && invokeStatus === invokeRuntimeBridgeStatus) {
      return getFallbackDesktopRuntimeBridgeStatus();
    }

    return normalizeCommandStatus(await invokeStatus());
  } catch {
    return {
      ...fallbackStatus,
      state: "error",
      detail: "Desktop bridge status could not be loaded.",
      source: "desktop"
    };
  }
}
