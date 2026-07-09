import {
  enqueueOrchestratorCommand,
  enqueueOrchestratorEvent,
  type OrchestratorBackendState
} from "./orchestratorBackend";
import {
  DEFAULT_PM_TASK_BUDGET,
  createPmTaskTemplateSnapshot,
  prepareOrchestratorCreatedTaskForDispatch,
  type PmWorkerReadyTask,
  type ValidationEvidenceKind
} from "./pmLaneWorkerReady";
import type { WorkerJobRecord, WorkerJobStatus } from "./orchestratorWorkerDispatch";

export type ValidatorVerdict = "pass" | "revision-required" | "blocked" | "needs-corrective-task";
export type ValidatorNextAction =
  | "accept"
  | "return-to-worker"
  | "create-corrective-task"
  | "escalate-human";

export interface ValidatorJobRecord {
  id: string;
  runId: string;
  taskId: string;
  workerJobId: string;
  worktreePath: string;
  status: WorkerJobStatus;
  capabilityProfile: "read-only";
  attempt: number;
  readonly: true;
  validationScope: {
    ownedFiles: string[];
    acceptanceCriteria: string[];
    validationCommands: string[];
  };
  createdAt: string;
}

export interface ValidatorFinding {
  id: string;
  severity: "info" | "warning" | "error";
  message: string;
  files: string[];
  sharedSurface: boolean;
  evidence: string[];
}

export interface ValidationCommandResult {
  command: string;
  status: "passed" | "failed" | "skipped";
  detail: string;
}

export interface AcceptanceCriterionResult {
  criterion: string;
  status: "pass" | "fail" | "unknown";
  evidence: string[];
}

export interface ValidatorReport {
  id: string;
  runId: string;
  taskId: string;
  workerJobId: string;
  validatorJobId: string;
  attempt: number;
  verdict: ValidatorVerdict;
  findings: ValidatorFinding[];
  commandsRun: ValidationCommandResult[];
  acceptanceResults: AcceptanceCriterionResult[];
  changedFiles: string[];
  evidenceReferences: string[];
  nextAction: ValidatorNextAction;
  createdAt: string;
}

export interface WorkerRevisionPacket {
  taskId: string;
  workerJobId: string;
  attempt: number;
  nextAttempt: number;
  findings: ValidatorFinding[];
  requiredActions: string[];
}

export interface CorrectiveTaskResult {
  tasks: PmWorkerReadyTask[];
  blocksOriginalChain: boolean;
  blocksIntegration: boolean;
}

export interface ValidatorLoopResult {
  backendState: OrchestratorBackendState;
  accepted: boolean;
  revisionPacket?: WorkerRevisionPacket;
  corrective?: CorrectiveTaskResult;
}

const DEFAULT_MAX_ATTEMPTS = 3;

function findingFiles(report: ValidatorReport): string[] {
  const files = new Set<string>();

  for (const finding of report.findings) {
    for (const file of finding.files) {
      files.add(file);
    }
  }

  for (const file of report.changedFiles) {
    files.add(file);
  }

  return [...files];
}

function evidenceKindsForReport(report: ValidatorReport): ValidationEvidenceKind[] {
  const kinds = new Set<ValidationEvidenceKind>();

  if (report.commandsRun.some((command) => command.command.toLowerCase().includes("test"))) {
    kinds.add("unit-test");
  }

  if (report.commandsRun.some((command) => command.command.toLowerCase().includes("build"))) {
    kinds.add("build");
  }

  if (report.evidenceReferences.length > 0 || report.findings.some((finding) => finding.evidence.length > 0)) {
    kinds.add("command-output");
  }

  return kinds.size > 0 ? [...kinds] : ["static-review"];
}

export function createValidatorJobForWorker(
  backendState: OrchestratorBackendState,
  task: PmWorkerReadyTask,
  workerJob: WorkerJobRecord,
  createdAt: string
): { backendState: OrchestratorBackendState; job: ValidatorJobRecord } {
  const job: ValidatorJobRecord = {
    id: `${workerJob.id}:validator:${workerJob.attempt}`,
    runId: workerJob.runId,
    taskId: task.id,
    workerJobId: workerJob.id,
    worktreePath: workerJob.worktreePath,
    status: "queued",
    capabilityProfile: "read-only",
    attempt: workerJob.attempt,
    readonly: true,
    validationScope: {
      ownedFiles: [...task.ownedFiles],
      acceptanceCriteria: [...task.acceptanceCriteria],
      validationCommands: [...task.validationCommands]
    },
    createdAt
  };
  const nextState = enqueueOrchestratorCommand(backendState, {
    id: `${job.id}:start`,
    runId: workerJob.runId,
    kind: "validator.start",
    payload: {
      jobId: job.id,
      workerJobId: workerJob.id,
      taskId: task.id,
      branch: workerJob.branch,
      worktreePath: workerJob.worktreePath,
      capabilityProfile: job.capabilityProfile,
      attempt: job.attempt,
      ownedFiles: job.validationScope.ownedFiles,
      acceptanceCriteria: job.validationScope.acceptanceCriteria,
      validationCommands: job.validationScope.validationCommands
    },
    enqueuedAt: createdAt
  });

  return {
    backendState: nextState,
    job
  };
}

export function createWorkerRevisionPacket(
  report: ValidatorReport,
  maxAttempts = DEFAULT_MAX_ATTEMPTS
): WorkerRevisionPacket | undefined {
  if (report.verdict !== "revision-required" || report.attempt >= maxAttempts) {
    return undefined;
  }

  return {
    taskId: report.taskId,
    workerJobId: report.workerJobId,
    attempt: report.attempt,
    nextAttempt: report.attempt + 1,
    findings: report.findings,
    requiredActions: report.findings.map((finding) => finding.message)
  };
}

export function createCorrectivePmTasksFromReport(
  sourceTask: PmWorkerReadyTask,
  report: ValidatorReport
): CorrectiveTaskResult {
  const files = findingFiles(report);
  const hasSharedSurface = report.findings.some((finding) => finding.sharedSurface);
  const findings = report.findings.length > 0
    ? report.findings
    : [
        {
          id: "unresolved-validation",
          severity: "error" as const,
          message: "Resolve remaining validator failure.",
          files,
          sharedSurface: false,
          evidence: report.evidenceReferences
        }
      ];

  const tasks = findings.map((finding, index) => {
    const taskId = `${sourceTask.id}-corrective-${finding.id}`;
    const correctiveTask: PmWorkerReadyTask = {
      id: taskId,
      title: `Corrective: ${sourceTask.title}`,
      objective: finding.message,
      ownedFiles: finding.files.length > 0 ? finding.files : files,
      forbiddenFiles: [...sourceTask.forbiddenFiles],
      dependencies: [sourceTask.id],
      acceptanceCriteria: [
        `Validator finding ${finding.id} is resolved.`,
        ...sourceTask.acceptanceCriteria.filter((criterion) =>
          report.acceptanceResults.some((result) => result.criterion === criterion && result.status !== "pass")
        )
      ],
      validationCommands: report.commandsRun.map((command) => command.command),
      rollbackPlan: `Revert corrective changes for ${sourceTask.id} if validation still fails.`,
      budget: { ...DEFAULT_PM_TASK_BUDGET, maxWorkerAttempts: 3 },
      priority: hasSharedSurface ? "urgent" : "high",
      capabilityProfile: sourceTask.capabilityProfile,
      evidenceKinds: evidenceKindsForReport(report),
      provenance: {
        origin: "orchestrator",
        createdByRunId: report.runId,
        createdByJobId: report.validatorJobId,
        createdFromTaskId: sourceTask.id,
        createdFromFindingId: finding.id,
        labels: ["orchestrator-created", "corrective", "validation-failure"]
      },
      templateSnapshot: createPmTaskTemplateSnapshot({
        taskId,
        templateId: "validation-corrective",
        resolvedAt: report.createdAt,
        templateJson: {
          sourceTaskId: sourceTask.id,
          validatorReportId: report.id,
          findingId: finding.id
        }
      }),
      status: "draft",
      createdAt: report.createdAt,
      sequence: index + 1
    };

    return prepareOrchestratorCreatedTaskForDispatch(correctiveTask);
  });

  return {
    tasks,
    blocksOriginalChain: true,
    blocksIntegration: hasSharedSurface
  };
}

export function applyValidatorReport(
  backendState: OrchestratorBackendState,
  sourceTask: PmWorkerReadyTask,
  workerJob: WorkerJobRecord,
  validatorJob: ValidatorJobRecord,
  report: ValidatorReport,
  maxAttempts = DEFAULT_MAX_ATTEMPTS
): ValidatorLoopResult {
  let nextState = enqueueOrchestratorEvent(backendState, {
    id: report.id,
    runId: report.runId,
    kind: "validator.reported",
    payload: {
      phase: `Validator verdict: ${report.verdict}.`,
      reportId: report.id,
      taskId: report.taskId,
      workerJobId: report.workerJobId,
      validatorJobId: report.validatorJobId,
      attempt: report.attempt,
      verdict: report.verdict,
      nextAction: report.nextAction,
      findingCount: report.findings.length,
      findings: report.findings,
      commandsRun: report.commandsRun,
      acceptanceResults: report.acceptanceResults,
      changedFiles: report.changedFiles,
      evidenceReferences: report.evidenceReferences
    },
    dedupeKey: report.id,
    enqueuedAt: report.createdAt
  });

  if (report.verdict === "pass") {
    return {
      backendState: nextState,
      accepted: true
    };
  }

  const revisionPacket = createWorkerRevisionPacket(report, maxAttempts);

  if (revisionPacket) {
    nextState = enqueueOrchestratorCommand(nextState, {
      id: `${workerJob.id}:revise:${revisionPacket.nextAttempt}`,
      runId: workerJob.runId,
      kind: "worker.start",
      payload: {
        jobId: workerJob.id,
        taskId: workerJob.taskId,
        worktreePath: workerJob.worktreePath,
        attempt: revisionPacket.nextAttempt,
        defectCount: revisionPacket.findings.length,
        requiredActions: revisionPacket.requiredActions
      },
      enqueuedAt: report.createdAt
    });

    return {
      backendState: nextState,
      accepted: false,
      revisionPacket
    };
  }

  const corrective = createCorrectivePmTasksFromReport(sourceTask, {
    ...report,
    verdict: "needs-corrective-task",
    nextAction: "create-corrective-task"
  });

  return {
    backendState: nextState,
    accepted: false,
    corrective
  };
}
