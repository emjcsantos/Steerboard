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
  templateId?: unknown;
}

export type AdaptiveCockpitProjectStackRequestedTemplateId =
  | "auto-stack"
  | "project-focus"
  | "project-monitor"
  | "project-orchestrator";

export type AdaptiveCockpitProjectStackTemplateId =
  | AdaptiveCockpitProjectStackRequestedTemplateId
  | "project-stack"
  | "fallback-stack"
  | "unavailable";

export interface AdaptiveCockpitProjectStackResult {
  panelIds: string[];
  templateId: AdaptiveCockpitProjectStackTemplateId;
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
  projectId: string,
  options?: {
    allowedRoles?: readonly string[];
    maxCount?: number;
  }
): string[] {
  const roleWhitelist = options?.allowedRoles
    ? new Set(options.allowedRoles.map((role) => role.toLowerCase()))
    : null;

  const maxCount =
    options?.maxCount !== undefined
      ? Math.max(0, Math.floor(options.maxCount))
      : undefined;

  return sessions
    .map((session, index) => ({
      id: normalizeString(session.id),
      projectId: normalizeString(session.projectId),
      rolePriority: priorityFor(session.role, ROLE_PRIORITY),
      statePriority: priorityFor(session.state, STATE_PRIORITY),
      role: normalizeString(session.role).toLowerCase(),
      index
    }))
    .filter((session) => session.id && session.projectId === projectId)
    .filter((session) => roleWhitelist === null || roleWhitelist.has(session.role))
    .sort((a, b) => {
      if (a.rolePriority !== b.rolePriority) {
        return a.rolePriority - b.rolePriority;
      }

      if (a.statePriority !== b.statePriority) {
        return a.statePriority - b.statePriority;
      }

      return a.index - b.index;
    })
    .map((session) => session.id)
    .slice(0, maxCount);
}

function resolveTemplateId(value: unknown): AdaptiveCockpitProjectStackRequestedTemplateId {
  const templateId = normalizeString(value).toLowerCase();

  switch (templateId) {
    case "auto-stack":
    case "project-focus":
    case "project-monitor":
    case "project-orchestrator":
      return templateId;
    default:
      return "auto-stack";
  }
}

function templateMetadata(
  templateId: AdaptiveCockpitProjectStackTemplateId,
  projectPanelCount: number,
  fallbackCount: number,
  totalCount: number
) {
  if (templateId === "project-stack" || templateId === "project-monitor" || templateId === "project-focus") {
    const projectLabel = projectPanelCount === 1
      ? "1 project panel"
      : `${projectPanelCount} project panels`;
    const fallbackLabel = fallbackCount > 0
      ? ` plus ${fallbackCount} monitor ${fallbackCount === 1 ? "panel" : "panels"}`
      : "";

    const label = templateId === "project-stack" ? "Project panel stack" : (
      templateId === "project-monitor" ? "Project monitor stack" : "Project focus stack"
    );

    const detailTemplate = templateId === "project-monitor"
      ? "project monitor template"
      : templateId === "project-focus"
        ? "project focus template"
        : "Adaptive cockpit";

    return {
      label,
      detail: `${projectLabel}${fallbackLabel} selected for ${detailTemplate}.`
    };
  }

  if (templateId === "project-orchestrator") {
    const projectLabel = projectPanelCount === 1
      ? "1 project panel"
      : `${projectPanelCount} project panels`;
    const fallbackLabel = fallbackCount > 0
      ? ` plus ${fallbackCount} monitor ${fallbackCount === 1 ? "panel" : "panels"}`
      : "";

    return {
      label: "Project orchestrator stack",
      detail: `${projectLabel}${fallbackLabel} selected for project-orchestrator template.`
    };
  }

  if (templateId === "fallback-stack") {
    return {
      label: "Monitor panel stack",
      detail: `${totalCount} monitor ${totalCount === 1 ? "panel" : "panels"} selected for Adaptive cockpit.`
    };
  }

  return {
    label: "Project stack unavailable",
    detail: "No valid project or panel capacity is available."
  };
}

export function createAdaptiveProjectPanelStack(
  input: AdaptiveCockpitProjectStackInput
): AdaptiveCockpitProjectStackResult {
  const projectId = normalizeString(input.projectId);
  const maxPanelCount = normalizeMaxPanelCount(input.maxPanelCount);
  const requestedTemplate = resolveTemplateId(input.templateId);
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

  const projectSelection = requestedTemplate === "project-orchestrator"
    ? projectPanelIds(sessions, projectId, {
      allowedRoles: ["orchestrator", "implementer", "validator", "integration"]
    })
    : projectPanelIds(sessions, projectId, {
      maxCount: requestedTemplate === "project-focus" ? 1 : undefined
    });

  addUniquePanelIds(panelIds, projectSelection, maxPanelCount);

  if (requestedTemplate === "project-focus") {
    if (panelIds.length < maxPanelCount) {
      const focusFallbackLimit = panelIds.length + 1;
      addUniquePanelIds(panelIds, fallbackSessionIds, focusFallbackLimit);
    }
  } else {
    addUniquePanelIds(panelIds, fallbackSessionIds, maxPanelCount);
  }

  if (panelIds.length === 0) {
    return {
      panelIds,
      templateId: "unavailable",
      label: "Project stack unavailable",
      detail: "No project sessions or fallback panels are available.",
      primaryPanelId: ""
    };
  }

  const projectPanelCount = panelIds.filter((panelId) => projectSelection.includes(panelId)).length;
  const fallbackCount = panelIds.length - projectPanelCount;
  const resolvedTemplateId = projectPanelCount === 0
    ? "fallback-stack"
    : requestedTemplate === "auto-stack"
      ? "project-stack"
      : requestedTemplate;

  const metadata = templateMetadata(
    resolvedTemplateId,
    projectPanelCount,
    fallbackCount,
    panelIds.length
  );

  return {
    panelIds,
    templateId: resolvedTemplateId,
    label: metadata.label,
    detail: metadata.detail,
    primaryPanelId: panelIds[0]
  };
}
