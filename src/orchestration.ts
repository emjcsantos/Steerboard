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

export interface HandoffSummary {
  totalWorkerTasks: number;
  implementerCount: number;
  validatorCount: number;
  integrationCount: number;
  maxAttempts: number;
  readyCount: number;
  blockedCount: number;
  acceptedCount: number;
  nextTaskId?: string;
  nextTaskTitle?: string;
}

const dispatchableStages = new Set<PipelineItem["stage"]>(["ready"]);
const DEFAULT_MAX_ATTEMPTS = 3;

function normalizeRole(taskRole: TaskRole): "implementer" | "validator" | "integration" | undefined {
  switch (taskRole) {
    case "implementation":
      return "implementer";
    case "validation":
      return "validator";
    case "integration":
      return "integration";
    default:
      return undefined;
  }
}

function sanitizeAttemptLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return 0;
  }

  return Math.min(Math.max(Math.trunc(limit), 0), DEFAULT_MAX_ATTEMPTS);
}

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

export function summarizeWorkerHandoff(tasks: OrchestrationTask[]): HandoffSummary {
  const nextTask = nextHandoffTask(tasks);
  const counts = tasks.reduce(
    (summary, task) => {
      const normalizedRole = normalizeRole(task.role);

      return {
        ...summary,
        totalWorkerTasks: summary.totalWorkerTasks + (normalizedRole ? 1 : 0),
        implementerCount: summary.implementerCount + (normalizedRole === "implementer" ? 1 : 0),
        validatorCount: summary.validatorCount + (normalizedRole === "validator" ? 1 : 0),
        integrationCount: summary.integrationCount + (normalizedRole === "integration" ? 1 : 0),
        maxAttempts: Math.max(summary.maxAttempts, sanitizeAttemptLimit(task.attemptLimit)),
        readyCount: summary.readyCount + (task.status === "queued" ? 1 : 0),
        blockedCount: summary.blockedCount + (task.status === "blocked" ? 1 : 0),
        acceptedCount: summary.acceptedCount + (task.status === "accepted" ? 1 : 0)
      };
    },
    {
      totalWorkerTasks: 0,
      implementerCount: 0,
      validatorCount: 0,
      integrationCount: 0,
      maxAttempts: 0,
      readyCount: 0,
      blockedCount: 0,
      acceptedCount: 0
    }
  );

  return {
    ...counts,
    nextTaskId: nextTask?.id,
    nextTaskTitle: nextTask?.title
  };
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
