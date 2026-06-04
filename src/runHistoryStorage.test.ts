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

    expect(
      parseStoredRunHistory(
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
      )
    ).toEqual([validRun]);
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
});
