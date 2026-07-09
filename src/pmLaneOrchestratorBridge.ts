import {
  createBoundedOrchestratorRun,
  createOrchestratorBackendState,
  hydrateOrchestratorBackendStateFromSqlite,
  type OrchestratorBackendState
} from "./orchestratorBackend";
import {
  buildOrchestratorSqliteSnapshot,
  readOrchestratorSqliteSnapshot,
  applyOrchestratorSqliteSnapshot,
  type OrchestratorSqliteApplyResult,
  type OrchestratorSqliteSnapshot
} from "./orchestratorSqliteStore";
import {
  DEFAULT_PM_TASK_BUDGET,
  createPmTaskTemplateSnapshot,
  prepareOrchestratorCreatedTaskForDispatch,
  type PmTaskPriority,
  type PmWorkerReadyTask
} from "./pmLaneWorkerReady";
import {
  dispatchWorkerReadyTasks,
  type WorkerDispatchResult,
  type WorkerJobRecord
} from "./orchestratorWorkerDispatch";
import type { ProjectSummary } from "./fixtures";
import type { ProjectManagementTask } from "./projectManagementHierarchy";

export interface PmLaneOrchestratorDispatchInput {
  project: Pick<ProjectSummary, "id" | "name">;
  tasks: readonly ProjectManagementTask[];
  repositoryRoot: string;
  worktreeRoot: string;
  createdAt: string;
  concurrencyLimit: number;
  existingWorkerJobs?: readonly WorkerJobRecord[];
  readSnapshot?: () => Promise<OrchestratorSqliteSnapshot>;
  applySnapshot?: (snapshot: OrchestratorSqliteSnapshot) => Promise<OrchestratorSqliteApplyResult>;
}

export interface PmLaneOrchestratorDispatchResult {
  runId: string;
  backendState: OrchestratorBackendState;
  workerReadyTasks: PmWorkerReadyTask[];
  dispatch: WorkerDispatchResult;
  applyResult?: OrchestratorSqliteApplyResult;
  detail: string;
}

const bridgeTemplateId = "pm-lane-worker-ready-v1";

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 56) || "task";
}

function priorityForTask(task: ProjectManagementTask): PmTaskPriority {
  if (task.complexity === "extra_high") {
    return "high";
  }

  if (task.complexity === "high") {
    return "normal";
  }

  return "low";
}

function defaultOwnedFile(task: ProjectManagementTask): string {
  return `.steerboard/pm-lane/${normalizeSlug(task.id)}.md`;
}

export function convertPmTaskToWorkerReadyTask(input: {
  task: ProjectManagementTask;
  project: Pick<ProjectSummary, "id" | "name">;
  createdAt: string;
  sequence: number;
}): PmWorkerReadyTask {
  const { task, project, createdAt, sequence } = input;
  const candidate: PmWorkerReadyTask = {
    id: task.id,
    title: task.title,
    objective: task.description,
    ownedFiles: [defaultOwnedFile(task)],
    forbiddenFiles: [
      "src/codexSession.ts",
      "src-tauri/src/lib.rs"
    ],
    dependencies: [],
    acceptanceCriteria: [
      `Implement PM task "${task.title}" for ${project.name}.`,
      "Return concise worker evidence and validation output to the orchestrator ledger."
    ],
    validationCommands: [
      "npm.cmd run test -- src/orchestratorQueuePump.test.ts",
      "npm.cmd run build"
    ],
    rollbackPlan: `Revert worker branch changes for PM task ${task.id}.`,
    budget: {
      ...DEFAULT_PM_TASK_BUDGET,
      maxFilesChanged: task.complexity === "extra_high" ? 8 : DEFAULT_PM_TASK_BUDGET.maxFilesChanged,
      maxRuntimeMinutes: task.complexity === "extra_high" ? 45 : DEFAULT_PM_TASK_BUDGET.maxRuntimeMinutes
    },
    priority: priorityForTask(task),
    capabilityProfile: "workspace-write",
    evidenceKinds: ["unit-test", "build", "command-output"],
    provenance: {
      origin: "project-manager",
      labels: ["pm-lane-source-of-truth"]
    },
    templateSnapshot: createPmTaskTemplateSnapshot({
      taskId: task.id,
      templateId: bridgeTemplateId,
      resolvedAt: createdAt,
      templateJson: {
        projectId: project.id,
        sourceDocument: task.sourceDocument,
        type: task.type,
        parentId: task.parentId,
        complexity: task.complexity,
        status: task.status,
        completionPercent: task.completionPercent
      }
    }),
    status: "worker-ready",
    createdAt,
    sequence
  };

  return prepareOrchestratorCreatedTaskForDispatch(candidate);
}

export function selectPmWorkerReadyTasks(input: {
  tasks: readonly ProjectManagementTask[];
  project: Pick<ProjectSummary, "id" | "name">;
  createdAt: string;
}): PmWorkerReadyTask[] {
  return input.tasks
    .filter((task) => task.type === "child")
    .filter((task) => task.status !== "completed" && task.status !== "canceled")
    .filter((task) => task.completionPercent < 100)
    .map((task, index) =>
      convertPmTaskToWorkerReadyTask({
        task,
        project: input.project,
        createdAt: input.createdAt,
        sequence: index + 1
      })
    );
}

function runIdForProject(projectId: string): string {
  return `pm-${normalizeSlug(projectId)}-orchestrator`;
}

async function restoreOrCreateState(input: {
  project: Pick<ProjectSummary, "id" | "name">;
  taskIds: string[];
  createdAt: string;
  readSnapshot: () => Promise<OrchestratorSqliteSnapshot>;
}): Promise<{ state: OrchestratorBackendState; artifacts: OrchestratorSqliteSnapshot["artifacts"] }> {
  const snapshot = await input.readSnapshot();
  const restored = snapshot.runs.length > 0
    ? hydrateOrchestratorBackendStateFromSqlite(snapshot)
    : createOrchestratorBackendState();
  const runId = runIdForProject(input.project.id);
  const existingRun = restored.runs.find((run) => run.id === runId);

  if (existingRun) {
    return { state: restored, artifacts: snapshot.artifacts };
  }

  return {
    state: createBoundedOrchestratorRun(restored, {
      id: runId,
      projectId: input.project.id,
      scope: {
        mode: "task-list",
        taskIds: input.taskIds
      },
      baseBranch: "current",
      createdAt: input.createdAt
    }),
    artifacts: snapshot.artifacts
  };
}

export async function dispatchPmLaneToOrchestrator(
  input: PmLaneOrchestratorDispatchInput
): Promise<PmLaneOrchestratorDispatchResult> {
  const readSnapshot = input.readSnapshot ?? readOrchestratorSqliteSnapshot;
  const applySnapshot = input.applySnapshot ?? applyOrchestratorSqliteSnapshot;
  const workerReadyTasks = selectPmWorkerReadyTasks({
    tasks: input.tasks,
    project: input.project,
    createdAt: input.createdAt
  });
  const runId = runIdForProject(input.project.id);
  const restored = await restoreOrCreateState({
    project: input.project,
    taskIds: workerReadyTasks.map((task) => task.id),
    createdAt: input.createdAt,
    readSnapshot
  });
  const dispatch = dispatchWorkerReadyTasks(restored.state, workerReadyTasks, {
    runId,
    repositoryRoot: input.repositoryRoot,
    worktreeRoot: input.worktreeRoot,
    createdAt: input.createdAt,
    concurrencyLimit: input.concurrencyLimit,
    activeWorkerJobs: [],
    existingWorkerJobs: input.existingWorkerJobs
  });
  const snapshot = {
    ...buildOrchestratorSqliteSnapshot(dispatch.backendState),
    artifacts: restored.artifacts
  };
  const applyResult = await applySnapshot(snapshot);

  return {
    runId,
    backendState: dispatch.backendState,
    workerReadyTasks,
    dispatch,
    applyResult,
    detail:
      `Queued ${dispatch.queuedTaskIds.length} worker task${dispatch.queuedTaskIds.length === 1 ? "" : "s"} ` +
      `from ${workerReadyTasks.length} PM worker-ready task${workerReadyTasks.length === 1 ? "" : "s"}.`
  };
}
