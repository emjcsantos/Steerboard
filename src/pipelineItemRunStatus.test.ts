import { describe, expect, it } from "vitest";
import type { PipelineItem } from "./fixtures";
import type { MockOrchestratorRun } from "./run";
import { summarizePipelineItemRunStatus } from "./pipelineItemRunStatus";

const pipelineItem: PipelineItem = {
  id: "pipe-1",
  projectId: "project-a",
  title: "Summarize pipeline run status",
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
    objective: "mock objective",
    scopeCount: 2,
    fileAreaCount: 2,
    acceptanceCriteriaCount: 2,
    validationGateCount: 1,
    risk: "low"
  },
  sessions: [],
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
      objective: "Do task",
      scope: [],
      fileOwnership: ["Pipeline item pipe-1"],
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
    createdAt: "2026-06-01T00:00:00.000Z",
    ...runTemplate,
    ...overrides,
    tasks: overrides.tasks ?? runTemplate.tasks,
    sessions: overrides.sessions ?? runTemplate.sessions,
    summary: { ...runTemplate.summary, ...overrides.summary },
    validationGates: overrides.validationGates ?? runTemplate.validationGates
  };
}

describe("pipeline item run status summary", () => {
  it("returns no-run defaults when no links exist", () => {
    const unmatched = buildRun({
      id: "run-unmatched",
      projectId: "project-b",
      status: "running",
      tasks: [
        {
          ...runTemplate.tasks[0],
          fileOwnership: ["Pipeline item pipe-10"]
        }
      ]
    });

    const summary = summarizePipelineItemRunStatus(pipelineItem, [unmatched]);

    expect(summary).toEqual({
      linkCount: 0,
      latestRunId: undefined,
      latestStatus: undefined,
      latestCreatedAt: undefined,
      activeCount: 0,
      issueCount: 0,
      completeCount: 0,
      queuedCount: 0,
      label: "No runs",
      detail: "No linked cockpit runs yet."
    });
  });

  it.each([
    ["running", "Running"],
    ["queued", "Queued"],
    ["complete", "Complete"],
    ["blocked", "Blocked"],
    ["failed", "Failed"]
  ])("labels latest %s status as %s", (status, expectedLabel) => {
    const summary = summarizePipelineItemRunStatus(pipelineItem, [
      buildRun({
        id: "run-old",
        status: "complete",
        createdAt: "2026-06-03T00:00:00.000Z",
        tasks: [{ ...runTemplate.tasks[0], fileOwnership: ["Pipeline item pipe-1"] }]
      }),
      buildRun({
        id: "run-new",
        status: status as MockOrchestratorRun["status"],
        createdAt: "2026-06-04T00:00:00.000Z",
        tasks: [{ ...runTemplate.tasks[0], fileOwnership: ["Pipeline item pipe-1"] }]
      })
    ]);

    expect(summary.label).toBe(expectedLabel);
    expect(summary.latestRunId).toBe("run-new");
    expect(summary.latestStatus).toBe(status);
    expect(summary.latestCreatedAt).toBe("2026-06-04T00:00:00.000Z");
  });

  it("counts statuses from stripped links only", () => {
    const summary = summarizePipelineItemRunStatus(pipelineItem, [
      buildRun({ id: "run-1", status: "running", createdAt: "2026-06-06T00:00:00.000Z" }),
      buildRun({ id: "run-2", status: "blocked", createdAt: "2026-06-05T00:00:00.000Z" }),
      buildRun({ id: "run-3", status: "failed", createdAt: "2026-06-04T00:00:00.000Z" }),
      buildRun({ id: "run-4", status: "complete", createdAt: "2026-06-03T00:00:00.000Z" }),
      buildRun({ id: "run-5", status: "queued", createdAt: "2026-06-02T00:00:00.000Z" }),
      buildRun({
        id: "run-unlinked",
        projectId: "project-a",
        tasks: [{ ...runTemplate.tasks[0], fileOwnership: ["Pipeline item pipe-10"] }],
        status: "running",
        createdAt: "2026-06-07T00:00:00.000Z"
      })
    ]);

    expect(summary.linkCount).toBe(5);
    expect(summary.activeCount).toBe(1);
    expect(summary.issueCount).toBe(2);
    expect(summary.completeCount).toBe(1);
    expect(summary.queuedCount).toBe(1);
    expect(summary.detail).toBe("5 linked runs | active: 1 | issues: 2 | complete: 1 | queued: 1");
    expect(summary.latestRunId).toBe("run-1");
  });

  it("uses link helper matching semantics so pipe-1 does not match pipe-10", () => {
    const summary = summarizePipelineItemRunStatus(pipelineItem, [
      buildRun({
        id: "run-near",
        status: "running",
        createdAt: "2026-06-06T00:00:00.000Z",
        tasks: [{ ...runTemplate.tasks[0], fileOwnership: ["Pipeline item pipe-10"] }]
      }),
      buildRun({
        id: "run-exact",
        status: "complete",
        createdAt: "2026-06-05T00:00:00.000Z",
        tasks: [{ ...runTemplate.tasks[0], fileOwnership: ["Pipeline item pipe-1"] }]
      }),
      buildRun({
        id: "run-bad",
        projectId: "project-b",
        status: "failed",
        createdAt: "2026-06-04T00:00:00.000Z",
        tasks: [{ ...runTemplate.tasks[0], fileOwnership: ["Pipeline item pipe-1"] }]
      })
    ]);

    expect(summary.linkCount).toBe(1);
    expect(summary.latestRunId).toBe("run-exact");
    expect(summary.label).toBe("Complete");
  });

  it("does not mutate input run payloads", () => {
    const input: MockOrchestratorRun[] = [
      {
        ...buildRun({
          id: "run-privacy",
          sourcePackageId: "package-privacy",
          status: "running",
          createdAt: "2026-06-04T00:00:00.000Z",
          tasks: [
            {
              ...runTemplate.tasks[0],
              fileOwnership: ["Pipeline item pipe-1"],
              scope: ["Do not leak private path."]
            }
          ],
          sessions: [
            {
              id: "sess-a",
              projectId: "project-a",
              title: "Session",
              role: "orchestrator",
              state: "implementing",
              branch: "main",
              runtime: "mock",
              attempt: 1,
              validation: "ok",
              files: ["/tmp/private/notes.md"],
              transcript: [],
              tools: ["Edit"]
            }
          ],
          validationGates: [
            { id: "gate-1", label: "local", command: "test", status: "pending", detail: "C:\\tmp\\secret\\path" }
          ]
        })
      }
    ];
    const snapshot = structuredClone(input);

    const summary = summarizePipelineItemRunStatus(pipelineItem, input);

    expect(input).toEqual(snapshot);
    expect(summary.latestRunId).toBe("run-privacy");
  });

  it("produces compact detail without private or payload-shaped fields", () => {
    const summary = summarizePipelineItemRunStatus(pipelineItem, [
      {
        ...buildRun({
          id: "run-secret",
          sourcePackageId: "package/secret",
          status: "failed",
          createdAt: "2026-06-04T00:00:00.000Z",
          summary: {
            ...runTemplate.summary,
            objective: "/private/secret/objective"
          }
        }),
        tasks: [{ ...runTemplate.tasks[0], fileOwnership: ["Pipeline item pipe-1"] }]
      } as unknown as MockOrchestratorRun
    ]);

    expect(summary.label).toBe("Failed");
    expect(summary.issueCount).toBe(1);
    expect(summary.detail).not.toContain("run-secret");
    expect(summary.detail).not.toContain("package/secret");
    expect(summary.detail).not.toContain("/private/secret/objective");
    expect(summary.detail).not.toContain("/");
    expect(summary.detail).not.toContain("\\");
    expect(summary.detail).toMatch(/linked runs?/);
  });

  it("falls back to 'Linked' for unexpected latest status", () => {
    const malformed = buildRun({ id: "run-bad-status", status: "queued" });
    const malformedWithUnknown = {
      ...malformed,
      status: "stalled"
    } as unknown as MockOrchestratorRun;
    const summary = summarizePipelineItemRunStatus(pipelineItem, [malformedWithUnknown]);

    expect(summary.label).toBe("Linked");
  });
});
