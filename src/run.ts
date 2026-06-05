import type { DispatchPackage } from "./dispatch";
import type { OrchestrationTask, TaskRole, TaskStatus } from "./orchestration";

const DEFAULT_RUN_ID_SEED = "mock-orchestrator-run";
const DEFAULT_ORCHESTRATOR_RUNTIME = "Model-only orchestrator";
const DEFAULT_BRANCH = "mock/orchestrator";
const WORKER_ATTEMPT_LIMIT = 3;
const ORCHESTRATOR_ATTEMPT_LIMIT = 1;

export type MockRunStatus = "queued" | "running" | "complete" | "blocked" | "failed";
export type ValidationGateStatus = "pending" | "passed" | "failed";

export interface MockRunOptions {
  createdAt?: string;
  idSeed?: string;
  status?: MockRunStatus;
}

export type MockRunSessionRole = "orchestrator" | "implementer" | "validator" | "integration";

export type MockRunSessionState =
  | "idle"
  | "planning"
  | "implementing"
  | "validating"
  | "blocked"
  | "failed"
  | "complete";

export interface MockRunSessionSummary {
  id: string;
  projectId: string;
  title: string;
  role: MockRunSessionRole;
  state: MockRunSessionState;
  branch: string;
  runtime: string;
  attempt: number;
  validation: string;
  files: string[];
  transcript: string[];
  tools: string[];
}

export interface MockValidationGate {
  id: string;
  label: string;
  command: string;
  status: ValidationGateStatus;
  detail: string;
}

export interface MockRunSummary {
  objective: string;
  scopeCount: number;
  fileAreaCount: number;
  acceptanceCriteriaCount: number;
  validationGateCount: number;
  risk: DispatchPackage["risk"];
}

export interface MockOrchestratorRun {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: MockRunStatus;
  createdAt: string;
  sourcePackageId: string;
  summary: MockRunSummary;
  sessions: MockRunSessionSummary[];
  tasks: OrchestrationTask[];
  validationGates: MockValidationGate[];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeCreatedAt(createdAt?: string): string {
  return isNonEmptyString(createdAt) ? createdAt : new Date().toISOString();
}

function normalizeIdSeed(seed?: string): string {
  return normalizeListValue(seed, DEFAULT_RUN_ID_SEED);
}

function normalizeListValue(value: string | undefined, fallback: string): string {
  return isNonEmptyString(value) ? value : fallback;
}

function normalizeSegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 48) || "segment";
}

function fallbackList(items: string[], fallbackItem: string): string[] {
  return items.length > 0 ? items : [fallbackItem];
}

function resolveRunStatus(
  requestedStatus?: MockRunStatus,
  packageStatus: DispatchPackage["status"] = "staged"
): MockRunStatus {
  if (isNonEmptyString(requestedStatus)) {
    return requestedStatus as MockRunStatus;
  }

  return packageStatus === "ready" ? "running" : "queued";
}

function resolveTaskStatus(runStatus: MockRunStatus, role: TaskRole): TaskStatus {
  if (runStatus === "complete") {
    return "accepted";
  }

  if (runStatus === "blocked" || runStatus === "failed") {
    return "blocked";
  }

  if (runStatus === "queued") {
    return "queued";
  }

  return role === "validation" ? "validating" : "implementing";
}

function resolveRunSessionState(taskStatus: TaskStatus, runStatus: MockRunStatus): MockRunSessionState {
  if (runStatus === "failed") {
    return "failed";
  }

  switch (taskStatus) {
    case "accepted":
      return "complete";
    case "blocked":
      return "blocked";
    case "implementing":
      return "implementing";
    case "validating":
      return "validating";
    case "queued":
    default:
      return "planning";
  }
}

function taskRoleToSessionRole(role: TaskRole): MockRunSessionRole {
  switch (role) {
    case "planning":
      return "orchestrator";
    case "implementation":
      return "implementer";
    case "validation":
      return "validator";
    case "integration":
      return "integration";
  }
}

function taskRoleTools(role: TaskRole): string[] {
  switch (role) {
    case "planning":
      return ["Plan", "Split", "Handoff"];
    case "implementation":
      return ["Edit", "Build", "Test"];
    case "validation":
      return ["Lint", "Verify", "Report"];
    case "integration":
      return ["Review", "Integrate"];
  }
}

function buildRunId(seed: string, dispatchPackage: DispatchPackage, createdAt: string): string {
  return [
    normalizeSegment(seed),
    normalizeSegment(dispatchPackage.targetProject.id),
    normalizeSegment(dispatchPackage.id),
    normalizeSegment(createdAt)
  ].join("-");
}

function buildValidationGateStatus(runStatus: MockRunStatus): ValidationGateStatus {
  if (runStatus === "complete") {
    return "passed";
  }

  if (runStatus === "failed" || runStatus === "blocked") {
    return "failed";
  }

  return "pending";
}

function createMockValidationGates(
  runId: string,
  dispatchPackage: DispatchPackage,
  runStatus: MockRunStatus
): MockValidationGate[] {
  const commandEntries = fallbackList(
    dispatchPackage.validationPlan,
    "No validation command configured for this package."
  );

  return commandEntries.map((command, index) => ({
    id: `${runId}-gate-${normalizeSegment(String(index + 1))}`,
    label: "Dispatch validation gate",
    command,
    status: buildValidationGateStatus(runStatus),
    detail: "Model-only gate; no runtime execution is performed."
  }));
}

function buildValidationObjective(pack: DispatchPackage): string {
  return isNonEmptyString(pack.objective)
    ? pack.objective
    : "No objective was provided for this staged package.";
}

function buildValidationCommandFallback(): string {
  return "No validation command configured for this package.";
}

function formatHandoffField(values: string[]): string {
  return values.length > 0 ? values.join(" | ") : "No values recorded.";
}

function buildSessionTranscript(task: OrchestrationTask): string[] {
  return [
    `Handoff for ${task.role}`,
    `Objective: ${task.objective}`,
    `Scope: ${formatHandoffField(task.scope)}`,
    `File ownership: ${formatHandoffField(task.fileOwnership)}`,
    `Acceptance criteria: ${formatHandoffField(task.acceptanceCriteria)}`,
    `Validation commands: ${formatHandoffField(task.validationCommands)}`,
    `Dependencies: ${formatHandoffField(task.dependencies)}`,
    `Rollback: ${task.rollback}`
  ];
}

function createMockTasks(
  runId: string,
  dispatchPackage: DispatchPackage,
  runStatus: MockRunStatus
): OrchestrationTask[] {
  const tasks: OrchestrationTask[] = [];
  const fallbackScope = fallbackList(
    dispatchPackage.scope,
    "Discover scope once the orchestrator model is triggered."
  );
  const fallbackFiles = fallbackList(dispatchPackage.fileAreas, "No files declared in dispatch package.");
  const fallbackAcceptance = fallbackList(
    dispatchPackage.acceptanceCriteria,
    "No acceptance criteria were captured."
  );

  const planningTaskId = `${runId}-task-planning`;
  tasks.push({
    id: planningTaskId,
    projectId: dispatchPackage.targetProject.id,
    title: "Plan staged run execution",
    role: "planning",
    status: resolveTaskStatus(runStatus, "planning"),
    attempt: 0,
    attemptLimit: ORCHESTRATOR_ATTEMPT_LIMIT,
    owner: "Orchestrator",
    objective: buildValidationObjective(dispatchPackage),
    scope: fallbackScope,
    fileOwnership: ["run model", "summary markdown"],
    acceptanceCriteria: fallbackAcceptance,
    validationCommands: ["Generate session snapshots", "Collect task handoff payload"],
    dependencies: [],
    rollback: "No rollback action is required for mock model output."
  });

  const implementerTaskId = `${runId}-task-implementer`;
  tasks.push({
    id: implementerTaskId,
    projectId: dispatchPackage.targetProject.id,
    title: "Prepare implementation evidence",
    role: "implementation",
    status: resolveTaskStatus(runStatus, "implementation"),
    attempt: 0,
    attemptLimit: WORKER_ATTEMPT_LIMIT,
    owner: "Mock Worker",
    objective: `Implement ${dispatchPackage.sourceDraftTitle} from orchestrator plan.`,
    scope: [
      "Apply staged scope in small, verifiable edits.",
      ...fallbackScope
    ],
    fileOwnership: fallbackFiles,
    acceptanceCriteria: fallbackAcceptance,
    validationCommands: ["Capture implementation notes", "Record ownership boundaries"],
    dependencies: [planningTaskId],
    rollback: dispatchPackage.rollbackNote || "No rollback note was supplied."
  });

  fallbackList(
    dispatchPackage.validationPlan,
    buildValidationCommandFallback()
  ).forEach((command, index) => {
    tasks.push({
      id: `${runId}-task-validation-${normalizeSegment(String(index + 1))}`,
      projectId: dispatchPackage.targetProject.id,
      title: `Run staged validation command ${index + 1}`,
      role: "validation",
      status: resolveTaskStatus(runStatus, "validation"),
      attempt: 0,
      attemptLimit: WORKER_ATTEMPT_LIMIT,
      owner: `Validation Worker ${index + 1}`,
      objective: `Validate the implementation handoff for ${dispatchPackage.sourceDraftTitle}.`,
      scope: [`Evidence command: ${command}`, ...fallbackScope],
      fileOwnership: fallbackFiles,
      acceptanceCriteria: fallbackAcceptance,
      validationCommands: ["Collect evidence summary", command],
      dependencies: [implementerTaskId],
      rollback: "No runtime rollback is required for mocked validation commands."
    });
  });

  tasks.push({
    id: `${runId}-task-integration`,
    projectId: dispatchPackage.targetProject.id,
    title: "Prepare integration handoff",
    role: "integration",
    status: resolveTaskStatus(runStatus, "integration"),
    attempt: 0,
    attemptLimit: ORCHESTRATOR_ATTEMPT_LIMIT,
    owner: "Orchestrator",
    objective: "Collect summaries, task state, and handoff gates for operator review.",
    scope: [
      "Collect validated command evidence.",
      "Prepare operator-visible cockpit rows and handoff metadata."
    ],
    fileOwnership: ["run summary", "session rows"],
    acceptanceCriteria: fallbackAcceptance,
    validationCommands: ["Handoff complete"],
    dependencies: tasks.map((task) => task.id),
    rollback: "No rollback action is required for handoff preparation."
  });

  return tasks;
}

function convertTaskToSession(run: MockOrchestratorRun, task: OrchestrationTask): MockRunSessionSummary {
  const state = resolveRunSessionState(task.status, run.status);
  const validationLine = task.validationCommands[0] ?? "No validation command configured.";

  return {
    id: `${run.id}:${task.id}`,
    projectId: run.projectId,
    title: task.title,
    role: taskRoleToSessionRole(task.role),
    state,
    branch: `${DEFAULT_BRANCH}/${run.id}/${task.id}`,
    runtime: `${DEFAULT_ORCHESTRATOR_RUNTIME}`,
    attempt: task.attempt,
    validation: validationLine,
    files: task.fileOwnership.length > 0 ? task.fileOwnership : ["No files listed."],
    transcript: [...buildSessionTranscript(task), `Status: ${task.status}`, `Gate status: ${run.status}`],
    tools: taskRoleTools(task.role)
  };
}

export function createMockRunFromDispatchPackage(
  dispatchPackage: DispatchPackage,
  options: MockRunOptions = {}
): MockOrchestratorRun {
  const createdAt = normalizeCreatedAt(options.createdAt);
  const runStatus = resolveRunStatus(options.status, dispatchPackage.status);
  const idSeed = normalizeIdSeed(options.idSeed);
  const id = buildRunId(idSeed, dispatchPackage, createdAt);
  const tasks = createMockTasks(id, dispatchPackage, runStatus);
  const run: MockOrchestratorRun = {
    id,
    projectId: dispatchPackage.targetProject.id,
    projectName: dispatchPackage.targetProject.name,
    title: `Mock run for ${dispatchPackage.sourceDraftTitle}`,
    status: runStatus,
    createdAt,
    sourcePackageId: dispatchPackage.id,
    summary: {
      objective: buildValidationObjective(dispatchPackage),
      scopeCount: dispatchPackage.scope.length,
      fileAreaCount: dispatchPackage.fileAreas.length,
      acceptanceCriteriaCount: dispatchPackage.acceptanceCriteria.length,
      validationGateCount: dispatchPackage.validationPlan.length,
      risk: dispatchPackage.risk
    },
    sessions: [],
    tasks,
    validationGates: createMockValidationGates(id, dispatchPackage, runStatus)
  };

  run.sessions = tasks.map((task) => convertTaskToSession(run, task));
  return run;
}

export function runToSessionSummaries(run: MockOrchestratorRun): MockRunSessionSummary[] {
  if (run.sessions.length > 0) {
    return run.sessions.map((session) => ({ ...session }));
  }

  if (run.tasks.length === 0) {
    return [];
  }

  return run.tasks.map((task) => convertTaskToSession(run, task));
}

export function runToOrchestrationTasks(run: MockOrchestratorRun): OrchestrationTask[] {
  return run.tasks.map((task) => ({ ...task }));
}
