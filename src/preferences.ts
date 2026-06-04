import { defaultLayoutByMode, layoutOptions, type CockpitMode, type LayoutId } from "./layout";

export type PrimaryView = "cockpit" | "pipeline";

export interface WorkspacePreferences {
  selectedProjectId: string;
  mode: CockpitMode;
  layoutId: LayoutId;
  view: PrimaryView;
}

export const PREFERENCES_STORAGE_KEY = "steerboard.workspace.preferences";

export const fallbackPreferences: WorkspacePreferences = {
  selectedProjectId: "website-refresh",
  mode: "orchestrator",
  layoutId: defaultLayoutByMode.orchestrator,
  view: "cockpit"
};

const validModes: CockpitMode[] = ["focus", "orchestrator", "monitor"];
const validViews: PrimaryView[] = ["cockpit", "pipeline"];
const validLayouts = layoutOptions.map((layout) => layout.id);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizePreferences(
  value: unknown,
  validProjectIds: string[],
  fallback: WorkspacePreferences = fallbackPreferences
): WorkspacePreferences {
  if (!isRecord(value)) {
    return fallback;
  }

  const mode = validModes.includes(value.mode as CockpitMode)
    ? (value.mode as CockpitMode)
    : fallback.mode;
  const layoutId = validLayouts.includes(value.layoutId as LayoutId)
    ? (value.layoutId as LayoutId)
    : defaultLayoutByMode[mode];
  const view = validViews.includes(value.view as PrimaryView) ? (value.view as PrimaryView) : fallback.view;
  const selectedProjectId =
    typeof value.selectedProjectId === "string" && validProjectIds.includes(value.selectedProjectId)
      ? value.selectedProjectId
      : fallback.selectedProjectId;

  return {
    selectedProjectId,
    mode,
    layoutId,
    view
  };
}

export function parseStoredPreferences(
  serialized: string | null,
  validProjectIds: string[],
  fallback: WorkspacePreferences = fallbackPreferences
): WorkspacePreferences {
  if (!serialized) {
    return fallback;
  }

  try {
    return normalizePreferences(JSON.parse(serialized), validProjectIds, fallback);
  } catch {
    return fallback;
  }
}

export function loadWorkspacePreferences(validProjectIds: string[]): WorkspacePreferences {
  if (typeof window === "undefined") {
    return fallbackPreferences;
  }

  return parseStoredPreferences(window.localStorage.getItem(PREFERENCES_STORAGE_KEY), validProjectIds);
}

export function saveWorkspacePreferences(preferences: WorkspacePreferences) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}
