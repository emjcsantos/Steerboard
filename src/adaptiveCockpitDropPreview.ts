import type {
  AdaptiveCockpitDropPayload,
  AdaptiveCockpitDropPayloadSource
} from "./adaptiveCockpitDrop";

export type AdaptiveCockpitDropPreviewStatus = "ready" | "unsupported" | "unavailable";
export type AdaptiveCockpitDropPreviewTone = "success" | "warning" | "danger";

export interface AdaptiveCockpitDropContext {
  isAdaptiveMode: boolean;
}

export interface AdaptiveCockpitDropPreview {
  status: AdaptiveCockpitDropPreviewStatus;
  tone: AdaptiveCockpitDropPreviewTone;
  label: string;
  detail: string;
  action: string;
}

const KNOWN_SOURCES: AdaptiveCockpitDropPayloadSource[] = [
  "project",
  "session",
  "run",
  "task",
  "evidence"
];

const SOURCE_LABELS: Record<AdaptiveCockpitDropPayloadSource, string> = {
  project: "Project",
  session: "Session",
  run: "Run",
  task: "Task",
  evidence: "Evidence"
};

function isSupportedSource(value: unknown): value is AdaptiveCockpitDropPayloadSource {
  return (
    typeof value === "string" &&
    (KNOWN_SOURCES as readonly string[]).includes(value)
  );
}

function hasLabelValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function resolveSource(payload: AdaptiveCockpitDropPayload | null): AdaptiveCockpitDropPayloadSource | "" {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const candidate = (payload as { source?: unknown }).source;
  return isSupportedSource(candidate) ? candidate : "";
}

function hasRequiredPayloadLabelData(payload: AdaptiveCockpitDropPayload): boolean {
  const source = resolveSource(payload);
  if (!source) {
    return false;
  }

  if (source === "project") {
    return hasLabelValue((payload as { projectName?: string }).projectName);
  }

  if (source === "session") {
    return hasLabelValue((payload as { sessionTitle?: string }).sessionTitle);
  }

  if (source === "run") {
    return hasLabelValue((payload as { runTitle?: string }).runTitle);
  }

  if (source === "task") {
    return hasLabelValue((payload as { taskTitle?: string }).taskTitle);
  }

  if (source === "evidence") {
    return hasLabelValue((payload as { panelId?: string }).panelId);
  }

  return false;
}

function resolvePayloadLabel(payload: AdaptiveCockpitDropPayload): string {
  const source = resolveSource(payload);
  if (!source) {
    return "Unknown item";
  }

  if (source === "project") {
    return hasLabelValue((payload as { projectName?: string }).projectName)
      ? (payload as { projectName: string }).projectName
      : "Project";
  }

  if (source === "session") {
    return hasLabelValue((payload as { sessionTitle?: string }).sessionTitle)
      ? (payload as { sessionTitle: string }).sessionTitle
      : "Session";
  }

  if (source === "run") {
    return hasLabelValue((payload as { runTitle?: string }).runTitle)
      ? (payload as { runTitle: string }).runTitle
      : "Run";
  }

  if (source === "task") {
    return hasLabelValue((payload as { taskTitle?: string }).taskTitle)
      ? (payload as { taskTitle: string }).taskTitle
      : "Task";
  }

  if (source === "evidence") {
    return hasLabelValue((payload as { panelId?: string }).panelId)
      ? `Evidence (${(payload as { panelId: string }).panelId})`
      : "Evidence";
  }

  return "Unknown item";
}

function buildUnavailableState(label: string, detail: string, action: string): AdaptiveCockpitDropPreview {
  return {
    status: "unavailable",
    tone: "danger",
    label,
    detail,
    action
  };
}

function buildUnsupportedState(
  label: string,
  detail: string,
  action: string
): AdaptiveCockpitDropPreview {
  return {
    status: "unsupported",
    tone: "warning",
    label,
    detail,
    action
  };
}

function buildReadyState(label: string, _panelId: string): AdaptiveCockpitDropPreview {
  return {
    status: "ready",
    tone: "success",
    label: `Drop ${label}`,
    detail: "Ready to place in Adaptive Arena.",
    action: "Release to place."
  };
}

export function createAdaptiveCockpitDropPreview(
  payload: AdaptiveCockpitDropPayload | null,
  resolvedPanelId: string | null,
  context: AdaptiveCockpitDropContext
): AdaptiveCockpitDropPreview {
  if (!context?.isAdaptiveMode) {
    return buildUnavailableState(
      "Adaptive drop unavailable",
      "Adaptive drop preview is unavailable until adaptive mode is enabled.",
      "Enable adaptive mode."
    );
  }

  if (!payload) {
    return buildUnavailableState(
      "Drop item unavailable",
      "No drop payload is available.",
      "Drop a supported item."
    );
  }

  const source = resolveSource(payload);
  if (!source) {
    return buildUnsupportedState(
      "Unsupported drop item",
      "This item type is not supported for adaptive docking.",
      "Drop only project, session, run, task, or evidence."
    );
  }

  if (!hasRequiredPayloadLabelData(payload)) {
    return buildUnsupportedState(
      "Unsupported drop item",
      "Drop payload is missing required item details.",
      "Drop only project, session, run, task, or evidence."
    );
  }

  if (typeof resolvedPanelId !== "string" || resolvedPanelId.trim().length === 0) {
    const payloadLabel = resolvePayloadLabel(payload);
    return buildUnavailableState(
      "Drop target unavailable",
      `${payloadLabel} has no resolved adaptive panel target yet.`,
      "Drop directly onto a valid panel."
    );
  }

  const payloadLabel = resolvePayloadLabel(payload);
  return buildReadyState(`${SOURCE_LABELS[source]} ${payloadLabel}`, resolvedPanelId.trim());
}
