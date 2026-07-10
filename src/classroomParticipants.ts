import type { OrchestratorBackendState } from "./orchestratorBackend";
import type {
  WorkerJobRecord,
  WorkerDispatchJobClaim,
  WorkerJobStatus,
  WorkerModelProfile,
  WorkerModelProvider
} from "./orchestratorWorkerDispatch";

export type ClassroomParticipantLifecycle =
  | "queued"
  | "working"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled"
  | "limited";

export interface ClassroomModelProfileSnapshot {
  id: string;
  role: "worker";
  provider: WorkerModelProvider | "unknown";
  model: string;
  reasoningEffort: WorkerModelProfile["reasoningEffort"] | "unknown";
  authRef: string;
  capabilities: WorkerModelProfile["capabilities"];
}

export interface ClassroomParticipantSnapshot {
  id: string;
  runId: string;
  role: "worker";
  lifecycle: ClassroomParticipantLifecycle;
  seat: number;
  modelProfileSnapshot: ClassroomModelProfileSnapshot;
  currentJobId: string;
  messageIds: string[];
  executionState: "eligible" | "limited";
}

export interface ClassroomJobSnapshot {
  id: string;
  runId: string;
  participantId: string;
  taskId: string;
  branch: string;
  worktreePath: string;
  status: WorkerJobStatus;
  attempt: number;
  ownership: {
    ownedFiles: string[];
    forbiddenFiles: string[];
    leaseOwner?: string;
  };
  createdAt: string;
}

export interface ClassroomActorAwareMessage {
  id: string;
  runId: string;
  actor: { kind: "orchestrator" } | { kind: "participant"; participantId: string };
  body: string;
  createdAt: string;
}

export interface ClassroomPersistenceEnvelope {
  schemaVersion: 1;
  participant: ClassroomParticipantSnapshot;
  job: ClassroomJobSnapshot;
  message: ClassroomActorAwareMessage;
}

export interface ClassroomParticipantProjection {
  participants: ClassroomParticipantSnapshot[];
  jobs: ClassroomJobSnapshot[];
  messages: ClassroomActorAwareMessage[];
}

export interface ClassroomParticipantSummary {
  label: string;
  detail: string;
  participantId?: string;
  seatLabel?: string;
  modelLabel?: string;
  jobLabel?: string;
  messageCount: number;
  tone: "empty" | "ready" | "limited";
  ariaLabel: string;
}

export interface ClassroomDispatchContext {
  activeWorkerJobs: WorkerDispatchJobClaim[];
  existingWorkerJobs: WorkerDispatchJobClaim[];
  occupiedSeats: number[];
}

const providers = new Set<WorkerModelProvider>([
  "codex",
  "openai-api",
  "anthropic",
  "gemini",
  "local",
  "custom"
]);
const reasoningEfforts = new Set<WorkerModelProfile["reasoningEffort"]>([
  "low",
  "medium",
  "high",
  "extra-high"
]);
const lifecycles = new Set<ClassroomParticipantLifecycle>([
  "queued",
  "working",
  "waiting",
  "completed",
  "failed",
  "cancelled",
  "limited"
]);
const jobStatuses = new Set<WorkerJobStatus>([
  "queued",
  "leased",
  "running",
  "pausing",
  "paused",
  "cancelling",
  "waiting-approval",
  "completed",
  "failed",
  "cancelled",
  "stale",
  "recovery-review"
]);
const activeDispatchStatuses = new Set<WorkerJobStatus>([
  "queued",
  "leased",
  "running",
  "pausing",
  "paused",
  "cancelling",
  "waiting-approval",
  "recovery-review"
]);

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0))]
    : [];
}

function normalizeModel(value: unknown): { value: ClassroomModelProfileSnapshot; valid: boolean } {
  const source = record(value) ?? {};
  const id = typeof source.id === "string" ? source.id.trim() : "";
  const model = typeof source.model === "string" ? source.model.trim() : "";
  const provider = typeof source.provider === "string" && providers.has(source.provider as WorkerModelProvider)
    ? source.provider as WorkerModelProvider
    : "unknown";
  const reasoningEffort =
    typeof source.reasoningEffort === "string" &&
    reasoningEfforts.has(source.reasoningEffort as WorkerModelProfile["reasoningEffort"])
      ? source.reasoningEffort as WorkerModelProfile["reasoningEffort"]
      : "unknown";
  const capabilities = record(source.capabilities) ?? {};
  const normalizedCapabilities: WorkerModelProfile["capabilities"] = {
    tools: capabilities.tools === true,
    filesystem: capabilities.filesystem === true,
    shell: capabilities.shell === true,
    browser: capabilities.browser === true,
    structuredOutput: capabilities.structuredOutput === true
  };
  const authRef = typeof source.authRef === "string" ? source.authRef.trim() : "";
  const validCapabilities = ["tools", "filesystem", "shell", "browser", "structuredOutput"]
    .every((key) => typeof capabilities[key] === "boolean");
  return {
    value: {
      id: id || "missing-profile",
      role: "worker",
      provider,
      model: model || "Unknown model",
      reasoningEffort,
      authRef,
      capabilities: normalizedCapabilities
    },
    valid: Boolean(
      id &&
      source.role === "worker" &&
      model &&
      provider !== "unknown" &&
      reasoningEffort !== "unknown" &&
      authRef &&
      validCapabilities
    )
  };
}

function normalizeEnvelope(value: unknown, knownRunIds: ReadonlySet<string>): ClassroomPersistenceEnvelope | undefined {
  const envelope = record(value);
  const participantValue = record(envelope?.participant);
  const jobValue = record(envelope?.job);
  const messageValue = record(envelope?.message);
  if (envelope?.schemaVersion !== 1 || !participantValue || !jobValue || !messageValue) {
    return undefined;
  }
  const participantId = typeof participantValue.id === "string" ? participantValue.id.trim() : "";
  const runId = typeof participantValue.runId === "string" ? participantValue.runId : "";
  const seat = Number(participantValue.seat);
  if (!participantId || !knownRunIds.has(runId) || participantValue.role !== "worker" || !Number.isInteger(seat) || seat < 1 || seat > 20) {
    return undefined;
  }
  const model = normalizeModel(participantValue.modelProfileSnapshot);
  const lifecycle = typeof participantValue.lifecycle === "string" && lifecycles.has(participantValue.lifecycle as ClassroomParticipantLifecycle)
    ? participantValue.lifecycle as ClassroomParticipantLifecycle
    : "limited";
  const requestedExecutionState = participantValue.executionState === "eligible" ? "eligible" : "limited";
  const executionState = requestedExecutionState === "eligible" && model.valid && lifecycle !== "limited"
    ? "eligible"
    : "limited";
  const jobId = typeof jobValue.id === "string" ? jobValue.id.trim() : "";
  const taskId = typeof jobValue.taskId === "string" ? jobValue.taskId.trim() : "";
  const branch = typeof jobValue.branch === "string" ? jobValue.branch.trim() : "";
  const worktreePath = typeof jobValue.worktreePath === "string" ? jobValue.worktreePath.trim() : "";
  const attempt = Number(jobValue.attempt);
  const validJob = Boolean(jobId && taskId && branch && worktreePath && jobValue.runId === runId && jobValue.participantId === participantId && Number.isInteger(attempt) && attempt > 0);
  const sourceStatus = typeof jobValue.status === "string" && jobStatuses.has(jobValue.status as WorkerJobStatus)
    ? jobValue.status as WorkerJobStatus
    : "recovery-review";
  const ownership = record(jobValue.ownership) ?? {};
  const messageId = typeof messageValue.id === "string" ? messageValue.id.trim() : "";
  const actor = record(messageValue.actor);
  const body = typeof messageValue.body === "string" ? messageValue.body.trim() : "";
  const validActor = actor?.kind === "participant" && actor.participantId === participantId;
  if (!validJob || !messageId || messageValue.runId !== runId || !validActor || !body) {
    return undefined;
  }

  return {
    schemaVersion: 1,
    participant: {
      id: participantId,
      runId,
      role: "worker",
      lifecycle: executionState === "limited" ? "limited" : lifecycle,
      seat,
      modelProfileSnapshot: model.value,
      currentJobId: jobId,
      messageIds: stringArray(participantValue.messageIds).includes(messageId)
        ? stringArray(participantValue.messageIds)
        : [messageId],
      executionState
    },
    job: {
      id: jobId,
      runId,
      participantId,
      taskId,
      branch,
      worktreePath,
      status: executionState === "eligible" && sourceStatus !== "recovery-review" ? sourceStatus : "recovery-review",
      attempt,
      ownership: {
        ownedFiles: stringArray(ownership.ownedFiles),
        forbiddenFiles: stringArray(ownership.forbiddenFiles),
        leaseOwner: typeof ownership.leaseOwner === "string" && ownership.leaseOwner.trim()
          ? ownership.leaseOwner.trim()
          : undefined
      },
      createdAt: typeof jobValue.createdAt === "string" ? jobValue.createdAt : ""
    },
    message: {
      id: messageId,
      runId,
      actor: { kind: "participant", participantId },
      body,
      createdAt: typeof messageValue.createdAt === "string" ? messageValue.createdAt : ""
    }
  };
}

export function buildClassroomWorkerEnvelope(input: {
  job: WorkerJobRecord;
  modelProfile: WorkerModelProfile;
  seat: number;
  messageId: string;
  message: string;
}): ClassroomPersistenceEnvelope {
  const participantId = `${input.job.runId}:participant:${input.job.taskId}`;
  return {
    schemaVersion: 1,
    participant: {
      id: participantId,
      runId: input.job.runId,
      role: "worker",
      lifecycle: "queued",
      seat: input.seat,
      modelProfileSnapshot: {
        id: input.modelProfile.id,
        role: "worker",
        provider: input.modelProfile.provider,
        model: input.modelProfile.model,
        reasoningEffort: input.modelProfile.reasoningEffort,
        authRef: input.modelProfile.authRef,
        capabilities: { ...input.modelProfile.capabilities }
      },
      currentJobId: input.job.id,
      messageIds: [input.messageId],
      executionState: "eligible"
    },
    job: {
      id: input.job.id,
      runId: input.job.runId,
      participantId,
      taskId: input.job.taskId,
      branch: input.job.branch,
      worktreePath: input.job.worktreePath,
      status: input.job.status,
      attempt: input.job.attempt,
      ownership: {
        ownedFiles: [...input.job.ownedFiles],
        forbiddenFiles: [...input.job.forbiddenFiles],
        leaseOwner: input.job.lease.leaseOwner
      },
      createdAt: input.job.createdAt
    },
    message: {
      id: input.messageId,
      runId: input.job.runId,
      actor: { kind: "participant", participantId },
      body: input.message,
      createdAt: input.job.createdAt
    }
  };
}

export function hydrateClassroomParticipantProjection(
  state: OrchestratorBackendState
): ClassroomParticipantProjection {
  const runIds = new Set(state.runs.map((run) => run.id));
  const payloads = [
    ...state.commandQueue.map((item) => item.payload),
    ...state.eventQueue.map((item) => item.payload),
    ...state.ledger.map((item) => item.payload)
  ];
  const envelopes = payloads
    .map((payload) => normalizeEnvelope(payload.classroom, runIds))
    .filter((item): item is ClassroomPersistenceEnvelope => Boolean(item));
  const participants = new Map<string, ClassroomParticipantSnapshot>();
  const jobs = new Map<string, ClassroomJobSnapshot>();
  const messages = new Map<string, ClassroomActorAwareMessage>();
  const seats = new Set<string>();

  for (const envelope of envelopes) {
    const participantKey = `${envelope.participant.runId}:${envelope.participant.id}`;
    const seatKey = `${envelope.participant.runId}:${envelope.participant.seat}`;
    if (!participants.has(participantKey) && !seats.has(seatKey)) {
      participants.set(participantKey, envelope.participant);
      seats.add(seatKey);
    }
    if (participants.has(participantKey)) {
      jobs.set(envelope.job.id, envelope.job);
      messages.set(envelope.message.id, envelope.message);
    }
  }

  return {
    participants: [...participants.values()],
    jobs: [...jobs.values()],
    messages: [...messages.values()]
  };
}

export function selectClassroomDispatchContext(
  state: OrchestratorBackendState,
  runId: string
): ClassroomDispatchContext {
  const projection = hydrateClassroomParticipantProjection(state);
  const jobs = projection.jobs.filter((job) => job.runId === runId);
  const existingWorkerJobs: WorkerDispatchJobClaim[] = jobs.map((job) => ({
    id: job.id,
    runId: job.runId,
    taskId: job.taskId,
    status: job.status,
    ownedFiles: [...job.ownership.ownedFiles]
  }));
  const activeJobIds = new Set(
    jobs.filter((job) => activeDispatchStatuses.has(job.status)).map((job) => job.id)
  );
  return {
    activeWorkerJobs: existingWorkerJobs.filter((job) => activeDispatchStatuses.has(job.status)),
    existingWorkerJobs,
    occupiedSeats: projection.participants
      .filter((participant) => participant.runId === runId && activeJobIds.has(participant.currentJobId))
      .map((participant) => participant.seat)
  };
}

export function summarizeClassroomParticipant(
  projection: ClassroomParticipantProjection,
  runId?: string
): ClassroomParticipantSummary {
  const participant = projection.participants.find((item) => !runId || item.runId === runId);
  if (!participant) {
    return {
      label: "No classroom participant",
      detail: "No durable worker participant has been restored for this run.",
      messageCount: 0,
      tone: "empty",
      ariaLabel: "No classroom participant restored."
    };
  }
  const job = projection.jobs.find((item) => item.id === participant.currentJobId);
  const messageCount = projection.messages.filter((item) => participant.messageIds.includes(item.id)).length;
  const modelLabel = `${participant.modelProfileSnapshot.provider} / ${participant.modelProfileSnapshot.model}`;
  const tone = participant.executionState === "eligible" ? "ready" : "limited";
  return {
    label: "Restored classroom participant",
    detail: `${participant.id} is in seat ${participant.seat} with ${modelLabel}.`,
    participantId: participant.id,
    seatLabel: `Seat ${participant.seat}`,
    modelLabel,
    jobLabel: job ? `${job.taskId} · attempt ${job.attempt} · ${job.status}` : "No current job",
    messageCount,
    tone,
    ariaLabel: `Restored classroom participant ${participant.id}; seat ${participant.seat}; model ${modelLabel}; ${job ? `job ${job.taskId}, attempt ${job.attempt}, ${job.status}` : "no current job"}; ${messageCount} messages; ${tone}.`
  };
}
