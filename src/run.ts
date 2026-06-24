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

export type MockPhaseWorksheetState =
  | "active"
  | "reviewing"
  | "revision_needed"
  | "integrated"
  | "removed"
  | "blocked"
  | "failed";

export interface MockWorksheetSubagent {
  id: string;
  label: string;
  role: MockRunSessionRole;
  profile: string;
  responsibilities: string[];
}

export interface MockPhaseWorksheetRevision {
  id: string;
  subagentId: string;
  requestedBy: "Main Orchestrator";
  notes: string;
  requiredActions: string[];
  createdAt: string;
}

export interface MockPhaseIntegrationReceipt {
  id: string;
  phaseWorksheetId: string;
  phaseId: string;
  title: string;
  validatedBy: "Main Orchestrator";
  integratedBy: "Main Orchestrator";
  acceptedEvidence: string[];
  integratedArtifacts: string[];
  validatorNotes: string;
  revisionCount: number;
  integratedAt: string;
}

export interface MockMainWorksheet {
  id: string;
  title: string;
  state: "active";
  acceptedPhaseIds: string[];
  integrationReceipts: MockPhaseIntegrationReceipt[];
}

export interface MockPhaseWorksheet {
  id: string;
  phaseId: string;
  title: string;
  scope: string;
  state: MockPhaseWorksheetState;
  subagents: MockWorksheetSubagent[];
  workPacketIds: string[];
  validationEvidence: string[];
  revisionHistory: MockPhaseWorksheetRevision[];
  integrationReceiptId?: string;
  removedAt?: string;
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
  mainWorksheet?: MockMainWorksheet;
  phaseWorksheets?: MockPhaseWorksheet[];
  activeWorksheetQueue?: string[];
}

interface PhaseWorksheetBlueprint {
  phaseId: string;
  title: string;
  scope: string;
  subagents: Omit<MockWorksheetSubagent, "id">[];
  integrationGate: string;
}

interface PhaseWorksheetRevisionInput {
  worksheetId: string;
  subagentId: string;
  notes: string;
  requiredActions?: string[];
  createdAt?: string;
}

interface PhaseWorksheetIntegrationInput {
  worksheetId: string;
  acceptedEvidence: string[];
  integratedArtifacts: string[];
  validatorNotes: string;
  integratedAt?: string;
}

const PHASE_WORKSHEET_BLUEPRINTS: PhaseWorksheetBlueprint[] = [
  {
    phaseId: "phase-0",
    title: "Phase 0 Worksheet",
    scope: "Contracts and safety decisions.",
    subagents: [
      {
        label: "Contract Worker",
        role: "implementer",
        profile: "contract-worker",
        responsibilities: ["Draft contracts", "Keep worksheet state typed"]
      },
      {
        label: "Validator",
        role: "validator",
        profile: "contract-validator",
        responsibilities: ["Check no-secret proof", "Validate lifecycle coverage"]
      }
    ],
    integrationGate: "Contract tests and no-secret proof accepted."
  },
  {
    phaseId: "phase-1",
    title: "Phase 1 Worksheet",
    scope: "Codex adapter extraction.",
    subagents: [
      {
        label: "Adapter Worker",
        role: "implementer",
        profile: "codex-adapter-worker",
        responsibilities: ["Extract app-server lifecycle", "Preserve behavior"]
      },
      {
        label: "Validator",
        role: "validator",
        profile: "adapter-validator",
        responsibilities: ["Run panel lifecycle checks", "Verify desktop build"]
      }
    ],
    integrationGate: "Existing live panel behavior and desktop build pass."
  },
  {
    phaseId: "phase-2",
    title: "Phase 2 Worksheet",
    scope: "Provider discovery and profile defaults.",
    subagents: [
      {
        label: "Provider Worker",
        role: "implementer",
        profile: "provider-discovery-worker",
        responsibilities: ["Wire sanitized discovery", "Keep browser preview non-live"]
      },
      {
        label: "Profile Worker",
        role: "implementer",
        profile: "agent-profile-worker",
        responsibilities: ["Repair profile defaults", "Resolve unavailable models"]
      },
      {
        label: "Validator",
        role: "validator",
        profile: "provider-validator",
        responsibilities: ["Check no path leakage", "Validate profile persistence"]
      }
    ],
    integrationGate: "Sanitized discovery and profile repair pass."
  },
  {
    phaseId: "phase-3",
    title: "Phase 3 Worksheet",
    scope: "OrchestratorRun preview.",
    subagents: [
      {
        label: "Orchestration Worker",
        role: "implementer",
        profile: "orchestration-preview-worker",
        responsibilities: ["Create work graph preview", "Attach packets to worksheets"]
      },
      {
        label: "UX Validator",
        role: "validator",
        profile: "orchestration-ux-validator",
        responsibilities: ["Check inspectable graph", "Verify non-mutating preview"]
      }
    ],
    integrationGate: "Preview graph is inspectable and non-mutating."
  },
  {
    phaseId: "phase-4",
    title: "Phase 4 Worksheet",
    scope: "Readonly worker dispatch.",
    subagents: [
      {
        label: "Readonly Worker",
        role: "implementer",
        profile: "readonly-worker",
        responsibilities: ["Run search and explanation packets", "Return risk notes"]
      },
      {
        label: "Validator",
        role: "validator",
        profile: "readonly-validator",
        responsibilities: ["Verify no writes", "Validate handoff summary"]
      }
    ],
    integrationGate: "Readonly workers cannot write and handoff is accepted."
  },
  {
    phaseId: "phase-5",
    title: "Phase 5 Worksheet",
    scope: "Bounded patch worker dispatch.",
    subagents: [
      {
        label: "Patch Worker",
        role: "implementer",
        profile: "bounded-patch-worker",
        responsibilities: ["Produce scoped patches", "Attach rollback notes"]
      },
      {
        label: "Validator",
        role: "validator",
        profile: "patch-validator",
        responsibilities: ["Reject unsafe patches", "Check verification plans"]
      },
      {
        label: "Integrator",
        role: "integration",
        profile: "patch-integrator",
        responsibilities: ["Inspect aggregate output", "Escalate overlap"]
      }
    ],
    integrationGate: "Patch policy and overlap checks pass."
  },
  {
    phaseId: "phase-6",
    title: "Phase 6 Worksheet",
    scope: "Approval queue, audit, and handoff.",
    subagents: [
      {
        label: "Approval Worker",
        role: "implementer",
        profile: "approval-worker",
        responsibilities: ["Model approval states", "Attach handoff status"]
      },
      {
        label: "Audit Validator",
        role: "validator",
        profile: "audit-validator",
        responsibilities: ["Check audit safety", "Verify receipt persistence"]
      }
    ],
    integrationGate: "Approval states, audit records, and handoff pass."
  },
  {
    phaseId: "phase-7",
    title: "Phase 7 Worksheet",
    scope: "Configurable subagents and ACP readiness.",
    subagents: [
      {
        label: "Profile Worker",
        role: "implementer",
        profile: "subagent-profile-worker",
        responsibilities: ["Edit subagent profiles", "Repair invalid profiles"]
      },
      {
        label: "ACP Planner",
        role: "implementer",
        profile: "acp-planner",
        responsibilities: ["Document ACP boundary", "Keep secrets excluded"]
      },
      {
        label: "Validator",
        role: "validator",
        profile: "subagent-validator",
        responsibilities: ["Verify per-worksheet roster", "Check disabled-state repair"]
      }
    ],
    integrationGate: "Profile configuration and ACP boundary accepted."
  }
];

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

function resolveInitialWorksheetState(runStatus: MockRunStatus): MockPhaseWorksheetState {
  if (runStatus === "complete") {
    return "removed";
  }

  if (runStatus === "blocked") {
    return "blocked";
  }

  if (runStatus === "failed") {
    return "failed";
  }

  return "active";
}

function createWorksheetSubagent(
  runId: string,
  phaseId: string,
  subagent: Omit<MockWorksheetSubagent, "id">,
  index: number
): MockWorksheetSubagent {
  return {
    ...subagent,
    responsibilities: [...subagent.responsibilities],
    id: `${runId}:${phaseId}:subagent-${normalizeSegment(String(index + 1))}-${normalizeSegment(subagent.profile)}`
  };
}

function createIntegrationReceipt(
  runId: string,
  worksheet: Pick<MockPhaseWorksheet, "id" | "phaseId" | "title" | "revisionHistory" | "validationEvidence">,
  acceptedEvidence: string[],
  integratedArtifacts: string[],
  validatorNotes: string,
  integratedAt: string
): MockPhaseIntegrationReceipt {
  return {
    id: `${runId}:receipt:${normalizeSegment(worksheet.phaseId)}`,
    phaseWorksheetId: worksheet.id,
    phaseId: worksheet.phaseId,
    title: worksheet.title,
    validatedBy: "Main Orchestrator",
    integratedBy: "Main Orchestrator",
    acceptedEvidence: acceptedEvidence.length > 0 ? [...acceptedEvidence] : [...worksheet.validationEvidence],
    integratedArtifacts: [...integratedArtifacts],
    validatorNotes,
    revisionCount: worksheet.revisionHistory.length,
    integratedAt
  };
}

function createPhaseWorksheets(
  runId: string,
  runStatus: MockRunStatus,
  createdAt: string
): MockPhaseWorksheet[] {
  const worksheetState = resolveInitialWorksheetState(runStatus);

  return PHASE_WORKSHEET_BLUEPRINTS.map((blueprint) => {
    const id = `${runId}:worksheet:${blueprint.phaseId}`;
    const validationEvidence = [blueprint.integrationGate];
    const baseWorksheet: MockPhaseWorksheet = {
      id,
      phaseId: blueprint.phaseId,
      title: blueprint.title,
      scope: blueprint.scope,
      state: worksheetState,
      subagents: blueprint.subagents.map((subagent, index) =>
        createWorksheetSubagent(runId, blueprint.phaseId, subagent, index)
      ),
      workPacketIds: [`${runId}:packet:${blueprint.phaseId}`],
      validationEvidence,
      revisionHistory: []
    };

    if (worksheetState !== "removed") {
      return baseWorksheet;
    }

    return {
      ...baseWorksheet,
      integrationReceiptId: `${runId}:receipt:${normalizeSegment(blueprint.phaseId)}`,
      removedAt: createdAt
    };
  });
}

function createMainWorksheet(
  runId: string,
  phaseWorksheets: readonly MockPhaseWorksheet[],
  createdAt: string
): MockMainWorksheet {
  const removedWorksheets = phaseWorksheets.filter((worksheet) => worksheet.state === "removed");

  return {
    id: `${runId}:worksheet:main`,
    title: "Main Worksheet",
    state: "active",
    acceptedPhaseIds: removedWorksheets.map((worksheet) => worksheet.phaseId),
    integrationReceipts: removedWorksheets.map((worksheet) =>
      createIntegrationReceipt(
        runId,
        worksheet,
        worksheet.validationEvidence,
        [`Integrated ${worksheet.title}`],
        `${worksheet.title} was validated and integrated into the main worksheet.`,
        worksheet.removedAt ?? createdAt
      )
    )
  };
}

function createActiveWorksheetQueue(phaseWorksheets: readonly MockPhaseWorksheet[]): string[] {
  return phaseWorksheets
    .filter((worksheet) => worksheet.state !== "removed")
    .map((worksheet) => worksheet.id);
}

function cloneSubagent(subagent: MockWorksheetSubagent): MockWorksheetSubagent {
  return {
    ...subagent,
    responsibilities: [...subagent.responsibilities]
  };
}

function cloneRevision(revision: MockPhaseWorksheetRevision): MockPhaseWorksheetRevision {
  return {
    ...revision,
    requiredActions: [...revision.requiredActions]
  };
}

function cloneIntegrationReceipt(receipt: MockPhaseIntegrationReceipt): MockPhaseIntegrationReceipt {
  return {
    ...receipt,
    acceptedEvidence: [...receipt.acceptedEvidence],
    integratedArtifacts: [...receipt.integratedArtifacts]
  };
}

function clonePhaseWorksheet(worksheet: MockPhaseWorksheet): MockPhaseWorksheet {
  return {
    ...worksheet,
    subagents: worksheet.subagents.map(cloneSubagent),
    workPacketIds: [...worksheet.workPacketIds],
    validationEvidence: [...worksheet.validationEvidence],
    revisionHistory: worksheet.revisionHistory.map(cloneRevision)
  };
}

function cloneMainWorksheet(mainWorksheet: MockMainWorksheet): MockMainWorksheet {
  return {
    ...mainWorksheet,
    acceptedPhaseIds: [...mainWorksheet.acceptedPhaseIds],
    integrationReceipts: mainWorksheet.integrationReceipts.map(cloneIntegrationReceipt)
  };
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
    owner: "Main Codex",
    objective: "Own final integration, final validation review, commit preparation, push approval, reporting, and closure traceability for operator review.",
    scope: [
      "Collect validated command evidence.",
      "Prepare operator-visible Arena rows and handoff metadata.",
      "Keep final merge review, commit preparation, push approval, and reporting owned by Main Codex."
    ],
    fileOwnership: ["run summary", "session rows"],
    acceptanceCriteria: fallbackAcceptance,
    validationCommands: [
      "Final validation reviewed by Main Codex",
      "Commit prepared only after owner approval",
      "Push held until owner approval",
      "Dispatch report complete"
    ],
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
  const phaseWorksheets = createPhaseWorksheets(id, runStatus, createdAt);
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
    validationGates: createMockValidationGates(id, dispatchPackage, runStatus),
    mainWorksheet: createMainWorksheet(id, phaseWorksheets, createdAt),
    phaseWorksheets,
    activeWorksheetQueue: createActiveWorksheetQueue(phaseWorksheets)
  };

  run.sessions = tasks.map((task) => convertTaskToSession(run, task));
  return run;
}

export function getActivePhaseWorksheets(run: MockOrchestratorRun): MockPhaseWorksheet[] {
  const worksheets = run.phaseWorksheets ?? [];
  const queue = new Set(run.activeWorksheetQueue ?? worksheets.map((worksheet) => worksheet.id));

  return worksheets
    .filter((worksheet) => worksheet.state !== "removed" && queue.has(worksheet.id))
    .map(clonePhaseWorksheet);
}

export function requestPhaseWorksheetRevision(
  run: MockOrchestratorRun,
  input: PhaseWorksheetRevisionInput
): MockOrchestratorRun {
  const worksheets = run.phaseWorksheets ?? [];
  const target = worksheets.find((worksheet) => worksheet.id === input.worksheetId);

  if (!target) {
    return run;
  }

  const createdAt = normalizeCreatedAt(input.createdAt);
  const requiredActions = input.requiredActions?.filter(isNonEmptyString) ?? [];
  const revision: MockPhaseWorksheetRevision = {
    id: `${input.worksheetId}:revision-${normalizeSegment(String(target.revisionHistory.length + 1))}`,
    subagentId: input.subagentId,
    requestedBy: "Main Orchestrator",
    notes: normalizeListValue(input.notes, "Main orchestrator requested worksheet revisions."),
    requiredActions: requiredActions.length > 0 ? requiredActions : ["Address main orchestrator validation notes."],
    createdAt
  };

  const nextWorksheets = worksheets.map((worksheet) => {
    if (worksheet.id !== input.worksheetId) {
      return clonePhaseWorksheet(worksheet);
    }

    return {
      ...clonePhaseWorksheet(worksheet),
      state: "revision_needed" as const,
      revisionHistory: [...worksheet.revisionHistory.map(cloneRevision), revision]
    };
  });

  const currentQueue = run.activeWorksheetQueue ?? createActiveWorksheetQueue(worksheets);
  const nextQueue = currentQueue.includes(input.worksheetId)
    ? [...currentQueue]
    : [...currentQueue, input.worksheetId];

  return {
    ...run,
    phaseWorksheets: nextWorksheets,
    activeWorksheetQueue: nextQueue,
    mainWorksheet: run.mainWorksheet ? cloneMainWorksheet(run.mainWorksheet) : undefined
  };
}

export function integratePhaseWorksheetIntoMain(
  run: MockOrchestratorRun,
  input: PhaseWorksheetIntegrationInput
): MockOrchestratorRun {
  const worksheets = run.phaseWorksheets ?? [];
  const target = worksheets.find((worksheet) => worksheet.id === input.worksheetId);

  if (!target) {
    return run;
  }

  const integratedAt = normalizeCreatedAt(input.integratedAt);
  const acceptedEvidence = input.acceptedEvidence.filter(isNonEmptyString);
  const integratedArtifacts = input.integratedArtifacts.filter(isNonEmptyString);
  const receipt = createIntegrationReceipt(
    run.id,
    target,
    acceptedEvidence.length > 0 ? acceptedEvidence : target.validationEvidence,
    integratedArtifacts.length > 0 ? integratedArtifacts : [`Integrated ${target.title}`],
    normalizeListValue(input.validatorNotes, `${target.title} was validated and integrated.`),
    integratedAt
  );

  const nextWorksheets = worksheets.map((worksheet) => {
    if (worksheet.id !== input.worksheetId) {
      return clonePhaseWorksheet(worksheet);
    }

    return {
      ...clonePhaseWorksheet(worksheet),
      state: "removed" as const,
      integrationReceiptId: receipt.id,
      removedAt: integratedAt
    };
  });
  const currentQueue = run.activeWorksheetQueue ?? createActiveWorksheetQueue(worksheets);
  const nextMainWorksheet = run.mainWorksheet
    ? cloneMainWorksheet(run.mainWorksheet)
    : createMainWorksheet(run.id, [], integratedAt);
  const acceptedPhaseIds = nextMainWorksheet.acceptedPhaseIds.includes(target.phaseId)
    ? nextMainWorksheet.acceptedPhaseIds
    : [...nextMainWorksheet.acceptedPhaseIds, target.phaseId];

  return {
    ...run,
    phaseWorksheets: nextWorksheets,
    activeWorksheetQueue: currentQueue.filter((worksheetId) => worksheetId !== input.worksheetId),
    mainWorksheet: {
      ...nextMainWorksheet,
      acceptedPhaseIds,
      integrationReceipts: [
        ...nextMainWorksheet.integrationReceipts.filter(
          (existingReceipt) => existingReceipt.phaseWorksheetId !== target.id
        ),
        receipt
      ]
    }
  };
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
