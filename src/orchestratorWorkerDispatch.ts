import {
  enqueueOrchestratorCommand,
  enqueueOrchestratorEvent,
  type OrchestratorBackendState
} from "./orchestratorBackend";
import {
  evaluatePmWorkerReadyTask,
  orderPmDispatchQueue,
  type PmTaskBudget,
  type PmWorkerCapabilityProfile,
  type PmWorkerReadyTask
} from "./pmLaneWorkerReady";

export type WorkerJobStatus =
  | "queued"
  | "leased"
  | "running"
  | "pausing"
  | "paused"
  | "cancelling"
  | "waiting-approval"
  | "completed"
  | "failed"
  | "cancelled"
  | "stale"
  | "recovery-review";

export type WorkerModelProvider = "codex" | "openai-api" | "anthropic" | "gemini" | "local" | "custom";

export interface WorkerModelProfile {
  id: string;
  role: "worker" | "validator" | "orchestrator" | "pm-splitter" | "main-validator" | "summarizer";
  provider: WorkerModelProvider;
  model: string;
  reasoningEffort: "low" | "medium" | "high" | "extra-high";
  authRef: string;
  capabilities: {
    tools: boolean;
    filesystem: boolean;
    shell: boolean;
    browser: boolean;
    structuredOutput: boolean;
  };
}

export interface WorkerLeaseState {
  leaseOwner?: string;
  leasedAt?: string;
  heartbeatAt?: string;
}

export interface WorkerJobRecord {
  id: string;
  runId: string;
  taskId: string;
  branch: string;
  worktreePath: string;
  status: WorkerJobStatus;
  modelProfileId: string;
  capabilityProfile: PmWorkerCapabilityProfile;
  budget: PmTaskBudget;
  ownedFiles: string[];
  forbiddenFiles: string[];
  attempt: number;
  lease: WorkerLeaseState;
  createdAt: string;
}

export interface WorkerDispatchRequest {
  runId: string;
  repositoryRoot: string;
  worktreeRoot: string;
  createdAt: string;
  concurrencyLimit: number;
  activeWorkerJobs: readonly WorkerJobRecord[];
  existingWorkerJobs?: readonly WorkerJobRecord[];
  modelProfiles?: readonly WorkerModelProfile[];
}

export interface WorkerDispatchResult {
  backendState: OrchestratorBackendState;
  jobs: WorkerJobRecord[];
  queuedTaskIds: string[];
  blockedTaskIds: string[];
  skippedTaskIds: string[];
  approvalRequests: WorkerCapabilityApprovalRequest[];
}

export interface WorkerCapabilityApprovalRequest {
  id: string;
  runId: string;
  taskId: string;
  requestedProfile: PmWorkerCapabilityProfile;
  allowedProfile: PmWorkerCapabilityProfile;
  reason: string;
  createdAt: string;
}

export const DEFAULT_WORKER_MODEL_PROFILE: WorkerModelProfile = {
  id: "codex-gpt-5-3-spark-extra-high",
  role: "worker",
  provider: "codex",
  model: "gpt-5.3-spark",
  reasoningEffort: "extra-high",
  authRef: "codex-desktop",
  capabilities: {
    tools: true,
    filesystem: true,
    shell: true,
    browser: false,
    structuredOutput: true
  }
};

const capabilityRank: Record<PmWorkerCapabilityProfile, number> = {
  "chat-only": 0,
  "read-only": 1,
  "workspace-write": 2,
  "full-agent": 3
};

function normalizePathSegment(value: string): string {
  return value
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .toLowerCase()
    .trim();
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 56) || "task";
}

function joinWorkspacePath(root: string, segment: string): string {
  const separator = root.includes("\\") ? "\\" : "/";
  return `${root.replace(/[\\/]+$/, "")}${separator}${segment}`;
}

function taskDependenciesReady(task: PmWorkerReadyTask, completedTaskIds: ReadonlySet<string>): boolean {
  return task.dependencies.every((dependency) => completedTaskIds.has(dependency));
}

function hasOwnershipOverlap(
  task: PmWorkerReadyTask,
  activeJobs: readonly WorkerJobRecord[],
  selectedJobs: readonly WorkerJobRecord[]
): boolean {
  const owned = task.ownedFiles.map(normalizePathSegment);
  const claimed = [...activeJobs, ...selectedJobs].flatMap((job) => job.ownedFiles.map(normalizePathSegment));

  return owned.some((path) =>
    claimed.some((claim) => path === claim || path.startsWith(`${claim}/`) || claim.startsWith(`${path}/`))
  );
}

function createWorkerJob(input: {
  runId: string;
  task: PmWorkerReadyTask;
  worktreeRoot: string;
  createdAt: string;
  modelProfile: WorkerModelProfile;
  existingCount: number;
}): WorkerJobRecord {
  const slug = normalizeSlug(`${input.task.id}-${input.task.title}`);
  const suffix = input.existingCount > 0 ? `-${input.existingCount + 1}` : "";

  return {
    id: `${input.runId}:worker:${input.task.id}${suffix}`,
    runId: input.runId,
    taskId: input.task.id,
    branch: `codex/orch/${slug}${suffix}`,
    worktreePath: joinWorkspacePath(input.worktreeRoot, `${slug}${suffix}`),
    status: "queued",
    modelProfileId: input.modelProfile.id,
    capabilityProfile: input.task.capabilityProfile,
    budget: input.task.budget,
    ownedFiles: [...input.task.ownedFiles],
    forbiddenFiles: [...input.task.forbiddenFiles],
    attempt: 1,
    lease: {},
    createdAt: input.createdAt
  };
}

function resolveWorkerModelProfile(profiles: readonly WorkerModelProfile[] | undefined): WorkerModelProfile {
  return profiles?.find((profile) => profile.role === "worker") ?? DEFAULT_WORKER_MODEL_PROFILE;
}

function createApprovalRequest(input: {
  runId: string;
  task: PmWorkerReadyTask;
  allowedProfile: PmWorkerCapabilityProfile;
  createdAt: string;
}): WorkerCapabilityApprovalRequest {
  return {
    id: `${input.runId}:approval:${input.task.id}`,
    runId: input.runId,
    taskId: input.task.id,
    requestedProfile: input.task.capabilityProfile,
    allowedProfile: input.allowedProfile,
    reason: `Task requested ${input.task.capabilityProfile} but dispatch profile allows ${input.allowedProfile}.`,
    createdAt: input.createdAt
  };
}

export function dispatchWorkerReadyTasks(
  backendState: OrchestratorBackendState,
  tasks: readonly PmWorkerReadyTask[],
  request: WorkerDispatchRequest
): WorkerDispatchResult {
  const selectedJobs: WorkerJobRecord[] = [];
  const blockedTaskIds: string[] = [];
  const skippedTaskIds: string[] = [];
  const approvalRequests: WorkerCapabilityApprovalRequest[] = [];
  const completedTaskIds = new Set(
    [...(request.existingWorkerJobs ?? []), ...request.activeWorkerJobs]
      .filter((job) => job.status === "completed")
      .map((job) => job.taskId)
  );
  const modelProfile = resolveWorkerModelProfile(request.modelProfiles);
  const capacity = Math.max(0, request.concurrencyLimit - request.activeWorkerJobs.length);
  let nextState = backendState;

  for (const task of orderPmDispatchQueue(tasks)) {
    if (selectedJobs.length >= capacity) {
      skippedTaskIds.push(task.id);
      continue;
    }

    const evaluation = evaluatePmWorkerReadyTask(task);

    if (!evaluation.ready || !taskDependenciesReady(task, completedTaskIds)) {
      blockedTaskIds.push(task.id);
      continue;
    }

    if (hasOwnershipOverlap(task, request.activeWorkerJobs, selectedJobs)) {
      blockedTaskIds.push(task.id);
      continue;
    }

    if (capabilityRank[task.capabilityProfile] > capabilityRank["workspace-write"]) {
      const approvalRequest = createApprovalRequest({
        runId: request.runId,
        task,
        allowedProfile: "workspace-write",
        createdAt: request.createdAt
      });

      approvalRequests.push(approvalRequest);
      nextState = enqueueOrchestratorEvent(nextState, {
        id: approvalRequest.id,
        runId: request.runId,
        kind: "approval.requested",
        payload: {
          taskId: task.id,
          requestedProfile: task.capabilityProfile,
          allowedProfile: approvalRequest.allowedProfile,
          reason: approvalRequest.reason
        },
        dedupeKey: approvalRequest.id,
        enqueuedAt: request.createdAt
      });
      continue;
    }

    const existingCount = (request.existingWorkerJobs ?? []).filter((job) => job.taskId === task.id).length;
    const job = createWorkerJob({
      runId: request.runId,
      task,
      worktreeRoot: request.worktreeRoot,
      createdAt: request.createdAt,
      modelProfile,
      existingCount
    });

    selectedJobs.push(job);
    nextState = enqueueOrchestratorCommand(nextState, {
      id: `${job.id}:start`,
      runId: request.runId,
      kind: "worker.start",
      payload: {
        jobId: job.id,
        taskId: job.taskId,
        branch: job.branch,
        worktreePath: job.worktreePath,
        repositoryRoot: request.repositoryRoot,
        modelProfileId: job.modelProfileId,
        capabilityProfile: job.capabilityProfile
      },
      enqueuedAt: request.createdAt
    });
    nextState = enqueueOrchestratorEvent(nextState, {
      id: `${job.id}:queued`,
      runId: request.runId,
      kind: "worker.progress",
      payload: {
        phase: `Worker queued for ${task.title}.`,
        jobId: job.id,
        taskId: task.id,
        branch: job.branch,
        worktreePath: job.worktreePath
      },
      dedupeKey: `${job.id}:queued`,
      enqueuedAt: request.createdAt
    });
  }

  return {
    backendState: nextState,
    jobs: selectedJobs,
    queuedTaskIds: selectedJobs.map((job) => job.taskId),
    blockedTaskIds,
    skippedTaskIds,
    approvalRequests
  };
}
