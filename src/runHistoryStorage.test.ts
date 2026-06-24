import { describe, expect, it } from "vitest";
import type { MockOrchestratorRun } from "./run";
import { parseStoredRunHistory } from "./runHistoryStorage";

const baseRun: MockOrchestratorRun = {
  id: "run-a",
  projectId: "website-refresh",
  projectName: "Website Refresh",
  title: "Mock run for homepage polish",
  status: "queued",
  createdAt: "2026-06-04T00:00:00.000Z",
  sourcePackageId: "package-a",
  summary: {
    objective: "Polish the homepage.",
    scopeCount: 1,
    fileAreaCount: 1,
    acceptanceCriteriaCount: 1,
    validationGateCount: 1,
    risk: "medium"
  },
  sessions: [],
  tasks: [],
  validationGates: []
};

function buildRun(overrides: Partial<MockOrchestratorRun> = {}): MockOrchestratorRun {
  return {
    ...baseRun,
    ...overrides
  };
}

describe("run history storage", () => {
  it("returns an empty run history when saved state is missing or malformed", () => {
    expect(parseStoredRunHistory(null)).toEqual([]);
    expect(parseStoredRunHistory("{")).toEqual([]);
    expect(parseStoredRunHistory("{}")).toEqual([]);
  });

  it("keeps valid runs and removes malformed entries", () => {
    const validRun = buildRun();
    const parsed = parseStoredRunHistory(
      JSON.stringify([
        validRun,
        {
          ...validRun,
          id: "run-b",
          status: "unsupported"
        },
        {
          ...validRun,
          id: "run-c",
          sessions: "missing"
        }
      ])
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject(validRun);
    expect(parsed[0].mainWorksheet?.title).toBe("Main Worksheet");
    expect(parsed[0].phaseWorksheets).toHaveLength(8);
    expect(parsed[0].activeWorksheetQueue).toHaveLength(8);
  });

  it("dedupes by run id and source package id before applying the limit", () => {
    const runs = [
      buildRun({ id: "run-a", sourcePackageId: "package-a" }),
      buildRun({ id: "run-a", sourcePackageId: "package-b" }),
      buildRun({ id: "run-c", sourcePackageId: "package-a" }),
      buildRun({ id: "run-d", sourcePackageId: "package-d" })
    ];

    expect(parseStoredRunHistory(JSON.stringify(runs), 2).map((run) => run.id)).toEqual([
      "run-a",
      "run-d"
    ]);
  });

  it("repairs completed legacy runs into removed worksheets and main receipts", () => {
    const parsed = parseStoredRunHistory(
      JSON.stringify([buildRun({ id: "run-complete", sourcePackageId: "package-complete", status: "complete" })])
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0].phaseWorksheets).toHaveLength(8);
    expect(parsed[0].phaseWorksheets?.every((worksheet) => worksheet.state === "removed")).toBe(true);
    expect(parsed[0].activeWorksheetQueue).toEqual([]);
    expect(parsed[0].mainWorksheet?.acceptedPhaseIds).toHaveLength(8);
    expect(parsed[0].mainWorksheet?.integrationReceipts).toHaveLength(8);
  });
});
