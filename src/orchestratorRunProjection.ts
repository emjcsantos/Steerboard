import type { OrchestratorBackendState, OrchestratorLedgerEntry } from "./orchestratorBackend";
import { hydrateClassroomParticipantProjection } from "./classroomParticipants";

export type OrchestratorWorkState =
  | "queued"
  | "assigned"
  | "running"
  | "submitted"
  | "validating"
  | "revision-required"
  | "accepted"
  | "blocked"
  | "failed"
  | "escalated"
  | "takeover"
  | "integrating"
  | "completed";

export type OrchestratorProjectionPresentation = "professional" | "classroom";

export interface OrchestratorRunProjectionCounts {
  runs: number;
  tasks: number;
  participants: number;
  jobs: number;
  messages: number;
  validations: number;
  completed: number;
}

export interface OrchestratorRunProjection {
  presentation: OrchestratorProjectionPresentation;
  runId?: string;
  phase: string;
  runStatus: string;
  counts: OrchestratorRunProjectionCounts;
  completionPercent: number;
  taskStates: Record<string, OrchestratorWorkState>;
  progress: string[];
  capacity: {
    approved: number;
    occupiedSeats: number;
    emptySeats: number;
    queued: number;
    active: number;
    waiting: number;
    validating: number;
    blocked: number;
    teacherStandingParticipantIds: string[];
    visibleQueueParticipantIds: string[];
  };
}

const allowedTransitions: Record<OrchestratorWorkState, ReadonlySet<OrchestratorWorkState>> = {
  queued: new Set(["assigned", "blocked", "failed", "escalated", "takeover"]),
  assigned: new Set(["running", "blocked", "failed", "escalated", "takeover"]),
  running: new Set(["submitted", "blocked", "failed", "escalated", "takeover"]),
  submitted: new Set(["validating", "blocked", "failed", "escalated", "takeover"]),
  validating: new Set(["revision-required", "accepted", "blocked", "failed", "escalated", "takeover"]),
  "revision-required": new Set(["assigned", "blocked", "failed", "escalated", "takeover"]),
  accepted: new Set(["integrating", "completed"]),
  blocked: new Set(["assigned", "escalated", "takeover", "failed"]),
  failed: new Set(["assigned", "escalated", "takeover"]),
  escalated: new Set(["takeover", "assigned", "blocked", "failed"]),
  takeover: new Set(["running", "submitted", "blocked", "failed"]),
  integrating: new Set(["completed", "blocked", "failed"]),
  completed: new Set()
};

export function transitionOrchestratorWorkState(
  current: OrchestratorWorkState,
  next: OrchestratorWorkState
): OrchestratorWorkState {
  if (current === next || allowedTransitions[current].has(next)) {
    return next;
  }
  return current;
}

export function sanitizeOrchestratorProgress(value: unknown, maxLength = 240): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const withoutThinking = value
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:thinking|chain-of-thought)[\s\S]*?```/gi, "")
    .replace(/\b(?:chain[- ]of[- ]thought|private reasoning|hidden reasoning)\b[^.!?]*(?:[.!?]|$)/gi, "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!withoutThinking) {
    return undefined;
  }
  return withoutThinking.length <= maxLength
    ? withoutThinking
    : `${withoutThinking.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

export class OrchestratorProgressThrottle {
  readonly messages: string[] = [];
  private lastAcceptedAt = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly minimumIntervalMs = 250,
    private readonly maximumMessages = 8
  ) {}

  push(value: unknown, atMs: number): boolean {
    const message = sanitizeOrchestratorProgress(value);
    if (!message || !Number.isFinite(atMs) || atMs - this.lastAcceptedAt < this.minimumIntervalMs) {
      return false;
    }
    this.messages.push(message);
    if (this.messages.length > this.maximumMessages) {
      this.messages.splice(0, this.messages.length - this.maximumMessages);
    }
    this.lastAcceptedAt = atMs;
    return true;
  }
}

function payloadText(entry: OrchestratorLedgerEntry, key: string): string | undefined {
  const value = entry.payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stateFromLedger(entry: OrchestratorLedgerEntry): OrchestratorWorkState | undefined {
  const explicit = payloadText(entry, "workState");
  if (explicit && explicit in allowedTransitions) {
    return explicit as OrchestratorWorkState;
  }
  if (entry.kind === "approval.requested") return "escalated";
  if (entry.kind === "integration.updated") {
    return payloadText(entry, "runStatus") === "completed" ? "completed" : "integrating";
  }
  if (entry.kind === "validator.reported") {
    const verdict = payloadText(entry, "verdict");
    if (verdict === "pass") return "accepted";
    if (verdict === "revision-required") return "revision-required";
    if (verdict === "fail") return "failed";
    return "validating";
  }
  if (entry.kind === "worker.progress") {
    const phase = `${entry.message} ${payloadText(entry, "phase") ?? ""}`.toLowerCase();
    if (phase.includes("blocked")) return "blocked";
    if (phase.includes("failed")) return "failed";
    if (phase.includes("completed")) return "submitted";
    return "running";
  }
  return undefined;
}

function buildTaskStates(state: OrchestratorBackendState, runId: string, taskIds: readonly string[]) {
  const taskStates: Record<string, OrchestratorWorkState> = Object.fromEntries(
    taskIds.map((taskId) => [taskId, "queued" as const])
  );
  const entries = state.ledger
    .filter((entry) => entry.runId === runId)
    .slice()
    .sort((first, second) => first.sequence - second.sequence);
  const latestSequence = new Map<string, number>();

  for (const entry of entries) {
    const taskId = payloadText(entry, "taskId");
    const nextState = stateFromLedger(entry);
    if (!taskId || !(taskId in taskStates) || !nextState) continue;
    if (entry.sequence <= (latestSequence.get(taskId) ?? 0)) continue;
    taskStates[taskId] = transitionOrchestratorWorkState(taskStates[taskId], nextState);
    latestSequence.set(taskId, entry.sequence);
  }
  return taskStates;
}

function sharedProjection(state: OrchestratorBackendState, runId?: string): Omit<OrchestratorRunProjection, "presentation"> {
  const run = runId
    ? state.runs.find((item) => item.id === runId)
    : state.runs.at(-1);
  if (!run) {
    return {
      phase: "Idle",
      runStatus: "empty",
      counts: { runs: 0, tasks: 0, participants: 0, jobs: 0, messages: 0, validations: 0, completed: 0 },
      completionPercent: 0,
      taskStates: {},
      progress: [],
      capacity: {
        approved: 5,
        occupiedSeats: 0,
        emptySeats: 5,
        queued: 0,
        active: 0,
        waiting: 0,
        validating: 0,
        blocked: 0,
        teacherStandingParticipantIds: [],
        visibleQueueParticipantIds: []
      }
    };
  }
  const classroom = hydrateClassroomParticipantProjection(state);
  const taskIds = [...new Set(run.scope.taskIds)];
  const taskStates = buildTaskStates(state, run.id, taskIds);
  if (run.status === "integrating" || run.status === "ready-for-finalization") {
    Object.keys(taskStates).forEach((taskId) => {
      if (taskStates[taskId] === "accepted") taskStates[taskId] = "integrating";
    });
  }
  if (run.status === "completed") {
    Object.keys(taskStates).forEach((taskId) => {
      if (taskStates[taskId] === "accepted" || taskStates[taskId] === "integrating") taskStates[taskId] = "completed";
    });
  }
  const runParticipants = classroom.participants.filter((item) => item.runId === run.id);
  const participantIds = new Set(runParticipants.map((item) => item.id));
  const jobs = classroom.jobs.filter((item) => item.runId === run.id && participantIds.has(item.participantId));
  const messages = classroom.messages.filter((item) => item.runId === run.id);
  const validations = state.ledger.filter((item) => item.runId === run.id && item.kind === "validator.reported").length;
  const completed = Object.values(taskStates).filter((item) => item === "accepted" || item === "integrating" || item === "completed").length;
  const progress = state.ledger
    .filter((item) => item.runId === run.id)
    .slice(-8)
    .map((item) => sanitizeOrchestratorProgress(item.message))
    .filter((item): item is string => Boolean(item));
  const approvedCapacity = run.scope.approvedWorkerCapacity;
  const queuedJobs = jobs.filter((job) => job.status === "queued");
  const activeJobs = jobs.filter((job) =>
    job.status === "leased" || job.status === "running" || job.status === "pausing" || job.status === "cancelling"
  );
  const waitingJobs = jobs.filter((job) => job.status === "paused" || job.status === "waiting-approval");
  const blockedTaskIds = new Set(
    Object.entries(taskStates)
      .filter(([, workState]) =>
        workState === "blocked" || workState === "failed" || workState === "escalated" || workState === "revision-required"
      )
      .map(([taskId]) => taskId)
  );
  jobs.filter((job) => job.status === "recovery-review" || job.status === "failed")
    .forEach((job) => blockedTaskIds.add(job.taskId));
  const assignedJobIds = new Set([...queuedJobs, ...activeJobs].map((job) => job.id));
  const assignedParticipants = runParticipants
    .filter((participant) => assignedJobIds.has(participant.currentJobId))
    .sort((first, second) => first.seat - second.seat);
  return {
    runId: run.id,
    phase: sanitizeOrchestratorProgress(run.phase) ?? "In progress",
    runStatus: run.status,
    counts: {
      runs: 1,
      tasks: taskIds.length,
      participants: runParticipants.length,
      jobs: jobs.length,
      messages: messages.length,
      validations,
      completed
    },
    completionPercent: taskIds.length === 0 ? 0 : Math.round((completed / taskIds.length) * 100),
    taskStates,
    progress,
    capacity: {
      approved: approvedCapacity,
      occupiedSeats: runParticipants.length,
      emptySeats: Math.max(approvedCapacity - runParticipants.length, 0),
      queued: queuedJobs.length,
      active: activeJobs.length,
      waiting: waitingJobs.length,
      validating: Object.values(taskStates).filter((item) => item === "validating").length,
      blocked: blockedTaskIds.size,
      teacherStandingParticipantIds: assignedParticipants.slice(0, 2).map((participant) => participant.id),
      visibleQueueParticipantIds: assignedParticipants.slice(2).map((participant) => participant.id)
    }
  };
}

export function projectOrchestratorRun(
  state: OrchestratorBackendState,
  presentation: OrchestratorProjectionPresentation,
  runId?: string
): OrchestratorRunProjection {
  return { presentation, ...sharedProjection(state, runId) };
}
