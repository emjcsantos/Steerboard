import {
  applyValidatorReport,
  type AcceptanceCriterionResult,
  type ValidationCommandResult,
  type ValidatorFinding,
  type ValidatorJobRecord,
  type ValidatorNextAction,
  type ValidatorReport,
  type ValidatorVerdict
} from "./orchestratorValidatorLoop";
import type { OrchestratorBackendState, OrchestratorQueuedCommand } from "./orchestratorBackend";
import type { OrchestratorRuntimeCommandResult } from "./orchestratorRuntimeExecutor";
import type { PmWorkerReadyTask } from "./pmLaneWorkerReady";
import type { WorkerJobRecord, WorkerModelProfile } from "./orchestratorWorkerDispatch";
import { DEFAULT_PM_TASK_BUDGET, createPmTaskTemplateSnapshot } from "./pmLaneWorkerReady";
import { DEFAULT_WORKER_MODEL_PROFILE } from "./orchestratorWorkerDispatch";
import {
  createAcceptedWorkerCommit,
  type AcceptedWorkerCommit
} from "./orchestratorIntegration";

export interface ValidatorRuntimeReportApplyResult {
  backendState: OrchestratorBackendState;
  report: ValidatorReport;
  accepted: boolean;
  revisionQueued: boolean;
  correctiveTaskCount: number;
  acceptedCommit?: AcceptedWorkerCommit;
  takeoverQueued: boolean;
}

const verdicts = new Set<ValidatorVerdict>([
  "pass",
  "revision-required",
  "blocked",
  "needs-corrective-task"
]);

const nextActions = new Set<ValidatorNextAction>([
  "accept",
  "return-to-worker",
  "create-corrective-task",
  "escalate-human"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function asVerdict(value: unknown, fallback: ValidatorVerdict): ValidatorVerdict {
  return typeof value === "string" && verdicts.has(value as ValidatorVerdict)
    ? value as ValidatorVerdict
    : fallback;
}

function asNextAction(value: unknown, fallback: ValidatorNextAction): ValidatorNextAction {
  return typeof value === "string" && nextActions.has(value as ValidatorNextAction)
    ? value as ValidatorNextAction
    : fallback;
}

function parseCommandResults(value: unknown, fallback: ValidationCommandResult[]): ValidationCommandResult[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter(isRecord)
    .map((item) => {
      const status = item.status === "passed" || item.status === "failed" || item.status === "skipped"
        ? item.status
        : "skipped";

      return {
        command: asString(item.command, "validator runtime"),
        status,
        detail: asString(item.detail, "Validator command detail unavailable.")
      };
    });
}

function parseAcceptanceResults(
  value: unknown,
  sourceTask: PmWorkerReadyTask,
  verdict: ValidatorVerdict
): AcceptanceCriterionResult[] {
  if (Array.isArray(value)) {
    return value.filter(isRecord).map((item) => {
      const status = item.status === "pass" || item.status === "fail" || item.status === "unknown"
        ? item.status
        : "unknown";

      return {
        criterion: asString(item.criterion, "Unspecified acceptance criterion."),
        status,
        evidence: asStringArray(item.evidence)
      };
    });
  }

  return sourceTask.acceptanceCriteria.map((criterion) => ({
    criterion,
    status: verdict === "pass" ? "pass" : "unknown",
    evidence: []
  }));
}

function parseFindings(value: unknown, fallbackMessage: string): ValidatorFinding[] {
  if (!Array.isArray(value)) {
    return [
      {
        id: "validator-runtime-unstructured",
        severity: "error",
        message: fallbackMessage,
        files: [],
        sharedSurface: false,
        evidence: []
      }
    ];
  }

  const findings = value.filter(isRecord).map((item, index) => {
    const severity: ValidatorFinding["severity"] = item.severity === "info" || item.severity === "warning" || item.severity === "error"
      ? item.severity
      : "error";

    return {
      id: asString(item.id, `finding-${index + 1}`),
      severity,
      message: asString(item.message, "Validator finding did not include a message."),
      files: asStringArray(item.files),
      sharedSurface: item.sharedSurface === true,
      evidence: asStringArray(item.evidence)
    };
  });

  return findings.length > 0 ? findings : [];
}

function extractStructuredReport(value: unknown): Record<string, unknown> | undefined {
  if (isRecord(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const fenced = value.match(/```json\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? value;

  try {
    const parsed = JSON.parse(candidate);

    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function validatorReportFromRuntimeResult(input: {
  result: OrchestratorRuntimeCommandResult;
  sourceTask: PmWorkerReadyTask;
  workerJob: WorkerJobRecord;
  validatorJob: ValidatorJobRecord;
  createdAt: string;
  structuredOutput?: unknown;
}): ValidatorReport {
  const structured = extractStructuredReport(input.structuredOutput);
  const fallbackVerdict: ValidatorVerdict = input.result.blocked || !input.result.executed ? "blocked" : "revision-required";
  const verdict = asVerdict(structured?.verdict, fallbackVerdict);
  const nextAction = asNextAction(
    structured?.nextAction,
    verdict === "pass" ? "accept" : verdict === "revision-required" ? "return-to-worker" : "escalate-human"
  );
  const commandFallback: ValidationCommandResult[] = input.result.steps.map((step) => ({
    command: step.command,
    status: step.status === "passed" ? "passed" : step.status === "failed" || step.status === "blocked" ? "failed" : "skipped",
    detail: step.detail
  }));
  const fallbackMessage = input.result.detail || "Validator runtime did not return a structured report.";

  return {
    id: asString(structured?.id, `${input.validatorJob.id}:report:${input.createdAt}`),
    runId: input.validatorJob.runId,
    taskId: input.validatorJob.taskId,
    workerJobId: input.validatorJob.workerJobId,
    validatorJobId: input.validatorJob.id,
    attempt: asNumber(structured?.attempt, input.validatorJob.attempt),
    verdict,
    findings: verdict === "pass" ? parseFindings(structured?.findings, fallbackMessage).filter((finding) => finding.severity !== "error") : parseFindings(structured?.findings, fallbackMessage),
    commandsRun: parseCommandResults(structured?.commandsRun, commandFallback),
    acceptanceResults: parseAcceptanceResults(structured?.acceptanceResults, input.sourceTask, verdict),
    changedFiles: asStringArray(structured?.changedFiles),
    evidenceReferences: [
      ...asStringArray(structured?.evidenceReferences),
      ...input.result.artifactPaths
    ],
    nextAction,
    createdAt: input.createdAt
  };
}

export function applyValidatorRuntimeResult(input: {
  backendState: OrchestratorBackendState;
  sourceTask: PmWorkerReadyTask;
  workerJob: WorkerJobRecord;
  validatorJob: ValidatorJobRecord;
  result: OrchestratorRuntimeCommandResult;
  createdAt: string;
  structuredOutput?: unknown;
  maxAttempts?: number;
  exhaustionPolicy?: "orchestrator-takeover" | "corrective-task";
  orchestratorProfile?: WorkerModelProfile;
}): ValidatorRuntimeReportApplyResult {
  const report = validatorReportFromRuntimeResult(input);
  const loop = applyValidatorReport(
    input.backendState,
    input.sourceTask,
    input.workerJob,
    input.validatorJob,
    report,
    input.maxAttempts,
    input.exhaustionPolicy,
    input.orchestratorProfile
  );

  const acceptedCommit = loop.accepted
    ? createAcceptedWorkerCommit(loop.backendState, input.workerJob, report, {
        committedAt: input.createdAt,
        commandEvidence: report.commandsRun.map((command) => command.command)
      })
    : undefined;

  return {
    backendState: acceptedCommit?.backendState ?? loop.backendState,
    report,
    accepted: loop.accepted,
    revisionQueued: Boolean(loop.revisionPacket),
    correctiveTaskCount: loop.corrective?.tasks.length ?? 0,
    takeoverQueued: Boolean(loop.takeoverQueued),
    acceptedCommit: acceptedCommit?.commit
  };
}

function payloadString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function payloadNumber(payload: Record<string, unknown>, key: string, fallback: number): number {
  const value = payload[key];

  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function payloadStringList(payload: Record<string, unknown>, key: string): string[] {
  const value = payload[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

export function applyValidatorRuntimeCommandResult(input: {
  backendState: OrchestratorBackendState;
  command: OrchestratorQueuedCommand;
  result: OrchestratorRuntimeCommandResult;
  createdAt: string;
  maxAttempts?: number;
}): ValidatorRuntimeReportApplyResult | undefined {
  if (input.command.kind !== "validator.start") {
    return undefined;
  }

  const taskId = payloadString(input.command.payload, "taskId");
  const workerJobId = payloadString(input.command.payload, "workerJobId");
  const validatorJobId = payloadString(input.command.payload, "jobId");
  const worktreePath = payloadString(input.command.payload, "worktreePath");

  if (!taskId || !workerJobId || !validatorJobId || !worktreePath) {
    return undefined;
  }

  const attempt = payloadNumber(input.command.payload, "attempt", 1);
  const ownedFiles = payloadStringList(input.command.payload, "ownedFiles");
  const acceptanceCriteria = payloadStringList(input.command.payload, "acceptanceCriteria");
  const validationCommands = payloadStringList(input.command.payload, "validationCommands");
  const modelRouting = isRecord(input.command.payload.modelRouting) ? input.command.payload.modelRouting : undefined;
  const storedOrchestratorProfile = isRecord(modelRouting?.orchestrator) && modelRouting.orchestrator.role === "orchestrator"
    ? modelRouting.orchestrator as unknown as WorkerModelProfile
    : undefined;
  const exhaustionPolicy = input.backendState.runs.find((run) => run.id === input.command.runId)
    ?.scope.validationExhaustionPolicy ?? "orchestrator-takeover";
  const sourceTask: PmWorkerReadyTask = {
    id: taskId,
    title: `Validator task ${taskId}`,
    objective: `Validate worker output for ${taskId}.`,
    ownedFiles,
    forbiddenFiles: [],
    dependencies: [],
    acceptanceCriteria,
    validationCommands,
    rollbackPlan: `Revert worker branch changes for ${taskId}.`,
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    priority: "normal",
    capabilityProfile: "workspace-write",
    evidenceKinds: ["static-review", "command-output"],
    provenance: {
      origin: "orchestrator",
      labels: ["orchestrator-created", "validation-failure"]
    },
    templateSnapshot: createPmTaskTemplateSnapshot({
      taskId,
      templateId: "validator-runtime-command",
      resolvedAt: input.createdAt,
      templateJson: {
        commandId: input.command.id,
        workerJobId
      }
    }),
    status: "queued",
    createdAt: input.command.enqueuedAt,
    sequence: input.command.sequence
  };
  const workerJob: WorkerJobRecord = {
    id: workerJobId,
    runId: input.command.runId,
    taskId,
    branch: payloadString(input.command.payload, "branch") ?? "codex/orch/unknown",
    worktreePath,
    status: "completed",
    modelProfileId: DEFAULT_WORKER_MODEL_PROFILE.id,
    capabilityProfile: "workspace-write",
    budget: { ...DEFAULT_PM_TASK_BUDGET },
    ownedFiles,
    forbiddenFiles: [],
    attempt,
    lease: {},
    createdAt: input.command.enqueuedAt
  };
  const validatorJob: ValidatorJobRecord = {
    id: validatorJobId,
    runId: input.command.runId,
    taskId,
    workerJobId,
    worktreePath,
    status: input.result.blocked ? "failed" : "completed",
    capabilityProfile: "read-only",
    attempt,
    readonly: true,
    validationScope: {
      ownedFiles,
      acceptanceCriteria,
      validationCommands
    },
    createdAt: input.command.enqueuedAt
  };

  return applyValidatorRuntimeResult({
    backendState: input.backendState,
    sourceTask,
    workerJob,
    validatorJob,
    result: input.result,
    createdAt: input.createdAt,
    structuredOutput: input.result.structuredOutput,
    maxAttempts: input.maxAttempts,
    exhaustionPolicy,
    orchestratorProfile: storedOrchestratorProfile
  });
}
