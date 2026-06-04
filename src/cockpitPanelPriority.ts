import type { SessionState, SessionSummary } from "./fixtures";

export type CockpitPanelPriorityTone =
  | "critical"
  | "attention"
  | "active"
  | "idle"
  | "complete";

export interface CockpitPanelPriority {
  panelId: string;
  title: string;
  role: SessionSummary["role"];
  state: SessionState;
  priorityLabel: string;
  detail: string;
  tone: CockpitPanelPriorityTone;
  score: number;
}

interface PriorityCandidate {
  session: SessionSummary;
  index: number;
  attempt: number;
}

const TITLE_MAX_LENGTH = 52;
const DETAIL_MAX_LENGTH = 96;

const IDLE_PRIORITY: CockpitPanelPriority = {
  panelId: "none",
  title: "No visible panel",
  role: "integration",
  state: "idle",
  priorityLabel: "Idle cockpit",
  detail: "No visible cockpit panels are currently requiring attention.",
  tone: "idle",
  score: 0
};

const STATE_PRIORITY: Record<SessionState, number> = {
  blocked: 120,
  failed: 115,
  validating: 90,
  implementing: 70,
  planning: 45,
  idle: 20,
  complete: 10
};

const STATE_TONE: Record<SessionState, CockpitPanelPriorityTone> = {
  blocked: "critical",
  failed: "critical",
  validating: "attention",
  implementing: "active",
  planning: "active",
  idle: "idle",
  complete: "complete"
};

const PRIORITY_LABELS: Record<SessionState, string> = {
  blocked: "Blocked panel",
  failed: "Failed panel",
  validating: "Validation in progress",
  implementing: "Implementation in progress",
  planning: "Planning panel",
  idle: "Panel idle",
  complete: "Panel complete"
};

function normalizeWhitespace(value: string): string {
  return value
    .replace(/[\\\/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeText(value: string, maxLength: number): string {
  const normalized = normalizeWhitespace(value);

  if (normalized.length === 0) {
    return "Untitled panel";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const clipLength = Math.max(0, maxLength - 3);
  return `${normalized.slice(0, clipLength)}...`;
}

function safeAttempt(attempt: unknown): number {
  if (typeof attempt !== "number" || !Number.isFinite(attempt)) {
    return 0;
  }

  const normalized = Math.trunc(attempt);
  return normalized > 0 ? normalized : 0;
}

function toDetail(
  state: SessionState,
  role: SessionSummary["role"]
): string {
  return sanitizeText(
    `${role} panel is ${state}.`,
    DETAIL_MAX_LENGTH
  );
}

function scoreSession(session: SessionSummary, index: number): number {
  const priority = STATE_PRIORITY[session.state];
  const attempt = safeAttempt(session.attempt);
  return priority * 100 + attempt * 10 - index;
}

export function createCockpitPanelPriority(
  sessions: readonly SessionSummary[]
): CockpitPanelPriority {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return IDLE_PRIORITY;
  }

  const winner = sessions
    .map<PriorityCandidate>((session, index) => ({
      session,
      index,
      attempt: safeAttempt(session.attempt)
    }))
    .reduce((current, next) => {
      const currentStateWeight = STATE_PRIORITY[current.session.state];
      const nextStateWeight = STATE_PRIORITY[next.session.state];
      if (nextStateWeight !== currentStateWeight) {
        return nextStateWeight > currentStateWeight ? next : current;
      }

      if (next.attempt !== current.attempt) {
        return next.attempt > current.attempt ? next : current;
      }

      return next.index < current.index ? next : current;
    });

  const { session } = winner;

  return {
    panelId: session.id,
    title: sanitizeText(session.title, TITLE_MAX_LENGTH),
    role: session.role,
    state: session.state,
    priorityLabel: PRIORITY_LABELS[session.state],
    detail: toDetail(session.state, session.role),
    tone: STATE_TONE[session.state],
    score: scoreSession(session, winner.index)
  };
}
