import type { SessionSummary } from "./fixtures";

export interface CockpitPanelRosterMetric {
  label: string;
  value: string;
  tone: "orchestrator" | "worker" | "validator" | "integration" | "neutral";
}

export interface CockpitPanelRoster {
  label: string;
  detail: string;
  tone: "waiting" | "active" | "blocked" | "complete";
  visibleLabel: string;
  hiddenLabel: string;
  metrics: CockpitPanelRosterMetric[];
}

function sanitizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const rounded = Math.floor(value);
  return rounded > 0 ? rounded : 0;
}

function buildMetrics(sessions: readonly SessionSummary[]): CockpitPanelRosterMetric[] {
  const orchestrator = sessions.filter((session) => session.role === "orchestrator").length;
  const worker = sessions.filter((session) => session.role === "implementer").length;
  const validator = sessions.filter((session) => session.role === "validator").length;
  const integration = sessions.filter((session) => session.role === "integration").length;

  return [
    { label: "Orchestrator", value: `${orchestrator}`, tone: "orchestrator" },
    { label: "Workers", value: `${worker}`, tone: "worker" },
    { label: "Validators", value: `${validator}`, tone: "validator" },
    { label: "Integration", value: `${integration}`, tone: "integration" }
  ];
}

export function createCockpitPanelRoster(
  sessions: readonly SessionSummary[],
  visibleCount: number,
  maxVisible: number
): CockpitPanelRoster {
  const total = sanitizeCount(sessions.length);
  const sanitizedVisibleCount = sanitizeCount(visibleCount);
  const sanitizedMaxVisible = sanitizeCount(maxVisible);

  const effectiveVisible = sanitizedMaxVisible > 0
    ? Math.min(total, sanitizedVisibleCount, sanitizedMaxVisible)
    : Math.min(total, sanitizedVisibleCount);

  const hidden = Math.max(0, total - effectiveVisible);
  const visibleSessions = sessions.slice(0, effectiveVisible);
  const hasBlockedOrFailed = visibleSessions.some(
    (session) => session.state === "blocked" || session.state === "failed"
  );
  const allComplete =
    visibleSessions.length > 0 && visibleSessions.every((session) => session.state === "complete");

  const metrics = buildMetrics(visibleSessions);

  if (total === 0) {
    return {
      label: "No panels",
      detail: "No Arena panels are available.",
      tone: "waiting",
      visibleLabel: `${effectiveVisible}/${total} visible`,
      hiddenLabel: `${hidden} hidden`,
      metrics
    };
  }

  if (hasBlockedOrFailed) {
    return {
      label: "Panel review needed",
      detail: "Blocked or failed panels need attention.",
      tone: "blocked",
      visibleLabel: `${effectiveVisible}/${total} visible`,
      hiddenLabel: `${hidden} hidden`,
      metrics
    };
  }

  if (allComplete) {
    return {
      label: "All panels complete",
      detail: "Every visible panel is complete.",
      tone: "complete",
      visibleLabel: `${effectiveVisible}/${total} visible`,
      hiddenLabel: `${hidden} hidden`,
      metrics
    };
  }

  return {
    label: "Panels active",
    detail: "Monitor active roles across the Arena grid.",
    tone: "active",
    visibleLabel: `${effectiveVisible}/${total} visible`,
    hiddenLabel: `${hidden} hidden`,
    metrics
  };
}
