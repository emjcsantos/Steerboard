import { describe, expect, it, vi } from "vitest";
import type { RuntimeProfilePermissionHandoffSnapshot } from "./runtimeProfilePermissionHandoff";
import {
  appendRuntimeProfilePermissionRequestRecord,
  createRuntimeProfilePermissionRequestRecord,
  RUNTIME_PROFILE_PERMISSION_REQUEST_HISTORY_STORAGE_KEY,
  loadRuntimeProfilePermissionRequestHistory,
  parseStoredRuntimeProfilePermissionRequestHistory,
  saveRuntimeProfilePermissionRequestHistory,
  type RuntimeProfilePermissionRequestAction,
  type RuntimeProfilePermissionRequestRecord
} from "./runtimeProfilePermissionRequestHistory";

const basePermissionHandoffSnapshot: RuntimeProfilePermissionHandoffSnapshot = {
  id: "runtime-profile-1:permission-handoff",
  label: "Runtime profile permission handoff",
  state: "ready",
  statusLabel: "Ready",
  detail: "Runtime profile permission handoff can be requested.",
  safety: "No process execution, filesystem action, or network action is performed by this handoff preview.",
  readiness: 100,
  bridgeState: "ready",
  bridgeSource: "desktop",
  profileId: "runtime-profile-1",
  profileLabel: "Runtime profile one",
  canRequestPermission: true,
  processExecutionAvailable: true,
  workspaceAccessAvailable: true
};

function makeRecord(
  id: string,
  action: RuntimeProfilePermissionRequestAction = "requested"
): RuntimeProfilePermissionRequestRecord {
  return {
    id,
    handoffId: "runtime-profile-1:permission-handoff",
    action,
    createdAt: "2026-06-04T00:00:00.000Z",
    statusLabel: "Ready",
    readiness: 100,
    detail: "Runtime profile permission handoff can be requested.",
    bridgeState: "ready",
    bridgeSource: "desktop"
  };
}

describe("runtime profile permission request history", () => {
  it("creates deterministic requested and cancelled records", () => {
    const createdAt = "2026-06-04T08:15:00.000Z";
    const requested = createRuntimeProfilePermissionRequestRecord(
      basePermissionHandoffSnapshot,
      "requested",
      createdAt
    );

    expect(requested).toEqual({
      id: `${basePermissionHandoffSnapshot.id}:requested:${createdAt}`,
      handoffId: basePermissionHandoffSnapshot.id,
      action: "requested",
      createdAt,
      statusLabel: basePermissionHandoffSnapshot.statusLabel,
      readiness: basePermissionHandoffSnapshot.readiness,
      detail: basePermissionHandoffSnapshot.detail,
      bridgeState: basePermissionHandoffSnapshot.bridgeState,
      bridgeSource: basePermissionHandoffSnapshot.bridgeSource,
      profileId: basePermissionHandoffSnapshot.profileId,
      profileLabel: basePermissionHandoffSnapshot.profileLabel
    });

    const cancelledAt = "2026-06-04T08:16:00.000Z";
    const cancelled = createRuntimeProfilePermissionRequestRecord(
      basePermissionHandoffSnapshot,
      "cancelled",
      cancelledAt
    );

    expect(cancelled).toEqual({
      id: `${basePermissionHandoffSnapshot.id}:cancelled:${cancelledAt}`,
      handoffId: basePermissionHandoffSnapshot.id,
      action: "cancelled",
      createdAt: cancelledAt,
      statusLabel: basePermissionHandoffSnapshot.statusLabel,
      readiness: basePermissionHandoffSnapshot.readiness,
      detail: basePermissionHandoffSnapshot.detail,
      bridgeState: basePermissionHandoffSnapshot.bridgeState,
      bridgeSource: basePermissionHandoffSnapshot.bridgeSource,
      profileId: basePermissionHandoffSnapshot.profileId,
      profileLabel: basePermissionHandoffSnapshot.profileLabel
    });
  });

  it("appends newest-first, dedupes by id, and respects limit", () => {
    const existing = [makeRecord("a"), makeRecord("b"), makeRecord("c")];
    const newest = {
      ...makeRecord("b"),
      detail: "A newer requested profile handoff record."
    };

    expect(
      appendRuntimeProfilePermissionRequestRecord(existing, newest, 2).map(
        (record) => record.id
      )
    ).toEqual(["b", "a"]);
  });

  it("uses limit defaults and returns [] for zero or negative limits", () => {
    const records = [makeRecord("a"), makeRecord("b"), makeRecord("c"), makeRecord("d")];
    const newest = { ...makeRecord("a"), detail: "replacement" };

    expect(appendRuntimeProfilePermissionRequestRecord(records, newest, 0)).toEqual([]);
    expect(appendRuntimeProfilePermissionRequestRecord(records, newest, -1)).toEqual([]);
    expect(parseStoredRuntimeProfilePermissionRequestHistory(JSON.stringify(records), 0)).toEqual([]);
    expect(parseStoredRuntimeProfilePermissionRequestHistory(JSON.stringify(records), -1)).toEqual([]);

    expect(
      appendRuntimeProfilePermissionRequestRecord(records, makeRecord("e"), Number.NaN)
        .map((record) => record.id)
    ).toEqual(["e", "a", "b", "c", "d"]);
  });

  it("filters malformed records and repairs optional profile fields", () => {
    const parsed = parseStoredRuntimeProfilePermissionRequestHistory(
      JSON.stringify([
        {
          ...makeRecord("good-with-profile"),
          profileId: "runtime-profile-1",
          profileLabel: "Runtime profile one"
        },
        {
          ...makeRecord("bad-profile-id-only"),
          profileId: "runtime-profile-2"
        },
        {
          ...makeRecord("bad-profile-label-only"),
          profileLabel: "Runtime profile three"
        },
        {
          ...makeRecord("invalid-readiness"),
          readiness: Number.NaN
        },
        {
          ...makeRecord("duplicate"),
          action: "invalid" as RuntimeProfilePermissionRequestAction
        },
        {
          id: "duplicate",
          handoffId: "runtime-profile-1:permission-handoff",
          action: "requested",
          createdAt: "2026-06-04T00:00:00.002Z",
          statusLabel: "Ready",
          readiness: 100,
          detail: "replacement",
          bridgeState: "ready",
          bridgeSource: "desktop"
        },
        {
          ...makeRecord("invalid-bridge-state"),
          bridgeState: "unsupported" as RuntimeProfilePermissionRequestRecord["bridgeState"]
        }
      ]),
      8
    );

    expect(parsed).toEqual([
      {
        ...makeRecord("good-with-profile"),
        profileId: "runtime-profile-1",
        profileLabel: "Runtime profile one"
      },
      {
        ...makeRecord("bad-profile-id-only")
      },
      {
        ...makeRecord("bad-profile-label-only")
      },
      {
        id: "duplicate",
        handoffId: "runtime-profile-1:permission-handoff",
        action: "requested",
        createdAt: "2026-06-04T00:00:00.002Z",
        statusLabel: "Ready",
        readiness: 100,
        detail: "replacement",
        bridgeState: "ready",
        bridgeSource: "desktop"
      }
    ]);
  });

  it("handles malformed JSON/non-array and invalid limits", () => {
    expect(parseStoredRuntimeProfilePermissionRequestHistory(null)).toEqual([]);
    expect(parseStoredRuntimeProfilePermissionRequestHistory("{", 3)).toEqual([]);
    expect(parseStoredRuntimeProfilePermissionRequestHistory("{\"a\":1}", 3)).toEqual([]);
    expect(parseStoredRuntimeProfilePermissionRequestHistory("1", 3)).toEqual([]);
    expect(parseStoredRuntimeProfilePermissionRequestHistory("[]", 3)).toEqual([]);
    expect(parseStoredRuntimeProfilePermissionRequestHistory(JSON.stringify([makeRecord("a")]), Number.NaN).length).toBe(1);
  });

  it("no-ops safely when local storage is unavailable or throws", () => {
    vi.stubGlobal("window", undefined);

    expect(loadRuntimeProfilePermissionRequestHistory()).toEqual([]);
    expect(saveRuntimeProfilePermissionRequestHistory([makeRecord("one")])).toBeUndefined();

    vi.unstubAllGlobals();

    vi.stubGlobal("window", {
      localStorage: undefined
    });

    expect(loadRuntimeProfilePermissionRequestHistory()).toEqual([]);
    expect(saveRuntimeProfilePermissionRequestHistory([makeRecord("one")])).toBeUndefined();

    vi.unstubAllGlobals();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => {
          throw new Error("get failed");
        }),
        setItem: vi.fn(() => {
          throw new Error("set failed");
        })
      }
    });

    expect(loadRuntimeProfilePermissionRequestHistory()).toEqual([]);
    expect(saveRuntimeProfilePermissionRequestHistory([makeRecord("one")])).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("saves and loads with expected storage key", () => {
    const setItem = vi.fn();
    const getItem = vi.fn();

    vi.stubGlobal("window", {
      localStorage: {
        getItem,
        setItem
      }
    });

    const records = [makeRecord("stored")];

    saveRuntimeProfilePermissionRequestHistory(records);
    expect(setItem).toHaveBeenCalledWith(
      RUNTIME_PROFILE_PERMISSION_REQUEST_HISTORY_STORAGE_KEY,
      JSON.stringify(records)
    );

    getItem.mockReturnValue(JSON.stringify(records));
    expect(loadRuntimeProfilePermissionRequestHistory()).toEqual(records);
    expect(getItem).toHaveBeenCalledWith(
      RUNTIME_PROFILE_PERMISSION_REQUEST_HISTORY_STORAGE_KEY
    );

    vi.unstubAllGlobals();
  });

  it("does not mutate snapshot or records while creating/appending/parsing", () => {
    const snapshot = { ...basePermissionHandoffSnapshot } as RuntimeProfilePermissionHandoffSnapshot;
    const snapshotCopy = JSON.parse(JSON.stringify(snapshot));

    const records = [makeRecord("a"), makeRecord("b")];
    const recordsCopy = JSON.parse(JSON.stringify(records));
    const stored = [makeRecord("from-storage"), makeRecord("stored-bad")];
    const storedCopy = JSON.parse(JSON.stringify(stored));

    createRuntimeProfilePermissionRequestRecord(snapshot, "cancelled", "2026-06-04T08:19:00.000Z");
    appendRuntimeProfilePermissionRequestRecord(records, makeRecord("c"));
    parseStoredRuntimeProfilePermissionRequestHistory(JSON.stringify(stored));

    expect(snapshot).toEqual(snapshotCopy);
    expect(records).toEqual(recordsCopy);
    expect(stored).toEqual(storedCopy);
  });
});
