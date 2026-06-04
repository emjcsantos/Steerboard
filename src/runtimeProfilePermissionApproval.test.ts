import { describe, expect, it } from "vitest";
import type { RuntimeProfilePermissionHandoffSnapshot } from "./runtimeProfilePermissionHandoff";
import {
  buildRuntimeProfilePermissionApprovalSnapshot,
  normalizeRuntimeProfilePermissionApprovalIntent
} from "./runtimeProfilePermissionApproval";

const blockedHandoff: RuntimeProfilePermissionHandoffSnapshot = {
  id: "runtime-profile-1:permission-handoff",
  label: "Runtime profile permission handoff",
  state: "blocked",
  statusLabel: "Blocked",
  detail: "Blocked by readiness.",
  safety: "No process execution, filesystem action, or network action is performed by this handoff preview.",
  readiness: 20,
  bridgeState: "error",
  bridgeSource: "desktop",
  canRequestPermission: false,
  processExecutionAvailable: false,
  workspaceAccessAvailable: false
};

const waitingUnavailableHandoff: RuntimeProfilePermissionHandoffSnapshot = {
  ...blockedHandoff,
  id: "runtime-profile-2:permission-handoff",
  state: "waiting",
  readiness: 40,
  canRequestPermission: false,
  detail: "Bridge unavailable in browser preview."
};

const waitingRequestableHandoff: RuntimeProfilePermissionHandoffSnapshot = {
  ...blockedHandoff,
  id: "runtime-profile-3:permission-handoff",
  state: "waiting",
  readiness: 75,
  bridgeState: "ready",
  canRequestPermission: true,
  detail: "Desktop permission can be reviewed."
};

const readyHandoff: RuntimeProfilePermissionHandoffSnapshot = {
  ...blockedHandoff,
  id: "runtime-profile-4:permission-handoff",
  state: "ready",
  readiness: 100,
  bridgeState: "ready",
  canRequestPermission: true,
  detail: "Runtime profile permission handoff is ready."
};

describe("runtime profile permission approval snapshot", () => {
  it("normalizes unknown intent to idle", () => {
    const normalized = normalizeRuntimeProfilePermissionApprovalIntent("busy");

    expect(normalized).toBe("idle");
  });

  it("blocks blocked handoff states as blocked", () => {
    const snapshot = buildRuntimeProfilePermissionApprovalSnapshot(
      blockedHandoff,
      "idle"
    );

    expect(snapshot).toEqual({
      id: "runtime-profile-1:permission-handoff:permission-approval",
      label: "Runtime profile permission handoff approval",
      intent: "idle",
      state: "blocked",
      canRequest: false,
      canCancel: false,
      statusLabel: "Blocked",
      primaryActionLabel: "Request",
      detail: "Permission approval is blocked by handoff readiness.",
      safety:
        "No process execution, filesystem action, or network action is performed by this permission approval preview.",
      readiness: 0,
      approvalRequired: false,
      executionLocked: true,
      bridgeState: "error"
    });
  });

  it("blocks waiting handoff that cannot request", () => {
    const snapshot = buildRuntimeProfilePermissionApprovalSnapshot(
      waitingUnavailableHandoff,
      "idle"
    );

    expect(snapshot).toEqual({
      id: "runtime-profile-2:permission-handoff:permission-approval",
      label: "Runtime profile permission handoff approval",
      intent: "idle",
      state: "blocked",
      canRequest: false,
      canCancel: false,
      statusLabel: "Blocked",
      primaryActionLabel: "Request",
      detail:
        "Desktop permission request is unavailable until the handoff can request permission.",
      safety:
        "No process execution, filesystem action, or network action is performed by this permission approval preview.",
      readiness: 40,
      approvalRequired: false,
      executionLocked: true,
      bridgeState: "error"
    });
  });

  it("maps requested intent from waiting/ready handoff to requested state", () => {
    const waitingRequested = buildRuntimeProfilePermissionApprovalSnapshot(
      waitingRequestableHandoff,
      "requested"
    );
    const readyRequested = buildRuntimeProfilePermissionApprovalSnapshot(
      readyHandoff,
      "requested"
    );

    expect(waitingRequested.state).toBe("requested");
    expect(waitingRequested.canRequest).toBe(false);
    expect(waitingRequested.canCancel).toBe(true);
    expect(waitingRequested.approvalRequired).toBe(true);
    expect(waitingRequested.executionLocked).toBe(true);
    expect(waitingRequested.readiness).toBe(75);
    expect(waitingRequested.detail).toBe(
      "Desktop permission request is queued locally and no permission has been granted."
    );

    expect(readyRequested.state).toBe("requested");
    expect(readyRequested.canRequest).toBe(false);
    expect(readyRequested.canCancel).toBe(true);
    expect(readyRequested.approvalRequired).toBe(true);
    expect(readyRequested.executionLocked).toBe(true);
    expect(readyRequested.readiness).toBe(100);
  });

  it("maps waiting requestable handoff to review state", () => {
    const snapshot = buildRuntimeProfilePermissionApprovalSnapshot(
      waitingRequestableHandoff,
      "idle"
    );

    expect(snapshot).toEqual({
      id: "runtime-profile-3:permission-handoff:permission-approval",
      label: "Runtime profile permission handoff approval",
      intent: "idle",
      state: "review",
      canRequest: true,
      canCancel: false,
      statusLabel: "Review",
      primaryActionLabel: "Request",
      detail:
        "Desktop permission review can be requested while bridge access remains locked.",
      safety:
        "No process execution, filesystem action, or network action is performed by this permission approval preview.",
      readiness: 75,
      approvalRequired: true,
      executionLocked: true,
      bridgeState: "ready"
    });
  });

  it("maps ready handoff to requestable state", () => {
    const snapshot = buildRuntimeProfilePermissionApprovalSnapshot(readyHandoff, "idle");

    expect(snapshot).toEqual({
      id: "runtime-profile-4:permission-handoff:permission-approval",
      label: "Runtime profile permission handoff approval",
      intent: "idle",
      state: "requestable",
      canRequest: true,
      canCancel: false,
      statusLabel: "Ready",
      primaryActionLabel: "Request",
      detail: "Permission approval can be requested before runtime handoff.",
      safety:
        "No process execution, filesystem action, or network action is performed by this permission approval preview.",
      readiness: 100,
      approvalRequired: true,
      executionLocked: true,
      bridgeState: "ready"
    });
  });

  it("preserves profile metadata only when both id and label are available", () => {
    const withProfile = buildRuntimeProfilePermissionApprovalSnapshot(
      {
        ...readyHandoff,
        profileId: "profile-1",
        profileLabel: "Profile one"
      },
      "idle"
    );
    const missingLabel = buildRuntimeProfilePermissionApprovalSnapshot(
      {
        ...readyHandoff,
        id: "runtime-profile-5:permission-handoff",
        profileId: "profile-2"
      },
      "idle"
    );

    expect(withProfile).toMatchObject({
      profileId: "profile-1",
      profileLabel: "Profile one"
    });
    expect(missingLabel.profileId).toBeUndefined();
    expect(missingLabel.profileLabel).toBeUndefined();
  });

  it("does not mutate input handoff snapshot", () => {
    const handoff = JSON.parse(JSON.stringify(readyHandoff));

    buildRuntimeProfilePermissionApprovalSnapshot(readyHandoff, "requested");

    expect(readyHandoff).toEqual(handoff);
  });
});
