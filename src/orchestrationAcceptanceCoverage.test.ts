import { describe, expect, it } from "vitest";
import { createOrchestrationAcceptanceCoverage } from "./orchestrationAcceptanceCoverage";
import type { OrchestrationTask } from "./orchestration";
import type { MockOrchestratorRun } from "./run";

function buildTask(overrides: Partial<OrchestrationTask> = {}): OrchestrationTask {
  return {
    id: "task-id",
    projectId: "project-id",
    title: "Task",
    role: "implementation",
    status: "queued",
    attempt: 1,
    attemptLimit: 3,
    owner: "owner",
    objective: "Complete orchestration acceptance coverage behavior.",
    scope: ["scope"],
    fileOwnership: ["src/file.ts"],
    acceptanceCriteria: ["Pass tests"],
    validationCommands: ["npm run test"],
    dependencies: ["dep"],
    rollback: "Rollback plan",
    ...overrides
  };
}

function buildRun(overrides: Partial<MockOrchestratorRun> = {}): MockOrchestratorRun {
  return {
    id: "run-id",
    projectId: "project-id",
    projectName: "Project",
    title: "Run",
    status: "running",
    createdAt: "2026-06-04T10:00:00.000Z",
    sourcePackageId: "package-id",
    summary: {
      objective: "Run objective",
      scopeCount: 1,
      fileAreaCount: 1,
      acceptanceCriteriaCount: 1,
      validationGateCount: 1,
      risk: "low"
    },
    sessions: [],
    tasks: [],
    validationGates: [],
    ...overrides
  };
}

describe("createOrchestrationAcceptanceCoverage", () => {
  it("returns accepted when lifecycle signals, task coverage, regression, and run closure are all covered", () => {
    const acceptedTask = buildTask({
      id: "accepted-task",
      status: "accepted",
      role: "planning",
      dependencies: [],
      scope: ["Plan scope"],
      fileOwnership: ["src/plan.ts"],
      acceptanceCriteria: ["Plan captured"],
      validationCommands: ["echo planning"],
      rollback: ""
    });
    const openTask = buildTask({
      id: "open-task",
      status: "queued",
      dependencies: ["dep-open"],
      scope: ["open scope"],
      fileOwnership: ["src/open.ts"],
      acceptanceCriteria: ["Open validation"],
      validationCommands: ["npm run test"]
    });
    const integrationTask = buildTask({
      id: "integration-task",
      role: "integration",
      status: "implementing",
      scope: ["Prepare integration evidence"],
      fileOwnership: ["src/integration.ts"],
      acceptanceCriteria: ["Integration criteria"],
      validationCommands: ["npm run test"],
      dependencies: ["accepted-task"]
    });
    const completeRun = buildRun({
      id: "complete-run",
      status: "complete",
      validationGates: [
        {
          id: "gate-1",
          label: "Verification",
          command: "npm run test",
          status: "passed",
          detail: "All checks passed."
        }
      ],
      tasks: [acceptedTask]
    });

    const result = createOrchestrationAcceptanceCoverage(
      [acceptedTask, openTask, integrationTask],
      [completeRun]
    );

    expect(result).toEqual({
      label: "Orchestration acceptance covered",
      detail:
        "Lifecycle signals, task coverage, regression checks, and run closure evidence are covered for orchestration review.",
      tone: "accepted",
      checkLabel: "4/4 checks",
      checks: [
        { label: "Lifecycle signals", value: "3/3", tone: "ok" },
        { label: "Task coverage", value: "3/3", tone: "ok" },
        { label: "Regression checks", value: "3/3", tone: "ok" },
        { label: "Run closure", value: "1/1", tone: "ok" }
      ],
      ariaLabel:
        "Orchestration acceptance covered: 4/4 checks; " +
        "3 tasks; 1 runs; 1 complete runs; " +
        "Lifecycle signals 3/3; " +
        "Task coverage 3/3; " +
        "Regression checks 3/3; " +
        "Run closure 1/1"
    });
  });

  it("returns empty when no tasks and no runs are present", () => {
    const result = createOrchestrationAcceptanceCoverage([], []);

    expect(result).toEqual({
      label: "No orchestration acceptance coverage",
      detail: "No orchestration tasks or runs are available for acceptance coverage yet.",
      tone: "empty",
      checkLabel: "0/4 checks",
      checks: [
        { label: "Lifecycle signals", value: "0/3", tone: "blocked" },
        { label: "Task coverage", value: "0/0", tone: "neutral" },
        { label: "Regression checks", value: "0/0", tone: "neutral" },
        { label: "Run closure", value: "0/0", tone: "neutral" }
      ],
      ariaLabel:
        "No orchestration acceptance coverage: 0/4 checks; " +
        "0 tasks; 0 runs; 0 complete runs; " +
        "Lifecycle signals 0/3; " +
        "Task coverage 0/0; " +
        "Regression checks 0/0; " +
        "Run closure 0/0"
    });
  });

  it("returns blocked when task, regression, and run closure coverage are missing", () => {
    const result = createOrchestrationAcceptanceCoverage([
      buildTask({
        id: "blocked-task",
        status: "queued",
        scope: [],
        fileOwnership: [],
        acceptanceCriteria: [],
        validationCommands: [],
        dependencies: []
      })
    ], [
      buildRun({
        id: "blocked-run",
        status: "complete",
        validationGates: [],
        tasks: [buildTask({ id: "run-task", status: "queued" })]
      })
    ]);

    expect(result).toEqual({
      label: "Orchestration acceptance blocked",
      detail: "Resolve missing lifecycle, task, regression, or run closure coverage before closing orchestration.",
      tone: "blocked",
      checkLabel: "1/4 checks",
      checks: [
        { label: "Lifecycle signals", value: "3/3", tone: "ok" },
        { label: "Task coverage", value: "0/1", tone: "blocked" },
        { label: "Regression checks", value: "0/1", tone: "blocked" },
        { label: "Run closure", value: "0/1", tone: "blocked" }
      ],
      ariaLabel:
        "Orchestration acceptance blocked: 1/4 checks; " +
        "1 tasks; 1 runs; 1 complete runs; " +
        "Lifecycle signals 3/3; " +
        "Task coverage 0/1; " +
        "Regression checks 0/1; " +
        "Run closure 0/1"
    });
  });

  it("returns review when coverage checks are partially complete", () => {
    const result = createOrchestrationAcceptanceCoverage(
      [
        buildTask({
          id: "review-task-1",
          status: "queued",
          dependencies: ["dep-a"],
          scope: ["scope"],
          fileOwnership: ["src/a.ts"],
          acceptanceCriteria: ["A"],
          validationCommands: ["npm run test"]
        }),
        buildTask({
          id: "review-task-2",
          status: "implementing",
          scope: ["scope"],
          fileOwnership: ["src/b.ts"],
          acceptanceCriteria: [],
          validationCommands: []
        })
      ],
      [buildRun()]
    );

    expect(result).toEqual({
      label: "Orchestration acceptance needs review",
      detail: "Some orchestration acceptance coverage needs review before the milestone is treated as stable.",
      tone: "review",
      checkLabel: "0/4 checks",
      checks: [
        { label: "Lifecycle signals", value: "2/3", tone: "review" },
        { label: "Task coverage", value: "1/2", tone: "review" },
        { label: "Regression checks", value: "1/2", tone: "review" },
        { label: "Run closure", value: "0/0", tone: "neutral" }
      ],
      ariaLabel:
        "Orchestration acceptance needs review: 0/4 checks; " +
        "2 tasks; 1 runs; 0 complete runs; " +
        "Lifecycle signals 2/3; " +
        "Task coverage 1/2; " +
        "Regression checks 1/2; " +
        "Run closure 0/0"
    });
  });

  it("keeps checks in exact order and computes checkLabel", () => {
    const result = createOrchestrationAcceptanceCoverage(
      [
        buildTask({
          id: "order-task-1",
          status: "queued",
          dependencies: ["dep-a"],
          scope: ["scope"],
          fileOwnership: ["src/a.ts"],
          acceptanceCriteria: ["A"],
          validationCommands: ["npm run test"]
        }),
        buildTask({
          id: "order-task-2",
          status: "implementing",
          dependencies: ["dep-b"],
          scope: ["scope"],
          fileOwnership: ["src/b.ts"],
          acceptanceCriteria: ["A"],
          validationCommands: ["npm run lint"],
          rollback: ""
        })
      ],
      [
        buildRun({
          id: "order-run",
          status: "complete",
          validationGates: [
            {
              id: "gate-1",
              label: "Verification",
              command: "npm run test",
              status: "passed",
              detail: "All checks passed."
            }
          ],
          tasks: [
            buildTask({
              id: "accepted-in-run",
              status: "accepted",
              acceptanceCriteria: ["passed"],
              validationCommands: ["npm run test"],
              fileOwnership: ["src/accepted.ts"],
              dependencies: []
            })
          ]
        })
      ]
    );

    expect(result.checks.map((check) => check.label)).toEqual([
      "Lifecycle signals",
      "Task coverage",
      "Regression checks",
      "Run closure"
    ]);
    expect(result.checkLabel).toBe("4/4 checks");
  });

  it("does not mutate input tasks or runs", () => {
    const task = buildTask({
      id: "immutable-task",
      status: "queued",
      dependencies: ["dep-a"],
      scope: ["scope"],
      fileOwnership: ["src/task.ts"],
      acceptanceCriteria: ["A"],
      validationCommands: ["npm run test"]
    });
    const run = buildRun({
      id: "immutable-run",
      status: "complete",
      validationGates: [
        {
          id: "gate-1",
          label: "Verification",
          command: "npm run test",
          status: "passed",
          detail: "All checks passed."
        }
      ],
      tasks: [task]
    });

    const tasks = [task];
    const runs = [run];
    const tasksSnapshot = JSON.parse(JSON.stringify(tasks));
    const runsSnapshot = JSON.parse(JSON.stringify(runs));

    createOrchestrationAcceptanceCoverage(tasks, runs);

    expect(JSON.parse(JSON.stringify(tasks))).toEqual(tasksSnapshot);
    expect(JSON.parse(JSON.stringify(runs))).toEqual(runsSnapshot);
  });
});
