import { describe, expect, it } from "vitest";
import type { RuntimeProfile, RuntimeProfileReadiness } from "./runtimeProfile";
import {
  buildRuntimeProfileApprovalSnapshot,
  normalizeRuntimeProfileApprovalIntent
} from "./runtimeProfileApproval";

const profile: RuntimeProfile = {
  id: "runtime-profile-1",
  label: "Draft profile",
  adapterId: "local",
  transport: "local-process",
  command: "node",
  args: ["run", "service.js"],
  workspaceMode: "read-only",
  permissionState: [],
  enabled: true,
  capabilities: [],
  requiredPermissions: []
};

const blockedReadiness: RuntimeProfileReadiness = {
  state: "blocked",
  readiness: 0,
  reasons: ["Command missing."],
  safety: "Local request only."
};

const reviewReadiness: RuntimeProfileReadiness = {
  state: "review",
  readiness: 60,
  reasons: ["Manual review required."],
  safety: "Local request only."
};

const readyReadiness: RuntimeProfileReadiness = {
  state: "ready",
  readiness: 100,
  reasons: [],
  safety: "Local request only."
};

describe("runtime profile approval snapshot", () => {
  it("normalizes unknown intent to idle", () => {
    expect(normalizeRuntimeProfileApprovalIntent("??")).toBe("idle");
  });

  it("maps blocked readiness and requested intent to blocked state with cancel available", () => {
    const snapshot = buildRuntimeProfileApprovalSnapshot(
      profile,
      blockedReadiness,
      "requested"
    );

    expect(snapshot).toEqual({
      id: "runtime-profile-1:approval",
      label: "Draft profile approval",
      intent: "requested",
      state: "blocked",
      canRequest: false,
      canCancel: true,
      statusLabel: "Blocked",
      primaryActionLabel: "Requested",
      detail: "Approval is blocked because draft readiness prevents profile approval.",
      safety:
        "Local request only. No profile activation or process execution will start from this control.",
      readiness: 0
    });
  });

  it("maps requested intent from ready readiness to requested state", () => {
    const snapshot = buildRuntimeProfileApprovalSnapshot(profile, readyReadiness, "requested");

    expect(snapshot).toEqual({
      id: "runtime-profile-1:approval",
      label: "Draft profile approval",
      intent: "requested",
      state: "requested",
      canRequest: false,
      canCancel: true,
      statusLabel: "Requested",
      primaryActionLabel: "Requested",
      detail: "Approval request is queued locally and no profile is activated.",
      safety:
        "Local request only. No profile activation or process execution will start from this control.",
      readiness: 100
    });
  });

  it("maps review readiness to review state", () => {
    const snapshot = buildRuntimeProfileApprovalSnapshot(profile, reviewReadiness, "idle");

    expect(snapshot).toEqual({
      id: "runtime-profile-1:approval",
      label: "Draft profile approval",
      intent: "idle",
      state: "review",
      canRequest: true,
      canCancel: false,
      statusLabel: "Review",
      primaryActionLabel: "Request",
      detail: "Approval review can be requested.",
      safety:
        "Local request only. No profile activation or process execution will start from this control.",
      readiness: 60
    });
  });

  it("maps ready readiness to requestable state", () => {
    const snapshot = buildRuntimeProfileApprovalSnapshot(profile, readyReadiness, "idle");

    expect(snapshot).toEqual({
      id: "runtime-profile-1:approval",
      label: "Draft profile approval",
      intent: "idle",
      state: "requestable",
      canRequest: true,
      canCancel: false,
      statusLabel: "Ready",
      primaryActionLabel: "Request",
      detail: "This profile can be requested for approval.",
      safety:
        "Local request only. No profile activation or process execution will start from this control.",
      readiness: 100
    });
  });

  it("does not mutate profile or readiness inputs", () => {
    const baselineProfile = JSON.parse(JSON.stringify(profile));
    const baselineReadiness = JSON.parse(JSON.stringify(readyReadiness));

    buildRuntimeProfileApprovalSnapshot(profile, readyReadiness, "requested");

    expect(profile).toEqual(baselineProfile);
    expect(readyReadiness).toEqual(baselineReadiness);
  });
});
