import type { DispatchPackage } from "./dispatch";
import type { ProjectSummary } from "./fixtures";
import {
  createDefaultProjectManagementPhasePlan,
  currentProjectManagementPhasePlanTaskIds,
  legacyProjectManagementSeedTaskIds
} from "./projectManagementPhasePlan";

export type ProjectManagementTaskType = "epic" | "parent" | "child";
export type ProjectManagementTaskStatus = "completed" | "ongoing" | "canceled" | "todo";
export type ProjectManagementTaskComplexity = "low" | "medium" | "high" | "extra_high";
export type ProjectManagementChatRole = "user" | "assistant";

export interface ProjectManagementTask {
  id: string;
  type: ProjectManagementTaskType;
  title: string;
  description: string;
  status: ProjectManagementTaskStatus;
  completionPercent: number;
  complexity: ProjectManagementTaskComplexity;
  sourceDocument: string;
  parentId?: string;
  collapsed?: boolean;
  runState?: "idle" | "staged";
}

export interface ProjectManagementVisibleRow {
  task: ProjectManagementTask;
  depth: number;
  hasChildren: boolean;
  hiddenByAncestor: boolean;
}

export interface ProjectManagementChatMessage {
  id: string;
  role: ProjectManagementChatRole;
  text: string;
  createdAt: string;
}

export interface ProjectManagementArenaDispatchPayload {
  taskId: string;
  taskType: "Epic" | "Parent" | "Child";
  title: string;
  description: string;
  status: "Completed" | "On-going" | "Canceled" | "TO DO";
  completion: number;
  complexity: "Low" | "Medium" | "High" | "Extra High";
  sourceDocument: string;
  relationshipContext: {
    epic?: Pick<ProjectManagementTask, "id" | "title">;
    parent?: Pick<ProjectManagementTask, "id" | "title">;
  };
  children: Array<Pick<ProjectManagementTask, "id" | "type" | "title" | "description" | "status" | "completionPercent" | "complexity" | "sourceDocument">>;
  executionMode: "staged_review";
  executionReason: string;
}

export interface ProjectManagementArenaDispatchResult {
  payload: ProjectManagementArenaDispatchPayload;
  dispatchPackage: DispatchPackage;
}

export const projectManagementStatusLabels: Record<ProjectManagementTaskStatus, ProjectManagementArenaDispatchPayload["status"]> = {
  canceled: "Canceled",
  completed: "Completed",
  ongoing: "On-going",
  todo: "TO DO"
};

export const projectManagementComplexityLabels: Record<ProjectManagementTaskComplexity, ProjectManagementArenaDispatchPayload["complexity"]> = {
  extra_high: "Extra High",
  high: "High",
  low: "Low",
  medium: "Medium"
};

export const projectManagementTypeLabels: Record<ProjectManagementTaskType, ProjectManagementArenaDispatchPayload["taskType"]> = {
  child: "Child",
  epic: "Epic",
  parent: "Parent"
};

const defaultSourceLabel = "Project brief";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const safe = value
    .replace(/[\r\n\t]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/(?:[A-Za-z]:)?[\\/][^\s]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return safe.length > 0 ? safe : fallback;
}

function normalizeId(value: unknown, fallback: string): string {
  return normalizeText(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 48) || fallback;
}

function normalizeType(value: unknown, fallback: ProjectManagementTaskType): ProjectManagementTaskType {
  return value === "epic" || value === "parent" || value === "child" ? value : fallback;
}

function normalizeStatus(value: unknown): ProjectManagementTaskStatus {
  return value === "completed" || value === "ongoing" || value === "canceled" || value === "todo"
    ? value
    : "todo";
}

function normalizeComplexity(value: unknown): ProjectManagementTaskComplexity {
  return value === "low" || value === "medium" || value === "high" || value === "extra_high"
    ? value
    : "medium";
}

function normalizePercent(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(numeric)));
}

export function createDefaultProjectManagementTasks(): ProjectManagementTask[] {
  return createDefaultProjectManagementPhasePlan();
}

function mergeCurrentPhasePlan(tasks: ProjectManagementTask[]): ProjectManagementTask[] {
  const containsCurrentPhasePlan = tasks.some((task) => currentProjectManagementPhasePlanTaskIds.has(task.id));
  const baseTasks = containsCurrentPhasePlan
    ? tasks
    : tasks.filter((task) => !legacyProjectManagementSeedTaskIds.has(task.id));
  const defaultTasks = createDefaultProjectManagementTasks();
  const defaultById = new Map(defaultTasks.map((task) => [task.id, task]));
  const merged = baseTasks.map((task) => {
    const currentTask = defaultById.get(task.id);

    if (!currentTask) {
      return task;
    }

    return {
      ...currentTask,
      collapsed: currentTask.type === "child" ? undefined : task.collapsed,
      runState: task.runState === "staged" ? "staged" : currentTask.runState
    };
  });
  const knownIds = new Set(merged.map((task) => task.id));

  for (const defaultTask of defaultTasks) {
    if (!knownIds.has(defaultTask.id)) {
      merged.push(defaultTask);
      knownIds.add(defaultTask.id);
    }
  }

  return merged;
}

export function normalizeProjectManagementTask(rawTask: unknown, index = 0): ProjectManagementTask {
  if (!isRecord(rawTask)) {
    return createDefaultProjectManagementTasks()[index] ?? createDefaultProjectManagementTasks()[0];
  }

  const type = normalizeType(rawTask.type, index === 0 ? "epic" : "child");
  const fallbackTitle = type === "epic" ? "Untitled Epic" : type === "parent" ? "Untitled Parent" : "Untitled Child";

  return {
    id: normalizeId(rawTask.id, `task-${index + 1}`),
    type,
    title: normalizeText(rawTask.title, fallbackTitle),
    description: normalizeText(rawTask.description, "No description yet."),
    status: normalizeStatus(rawTask.status),
    completionPercent: normalizePercent(rawTask.completionPercent),
    complexity: normalizeComplexity(rawTask.complexity),
    sourceDocument: normalizeText(rawTask.sourceDocument, defaultSourceLabel),
    parentId: typeof rawTask.parentId === "string" ? normalizeId(rawTask.parentId, "") || undefined : undefined,
    collapsed: type === "child" ? undefined : Boolean(rawTask.collapsed),
    runState: rawTask.runState === "staged" ? "staged" : "idle"
  };
}

export function repairProjectManagementTasks(rawTasks: unknown): ProjectManagementTask[] {
  if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
    return createDefaultProjectManagementTasks();
  }

  const normalized = rawTasks.map((task, index) => normalizeProjectManagementTask(task, index));
  const ids = new Set<string>();
  const repaired = normalized.reduce<ProjectManagementTask[]>((acc, task, index) => {
    if (ids.has(task.id) && currentProjectManagementPhasePlanTaskIds.has(task.id)) {
      return acc;
    }

    const nextId = ids.has(task.id) ? `${task.id}-${index + 1}` : task.id;
    ids.add(nextId);
    acc.push({ ...task, id: nextId });
    return acc;
  }, []);

  const validIds = new Set(repaired.map((task) => task.id));
  const hierarchySafe = repaired.map((task) => {
    if (task.type === "epic") {
      return { ...task, parentId: undefined };
    }

    return task.parentId && validIds.has(task.parentId)
      ? task
      : { ...task, parentId: findFallbackParentId(repaired, task.type) };
  });

  return hierarchySafe.some((task) => task.type === "epic")
    ? mergeCurrentPhasePlan(hierarchySafe)
    : createDefaultProjectManagementTasks();
}

function findFallbackParentId(tasks: ProjectManagementTask[], type: ProjectManagementTaskType): string | undefined {
  if (type === "parent") {
    return tasks.find((task) => task.type === "epic")?.id;
  }

  return tasks.find((task) => task.type === "parent")?.id ?? tasks.find((task) => task.type === "epic")?.id;
}

export function flattenProjectManagementRows(tasks: readonly ProjectManagementTask[]): ProjectManagementVisibleRow[] {
  const childrenByParent = new Map<string, ProjectManagementTask[]>();
  const epics = tasks.filter((task) => task.type === "epic");

  for (const task of tasks) {
    if (!task.parentId) {
      continue;
    }

    childrenByParent.set(task.parentId, [...(childrenByParent.get(task.parentId) ?? []), task]);
  }

  const rows: ProjectManagementVisibleRow[] = [];

  function walk(task: ProjectManagementTask, depth: number, hiddenByAncestor: boolean) {
    const children = childrenByParent.get(task.id) ?? [];
    const hidden = hiddenByAncestor;

    rows.push({
      depth,
      hasChildren: children.length > 0,
      hiddenByAncestor: hidden,
      task
    });

    for (const child of children) {
      walk(child, depth + 1, hidden || Boolean(task.collapsed));
    }
  }

  for (const epic of epics) {
    walk(epic, 0, false);
  }

  return rows;
}

export function toggleProjectManagementTaskCollapsed(
  tasks: readonly ProjectManagementTask[],
  taskId: string
): ProjectManagementTask[] {
  return tasks.map((task) =>
    task.id === taskId && task.type !== "child"
      ? { ...task, collapsed: !task.collapsed }
      : task
  );
}

export function collectProjectManagementDescendants(
  tasks: readonly ProjectManagementTask[],
  taskId: string
): ProjectManagementTask[] {
  const directChildren = tasks.filter((task) => task.parentId === taskId);
  return directChildren.flatMap((task) => [task, ...collectProjectManagementDescendants(tasks, task.id)]);
}

export function buildProjectManagementArenaDispatch(
  tasks: readonly ProjectManagementTask[],
  taskId: string,
  project: Pick<ProjectSummary, "id" | "name">,
  createdAt = new Date().toISOString()
): ProjectManagementArenaDispatchResult | undefined {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return undefined;
  }

  const descendants = collectProjectManagementDescendants(tasks, task.id);
  const parent = task.parentId ? tasks.find((item) => item.id === task.parentId) : undefined;
  const epic = task.type === "epic"
    ? task
    : parent?.type === "epic"
      ? parent
      : parent?.parentId
        ? tasks.find((item) => item.id === parent.parentId)
        : undefined;

  const payload: ProjectManagementArenaDispatchPayload = {
    taskId: task.id,
    taskType: projectManagementTypeLabels[task.type],
    title: task.title,
    description: task.description,
    status: projectManagementStatusLabels[task.status],
    completion: task.completionPercent,
    complexity: projectManagementComplexityLabels[task.complexity],
    sourceDocument: task.sourceDocument,
    relationshipContext: {
      epic: epic ? { id: epic.id, title: epic.title } : undefined,
      parent: parent && parent.type === "parent" ? { id: parent.id, title: parent.title } : undefined
    },
    children: descendants.map((child) => ({
      id: child.id,
      type: child.type,
      title: child.title,
      description: child.description,
      status: child.status,
      completionPercent: child.completionPercent,
      complexity: child.complexity,
      sourceDocument: child.sourceDocument
    })),
    executionMode: "staged_review",
    executionReason: "Runtime execution is locked until provider, permission, and approval gates allow live deployment."
  };

  return {
    payload,
    dispatchPackage: {
      id: `pm-${task.id}-${createdAt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "")}`,
      targetProject: {
        id: project.id,
        name: project.name
      },
      sourceDraftTitle: task.title,
      objective: `Stage ${payload.taskType} "${task.title}" for Arena review.`,
      deployMode: "staged",
      risk: task.complexity === "low" ? "low" : task.complexity === "medium" ? "medium" : "high",
      scope: [
        `Task ID: ${payload.taskId}`,
        `Task Type: ${payload.taskType}`,
        `Status: ${payload.status}`,
        `Completion: ${payload.completion}%`,
        `Complexity: ${payload.complexity}`,
        `Source: ${payload.sourceDocument}`,
        `Execution: ${payload.executionReason}`,
        ...descendants.map((child) => `Descendant ${projectManagementTypeLabels[child.type]}: ${child.title}`)
      ],
      fileAreas: [`Project Management lane`, `Source ${payload.sourceDocument}`],
      acceptanceCriteria: [
        "Arena receives a structured staged package for review.",
        "No external runtime launches until approval and runtime gates are ready."
      ],
      validationPlan: [
        "Review the staged Arena dispatch package.",
        "Confirm parent and child task context before live execution."
      ],
      rollbackNote: "Remove the staged Arena review package if the PM task scope changes.",
      createdAt,
      status: "staged"
    }
  };
}

export function createProjectManagementChatReply(input: string): string {
  const normalized = input.trim().toLowerCase();

  if (normalized.length === 0) {
    return "Add a dashboard instruction and I will keep it scoped to the Project Management lane.";
  }

  if (normalized.includes("break") && normalized.includes("epic")) {
    return "I can break an Epic into Parents and Children. This is a broad scope edit, so I would propose the hierarchy first before applying it.";
  }

  if (normalized.includes("completion")) {
    return "Completion updates can be applied row by row. For broad changes, I will stage a review proposal before changing the table.";
  }

  if (normalized.includes("move") || normalized.includes("under another parent")) {
    return "Moving a Child changes hierarchy context, so I will propose the target Parent and wait for confirmation before applying.";
  }

  if (normalized.includes("mark") && normalized.includes("todo")) {
    return "I can mark matching tasks as TO DO when the target set is unambiguous; broad matching remains review-first.";
  }

  if (normalized.includes("arena") || normalized.includes("run")) {
    return "Use the row Run button to stage an Arena review package with task, hierarchy, descendants, source, completion, and complexity.";
  }

  return "Noted. I will keep PM dashboard updates local, review-focused, and separate from Arena chat unless you stage a row for Arena review.";
}
