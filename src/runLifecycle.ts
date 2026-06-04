import type { MockOrchestratorRun, MockRunSessionState, MockRunStatus, ValidationGateStatus } from "./run";
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
