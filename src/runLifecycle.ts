import type {
  MockOrchestratorRun,
  MockRunSessionRole,
  MockRunSessionState,
  MockRunStatus,
  ValidationGateStatus
} from "./run";
import type { TaskRole, TaskStatus } from "./orchestration";

export type RunLifecycleStatus = MockRunStatus;

function resolveTaskStatus(nextStatus: RunLifecycleStatus, role: TaskRole): TaskStatus {
  if (nextStatus === "queued") {
    return "queued";
  }

  if (nextStatus === "running") {
    return role === "validation" ? "validating" : "implementing";
  }

  if (nextStatus === "complete") {
    return "accepted";
  }

  return "blocked";
}

function resolveSessionStatus(nextStatus: RunLifecycleStatus, taskStatus: TaskStatus): MockRunSessionState {
  if (nextStatus === "failed") {
    return "failed";
  }

  if (nextStatus === "complete") {
    return "complete";
  }

  if (nextStatus === "queued") {
    return "planning";
  }

  if (taskStatus === "accepted") {
    return "complete";
  }

  if (taskStatus === "blocked") {
    return "blocked";
  }

  if (taskStatus === "validating") {
    return "validating";
  }

  if (taskStatus === "implementing") {
    return "implementing";
  }

  return "planning";
}

function resolveValidationGateStatus(nextStatus: RunLifecycleStatus): ValidationGateStatus {
  if (nextStatus === "complete") {
    return "passed";
  }

  if (nextStatus === "blocked" || nextStatus === "failed") {
    return "failed";
  }

  return "pending";
}

function updateTranscriptLines(
  transcript: string[],
  taskStatus: TaskStatus,
  nextRunStatus: RunLifecycleStatus
): string[] {
  let hasTaskStatusLine = false;
  let hasGateStatusLine = false;

  const updated = transcript.map((line) => {
    if (line.startsWith("Status:")) {
      hasTaskStatusLine = true;
      return `Status: ${taskStatus}`;
    }

    if (line.startsWith("Gate status:")) {
      hasGateStatusLine = true;
      return `Gate status: ${nextRunStatus}`;
    }

    return line;
  });

  if (!hasTaskStatusLine) {
    updated.push(`Status: ${taskStatus}`);
  }

  if (!hasGateStatusLine) {
    updated.push(`Gate status: ${nextRunStatus}`);
  }

  return updated;
}

export function transitionMockRunStatus(
  run: MockOrchestratorRun,
  nextStatus: RunLifecycleStatus
): MockOrchestratorRun {
  const nextTasks = run.tasks.map((task) => {
    const status = resolveTaskStatus(nextStatus, task.role);

    return {
      ...task,
      status,
      scope: [...task.scope],
      fileOwnership: [...task.fileOwnership],
      acceptanceCriteria: [...task.acceptanceCriteria],
      validationCommands: [...task.validationCommands],
      dependencies: [...task.dependencies]
    };
  });

  const nextTaskStatusBySessionId = new Map<string, TaskStatus>(
    nextTasks.map((task) => [`${run.id}:${task.id}`, task.status])
  );

  const nextSessions = run.sessions.map((session) => {
    const matchingTaskStatus = nextTaskStatusBySessionId.get(session.id);
    const fallbackTaskStatus =
      nextStatus === "queued"
        ? "queued"
        : nextStatus === "running"
          ? "implementing"
          : nextStatus === "complete"
            ? "accepted"
            : "blocked";
    const taskStatus = matchingTaskStatus ?? fallbackTaskStatus;
    const nextState = resolveSessionStatus(nextStatus, taskStatus);

    return {
      ...session,
      state: nextState,
      transcript: updateTranscriptLines([...session.transcript], taskStatus, nextStatus),
      files: [...session.files],
      tools: [...session.tools]
    };
  });

  const nextValidationGates = run.validationGates.map((gate) => ({
    ...gate,
    status: resolveValidationGateStatus(nextStatus)
  }));

  return {
    ...run,
    status: nextStatus,
    tasks: nextTasks,
    sessions: nextSessions,
    validationGates: nextValidationGates
  };
}

interface ValidationAttemptResult {
  taskId: string;
  sessionId: string;
  outcome: "pass" | "fail";
}

function sanitizeCount(raw: number): number {
  if (!Number.isFinite(raw)) {
    return 0;
  }

  const rounded = Math.trunc(raw);
  return rounded > 0 ? rounded : 0;
}

function resolveTaskRoleFromSessionRole(role: MockRunSessionRole): TaskRole {
  switch (role) {
    case "orchestrator":
      return "planning";
    case "implementer":
      return "implementation";
    case "validator":
      return "validation";
    case "integration":
      return "integration";
  }
}

function resolveValidationTaskCompletion(tasks: MockOrchestratorRun["tasks"]): ValidationGateStatus {
  const validationTasks = tasks.filter((task) => task.role === "validation");

  if (validationTasks.every((task) => task.status === "accepted")) {
    return "passed";
  }

  if (validationTasks.some((task) => task.status === "blocked")) {
    return "failed";
  }

  return "pending";
}

function resolveRunStatusFromValidationAttempt(run: MockOrchestratorRun): RunLifecycleStatus {
  if (run.status === "blocked" || run.status === "failed" || run.status === "complete") {
    return run.status;
  }

  const hasBlockedTask = run.tasks.some((task) => task.status === "blocked");

  if (run.tasks.every((task) => task.status === "accepted")) {
    return "complete";
  }

  if (hasBlockedTask) {
    return "failed";
  }

  return "running";
}

function deriveAttemptOutcomeStatus(task: MockOrchestratorRun["tasks"][number], isPass: boolean, nextAttempt: number): TaskStatus {
  if (isPass) {
    return "accepted";
  }

  if (task.status === "accepted") {
    return "accepted";
  }

  const attemptLimit = sanitizeCount(task.attemptLimit);
  if (attemptLimit <= 0 || nextAttempt >= attemptLimit) {
    return "blocked";
  }

  return task.role === "validation" ? "validating" : "implementing";
}

export function recordWorkerValidationAttemptResult(
  run: MockOrchestratorRun,
  result: ValidationAttemptResult
): MockOrchestratorRun {
  const targetTask = run.tasks.find((task) => task.id === result.taskId);
  const targetSessionId = `${run.id}:${result.taskId}`;
  const isSessionMatch = result.sessionId === targetSessionId;

  if (!targetTask || !isSessionMatch) {
    return run;
  }

  const safeAttemptLimit = sanitizeCount(targetTask.attemptLimit);
  const currentAttempt = sanitizeCount(targetTask.attempt);
  const nextAttempt =
    result.outcome === "fail" ? Math.min(currentAttempt + 1, safeAttemptLimit) : currentAttempt;
  const nextTaskStatus = deriveAttemptOutcomeStatus(
    targetTask,
    result.outcome === "pass",
    nextAttempt
  );

  const nextTask = {
    ...targetTask,
    attempt: nextAttempt,
    status: nextTaskStatus,
    scope: [...targetTask.scope],
    fileOwnership: [...targetTask.fileOwnership],
    acceptanceCriteria: [...targetTask.acceptanceCriteria],
    validationCommands: [...targetTask.validationCommands],
    dependencies: [...targetTask.dependencies]
  };

  const tasksWithAttempt = run.tasks.map((task) => {
    if (task.id !== result.taskId) {
      return {
        ...task,
        scope: [...task.scope],
        fileOwnership: [...task.fileOwnership],
        acceptanceCriteria: [...task.acceptanceCriteria],
        validationCommands: [...task.validationCommands],
        dependencies: [...task.dependencies]
      };
    }

    return nextTask;
  });

  const nextRunStatus = resolveRunStatusFromValidationAttempt({
    ...run,
    tasks: tasksWithAttempt
  });

  const nextTaskStatusBySessionId = new Map<string, TaskStatus>(
    tasksWithAttempt.map((task) => [`${run.id}:${task.id}`, task.status])
  );

  const nextSessions = run.sessions.map((session) => {
    const taskRole = resolveTaskRoleFromSessionRole(session.role);
    const taskStatus = nextTaskStatusBySessionId.get(session.id) ?? resolveTaskStatus(nextRunStatus, taskRole);
    const nextState = resolveSessionStatus(nextRunStatus, taskStatus);
    const isTargetSession = session.id === result.sessionId;

    return {
      ...session,
      attempt: isTargetSession ? nextAttempt : session.attempt,
      state: nextState,
      transcript: updateTranscriptLines([...session.transcript], taskStatus, nextRunStatus),
      files: [...session.files],
      tools: [...session.tools]
    };
  });

  const nextValidationGates = run.validationGates.map((gate) => ({
    ...gate,
    status: resolveValidationTaskCompletion(tasksWithAttempt)
  }));

  return {
    ...run,
    status: nextRunStatus,
    tasks: tasksWithAttempt,
    sessions: nextSessions,
    validationGates: nextValidationGates
  };
}
