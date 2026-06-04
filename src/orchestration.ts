import type { PipelineItem, ProjectSummary } from "./fixtures";

export type TaskStatus = "queued" | "implementing" | "validating" | "blocked" | "accepted";
export type TaskRole = "planning" | "implementation" | "validation" | "integration";

export interface OrchestrationTask {
  id: string;
  projectId: string;
  title: string;
  role: TaskRole;
  status: TaskStatus;
  attempt: number;
  attemptLimit: number;
  owner: string;
  objective: string;
  scope: string[];
  fileOwnership: string[];
  acceptanceCriteria: string[];
  validationCommands: string[];
  dependencies: string[];
  rollback: string;
}

export interface HandoffBrief {
  taskId: string;
  projectId: string;
  title: string;
  markdown: string;
}

export interface TaskSummary {
  total: number;
  queued: number;
  implementing: number;
  validating: number;
  blocked: number;
  accepted: number;
}

const dispatchableStages = new Set<PipelineItem["stage"]>(["ready"]);

function renderList(items: string[]): string {
  if (items.length === 0) {
    return "- None";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

export function canDispatchPipelineItem(item: PipelineItem): boolean {
  return dispatchableStages.has(item.stage) && item.readiness >= 80;
}

export function summarizeTasks(tasks: OrchestrationTask[]): TaskSummary {
  return tasks.reduce<TaskSummary>(
    (summary, task) => ({
      ...summary,
      total: summary.total + 1,
      [task.status]: summary[task.status] + 1
    }),
    {
      total: 0,
      queued: 0,
      implementing: 0,
      validating: 0,
      blocked: 0,
      accepted: 0
    }
  );
}

export function nextHandoffTask(tasks: OrchestrationTask[]): OrchestrationTask | undefined {
  return (
    tasks.find((task) => task.status === "queued") ??
    tasks.find((task) => task.status === "blocked") ??
    tasks.find((task) => task.status === "implementing") ??
    tasks.find((task) => task.status === "validating") ??
    tasks[0]
  );
}

export function buildHandoffBrief(task: OrchestrationTask, project: ProjectSummary): HandoffBrief {
  const markdown = [
    `# Worker Handoff: ${task.title}`,
    "",
    `Project: ${project.name}`,
    `Role: ${task.role}`,
    `Attempt: ${task.attempt} of ${task.attemptLimit}`,
    "",
    "## Objective",
    task.objective,
    "",
    "## Scope",
    renderList(task.scope),
    "",
    "## File Ownership",
    renderList(task.fileOwnership),
    "",
    "## Dependencies",
    renderList(task.dependencies),
    "",
    "## Acceptance Criteria",
    renderList(task.acceptanceCriteria),
    "",
    "## Validation",
    renderList(task.validationCommands),
    "",
    "## Rollback",
    task.rollback
  ].join("\n");

  return {
    taskId: task.id,
    projectId: task.projectId,
    title: task.title,
    markdown
  };
}
