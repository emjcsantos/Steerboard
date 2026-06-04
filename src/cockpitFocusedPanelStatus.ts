import type { SessionSummary } from "./fixtures";

export type CockpitFocusedPanelStatusTone =
  | "critical"
  | "attention"
  | "active"
  | "complete"
  | "idle"
  | "neutral";

export interface CockpitFocusedPanelStatus {
  panelId: string;
  hasFocus: boolean;
  label: string;
  detail: string;
  tone: CockpitFocusedPanelStatusTone;
}

const DEFAULT_STATUS: CockpitFocusedPanelStatus = {
  panelId: "none",
  hasFocus: false,
  label: "No focus",
  detail: "No cockpit panel is focused.",
  tone: "neutral"
};

const DETAIL_MAX_LENGTH = 78;

const STATE_TONE: Record<SessionSummary["state"], CockpitFocusedPanelStatusTone> = {
  blocked: "critical",
  failed: "critical",
  validating: "attention",
  implementing: "active",
  planning: "active",
  complete: "complete",
  idle: "idle"
};

function compactWhitespace(value: string): string {
  return value
    .replace(/[\\\/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value: string, maxLength: number, fallback: string): string {
  const sanitized = compactWhitespace(value);

  if (!sanitized.length) {
    return fallback;
  }

  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  return `${sanitized.slice(0, Math.max(0, maxLength - 3))}...`;
}

function capitalizeWord(value: string): string {
  if (!value.length) {
    return value;
  }

  return `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}`;
}

export function createCockpitFocusedPanelStatus(
  sessions: readonly SessionSummary[],
  focusedPanelId?: string
): CockpitFocusedPanelStatus {
  if (!focusedPanelId) {
    return { ...DEFAULT_STATUS };
  }

  const index = sessions.findIndex((session) => session.id === focusedPanelId);
  if (index === -1) {
    return { ...DEFAULT_STATUS };
  }

  const session = sessions[index];
  const roleLabel = capitalizeWord(session.role);
  const safeTitle = compactText(session.title, 48, "Untitled panel");

  return {
    panelId: session.id,
    hasFocus: true,
    label: "Focused",
    detail: compactText(
      `Panel ${index + 1} of ${sessions.length} - ${roleLabel}: ${safeTitle}`,
      DETAIL_MAX_LENGTH,
      "Panel is focused."
    ),
    tone: STATE_TONE[session.state]
  };
}
