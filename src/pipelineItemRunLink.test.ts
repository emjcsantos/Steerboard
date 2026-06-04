import { describe, expect, it } from "vitest";
import type { PipelineItem } from "./fixtures";
import type { MockOrchestratorRun } from "./run";
import { buildPipelineItemRunLinks } from "./pipelineItemRunLink";

const pipelineItem: PipelineItem = {
  id: "pipe-1",
  projectId: "project-a",
  title: "Prepare mock run links",
  stage: "ready",
  owner: "Planning",
  risk: "low",
  readiness: 90
};

const runTemplate: Omit<
  MockOrchestratorRun,
  "id" | "projectId" | "createdAt" | "sourcePackageId"
> = {
  projectName: "Project A",
  title: "Project A run",
  status: "queued",
  summary: {
    objective: "mock",
    scopeCount: 2,
    fileAreaCount: 2,
    acceptanceCriteriaCount: 2,
    validationGateCount: 1,
    risk: "low"
  },
  sessions: [{ id: "sess-a", projectId: "project-a", title: "session", role: "orchestrator", state: "idle", branch: "main", runtime: "mock", attempt: 1, validation: "ok", files: [], transcript: [], tools: [] }],
  tasks: [
    {
      id: "task-a",
      projectId: "project-a",
      title: "Task",
      role: "implementation",
      status: "accepted",
      attempt: 0,
      attemptLimit: 1,
      owner: "Mock Worker",
      objective: "do one thing",
      scope: [],
      fileOwnership: ["Pipeline item pipe-1", "Project lane project-a"],
      acceptanceCriteria: [],
      validationCommands: [],
      dependencies: [],
      rollback: ""
    }
  ],
  validationGates: []
};

function buildRun(overrides: Partial<MockOrchestratorRun>): MockOrchestratorRun {
  return {
    id: "run-base",
    projectId: "project-a",
    sourcePackageId: "package-base",
    createdAt: "2026-06-04T00:00:00.000Z",
    ...runTemplate,
    ...overrides,
    tasks: overrides.tasks ?? runTemplate.tasks,
    sessions: overrides.sessions ?? runTemplate.sessions,
    summary: { ...runTemplate.summary, ...overrides.summary },
    validationGates: overrides.validationGates ?? runTemplate.validationGates
  };
}

describe("pipeline item run links", () => {
  it("matches by exact Pipeline item fileOwnership text after trimming", () => {
    const matching = buildRun({
      id: "run-match",
      sourcePackageId: "package-match",
      title: "Exact match run",
      tasks: [
        {
          ...runTemplate.tasks[0],
          fileOwnership: ["  Pipeline item pipe-1  ", "notes.md"]
        }
      ]
    });

    const trimmed = buildRun({
      id: "run-trimmed",
      sourcePackageId: "package-trimmed",
      title: "Trimmed match run",
      tasks: [
        {
          ...runTemplate.tasks[0],
          fileOwnership: ["extra/dir", "Pipeline item pipe-1", "Project lane project-a"]
        }
      ]
    });

    const links = buildPipelineItemRunLinks(pipelineItem, [matching, trimmed]);

    expect(links.map((link) => link.runId)).toEqual(["run-match", "run-trimmed"]);
  });

  it("does not fuzzy-match nearby ids like pipe-10", () => {
    const nearMatch = buildRun({
      id: "run-near",
      sourcePackageId: "package-near",
      tasks: [
        {
          ...runTemplate.tasks[0],
          fileOwnership: ["Pipeline item pipe-10"]
        }
      ]
    });
    const wrongProject = buildRun({
      id: "run-wrong-project",
      projectId: "project-b",
      sourcePackageId: "package-wrong-project"
    });

    const links = buildPipelineItemRunLinks(pipelineItem, [nearMatch, wrongProject]);

    expect(links).toHaveLength(0);
  });

  it("sorts newest-first for valid dates with invalid dates last", () => {
    const newest = buildRun({
      id: "run-newest",
      sourcePackageId: "package-newest",
      createdAt: "2026-06-04T00:00:00.000Z"
    });
    const older = buildRun({
      id: "run-older",
      sourcePackageId: "package-older",
      createdAt: "2026-06-03T00:00:00.000Z"
    });
    const invalidDate = buildRun({
      id: "run-invalid",
      sourcePackageId: "package-invalid",
      createdAt: "not-a-date"
    });

    const links = buildPipelineItemRunLinks(pipelineItem, [older, invalidDate, newest]);

    expect(links.map((link) => link.runId)).toEqual(["run-newest", "run-older", "run-invalid"]);
    expect(links[2].createdAt).toBe("not-a-date");
  });

  it("enforces a nonnegative integer limit and defaults to 4", () => {
    const runs = [
      buildRun({ id: "run-1", sourcePackageId: "package-1", createdAt: "2026-06-05T00:00:00.000Z" }),
      buildRun({ id: "run-2", sourcePackageId: "package-2", createdAt: "2026-06-04T00:00:00.000Z" }),
      buildRun({ id: "run-3", sourcePackageId: "package-3", createdAt: "2026-06-03T00:00:00.000Z" }),
      buildRun({ id: "run-4", sourcePackageId: "package-4", createdAt: "2026-06-02T00:00:00.000Z" }),
      buildRun({ id: "run-5", sourcePackageId: "package-5", createdAt: "2026-06-01T00:00:00.000Z" })
    ];

    expect(buildPipelineItemRunLinks(pipelineItem, runs, 2).map((link) => link.runId)).toEqual([
      "run-1",
      "run-2"
    ]);
    expect(buildPipelineItemRunLinks(pipelineItem, runs, 0)).toEqual([]);
    expect(buildPipelineItemRunLinks(pipelineItem, runs).map((link) => link.runId)).toEqual([
      "run-1",
      "run-2",
      "run-3",
      "run-4"
    ]);
    expect(buildPipelineItemRunLinks(pipelineItem, runs, Number.POSITIVE_INFINITY).map((link) => link.runId)).toEqual([
      "run-1",
      "run-2",
      "run-3",
      "run-4",
      "run-5"
    ]);
  });

  it("deduplicates by run id and keeps newest first", () => {
    const duplicates = [
      buildRun({
        id: "run-dup",
        sourcePackageId: "package-1",
        createdAt: "2026-06-01T00:00:00.000Z",
        title: "Older"
      }),
      buildRun({
        id: "run-dup",
        sourcePackageId: "package-2",
        createdAt: "2026-06-10T00:00:00.000Z",
        title: "Newest"
      })
    ];

    const links = buildPipelineItemRunLinks(pipelineItem, duplicates);

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ runId: "run-dup", title: "Newest", createdAt: "2026-06-10T00:00:00.000Z" });
  });

  it("returns stripped link objects without mutating source runs", () => {
    const first = buildRun({
      id: "run-first",
      sourcePackageId: "package-first",
      createdAt: "2026-06-02T00:00:00.000Z",
      title: "Project A run",
      tasks: [
        {
          ...runTemplate.tasks[0],
          fileOwnership: ["Pipeline item pipe-1", "Project lane project-a"]
        }
      ],
      sessions: [
        { id: "sess-a", projectId: "project-a", title: "session", role: "orchestrator", state: "idle", branch: "main", runtime: "mock", attempt: 1, validation: "ok", files: [], transcript: [], tools: [] },
        { id: "sess-b", projectId: "project-a", title: "session 2", role: "implementer", state: "planning", branch: "feat", runtime: "mock", attempt: 1, validation: "ok", files: [], transcript: [], tools: [] }
      ],
      validationGates: [
        { id: "gate-1", label: "gate", command: "test", status: "pending", detail: "local" },
        { id: "gate-2", label: "gate", command: "lint", status: "pending", detail: "local" },
        { id: "gate-3", label: "gate", command: "build", status: "pending", detail: "local" },
        { id: "gate-4", label: "gate", command: "audit", status: "pending", detail: "local" }
      ]
    });

    const input: MockOrchestratorRun[] = [first];
    const snapshot = structuredClone(input);

    const links = buildPipelineItemRunLinks(pipelineItem, input, 4);

    expect(input).toEqual(snapshot);
    expect(links).toHaveLength(1);
    expect(links[0]).toEqual({
      runId: "run-first",
      title: "Project A run",
      status: "queued",
      createdAt: "2026-06-02T00:00:00.000Z",
      sourcePackageId: "package-first",
      taskCount: 1,
      sessionCount: 2,
      validationGateCount: 4
    });
    expect(links[0]).not.toHaveProperty("tasks");
    expect(links[0]).not.toHaveProperty("sessions");
    expect(links[0]).not.toHaveProperty("summary");
    expect(Object.keys(links[0]).sort()).toEqual([
      "createdAt",
      "runId",
      "sourcePackageId",
      "sessionCount",
      "status",
      "taskCount",
      "title",
      "validationGateCount"
    ].sort());
  });
});
