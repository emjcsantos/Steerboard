import type { SessionSummary } from "./fixtures";

export interface CockpitPanelOverflow {
  label: string;
  detail: string;
  tone: "clear" | "queued" | "blocked";
  hiddenLabel: string;
  nextLabel: string;
  reviewLabel: string;
}

function sanitizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const rounded = Math.floor(value);
  return rounded > 0 ? rounded : 0;
}

function sanitizeTitle(rawTitle: string): string {
  const collapsed = rawTitle
    .replace(/[\\\/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!collapsed) {
    return "Untitled panel";
  }

  return collapsed.slice(0, 48);
}

export function createCockpitPanelOverflow(
  sessions: readonly SessionSummary[],
  visibleCount: number,
  maxVisible: number
): CockpitPanelOverflow {
  const total = sanitizeCount(sessions.length);
  const sanitizedVisibleCount = sanitizeCount(visibleCount);
  const sanitizedMaxVisible = sanitizeCount(maxVisible);

  const effectiveVisible = sanitizedMaxVisible > 0
    ? Math.min(total, sanitizedVisibleCount, sanitizedMaxVisible)
    : Math.min(total, sanitizedVisibleCount);

  const hiddenSessions = sessions.slice(effectiveVisible);
  const hiddenCount = hiddenSessions.length;
  const blockedHiddenCount = hiddenSessions.filter(
    (session) => session.state === "blocked" || session.state === "failed"
  ).length;

  const nextLabel = hiddenSessions.length > 0
    ? sanitizeTitle(hiddenSessions[0].title)
    : "None";

  if (hiddenCount === 0) {
    return {
      label: "All panels visible",
      detail: "No Arena panels are outside the current grid.",
      tone: "clear",
      hiddenLabel: `${hiddenCount} hidden`,
      nextLabel: "None",
      reviewLabel: `${blockedHiddenCount} need review`
    };
  }

  if (blockedHiddenCount > 0) {
    return {
      label: "Hidden panel needs review",
      detail: "A hidden panel is blocked or failed.",
      tone: "blocked",
      hiddenLabel: `${hiddenCount} hidden`,
      nextLabel,
      reviewLabel: `${blockedHiddenCount} need review`
    };
  }

  return {
    label: "Hidden panels queued",
    detail: "Additional Arena panels are outside the current grid.",
    tone: "queued",
    hiddenLabel: `${hiddenCount} hidden`,
    nextLabel,
    reviewLabel: `${blockedHiddenCount} need review`
  };
}
