import { afterEach, describe, expect, it, vi } from "vitest";
import { createBlankRuntimeProfile, type RuntimeProfile } from "./runtimeProfile";
import {
  loadRuntimeProfileDraft,
  repairRuntimeProfileDraft,
  saveRuntimeProfileDraft
} from "./runtimeProfileDraftStorage";

describe("runtime profile draft storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns repaired fallback profile when window is unavailable", () => {
    vi.stubGlobal("window", undefined);

    expect(loadRuntimeProfileDraft()).toEqual(
      createBlankRuntimeProfile({
        id: "runtime-profile-draft",
        label: "Runtime profile draft"
      })
    );
  });

  it("repairs malformed values into safe, typed profile fields", () => {
    const fallback = createBlankRuntimeProfile({
      id: "runtime-profile-fallback",
      label: "Fallback runtime profile draft"
    });

    const repaired = repairRuntimeProfileDraft(
      {
        id: "  edited-draft-id  ",
        label: "Edited profile",
        adapterId: 22,
        transport: "invalid",
        command: 2026,
        args: [" one ", "", "  two", 3, null],
        workspaceMode: "invalid-mode",
        permissionState: [
          { permission: " camera", status: "enabled" },
          { permission: "   ", status: "blocked" },
          { permission: " network", status: "invalid" },
          "bad-entry",
          { permission: "clipboard", status: "blocked" }
        ],
        enabled: 1,
        capabilities: [" inspect ", "", 5],
        requiredPermissions: [" net ", null, "   ", "fs "]
      },
      fallback
    );

    expect(repaired).toEqual({
      id: "edited-draft-id",
      label: "Edited profile",
      adapterId: fallback.adapterId,
      transport: fallback.transport,
      command: fallback.command,
      args: ["one", "two"],
      workspaceMode: fallback.workspaceMode,
      permissionState: [
        { permission: "camera", status: "enabled" },
        { permission: "network", status: "review" },
        { permission: "clipboard", status: "blocked" }
      ],
      enabled: false,
      capabilities: ["inspect"],
      requiredPermissions: ["net", "fs"]
    });
  });

  it("saves and loads a repaired profile roundtrip using mocked localStorage", () => {
    const storage: { value: string | null } = { value: null };
    const getItem = vi.fn(() => storage.value);
    const setItem = vi.fn((_, value: string) => {
      storage.value = value;
    });

    vi.stubGlobal("window", {
      localStorage: {
        getItem,
        setItem
      }
    });

    const draft: RuntimeProfile = {
      ...createBlankRuntimeProfile(),
      id: "runtime-profile-roundtrip",
      label: "Roundtrip",
      adapterId: "draft-adapter",
      transport: "remote-endpoint",
      command: "npm run dev",
      args: [" --port 3000"],
      workspaceMode: "read-write",
      permissionState: [{ permission: "network_access", status: "enabled" }],
      enabled: true,
      capabilities: [" sessions ", ""],
      requiredPermissions: [" network ", ""]
    };

    saveRuntimeProfileDraft(draft);
    expect(setItem).toHaveBeenCalledWith(
      "steerboard.runtimeProfileDraft.v1",
      JSON.stringify(repairRuntimeProfileDraft(draft))
    );

    storage.value = JSON.stringify(repairRuntimeProfileDraft(draft));
    expect(loadRuntimeProfileDraft()).toEqual(repairRuntimeProfileDraft(draft));
  });

  it("falls back on read errors and no-ops on write errors", () => {
    const getItem = vi.fn(() => {
      throw new Error("read failed");
    });
    const setItem = vi.fn(() => {
      throw new Error("write failed");
    });

    vi.stubGlobal("window", {
      localStorage: {
        getItem,
        setItem
      }
    });

    const defaultProfile = createBlankRuntimeProfile({
      id: "runtime-profile-fallback",
      label: "Fallback runtime profile draft"
    });

    expect(loadRuntimeProfileDraft(defaultProfile)).toEqual(defaultProfile);

    expect(() =>
      saveRuntimeProfileDraft({
        ...defaultProfile,
        id: "saved-draft",
        adapterId: "adapter"
      })
    ).not.toThrow();
    expect(setItem).toHaveBeenCalled();
  });

  it("repairs defensive non-array fields into arrays", () => {
    const repaired = repairRuntimeProfileDraft(
      {
        id: "runtime-profile-defensive",
        label: "Defensive",
        adapterId: "adapter",
        transport: "local-process",
        command: "echo",
        args: "not-an-array",
        workspaceMode: "read-only",
        permissionState: "invalid",
        enabled: true,
        capabilities: null,
        requiredPermissions: 123
      },
      createBlankRuntimeProfile()
    );

    expect(repaired.args).toEqual([]);
    expect(repaired.permissionState).toEqual([]);
    expect(repaired.capabilities).toEqual([]);
    expect(repaired.requiredPermissions).toEqual([]);
  });

  it("falls back for blank identity fields and trims optional text fields", () => {
    const fallback = createBlankRuntimeProfile({
      id: "runtime-profile-fallback",
      label: "Fallback profile",
      adapterId: "fallback-adapter",
      command: "fallback-command"
    });

    expect(
      repairRuntimeProfileDraft(
        {
          id: "   ",
          label: "",
          adapterId: " draft-adapter ",
          command: " npm run preview "
        },
        fallback
      )
    ).toMatchObject({
      id: "runtime-profile-fallback",
      label: "Fallback profile",
      adapterId: "draft-adapter",
      command: "npm run preview"
    });
  });
});
