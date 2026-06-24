import { repairMockRunWorksheets, type MockOrchestratorRun, type MockRunStatus } from "./run";

export const RUN_HISTORY_STORAGE_KEY = "steerboard.mockRunHistory";

const validRunStatuses: MockRunStatus[] = ["queued", "running", "complete", "blocked", "failed"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasValidRunStatus(value: unknown): value is MockRunStatus {
  return validRunStatuses.includes(value as MockRunStatus);
}

function hasSummaryShape(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasString(value.objective) &&
    typeof value.scopeCount === "number" &&
    typeof value.fileAreaCount === "number" &&
    typeof value.acceptanceCriteriaCount === "number" &&
    typeof value.validationGateCount === "number" &&
    hasString(value.risk)
  );
}

function isStoredRun(value: unknown): value is MockOrchestratorRun {
  return (
    isRecord(value) &&
    hasString(value.id) &&
    hasString(value.projectId) &&
    hasString(value.projectName) &&
    hasString(value.title) &&
    hasValidRunStatus(value.status) &&
    hasString(value.createdAt) &&
    hasString(value.sourcePackageId) &&
    hasSummaryShape(value.summary) &&
    Array.isArray(value.sessions) &&
    Array.isArray(value.tasks) &&
    Array.isArray(value.validationGates)
  );
}

export function parseStoredRunHistory(serialized: string | null, limit = 12): MockOrchestratorRun[] {
  if (!serialized) {
    return [];
  }

  try {
    const parsed = JSON.parse(serialized);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const seenIds = new Set<string>();
    const seenPackageIds = new Set<string>();
    const repairedRuns: MockOrchestratorRun[] = [];

    for (const item of parsed) {
      if (!isStoredRun(item) || seenIds.has(item.id) || seenPackageIds.has(item.sourcePackageId)) {
        continue;
      }

      seenIds.add(item.id);
      seenPackageIds.add(item.sourcePackageId);
      repairedRuns.push(repairMockRunWorksheets(item));
    }

    return repairedRuns.slice(0, Math.max(0, Math.floor(limit)));
  } catch {
    return [];
  }
}

export function loadRunHistory(): MockOrchestratorRun[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseStoredRunHistory(window.localStorage.getItem(RUN_HISTORY_STORAGE_KEY));
}

export function saveRunHistory(runs: MockOrchestratorRun[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(RUN_HISTORY_STORAGE_KEY, JSON.stringify(runs));
}
