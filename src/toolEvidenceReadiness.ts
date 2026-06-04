import type { DesktopRuntimeBridgeStatus } from "./desktopRuntimeBridge";
import type { DesktopPermissionApprovalStatus } from "./desktopPermissionApproval";
import type { LocalEvidenceReadinessSnapshot } from "./localEvidenceReadiness";

export type ToolEvidenceReadinessState = "blocked" | "waiting" | "ready";
export type ToolEvidenceReadinessItemStatus =
  | "blocked"
  | "waiting"
  | "ready"
  | "locked";

export interface ToolEvidenceReadinessItem {
  id: string;
  label: string;
  status: ToolEvidenceReadinessItemStatus;
  detail: string;
}

export interface ToolEvidenceReadinessSnapshot {
  id: string;
  label: string;
  state: ToolEvidenceReadinessState;
  statusLabel: string;
  readiness: number;
  terminalLocked: boolean;
  gitLocked: boolean;
  canCapture: boolean;
  detail: string;
  safety: string;
  items: ToolEvidenceReadinessItem[];
}

const TOOL_EVIDENCE_READINESS_ID = "tool-evidence-readiness";
const TOOL_EVIDENCE_READINESS_LABEL = "Terminal and Git evidence readiness";
const PREVIEW_SAFETY =
  "No terminal command, Git operation, filesystem action, process execution, or network action is performed.";

const READY_READINESS = 85;
const WAITING_READINESS = 60;
const BLOCKED_BROWSER_READINESS = 20;
const BLOCKED_EVIDENCE_READINESS = 35;

function isBlockedSource(
  bridge: DesktopRuntimeBridgeStatus,
  permission: DesktopPermissionApprovalStatus
): boolean {
  return bridge.source === "browser" || permission.source === "browser";
}

function isBlockedState(value: string): boolean {
  return value === "unavailable" || value === "error";
}

function isBridgeReady(bridge: DesktopRuntimeBridgeStatus): boolean {
  return (
    bridge.state === "ready" &&
    bridge.processExecutionAvailable &&
    bridge.workspaceAccessAvailable
  );
}

function isPermissionReady(permission: DesktopPermissionApprovalStatus): boolean {
  return (
    permission.state === "ready" &&
    permission.approvalCommandAvailable &&
    permission.permissionGranted
  );
}

function buildTerminalGateStatus(
  bridge: DesktopRuntimeBridgeStatus,
  permission: DesktopPermissionApprovalStatus
): ToolEvidenceReadinessItemStatus {
  if (isBlockedSource(bridge, permission) || isBlockedState(bridge.state)) {
    return "blocked";
  }

  if (bridge.state === "locked") {
    return "locked";
  }

  return isBridgeReady(bridge) ? "ready" : "waiting";
}

function buildGitGateStatus(
  bridge: DesktopRuntimeBridgeStatus,
  permission: DesktopPermissionApprovalStatus
): ToolEvidenceReadinessItemStatus {
  if (isBlockedSource(bridge, permission) || isBlockedState(permission.state)) {
    return "blocked";
  }

  if (permission.state === "locked") {
    return "locked";
  }

  return isPermissionReady(permission) ? "ready" : "waiting";
}

function buildEvidenceStatus(
  bridge: DesktopRuntimeBridgeStatus,
  permission: DesktopPermissionApprovalStatus,
  evidence: LocalEvidenceReadinessSnapshot
): ToolEvidenceReadinessItemStatus {
  if (isBlockedSource(bridge, permission)) {
    return "blocked";
  }

  if (evidence.state === "blocked") {
    return "blocked";
  }

  return evidence.canFinalize ? "ready" : "waiting";
}

function buildPermissionLockStatus(
  bridge: DesktopRuntimeBridgeStatus,
  permission: DesktopPermissionApprovalStatus,
  evidence: LocalEvidenceReadinessSnapshot
): ToolEvidenceReadinessItemStatus {
  if (isBlockedSource(bridge, permission)) {
    return "blocked";
  }

  if (isBlockedState(permission.state) || isBlockedState(bridge.state)) {
    return "blocked";
  }

  if (permission.state === "locked") {
    return "locked";
  }

  if (evidence.canFinalize) {
    return "locked";
  }

  return "waiting";
}

function buildBlockedDetail(
  bridge: DesktopRuntimeBridgeStatus,
  permission: DesktopPermissionApprovalStatus,
  evidence: LocalEvidenceReadinessSnapshot
): string {
  if (isBlockedSource(bridge, permission)) {
    return "Terminal and Git readiness is blocked in browser preview.";
  }

  if (isBlockedState(bridge.state) || isBlockedState(permission.state)) {
    return "Terminal and Git readiness is blocked by a desktop state error.";
  }

  if (evidence.state === "blocked") {
    return "Terminal and Git readiness is blocked by local evidence issues.";
  }

  return "Terminal and Git readiness is blocked.";
}

export function buildToolEvidenceReadinessSnapshot(
  bridge: DesktopRuntimeBridgeStatus,
  permission: DesktopPermissionApprovalStatus,
  evidence: LocalEvidenceReadinessSnapshot
): ToolEvidenceReadinessSnapshot {
  if (isBlockedSource(bridge, permission)) {
    return {
      id: TOOL_EVIDENCE_READINESS_ID,
      label: TOOL_EVIDENCE_READINESS_LABEL,
      state: "blocked",
      statusLabel: "Browser preview",
      readiness: BLOCKED_BROWSER_READINESS,
      terminalLocked: true,
      gitLocked: true,
      canCapture: false,
      detail: buildBlockedDetail(bridge, permission, evidence),
      safety: PREVIEW_SAFETY,
      items: [
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:terminal-gate`,
          label: "Terminal gate",
          status: buildTerminalGateStatus(bridge, permission),
          detail: "Terminal access is not available in browser preview."
        },
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:git-gate`,
          label: "Git gate",
          status: buildGitGateStatus(bridge, permission),
          detail: "Git actions are not available in browser preview."
        },
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:local-evidence`,
          label: "Local evidence",
          status: buildEvidenceStatus(bridge, permission, evidence),
          detail: "Local evidence readiness must be evaluated on desktop."
        },
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:permission-lock`,
          label: "Permission lock",
          status: buildPermissionLockStatus(bridge, permission, evidence),
          detail: "Terminal and Git permissions remain locked in this preview state."
        }
      ]
    };
  }

  if (isBlockedState(bridge.state) || isBlockedState(permission.state)) {
    return {
      id: TOOL_EVIDENCE_READINESS_ID,
      label: TOOL_EVIDENCE_READINESS_LABEL,
      state: "blocked",
      statusLabel: "Blocked",
      readiness: BLOCKED_BROWSER_READINESS,
      terminalLocked: true,
      gitLocked: true,
      canCapture: false,
      detail: buildBlockedDetail(bridge, permission, evidence),
      safety: PREVIEW_SAFETY,
      items: [
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:terminal-gate`,
          label: "Terminal gate",
          status: buildTerminalGateStatus(bridge, permission),
          detail: `Runtime bridge is ${bridge.state}.`
        },
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:git-gate`,
          label: "Git gate",
          status: buildGitGateStatus(bridge, permission),
          detail: `Permission status is ${permission.state}.`
        },
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:local-evidence`,
          label: "Local evidence",
          status: buildEvidenceStatus(bridge, permission, evidence),
          detail:
            evidence.state === "blocked"
              ? "Local evidence is blocked."
              : "Local evidence is being confirmed."
        },
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:permission-lock`,
          label: "Permission lock",
          status: buildPermissionLockStatus(bridge, permission, evidence),
          detail: "Terminal and Git permissions remain locked in this preview state."
        }
      ]
    };
  }

  if (evidence.state === "blocked") {
    return {
      id: TOOL_EVIDENCE_READINESS_ID,
      label: TOOL_EVIDENCE_READINESS_LABEL,
      state: "blocked",
      statusLabel: "Blocked",
      readiness: BLOCKED_EVIDENCE_READINESS,
      terminalLocked: true,
      gitLocked: true,
      canCapture: false,
      detail: buildBlockedDetail(bridge, permission, evidence),
      safety: PREVIEW_SAFETY,
      items: [
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:terminal-gate`,
          label: "Terminal gate",
          status: buildTerminalGateStatus(bridge, permission),
          detail: "Terminal gate is otherwise ready, but blocked by local evidence state."
        },
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:git-gate`,
          label: "Git gate",
          status: buildGitGateStatus(bridge, permission),
          detail: "Git gate is otherwise ready, but blocked by local evidence state."
        },
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:local-evidence`,
          label: "Local evidence",
          status: buildEvidenceStatus(bridge, permission, evidence),
          detail:
            "Local evidence is blocked and must be resolved before terminal capture is available."
        },
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:permission-lock`,
          label: "Permission lock",
          status: buildPermissionLockStatus(bridge, permission, evidence),
          detail: "Permission lock remains in effect while waiting for local evidence readiness."
        }
      ]
    };
  }

  if (
    isBridgeReady(bridge) &&
    isPermissionReady(permission) &&
    evidence.canFinalize
  ) {
    return {
      id: TOOL_EVIDENCE_READINESS_ID,
      label: TOOL_EVIDENCE_READINESS_LABEL,
      state: "ready",
      statusLabel: "Ready",
      readiness: READY_READINESS,
      terminalLocked: true,
      gitLocked: true,
      canCapture: false,
      detail:
        "Terminal and Git are ready for capture in preview mode, but capture actions remain locked.",
      safety: PREVIEW_SAFETY,
      items: [
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:terminal-gate`,
          label: "Terminal gate",
          status: buildTerminalGateStatus(bridge, permission),
          detail: "Terminal process execution and workspace access are available."
        },
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:git-gate`,
          label: "Git gate",
          status: buildGitGateStatus(bridge, permission),
          detail: "Git permission is granted and can be used once unlocked."
        },
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:local-evidence`,
          label: "Local evidence",
          status: buildEvidenceStatus(bridge, permission, evidence),
          detail: "Local evidence is sufficient for preview completion."
        },
        {
          id: `${TOOL_EVIDENCE_READINESS_ID}:permission-lock`,
          label: "Permission lock",
          status: buildPermissionLockStatus(bridge, permission, evidence),
          detail: "Terminal and Git permissions are intentionally locked in this preview."
        }
      ]
    };
  }

  return {
    id: TOOL_EVIDENCE_READINESS_ID,
    label: TOOL_EVIDENCE_READINESS_LABEL,
    state: "waiting",
    statusLabel: "Waiting",
    readiness: WAITING_READINESS,
    terminalLocked: true,
    gitLocked: true,
    canCapture: false,
    detail:
      "Terminal and Git evidence readiness is waiting on desktop gates or local evidence confirmation.",
    safety: PREVIEW_SAFETY,
    items: [
      {
        id: `${TOOL_EVIDENCE_READINESS_ID}:terminal-gate`,
        label: "Terminal gate",
        status: buildTerminalGateStatus(bridge, permission),
        detail: "Waiting for terminal readiness."
      },
      {
        id: `${TOOL_EVIDENCE_READINESS_ID}:git-gate`,
        label: "Git gate",
        status: buildGitGateStatus(bridge, permission),
        detail: "Waiting for Git permission readiness."
      },
      {
        id: `${TOOL_EVIDENCE_READINESS_ID}:local-evidence`,
        label: "Local evidence",
        status: buildEvidenceStatus(bridge, permission, evidence),
        detail: "Waiting for local evidence completion."
      },
      {
        id: `${TOOL_EVIDENCE_READINESS_ID}:permission-lock`,
        label: "Permission lock",
        status: buildPermissionLockStatus(bridge, permission, evidence),
        detail: "Terminal and Git permissions remain locked in this preview."
      }
    ]
  };
}
