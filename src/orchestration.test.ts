import { describe, expect, it } from "vitest";
import type { PipelineItem, ProjectSummary } from "./fixtures";
import {
  buildHandoffBrief,
  canDispatchPipelineItem,
  summarizeWorkerHandoff,
  nextHandoffTask,
  summarizeTasks,
  type OrchestrationTask
} from "./orchestration";

const project: ProjectSummary = {
  id: "example-project",
  name: "Example Project",
  status: "active",
  updated: "now",
  runs: 1
};

const baseTask: OrchestrationTask = {
  id: "task-1",
  projectId: "example-project",
  title: "Example Task",
  role: "implementation",
  status: "queued",
  attempt: 0,
  attemptLimit: 3,
  owner: "Worker A",
  objective: "Build the smallest useful slice.",
  scope: ["Edit only the owned module.", "Return validation evidence."],
  fileOwnership: ["src/example.ts", "src/example.test.ts"],
  acceptanceCriteria: ["The model is deterministic.", "The test covers the failure path."],
  validationCommands: ["npm run test -- src/example.test.ts"],
  dependencies: ["Planning task accepted."],
  rollback: "Revert the owned files only."
};

function pipelineItem(overrides: Partial<PipelineItem>): PipelineItem {
  return {
    id: "pipe-1",
    projectId: "example-project",
    title: "Example Pipeline Item",
    stage: "ready",
    owner: "Planning",
    risk: "low",
    readiness: 90,
    ...overrides
  };
}

describe("orchestration model", () => {
  it("dispatches only ready pipeline items with enough readiness", () => {
    expect(canDispatchPipelineItem(pipelineItem({ stage: "ready", readiness: 80 }))).toBe(true);
    expect(canDispatchPipelineItem(pipelineItem({ stage: "ready", readiness: 79 }))).toBe(false);
    expect(canDispatchPipelineItem(pipelineItem({ stage: "running", readiness: 100 }))).toBe(false);
    expect(canDispatchPipelineItem(pipelineItem({ stage: "accepted", readiness: 100 }))).toBe(false);
  });

  it("builds a deterministic handoff brief with scope, files, acceptance, validation, and rollback", () => {
    const handoff = buildHandoffBrief(baseTask, project);

    expect(handoff).toMatchObject({
      taskId: "task-1",
      projectId: "example-project",
      title: "Example Task"
    });
    expect(handoff.markdown).toContain("# Worker Handoff: Example Task");
    expect(handoff.markdown).toContain("Project: Example Project");
    expect(handoff.markdown).toContain("- src/example.ts");
    expect(handoff.markdown).toContain("- The model is deterministic.");
    expect(handoff.markdown).toContain("- npm run test -- src/example.test.ts");
    expect(handoff.markdown).toContain("Revert the owned files only.");
  });

  it("summarizes task status counts", () => {
    expect(
      summarizeTasks([
        baseTask,
        { ...baseTask, id: "task-2", status: "implementing" },
        { ...baseTask, id: "task-3", status: "validating" },
        { ...baseTask, id: "task-4", status: "blocked" },
        { ...baseTask, id: "task-5", status: "accepted" }
      ])
    ).toEqual({
      total: 5,
      queued: 1,
      implementing: 1,
      validating: 1,
      blocked: 1,
      accepted: 1
    });
  });

  it("summarizes orchestrator handoff worker mix and attempt limits", () => {
    expect(
      summarizeWorkerHandoff([
        baseTask,
        { ...baseTask, id: "task-2", role: "implementation", status: "accepted", attemptLimit: 2 },
        { ...baseTask, id: "task-3", role: "validation", status: "blocked", attemptLimit: 1 },
        { ...baseTask, id: "task-4", role: "integration", status: "implementing", attemptLimit: 5 },
        { ...baseTask, id: "task-5", role: "planning", status: "accepted", attemptLimit: 2 }
      ])
    ).toEqual({
      totalWorkerTasks: 4,
      implementerCount: 2,
      validatorCount: 1,
      integrationCount: 1,
      maxAttempts: 3,
      readyCount: 1,
      blockedCount: 1,
      acceptedCount: 2,
      nextTaskId: "task-1",
      nextTaskTitle: "Example Task"
    });
  });

  it("selects queued tasks before blocked or active work for the next handoff", () => {
    const selected = nextHandoffTask([
      { ...baseTask, id: "blocked", status: "blocked" },
      { ...baseTask, id: "validating", status: "validating" },
      { ...baseTask, id: "queued", status: "queued" }
    ]);

    expect(selected?.id).toBe("queued");
  });
});
