import type { CockpitModeHandoff } from "./cockpitModeHandoff";
import type { CockpitLayoutCapacity } from "./cockpitLayoutCapacity";
import type { CockpitFocusedPanelStatus } from "./cockpitFocusedPanelStatus";
import type { CockpitPanelOverflow } from "./cockpitPanelOverflow";

export type CockpitModeHandoffQaTone = "ready" | "review" | "blocked" | "idle";

export type CockpitModeHandoffQaCheck = {
  label: string;
  value: string;
  tone: "ok" | "review" | "blocked" | "neutral";
};

export type CockpitModeHandoffQa = {
  label: string;
  detail: string;
  tone: CockpitModeHandoffQaTone;
  checkLabel: string;
  checks: CockpitModeHandoffQaCheck[];
  ariaLabel: string;
};

const QALABEL = {
  ready: "Handoff QA ready",
  review: "Handoff QA review",
  blocked: "Handoff QA needs review",
  idle: "Handoff QA idle"
};

const QADETAIL = {
  ready:
    "Mode handoff, layout, and focus controls are stable.",
  review:
    "Mode handoff is available with queued or attention-state panels to review.",
  blocked:
    "Resolve layout, hidden-panel, or focused-panel blockers before mode handoff.",
  idle: "No active Arena panels need handoff QA yet."
};

function getQaTone(
  handoff: CockpitModeHandoff,
  capacity: CockpitLayoutCapacity,
  focusedStatus: CockpitFocusedPanelStatus,
  overflow: CockpitPanelOverflow
): CockpitModeHandoffQaTone {
  if (
    capacity.tone === "overflow" ||
    overflow.tone === "blocked" ||
    focusedStatus.tone === "critical"
  ) {
    return "blocked";
  }

  if (
    handoff.preservedLabel.startsWith("0/0") ||
    (capacity.tone === "clear" && focusedStatus.hasFocus === false)
  ) {
    return "idle";
  }

  if (overflow.tone === "queued" || focusedStatus.tone === "attention") {
    return "review";
  }

  return "ready";
}

function mapLayoutMetricTone(
  tone: CockpitLayoutCapacity["tone"]
): CockpitModeHandoffQaCheck["tone"] {
  switch (tone) {
    case "overflow":
      return "blocked";
    case "full":
    case "active":
      return "ok";
    case "clear":
      return "neutral";
    default:
      return "neutral";
  }
}

function mapFocusMetricTone(
  focusedStatus: CockpitFocusedPanelStatus
): CockpitModeHandoffQaCheck["tone"] {
  if (!focusedStatus.hasFocus) {
    return "neutral";
  }

  const { tone } = focusedStatus;
  switch (tone) {
    case "critical":
      return "blocked";
    case "attention":
      return "review";
    case "complete":
    case "active":
    case "idle":
      return "ok";
    case "neutral":
      return "neutral";
  }
}

function mapOverflowMetricTone(
  tone: CockpitPanelOverflow["tone"]
): CockpitModeHandoffQaCheck["tone"] {
  switch (tone) {
    case "blocked":
      return "blocked";
    case "queued":
      return "review";
    case "clear":
      return "ok";
  }
}

export function createCockpitModeHandoffQa(
  handoff: CockpitModeHandoff,
  capacity: CockpitLayoutCapacity,
  focusedStatus: CockpitFocusedPanelStatus,
  overflow: CockpitPanelOverflow
): CockpitModeHandoffQa {
  const tone = getQaTone(handoff, capacity, focusedStatus, overflow);
  const checks: CockpitModeHandoffQaCheck[] = [
    {
      label: "Layout",
      value: capacity.usageLabel,
      tone: mapLayoutMetricTone(capacity.tone)
    },
    {
      label: "Focus",
      value: focusedStatus.hasFocus ? focusedStatus.label : "No focus",
      tone: mapFocusMetricTone(focusedStatus)
    },
    {
      label: "Overflow",
      value: overflow.hiddenLabel,
      tone: mapOverflowMetricTone(overflow.tone)
    }
  ];
  const readyCount = checks.filter((check) => check.tone === "ok").length;
  const checkLabel = `${readyCount}/${checks.length} checks`;

  return {
    label: QALABEL[tone],
    detail: QADETAIL[tone],
    tone,
    checkLabel,
    checks,
    ariaLabel:
      `${QALABEL[tone]}: ${handoff.currentModeLabel} to ${handoff.nextModeLabel}; ` +
      `${checkLabel}; ` +
      `Layout ${checks[0].value}; Focus ${checks[1].value}; Overflow ${checks[2].value}`
  };
}
