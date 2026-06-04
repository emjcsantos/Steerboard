import type { PipelineItem, ProjectSummary } from "./fixtures";
import type { PipelineItemDispatchPreview } from "./pipelineItemDispatchPreview";
import type { DispatchBuildOptions, DispatchPackage } from "./dispatch";

const DEFAULT_ID_SEED = "pipeline-dispatch";
const DEFAULT_PROJECT_ID = "project";
const DEFAULT_PROJECT_NAME = "Project workspace";
const DEFAULT_ITEM_ID = "pipeline-item";
const DEFAULT_ITEM_TITLE = "Selected pipeline item";
const DEFAULT_OWNER = "Project owner";

export type PipelineItemDispatchPackageBuildSuccess = {
  ok: true;
  package: DispatchPackage;
};

export type PipelineItemDispatchPackageBuildFailure = {
  ok: false;
  preview: PipelineItemDispatchPreview;
};

export type PipelineItemDispatchPackageBuildResult =
  | PipelineItemDispatchPackageBuildSuccess
  | PipelineItemDispatchPackageBuildFailure;

function safeText(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value
    .replace(/[\r\n\t]/g, " ")
    .replace(/[<>/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeSegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 48) || "segment";
}

function normalizeCreatedAt(createdAt?: string): string {
  return typeof createdAt === "string" && createdAt.trim().length > 0
    ? createdAt.trim()
    : new Date().toISOString();
}

function normalizeStatus(status?: DispatchBuildOptions["status"]): DispatchPackage["status"] {
  return status === "ready" ? "ready" : "staged";
}

function buildPackageId(
  projectId: string,
  itemId: string,
  createdAt: string,
  idSeed?: string
): string {
  return [
    normalizeSegment(safeText(idSeed, DEFAULT_ID_SEED)),
    normalizeSegment(projectId),
    normalizeSegment(itemId),
    normalizeSegment(createdAt)
  ].join("-");
}

export function tryBuildPipelineItemDispatchPackage(
  item: PipelineItem,
  project: ProjectSummary,
  preview: PipelineItemDispatchPreview,
  options: DispatchBuildOptions = {}
): PipelineItemDispatchPackageBuildResult {
  if (!preview.canDispatch) {
    return {
      ok: false,
      preview
    };
  }

  const projectId = safeText(project.id, DEFAULT_PROJECT_ID);
  const projectName = safeText(project.name, DEFAULT_PROJECT_NAME);
  const itemId = safeText(item.id, DEFAULT_ITEM_ID);
  const itemTitle = safeText(item.title, DEFAULT_ITEM_TITLE);
  const owner = safeText(item.owner, DEFAULT_OWNER);
  const createdAt = normalizeCreatedAt(options.createdAt);

  return {
    ok: true,
    package: {
      id: buildPackageId(projectId, itemId, createdAt, options.idSeed),
      targetProject: {
        id: projectId,
        name: projectName
      },
      sourceDraftTitle: itemTitle,
      objective: `Create a local cockpit run projection for ${itemTitle} in ${projectName}.`,
      deployMode: "staged",
      risk: item.risk,
      scope: [
        `Selected pipeline item: ${itemTitle}`,
        `Owner lane: ${owner}`,
        "Prepare a local cockpit projection before runtime launch."
      ],
      fileAreas: [`Pipeline item ${itemId}`, `Project lane ${projectId}`],
      acceptanceCriteria: [
        "Selected pipeline, registry, and runtime gates are ready.",
        "The cockpit run projection is available for local review."
      ],
      validationPlan: [
        "Review the generated cockpit run projection.",
        "Confirm dispatch gates remain ready before runtime launch approval."
      ],
      rollbackNote: "Remove the local projected run if dispatch is cancelled.",
      createdAt,
      status: normalizeStatus(options.status)
    }
  };
}
