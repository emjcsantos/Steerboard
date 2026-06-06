import type { CockpitMode, LayoutId, LayoutSpec } from "./layout";
import { defaultLayoutByMode, getLayoutSpec } from "./layout";

export type CockpitModeHandoffTone = "stable" | "expanding" | "focused" | "watching";

export interface CockpitModeHandoff {
  currentModeLabel: string;
  nextModeLabel: string;
  currentLayoutLabel: string;
  nextLayoutLabel: string;
  preservedLabel: string;
  detail: string;
  tone: CockpitModeHandoffTone;
  ariaLabel: string;
}

const MODE_LABEL: Record<CockpitMode, string> = {
  focus: "Focus",
  orchestrator: "Orchestrator",
  monitor: "Monitor"
};

const NEXT_MODE: Record<CockpitMode, CockpitMode> = {
  focus: "orchestrator",
  orchestrator: "monitor",
  monitor: "focus"
};

const MODE_TONE: Record<CockpitMode, CockpitModeHandoffTone> = {
  focus: "focused",
  orchestrator: "expanding",
  monitor: "watching"
};

const MODE_DETAIL: Record<CockpitMode, string> = {
  focus:
    "Handoff expands from focused review into orchestrated worker visibility.",
  orchestrator:
    "Handoff expands worker coordination into multi-project monitoring.",
  monitor: "Handoff returns monitoring context to focused review."
};

function isKnownMode(mode: string): mode is CockpitMode {
  return mode === "focus" || mode === "orchestrator" || mode === "monitor";
}

function clampNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const floored = Math.floor(value);
  return Math.max(0, floored);
}

function computePreservedLabel(visibleCount: number, totalCount: number): string {
  const total = clampNonNegativeInt(totalCount);
  const visibleRaw = clampNonNegativeInt(visibleCount);
  const visible = total === 0 ? 0 : Math.min(visibleRaw, total);
  return `${visible}/${total} panels preserved`;
}

export function createCockpitModeHandoff(
  mode: CockpitMode,
  layout: LayoutSpec,
  visibleCount: number,
  totalCount: number
): CockpitModeHandoff {
  const isModeKnown = isKnownMode(mode);
  const safeMode = isModeKnown ? mode : "focus";
  const nextMode = NEXT_MODE[safeMode];
  const nextLayoutId = defaultLayoutByMode[nextMode];
  const nextLayoutIdLabel: LayoutId = nextLayoutId;
  const nextLayout = getLayoutSpec(nextLayoutIdLabel);
  const tone = isModeKnown ? MODE_TONE[mode] : "stable";

  return {
    currentModeLabel: MODE_LABEL[safeMode],
    nextModeLabel: MODE_LABEL[nextMode],
    currentLayoutLabel: layout.label,
    nextLayoutLabel: nextLayout.label,
    preservedLabel: computePreservedLabel(visibleCount, totalCount),
    detail: MODE_DETAIL[safeMode],
    tone,
    ariaLabel:
      `Arena handoff from ${MODE_LABEL[safeMode]} (${layout.label}) to ${MODE_LABEL[nextMode]} (${nextLayout.label}); ` +
      computePreservedLabel(visibleCount, totalCount)
  };
}
