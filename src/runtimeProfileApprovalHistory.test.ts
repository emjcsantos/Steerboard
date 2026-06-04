import { describe, expect, it, vi } from "vitest";
import type { RuntimeProfileApprovalSnapshot } from "./runtimeProfileApproval";
import {
  appendRuntimeProfileApprovalRecord,
  createRuntimeProfileApprovalRecord,
  PROFILE_APPROVAL_HISTORY_STORAGE_KEY,
  loadRuntimeProfileApprovalHistory,
  parseStoredRuntimeProfileApprovalHistory,
  saveRuntimeProfileApprovalHistory,
  type RuntimeProfileApprovalRecordAction
} from "./runtimeProfileApprovalHistory";

const baseApprovalSnapshot: RuntimeProfileApprovalSnapshot = {
  id: "runtime-profile-1:approval",
  label: "Draft profile approval",
  intent: "idle",
  state: "requestable",
  canRequest: true,
  canCancel: false,
  statusLabel: "Ready",
  primaryActionLabel: "Request",
  detail: "Approval review can be requested in local preview mode.",
  safety: "Local request only.",
  readiness: 100
};

function makeRecord(
  id: string,
  action: RuntimeProfileApprovalRecordAction = "requested"
): ReturnType<typeof createRuntimeProfileApprovalRecord> {
  return {
    id,
    approvalId: "runtime-profile-1:approval",
    action,
    createdAt: "2026-06-04T00:00:00.000Z",
    statusLabel: "Ready",
    readiness: 100,
    detail: `Action ${action}`
  };
}

describe("runtime profile approval history", () => {
  it("creates deterministic approval record", () => {
    const createdAt = "2026-06-04T08:15:00.000Z";
    const record = createRuntimeProfileApprovalRecord(baseApprovalSnapshot, "requested", createdAt);

    expect(record).toEqual({
      id: `${baseApprovalSnapshot.id}:requested:${createdAt}`,
      approvalId: baseApprovalSnapshot.id,
      action: "requested",
      createdAt,
      statusLabel: baseApprovalSnapshot.statusLabel,
      readiness: baseApprovalSnapshot.readiness,
      detail: baseApprovalSnapshot.detail
    });
  });

  it("creates cancelled record", () => {
    const createdAt = "2026-06-04T08:16:00.000Z";
    const record = createRuntimeProfileApprovalRecord(baseApprovalSnapshot, "cancelled", createdAt);

    expect(record.action).toBe("cancelled");
    expect(record.id).toBe(`${baseApprovalSnapshot.id}:cancelled:${createdAt}`);
  });

  it("appends newest first, dedupes by id, and honors limit", () => {
    const existing = [makeRecord("a"), makeRecord("b"), makeRecord("c"), makeRecord("d")];
    const newest = {
      ...makeRecord("b"),
      statusLabel: "Requested"
    };

    expect(
      appendRuntimeProfileApprovalRecord(existing, newest, 3).map((record) => record.id)
    ).toEqual(["b", "a", "c"]);
  });

  it("returns empty arrays for zero or negative limits", () => {
    expect(appendRuntimeProfileApprovalRecord([makeRecord("a")], makeRecord("b"), 0)).toEqual([]);
    expect(parseStoredRuntimeProfileApprovalHistory(JSON.stringify([makeRecord("a")]), -2)).toEqual([]);
  });

  it("defaults invalid limits to 8", () => {
    const records = [
      makeRecord("a"),
      makeRecord("b"),
      makeRecord("c"),
      makeRecord("d"),
      makeRecord("e"),
      makeRecord("f"),
      makeRecord("g"),
      makeRecord("h"),
      makeRecord("i")
    ];

    expect(
      appendRuntimeProfileApprovalRecord(records, records[0], Number.NaN).map((record) => record.id)
    ).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h"
    ]);

    const serialized = JSON.stringify(records);
    expect(parseStoredRuntimeProfileApprovalHistory(serialized, Number.NaN).map((record) => record.id))
      .toHaveLength(8);
  });

  it("parses malformed records, dedupes by id, and respects limit", () => {
    expect(
      parseStoredRuntimeProfileApprovalHistory(
        JSON.stringify([
          makeRecord("first"),
          {
            ...makeRecord("duplicate-id"),
            readiness: Number.NaN
          },
          {
            ...makeRecord("second"),
            action: "invalid" as RuntimeProfileApprovalRecordAction
          },
          {
            id: "third",
            approvalId: "runtime-profile-1:approval",
            action: "requested",
            createdAt: "2026-06-04T00:00:00.001Z",
            statusLabel: "Ready",
            readiness: 90,
            detail: "Fallback"
          },
          makeRecord("first")
        ]),
        2
      )
    ).toEqual([
      makeRecord("first"),
      {
        id: "third",
        approvalId: "runtime-profile-1:approval",
        action: "requested",
        createdAt: "2026-06-04T00:00:00.001Z",
        statusLabel: "Ready",
        readiness: 90,
        detail: "Fallback"
      }
    ]);
  });

  it("returns [] for malformed serialized history", () => {
    expect(parseStoredRuntimeProfileApprovalHistory(null)).toEqual([]);
    expect(parseStoredRuntimeProfileApprovalHistory("{", 3)).toEqual([]);
    expect(parseStoredRuntimeProfileApprovalHistory("{\"a\":1}", 3)).toEqual([]);
    expect(parseStoredRuntimeProfileApprovalHistory("1", 3)).toEqual([]);
    expect(parseStoredRuntimeProfileApprovalHistory("[]", 3)).toEqual([]);
  });

  it("does not mutate input records or snapshot when creating/appending", () => {
    const snapshot = { ...baseApprovalSnapshot } as RuntimeProfileApprovalSnapshot;
    const snapshotCopy = JSON.parse(JSON.stringify(snapshot));

    const records = [makeRecord("a"), makeRecord("b")];
    const recordsCopy = JSON.parse(JSON.stringify(records));

    createRuntimeProfileApprovalRecord(snapshot, "cancelled", "2026-06-04T00:00:00.002Z");
    appendRuntimeProfileApprovalRecord(records, makeRecord("c"));

    expect(snapshot).toEqual(snapshotCopy);
    expect(records).toEqual(recordsCopy);
  });

  it("returns [] and no-ops when window is unavailable", () => {
    vi.stubGlobal("window", undefined);

    expect(loadRuntimeProfileApprovalHistory()).toEqual([]);
    expect(saveRuntimeProfileApprovalHistory([makeRecord("one")])).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("returns [] and no-ops when localStorage is unavailable", () => {
    vi.stubGlobal("window", {
      localStorage: undefined
    });

    expect(loadRuntimeProfileApprovalHistory()).toEqual([]);
    expect(saveRuntimeProfileApprovalHistory([makeRecord("one")])).toBeUndefined();

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

    saveRuntimeProfileApprovalHistory(records);
    expect(setItem).toHaveBeenCalledWith(
      PROFILE_APPROVAL_HISTORY_STORAGE_KEY,
      JSON.stringify(records)
    );

    getItem.mockReturnValue(JSON.stringify(records));
    expect(loadRuntimeProfileApprovalHistory()).toEqual(records);
    expect(getItem).toHaveBeenCalledWith(PROFILE_APPROVAL_HISTORY_STORAGE_KEY);

    vi.unstubAllGlobals();
  });

  it("falls back to [] and ignores localStorage write failures", () => {
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

    expect(loadRuntimeProfileApprovalHistory()).toEqual([]);
    expect(saveRuntimeProfileApprovalHistory([makeRecord("retry")])).toBeUndefined();

    vi.unstubAllGlobals();
  });
});
