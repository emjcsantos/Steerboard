import type { PipelineItem } from "./fixtures";
import type { MockOrchestratorRun, MockRunStatus } from "./run";

export interface PipelineItemRunLink {
  runId: string;
  title: string;
  status: MockRunStatus;
  createdAt: string;
  sourcePackageId: string;
  taskCount: number;
  sessionCount: number;
  validationGateCount: number;
}

function hasExactPipelineFileOwnership(run: MockOrchestratorRun, item: PipelineItem): boolean {
  const expected = `Pipeline item ${item.id}`.trim();

  return run.tasks.some((task) =>
    task.fileOwnership.some((path) => path.trim() === expected)
  );
}

function parseCreatedAt(createdAt: string): number {
  const parsed = Date.parse(createdAt);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

function compareNewestFirst(a: MockOrchestratorRun, b: MockOrchestratorRun): number {
  const aTime = parseCreatedAt(a.createdAt);
  const bTime = parseCreatedAt(b.createdAt);
  const aValid = Number.isFinite(aTime);
  const bValid = Number.isFinite(bTime);

  if (!aValid && bValid) {
    return 1;
  }

  if (aValid && !bValid) {
    return -1;
  }

  if (!aValid && !bValid) {
    return 0;
  }

  return bTime - aTime;
}

function normalizeLimit(limit = 4): number {
  if (!Number.isFinite(limit)) {
    return 4;
  }

  const normalized = Math.floor(limit);
  return normalized < 0 ? 0 : normalized;
}

function buildLink(run: MockOrchestratorRun): PipelineItemRunLink {
  return {
    runId: run.id,
    title: run.title,
    status: run.status,
    createdAt: run.createdAt,
    sourcePackageId: run.sourcePackageId,
    taskCount: run.tasks.length,
    sessionCount: run.sessions.length,
    validationGateCount: run.validationGates.length
  };
}

export function buildPipelineItemRunLinks(
  item: PipelineItem,
  runs: readonly MockOrchestratorRun[],
  limit = 4
): PipelineItemRunLink[] {
  const normalizedLimit = normalizeLimit(limit);

  if (normalizedLimit <= 0) {
    return [];
  }

  const candidateRuns = [...runs]
    .filter((run) => run.projectId === item.projectId && hasExactPipelineFileOwnership(run, item))
    .sort(compareNewestFirst);

  const deduped: PipelineItemRunLink[] = [];
  const seenRunIds = new Set<string>();

  for (const run of candidateRuns) {
    if (seenRunIds.has(run.id)) {
      continue;
    }

    seenRunIds.add(run.id);
    deduped.push(buildLink(run));

    if (deduped.length >= normalizedLimit) {
      break;
    }
  }

  return deduped;
}
