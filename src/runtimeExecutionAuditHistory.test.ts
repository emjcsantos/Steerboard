import { describe, expect, it, vi } from "vitest";
import type { RuntimeExecutionAuditSnapshot } from "./runtimeExecutionAudit";
import {
  appendRuntimeExecutionAuditRecord,
  createRuntimeExecutionAuditRecord,
  EXECUTION_AUDIT_HISTORY_STORAGE_KEY,
  loadRuntimeExecutionAuditHistory,
  parseStoredRuntimeExecutionAuditHistory,
  saveRuntimeExecutionAuditHistory,
  type RuntimeExecutionAuditRecord,
  type RuntimeExecutionAuditRecordAction
} from "./runtimeExecutionAuditHistory";

const baseAuditSnapshot: RuntimeExecutionAuditSnapshot = {
  id: "source-1:approval:execution-audit",
  label: "Primary source approval execution audit",
  state: "waiting",
  statusLabel: "Waiting",
  eventCount: 2,
  transport: "runtime-transport",
  canExecute: false,
  executionLocked: true,
  requiresDesktopApproval: true,
  detail: "Execution remains locked in preview mode.",
  safety: "Local-only preview safety marker.",
  items: []
};

function makeRecord(
  id: string,
  action: RuntimeExecutionAuditRecordAction = "requested"
): RuntimeExecutionAuditRecord {
  return {
    id,
    auditId: "source-1:approval:execution-audit",
    action,
    createdAt: "2026-06-04T00:00:00.000Z",
    statusLabel: "Waiting",
    eventCount: 2,
    transport: "runtime-transport",
    executionLocked: true,
    detail: "Execution remains locked in preview mode."
  };
}

describe("runtime execution audit history", () => {
  it("creates deterministic requested record", () => {
    const createdAt = "2026-06-04T08:15:00.000Z";
    const record = createRuntimeExecutionAuditRecord(baseAuditSnapshot, "requested", createdAt);

    expect(record).toEqual({
      id: `${baseAuditSnapshot.id}:requested:${createdAt}`,
      auditId: baseAuditSnapshot.id,
      action: "requested",
      createdAt,
      statusLabel: "Waiting",
      eventCount: 2,
      transport: "runtime-transport",
      executionLocked: true,
      detail: "Execution remains locked in preview mode."
    });
  });

  it("creates cancelled record", () => {
    const createdAt = "2026-06-04T08:16:00.000Z";
    const record = createRuntimeExecutionAuditRecord(baseAuditSnapshot, "cancelled", createdAt);

    expect(record.action).toBe("cancelled");
    expect(record.id).toBe(`${baseAuditSnapshot.id}:cancelled:${createdAt}`);
  });

  it("appends newest first, dedupes by id, and respects limit", () => {
    const existingRecords = [makeRecord("a"), makeRecord("b"), makeRecord("c"), makeRecord("d"), makeRecord("e")];
    const newest = {
      ...makeRecord("c"),
      statusLabel: "Pending"
    };

    expect(
      appendRuntimeExecutionAuditRecord(existingRecords, newest, 3).map((record) => record.id)
    ).toEqual(["c", "a", "b"]);
  });

  it("parses invalid/null/non-array entries as an empty list", () => {
    expect(parseStoredRuntimeExecutionAuditHistory(null)).toEqual([]);
    expect(parseStoredRuntimeExecutionAuditHistory("{")).toEqual([]);
    expect(parseStoredRuntimeExecutionAuditHistory('{"a":1}')).toEqual([]);
    expect(parseStoredRuntimeExecutionAuditHistory("1")).toEqual([]);
    expect(parseStoredRuntimeExecutionAuditHistory("[]")).toEqual([]);
  });

  it("repairs malformed records, dedupes by id, and respects limit", () => {
    expect(
      parseStoredRuntimeExecutionAuditHistory(
        JSON.stringify([
          makeRecord("first"),
          {
            ...makeRecord("duplicate"),
            detail: ""
          },
          {
            ...makeRecord("second"),
            action: "invalid" as RuntimeExecutionAuditRecordAction
          },
          {
            id: "ignored",
            auditId: "source-1:execution-audit",
            action: "requested",
            createdAt: "2026-06-04T00:00:00.001Z",
            statusLabel: "Waiting",
            eventCount: 2,
            transport: "runtime-transport",
            executionLocked: true,
            detail: "Fallback"
          },
          makeRecord("first")
        ]),
        2
      )
    ).toEqual([
      makeRecord("first"),
      {
        id: "ignored",
        auditId: "source-1:execution-audit",
        action: "requested",
        createdAt: "2026-06-04T00:00:00.001Z",
        statusLabel: "Waiting",
        eventCount: 2,
        transport: "runtime-transport",
        executionLocked: true,
        detail: "Fallback"
      }
    ]);
  });

  it("does not mutate input records or snapshot", () => {
    const snapshot = { ...baseAuditSnapshot } as RuntimeExecutionAuditSnapshot;
    const snapshotCopy = JSON.parse(JSON.stringify(snapshot));
    const records = [makeRecord("a"), makeRecord("b")];
    const recordsCopy = JSON.parse(JSON.stringify(records));

    createRuntimeExecutionAuditRecord(snapshot, "requested", "2026-06-04T00:00:00.000Z");
    appendRuntimeExecutionAuditRecord(records, makeRecord("c"));

    expect(snapshot).toEqual(snapshotCopy);
    expect(records).toEqual(recordsCopy);
  });

  it("no-ops load and save when window is unavailable", () => {
    vi.stubGlobal("window", undefined);

    expect(loadRuntimeExecutionAuditHistory()).toEqual([]);
    expect(saveRuntimeExecutionAuditHistory([makeRecord("save")])).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("saves and loads with the expected storage key", () => {
    const setItem = vi.fn();
    const getItem = vi.fn();

    vi.stubGlobal("window", {
      localStorage: {
        getItem,
        setItem
      }
    });

    const records = [makeRecord("one")];
    saveRuntimeExecutionAuditHistory(records);
    expect(setItem).toHaveBeenCalledWith(
      EXECUTION_AUDIT_HISTORY_STORAGE_KEY,
      JSON.stringify(records)
    );

    getItem.mockReturnValue(JSON.stringify(records));
    expect(loadRuntimeExecutionAuditHistory()).toEqual(records);
    expect(getItem).toHaveBeenCalledWith(EXECUTION_AUDIT_HISTORY_STORAGE_KEY);

    vi.unstubAllGlobals();
  });
});
