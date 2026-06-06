import { describe, expect, it } from "vitest";
import { createMilestoneReportRowState } from "./milestoneReportRowState";
import type { MilestoneStatus, MilestoneStatusSummary } from "./milestoneStatus";

const activeSummary: MilestoneStatusSummary = {
  total: 1,
  complete: 0,
  active: 1,
  planned: 0,
  paused: 0,
  averageCompletionPercent: 60,
  nextTarget: "Arena monitor and operating modes",
  nextStep: "Next step from summary",
  nextCompletionPercent: 60
};

const completedSummary: MilestoneStatusSummary = {
  total: 1,
  complete: 1,
  active: 0,
  planned: 0,
  paused: 0,
  averageCompletionPercent: 100,
  nextTarget: "No active milestone",
  nextStep: "No active next step.",
  nextCompletionPercent: 100
};

const cockpitMilestone: MilestoneStatus = {
  target: "Arena monitor and operating modes",
  completion: "In progress",
  plan: "Finalize monitor visibility and focus modes.",
  completionPercent: 60,
  latestNote:
    "Core Arena visibility is in place with active attention flows and control surface wiring.",
  nextStep:
    "Finalize monitoring depth and keep toolbar focus/clear behavior consistent.",
  tone: "active",
  note: "Public note for this milestone."
};

const planningMilestone: MilestoneStatus = {
  target: "Orchestration model",
  completion: "Planned",
  plan: "Define a consistent sequencing model.",
  completionPercent: 30,
  latestNote: "Orchestration patterns are drafted and under active design.",
  nextStep: "Expand execution rules and dependency ordering.",
  tone: "planned",
  note: "Public orchestration planning note."
};

describe("milestone report row state", () => {
  it("marks and labels the active next milestone deterministically", () => {
    const rowState = createMilestoneReportRowState(cockpitMilestone, activeSummary);

    expect(rowState).toEqual({
      isNext: true,
      markerLabel: "Next",
      rowTitle:
        "Arena monitor and operating modes 60% Core Arena visibility is in place with active attention flows and control surface wiring. Finalize monitoring depth and keep toolbar focus/clear behavior consistent.",
      ariaLabel:
        "Next milestone Arena monitor and operating modes (60%) | latest note: Core Arena visibility is in place with active attention flows and control surface wiring. | next step: Finalize monitoring depth and keep toolbar focus/clear behavior consistent."
    });
  });

  it("returns completion marker and generic milestone label for non-next rows", () => {
    const rowState = createMilestoneReportRowState(
      planningMilestone,
      activeSummary
    );

    expect(rowState.isNext).toBe(false);
    expect(rowState.markerLabel).toBe("Planned");
    expect(rowState.rowTitle).toContain(planningMilestone.target);
    expect(rowState.rowTitle).toContain("30%");
    expect(rowState.rowTitle).toContain(planningMilestone.latestNote);
    expect(rowState.rowTitle).toContain(planningMilestone.nextStep);
    expect(rowState.ariaLabel).not.toContain("Next milestone");
    expect(rowState.ariaLabel).toContain("Milestone Orchestration model");
  });

  it("falls back safely when there is no active milestone", () => {
    const rowState = createMilestoneReportRowState(cockpitMilestone, completedSummary);

    expect(rowState.isNext).toBe(false);
    expect(rowState.markerLabel).toBe("In progress");
    expect(rowState.ariaLabel).toContain("Milestone Arena monitor and operating modes");
    expect(rowState.ariaLabel).not.toContain("Next milestone");
  });
});
