import {
  canDeployPlanningDraft,
  evaluatePlanningReadiness,
  normalizePlanningDraft,
  type PlanningDeployMode,
  type PlanningDraft,
  type PlanningReadiness,
  type PlanningRiskLevel
} from "./planning";

const DEFAULT_DISPATCH_STATUS: DispatchPackageStatus = "staged";
const DEFAULT_DISPATCH_ID_SEED = "dispatch-package";
const DEFAULT_PROJECT_FALLBACK = "project";
const DEFAULT_PROJECT_NAME = "Unnamed Project";

export interface DispatchTargetProject {
  id: string;
  name: string;
}

export type DispatchPackageStatus = "staged" | "ready";

export interface DispatchPackage {
  id: string;
  targetProject: DispatchTargetProject;
  sourceDraftTitle: string;
  objective: string;
  deployMode: PlanningDeployMode;
  risk: PlanningRiskLevel;
  scope: string[];
  fileAreas: string[];
  acceptanceCriteria: string[];
  validationPlan: string[];
  rollbackNote: string;
  createdAt: string;
  status: DispatchPackageStatus;
}

export interface DispatchBuildOptions {
  createdAt?: string;
  idSeed?: string;
  status?: DispatchPackageStatus;
}

export type DispatchPackageBuildSuccess = {
  ok: true;
  package: DispatchPackage;
};

export type DispatchPackageBuildFailure = {
  ok: false;
  readiness: PlanningReadiness;
};

export type DispatchPackageBuildResult = DispatchPackageBuildSuccess | DispatchPackageBuildFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized.length === 0 ? fallback : normalized;
}

function normalizeProject(project: unknown): DispatchTargetProject {
  if (!isRecord(project)) {
    return { id: DEFAULT_PROJECT_FALLBACK, name: DEFAULT_PROJECT_NAME };
  }

  return {
    id: normalizeString(project.id, DEFAULT_PROJECT_FALLBACK),
    name: normalizeString(project.name, DEFAULT_PROJECT_NAME)
  };
}

function normalizeCreatedAt(createdAt?: string): string {
  const normalized = normalizeString(createdAt, new Date().toISOString());
  return normalized;
}

function normalizeIdSeed(seed?: string): string {
  return normalizeString(seed, DEFAULT_DISPATCH_ID_SEED);
}

function normalizePackageIdSegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 48) || "segment";
}

function createDispatchPackageId(
  targetProject: DispatchTargetProject,
  draft: PlanningDraft,
  createdAt: string,
  idSeed: string
): string {
  const seed = normalizePackageIdSegment(idSeed);
  const projectId = normalizePackageIdSegment(targetProject.id);
  const draftTitle = normalizePackageIdSegment(draft.title);
  const dateStamp = normalizePackageIdSegment(createdAt);

  return `${seed}-${projectId}-${draftTitle}-${dateStamp}`;
}

function renderList(items: string[]): string {
  if (items.length === 0) {
    return "- None";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

export function buildDispatchPackage(
  draft: PlanningDraft,
  targetProject: DispatchTargetProject,
  options: DispatchBuildOptions = {}
): DispatchPackage {
  const normalizedDraft = normalizePlanningDraft(draft);
  const result = tryBuildDispatchPackage(normalizedDraft, targetProject, options);

  if (!result.ok) {
    throw new Error(
      `Cannot build dispatch package. Planning readiness is ${result.readiness.readiness}%.`
    );
  }

  return result.package;
}

export function tryBuildDispatchPackage(
  draft: PlanningDraft,
  targetProject: DispatchTargetProject,
  options: DispatchBuildOptions = {}
): DispatchPackageBuildResult {
  const readiness = evaluatePlanningReadiness(draft);

  if (!canDeployPlanningDraft(draft)) {
    return {
      ok: false,
      readiness
    };
  }

  const normalizedDraft = normalizePlanningDraft(draft);
  const normalizedProject = normalizeProject(targetProject);
  const createdAt = normalizeCreatedAt(options.createdAt);
  const status = options.status ?? DEFAULT_DISPATCH_STATUS;
  const packageId = createDispatchPackageId(
    normalizedProject,
    normalizedDraft,
    createdAt,
    normalizeIdSeed(options.idSeed)
  );

  return {
    ok: true,
    package: {
      id: packageId,
      targetProject: normalizedProject,
      sourceDraftTitle: normalizedDraft.title,
      objective: normalizedDraft.objective,
      deployMode: normalizedDraft.deployMode,
      risk: normalizedDraft.risk,
      scope: normalizedDraft.scope,
      fileAreas: normalizedDraft.fileAreas,
      acceptanceCriteria: normalizedDraft.acceptanceCriteria,
      validationPlan: normalizedDraft.validationPlan,
      rollbackNote: normalizedDraft.rollbackNote,
      createdAt,
      status
    }
  };
}

export function renderDispatchPackageMarkdown(dispatchPackage: DispatchPackage): string {
  const sections = [
    `# Dispatch Package: ${dispatchPackage.sourceDraftTitle}`,
    "",
    `Target Project: ${dispatchPackage.targetProject.name} (${dispatchPackage.targetProject.id})`,
    `Package ID: ${dispatchPackage.id}`,
    `Created: ${dispatchPackage.createdAt}`,
    "",
    "## Objective",
    dispatchPackage.objective,
    "",
    "## Scope",
    renderList(dispatchPackage.scope),
    "",
    "## File Areas",
    renderList(dispatchPackage.fileAreas),
    "",
    "## Acceptance Criteria",
    renderList(dispatchPackage.acceptanceCriteria),
    "",
    "## Validation Plan",
    renderList(dispatchPackage.validationPlan),
    "",
    "## Rollback",
    dispatchPackage.rollbackNote,
    "",
    "## Deploy Settings",
    `Mode: ${dispatchPackage.deployMode}`,
    `Risk: ${dispatchPackage.risk}`,
    `Status: ${dispatchPackage.status}`,
    `Created At: ${dispatchPackage.createdAt}`
  ];

  return sections.join("\n");
}
