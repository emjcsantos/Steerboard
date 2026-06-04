import type { MockOrchestratorRun } from "./run";

export interface RunHistoryOptions {
  limit?: number;
}

export interface RunStatusCounts {
  queued: number;
  running: number;
  complete: number;
  blocked: number;
  failed: number;
}

export interface RunHistorySummary {
  total: number;
  countsByStatus: RunStatusCounts;
  latestRun?: MockOrchestratorRun;
}

function normalizeRunHistoryLimit(limit?: number): number {
  if (limit === undefined) {
    return 12;
  }

  if (!Number.isFinite(limit)) {
    return 12;
  }

  const normalized = Math.floor(limit);
  return normalized >= 0 ? normalized : 12;
}

function createdAtValue(run: MockOrchestratorRun): number {
  const parsed = Date.parse(run.createdAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function compareNewestFirst(a: MockOrchestratorRun, b: MockOrchestratorRun): number {
  return createdAtValue(b) - createdAtValue(a);
}

function buildEmptyStatusCounts(): RunStatusCounts {
  return { queued: 0, running: 0, complete: 0, blocked: 0, failed: 0 };
}

export function upsertRunHistory(
  runs: readonly MockOrchestratorRun[],
  nextRun: MockOrchestratorRun,
  options: RunHistoryOptions = {}
): MockOrchestratorRun[] {
  const limit = normalizeRunHistoryLimit(options.limit);
  const mergedRuns: MockOrchestratorRun[] = [nextRun, ...runs];
  const seenRunIds = new Set<string>();
  const seenSourcePackageIds = new Set<string>();
  const dedupedRuns: MockOrchestratorRun[] = [];

  for (const run of mergedRuns) {
    if (seenRunIds.has(run.id) || seenSourcePackageIds.has(run.sourcePackageId)) {
      continue;
    }

    seenRunIds.add(run.id);
    seenSourcePackageIds.add(run.sourcePackageId);
    dedupedRuns.push(run);
  }

  return dedupedRuns.slice(0, limit);
}

export function filterRunsByProject(
  runs: readonly MockOrchestratorRun[],
  projectId: string
): MockOrchestratorRun[] {
  return runs.filter((run) => run.projectId === projectId).sort(compareNewestFirst);
}

export function summarizeRunHistory(runs: readonly MockOrchestratorRun[]): RunHistorySummary {
  const countsByStatus = buildEmptyStatusCounts();

  for (const run of runs) {
    countsByStatus[run.status] += 1;
  }

  const sortedRuns = [...runs].sort(compareNewestFirst);
  const latestRun = sortedRuns.length > 0 ? sortedRuns[0] : undefined;

  return {
    total: runs.length,
    countsByStatus,
    latestRun
  };
}

export function selectRunById(
  runs: readonly MockOrchestratorRun[],
  runId: string
): MockOrchestratorRun | undefined {
  return runs.find((run) => run.id === runId);
}
