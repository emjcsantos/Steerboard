import { describe, expect, it } from "vitest";
import {
  createBlankRuntimeProfile,
  evaluateRuntimeProfileReadiness,
  type RuntimeProfile,
  type RuntimeWorkspaceMode
} from "./runtimeProfile";

describe("runtime profile model", () => {
  const readyProfile: RuntimeProfile = {
    id: "ready-profile",
    label: "Ready profile",
    adapterId: "adapter-1",
    transport: "remote-endpoint",
    command: "",
    args: [],
    workspaceMode: "read-write" as RuntimeWorkspaceMode,
    permissionState: [{ permission: "workspace_write", status: "enabled" }],
    enabled: true,
    capabilities: ["sessions", "tasks"],
    requiredPermissions: ["workspace_write"]
  };

  it("builds a safe blank runtime profile draft with defaults", () => {
    expect(createBlankRuntimeProfile()).toEqual({
      id: "runtime-profile-draft",
      adapterId: "",
      label: "Runtime profile draft",
      transport: "local-process",
      command: "",
      args: [],
      workspaceMode: "read-only",
      permissionState: [],
      enabled: false,
      capabilities: [],
      requiredPermissions: []
    });
  });

  it("returns a ready summary for a fully valid profile", () => {
    expect(evaluateRuntimeProfileReadiness(readyProfile)).toEqual({
      state: "ready",
      readiness: 100,
      reasons: [],
      safety: "No process execution is performed while evaluating this profile."
    });
  });

  it("blocks readiness when profile is disabled", () => {
    expect(
      evaluateRuntimeProfileReadiness({
        ...readyProfile,
        enabled: false
      })
    ).toMatchObject({
      state: "blocked",
      readiness: 0,
      reasons: ["Profile execution is disabled."],
      safety: "No process execution is performed while evaluating this profile."
    });
  });

  it("blocks readiness when local-process transport is missing a command", () => {
    expect(
      evaluateRuntimeProfileReadiness({
        ...readyProfile,
        transport: "local-process",
        command: "   ",
        enabled: true
      })
    ).toMatchObject({
      state: "blocked",
      readiness: 0,
      reasons: ["Local-process transport requires a command."],
      safety: "No process execution is performed while evaluating this profile."
    });
  });

  it("marks missing required permissions as review", () => {
    expect(
      evaluateRuntimeProfileReadiness({
        ...readyProfile,
        requiredPermissions: ["workspace_write", "network_access"]
      })
    ).toMatchObject({
      state: "review",
      readiness: 60,
      reasons: ['Permission "network_access" requires review or approval.'],
      safety: "No process execution is performed while evaluating this profile."
    });
  });

  it("keeps reasons stable with deterministic ordering and deduping", () => {
    expect(
      evaluateRuntimeProfileReadiness({
        ...readyProfile,
        transport: "remote-endpoint",
        requiredPermissions: ["b", "a", "a", "c", "b"],
        permissionState: [
          { permission: "a", status: "review" },
          { permission: "b", status: "blocked" }
        ]
      })
    ).toEqual({
      state: "blocked",
      readiness: 0,
      reasons: [
        'Permission "b" is blocked.',
        'Permission "a" requires review or approval.',
        'Permission "c" requires review or approval.'
      ],
      safety: "No process execution is performed while evaluating this profile."
    });
  });
});
