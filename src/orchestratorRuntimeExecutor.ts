import {
  enqueueOrchestratorCommand,
  enqueueOrchestratorEvent,
  type OrchestratorBackendState,
  type OrchestratorCommandKind,
  type OrchestratorEventKind,
  type OrchestratorQueuedCommand
} from "./orchestratorBackend";
import { hasTauriRuntime } from "./tauriRuntime";

export type OrchestratorRuntimeCommandKind =
  | "worker.start"
  | "worker.commit"
  | "validator.start"
  | "integration.start"
  | "cleanup.start"
  | "finalization.merge"
  | "remote.push";

export interface OrchestratorRuntimeCommandRequest {
  commandId: string;
  runId: string;
  kind: OrchestratorRuntimeCommandKind;
  repositoryRoot: string;
  payload: Record<string, unknown>;
}

export interface OrchestratorRuntimeCommandStep {
  label: string;
  command: string;
  status: "passed" | "blocked" | "failed" | "skipped";
  detail: string;
}

export interface OrchestratorRuntimeCommandResult {
  commandId: string;
  runId: string;
  kind: OrchestratorCommandKind;
  executed: boolean;
  blocked: boolean;
  artifactPaths: string[];
  steps: OrchestratorRuntimeCommandStep[];
  detail: string;
  structuredOutput?: unknown;
}

export interface OrchestratorRuntimeDrainResult {
  backendState: OrchestratorBackendState;
  command?: OrchestratorQueuedCommand;
  result?: OrchestratorRuntimeCommandResult;
  drained: boolean;
}

const executableKinds = new Set<string>([
  "worker.start",
  "worker.commit",
  "validator.start",
  "integration.start",
  "cleanup.start",
  "finalization.merge",
  "remote.push"
]);

const controlKinds = new Set<string>(["worker.pause", "worker.cancel"]);

export function buildRuntimeCommandRequest(
  command: OrchestratorQueuedCommand,
  repositoryRoot: string
): OrchestratorRuntimeCommandRequest {
  if (!executableKinds.has(command.kind)) {
    throw new Error(`orchestrator_runtime_unsupported_command:${command.kind}`);
  }

  return {
    commandId: command.id,
    runId: command.runId,
    kind: command.kind as OrchestratorRuntimeCommandKind,
    repositoryRoot,
    payload: command.payload
  };
}

export async function executeOrchestratorRuntimeCommand(
  request: OrchestratorRuntimeCommandRequest
): Promise<OrchestratorRuntimeCommandResult> {
  if (!hasTauriRuntime()) {
    throw new Error("orchestrator_runtime_tauri_unavailable");
  }

  const { invoke } = await import("@tauri-apps/api/core");

  return invoke<OrchestratorRuntimeCommandResult>("orchestrator_execute_command", {
    request
  });
}

function eventKindForCommand(kind: OrchestratorCommandKind): OrchestratorEventKind {
  switch (kind) {
    case "worker.start":
    case "worker.commit":
    case "worker.pause":
      return "worker.progress";
    case "worker.cancel":
      return "cleanup.updated";
    case "validator.start":
      return "validator.reported";
    case "integration.start":
    case "finalization.merge":
    case "remote.push":
      return "integration.updated";
    case "cleanup.start":
      return "cleanup.updated";
  }
}

function phaseForResult(result: OrchestratorRuntimeCommandResult): string {
  if (controlKinds.has(result.kind)) {
    return result.detail;
  }

  if (result.blocked) {
    return `Runtime command blocked: ${result.kind}.`;
  }

  return `Runtime command completed: ${result.kind}.`;
}

function markCommand(
  state: OrchestratorBackendState,
  commandId: string,
  status: "processed" | "ignored",
  processedAt: string
): OrchestratorBackendState {
  return {
    ...state,
    commandQueue: state.commandQueue.map((command) =>
      command.id === commandId
        ? {
            ...command,
            status,
            processedAt
          }
        : command
    )
  };
}

function payloadString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function payloadBoolean(payload: Record<string, unknown>, key: string): boolean {
  return payload[key] === true;
}

function payloadNumber(payload: Record<string, unknown>, key: string): number | undefined {
  const value = payload[key];

  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function payloadStringList(payload: Record<string, unknown>, key: string): string[] {
  const value = payload[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function enqueueValidatorAfterWorker(
  state: OrchestratorBackendState,
  command: OrchestratorQueuedCommand,
  result: OrchestratorRuntimeCommandResult,
  processedAt: string
): OrchestratorBackendState {
  if (command.kind !== "worker.start" || result.blocked || !result.executed) {
    return state;
  }

  const jobId = payloadString(command.payload, "jobId");
  const taskId = payloadString(command.payload, "taskId");
  const worktreePath = payloadString(command.payload, "worktreePath");
  const attempt = payloadNumber(command.payload, "attempt") ?? 1;

  if (!jobId || !taskId || !worktreePath) {
    return state;
  }

  const validatorJobId = `${jobId}:validator:${attempt}`;
  const validatorCommandId = `${validatorJobId}:start`;

  if (state.commandQueue.some((queued) => queued.id === validatorCommandId)) {
    return state;
  }

  return enqueueOrchestratorCommand(state, {
    id: validatorCommandId,
    runId: command.runId,
    kind: "validator.start",
    payload: {
      jobId: validatorJobId,
      workerJobId: jobId,
      taskId,
      branch: payloadString(command.payload, "branch"),
      worktreePath,
      capabilityProfile: "read-only",
      attempt,
      ownedFiles: payloadStringList(command.payload, "ownedFiles"),
      acceptanceCriteria: payloadStringList(command.payload, "acceptanceCriteria"),
      validationCommands: payloadStringList(command.payload, "validationCommands"),
      workerArtifactPaths: result.artifactPaths
    },
    enqueuedAt: processedAt
  });
}

function controlDetailForCommand(command: OrchestratorQueuedCommand): string {
  const jobId = payloadString(command.payload, "jobId") ?? "unknown job";
  const reason = payloadString(command.payload, "reason");

  switch (command.kind) {
    case "worker.pause":
      return reason ? `Worker pause acknowledged for ${jobId}: ${reason}.` : `Worker pause acknowledged for ${jobId}.`;
    case "worker.cancel":
      return reason ? `Worker cancel acknowledged for ${jobId}: ${reason}.` : `Worker cancel acknowledged for ${jobId}.`;
    default:
      return `Control command acknowledged for ${jobId}.`;
  }
}

function resultForControlCommand(
  command: OrchestratorQueuedCommand
): OrchestratorRuntimeCommandResult {
  const retainedForReview =
    command.kind === "worker.cancel" &&
    (payloadBoolean(command.payload, "hasChanges") ||
      payloadBoolean(command.payload, "hasEvidence") ||
      payloadBoolean(command.payload, "retainedForReview"));

  return {
    commandId: command.id,
    runId: command.runId,
    kind: command.kind,
    executed: true,
    blocked: false,
    artifactPaths: [],
    steps: [
      {
        label: "Apply orchestrator control command",
        command: command.kind,
        status: "passed",
        detail:
          command.kind === "worker.cancel" && retainedForReview
            ? "Worker cancellation retained evidence for review."
            : "Control command state was recorded durably."
      }
    ],
    detail: controlDetailForCommand(command),
    structuredOutput: {
      controlCommand: true,
      jobId: payloadString(command.payload, "jobId"),
      taskId: payloadString(command.payload, "taskId"),
      preventNewTurns: true,
      preventFileMutations: command.kind === "worker.cancel",
      retainedForReview
    }
  };
}

export async function drainNextOrchestratorRuntimeCommand(
  state: OrchestratorBackendState,
  input: {
    repositoryRoot: string;
    processedAt: string;
    execute?: (request: OrchestratorRuntimeCommandRequest) => Promise<OrchestratorRuntimeCommandResult>;
  }
): Promise<OrchestratorRuntimeDrainResult> {
  const command = [...state.commandQueue]
    .filter((item) => item.status === "queued")
    .sort((first, second) => first.sequence - second.sequence)[0];

  if (!command) {
    return {
      backendState: state,
      drained: false
    };
  }

  if (controlKinds.has(command.kind)) {
    const result = resultForControlCommand(command);
    const marked = markCommand(state, command.id, "processed", input.processedAt);
    const backendState = enqueueOrchestratorEvent(marked, {
      id: `${command.id}:control:${input.processedAt}`,
      runId: command.runId,
      kind: eventKindForCommand(command.kind),
      payload: {
        phase: phaseForResult(result),
        commandId: command.id,
        commandKind: command.kind,
        executed: result.executed,
        blocked: result.blocked,
        detail: result.detail,
        artifactPaths: result.artifactPaths,
        steps: result.steps.map((step) => ({
          label: step.label,
          command: step.command,
          status: step.status,
          detail: step.detail
        })),
        structuredOutput: result.structuredOutput
      },
      dedupeKey: `${command.id}:control`,
      enqueuedAt: input.processedAt
    });

    return {
      backendState,
      command,
      result,
      drained: true
    };
  }

  let request: OrchestratorRuntimeCommandRequest;

  try {
    request = buildRuntimeCommandRequest(command, input.repositoryRoot);
  } catch {
    return {
      backendState: markCommand(state, command.id, "ignored", input.processedAt),
      command,
      drained: true
    };
  }

  const execute = input.execute ?? executeOrchestratorRuntimeCommand;
  const result = await execute(request);
  const marked = markCommand(state, command.id, result.blocked ? "ignored" : "processed", input.processedAt);
  const withValidator = enqueueValidatorAfterWorker(marked, command, result, input.processedAt);
  const backendState = enqueueOrchestratorEvent(withValidator, {
    id: `${command.id}:runtime:${input.processedAt}`,
    runId: command.runId,
    kind: eventKindForCommand(request.kind),
    payload: {
      phase: phaseForResult(result),
      commandId: command.id,
      commandKind: command.kind,
      executed: result.executed,
      blocked: result.blocked,
      detail: result.detail,
      artifactPaths: result.artifactPaths,
      steps: result.steps.map((step) => ({
        label: step.label,
        command: step.command,
        status: step.status,
        detail: step.detail
      }))
    },
    dedupeKey: `${command.id}:runtime`,
    enqueuedAt: input.processedAt
  });

  return {
    backendState,
    command,
    result,
    drained: true
  };
}
