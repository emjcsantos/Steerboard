import type { DesktopRuntimeBridgeStatus } from "./desktopRuntimeBridge";
import type { DesktopPermissionApprovalStatus } from "./desktopPermissionApproval";
import type { LocalEvidenceReadinessSnapshot } from "./localEvidenceReadiness";
import type { ToolEvidenceReadinessSnapshot } from "./toolEvidenceReadiness";
import type { RuntimeProfilePermissionApprovalSnapshot } from "./runtimeProfilePermissionApproval";
import type { RuntimeProfilePermissionAuditSnapshot } from "./runtimeProfilePermissionAudit";

export type SecurityPrivacyThreatModelTone = "ready" | "review" | "blocked" | "waiting";

export type SecurityPrivacyThreatModelCheck = {
  label: string;
  value: string;
  tone: "ok" | "review" | "blocked" | "neutral";
};

export interface SecurityPrivacyThreatModel {
  label: string;
  detail: string;
  tone: SecurityPrivacyThreatModelTone;
  checkLabel: string;
  checks: SecurityPrivacyThreatModelCheck[];
  ariaLabel: string;
}

const MODEL_LABELS: Record<SecurityPrivacyThreatModelTone, string> = {
  ready: "Security privacy model ready",
  review: "Security privacy model needs review",
  blocked: "Security privacy model blocked",
  waiting: "Security privacy model waiting"
};

const MODEL_DETAILS: Record<SecurityPrivacyThreatModelTone, string> = {
  ready:
    "Data boundaries, permission gates, execution locks, and audit trails are ready for local-first security review.",
  review:
    "Some security or privacy controls need review before implementation guidance is stable.",
  blocked:
    "Resolve data-boundary, permission, execution-lock, or audit blockers before advancing security controls.",
  waiting:
    "Security privacy model is waiting for data-boundary, permission, execution-lock, and audit evidence."
};

function toSafeText(value: string | undefined): string {
  return value === undefined ? "missing" : value;
}

function toSafeBooleanText(value: boolean | undefined): string {
  if (value === undefined) {
    return "missing";
  }

  return String(value);
}

function hasNoActionSafety(safety: string | undefined): boolean {
  if (!safety) {
    return false;
  }

  const normalized = safety.toLowerCase();
  return (
    normalized.includes("no action") ||
    (normalized.includes("no") &&
      (normalized.includes("command") ||
        normalized.includes("filesystem") ||
        normalized.includes("process") ||
        normalized.includes("network")))
  );
}

function isBrowserPreviewLockedShellContext(
  bridge?: DesktopRuntimeBridgeStatus,
  permission?: DesktopPermissionApprovalStatus,
  toolEvidence?: ToolEvidenceReadinessSnapshot,
  profileApproval?: RuntimeProfilePermissionApprovalSnapshot,
  profileAudit?: RuntimeProfilePermissionAuditSnapshot
): boolean {
  return (
    bridge?.source === "browser" &&
    permission?.source === "browser" &&
    bridge.state === "unavailable" &&
    permission.state === "unavailable" &&
    (toolEvidence?.terminalLocked ?? false) &&
    (toolEvidence?.gitLocked ?? false) &&
    (profileApproval?.executionLocked ?? false) &&
    (profileAudit?.executionLocked ?? false)
  );
}

function resolveDataBoundaryTone(
  localEvidence?: LocalEvidenceReadinessSnapshot,
  toolEvidence?: ToolEvidenceReadinessSnapshot,
  bridge?: DesktopRuntimeBridgeStatus
): SecurityPrivacyThreatModelCheck {
  if (localEvidence === undefined && toolEvidence === undefined) {
    return {
      label: "Data boundary",
      value: "missing",
      tone: "neutral"
    };
  }

  const localState = localEvidence?.state;
  const toolState = toolEvidence?.state;
  const isBrowserSource = bridge?.source === "browser";
  const blockedFromTool = toolState === "blocked" && !isBrowserSource;
  const blocked = localState === "blocked" || blockedFromTool;

  if (blocked) {
    return {
      label: "Data boundary",
      value: `localEvidence=${toSafeText(localState)}; toolEvidence=${toSafeText(toolState)}`,
      tone: "blocked"
    };
  }

  if (
    localEvidence !== undefined &&
    toolEvidence !== undefined &&
    hasNoActionSafety(localEvidence.safety) &&
    hasNoActionSafety(toolEvidence.safety)
  ) {
    return {
      label: "Data boundary",
      value: `localEvidence=${localState}; toolEvidence=${toolState}`,
      tone: "ok"
    };
  }

  return {
    label: "Data boundary",
    value: `localEvidence=${toSafeText(localState)}; toolEvidence=${toSafeText(toolState)}`,
    tone: "review"
  };
}

function resolvePermissionGateTone(
  bridge?: DesktopRuntimeBridgeStatus,
  permission?: DesktopPermissionApprovalStatus,
  profileApproval?: RuntimeProfilePermissionApprovalSnapshot,
  toolEvidence?: ToolEvidenceReadinessSnapshot,
  profileAudit?: RuntimeProfilePermissionAuditSnapshot
): SecurityPrivacyThreatModelCheck {
  if (
    bridge === undefined &&
    permission === undefined &&
    profileApproval === undefined
  ) {
    return {
      label: "Permission gates",
      value: "missing",
      tone: "neutral"
    };
  }

  if (
    isBrowserPreviewLockedShellContext(
      bridge,
      permission,
      toolEvidence,
      profileApproval,
      profileAudit
    )
  ) {
    return {
      label: "Permission gates",
      value:
        `bridge=${toSafeText(bridge?.state)}; permission=${toSafeText(permission?.state)}; ` +
        `executionLocked=${toSafeBooleanText(profileApproval?.executionLocked)}`,
      tone: "ok"
    };
  }

  const blocked =
    bridge?.state === "error" ||
    permission?.state === "error" ||
    profileApproval?.state === "blocked";

  if (blocked) {
    return {
      label: "Permission gates",
      value:
        `bridge=${toSafeText(bridge?.state)}; permission=${toSafeText(permission?.state)}; ` +
        `profileApproval=${toSafeText(profileApproval?.state)}`,
      tone: "blocked"
    };
  }

  const ok =
    (permission?.permissionGranted ?? false) &&
    (bridge?.processExecutionAvailable ?? false) &&
    (bridge?.workspaceAccessAvailable ?? false) &&
    (profileApproval?.executionLocked ?? false);

  if (ok) {
    return {
      label: "Permission gates",
      value:
        `bridge=${toSafeText(bridge?.state)}; permission=${toSafeText(permission?.state)}; ` +
        `executionLocked=${toSafeBooleanText(profileApproval?.executionLocked)}`,
      tone: "ok"
    };
  }

  return {
    label: "Permission gates",
    value:
      `bridge=${toSafeText(bridge?.state)}; permission=${toSafeText(permission?.state)}; ` +
      `executionLocked=${toSafeBooleanText(profileApproval?.executionLocked)}; ` +
      `permissionGranted=${String(permission?.permissionGranted ?? false)}`,
    tone: "review"
  };
}

function resolveExecutionLockTone(
  toolEvidence?: ToolEvidenceReadinessSnapshot,
  profileApproval?: RuntimeProfilePermissionApprovalSnapshot,
  profileAudit?: RuntimeProfilePermissionAuditSnapshot
): SecurityPrivacyThreatModelCheck {
  if (
    toolEvidence === undefined &&
    profileApproval === undefined &&
    profileAudit === undefined
  ) {
    return {
      label: "Execution lock",
      value: "missing",
      tone: "neutral"
    };
  }

  if (
    toolEvidence?.canCapture === true ||
    profileApproval?.executionLocked === false ||
    profileAudit?.executionLocked === false
  ) {
    return {
      label: "Execution lock",
      value:
        `toolEvidence.canCapture=${toSafeBooleanText(toolEvidence?.canCapture)}; ` +
        `profileApproval.executionLocked=${toSafeBooleanText(profileApproval?.executionLocked)}; ` +
        `profileAudit.executionLocked=${toSafeBooleanText(profileAudit?.executionLocked)}`,
      tone: "blocked"
    };
  }

  if (
    (toolEvidence?.terminalLocked ?? false) &&
    (toolEvidence?.gitLocked ?? false) &&
    (profileApproval?.executionLocked ?? false) &&
    (profileAudit?.executionLocked ?? false)
  ) {
    return {
      label: "Execution lock",
      value:
        `toolEvidence.terminalLocked=${toSafeBooleanText(toolEvidence?.terminalLocked)}; ` +
        `toolEvidence.gitLocked=${toSafeBooleanText(toolEvidence?.gitLocked)}; ` +
        `profileApproval.executionLocked=${toSafeBooleanText(profileApproval?.executionLocked)}; ` +
        `profileAudit.executionLocked=${toSafeBooleanText(profileAudit?.executionLocked)}`,
      tone: "ok"
    };
  }

  return {
    label: "Execution lock",
    value:
      `toolEvidence.terminalLocked=${toSafeBooleanText(toolEvidence?.terminalLocked)}; ` +
      `toolEvidence.gitLocked=${toSafeBooleanText(toolEvidence?.gitLocked)}; ` +
      `profileApproval.executionLocked=${toSafeBooleanText(profileApproval?.executionLocked)}; ` +
      `profileAudit.executionLocked=${toSafeBooleanText(profileAudit?.executionLocked)}`,
    tone: "review"
  };
}

function resolveAuditTrailTone(
  profileAudit?: RuntimeProfilePermissionAuditSnapshot,
  bridge?: DesktopRuntimeBridgeStatus,
  permission?: DesktopPermissionApprovalStatus,
  toolEvidence?: ToolEvidenceReadinessSnapshot,
  profileApproval?: RuntimeProfilePermissionApprovalSnapshot
): SecurityPrivacyThreatModelCheck {
  if (profileAudit === undefined) {
    return {
      label: "Audit trail",
      value: "missing",
      tone: "neutral"
    };
  }

  if (
    isBrowserPreviewLockedShellContext(
      bridge,
      permission,
      toolEvidence,
      profileApproval,
      profileAudit
    )
  ) {
    return {
      label: "Audit trail",
      value:
        `state=${profileAudit.state}; canExport=${String(profileAudit.canExport)}; ` +
        `recordCount=${profileAudit.recordCount}`,
      tone: "ok"
    };
  }

  if (profileAudit.state === "blocked" && profileAudit.canExport === false) {
    return {
      label: "Audit trail",
      value:
        `state=${profileAudit.state}; canExport=${String(profileAudit.canExport)}; ` +
        `recordCount=${profileAudit.recordCount}`,
      tone: "blocked"
    };
  }

  if (
    profileAudit.canExport ||
    profileAudit.recordCount > 0
  ) {
    return {
      label: "Audit trail",
      value:
        `state=${profileAudit.state}; canExport=${String(profileAudit.canExport)}; ` +
        `recordCount=${profileAudit.recordCount}`,
      tone: "ok"
    };
  }

  return {
    label: "Audit trail",
    value:
      `state=${profileAudit.state}; canExport=${String(profileAudit.canExport)}; ` +
      `recordCount=${profileAudit.recordCount}`,
    tone: "review"
  };
}

function resolveModelTone(
  checks: SecurityPrivacyThreatModelCheck[]
): SecurityPrivacyThreatModelTone {
  if (checks.every((check) => check.tone === "neutral")) {
    return "waiting";
  }

  if (checks.some((check) => check.tone === "blocked")) {
    return "blocked";
  }

  if (checks.every((check) => check.tone === "ok")) {
    return "ready";
  }

  return "review";
}

function buildAriaLabel(
  tone: SecurityPrivacyThreatModelTone,
  checkLabel: string,
  checks: SecurityPrivacyThreatModelCheck[],
  bridge?: DesktopRuntimeBridgeStatus,
  permission?: DesktopPermissionApprovalStatus,
  localEvidence?: LocalEvidenceReadinessSnapshot,
  toolEvidence?: ToolEvidenceReadinessSnapshot,
  profileApproval?: RuntimeProfilePermissionApprovalSnapshot,
  profileAudit?: RuntimeProfilePermissionAuditSnapshot
): string {
  return (
    `${MODEL_LABELS[tone]}: ${checkLabel}; ` +
    `bridge=${toSafeText(bridge?.state)}(${toSafeText(bridge?.source)}); ` +
    `permission=${toSafeText(permission?.state)}(${toSafeText(permission?.source)}); ` +
    `localEvidence=${toSafeText(localEvidence?.state)}; ` +
    `toolEvidence=${toSafeText(toolEvidence?.state)}; ` +
    `profileApproval=${toSafeText(profileApproval?.state)}; ` +
    `profileAudit=${toSafeText(profileAudit?.state)}; ` +
    `${checks[0].label}=${checks[0].value}; ` +
    `${checks[1].label}=${checks[1].value}; ` +
    `${checks[2].label}=${checks[2].value}; ` +
    `${checks[3].label}=${checks[3].value}`
  );
}

export function createSecurityPrivacyThreatModel(
  bridge?: DesktopRuntimeBridgeStatus,
  permission?: DesktopPermissionApprovalStatus,
  localEvidence?: LocalEvidenceReadinessSnapshot,
  toolEvidence?: ToolEvidenceReadinessSnapshot,
  profileApproval?: RuntimeProfilePermissionApprovalSnapshot,
  profileAudit?: RuntimeProfilePermissionAuditSnapshot
): SecurityPrivacyThreatModel {
  const checks = [
    resolveDataBoundaryTone(localEvidence, toolEvidence, bridge),
    resolvePermissionGateTone(
      bridge,
      permission,
      profileApproval,
      toolEvidence,
      profileAudit
    ),
    resolveExecutionLockTone(toolEvidence, profileApproval, profileAudit),
    resolveAuditTrailTone(profileAudit, bridge, permission, toolEvidence, profileApproval)
  ];

  const okCount = checks.filter((check) => check.tone === "ok").length;
  const checkLabel = `${okCount}/4 checks`;
  const tone = resolveModelTone(checks);

  return {
    label: MODEL_LABELS[tone],
    detail: MODEL_DETAILS[tone],
    tone,
    checkLabel,
    checks,
    ariaLabel: buildAriaLabel(
      tone,
      checkLabel,
      checks,
      bridge,
      permission,
      localEvidence,
      toolEvidence,
      profileApproval,
      profileAudit
    )
  };
}
