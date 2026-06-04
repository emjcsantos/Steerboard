import type { MockOrchestratorRun, MockValidationGate } from "./run";
import type { OrchestrationTask } from "./orchestration";

export interface CockpitMonitorLoop {
  label: string;
  detail: string;
  tone: "waiting" | "running" | "validating" | "blocked" | "complete";
  attemptLabel: string;
  gateLabel: string;
  workerLabel: string;
}

const DEFAULT_ATTEMPT_LIMIT = 3;

function sanitizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const rounded = Math.floor(value);
  return rounded > 0 ? rounded : 0;
}

function pluralizePanel(count: number): string {
  return `${count} panel${count === 1 ? "" : "s"}`;
}

function isFailedGate(gate: MockValidationGate): boolean {
  return gate.status === "failed";
}

function isPassedGate(gate: MockValidationGate): boolean {
  return gate.status === "passed";
}

function resolveAttemptLimit(tasks: OrchestrationTask[]): number {
  const maxLimit = tasks.reduce((next, task) => {
    const limit = sanitizeCount(task.attemptLimit);
    return Math.max(next, limit);
  }, 0);

  return maxLimit > 0 ? maxLimit : DEFAULT_ATTEMPT_LIMIT;
}

function resolveCurrentAttempt(
  attemptLimit: number,
  run: MockOrchestratorRun
): number {
  const taskAttempt = run.tasks.reduce(
    (next, task) => Math.max(next, sanitizeCount(task.attempt)),
    0
  );
  const sessionAttempt = run.sessions.reduce(
    (next, session) => Math.max(next, sanitizeCount(session.attempt)),
    0
  );

  return Math.min(attemptLimit, Math.max(taskAttempt, sessionAttempt));
}

function buildGateLabel(run: MockOrchestratorRun): string {
  const failed = run.validationGates.filter(isFailedGate).length;

  if (failed > 0) {
    return `${failed} failed`;
  }

  const passed = run.validationGates.filter(isPassedGate).length;
  return `${passed}/${run.validationGates.length} gates`;
}

function hasBlockedTask(run: MockOrchestratorRun, attemptLimit: number): boolean {
  return run.tasks.some((task) =>
    task.status !== "accepted" &&
    sanitizeCount(task.attempt) >= (sanitizeCount(task.attemptLimit) > 0 ? sanitizeCount(task.attemptLimit) : attemptLimit)
  );
}

function hasValidatingTask(run: MockOrchestratorRun): boolean {
  return run.tasks.some((task) => task.status === "validating");
}

function hasPendingGate(run: MockOrchestratorRun): boolean {
  return run.validationGates.some((gate) => gate.status === "pending");
}

function allGatesPassed(run: MockOrchestratorRun): boolean {
  return run.validationGates.every(isPassedGate);
}

export function createCockpitMonitorLoop(
  run: MockOrchestratorRun | undefined
): CockpitMonitorLoop {
  if (run === undefined) {
    return {
      label: "No loop active",
      detail: "Stage a run to monitor worker attempts.",
      tone: "waiting",
      attemptLabel: `0/${DEFAULT_ATTEMPT_LIMIT}`,
      gateLabel: "0/0 gates",
      workerLabel: "0 panels"
    };
  }

  const attemptLimit = resolveAttemptLimit(run.tasks);
  const currentAttempt = resolveCurrentAttempt(attemptLimit, run);
  const gateLabel = buildGateLabel(run);
  const workerLabel = pluralizePanel(run.sessions.length);
  const hasAnyFailedGate = run.validationGates.some(isFailedGate);
  const hasExhaustedTask = hasBlockedTask(run, attemptLimit);
  const isTerminalFailure = run.status === "blocked" || run.status === "failed" || hasAnyFailedGate || hasExhaustedTask;

  if (isTerminalFailure) {
    return {
      label: "Loop needs review",
      detail: "Worker attempts or validation gates need review.",
      tone: "blocked",
      attemptLabel: `${currentAttempt}/${attemptLimit}`,
      gateLabel,
      workerLabel
    };
  }

  if (run.status === "complete" && allGatesPassed(run)) {
    return {
      label: "Loop complete",
      detail: "Worker handoffs and validation gates are complete.",
      tone: "complete",
      attemptLabel: `${currentAttempt}/${attemptLimit}`,
      gateLabel,
      workerLabel
    };
  }

  if (hasPendingGate(run) || hasValidatingTask(run)) {
    return {
      label: "Validation active",
      detail: "Validation gates are still running.",
      tone: "validating",
      attemptLabel: `${currentAttempt}/${attemptLimit}`,
      gateLabel,
      workerLabel
    };
  }

  return {
    label: "Loop running",
    detail: "Worker attempts are progressing.",
    tone: "running",
    attemptLabel: `${currentAttempt}/${attemptLimit}`,
    gateLabel,
    workerLabel
  };
}
