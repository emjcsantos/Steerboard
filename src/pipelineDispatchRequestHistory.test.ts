import { describe, expect, it, vi } from "vitest";
import type { PipelineItemDispatchPreview } from "./pipelineItemDispatchPreview";
import type { PipelineDispatchRequestAction } from "./pipelineDispatchRequestHistory";
import type { PipelineItem } from "./fixtures";
import type { PipelineItemDispatchPreviewState } from "./pipelineItemDispatchPreview";
import {
  appendPipelineDispatchRequestRecord,
  createPipelineDispatchRequestRecord,
  loadPipelineDispatchRequestHistory,
  parseStoredPipelineDispatchRequestHistory,
  PIPELINE_DISPATCH_REQUEST_HISTORY_STORAGE_KEY,
  savePipelineDispatchRequestHistory,
  type PipelineDispatchRequestRecord
} from "./pipelineDispatchRequestHistory";

const previewBase: PipelineItemDispatchPreview = {
  itemId: "pipe-10",
  title: "Dispatch selected pipeline item",
  stage: "ready" satisfies PipelineItem["stage"],
  readiness: 90,
  risk: "low",
  owner: "Planner",
  state: "ready" as PipelineItemDispatchPreviewState,
  canDispatch: true,
  gates: [],
  detail: "Dispatch is ready."
};

function makeRecord(
  id: string,
  action: PipelineDispatchRequestAction = "requested",
  createdAt = "2026-06-04T00:00:00.000Z"
): PipelineDispatchRequestRecord {
  return {
    id,
    itemId: "pipe-10",
    action,
    createdAt,
    title: "Dispatch selected pipeline item",
    state: "ready",
    readiness: 90,
    risk: "low",
    owner: "Planner",
    canDispatch: true,
    detail: `Action ${action}`
  };
}

describe("pipeline dispatch request history", () => {
  it("creates deterministic dispatch request records from preview", () => {
    const createdAt = "2026-06-04T08:15:00.000Z";
    const record = createPipelineDispatchRequestRecord(previewBase, "requested", createdAt);

    expect(record).toEqual({
      id: `${previewBase.itemId}:requested:${createdAt}`,
      itemId: previewBase.itemId,
      action: "requested",
      createdAt,
      title: previewBase.title,
      state: previewBase.state,
      readiness: previewBase.readiness,
      risk: previewBase.risk,
      owner: previewBase.owner,
      canDispatch: previewBase.canDispatch,
      detail: previewBase.detail
    });
  });

  it("prepends newest, dedupes by id, and enforces limit", () => {
    const existing = [makeRecord("b"), makeRecord("c"), makeRecord("d"), makeRecord("e")];
    const newest = {
      ...makeRecord("b"),
      detail: "Newest version should win"
    };

    expect(appendPipelineDispatchRequestRecord(existing, newest, 3).map((record) => record.id))
      .toEqual(["b", "c", "d"]);
  });

  it("returns [] for zero/negative append and parse limits", () => {
    expect(appendPipelineDispatchRequestRecord([makeRecord("a")], makeRecord("b"), 0)).toEqual([]);
    expect(appendPipelineDispatchRequestRecord([makeRecord("a")], makeRecord("b"), -3)).toEqual([]);
    expect(parseStoredPipelineDispatchRequestHistory(JSON.stringify([makeRecord("a")]), 0)).toEqual([]);
    expect(parseStoredPipelineDispatchRequestHistory(JSON.stringify([makeRecord("a")]), -1)).toEqual([]);
  });

  it("parses invalid JSON/non-array/malformed histories as empty", () => {
    expect(parseStoredPipelineDispatchRequestHistory(null)).toEqual([]);
    expect(parseStoredPipelineDispatchRequestHistory("{")).toEqual([]);
    expect(parseStoredPipelineDispatchRequestHistory("{\"a\":1}")).toEqual([]);
    expect(parseStoredPipelineDispatchRequestHistory("1")).toEqual([]);
    expect(parseStoredPipelineDispatchRequestHistory("[]")).toEqual([]);
  });

  it("drops malformed records, strips unknown fields, and keeps valid record fields", () => {
    const parsed = parseStoredPipelineDispatchRequestHistory(
      JSON.stringify([
        {
          ...makeRecord("kept"),
          unexpected: "field"
        },
        {
          ...makeRecord("invalid-readiness"),
          readiness: Number.NaN
        },
        {
          ...makeRecord("invalid-action"),
          action: "invalid" as PipelineDispatchRequestAction
        },
        {
          ...makeRecord("valid-after-noise"),
          unexpected: { note: "ignored field" }
        }
      ])
    );

    expect(parsed).toEqual([
      {
        id: "kept",
        itemId: "pipe-10",
        action: "requested",
        createdAt: "2026-06-04T00:00:00.000Z",
        title: "Dispatch selected pipeline item",
        state: "ready",
        readiness: 90,
        risk: "low",
        owner: "Planner",
        canDispatch: true,
        detail: "Action requested"
      },
      {
        id: "valid-after-noise",
        itemId: "pipe-10",
        action: "requested",
        createdAt: "2026-06-04T00:00:00.000Z",
        title: "Dispatch selected pipeline item",
        state: "ready",
        readiness: 90,
        risk: "low",
        owner: "Planner",
        canDispatch: true,
        detail: "Action requested"
      }
    ]);
  });

  it("dedupes by id and respects parse limit", () => {
    const parsed = parseStoredPipelineDispatchRequestHistory(
      JSON.stringify([
        makeRecord("first"),
        makeRecord("second"),
        makeRecord("first"),
        makeRecord("third")
      ]),
      2
    );

    expect(parsed.map((record) => record.id)).toEqual(["first", "second"]);
  });

  it("does not mutate preview or records during creation/appending", () => {
    const preview = { ...previewBase, gates: [] } as PipelineItemDispatchPreview;
    const previewCopy = JSON.parse(JSON.stringify(preview));

    const records = [makeRecord("a"), makeRecord("b")];
    const recordsCopy = JSON.parse(JSON.stringify(records));

    createPipelineDispatchRequestRecord(preview, "requested", "2026-06-04T00:00:00.001Z");
    appendPipelineDispatchRequestRecord(records, makeRecord("c"));

    expect(preview).toEqual(previewCopy);
    expect(records).toEqual(recordsCopy);
  });

  it("returns [] and no-ops when window is unavailable", () => {
    vi.stubGlobal("window", undefined);

    expect(loadPipelineDispatchRequestHistory()).toEqual([]);
    expect(savePipelineDispatchRequestHistory([makeRecord("one")])).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("returns [] and no-ops when localStorage is unavailable", () => {
    vi.stubGlobal("window", {
      localStorage: undefined
    });

    expect(loadPipelineDispatchRequestHistory()).toEqual([]);
    expect(savePipelineDispatchRequestHistory([makeRecord("one")])).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("saves and loads with expected storage key", () => {
    const setItem = vi.fn();
    const getItem = vi.fn();

    vi.stubGlobal("window", {
      localStorage: {
        setItem,
        getItem
      }
    });

    const records = [makeRecord("one")];

    savePipelineDispatchRequestHistory(records);
    expect(setItem).toHaveBeenCalledWith(
      PIPELINE_DISPATCH_REQUEST_HISTORY_STORAGE_KEY,
      JSON.stringify(records)
    );

    getItem.mockReturnValue(JSON.stringify(records));
    expect(loadPipelineDispatchRequestHistory()).toEqual(records);
    expect(getItem).toHaveBeenCalledWith(PIPELINE_DISPATCH_REQUEST_HISTORY_STORAGE_KEY);

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

    expect(loadPipelineDispatchRequestHistory()).toEqual([]);
    expect(savePipelineDispatchRequestHistory([makeRecord("retry")])).toBeUndefined();

    vi.unstubAllGlobals();
  });
});
