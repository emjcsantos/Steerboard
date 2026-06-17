import { describe, expect, it } from "vitest";
import {
  buildRemainingGoalPriorityTraces,
  findRemainingGoalPlanIssues,
  remainingGoalPlan,
  remainingProjectManagementPhaseIds,
  summarizeRemainingGoalPlan
} from "./remainingGoalPlan";

describe("remaining goal plan", () => {
  it("covers every remaining phase with valid target and PM task links", () => {
    expect(findRemainingGoalPlanIssues()).toEqual([]);

    const coveredPhaseIds = new Set(remainingGoalPlan.flatMap((goal) => goal.phaseIds));

    expect([...coveredPhaseIds].sort()).toEqual([...remainingProjectManagementPhaseIds].sort());
    expect(remainingGoalPlan.every((goal) => goal.pmTaskIds.length > 0)).toBe(true);
  });

  it("summarizes the current remaining goal queue", () => {
    expect(summarizeRemainingGoalPlan()).toEqual({
      total: 10,
      blocked: 1,
      active: 1,
      next: 7,
      planned: 0,
      paused: 1,
      averageCompletionPercent: 55,
      currentTarget: "Unblock Phase 1/2/6 publishing",
      currentNextAction:
        "Keep the branch local, preserve the proof commit, and push only after the remote is recreated and the owner says to push.",
      coveredPhaseCount: 11,
      remainingPhaseCount: 11,
      priorityGoalTraceCount: 8,
      priorityGoalTraces: buildRemainingGoalPriorityTraces()
    });
  });

  it("keeps critical and high-priority goal traces at the top with PM task links", () => {
    const traces = buildRemainingGoalPriorityTraces();

    expect(traces.map((trace) => trace.goalId).slice(0, 2)).toEqual([
      "goal-phase-1-2-6-publish",
      "goal-phase-3-proof-clearance"
    ]);
    expect(traces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          goalId: "goal-phase-4-provider-surfaces",
          priority: "high",
          phaseIds: ["phase-04-provider-surfaces"],
          pmTaskIds: expect.arrayContaining(["phase-04-child-surface-depth"])
        }),
        expect.objectContaining({
          goalId: "goal-phase-5-migration-hardening",
          priority: "high",
          pmTaskIds: expect.arrayContaining(["phase-05-child-review-depth"])
        }),
        expect.objectContaining({
          goalId: "goal-phase-8-permission-audit",
          priority: "high",
          pmTaskIds: expect.arrayContaining(["phase-08-child-audit-persistence"])
        }),
        expect.objectContaining({
          goalId: "goal-phase-11-owner-command-center",
          priority: "high",
          pmTaskIds: expect.arrayContaining(["phase-11-child-evidence-records"])
        })
      ])
    );
    expect(traces.every((trace) => trace.phaseIds.length > 0 && trace.pmTaskIds.length > 0)).toBe(true);
  });

  it("keeps the owner hold and Phase 3 proof target explicit", () => {
    const publishGoal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-1-2-6-publish");
    const phase3Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-3-proof-clearance");

    expect(publishGoal).toMatchObject({
      status: "blocked",
      priority: "critical",
      current: true
    });
    expect(publishGoal?.nextAction.toLowerCase()).toContain("owner says to push");
    expect(phase3Goal?.target).toBe("Phase 3 desktop proof clearance");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-exit-gate");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-blocker-priority");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-traceability");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-handoff-gate");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-slash-ready");
  });

  it("keeps remaining goal text public-safe", () => {
    const combinedText = remainingGoalPlan
      .flatMap((goal) => [
        goal.target,
        goal.goal,
        goal.nextAction,
        goal.phases.join(" "),
        goal.pmTaskIds.join(" ")
      ])
      .join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
