import { describe, expect, it, vi } from "vitest";
import { buildDispatchPackage } from "./dispatch";
import { createDispatchRolePanelPlan } from "./dispatchRolePanelPlan";
import type { DispatchReviewRecord } from "./dispatchReviewRecord";
import {
  appendDispatchReviewRecord,
  createDispatchReviewRecord,
  DISPATCH_REVIEW_NO_RUNTIME_NOTE,
  DISPATCH_REVIEW_RECORD_STORAGE_KEY,
  loadDispatchReviewRecords,
  parseStoredDispatchReviewRecords,
  saveDispatchReviewRecords
} from "./dispatchReviewRecord";
import type { PlanningDraft } from "./planning";
import { createMockRunFromDispatchPackage } from "./run";

const project = {
  id: "dispatch-review-project",
  name: "Dispatch Review Project"
};

const draft: PlanningDraft = {
  title: "Connect role panel plans to records",
  objective: "Create a local dispatch review record before worker spawning.",
  targetProjectId: project.id,
  scope: ["Build record model", "Show owner-visible handoff"],
  fileAreas: ["src/dispatchReviewRecord.ts", "src/App.tsx"],
  acceptanceCriteria: [
    "Record includes role counts and attempt limits.",
    "Record says no runtime execution happens."
  ],
  validationPlan: ["npm run test -- dispatchReviewRecord"],
  risk: "medium",
  rollbackNote: "Remove the local review record if the package is discarded.",
  deployMode: "staged"
};

function buildRecord(createdAt = "2026-06-11T00:00:00.000Z"): DispatchReviewRecord {
  const dispatchPackage = buildDispatchPackage(draft, project, {
    createdAt,
    idSeed: "dispatch-review",
    status: "ready"
  });
  const run = createMockRunFromDispatchPackage(dispatchPackage, {
    createdAt,
    idSeed: "dispatch-review-run",
    status: "queued"
  });
  const rolePanelPlan = createDispatchRolePanelPlan(dispatchPackage, run);

  return createDispatchReviewRecord(dispatchPackage, rolePanelPlan, run, {
    createdAt
  });
}

describe("dispatch review records", () => {
  it("creates deterministic metadata-only review records from role panel plans", () => {
    const first = buildRecord();
    const second = buildRecord();

    expect(first).toEqual(second);
    expect(first.id).toContain("dispatch-review");
    expect(first.panelCount).toBe(4);
    expect(first.roleCounts).toEqual({
      orchestrator: 1,
      implementer: 1,
      validator: 1,
      integration: 1
    });
    expect(first.handoffTaskCount).toBeGreaterThan(0);
    expect(first.validationGateCount).toBe(1);
    expect(first.maxAttemptLimit).toBe(3);
    expect(first.noRuntimeExecutionNote).toBe(DISPATCH_REVIEW_NO_RUNTIME_NOTE);
    expect(first.noRuntimeExecutionNote).not.toContain("launched");
    expect(first.detail).toContain("role panels");
  });

  it("prepends records, dedupes by id, and enforces limits", () => {
    const one = buildRecord("2026-06-11T00:00:00.000Z");
    const two = buildRecord("2026-06-11T00:01:00.000Z");
    const three = buildRecord("2026-06-11T00:02:00.000Z");

    expect(appendDispatchReviewRecord([one, two], three, 2)).toEqual([three, one]);
    expect(appendDispatchReviewRecord([one, two], one, 2)).toEqual([one, two]);
    expect(appendDispatchReviewRecord([one], two, 0)).toEqual([]);
  });

  it("parses malformed storage safely and strips unknown fields", () => {
    const valid = buildRecord();
    const parsed = parseStoredDispatchReviewRecords(
      JSON.stringify([
        { ...valid, extra: "ignored" },
        { ...valid, id: "" },
        { ...valid, readinessState: "invalid" },
        { ...buildRecord("2026-06-11T00:04:00.000Z"), roleCounts: { orchestrator: 1 } }
      ])
    );

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual(valid);
    expect(parsed[0]).not.toHaveProperty("extra");
    expect(parsed[1].roleCounts).toEqual({
      orchestrator: 1,
      implementer: 0,
      validator: 0,
      integration: 0
    });
  });

  it("returns [] for invalid JSON, non-array, and zero limits", () => {
    expect(parseStoredDispatchReviewRecords(null)).toEqual([]);
    expect(parseStoredDispatchReviewRecords("{")).toEqual([]);
    expect(parseStoredDispatchReviewRecords("{\"id\":\"x\"}")).toEqual([]);
    expect(parseStoredDispatchReviewRecords(JSON.stringify([buildRecord()]), 0)).toEqual([]);
  });

  it("does not mutate inputs while appending or creating records", () => {
    const dispatchPackage = buildDispatchPackage(draft, project, {
      createdAt: "2026-06-11T00:05:00.000Z",
      idSeed: "immutability",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      createdAt: dispatchPackage.createdAt,
      idSeed: "immutability-run"
    });
    const plan = createDispatchRolePanelPlan(dispatchPackage, run);
    const packageCopy = JSON.parse(JSON.stringify(dispatchPackage));
    const runCopy = JSON.parse(JSON.stringify(run));
    const planCopy = JSON.parse(JSON.stringify(plan));
    const records = [buildRecord()];
    const recordsCopy = JSON.parse(JSON.stringify(records));

    createDispatchReviewRecord(dispatchPackage, plan, run, {
      createdAt: "2026-06-11T00:05:00.000Z"
    });
    appendDispatchReviewRecord(records, buildRecord("2026-06-11T00:06:00.000Z"));

    expect(dispatchPackage).toEqual(packageCopy);
    expect(run).toEqual(runCopy);
    expect(plan).toEqual(planCopy);
    expect(records).toEqual(recordsCopy);
  });

  it("loads and saves through localStorage when available", () => {
    const setItem = vi.fn();
    const getItem = vi.fn();
    const records = [buildRecord()];

    vi.stubGlobal("window", {
      localStorage: {
        getItem,
        setItem
      }
    });

    saveDispatchReviewRecords(records);
    expect(setItem).toHaveBeenCalledWith(
      DISPATCH_REVIEW_RECORD_STORAGE_KEY,
      JSON.stringify(records)
    );

    getItem.mockReturnValue(JSON.stringify(records));
    expect(loadDispatchReviewRecords()).toEqual(records);
    expect(getItem).toHaveBeenCalledWith(DISPATCH_REVIEW_RECORD_STORAGE_KEY);

    vi.unstubAllGlobals();
  });

  it("returns [] and no-ops when storage is unavailable or throws", () => {
    vi.stubGlobal("window", undefined);
    expect(loadDispatchReviewRecords()).toEqual([]);
    expect(saveDispatchReviewRecords([buildRecord()])).toBeUndefined();
    vi.unstubAllGlobals();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => {
          throw new Error("read failed");
        }),
        setItem: vi.fn(() => {
          throw new Error("write failed");
        })
      }
    });

    expect(loadDispatchReviewRecords()).toEqual([]);
    expect(saveDispatchReviewRecords([buildRecord()])).toBeUndefined();
    vi.unstubAllGlobals();
  });
});
