import { describe, expect, it } from "vitest";
import type { DesktopPermissionApprovalStatus } from "./desktopPermissionApproval";
import type { DesktopRuntimeBridgeStatus } from "./desktopRuntimeBridge";
import {
  buildDesktopPackagingReadinessSnapshot
} from "./desktopPackagingReadiness";

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
  detail: "Desktop bridge can be connected but requires shell unlock."
};

const lockedPermissionStatus: DesktopPermissionApprovalStatus = {
  ...browserPermissionStatus,
  state: "locked",
  source: "desktop",
  approvalCommandAvailable: false,
  detail: "Desktop permission approval is locked."
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

const blockedBridgeError: DesktopRuntimeBridgeStatus = {
  ...readyBridgeStatus,
  state: "error",
  source: "desktop",
  detail: "Desktop bridge status could not be loaded."
};

describe("desktop packaging readiness snapshot", () => {
  it("returns blocked state for browser preview and keeps package lock", () => {
    const snapshot = buildDesktopPackagingReadinessSnapshot(
      browserBridgeStatus,
      browserPermissionStatus
    );

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.statusLabel).toBe("Browser preview");
    expect(snapshot.readiness).toBeLessThanOrEqual(25);
    expect(snapshot.canPackage).toBe(false);
    expect(snapshot.packagingLocked).toBe(true);
    expect(
      snapshot.items.find((item) => item.id === "desktop-packaging-readiness:packaging-lock")
        ?.status
    ).toBe("locked");
  });

  it("returns waiting when desktop source is present but bridge/permission are locked", () => {
    const snapshot = buildDesktopPackagingReadinessSnapshot(
      lockedBridgeStatus,
      lockedPermissionStatus
    );

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.statusLabel).toBe("Waiting");
    expect(snapshot.readiness).toBeGreaterThanOrEqual(45);
    expect(snapshot.readiness).toBeLessThanOrEqual(65);
    expect(snapshot.canPackage).toBe(false);
    expect(snapshot.packagingLocked).toBe(true);
  });

  it("returns ready when bridge and permission are fully ready, but package action is locked", () => {
    const snapshot = buildDesktopPackagingReadinessSnapshot(
      readyBridgeStatus,
      readyPermissionStatus
    );

    expect(snapshot.state).toBe("ready");
    expect(snapshot.statusLabel).toBe("Ready");
    expect(snapshot.readiness).toBe(80);
    expect(snapshot.canPackage).toBe(false);
    expect(snapshot.packagingLocked).toBe(true);
  });

  it("returns blocked on error states", () => {
    const snapshot = buildDesktopPackagingReadinessSnapshot(
      blockedBridgeError,
      readyPermissionStatus
    );

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.statusLabel).toBe("Blocked");
    expect(snapshot.readiness).toBeLessThanOrEqual(25);
    expect(snapshot.canPackage).toBe(false);
    expect(snapshot.packagingLocked).toBe(true);
  });

  it("includes all four checklist rows with sensible row statuses", () => {
    const snapshot = buildDesktopPackagingReadinessSnapshot(
      readyBridgeStatus,
      readyPermissionStatus
    );

    const itemById = new Map(
      snapshot.items.map((item) => [item.id, item])
    );

    expect(snapshot.items).toHaveLength(4);
    expect(itemById.get("desktop-packaging-readiness:desktop-shell")).toMatchObject({
      label: "Desktop shell",
      status: "ready"
    });
    expect(
      itemById.get("desktop-packaging-readiness:runtime-bridge")
    ).toMatchObject({
      label: "Runtime bridge"
    });
    expect(
      itemById.get("desktop-packaging-readiness:permission-approval")
    ).toMatchObject({
      label: "Permission approval"
    });
    expect(
      itemById.get("desktop-packaging-readiness:packaging-lock")
    ).toMatchObject({
      label: "Packaging lock",
      status: "locked"
    });
  });

  it("does not mutate input bridge or permission status objects", () => {
    const bridge = JSON.parse(JSON.stringify(readyBridgeStatus));
    const permission = JSON.parse(JSON.stringify(readyPermissionStatus));

    buildDesktopPackagingReadinessSnapshot(bridge, permission);

    expect(bridge).toEqual(readyBridgeStatus);
    expect(permission).toEqual(readyPermissionStatus);
  });
});
