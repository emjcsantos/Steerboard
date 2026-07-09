export type PmTaskPriority = "urgent" | "high" | "normal" | "low";
export type PmTaskOrigin = "user" | "project-manager" | "orchestrator" | "validator" | "system";
export type PmTaskSplitMode = "approval-required" | "automatic";
export type PmWorkerCapabilityProfile = "chat-only" | "read-only" | "workspace-write" | "full-agent";
export type PmWorkerReadyStatus =
  | "draft"
  | "split-review"
  | "worker-ready"
  | "queued"
  | "needs-refinement";
export type ValidationEvidenceKind =
  | "unit-test"
  | "integration-test"
  | "typecheck"
  | "lint"
  | "build"
  | "screenshot"
  | "rendered-inspection"
  | "static-review"
  | "command-output"
  | "manual-note";

export interface PmTaskBudget {
  maxWorkerAttempts: number;
  maxWorkerTurns: number;
  maxValidatorTurns: number;
  maxRuntimeMinutes: number;
  maxFilesChanged: number;
  maxCommandsRun: number;
  maxTokenEstimate?: number;
  maxCostUsd?: number;
}

export interface PmTaskProvenance {
  origin: PmTaskOrigin;
  createdByRunId?: string;
  createdByJobId?: string;
  createdFromTaskId?: string;
  createdFromFindingId?: string;
  labels: string[];
}

export interface PmTaskTemplateSnapshot {
  taskId: string;
  templateId: string;
  resolvedAt: string;
  templateJson: Record<string, unknown>;
}

export interface PmWorkerReadyTask {
  id: string;
  title: string;
  objective: string;
  ownedFiles: string[];
  forbiddenFiles: string[];
  dependencies: string[];
  acceptanceCriteria: string[];
  validationCommands: string[];
  rollbackPlan: string;
  budget: PmTaskBudget;
  priority: PmTaskPriority;
  capabilityProfile: PmWorkerCapabilityProfile;
  evidenceKinds: ValidationEvidenceKind[];
  provenance: PmTaskProvenance;
  templateSnapshot: PmTaskTemplateSnapshot;
  status: PmWorkerReadyStatus;
  createdAt: string;
  sequence: number;
}

export type PmWorkerReadyGateId =
  | "objective"
  | "owned-files"
  | "acceptance-criteria"
  | "validation-commands"
  | "rollback"
  | "budget"
  | "capability-profile"
  | "evidence"
  | "template-snapshot"
  | "provenance-label";

export interface PmWorkerReadyEvaluation {
  taskId: string;
  ready: boolean;
  missingGateIds: PmWorkerReadyGateId[];
  status: "worker-ready" | "needs-refinement";
  detail: string;
}

export interface PmLaneSettings {
  taskSplitMode: PmTaskSplitMode;
  maxWorkerAttempts: number;
  workerConcurrencyLimit: number;
}

export interface PmPriorityChangedEvent {
  taskId: string;
  previousPriority: PmTaskPriority;
  nextPriority: PmTaskPriority;
  changedBy: "user" | "orchestrator";
  reason: string;
  createdAt: string;
}

export const DEFAULT_PM_TASK_BUDGET: PmTaskBudget = {
  maxWorkerAttempts: 3,
  maxWorkerTurns: 6,
  maxValidatorTurns: 3,
  maxRuntimeMinutes: 30,
  maxFilesChanged: 5,
  maxCommandsRun: 12
};

export const DEFAULT_PM_LANE_SETTINGS: PmLaneSettings = {
  taskSplitMode: "approval-required",
  maxWorkerAttempts: 3,
  workerConcurrencyLimit: 3
};

const priorityRank: Record<PmTaskPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3
};

const validCapabilityProfiles: readonly PmWorkerCapabilityProfile[] = [
  "chat-only",
  "read-only",
  "workspace-write",
  "full-agent"
];

const requiredOrchestratorLabels = new Set([
  "orchestrator-created",
  "corrective",
  "split-proposal",
  "dependency-blocker",
  "validation-failure",
  "cleanup-blocker"
]);

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function hasList(value: readonly string[]): boolean {
  return value.some((item) => item.trim().length > 0);
}

function hasPositiveBudget(budget: PmTaskBudget): boolean {
  return (
    budget.maxWorkerAttempts > 0 &&
    budget.maxWorkerAttempts <= 3 &&
    budget.maxWorkerTurns > 0 &&
    budget.maxValidatorTurns > 0 &&
    budget.maxRuntimeMinutes > 0 &&
    budget.maxFilesChanged > 0 &&
    budget.maxCommandsRun > 0
  );
}

function hasRequiredProvenanceLabel(provenance: PmTaskProvenance): boolean {
  if (provenance.origin !== "orchestrator") {
    return true;
  }

  return provenance.labels.some((label) => requiredOrchestratorLabels.has(label));
}

export function evaluatePmWorkerReadyTask(task: PmWorkerReadyTask): PmWorkerReadyEvaluation {
  const missingGateIds: PmWorkerReadyGateId[] = [];

  if (!hasText(task.objective)) {
    missingGateIds.push("objective");
  }

  if (!hasList(task.ownedFiles)) {
    missingGateIds.push("owned-files");
  }

  if (!hasList(task.acceptanceCriteria)) {
    missingGateIds.push("acceptance-criteria");
  }

  if (!hasList(task.validationCommands)) {
    missingGateIds.push("validation-commands");
  }

  if (!hasText(task.rollbackPlan)) {
    missingGateIds.push("rollback");
  }

  if (!hasPositiveBudget(task.budget)) {
    missingGateIds.push("budget");
  }

  if (!validCapabilityProfiles.includes(task.capabilityProfile)) {
    missingGateIds.push("capability-profile");
  }

  if (task.evidenceKinds.length === 0) {
    missingGateIds.push("evidence");
  }

  if (!task.templateSnapshot.templateId || !task.templateSnapshot.resolvedAt) {
    missingGateIds.push("template-snapshot");
  }

  if (!hasRequiredProvenanceLabel(task.provenance)) {
    missingGateIds.push("provenance-label");
  }

  const ready = missingGateIds.length === 0;

  return {
    taskId: task.id,
    ready,
    missingGateIds,
    status: ready ? "worker-ready" : "needs-refinement",
    detail: ready
      ? "Task passes worker-ready gates."
      : `Task needs refinement: ${missingGateIds.join(", ")}.`
  };
}

export function prepareOrchestratorCreatedTaskForDispatch(task: PmWorkerReadyTask): PmWorkerReadyTask {
  const evaluation = evaluatePmWorkerReadyTask(task);

  if (task.provenance.origin !== "orchestrator") {
    return {
      ...task,
      status: evaluation.ready ? "worker-ready" : "needs-refinement"
    };
  }

  return {
    ...task,
    status: evaluation.ready ? "queued" : "needs-refinement"
  };
}

export function orderPmDispatchQueue(tasks: readonly PmWorkerReadyTask[]): PmWorkerReadyTask[] {
  return [...tasks]
    .filter((task) => task.status === "queued" || task.status === "worker-ready")
    .sort((first, second) => {
      const priorityDelta = priorityRank[first.priority] - priorityRank[second.priority];

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      if (first.createdAt !== second.createdAt) {
        return first.createdAt.localeCompare(second.createdAt);
      }

      return first.sequence - second.sequence;
    });
}

export function createPmPriorityChangedEvent(input: {
  taskId: string;
  previousPriority: PmTaskPriority;
  nextPriority: PmTaskPriority;
  changedBy: "user" | "orchestrator";
  reason: string;
  createdAt: string;
}): PmPriorityChangedEvent {
  return {
    ...input,
    reason: input.reason.trim() || "Priority changed."
  };
}

export function applyPmTaskSplitMode(
  task: PmWorkerReadyTask,
  settings: Pick<PmLaneSettings, "taskSplitMode">
): PmWorkerReadyTask {
  if (!task.provenance.labels.includes("split-proposal")) {
    return task;
  }

  if (settings.taskSplitMode === "approval-required") {
    return {
      ...task,
      status: "split-review"
    };
  }

  return prepareOrchestratorCreatedTaskForDispatch(task);
}

export function createPmTaskTemplateSnapshot(input: {
  taskId: string;
  templateId: string;
  resolvedAt: string;
  templateJson: Record<string, unknown>;
}): PmTaskTemplateSnapshot {
  return {
    taskId: input.taskId,
    templateId: input.templateId,
    resolvedAt: input.resolvedAt,
    templateJson: JSON.parse(JSON.stringify(input.templateJson)) as Record<string, unknown>
  };
}
