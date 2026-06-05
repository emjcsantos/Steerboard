export interface AdaptiveCockpitProjectStackSession {
  id?: unknown;
  projectId?: unknown;
  role?: unknown;
  state?: unknown;
  title?: unknown;
}

export interface AdaptiveCockpitProjectStackInput {
  projectId?: unknown;
  sessions?: unknown;
  fallbackSessionIds?: unknown;
  maxPanelCount?: unknown;
}

export interface AdaptiveCockpitProjectStackResult {
  panelIds: string[];
  templateId: "project-stack" | "fallback-stack" | "unavailable";
  label: string;
  detail: string;
  primaryPanelId: string;
}

const ROLE_PRIORITY: Record<string, number> = {
  orchestrator: 0,
  implementer: 1,
  validator: 2,
  integration: 3
};

const STATE_PRIORITY: Record<string, number> = {
  planning: 0,
  implementing: 1,
  validating: 2,
  blocked: 3,
  failed: 4,
  idle: 5,
  complete: 6
};

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMaxPanelCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.max(0, Math.floor(value));
}

function readSessions(rawSessions: unknown): AdaptiveCockpitProjectStackSession[] {
  return Array.isArray(rawSessions)
    ? rawSessions.filter((session): session is AdaptiveCockpitProjectStackSession =>
        typeof session === "object" && session !== null
      )
    : [];
}

function readFallbackIds(rawFallbacks: unknown): string[] {
  return Array.isArray(rawFallbacks)
    ? rawFallbacks.map(normalizeString).filter(Boolean)
    : [];
}

function addUniquePanelIds(
  panelIds: string[],
  candidateIds: readonly string[],
  maxPanelCount: number
) {
  for (const candidateId of candidateIds) {
    if (panelIds.length >= maxPanelCount) {
      return;
    }

    const panelId = normalizeString(candidateId);
    if (panelId && !panelIds.includes(panelId)) {
      panelIds.push(panelId);
    }
  }
}

function priorityFor(value: unknown, priorityMap: Record<string, number>): number {
  const normalized = normalizeString(value).toLowerCase();
  return priorityMap[normalized] ?? Number.MAX_SAFE_INTEGER;
}

function projectPanelIds(
  sessions: readonly AdaptiveCockpitProjectStackSession[],
  projectId: string
): string[] {
  return sessions
    .map((session, index) => ({
      id: normalizeString(session.id),
      projectId: normalizeString(session.projectId),
      rolePriority: priorityFor(session.role, ROLE_PRIORITY),
      statePriority: priorityFor(session.state, STATE_PRIORITY),
      index
    }))
    .filter((session) => session.id && session.projectId === projectId)
    .sort((a, b) => {
      if (a.rolePriority !== b.rolePriority) {
        return a.rolePriority - b.rolePriority;
      }

      if (a.statePriority !== b.statePriority) {
        return a.statePriority - b.statePriority;
      }

      return a.index - b.index;
    })
    .map((session) => session.id);
}

export function createAdaptiveProjectPanelStack(
  input: AdaptiveCockpitProjectStackInput
): AdaptiveCockpitProjectStackResult {
  const projectId = normalizeString(input.projectId);
  const maxPanelCount = normalizeMaxPanelCount(input.maxPanelCount);
  const sessions = readSessions(input.sessions);
  const fallbackSessionIds = readFallbackIds(input.fallbackSessionIds);
  const panelIds: string[] = [];

  if (!projectId || maxPanelCount <= 0) {
    return {
      panelIds,
      templateId: "unavailable",
      label: "Project stack unavailable",
      detail: "No valid project or panel capacity is available.",
      primaryPanelId: ""
    };
  }

  addUniquePanelIds(panelIds, projectPanelIds(sessions, projectId), maxPanelCount);
  const projectPanelCount = panelIds.length;
  addUniquePanelIds(panelIds, fallbackSessionIds, maxPanelCount);

  if (panelIds.length === 0) {
    return {
      panelIds,
      templateId: "unavailable",
      label: "Project stack unavailable",
      detail: "No project sessions or fallback panels are available.",
      primaryPanelId: ""
    };
  }

  const templateId = projectPanelCount > 0 ? "project-stack" : "fallback-stack";
  const projectLabel = projectPanelCount === 1 ? "1 project panel" : `${projectPanelCount} project panels`;
  const fallbackCount = panelIds.length - projectPanelCount;
  const fallbackLabel = fallbackCount > 0
    ? ` plus ${fallbackCount} monitor ${fallbackCount === 1 ? "panel" : "panels"}`
    : "";

  return {
    panelIds,
    templateId,
    label: templateId === "project-stack" ? "Project panel stack" : "Monitor panel stack",
    detail: `${projectLabel}${fallbackLabel} selected for Adaptive cockpit.`,
    primaryPanelId: panelIds[0]
  };
}
