import {
  enqueueOrchestratorCommand,
  enqueueOrchestratorEvent,
  type OrchestratorBackendState,
  type OrchestratorQueuedCommand
} from "./orchestratorBackend";
import type { OrchestratorRuntimeCommandResult } from "./orchestratorRuntimeExecutor";
import type { ValidatorReport } from "./orchestratorValidatorLoop";
import type { WorkerJobRecord, WorkerModelProfile } from "./orchestratorWorkerDispatch";

export interface OrchestratorTakeoverQueueResult {
  backendState: OrchestratorBackendState;
  queued: boolean;
  jobId?: string;
}

function payloadText(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function queueOrchestratorTakeover(input: {
  backendState: OrchestratorBackendState;
  workerJob: WorkerJobRecord;
  report: ValidatorReport;
  orchestratorProfile: WorkerModelProfile;
}): OrchestratorTakeoverQueueResult {
  const jobId = `${input.workerJob.id}:orchestrator-takeover`;
  const commandId = `${jobId}:start`;
  if (input.backendState.commandQueue.some((command) => command.id === commandId)) {
    return { backendState: input.backendState, queued: false, jobId };
  }
  const ownership = {
    releasedWorkerJobId: input.workerJob.id,
    transferredToJobId: jobId,
    ownedFiles: [...input.workerJob.ownedFiles],
    releasedAt: input.report.createdAt
  };
  let state = enqueueOrchestratorEvent(input.backendState, {
    id: `${jobId}:handoff`,
    runId: input.workerJob.runId,
    kind: "worker.progress",
    payload: {
      phase: "Validation exhausted; mutable scope transferred to orchestrator takeover.",
      workState: "takeover",
      taskId: input.workerJob.taskId,
      workerJobId: input.workerJob.id,
      takeoverJobId: jobId,
      reportId: input.report.id,
      ownership
    },
    dedupeKey: `${jobId}:handoff`,
    enqueuedAt: input.report.createdAt
  });
  state = enqueueOrchestratorCommand(state, {
    id: commandId,
    runId: input.workerJob.runId,
    kind: "orchestrator.takeover",
    payload: {
      jobId,
      jobKind: "orchestrator-takeover",
      taskId: input.workerJob.taskId,
      branch: input.workerJob.branch,
      worktreePath: input.workerJob.worktreePath,
      attempt: input.report.attempt,
      ownedFiles: input.workerJob.ownedFiles,
      forbiddenFiles: input.workerJob.forbiddenFiles,
      requiredActions: input.report.findings.map((finding) => finding.message),
      takeoverForReportId: input.report.id,
      ownership,
      modelProfile: {
        ...input.orchestratorProfile,
        capabilities: { ...input.orchestratorProfile.capabilities }
      },
      skipValidator: true
    },
    enqueuedAt: input.report.createdAt
  });
  return { backendState: state, queued: true, jobId };
}

export function applyOrchestratorTakeoverRuntimeResult(input: {
  backendState: OrchestratorBackendState;
  command: OrchestratorQueuedCommand;
  result: OrchestratorRuntimeCommandResult;
  createdAt: string;
}): { backendState: OrchestratorBackendState; completed: boolean; failed: boolean } | undefined {
  if (input.command.kind !== "orchestrator.takeover" || payloadText(input.command.payload, "jobKind") !== "orchestrator-takeover") {
    return undefined;
  }
  const taskId = payloadText(input.command.payload, "taskId") ?? "unknown-task";
  const jobId = payloadText(input.command.payload, "jobId") ?? input.command.id;
  const failed = input.result.blocked || !input.result.executed;
  let state = enqueueOrchestratorEvent(input.backendState, {
    id: `${jobId}:${failed ? "failed" : "completed"}`,
    runId: input.command.runId,
    kind: "worker.progress",
    payload: {
      phase: failed ? "Orchestrator takeover failed." : "Orchestrator takeover completed.",
      workState: failed ? "failed" : "accepted",
      taskId,
      takeoverJobId: jobId,
      detail: input.result.detail,
      artifactPaths: input.result.artifactPaths
    },
    dedupeKey: `${jobId}:${failed ? "failed" : "completed"}`,
    enqueuedAt: input.createdAt
  });
  if (!failed && !state.commandQueue.some((command) => command.kind === "worker.commit" && command.payload.workerJobId === jobId)) {
    state = enqueueOrchestratorCommand(state, {
      id: `${jobId}:commit`,
      runId: input.command.runId,
      kind: "worker.commit",
      payload: {
        taskId,
        workerJobId: jobId,
        branch: payloadText(input.command.payload, "branch"),
        worktreePath: payloadText(input.command.payload, "worktreePath"),
        validationReportId: payloadText(input.command.payload, "takeoverForReportId") ?? `${jobId}:takeover`,
        commandEvidence: input.result.artifactPaths,
        takeoverCompleted: true,
        sharedSurfaceChanged: true,
        ownership: input.command.payload.ownership
      },
      enqueuedAt: input.createdAt
    });
  }
  return { backendState: state, completed: !failed, failed };
}
