import { normalizePlanningDraft, type PlanningDraft } from "./planning";

export const PLANNING_DRAFTS_STORAGE_KEY = "steerboard.planning.drafts";

export function parseStoredPlanningDrafts(
  serialized: string | null,
  fallbackDrafts: PlanningDraft[]
): PlanningDraft[] {
  if (!serialized) {
    return fallbackDrafts;
  }

  try {
    const parsed = JSON.parse(serialized);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fallbackDrafts;
    }

    return parsed.map((draft) => normalizePlanningDraft(draft));
  } catch {
    return fallbackDrafts;
  }
}

export function loadPlanningDrafts(fallbackDrafts: PlanningDraft[]): PlanningDraft[] {
  if (typeof window === "undefined") {
    return fallbackDrafts;
  }

  return parseStoredPlanningDrafts(
    window.localStorage.getItem(PLANNING_DRAFTS_STORAGE_KEY),
    fallbackDrafts
  );
}

export function savePlanningDrafts(drafts: PlanningDraft[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PLANNING_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
}
