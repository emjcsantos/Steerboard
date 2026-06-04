import { describe, expect, it } from "vitest";
import {
  createMockRunFromDispatchPackage,
  runToOrchestrationTasks,
  runToSessionSummaries,
  type MockOrchestratorRun
} from "./run";
import type { DispatchPackage } from "./dispatch";
import { buildDispatchPackage } from "./dispatch";
import type { PlanningDraft } from "./planning";

const stagedProject = {
  id: "run-project",
  name: "Mock Orchestrator Project"
};

const basePlanningDraft: PlanningDraft = {
  title: "Build local orchestrator mock model",
  objective: "Create a deterministic mock run model for cockpit visibility.",
  targetProjectId: stagedProject.id,
  scope: ["Mock run scaffolding", "Validation gate projection", "Session conversion surface"],
  fileAreas: ["src/run.ts"],
  acceptanceCriteria: [
    "Model output is deterministic given idSeed and createdAt.",
    "Sessions and tasks are safely transformed for cockpit review."
  ],
  validationPlan: [
    "npm run test -- src/run.test.ts",
    "npm run build"
  ],
  risk: "low",
  rollbackNote: "No runtime mutation is performed in this local model.",
  deployMode: "dry-run"
};

describe("mock run creation", () => {
  it("creates a deterministic run from a staged dispatch package", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "run-seed",
      createdAt: "2026-06-04T09:10:00.000Z",
      status: "ready"
    });
    const options = {
      idSeed: "mock-run-seed",
      createdAt: "2026-06-04T10:00:00.000Z",
      status: "running" as const
    };

    const first = createMockRunFromDispatchPackage(dispatchPackage, options);
    const second = createMockRunFromDispatchPackage(dispatchPackage, options);

    expect(first.id).toBe(second.id);
    expect(first.id).toContain("mock-run-seed");
    expect(first.id).toContain("run-project");
    expect(first.projectId).toBe(stagedProject.id);
    expect(first.projectName).toBe(stagedProject.name);
    expect(first.sourcePackageId).toBe(dispatchPackage.id);
    expect(first.createdAt).toBe(options.createdAt);
    expect(first.status).toBe(options.status);
    expect(first.summary.scopeCount).toBe(dispatchPackage.scope.length);
    expect(first.summary.validationGateCount).toBe(dispatchPackage.validationPlan.length);
    expect(first.sessions).toHaveLength(first.tasks.length);
    expect(first.validationGates).toHaveLength(dispatchPackage.validationPlan.length);
    expect(first.summary.objective).toBe(basePlanningDraft.objective);
  });
});

describe("mock run resilience", () => {
  it("handles empty list fields without dropping rows", () => {
    const packageWithEmptyLists: DispatchPackage = {
      id: "pkg-empty-lists",
      targetProject: {
        id: "empty-project",
        name: "Empty Inputs"
      },
      sourceDraftTitle: "Empty input run",
      objective: "",
      deployMode: "dry-run",
      risk: "medium",
      scope: [],
      fileAreas: [],
      acceptanceCriteria: [],
      validationPlan: [],
      rollbackNote: "",
      createdAt: "2026-06-04T11:11:11.111Z",
      status: "staged"
    };

    const run = createMockRunFromDispatchPackage(packageWithEmptyLists, {
      idSeed: "empty-seed",
      createdAt: "2026-06-04T11:11:11.111Z"
    });

    expect(run.summary.scopeCount).toBe(0);
    expect(run.summary.fileAreaCount).toBe(0);
    expect(run.summary.acceptanceCriteriaCount).toBe(0);
    expect(run.validationGates).toHaveLength(1);
    expect(run.tasks.length).toBeGreaterThan(0);
    expect(run.sessions.length).toBe(run.tasks.length);
    expect(run.sessions.every((session) => session.files.length > 0)).toBe(true);
    expect(runToSessionSummaries(run).map((row) => row.role)).toContain("orchestrator");
  });

  it("returns safe empty results when a run has no sessions or tasks", () => {
    const emptyAwareRun: MockOrchestratorRun = {
      id: "mock-run-empty",
      projectId: "empty-project",
      projectName: "Empty Inputs",
      title: "Manual empty run",
      status: "queued",
      createdAt: "2026-06-04T12:00:00.000Z",
      sourcePackageId: "manual-empty",
      summary: {
        objective: "No work requested.",
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

    expect(runToSessionSummaries(emptyAwareRun)).toEqual([]);
    expect(runToOrchestrationTasks(emptyAwareRun)).toEqual([]);
  });
});

describe("mock run conversions", () => {
  it("converts a run to cockpit-like sessions deterministically", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "convert-seed",
      createdAt: "2026-06-04T13:00:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "convert-seed",
      createdAt: "2026-06-04T13:00:00.000Z",
      status: "running"
    });

    const rows = runToSessionSummaries(run);

    expect(rows).toHaveLength(run.sessions.length);
    expect(rows[0].projectId).toBe(run.projectId);
    expect(rows[0].role).toBe("orchestrator");
    expect(rows[0].validation).toContain("session");
    expect(rows.every((row) => row.id.startsWith(run.id))).toBe(true);
    expect(rows.every((row) => row.files.length > 0)).toBe(true);
  });

  it("converts run tasks to orchestration task payloads", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "task-seed",
      createdAt: "2026-06-04T14:00:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "task-seed",
      createdAt: "2026-06-04T14:00:00.000Z"
    });

    const converted = runToOrchestrationTasks(run);

    expect(converted).toHaveLength(run.tasks.length);
    expect(converted).toEqual(run.tasks);
    expect(converted.every((task) => task.projectId === run.projectId)).toBe(true);
    expect(converted.some((task) => task.role === "validation")).toBe(true);
  });
});
