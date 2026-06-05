import type {
  MilestoneStatus,
  MilestoneStatusSummary
} from "./milestoneStatus";

export type MilestoneReportNextDetail = {
  hasNext: boolean;
  target: string;
  plan: string;
  completionLabel: string;
  latestNote: string;
  nextStep: string;
  ariaLabel: string;
  title: string;
};

const NO_ACTIVE_MILESTONE_TARGET = "No active milestone";
const NO_ACTIVE_MILESTONE_COMPLETION_LABEL = "100%";
const FALLBACK_PLAN =
  "No active milestone is currently identified for reporting.";
const FALLBACK_LATEST_NOTE = "No current milestone context is available.";
const FALLBACK_NEXT_STEP = "Choose the next milestone to continue work.";

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function createMilestoneReportNextDetail(
  milestones: readonly MilestoneStatus[],
  summary: MilestoneStatusSummary
): MilestoneReportNextDetail {
  const hasNextTarget =
    typeof summary.nextTarget === "string" &&
    summary.nextTarget.trim().length > 0 &&
    summary.nextTarget !== NO_ACTIVE_MILESTONE_TARGET;

  const activeTarget = hasNextTarget ? summary.nextTarget : undefined;
  const activeMilestone = activeTarget
    ? milestones.find((milestone) => milestone.target === activeTarget)
    : undefined;

  if (!activeMilestone) {
    const fallbackLabel = NO_ACTIVE_MILESTONE_COMPLETION_LABEL;
    const title = `${NO_ACTIVE_MILESTONE_TARGET} ${fallbackLabel} ${FALLBACK_LATEST_NOTE} ${FALLBACK_NEXT_STEP}`.trim();
    const ariaLabel = `No next milestone: ${NO_ACTIVE_MILESTONE_TARGET} (${fallbackLabel}). ${FALLBACK_LATEST_NOTE} Next step: ${FALLBACK_NEXT_STEP}`.trim();

    return {
      hasNext: false,
      target: NO_ACTIVE_MILESTONE_TARGET,
      plan: FALLBACK_PLAN,
      completionLabel: fallbackLabel,
      latestNote: FALLBACK_LATEST_NOTE,
      nextStep: FALLBACK_NEXT_STEP,
      ariaLabel: normalizeText(ariaLabel),
      title: normalizeText(title)
    };
  }

  const plan = normalizeText(activeMilestone.plan);
  const latestNote = normalizeText(activeMilestone.latestNote);
  const nextStep = normalizeText(activeMilestone.nextStep);
  const completionLabel = `${activeMilestone.completionPercent}%`;
  const title = normalizeText(
    `${activeMilestone.target} ${completionLabel} ${latestNote} ${nextStep}`
  );
  const ariaLabel = normalizeText(
    `Next milestone ${activeMilestone.target} (${completionLabel}) | latest note: ${latestNote} | next step: ${nextStep}`
  );

  return {
    hasNext: true,
    target: activeMilestone.target,
    plan,
    completionLabel,
    latestNote,
    nextStep,
    ariaLabel,
    title
  };
}
