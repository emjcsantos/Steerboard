import type { CockpitFocusedPanelStatus } from "./cockpitFocusedPanelStatus";
import type { CockpitLayoutCapacity } from "./cockpitLayoutCapacity";
import type { CockpitModeHandoffQa } from "./cockpitModeHandoffQa";
import type { CockpitPanelFocusTarget } from "./cockpitPanelFocus";
import type { CockpitToolbarFocusAction } from "./cockpitToolbarFocusAction";

export type CockpitInteractionReadinessTone =
  | "ready"
  | "review"
  | "blocked"
  | "idle";

export type CockpitInteractionReadinessCheck = {
  label: string;
  value: string;
  tone: "ok" | "review" | "blocked" | "neutral";
};

export interface CockpitInteractionReadiness {
  label: string;
  detail: string;
  tone: CockpitInteractionReadinessTone;
  checkLabel: string;
  checks: CockpitInteractionReadinessCheck[];
  ariaLabel: string;
}

type InteractionReadinessSummaryTone = CockpitInteractionReadinessTone;

const QALABEL: Record<CockpitInteractionReadinessTone, string> = {
  ready: "Interaction QA ready",
  review: "Interaction QA review",
  blocked: "Interaction QA blocked",
  idle: "Interaction QA idle"
};

const QADETAIL: Record<CockpitInteractionReadinessTone, string> = {
  ready:
    "Mode, layout, focus, and clear controls are ready for final cockpit QA.",
  review:
    "Cockpit controls are usable with at least one interaction state to review.",
  blocked:
    "Resolve blocked mode, layout, focus, or clear control state before final QA.",
  idle: "No active cockpit interaction state needs QA yet."
};

function mapModeTone(
  tone: CockpitModeHandoffQa["tone"]
): CockpitInteractionReadinessCheck["tone"] {
  switch (tone) {
    case "blocked":
      return "blocked";
    case "review":
      return "review";
    case "idle":
      return "neutral";
    default:
      return "ok";
  }
}

function mapLayoutTone(
  tone: CockpitLayoutCapacity["tone"]
): CockpitInteractionReadinessCheck["tone"] {
  switch (tone) {
    case "overflow":
      return "blocked";
    case "clear":
      return "neutral";
    default:
      return "ok";
  }
}

function mapFocusTone(
  focusTarget: CockpitPanelFocusTarget,
  focusedStatus: CockpitFocusedPanelStatus
): CockpitInteractionReadinessCheck["tone"] {
  if (focusTarget.isFocused || focusTarget.canFocus) {
    return "ok";
  }

  if (focusedStatus.hasFocus && !focusTarget.isFocused) {
    return "review";
  }

  return "neutral";
}

function mapClearTone(
  toolbarFocusAction: CockpitToolbarFocusAction,
  focusedStatus: CockpitFocusedPanelStatus
): CockpitInteractionReadinessCheck["tone"] {
  if (!toolbarFocusAction.clearDisabled && focusedStatus.hasFocus) {
    return "ok";
  }

  if (toolbarFocusAction.clearDisabled && !focusedStatus.hasFocus) {
    return "neutral";
  }

  return "review";
}

function toSummaryTone(checks: CockpitInteractionReadinessCheck[]): InteractionReadinessSummaryTone {
  if (checks.some((check) => check.tone === "blocked")) {
    return "blocked";
  }

  if (checks.every((check) => check.tone === "neutral")) {
    return "idle";
  }

  if (checks.some((check) => check.tone === "review")) {
    return "review";
  }

  return "ready";
}

export function createCockpitInteractionReadiness(params: {
  modeHandoffQa: CockpitModeHandoffQa;
  layoutCapacity: CockpitLayoutCapacity;
  focusTarget: CockpitPanelFocusTarget;
  focusedStatus: CockpitFocusedPanelStatus;
  toolbarFocusAction: CockpitToolbarFocusAction;
}): CockpitInteractionReadiness {
  const checks: CockpitInteractionReadinessCheck[] = [
    {
      label: "Mode",
      value: params.modeHandoffQa.checkLabel,
      tone: mapModeTone(params.modeHandoffQa.tone)
    },
    {
      label: "Layout",
      value: params.layoutCapacity.usageLabel,
      tone: mapLayoutTone(params.layoutCapacity.tone)
    },
    {
      label: "Focus",
      value: params.focusTarget.isFocused
        ? "Focused"
        : params.focusTarget.canFocus
          ? "Ready"
          : "Unavailable",
      tone: mapFocusTone(params.focusTarget, params.focusedStatus)
    },
    {
      label: "Clear",
      value: params.toolbarFocusAction.clearDisabled
        ? "Disabled"
        : "Ready",
      tone: mapClearTone(params.toolbarFocusAction, params.focusedStatus)
    }
  ];

  const readyCount = checks.filter((check) => check.tone === "ok").length;
  const checkLabel = `${readyCount}/4 controls`;
  const tone = toSummaryTone(checks);

  return {
    label: QALABEL[tone],
    detail: QADETAIL[tone],
    tone,
    checkLabel,
    checks,
    ariaLabel:
      `${QALABEL[tone]}: ${checkLabel}; ` +
      `Mode ${checks[0].value}; Layout ${checks[1].value}; ` +
      `Focus ${checks[2].value}; Clear ${checks[3].value}`
  };
}
