import { describe, expect, it } from "vitest";
import {
  DEFAULT_PM_TASK_BUDGET,
  applyPmTaskSplitMode,
  createPmPriorityChangedEvent,
  createPmTaskTemplateSnapshot,
  evaluatePmWorkerReadyTask,
  orderPmDispatchQueue,
  prepareOrchestratorCreatedTaskForDispatch,
  resolvePmTaskTemplateSnapshot,
  type PmWorkerReadyTask
} from "./pmLaneWorkerReady";

const createdAt = "2026-07-09T02:00:00.000Z";

function baseTask(overrides: Partial<PmWorkerReadyTask> = {}): PmWorkerReadyTask {
  const id = overrides.id ?? "task-1";

  return {
    id,
    title: "Add durable queue",
    objective: "Implement the smallest durable queue path.",
    ownedFiles: ["src/orchestratorBackend.ts", "src/orchestratorBackend.test.ts"],
    forbiddenFiles: ["src/codexSession.ts"],
    dependencies: [],
    acceptanceCriteria: ["Run creation is durable.", "FIFO processing is deterministic."],
    validationCommands: ["npm.cmd run test -- src/orchestratorBackend.test.ts"],
    rollbackPlan: "Revert the owned queue files.",
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    priority: "normal",
    capabilityProfile: "workspace-write",
    evidenceKinds: ["unit-test", "build"],
    provenance: {
      origin: "orchestrator",
      createdByRunId: "run-123",
      labels: ["orchestrator-created", "corrective"]
    },
    templateSnapshot: createPmTaskTemplateSnapshot({
      taskId: id,
      templateId: "backend-api",
      resolvedAt: createdAt,
      templateJson: {
        defaultBudget: DEFAULT_PM_TASK_BUDGET,
        validationCommandHints: ["npm.cmd run test"]
      }
    }),
    status: "draft",
    createdAt,
    sequence: 1,
    ...overrides
  };
}

describe("PM lane worker-ready gates", () => {
  it("marks a fully specified task worker-ready", () => {
    const evaluation = evaluatePmWorkerReadyTask(baseTask());

    expect(evaluation).toEqual({
      taskId: "task-1",
      ready: true,
      missingGateIds: [],
      status: "worker-ready",
      detail: "Task passes worker-ready gates."
    });
  });

  it("reports missing gates for broad or underspecified tasks", () => {
    const evaluation = evaluatePmWorkerReadyTask(
      baseTask({
        objective: "",
        ownedFiles: [],
        acceptanceCriteria: [],
        validationCommands: [],
        rollbackPlan: "",
        budget: { ...DEFAULT_PM_TASK_BUDGET, maxWorkerAttempts: 5 },
        evidenceKinds: [],
        templateSnapshot: {
          taskId: "task-1",
          templateId: "",
          resolvedAt: "",
          templateJson: {}
        }
      })
    );

    expect(evaluation.ready).toBe(false);
    expect(evaluation.missingGateIds).toEqual([
      "objective",
      "owned-files",
      "acceptance-criteria",
      "validation-commands",
      "rollback",
      "budget",
      "evidence",
      "template-snapshot"
    ]);
    expect(evaluation.status).toBe("needs-refinement");
  });

  it("auto-queues orchestrator-created tasks only when strict gates pass", () => {
    expect(prepareOrchestratorCreatedTaskForDispatch(baseTask()).status).toBe("queued");
    expect(
      prepareOrchestratorCreatedTaskForDispatch(
        baseTask({
          ownedFiles: []
        })
      ).status
    ).toBe("needs-refinement");
  });

  it("requires visible provenance labels for orchestrator-created tasks", () => {
    const evaluation = evaluatePmWorkerReadyTask(
      baseTask({
        provenance: {
          origin: "orchestrator",
          createdByRunId: "run-123",
          labels: []
        }
      })
    );

    expect(evaluation.ready).toBe(false);
    expect(evaluation.missingGateIds).toContain("provenance-label");
  });

  it("orders dispatchable tasks by priority then FIFO sequence", () => {
    const ordered = orderPmDispatchQueue([
      baseTask({
        id: "normal-old",
        priority: "normal",
        status: "queued",
        createdAt: "2026-07-09T02:00:00.000Z",
        sequence: 1
      }),
      baseTask({
        id: "urgent",
        priority: "urgent",
        status: "queued",
        createdAt: "2026-07-09T02:05:00.000Z",
        sequence: 3
      }),
      baseTask({
        id: "normal-new",
        priority: "normal",
        status: "queued",
        createdAt: "2026-07-09T02:00:00.000Z",
        sequence: 2
      }),
      baseTask({
        id: "draft",
        priority: "urgent",
        status: "draft",
        sequence: 0
      })
    ]);

    expect(ordered.map((task) => task.id)).toEqual(["urgent", "normal-old", "normal-new"]);
  });

  it("records automatic priority changes with a ledger-ready reason", () => {
    expect(
      createPmPriorityChangedEvent({
        taskId: "task-1",
        previousPriority: "normal",
        nextPriority: "high",
        changedBy: "orchestrator",
        reason: "Corrective task blocks integration.",
        createdAt
      })
    ).toEqual({
      taskId: "task-1",
      previousPriority: "normal",
      nextPriority: "high",
      changedBy: "orchestrator",
      reason: "Corrective task blocks integration.",
      createdAt
    });
  });

  it("keeps split proposals in review by default and auto-dispatches in automatic mode", () => {
    const splitProposal = baseTask({
      provenance: {
        origin: "orchestrator",
        createdByRunId: "run-123",
        labels: ["orchestrator-created", "split-proposal"]
      }
    });

    expect(applyPmTaskSplitMode(splitProposal, { taskSplitMode: "approval-required" }).status).toBe("split-review");
    expect(applyPmTaskSplitMode(splitProposal, { taskSplitMode: "automatic" }).status).toBe("queued");
  });

  it("snapshots templates by value so later template edits do not rewrite task meaning", () => {
    const template = {
      defaultPriority: "normal",
      defaultBudget: { ...DEFAULT_PM_TASK_BUDGET }
    };
    const snapshot = createPmTaskTemplateSnapshot({
      taskId: "task-1",
      templateId: "bugfix",
      resolvedAt: createdAt,
      templateJson: template
    });

    template.defaultPriority = "urgent";

    expect(snapshot.templateJson).toMatchObject({
      defaultPriority: "normal"
    });
  });

  it("resolves project-local templates before built-ins without rewriting historical snapshots", () => {
    const builtInTemplate = {
      templateId: "bugfix",
      source: "built-in" as const,
      templateJson: {
        validationCommands: ["npm.cmd run test"],
        budget: { ...DEFAULT_PM_TASK_BUDGET }
      }
    };
    const projectTemplate = {
      templateId: "bugfix",
      source: "project-local" as const,
      templateJson: {
        validationCommands: ["npm.cmd run test -- src/project.test.ts"],
        budget: { ...DEFAULT_PM_TASK_BUDGET, maxCommandsRun: 8 }
      }
    };
    const snapshot = resolvePmTaskTemplateSnapshot({
      taskId: "task-1",
      templateId: "bugfix",
      resolvedAt: createdAt,
      builtInTemplates: [builtInTemplate],
      projectLocalTemplates: [projectTemplate]
    });

    projectTemplate.templateJson.validationCommands = ["mutated"];

    expect(snapshot).toMatchObject({
      taskId: "task-1",
      templateId: "bugfix",
      resolvedAt: createdAt,
      templateJson: {
        templateSource: "project-local",
        validationCommands: ["npm.cmd run test -- src/project.test.ts"],
        budget: {
          maxCommandsRun: 8
        }
      }
    });
  });

  it("falls back to built-in templates and reports missing template ids", () => {
    const snapshot = resolvePmTaskTemplateSnapshot({
      taskId: "task-1",
      templateId: "docs",
      resolvedAt: createdAt,
      builtInTemplates: [
        {
          templateId: "docs",
          source: "built-in",
          templateJson: {
            validationCommands: ["npm.cmd run test -- src/docs.test.ts"]
          }
        }
      ],
      projectLocalTemplates: []
    });

    expect(snapshot.templateJson).toMatchObject({
      templateSource: "built-in",
      validationCommands: ["npm.cmd run test -- src/docs.test.ts"]
    });
    expect(() =>
      resolvePmTaskTemplateSnapshot({
        taskId: "task-1",
        templateId: "missing",
        resolvedAt: createdAt,
        builtInTemplates: [],
        projectLocalTemplates: []
      })
    ).toThrow("pm_task_template_not_found:missing");
  });
});
