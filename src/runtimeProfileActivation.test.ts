import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildRuntimeProfileActivationSnapshot,
  canActivateRuntimeProfile,
  createRuntimeProfileActivationRecord,
  loadRuntimeProfileActivation,
  parseStoredRuntimeProfileActivation,
  RUNTIME_PROFILE_ACTIVATION_STORAGE_KEY,
  saveRuntimeProfileActivation
} from "./runtimeProfileActivation";
import { type RuntimeProfile, type RuntimeProfileReadiness } from "./runtimeProfile";

const profile: RuntimeProfile = {
  id: "runtime-profile-1",
  label: "Runtime profile",
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

const readyReadiness: RuntimeProfileReadiness = {
  state: "ready",
  readiness: 100,
  reasons: [],
  safety: "No process execution is performed while evaluating this profile."
};

const blockedReadiness: RuntimeProfileReadiness = {
  state: "blocked",
  readiness: 0,
  reasons: ["Missing command."],
  safety: "No process execution is performed while evaluating this profile."
};

const reviewReadiness: RuntimeProfileReadiness = {
  state: "review",
  readiness: 60,
  reasons: ["Requires manual review."],
  safety: "No process execution is performed while evaluating this profile."
};

describe("runtime profile activation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates an active snapshot only when profile is ready and timestamp is provided", () => {
    const activatedAt = "2026-06-04T09:00:00.000Z";
    const snapshot = createRuntimeProfileActivationRecord(profile, readyReadiness, activatedAt);

    expect(snapshot).toEqual({
      id: "runtime-profile-1:activation",
      profileId: "runtime-profile-1",
      profileLabel: "Runtime profile",
      adapterId: "local",
      transport: "local-process",
      workspaceMode: "read-only",
      readiness: 100,
      state: "active",
      statusLabel: "Active",
      detail:
        "Profile activation is tracked as local cockpit state only and does not execute processes.",
      safety:
        "Local cockpit state only. No process execution is performed by this activation helper.",
      activatedAt
    });
  });

  it("creates a blocked snapshot for non-ready profiles with no activatedAt", () => {
    expect(canActivateRuntimeProfile(blockedReadiness)).toBe(false);
    expect(canActivateRuntimeProfile(reviewReadiness)).toBe(false);

    const snapshot = buildRuntimeProfileActivationSnapshot(profile, reviewReadiness);
    expect(snapshot).toEqual({
      id: "runtime-profile-1:activation",
      profileId: "runtime-profile-1",
      profileLabel: "Runtime profile",
      adapterId: "local",
      transport: "local-process",
      workspaceMode: "read-only",
      readiness: 60,
      state: "blocked",
      statusLabel: "Blocked",
      detail:
        "Profile activation is blocked due to readiness status. This is local state only and does not execute processes.",
      safety:
        "Local cockpit state only. No process execution is performed by this activation helper.",
      activatedAt: undefined
    });
  });

  it("returns undefined for invalid stored snapshots", () => {
    expect(parseStoredRuntimeProfileActivation(null)).toBeUndefined();
    expect(parseStoredRuntimeProfileActivation("{")).toBeUndefined();
    expect(parseStoredRuntimeProfileActivation("[]")).toBeUndefined();
    expect(parseStoredRuntimeProfileActivation("1")).toBeUndefined();
    expect(
      parseStoredRuntimeProfileActivation(
        JSON.stringify({
          id: "runtime-profile-1:activation",
          profileId: "runtime-profile-1",
          profileLabel: "Runtime profile",
          adapterId: "local",
          transport: "local-process",
          workspaceMode: "read-only",
          readiness: Number.POSITIVE_INFINITY,
          state: "active",
          statusLabel: "Active",
          detail: "Should be ignored",
          safety: "Local-only."
        })
      )
    ).toBeUndefined();

    expect(
      parseStoredRuntimeProfileActivation(
        JSON.stringify({
          id: "runtime-profile-1:activation",
          profileId: "",
          profileLabel: "Runtime profile",
          adapterId: "local",
          transport: "local-process",
          workspaceMode: "read-only",
          readiness: 100,
          state: "active",
          statusLabel: "Active",
          detail: "Profile activation is ready.",
          safety: "Local cockpit state only. No process execution is performed by this activation helper.",
          activatedAt: "2026-06-04T09:00:00.000Z"
        })
      )
    ).toBeUndefined();

    expect(
      parseStoredRuntimeProfileActivation(
        JSON.stringify({
          id: "runtime-profile-1",
          profileId: "runtime-profile-1",
          profileLabel: "Runtime profile",
          adapterId: "local",
          transport: "local-process",
          workspaceMode: "read-only",
          readiness: 100,
          state: "active",
          statusLabel: "Active",
          detail: "Profile activation is active.",
          safety: "Local cockpit state only. No process execution is performed by this activation helper.",
          activatedAt: "2026-06-04T09:00:00.000Z"
        })
      )
    ).toBeUndefined();

    expect(
      parseStoredRuntimeProfileActivation(
        JSON.stringify({
          id: "runtime-profile-1:activation",
          profileId: "runtime-profile-1",
          profileLabel: "Runtime profile",
          adapterId: "local",
          transport: "invalid",
          workspaceMode: "read-only",
          readiness: 100,
          state: "inactive",
          statusLabel: "Inactive",
          detail: "Profile is ready locally and does not execute processes.",
          safety: "Local cockpit state only. No process execution is performed by this activation helper."
        })
      )
    ).toBeUndefined();

    expect(
      parseStoredRuntimeProfileActivation(
        JSON.stringify({
          id: "runtime-profile-1:activation",
          profileId: "runtime-profile-1",
          profileLabel: "Runtime profile",
          adapterId: "local",
          transport: "local-process",
          workspaceMode: "read-only",
          readiness: 60,
          state: "active",
          statusLabel: "Active",
          detail: "Profile is ready locally and does not execute processes.",
          safety: "Local cockpit state only. No process execution is performed by this activation helper.",
          activatedAt: "2026-06-04T09:00:00.000Z"
        })
      )
    ).toBeUndefined();

    expect(
      parseStoredRuntimeProfileActivation(
        JSON.stringify({
          id: "runtime-profile-1:activation",
          profileId: "runtime-profile-1",
          profileLabel: "Runtime profile",
          adapterId: "local",
          transport: "local-process",
          workspaceMode: "read-only",
          readiness: 100,
          state: "inactive",
          statusLabel: "Inactive",
          detail: "Profile is ready locally and does not execute processes.",
          safety: "Local cockpit state only. No process execution is performed by this activation helper.",
          activatedAt: "2026-06-04T09:00:00.000Z"
        })
      )
    ).toBeUndefined();
  });

  it("handles missing localStorage and localStorage errors without throwing", () => {
    vi.stubGlobal("window", undefined);
    const snapshot = createRuntimeProfileActivationRecord(profile, readyReadiness, "2026-06-04T09:00:00.000Z");

    expect(loadRuntimeProfileActivation()).toBeUndefined();
    expect(saveRuntimeProfileActivation(snapshot)).toBeUndefined();

    const getItem = vi.fn(() => {
      throw new Error("read failed");
    });
    const setItem = vi.fn(() => {
      throw new Error("write failed");
    });
    const removeItem = vi.fn(() => {
      throw new Error("remove failed");
    });

    vi.stubGlobal("window", {
      localStorage: {
        getItem,
        setItem,
        removeItem
      }
    });

    expect(loadRuntimeProfileActivation()).toBeUndefined();
    expect(saveRuntimeProfileActivation(snapshot)).toBeUndefined();
    expect(saveRuntimeProfileActivation(undefined)).toBeUndefined();
  });

  it("roundtrips a valid activation snapshot through save and load", () => {
    const storage: { value: string | null } = { value: null };
    const getItem = vi.fn(() => storage.value);
    const setItem = vi.fn((_, value: string) => {
      storage.value = value;
    });
    const removeItem = vi.fn();

    vi.stubGlobal("window", {
      localStorage: {
        getItem,
        setItem,
        removeItem
      }
    });

    const snapshot = buildRuntimeProfileActivationSnapshot(profile, readyReadiness, "2026-06-04T09:00:00.000Z");
    saveRuntimeProfileActivation(snapshot);

    expect(setItem).toHaveBeenCalledWith(
      RUNTIME_PROFILE_ACTIVATION_STORAGE_KEY,
      JSON.stringify(snapshot)
    );
    expect(loadRuntimeProfileActivation()).toEqual(snapshot);
    storage.value = JSON.stringify(snapshot);
    expect(loadRuntimeProfileActivation()).toEqual(snapshot);
    expect(getItem).toHaveBeenCalledWith(RUNTIME_PROFILE_ACTIVATION_STORAGE_KEY);
  });

  it("clears activation storage when snapshot is undefined", () => {
    const getItem = vi.fn(() => null);
    const setItem = vi.fn();
    const removeItem = vi.fn();

    vi.stubGlobal("window", {
      localStorage: {
        getItem,
        setItem,
        removeItem
      }
    });

    saveRuntimeProfileActivation(undefined);

    expect(removeItem).toHaveBeenCalledWith(RUNTIME_PROFILE_ACTIVATION_STORAGE_KEY);
    expect(setItem).not.toHaveBeenCalled();
  });
});
