export const ADAPTIVE_COCKPIT_DROP_JSON_MIME =
  "application/vnd.steerboard.adaptive-cockpit-drop+json";

export const ADAPTIVE_COCKPIT_DROP_PANEL_ID_MIME = "application/x-steerboard-panel";

const ADAPTIVE_COCKPIT_DROP_KIND = "adaptive-cockpit-drop";
const ADAPTIVE_COCKPIT_DROP_VERSION = 1;

export type AdaptiveCockpitDropPayloadSource =
  | "project"
  | "session"
  | "run"
  | "task"
  | "evidence";

interface AdaptiveCockpitDropPayloadBase {
  kind: typeof ADAPTIVE_COCKPIT_DROP_KIND;
  version: typeof ADAPTIVE_COCKPIT_DROP_VERSION;
  source: AdaptiveCockpitDropPayloadSource;
}

export interface AdaptiveCockpitProjectDropPayload extends AdaptiveCockpitDropPayloadBase {
  source: "project";
  projectId: string;
  projectName: string;
}

export interface AdaptiveCockpitSessionDropPayload extends AdaptiveCockpitDropPayloadBase {
  source: "session";
  sessionId: string;
  sessionTitle: string;
}

export interface AdaptiveCockpitRunDropPayload extends AdaptiveCockpitDropPayloadBase {
  source: "run";
  projectId?: string;
  runId: string;
  runTitle: string;
}

export interface AdaptiveCockpitTaskDropPayload extends AdaptiveCockpitDropPayloadBase {
  source: "task";
  projectId?: string;
  taskId: string;
  taskTitle: string;
}

export interface AdaptiveCockpitEvidenceDropPayload extends AdaptiveCockpitDropPayloadBase {
  source: "evidence";
  panelId: string;
}

export type AdaptiveCockpitDropPayload =
  | AdaptiveCockpitProjectDropPayload
  | AdaptiveCockpitSessionDropPayload
  | AdaptiveCockpitRunDropPayload
  | AdaptiveCockpitTaskDropPayload
  | AdaptiveCockpitEvidenceDropPayload;

export type AdaptiveCockpitSessionMap = Readonly<Record<string, readonly string[]>>;

export function buildProjectDropPayload(
  projectId: string,
  projectName: string
): AdaptiveCockpitProjectDropPayload {
  return {
    kind: ADAPTIVE_COCKPIT_DROP_KIND,
    version: ADAPTIVE_COCKPIT_DROP_VERSION,
    source: "project",
    projectId,
    projectName
  };
}

export function buildSessionDropPayload(
  sessionId: string,
  sessionTitle: string
): AdaptiveCockpitSessionDropPayload {
  return {
    kind: ADAPTIVE_COCKPIT_DROP_KIND,
    version: ADAPTIVE_COCKPIT_DROP_VERSION,
    source: "session",
    sessionId,
    sessionTitle
  };
}

export function parseAdaptiveCockpitDropPayload(
  raw: unknown
): AdaptiveCockpitDropPayload | null {
  if (typeof raw !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }

    if (!isAdaptiveCockpitDropPayload(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function resolveAdaptiveDropPanelId(
  payload: AdaptiveCockpitDropPayload | null,
  sessionsByProject: AdaptiveCockpitSessionMap
): string | null {
  if (!payload) {
    return null;
  }

  if (payload.source === "project") {
    const sessions = normalizedSessionIdsForProject(payload.projectId, sessionsByProject);
    return sessions.length > 0 ? sessions[0] : null;
  }

  if (payload.source === "session") {
    return resolveKnownSessionId(payload.sessionId, sessionsByProject);
  }

  if (payload.source === "run" || payload.source === "task") {
    if (!payload.projectId) {
      return null;
    }

    const sessions = normalizedSessionIdsForProject(payload.projectId, sessionsByProject);
    return sessions.length > 0 ? sessions[0] : null;
  }

  const sessions = lookupSessionById(payload.panelId, sessionsByProject);
  return sessions.length > 0 ? sessions[0] : null;
}

function isAdaptiveCockpitDropPayload(value: unknown): value is AdaptiveCockpitDropPayload {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.kind !== ADAPTIVE_COCKPIT_DROP_KIND ||
    value.version !== ADAPTIVE_COCKPIT_DROP_VERSION ||
    typeof value.source !== "string" ||
    !VALID_SOURCES.includes(value.source as AdaptiveCockpitDropPayloadSource)
  ) {
    return false;
  }

  const source = value.source as AdaptiveCockpitDropPayloadSource;
  switch (source) {
    case "project":
      return (
        hasNonEmptyString(value.projectId) &&
        hasNonEmptyString(value.projectName)
      );
    case "session":
      return (
        hasNonEmptyString(value.sessionId) &&
        hasNonEmptyString(value.sessionTitle)
      );
    case "run":
      return (
        hasNonEmptyString(value.runId) &&
        hasNonEmptyString(value.runTitle) &&
        (!hasOwnProperty(value, "projectId") || hasNonEmptyString(value.projectId))
      );
    case "task":
      return (
        hasNonEmptyString(value.taskId) &&
        hasNonEmptyString(value.taskTitle) &&
        (!hasOwnProperty(value, "projectId") || hasNonEmptyString(value.projectId))
      );
    case "evidence":
      return hasNonEmptyString(value.panelId);
    default:
      return false;
  }
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasOwnProperty(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function normalizedSessionIdsForProject(
  projectId: string,
  sessionsByProject: AdaptiveCockpitSessionMap
): string[] {
  const rawSessions = sessionsByProject[projectId];
  if (!Array.isArray(rawSessions)) {
    return [];
  }

  const normalizedSessions: string[] = [];
  for (const sessionId of rawSessions) {
    if (hasNonEmptyString(sessionId)) {
      normalizedSessions.push(sessionId.trim());
    }
  }

  return normalizedSessions;
}

function lookupSessionById(
  sessionId: string,
  sessionsByProject: AdaptiveCockpitSessionMap
): string[] {
  const target = sessionId.trim();
  if (!target) {
    return [];
  }

  for (const sessionIds of Object.values(sessionsByProject)) {
    if (!Array.isArray(sessionIds)) {
      continue;
    }

    if (sessionIds.includes(target)) {
      return [target];
    }
  }

  return [];
}

function resolveKnownSessionId(sessionId: string, sessionsByProject: AdaptiveCockpitSessionMap): string | null {
  const matches = lookupSessionById(sessionId, sessionsByProject);
  return matches.length > 0 ? matches[0] : null;
}

const VALID_SOURCES: AdaptiveCockpitDropPayloadSource[] = [
  "project",
  "session",
  "run",
  "task",
  "evidence"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}
