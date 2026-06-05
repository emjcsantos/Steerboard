import type {
  MilestoneStatus,
  MilestoneStatusSummary
} from "./milestoneStatus";

export type MilestoneReportRowState = {
  isNext: boolean;
  markerLabel: string;
  rowTitle: string;
  ariaLabel: string;
};

export function createMilestoneReportRowState(
  milestone: MilestoneStatus,
  summary: MilestoneStatusSummary
): MilestoneReportRowState {
  const isNext =
    milestone.target === summary.nextTarget &&
    summary.nextTarget !== "No active milestone";

  const percentText = `${milestone.completionPercent}%`;
  const latestNote = milestone.latestNote.trim().replace(/\s+/g, " ");
  const nextStep = milestone.nextStep.trim().replace(/\s+/g, " ");

  const rowTitle = `${milestone.target} ${percentText} ${latestNote} ${nextStep}`.trim();
  const ariaLabel = `${isNext ? "Next milestone" : "Milestone"} ${milestone.target} (${percentText}) | latest note: ${latestNote} | next step: ${nextStep}`;

  return {
    isNext,
    markerLabel: isNext ? "Next" : milestone.completion,
    rowTitle,
    ariaLabel
  };
}
