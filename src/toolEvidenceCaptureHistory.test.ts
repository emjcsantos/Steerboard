import { describe, expect, it, vi } from "vitest";
import type { ToolEvidenceReadinessSnapshot } from "./toolEvidenceReadiness";
import type { ToolEvidenceCaptureRecordAction } from "./toolEvidenceCaptureHistory";
import {
  appendToolEvidenceCaptureRecord,
  createToolEvidenceCaptureRecord,
  TOOL_EVIDENCE_CAPTURE_HISTORY_STORAGE_KEY,
  loadToolEvidenceCaptureHistory,
  parseStoredToolEvidenceCaptureHistory,
  saveToolEvidenceCaptureHistory
} from "./toolEvidenceCaptureHistory";

const baseSnapshot: ToolEvidenceReadinessSnapshot = {
  id: "tool-evidence-readiness",
  label: "Terminal and Git evidence readiness",
  state: "waiting",
  statusLabel: "Waiting",
  readiness: 60,
  terminalLocked: true,
  gitLocked: true,
  canCapture: false,
  detail: "Terminal and Git readiness is being evaluated.",
  safety: "Local-only preview safety.",
  items: []
};

function makeRecord(
  id: string,
  action: ToolEvidenceCaptureRecordAction = "requested"
) {
  return {
    id,
    readinessId: baseSnapshot.id,
    action,
    createdAt: "2026-06-04T00:00:00.000Z",
    statusLabel: "Waiting",
    readiness: 60,
    terminalLocked: true,
    gitLocked: true,
    canCapture: false,
    detail: `Action ${action}`
  };
}

describe("tool evidence capture history", () => {
  it("creates capture record from readiness snapshot", () => {
    const createdAt = "2026-06-04T08:15:00.000Z";
    const record = createToolEvidenceCaptureRecord(baseSnapshot, "requested", createdAt);

    expect(record).toEqual({
      id: `${baseSnapshot.id}:requested:${createdAt}`,
      readinessId: baseSnapshot.id,
      action: "requested",
      createdAt,
      statusLabel: "Waiting",
      readiness: 60,
      terminalLocked: true,
      gitLocked: true,
      canCapture: false,
      detail: "Terminal and Git readiness is being evaluated."
    });
  });

  it("appends newest first, dedupes by id, and respects limit", () => {
    const existing = [makeRecord("b"), makeRecord("c"), makeRecord("d"), makeRecord("e")];
    const newest = {
      ...makeRecord("b"),
      statusLabel: "Requested"
    };

    expect(appendToolEvidenceCaptureRecord(existing, newest, 3).map((record) => record.id))
      .toEqual(["b", "c", "d"]);
  });

  it("returns [] for zero and negative append/parse limits", () => {
    expect(appendToolEvidenceCaptureRecord([makeRecord("a")], makeRecord("b"), 0)).toEqual([]);
    expect(appendToolEvidenceCaptureRecord([makeRecord("a")], makeRecord("b"), -1)).toEqual([]);
    expect(parseStoredToolEvidenceCaptureHistory(JSON.stringify([makeRecord("a")]), 0)).toEqual([]);
    expect(parseStoredToolEvidenceCaptureHistory(JSON.stringify([makeRecord("a")]), -1)).toEqual([]);
  });

  it("parses invalid JSON/non-array/malformed histories as empty", () => {
    expect(parseStoredToolEvidenceCaptureHistory(null)).toEqual([]);
    expect(parseStoredToolEvidenceCaptureHistory("{")).toEqual([]);
    expect(parseStoredToolEvidenceCaptureHistory("{\"a\":1}")).toEqual([]);
    expect(parseStoredToolEvidenceCaptureHistory("1")).toEqual([]);
    expect(parseStoredToolEvidenceCaptureHistory("[]")).toEqual([]);
  });

  it("rejects malformed records and strips unknown fields", () => {
    const parsed = parseStoredToolEvidenceCaptureHistory(
      JSON.stringify([
        {
          ...makeRecord("kept"),
          unexpected: "extra"
        },
        {
          ...makeRecord("invalid-readiness"),
          readiness: Number.NaN
        },
        {
          ...makeRecord("invalid-action"),
          action: "invalid" as ToolEvidenceCaptureRecordAction
        },
        {
          ...makeRecord("invalid-boolean"),
          terminalLocked: "false" as unknown as boolean
        }
      ])
    );

    expect(parsed).toEqual([
      {
        id: "kept",
        readinessId: baseSnapshot.id,
        action: "requested",
        createdAt: "2026-06-04T00:00:00.000Z",
        statusLabel: "Waiting",
        readiness: 60,
        terminalLocked: true,
        gitLocked: true,
        canCapture: false,
        detail: "Action requested"
      }
    ]);
  });

  it("dedupes by id and respects limit when parsing", () => {
    expect(
      parseStoredToolEvidenceCaptureHistory(
        JSON.stringify([
          makeRecord("first"),
          makeRecord("second"),
          makeRecord("first"),
          makeRecord("third")
        ]),
        2
      ).map((record) => record.id)
    ).toEqual(["first", "second"]);
  });

  it("does not mutate input records when creating/appending", () => {
    const records = [makeRecord("a"), makeRecord("b")];
    const recordsCopy = JSON.parse(JSON.stringify(records));

    createToolEvidenceCaptureRecord(baseSnapshot, "requested", "2026-06-04T00:00:00.001Z");
    appendToolEvidenceCaptureRecord(records, makeRecord("c"));

    expect(records).toEqual(recordsCopy);
  });

  it("returns [] and no-ops when window is unavailable", () => {
    vi.stubGlobal("window", undefined);

    expect(loadToolEvidenceCaptureHistory()).toEqual([]);
    expect(saveToolEvidenceCaptureHistory([makeRecord("one")])).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("returns [] and no-ops when localStorage is unavailable", () => {
    vi.stubGlobal("window", {
      localStorage: undefined
    });

    expect(loadToolEvidenceCaptureHistory()).toEqual([]);
    expect(saveToolEvidenceCaptureHistory([makeRecord("one")])).toBeUndefined();

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

    const records = [makeRecord("one")];

    saveToolEvidenceCaptureHistory(records);
    expect(setItem).toHaveBeenCalledWith(
      TOOL_EVIDENCE_CAPTURE_HISTORY_STORAGE_KEY,
      JSON.stringify(records)
    );

    getItem.mockReturnValue(JSON.stringify(records));
    expect(loadToolEvidenceCaptureHistory()).toEqual(records);
    expect(getItem).toHaveBeenCalledWith(TOOL_EVIDENCE_CAPTURE_HISTORY_STORAGE_KEY);

    vi.unstubAllGlobals();
  });

  it("falls back to [] and ignores localStorage failures", () => {
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

    expect(loadToolEvidenceCaptureHistory()).toEqual([]);
    expect(saveToolEvidenceCaptureHistory([makeRecord("retry")])).toBeUndefined();

    vi.unstubAllGlobals();
  });
});
