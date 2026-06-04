import type { SessionSummary } from "./fixtures";
import type { CockpitPanelPriority } from "./cockpitPanelPriority";

export type CockpitPanelFocusTone =
  | CockpitPanelPriority["tone"]
  | "focused"
  | "neutral";

export interface CockpitPanelFocusTarget {
  panelId: string;
  canFocus: boolean;
  isFocused: boolean;
  positionLabel: string;
  detail: string;
  tone: CockpitPanelFocusTone;
}

const NEUTRAL_DETAIL: CockpitPanelFocusTarget = {
  panelId: "none",
  canFocus: false,
  isFocused: false,
  positionLabel: "No visible panel",
  detail: "No visible panel target.",
  tone: "neutral"
};

function createNeutralTarget(): CockpitPanelFocusTarget {
  return { ...NEUTRAL_DETAIL };
}

function createVisibleFocusTarget(
  visibleIndex: number,
  sessions: readonly SessionSummary[],
  priority: CockpitPanelPriority,
  focusedPanelId?: string
): CockpitPanelFocusTarget {
  const panelId = sessions[visibleIndex].id;
  const isFocused = panelId === focusedPanelId;

  return {
    panelId,
    canFocus: !isFocused,
    isFocused,
    positionLabel: `Panel ${visibleIndex + 1} of ${sessions.length}`,
    detail: isFocused
      ? "Panel is already focused."
      : "Panel is visible and can be focused.",
    tone: isFocused ? "focused" : priority.tone
  };
}

export function createCockpitPanelFocusTarget(
  sessions: readonly SessionSummary[],
  priority: CockpitPanelPriority,
  focusedPanelId?: string
): CockpitPanelFocusTarget {
  if (priority.panelId === "none" || sessions.length === 0) {
    return createNeutralTarget();
  }

  const visibleIndex = sessions.findIndex((session) => session.id === priority.panelId);
  if (visibleIndex === -1) {
    return createNeutralTarget();
  }

  return createVisibleFocusTarget(visibleIndex, sessions, priority, focusedPanelId);
}
