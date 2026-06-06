import { describe, expect, it } from "vitest";
import { createMilestoneReportNextDetail } from "./milestoneReportNextDetail";
import type { MilestoneStatus, MilestoneStatusSummary } from "./milestoneStatus";

const milestones: MilestoneStatus[] = [
  {
    target: "Arena monitor and operating modes",
    completion: "In progress",
    plan: "  Build the next operating controls and monitor states. ",
    completionPercent: 60,
    latestNote: "  Control surfaces are actively being validated. ",
    nextStep:
      "  Finalize the focus behavior and keep toolbar actions consistent. ",
    tone: "active"
  },
  {
    target: "Optional project management lane",
    completion: "Paused",
    plan: "Define optional workflows and keep them parked until needed.",
    completionPercent: 0,
    latestNote: "Lane is paused and intentionally deferred.",
    nextStep: "Keep this lane paused until priorities change.",
    tone: "paused"
  }
];

const noActiveSummary: MilestoneStatusSummary = {
  total: 2,
  complete: 0,
  active: 0,
  planned: 1,
  paused: 1,
  averageCompletionPercent: 30,
  nextTarget: "No active milestone",
  nextStep: "No active next step.",
  nextCompletionPercent: 100
};

describe("milestone report next detail", () => {
  it("builds next detail from the summary target", () => {
    const activeSummary: MilestoneStatusSummary = {
      ...noActiveSummary,
      active: 1,
      nextTarget: "Arena monitor and operating modes",
      nextStep: "Summary next step should be ignored for this helper.",
      nextCompletionPercent: 60
    };

    const detail = createMilestoneReportNextDetail(milestones, activeSummary);

    expect(detail).toEqual({
      hasNext: true,
      target: "Arena monitor and operating modes",
      plan: "Build the next operating controls and monitor states.",
      completionLabel: "60%",
      latestNote: "Control surfaces are actively being validated.",
      nextStep:
        "Finalize the focus behavior and keep toolbar actions consistent.",
      title:
        "Arena monitor and operating modes 60% Control surfaces are actively being validated. Finalize the focus behavior and keep toolbar actions consistent.",
      ariaLabel:
        "Next milestone Arena monitor and operating modes (60%) | latest note: Control surfaces are actively being validated. | next step: Finalize the focus behavior and keep toolbar actions consistent."
    });
  });

  it("falls back safely when there is no active milestone", () => {
    const detail = createMilestoneReportNextDetail(milestones, noActiveSummary);

    expect(detail.hasNext).toBe(false);
    expect(detail.target).toBe("No active milestone");
    expect(detail.completionLabel).toBe("100%");
    expect(detail.plan).toBe(
      "No active milestone is currently identified for reporting."
    );
    expect(detail.latestNote).toBe("No current milestone context is available.");
    expect(detail.nextStep).toBe("Choose the next milestone to continue work.");
    expect(detail.ariaLabel).toContain("No next milestone");
    expect(detail.title).toContain("No active milestone");
  });

  it("falls back safely when summary target is missing", () => {
    const missingTargetSummary = {
      ...noActiveSummary,
      // Intentionally omit/blank out the target to test resilient fallback behavior.
      nextTarget: "",
      nextStep: ""
    } as MilestoneStatusSummary;

    const detail = createMilestoneReportNextDetail(
      milestones,
      missingTargetSummary
    );

    expect(detail).toEqual({
      hasNext: false,
      target: "No active milestone",
      plan: "No active milestone is currently identified for reporting.",
      completionLabel: "100%",
      latestNote: "No current milestone context is available.",
      nextStep: "Choose the next milestone to continue work.",
      ariaLabel:
        "No next milestone: No active milestone (100%). No current milestone context is available. Next step: Choose the next milestone to continue work.",
      title:
        "No active milestone 100% No current milestone context is available. Choose the next milestone to continue work."
    });
  });
});
