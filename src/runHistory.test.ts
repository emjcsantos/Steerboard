import { describe, expect, it } from "vitest";
import {
  filterRunsByProject,
  summarizeRunHistory,
  selectRunById,
  upsertRunHistory,
  type RunStatusCounts
} from "./runHistory";
import { type MockOrchestratorRun } from "./run";

const baseRunTemplate: Omit<MockOrchestratorRun, "id" | "createdAt" | "projectId" | "sourcePackageId" | "status"> = {
  projectName: "Mock Project",
  title: "Mock run",
  summary: {
    objective: "Mock objective",
    scopeCount: 0,
    fileAreaCount: 0,
    acceptanceCriteriaCount: 0,
    validationGateCount: 0,
    risk: "low"
  },
  sessions: [],
  tasks: [],
  validationGates: []
};

function buildRun(overrides: Partial<MockOrchestratorRun> = {}): MockOrchestratorRun {
  return {
    id: "run-seed",
    projectId: "project-a",
    sourcePackageId: "package-a",
    createdAt: "2026-06-04T00:00:00.000Z",
    status: "queued",
    ...baseRunTemplate,
    ...overrides
  };
}

describe("run history upsert", () => {
  it("dedupes by run id and source package id with newest run first", () => {
    const olderRun = buildRun({
      id: "run-a",
      sourcePackageId: "pkg-a",
      createdAt: "2026-06-03T00:00:00.000Z"
    });
    const sameIdButDifferentPackage = buildRun({
      id: "run-a",
      sourcePackageId: "pkg-b",
      createdAt: "2026-06-04T00:00:00.000Z"
    });
    const samePackageDifferentId = buildRun({
      id: "run-c",
      sourcePackageId: "pkg-a",
      createdAt: "2026-06-04T01:00:00.000Z"
    });
    const freshRun = buildRun({
      id: "run-a",
      sourcePackageId: "pkg-a",
      title: "Fresh replacement",
      createdAt: "2026-06-05T00:00:00.000Z"
    });

    const result = upsertRunHistory(
      [olderRun, sameIdButDifferentPackage, samePackageDifferentId],
      freshRun
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(freshRun);
  });

  it("applies limit cap after upsert", () => {
    const existingRuns: MockOrchestratorRun[] = [];
    for (let index = 0; index < 12; index += 1) {
      existingRuns.push(
        buildRun({
          id: `run-${index}`,
          sourcePackageId: `pkg-${index}`,
          createdAt: `2026-06-04T00:00:${String(index).padStart(2, "0")}.000Z`
        })
      );
    }

    const result = upsertRunHistory(existingRuns, buildRun({ id: "run-new", sourcePackageId: "pkg-new" }), {
      limit: 5
    });

    expect(result).toHaveLength(5);
    expect(result[0].id).toBe("run-new");
    expect(result.slice(1).every((run) => run.id !== "run-new")).toBe(true);
  });
});

describe("project filtering", () => {
  it("returns project runs newest-first by createdAt", () => {
    const runs = [
      buildRun({ id: "run-1", projectId: "project-a", createdAt: "2026-06-01T00:00:00.000Z" }),
      buildRun({ id: "run-2", projectId: "project-a", createdAt: "2026-06-03T00:00:00.000Z" }),
      buildRun({ id: "run-3", projectId: "project-b", createdAt: "2026-06-04T00:00:00.000Z" }),
      buildRun({ id: "run-4", projectId: "project-a", createdAt: "2026-06-02T00:00:00.000Z" })
    ];

    const filtered = filterRunsByProject(runs, "project-a");

    expect(filtered.map((run) => run.id)).toEqual(["run-2", "run-4", "run-1"]);
  });
});

describe("run history summary", () => {
  it("counts by status and exposes latest run", () => {
    const runs = [
      buildRun({
        id: "run-a",
        status: "queued",
        createdAt: "2026-06-01T00:00:00.000Z"
      }),
      buildRun({
        id: "run-b",
        status: "running",
        createdAt: "2026-06-03T00:00:00.000Z"
      }),
      buildRun({
        id: "run-c",
        status: "queued",
        createdAt: "2026-06-02T00:00:00.000Z"
      })
    ];

    const expected: RunStatusCounts = {
      queued: 2,
      running: 1,
      complete: 0,
      blocked: 0,
      failed: 0
    };
    const summary = summarizeRunHistory(runs);

    expect(summary.total).toBe(3);
    expect(summary.countsByStatus).toEqual(expected);
    expect(summary.latestRun).toEqual(runs[1]);
  });
});

describe("run selection", () => {
  it("selects a run by id when it exists", () => {
    const runs = [
      buildRun({ id: "run-a" }),
      buildRun({ id: "run-b" }),
      buildRun({ id: "run-c" })
    ];

    expect(selectRunById(runs, "run-b")?.id).toBe("run-b");
  });

  it("returns undefined when a run id is missing", () => {
    const runs = [buildRun({ id: "run-a" })];

    expect(selectRunById(runs, "run-missing")).toBeUndefined();
  });
});
