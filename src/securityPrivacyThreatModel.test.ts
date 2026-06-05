import { describe, expect, it } from "vitest";
import {
  createSecurityPrivacyThreatModel,
  type SecurityPrivacyThreatModel
} from "./securityPrivacyThreatModel";
import type { DesktopPermissionApprovalStatus } from "./desktopPermissionApproval";
import type { DesktopRuntimeBridgeStatus } from "./desktopRuntimeBridge";
import type { LocalEvidenceReadinessSnapshot } from "./localEvidenceReadiness";
import type { ToolEvidenceReadinessSnapshot } from "./toolEvidenceReadiness";
import type { RuntimeProfilePermissionApprovalSnapshot } from "./runtimeProfilePermissionApproval";
import type { RuntimeProfilePermissionAuditSnapshot } from "./runtimeProfilePermissionAudit";

const baseBridge: DesktopRuntimeBridgeStatus = {
  id: "desktop-runtime-bridge",
  label: "Desktop runtime bridge",
  state: "ready",
  processExecutionAvailable: true,
  workspaceAccessAvailable: true,
  detail: "Desktop bridge is ready.",
  safety: "No terminal command, filesystem action, process execution, or network action is performed.",
  source: "desktop"
};

const browserBridge: DesktopRuntimeBridgeStatus = {
  ...baseBridge,
  state: "unavailable",
  processExecutionAvailable: false,
  workspaceAccessAvailable: false,
  source: "browser",
  detail: "Desktop bridge is unavailable in browser preview."
};

const basePermission: DesktopPermissionApprovalStatus = {
  id: "desktop-permission-approval",
  label: "Desktop permission approval",
  state: "ready",
  approvalCommandAvailable: true,
  permissionGranted: true,
  detail: "Desktop permission approval is ready.",
  safety: "No terminal command, filesystem action, process execution, or network action is performed.",
  source: "desktop"
};

const errorPermission: DesktopPermissionApprovalStatus = {
  ...basePermission,
  state: "error",
  permissionGranted: false,
  detail: "Desktop permission approval status could not be loaded.",
  source: "desktop"
};

const browserPermission: DesktopPermissionApprovalStatus = {
  ...basePermission,
  state: "unavailable",
  approvalCommandAvailable: false,
  permissionGranted: false,
  source: "browser",
  detail: "Desktop permission approval is unavailable in browser preview."
};

const localEvidence: LocalEvidenceReadinessSnapshot = {
  id: "local-evidence-readiness",
  label: "Local evidence readiness",
  state: "ready",
  statusLabel: "Ready",
  readiness: 100,
  gateCount: 1,
  passedGateCount: 1,
  failedGateCount: 0,
  evidenceCount: 1,
  canFinalize: true,
  detail: "Local evidence is ready.",
  safety: "No terminal command, filesystem action, process execution, or network action is performed.",
  items: []
};

const blockedLocalEvidence: LocalEvidenceReadinessSnapshot = {
  ...localEvidence,
  state: "blocked",
  statusLabel: "Blocked",
  readiness: 25,
  detail: "Local evidence is blocked.",
  canFinalize: false
};

const toolEvidence: ToolEvidenceReadinessSnapshot = {
  id: "tool-evidence-readiness",
  label: "Terminal and Git evidence readiness",
  state: "ready",
  statusLabel: "Ready",
  readiness: 85,
  terminalLocked: true,
  gitLocked: true,
  canCapture: false,
  detail: "Terminal and Git are ready for capture preview.",
  safety: "No terminal command, filesystem action, process execution, or network action is performed.",
  items: []
};

const unlockedToolEvidence: ToolEvidenceReadinessSnapshot = {
  ...toolEvidence,
  canCapture: true
};

const profileApproval: RuntimeProfilePermissionApprovalSnapshot = {
  id: "runtime-profile-permission-approval",
  label: "Runtime profile permission approval",
  intent: "idle",
  state: "requestable",
  statusLabel: "Ready",
  primaryActionLabel: "Request",
  detail: "Permission approval can be requested before runtime handoff.",
  safety: "No process execution, filesystem action, or network action is performed by this permission approval preview.",
  readiness: 100,
  approvalRequired: true,
  executionLocked: true,
  canRequest: true,
  canCancel: false,
  bridgeState: "ready",
  profileId: "profile-id",
  profileLabel: "Profile"
};

const blockedProfileApproval: RuntimeProfilePermissionApprovalSnapshot = {
  ...profileApproval,
  state: "blocked",
  statusLabel: "Blocked",
  executionLocked: true,
  canRequest: false,
  detail: "Permission approval is blocked by handoff readiness."
};

const profileApprovalUnlocked: RuntimeProfilePermissionApprovalSnapshot = {
  ...profileApproval,
  executionLocked: false,
  detail: "Execution lock is unlocked."
};

const profileAudit: RuntimeProfilePermissionAuditSnapshot = {
  id: "runtime-profile-permission-audit",
  label: "Runtime profile permission audit",
  state: "ready",
  statusLabel: "Ready",
  readiness: 100,
  executionLocked: true,
  canExport: true,
  recordCount: 1,
  detail: "Audit ready for review.",
  safety: "Audit preview only. No process execution, filesystem action, or network action is performed.",
  exportMarkdown: "",
  items: []
};

const lockedProfileAudit: RuntimeProfilePermissionAuditSnapshot = {
  ...profileAudit,
  state: "waiting",
  canExport: false,
  recordCount: 0
};

const blockedProfileAudit: RuntimeProfilePermissionAuditSnapshot = {
  ...profileAudit,
  state: "blocked",
  canExport: false,
  recordCount: 0,
  detail: "Audit is blocked."
};

const auditedRecordProfileAudit: RuntimeProfilePermissionAuditSnapshot = {
  ...profileAudit,
  canExport: false,
  recordCount: 2
};

describe("createSecurityPrivacyThreatModel", () => {
  it("returns ready when all controls are ready, locked, and auditable", () => {
    const model = createSecurityPrivacyThreatModel(
      baseBridge,
      basePermission,
      localEvidence,
      toolEvidence,
      profileApproval,
      profileAudit
    );

    expect(model.tone).toBe("ready");
    expect(model.label).toBe("Security privacy model ready");
    expect(model.checkLabel).toBe("4/4 checks");
    expect(model.checks).toHaveLength(4);
    expect(model.checks.map((check) => check.tone)).toEqual([
      "ok",
      "ok",
      "ok",
      "ok"
    ]);
    expect(model.checks[2].value).toContain("toolEvidence.terminalLocked=true");
  });

  it("returns review for browser preview permission states while execution lock remains ok", () => {
    const model = createSecurityPrivacyThreatModel(
      browserBridge,
      browserPermission,
      localEvidence,
      toolEvidence,
      profileApproval,
      lockedProfileAudit
    );

    expect(model.tone).toBe("review");
    expect(model.checks[1].tone).toBe("review");
    expect(model.checks[2].tone).toBe("ok");
    expect(model.ariaLabel).toContain("bridge=unavailable(browser)");
    expect(model.ariaLabel).toContain("permission=unavailable(browser)");
  });

  it("blocks when local evidence is blocked", () => {
    const model = createSecurityPrivacyThreatModel(
      baseBridge,
      basePermission,
      blockedLocalEvidence,
      toolEvidence,
      profileApproval,
      profileAudit
    );

    expect(model.tone).toBe("blocked");
    expect(model.checks[0]).toMatchObject({
      label: "Data boundary",
      tone: "blocked",
      value: "localEvidence=blocked; toolEvidence=ready"
    });
  });

  it("blocks when permission gate has desktop permission error", () => {
    const model = createSecurityPrivacyThreatModel(
      baseBridge,
      errorPermission,
      localEvidence,
      toolEvidence,
      profileApproval,
      profileAudit
    );

    expect(model.tone).toBe("blocked");
    expect(model.checks[1]).toMatchObject({
      label: "Permission gates",
      tone: "blocked"
    });
  });

  it("blocks execution lock when capture can run", () => {
    const model = createSecurityPrivacyThreatModel(
      baseBridge,
      basePermission,
      localEvidence,
      unlockedToolEvidence,
      profileApproval,
      profileAudit
    );

    expect(model.tone).toBe("blocked");
    expect(model.checks[2]).toMatchObject({
      label: "Execution lock",
      tone: "blocked"
    });
  });

  it("blocks execution lock when execution is unlocked", () => {
    const model = createSecurityPrivacyThreatModel(
      baseBridge,
      basePermission,
      localEvidence,
      toolEvidence,
      profileApprovalUnlocked,
      profileAudit
    );

    expect(model.tone).toBe("blocked");
    expect(model.checks[2]).toMatchObject({
      label: "Execution lock",
      tone: "blocked"
    });
  });

  it("allows audit trail when export is available", () => {
    const model = createSecurityPrivacyThreatModel(
      baseBridge,
      basePermission,
      localEvidence,
      toolEvidence,
      profileApproval,
      profileAudit
    );

    expect(model.checks[3].tone).toBe("ok");
    expect(model.checks[3].value).toContain("canExport=true");
  });

  it("allows audit trail when records exist without export", () => {
    const model = createSecurityPrivacyThreatModel(
      baseBridge,
      basePermission,
      localEvidence,
      toolEvidence,
      profileApproval,
      auditedRecordProfileAudit
    );

    expect(model.checks[3].tone).toBe("ok");
    expect(model.checks[3].value).toContain("recordCount=2");
  });

  it("reviews when audit trail has no records and no export", () => {
    const model = createSecurityPrivacyThreatModel(
      baseBridge,
      basePermission,
      localEvidence,
      toolEvidence,
      profileApproval,
      lockedProfileAudit
    );

    expect(model.tone).toBe("review");
    expect(model.checks[3]).toMatchObject({
      label: "Audit trail",
      tone: "review"
    });
  });

  it("blocks when audit trail is blocked and cannot export", () => {
    const model = createSecurityPrivacyThreatModel(
      baseBridge,
      basePermission,
      localEvidence,
      toolEvidence,
      profileApproval,
      blockedProfileAudit
    );

    expect(model.tone).toBe("blocked");
    expect(model.checks[3]).toMatchObject({
      label: "Audit trail",
      tone: "blocked",
      value: "state=blocked; canExport=false; recordCount=0"
    });
  });

  it("returns waiting when all inputs are missing", () => {
    const model = createSecurityPrivacyThreatModel();

    expect(model.tone).toBe("waiting");
    expect(model.checkLabel).toBe("0/4 checks");
    expect(model.checks).toEqual([
      { label: "Data boundary", value: "missing", tone: "neutral" },
      { label: "Permission gates", value: "missing", tone: "neutral" },
      { label: "Execution lock", value: "missing", tone: "neutral" },
      { label: "Audit trail", value: "missing", tone: "neutral" }
    ]);
    expect(model.ariaLabel).toContain("bridge=missing(missing)");
    expect(model.ariaLabel).toContain("profileApproval=missing");
    expect(model.ariaLabel).toContain("Data boundary=missing");
    expect(model.ariaLabel).toContain("Permission gates=missing");
    expect(model.ariaLabel).toContain("Execution lock=missing");
    expect(model.ariaLabel).toContain("Audit trail=missing");
  });

  it("keeps checks in exact order", () => {
    const model = createSecurityPrivacyThreatModel(
      baseBridge,
      basePermission,
      localEvidence,
      toolEvidence,
      profileApproval,
      profileAudit
    );

    const checkLabels = model.checks.map((check) => check.label);

    expect(checkLabels).toEqual([
      "Data boundary",
      "Permission gates",
      "Execution lock",
      "Audit trail"
    ]);
  });

  it("does not mutate any input snapshots", () => {
    const bridge = JSON.parse(JSON.stringify(baseBridge)) as DesktopRuntimeBridgeStatus;
    const permission = JSON.parse(JSON.stringify(basePermission)) as DesktopPermissionApprovalStatus;
    const local = JSON.parse(JSON.stringify(localEvidence)) as LocalEvidenceReadinessSnapshot;
    const tool = JSON.parse(JSON.stringify(toolEvidence)) as ToolEvidenceReadinessSnapshot;
    const approval = JSON.parse(JSON.stringify(profileApproval)) as RuntimeProfilePermissionApprovalSnapshot;
    const audit = JSON.parse(JSON.stringify(profileAudit)) as RuntimeProfilePermissionAuditSnapshot;

    createSecurityPrivacyThreatModel(
      bridge,
      permission,
      local,
      tool,
      approval,
      audit
    );

    expect(bridge).toEqual(baseBridge);
    expect(permission).toEqual(basePermission);
    expect(local).toEqual(localEvidence);
    expect(tool).toEqual(toolEvidence);
    expect(approval).toEqual(profileApproval);
    expect(audit).toEqual(profileAudit);
  });
});
