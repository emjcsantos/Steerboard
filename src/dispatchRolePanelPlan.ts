import type { DispatchPackage } from "./dispatch";
import type { MockOrchestratorRun, MockRunSessionRole, MockRunSessionState } from "./run";

export type DispatchRolePanelRole = "orchestrator" | "implementer" | "validator" | "integration";

export type DispatchRolePanelPlanState =
  | "complete"
  | "blocked"
  | "active"
  | "idle"
  | "waiting";

export interface DispatchRolePanel {
  panelId: string;
  role: DispatchRolePanelRole;
  title: string;
  state: MockRunSessionState;
  attemptLabel: string;
  validationLabel: string;
  files: string[];
  ownedAreas: string[];
  acceptanceSummary: string;
  dependencies: string[];
  noRuntimeExecutionNote: string;
}

export interface DispatchRolePanelPlanCounts {
  orchestrator: number;
  implementer: number;
  validator: number;
  integration: number;
}

export interface DispatchRolePanelPlan {
  planId: string;
  projectId: string;
  projectName: string;
  sourcePackageId: string;
  totalPanelCount: number;
  roleCounts: DispatchRolePanelPlanCounts;
  readinessState: DispatchRolePanelPlanState;
  panels: DispatchRolePanel[];
}

interface SessionLike {
  id: string;
  role: MockRunSessionRole;
  title: string;
  state: MockRunSessionState;
  attempt: number;
  validation: string;
  files: string[];
}

interface TaskLike {
  id: string;
  role: "planning" | "implementation" | "validation" | "integration";
  title: string;
  status: string;
  attempt: number;
  attemptLimit: number;
  fileOwnership: string[];
  acceptanceCriteria: string[];
  dependencies: string[];
  validationCommands: string[];
}

const ROLE_ORDER: DispatchRolePanelRole[] = [
  "orchestrator",
  "implementer",
  "validator",
  "integration"
];

const DEFAULT_PANEL_STATE: MockRunSessionState = "idle";
const DEFAULT_ATTEMPT = 0;
const DEFAULT_ATTEMPT_LIMIT_ORCHESTRATOR = 1;
const DEFAULT_ATTEMPT_LIMIT_WORKER = 3;
const NO_RUNTIME_EXECUTION_NOTE =
  "No runtime execution is performed for this panel in local preview mode.";

const PANEL_PANEL_PREFIX = "role-panel-plan";

function toText(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function toList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function compactList(value: string[], fallback: string): string[] {
  if (value.length === 0) {
    return [fallback];
  }

  return value;
}

function normalizeSessionRole(value: unknown): MockRunSessionRole | undefined {
  if (
    value === "orchestrator" ||
    value === "implementer" ||
    value === "validator" ||
    value === "integration"
  ) {
    return value;
  }
  return undefined;
}

function normalizeTaskRole(role: TaskLike["role"]): DispatchRolePanelRole {
  switch (role) {
    case "implementation":
      return "implementer";
    case "validation":
      return "validator";
    case "integration":
      return "integration";
    case "planning":
    default:
      return "orchestrator";
  }
}

function sanitizeAttempt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_ATTEMPT;
  }

  return Math.max(0, Math.trunc(value));
}

function sanitizeSessionState(value: unknown): MockRunSessionState {
  if (
    value === "idle" ||
    value === "planning" ||
    value === "implementing" ||
    value === "validating" ||
    value === "blocked" ||
    value === "failed" ||
    value === "complete"
  ) {
    return value;
  }

  return DEFAULT_PANEL_STATE;
}

function compactId(...parts: string[]): string {
  const normalized = parts
    .filter((value) => value.length > 0)
    .map((value) => value.toLowerCase())
    .map((value) => value.replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, ""));
  return `${PANEL_PANEL_PREFIX}:${normalized.join("::") || "unknown"}`;
}

function safeProjectId(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    typeof (value as { id?: unknown }).id === "string"
  ) {
    const id = ((value as { id: string }).id).trim();
    if (id.length > 0) {
      return id;
    }
  }

  return "unknown-project";
}

function safeProjectName(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    typeof (value as { name?: unknown }).name === "string"
  ) {
    const name = ((value as { name: string }).name).trim();
    if (name.length > 0) {
      return name;
    }
  }

  return "Unknown Project";
}

function resolvePanelState(sessions: SessionLike[], tasks: TaskLike[]): MockRunSessionState {
  if (sessions.length > 0) {
    const priority: Record<MockRunSessionState, number> = {
      blocked: 10,
      failed: 10,
      validating: 7,
      implementing: 6,
      planning: 5,
      complete: 4,
      idle: 1
    };

    return sessions.slice(1).reduce<SessionLike>((winner, candidate) => {
      if (priority[candidate.state] > priority[winner.state]) {
        return candidate;
      }

      return winner;
    }, sessions[0]).state;
  }

  if (tasks.length > 0) {
    if (tasks.some((task) => task.status === "blocked")) {
      return "blocked";
    }

    if (tasks.every((task) => task.status === "accepted")) {
      return "complete";
    }

    return "planning";
  }

  return DEFAULT_PANEL_STATE;
}

function deriveAttemptLabel(
  role: DispatchRolePanelRole,
  tasks: TaskLike[],
  sessions: SessionLike[]
): string {
  const attempt = Math.max(
    DEFAULT_ATTEMPT,
    ...sessions.map((session) => sanitizeAttempt(session.attempt))
  );
  const defaultLimit = role === "orchestrator" || role === "integration"
    ? DEFAULT_ATTEMPT_LIMIT_ORCHESTRATOR
    : DEFAULT_ATTEMPT_LIMIT_WORKER;
  const configuredLimit = tasks.length > 0
    ? Math.max(0, Math.trunc(Math.max(...tasks.map((task) => sanitizeAttempt(task.attemptLimit)))))
    : defaultLimit;
  const attemptLimit = Math.max(defaultLimit, configuredLimit);

  return `Attempt ${attempt} / ${attemptLimit}`;
}

function planPanelFromSources(
  role: DispatchRolePanelRole,
  run: MockOrchestratorRun
): DispatchRolePanel | undefined {
  const sessions = (Array.isArray(run.sessions) ? run.sessions : [])
    .filter((session) => normalizeSessionRole((session as { role?: unknown }).role) === role)
    .map((session) => ({
      id: toText((session as { id?: unknown }).id),
      role: normalizeSessionRole((session as { role?: unknown }).role) ?? role,
      title: toText((session as { title?: unknown }).title),
      state: sanitizeSessionState((session as { state?: unknown }).state),
      attempt: sanitizeAttempt((session as { attempt?: unknown }).attempt),
      validation: toText((session as { validation?: unknown }).validation),
      files: toList((session as { files?: unknown }).files)
    }));

  if (sessions.length === 0 && (Array.isArray(run.tasks) ? run.tasks.length : 0) === 0) {
    return undefined;
  }

  const tasks = (Array.isArray(run.tasks) ? run.tasks : [])
    .filter((task) => normalizeTaskRole(task.role) === role)
    .map((task) => ({
      id: toText(task.id),
      role: task.role,
      title: toText(task.title),
      status: toText(task.status),
      attempt: sanitizeAttempt(task.attempt),
      attemptLimit: sanitizeAttempt(task.attemptLimit),
      fileOwnership: toList(task.fileOwnership),
      acceptanceCriteria: toList(task.acceptanceCriteria),
      dependencies: toList(task.dependencies),
      validationCommands: toList(task.validationCommands)
    }));

  const state = resolvePanelState(sessions, tasks);
  const panelId = sessions[0]?.id ?? tasks[0]?.id ?? compactId("panel", run.id, role);
  const title = sessions[0]?.title || tasks[0]?.title || `${role} panel`;
  const attemptLabel = deriveAttemptLabel(role, tasks, sessions);
  const validationLabel = (
    (sessions[0]?.validation && sessions[0].validation) ||
    tasks[0]?.validationCommands[0] ||
    "No validation signal yet."
  );
  const files = compactList(
    sessions.flatMap((session) => session.files),
    `${role} panel has no files listed.`
  );
  const ownedAreas = compactList(
    tasks.flatMap((task) => task.fileOwnership),
    `${role} panel has no owned areas listed.`
  );
  const acceptanceSummary = compactList(
    tasks.flatMap((task) => task.acceptanceCriteria),
    `No acceptance summary was provided for ${role}.`
  ).join(" | ");
  const dependencies = compactList(
    tasks.flatMap((task) => task.dependencies),
    "No dependencies were declared."
  );

  return {
    panelId,
    role,
    title,
    state,
    attemptLabel,
    validationLabel,
    files,
    ownedAreas,
    acceptanceSummary,
    dependencies,
    noRuntimeExecutionNote: NO_RUNTIME_EXECUTION_NOTE
  };
}

function resolveReadinessState(
  run: MockOrchestratorRun,
  panels: DispatchRolePanel[]
): DispatchRolePanelPlanState {
  if (panels.some((panel) => panel.state === "blocked" || panel.state === "failed")) {
    return "blocked";
  }

  if (panels.some((panel) => panel.state === "implementing" || panel.state === "validating" || panel.state === "planning")) {
    return "active";
  }

  if (
    run.status === "blocked" ||
    run.status === "failed" ||
    panels.some((panel) => panel.state === "complete")
  ) {
    return "complete";
  }

  if (panels.length === 0) {
    return "waiting";
  }

  return "idle";
}

export function createDispatchRolePanelPlan(
  dispatchPackage: DispatchPackage,
  run: MockOrchestratorRun
): DispatchRolePanelPlan {
  const safePackage = dispatchPackage ?? ({} as DispatchPackage);
  const safeRun = run ?? ({} as MockOrchestratorRun);
  const fallbackRunProjectId = toText((safeRun as { projectId?: unknown }).projectId);
  const fallbackRunProjectName = toText((safeRun as { projectName?: unknown }).projectName);
  const project = safePackage.targetProject ?? {
    id: safeProjectId({ id: fallbackRunProjectId }),
    name: safeProjectName({ name: fallbackRunProjectName })
  };

  const planId = compactId(
    toText(safeRun.id),
    toText((safePackage as { id?: unknown }).id),
    toText((safePackage.targetProject as { id?: unknown })?.id) || fallbackRunProjectId
  );

  const panels = ROLE_ORDER
    .map((role) => planPanelFromSources(role, safeRun))
    .filter((panel): panel is DispatchRolePanel => Boolean(panel));
  const roleCounts = ROLE_ORDER.reduce<DispatchRolePanelPlanCounts>(
    (counts, role) => ({
      ...counts,
      [role]: panels.filter((panel) => panel.role === role).length
    }),
    {
      orchestrator: 0,
      implementer: 0,
      validator: 0,
      integration: 0
    }
  );

  const readinessState = resolveReadinessState(safeRun, panels);

  return {
    planId,
    projectId: safeProjectId(project),
    projectName: safeProjectName(project),
    sourcePackageId: toText(safePackage.id) || safeRun.sourcePackageId || "unknown-package",
    totalPanelCount: panels.length,
    roleCounts,
    readinessState,
    panels
  };
}
