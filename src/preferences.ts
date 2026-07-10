import { defaultLayoutByMode, layoutOptions, type CockpitMode, type LayoutId } from "./layout";
import type { AdaptiveCockpitProjectStackRequestedTemplateId } from "./adaptiveCockpitProjectStack";

export type PrimaryView = "cockpit" | "pipeline" | "planning";
export type OrchestratorPresentationMode = "professional" | "classroom";

export interface WorkspacePreferences {
  selectedProjectId: string;
  mode: CockpitMode;
  layoutId: LayoutId;
  view: PrimaryView;
  adaptiveProjectTemplateId: AdaptiveCockpitProjectStackRequestedTemplateId;
  orchestratorPresentationMode: OrchestratorPresentationMode;
}

export const PREFERENCES_STORAGE_KEY = "steerboard.workspace.preferences";

export const fallbackPreferences: WorkspacePreferences = {
  selectedProjectId: "website-refresh",
  mode: "orchestrator",
  layoutId: defaultLayoutByMode.orchestrator,
  view: "cockpit",
  adaptiveProjectTemplateId: "auto-stack",
  orchestratorPresentationMode: "professional"
};

const validModes: CockpitMode[] = ["focus", "orchestrator", "monitor"];
const validViews: PrimaryView[] = ["cockpit", "pipeline", "planning"];
const validLayouts = layoutOptions.map((layout) => layout.id);
const validAdaptiveProjectTemplateIds: AdaptiveCockpitProjectStackRequestedTemplateId[] = [
  "auto-stack",
  "project-focus",
  "project-monitor",
  "project-orchestrator"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizePreferences(
  value: unknown,
  validProjectIds: string[],
  fallback: WorkspacePreferences = fallbackPreferences,
  classroomFeatureEnabled = false
): WorkspacePreferences {
  const safeFallback: WorkspacePreferences = {
    ...fallback,
    orchestratorPresentationMode: "professional"
  };

  if (!isRecord(value)) {
    return safeFallback;
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
  const adaptiveProjectTemplateId = validAdaptiveProjectTemplateIds.includes(
    value.adaptiveProjectTemplateId as AdaptiveCockpitProjectStackRequestedTemplateId
  )
    ? (value.adaptiveProjectTemplateId as AdaptiveCockpitProjectStackRequestedTemplateId)
    : fallback.adaptiveProjectTemplateId;
  const orchestratorPresentationMode: OrchestratorPresentationMode =
    classroomFeatureEnabled && value.orchestratorPresentationMode === "classroom"
      ? "classroom"
      : "professional";

  return {
    selectedProjectId,
    mode,
    layoutId,
    view,
    adaptiveProjectTemplateId,
    orchestratorPresentationMode
  };
}

export function parseStoredPreferences(
  serialized: string | null,
  validProjectIds: string[],
  fallback: WorkspacePreferences = fallbackPreferences,
  classroomFeatureEnabled = false
): WorkspacePreferences {
  if (!serialized) {
    return { ...fallback, orchestratorPresentationMode: "professional" };
  }

  try {
    return normalizePreferences(JSON.parse(serialized), validProjectIds, fallback, classroomFeatureEnabled);
  } catch {
    return { ...fallback, orchestratorPresentationMode: "professional" };
  }
}

export function loadWorkspacePreferences(
  validProjectIds: string[],
  classroomFeatureEnabled = false
): WorkspacePreferences {
  if (typeof window === "undefined") {
    return fallbackPreferences;
  }

  return parseStoredPreferences(
    window.localStorage.getItem(PREFERENCES_STORAGE_KEY),
    validProjectIds,
    fallbackPreferences,
    classroomFeatureEnabled
  );
}

export function saveWorkspacePreferences(preferences: WorkspacePreferences) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}
