import { describe, expect, it } from "vitest";
import type { RuntimeProfileActivationSnapshot } from "./runtimeProfileActivation";
import type { DesktopRuntimeBridgeStatus } from "./desktopRuntimeBridge";
import { buildRuntimeProfilePermissionHandoffSnapshot } from "./runtimeProfilePermissionHandoff";

const activeProfile: RuntimeProfileActivationSnapshot = {
  id: "runtime-profile-1:activation",
  profileId: "runtime-profile-1",
  profileLabel: "Runtime profile",
  adapterId: "local",
  transport: "local-process",
  workspaceMode: "read-only",
  readiness: 100,
  state: "active",
  statusLabel: "Active",
  detail: "Profile has been activated.",
  safety: "No process execution is performed by this readiness snapshot."
};

const inactiveProfile: RuntimeProfileActivationSnapshot = {
  id: "runtime-profile-2:activation",
  profileId: "runtime-profile-2",
  profileLabel: "Runtime profile inactive",
  adapterId: "local",
  transport: "local-process",
  workspaceMode: "read-only",
  readiness: 60,
  state: "inactive",
  statusLabel: "Ready",
  detail: "Profile is ready but not active.",
  safety: "No process execution is performed by this readiness snapshot."
};

const blockedProfile: RuntimeProfileActivationSnapshot = {
  id: "runtime-profile-3:activation",
  profileId: "runtime-profile-3",
  profileLabel: "Runtime profile blocked",
  adapterId: "local",
  transport: "local-process",
  workspaceMode: "read-only",
  readiness: 0,
  state: "blocked",
  statusLabel: "Blocked",
  detail: "Profile readiness is blocked.",
  safety: "No process execution is performed by this readiness snapshot."
};

const browserBridge: DesktopRuntimeBridgeStatus = {
  id: "desktop-runtime-bridge",
  label: "Desktop runtime bridge",
  state: "unavailable",
  processExecutionAvailable: false,
  workspaceAccessAvailable: false,
  detail: "Desktop bridge is unavailable in browser preview.",
  safety: "No process execution, filesystem access, or network action was performed.",
  source: "browser"
};

const errorBridge: DesktopRuntimeBridgeStatus = {
  id: "desktop-runtime-bridge",
  label: "Desktop runtime bridge",
  state: "error",
  processExecutionAvailable: false,
  workspaceAccessAvailable: false,
  detail: "Desktop bridge status could not be loaded.",
  safety: "No process execution, filesystem access, or network action was performed.",
  source: "desktop"
};

const lockedBridge: DesktopRuntimeBridgeStatus = {
  id: "desktop-runtime-bridge",
  label: "Desktop runtime bridge",
  state: "locked",
  processExecutionAvailable: false,
  workspaceAccessAvailable: false,
  detail: "Desktop bridge is locked.",
  safety: "No process execution, filesystem access, or network action was performed.",
  source: "desktop"
};

const bridgeReadyMissingOne: DesktopRuntimeBridgeStatus = {
  ...lockedBridge,
  state: "ready",
  processExecutionAvailable: true,
  workspaceAccessAvailable: false
};

const bridgeReadyMissingBoth: DesktopRuntimeBridgeStatus = {
  ...lockedBridge,
  state: "ready",
  processExecutionAvailable: false,
  workspaceAccessAvailable: false
};

const bridgeReadyFull: DesktopRuntimeBridgeStatus = {
  ...lockedBridge,
  state: "ready",
  processExecutionAvailable: true,
  workspaceAccessAvailable: true
};

describe("runtime profile permission handoff snapshot", () => {
  it("blocks when active profile snapshot is missing", () => {
    expect(buildRuntimeProfilePermissionHandoffSnapshot(undefined, browserBridge)).toEqual({
      id: "runtime-profile-permission-handoff",
      label: "Runtime profile permission handoff",
      state: "blocked",
      statusLabel: "Blocked",
      detail:
        "An active runtime profile is required before desktop permission handoff can be reviewed.",
      safety:
        "No process execution, filesystem action, or network action is performed by this handoff preview.",
      readiness: 0,
      bridgeState: "unavailable",
      bridgeSource: "browser",
      canRequestPermission: false,
      processExecutionAvailable: false,
      workspaceAccessAvailable: false
    });
  });

  it("blocks inactive or blocked profiles and keeps profile data empty", () => {
    const inactiveSnapshot = buildRuntimeProfilePermissionHandoffSnapshot(
      inactiveProfile,
      bridgeReadyFull
    );
    const blockedSnapshot = buildRuntimeProfilePermissionHandoffSnapshot(blockedProfile, bridgeReadyFull);

    expect(inactiveSnapshot.state).toBe("blocked");
    expect(inactiveSnapshot.profileId).toBeUndefined();
    expect(inactiveSnapshot.profileLabel).toBeUndefined();
    expect(blockedSnapshot.state).toBe("blocked");
    expect(blockedSnapshot.profileId).toBeUndefined();
    expect(blockedSnapshot.profileLabel).toBeUndefined();
    expect(inactiveSnapshot.readiness).toBe(0);
    expect(blockedSnapshot.readiness).toBe(0);
  });

  it("blocks when bridge status reports an error", () => {
    expect(buildRuntimeProfilePermissionHandoffSnapshot(activeProfile, errorBridge)).toEqual({
      id: "runtime-profile-1:permission-handoff",
      label: "Runtime profile permission handoff",
      state: "blocked",
      statusLabel: "Blocked",
      detail: "Desktop bridge reported an error and cannot provide permission status.",
      safety:
        "No process execution, filesystem action, or network action is performed by this handoff preview.",
      readiness: 0,
      bridgeState: "error",
      bridgeSource: "desktop",
      profileId: "runtime-profile-1",
      profileLabel: "Runtime profile",
      canRequestPermission: false,
      processExecutionAvailable: false,
      workspaceAccessAvailable: false
    });
  });

  it("waits when bridge source is browser or bridge state is unavailable", () => {
    const desktopUnavailable: DesktopRuntimeBridgeStatus = {
      ...browserBridge,
      source: "desktop",
      state: "unavailable"
    };

    const browserSnapshot = buildRuntimeProfilePermissionHandoffSnapshot(activeProfile, browserBridge);
    const unavailableSnapshot = buildRuntimeProfilePermissionHandoffSnapshot(activeProfile, desktopUnavailable);

    expect(browserSnapshot.state).toBe("waiting");
    expect(browserSnapshot.readiness).toBe(40);
    expect(browserSnapshot.canRequestPermission).toBe(false);
    expect(browserSnapshot.detail).toContain("unavailable in browser preview");
    expect(unavailableSnapshot.state).toBe("waiting");
    expect(unavailableSnapshot.readiness).toBe(40);
  });

  it("waits when bridge is locked and returns locked process/workspace detail", () => {
    const snapshot = buildRuntimeProfilePermissionHandoffSnapshot(activeProfile, lockedBridge);

    expect(snapshot).toEqual({
      id: "runtime-profile-1:permission-handoff",
      label: "Runtime profile permission handoff",
      state: "waiting",
      statusLabel: "Waiting",
      detail:
        "Active profile can be reviewed for desktop permission handoff, but process and workspace access are locked.",
      safety:
        "No process execution, filesystem action, or network action is performed by this handoff preview.",
      readiness: 60,
      bridgeState: "locked",
      bridgeSource: "desktop",
      profileId: "runtime-profile-1",
      profileLabel: "Runtime profile",
      canRequestPermission: true,
      processExecutionAvailable: false,
      workspaceAccessAvailable: false
    });
  });

  it("waits when ready bridge is missing one or both permissions", () => {
    const missingProcess = buildRuntimeProfilePermissionHandoffSnapshot(
      activeProfile,
      bridgeReadyMissingOne
    );
    const missingBoth = buildRuntimeProfilePermissionHandoffSnapshot(
      activeProfile,
      bridgeReadyMissingBoth
    );

    expect(missingProcess.state).toBe("waiting");
    expect(missingProcess.readiness).toBe(75);
    expect(missingProcess.canRequestPermission).toBe(true);
    expect(missingProcess.detail).toContain("workspace access");
    expect(missingBoth.state).toBe("waiting");
    expect(missingBoth.readiness).toBe(75);
    expect(missingBoth.detail).toContain("process execution access");
    expect(missingBoth.detail).toContain("workspace access");
  });

  it("returns ready when bridge is ready and both permissions are available", () => {
    expect(buildRuntimeProfilePermissionHandoffSnapshot(activeProfile, bridgeReadyFull)).toEqual({
      id: "runtime-profile-1:permission-handoff",
      label: "Runtime profile permission handoff",
      state: "ready",
      statusLabel: "Ready",
      detail: "Active profile can proceed to the approved runtime handoff preview.",
      safety:
        "No process execution, filesystem action, or network action is performed by this handoff preview.",
      readiness: 100,
      bridgeState: "ready",
      bridgeSource: "desktop",
      profileId: "runtime-profile-1",
      profileLabel: "Runtime profile",
      canRequestPermission: true,
      processExecutionAvailable: true,
      workspaceAccessAvailable: true
    });
  });

  it("does not mutate active profile or bridge inputs", () => {
    const baselineProfile = JSON.parse(JSON.stringify(activeProfile));
    const baselineBridge = JSON.parse(JSON.stringify(bridgeReadyFull));

    buildRuntimeProfilePermissionHandoffSnapshot(activeProfile, bridgeReadyFull);

    expect(activeProfile).toEqual(baselineProfile);
    expect(bridgeReadyFull).toEqual(baselineBridge);
  });
});
