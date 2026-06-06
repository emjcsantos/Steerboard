import type { CockpitInteractionReadiness } from "./cockpitInteractionReadiness";
import type { CockpitModeHandoffQa } from "./cockpitModeHandoffQa";
import type { CockpitMonitorDepth } from "./cockpitMonitorDepth";

export type CockpitAcceptancePassTone = "accepted" | "review" | "blocked" | "waiting";

export type CockpitAcceptancePassCheck = {
  label: string;
  value: string;
  tone: "ok" | "review" | "blocked" | "neutral";
};

export type CockpitAcceptancePass = {
  label: string;
  detail: string;
  tone: CockpitAcceptancePassTone;
  checkLabel: string;
  checks: CockpitAcceptancePassCheck[];
  ariaLabel: string;
};

const PASSLABEL: Record<CockpitAcceptancePassTone, string> = {
  accepted: "Arena acceptance passed",
  review: "Arena acceptance review",
  blocked: "Arena acceptance blocked",
  waiting: "Arena acceptance waiting"
};

const PASSDETAIL: Record<CockpitAcceptancePassTone, string> = {
  accepted:
    "Desktop, narrow-pane, monitor, mode, and interaction gates are ready to close.",
  review:
    "Acceptance is mostly ready with at least one review gate to inspect.",
  blocked:
    "Resolve blocked monitor, mode, or interaction gates before treating the current Arena view as accepted.",
  waiting:
    "Acceptance needs more monitor, mode, or interaction evidence before accepting the current Arena view."
};

function mapMonitorTone(
  tone: CockpitMonitorDepth["tone"]
): CockpitAcceptancePassCheck["tone"] {
  switch (tone) {
    case "blocked":
      return "blocked";
    case "empty":
    case "shallow":
      return "neutral";
    case "steady":
    case "deep":
      return "ok";
    default:
      return "neutral";
  }
}

function mapModeQaTone(
  tone: CockpitModeHandoffQa["tone"]
): CockpitAcceptancePassCheck["tone"] {
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

function mapInteractionTone(
  tone: CockpitInteractionReadiness["tone"]
): CockpitAcceptancePassCheck["tone"] {
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

function determineAcceptanceTone(priorChecks: CockpitAcceptancePassCheck[]): CockpitAcceptancePassCheck["tone"] {
  const hasBlocked = priorChecks.some((check) => check.tone === "blocked");
  const hasReview = priorChecks.some((check) => check.tone === "review");

  if (hasBlocked) {
    return "blocked";
  }

  if (hasReview) {
    return "review";
  }

  return "ok";
}

function determineOverallTone(checks: CockpitAcceptancePassCheck[]): CockpitAcceptancePassTone {
  if (checks.some((check) => check.tone === "blocked")) {
    return "blocked";
  }

  if (checks.some((check) => check.tone === "neutral")) {
    return "waiting";
  }

  if (checks.some((check) => check.tone === "review")) {
    return "review";
  }

  return "accepted";
}

export function createCockpitAcceptancePass(params: {
  interactionReadiness: CockpitInteractionReadiness;
  modeHandoffQa: CockpitModeHandoffQa;
  monitorDepth: CockpitMonitorDepth;
}): CockpitAcceptancePass {
  const checks: CockpitAcceptancePassCheck[] = [
    {
      label: "Monitor",
      value: params.monitorDepth.scoreValue,
      tone: mapMonitorTone(params.monitorDepth.tone)
    },
    {
      label: "Mode QA",
      value: params.modeHandoffQa.checkLabel,
      tone: mapModeQaTone(params.modeHandoffQa.tone)
    },
    {
      label: "Interaction",
      value: params.interactionReadiness.checkLabel,
      tone: mapInteractionTone(params.interactionReadiness.tone)
    }
  ];
  const acceptanceTone = determineAcceptanceTone(checks);

  const allChecks: CockpitAcceptancePassCheck[] = [
    ...checks,
    {
      label: "Acceptance",
      value: "Desktop + narrow",
      tone: acceptanceTone
    }
  ];

  const okCount = allChecks.filter((check) => check.tone === "ok").length;
  const checkLabel = `${okCount}/4 gates`;
  const tone = determineOverallTone(allChecks);

  return {
    label: PASSLABEL[tone],
    detail: PASSDETAIL[tone],
    tone,
    checkLabel,
    checks: allChecks,
    ariaLabel:
      `${PASSLABEL[tone]}: ${checkLabel}; ` +
      `Monitor ${allChecks[0].value}; ` +
      `Mode QA ${allChecks[1].value}; ` +
      `Interaction ${allChecks[2].value}; ` +
      `Acceptance ${allChecks[3].value}`
  };
}
