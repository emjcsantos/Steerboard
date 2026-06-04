import { describe, expect, it } from "vitest";
import type { DesktopPermissionApprovalStatus } from "./desktopPermissionApproval";
import type { DesktopRuntimeBridgeStatus } from "./desktopRuntimeBridge";
import type { LocalEvidenceReadinessSnapshot } from "./localEvidenceReadiness";
import { buildToolEvidenceReadinessSnapshot } from "./toolEvidenceReadiness";

const browserBridgeStatus: DesktopRuntimeBridgeStatus = {
  id: "desktop-runtime-bridge",
  label: "Desktop runtime bridge",
  state: "unavailable",
  processExecutionAvailable: false,
  workspaceAccessAvailable: false,
  detail: "Desktop bridge is unavailable in browser preview.",
  safety: "No process execution, filesystem access, or network action was performed.",
  source: "browser"
};

const browserPermissionStatus: DesktopPermissionApprovalStatus = {
  id: "desktop-permission-approval",
  label: "Desktop permission approval",
  state: "unavailable",
  approvalCommandAvailable: false,
  permissionGranted: false,
  detail: "Desktop permission approval is unavailable in browser preview.",
  safety: "No process execution, filesystem access, or network action was performed.",
  source: "browser"
};

const lockedBridgeStatus: DesktopRuntimeBridgeStatus = {
  ...browserBridgeStatus,
  state: "locked",
  source: "desktop",
  processExecutionAvailable: false,
  workspaceAccessAvailable: false,
  detail: "Desktop bridge can be connected but requires unlock."
};

const readyBridgeStatus: DesktopRuntimeBridgeStatus = {
  ...browserBridgeStatus,
  state: "ready",
  source: "desktop",
  processExecutionAvailable: true,
  workspaceAccessAvailable: true,
  detail: "Desktop bridge is ready."
};

const readyPermissionStatus: DesktopPermissionApprovalStatus = {
  ...browserPermissionStatus,
  state: "ready",
  source: "desktop",
  approvalCommandAvailable: true,
  permissionGranted: true,
  detail: "Desktop permission approval is ready."
};

const blockedPermissionStatus: DesktopPermissionApprovalStatus = {
  ...browserPermissionStatus,
  state: "error",
  source: "desktop",
  detail: "Desktop permission approval status could not be loaded."
};

const waitingEvidence: LocalEvidenceReadinessSnapshot = {
  id: "local-evidence-readiness",
  label: "Local evidence readiness",
  state: "waiting",
  statusLabel: "Waiting",
  readiness: 60,
  gateCount: 1,
  passedGateCount: 0,
  failedGateCount: 0,
  evidenceCount: 1,
  canFinalize: false,
  detail: "Local evidence is still being assembled.",
  safety: "No terminal command, filesystem action, process execution, or network action is performed.",
  items: []
};

const blockedEvidence: LocalEvidenceReadinessSnapshot = {
  id: "local-evidence-readiness",
  label: "Local evidence readiness",
  state: "blocked",
  statusLabel: "Blocked",
  readiness: 25,
  gateCount: 1,
  passedGateCount: 0,
  failedGateCount: 1,
  evidenceCount: 1,
  canFinalize: false,
  detail: "Local evidence is blocked by failed validation.",
  safety: "No terminal command, filesystem action, process execution, or network action is performed.",
  items: []
};

const finalizableEvidence: LocalEvidenceReadinessSnapshot = {
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
  detail: "Local evidence can be finalized.",
  safety: "No terminal command, filesystem action, process execution, or network action is performed.",
  items: []
};

describe("tool evidence readiness snapshot", () => {
  it("returns browser-preview blocked state and keeps all capture locks in place", () => {
    const snapshot = buildToolEvidenceReadinessSnapshot(
      browserBridgeStatus,
      browserPermissionStatus,
      finalizableEvidence
    );

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.statusLabel).toBe("Browser preview");
    expect(snapshot.readiness).toBeLessThanOrEqual(25);
    expect(snapshot.terminalLocked).toBe(true);
    expect(snapshot.gitLocked).toBe(true);
    expect(snapshot.canCapture).toBe(false);
    expect(snapshot.safety).toContain("No terminal command");
    expect(snapshot.safety).toContain("Git operation");
  });

  it("blocks even when desktop is ready if local evidence is blocked", () => {
    const snapshot = buildToolEvidenceReadinessSnapshot(
      readyBridgeStatus,
      readyPermissionStatus,
      blockedEvidence
    );

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.statusLabel).toBe("Blocked");
    expect(snapshot.readiness).toBeLessThanOrEqual(35);
    expect(snapshot.canCapture).toBe(false);
    expect(
      snapshot.items.find((item) => item.id === "tool-evidence-readiness:local-evidence")
        ?.status
    ).toBe("blocked");
  });

  it("waits for locked desktop source with waiting local evidence", () => {
    const snapshot = buildToolEvidenceReadinessSnapshot(
      lockedBridgeStatus,
      readyPermissionStatus,
      waitingEvidence
    );

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.statusLabel).toBe("Waiting");
    expect(snapshot.readiness).toBeGreaterThanOrEqual(45);
    expect(snapshot.readiness).toBeLessThanOrEqual(75);
    expect(snapshot.canCapture).toBe(false);
    expect(snapshot.items.find((item) => item.id === "tool-evidence-readiness:terminal-gate")?.status).toBe(
      "locked"
    );
    expect(snapshot.items.find((item) => item.id === "tool-evidence-readiness:local-evidence")?.status).toBe(
      "waiting"
    );
  });

  it("returns ready with readiness 85 when everything is ready but capture is still locked", () => {
    const snapshot = buildToolEvidenceReadinessSnapshot(
      readyBridgeStatus,
      readyPermissionStatus,
      finalizableEvidence
    );

    expect(snapshot.state).toBe("ready");
    expect(snapshot.statusLabel).toBe("Ready");
    expect(snapshot.readiness).toBe(85);
    expect(snapshot.canCapture).toBe(false);
    expect(snapshot.terminalLocked).toBe(true);
    expect(snapshot.gitLocked).toBe(true);
    expect(
      snapshot.items.find((item) => item.id === "tool-evidence-readiness:permission-lock")?.status
    ).toBe("locked");
  });

  it("includes four checklist rows with sensible statuses", () => {
    const snapshot = buildToolEvidenceReadinessSnapshot(
      readyBridgeStatus,
      readyPermissionStatus,
      finalizableEvidence
    );

    expect(snapshot.items).toHaveLength(4);
    expect(
      snapshot.items.find((item) => item.id === "tool-evidence-readiness:terminal-gate")
    ).toMatchObject({
      label: "Terminal gate",
      status: "ready"
    });
    expect(
      snapshot.items.find((item) => item.id === "tool-evidence-readiness:git-gate")
    ).toMatchObject({
      label: "Git gate",
      status: "ready"
    });
    expect(
      snapshot.items.find((item) => item.id === "tool-evidence-readiness:local-evidence")
    ).toMatchObject({
      label: "Local evidence",
      status: "ready"
    });
    expect(
      snapshot.items.find((item) => item.id === "tool-evidence-readiness:permission-lock")
    ).toMatchObject({
      label: "Permission lock",
      status: "locked"
    });
  });

  it("does not mutate bridge, permission, or evidence inputs", () => {
    const bridge = JSON.parse(JSON.stringify(readyBridgeStatus)) as DesktopRuntimeBridgeStatus;
    const permission = JSON.parse(JSON.stringify(readyPermissionStatus)) as DesktopPermissionApprovalStatus;
    const evidence = JSON.parse(JSON.stringify(finalizableEvidence)) as LocalEvidenceReadinessSnapshot;

    buildToolEvidenceReadinessSnapshot(bridge, permission, evidence);

    expect(bridge).toEqual(readyBridgeStatus);
    expect(permission).toEqual(readyPermissionStatus);
    expect(evidence).toEqual(finalizableEvidence);
  });
});

describe("tool evidence readiness for blocked desktop errors", () => {
  it("blocks for desktop permission error", () => {
    const snapshot = buildToolEvidenceReadinessSnapshot(
      readyBridgeStatus,
      blockedPermissionStatus,
      finalizableEvidence
    );

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.statusLabel).toBe("Blocked");
    expect(snapshot.readiness).toBeLessThanOrEqual(25);
  });
});
