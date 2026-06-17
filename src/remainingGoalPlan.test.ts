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
      currentTarget: "Phase 3 desktop proof clearance",
      currentNextAction:
        "Use the Phase 3 command plan, blocker-priority queue, traceability rows, and handoff gate to clear the exact top blocker, keep the active goal linked to every required PM child, run the held desktop smoke command only when it matches the blocker, record owner handoff only after exit-ready, and keep Phase 4 held behind the provider boundary.",
      ownerHoldTarget: "Unblock Phase 1/2/6 publishing",
      ownerHoldNextAction:
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
      "goal-phase-3-proof-clearance",
      "goal-phase-1-2-6-publish"
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
          pmTaskIds: expect.arrayContaining(["phase-05-child-review-depth", "phase-05-child-traceability"])
        }),
        expect.objectContaining({
          goalId: "goal-phase-8-permission-audit",
          priority: "high",
          pmTaskIds: expect.arrayContaining(["phase-08-child-audit-persistence", "phase-08-child-traceability"])
        }),
        expect.objectContaining({
          goalId: "goal-phase-9-runner",
          priority: "high",
          pmTaskIds: expect.arrayContaining(["phase-09-child-traceability"])
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
      priority: "critical"
    });
    expect(publishGoal?.current).toBeUndefined();
    expect(publishGoal?.nextAction.toLowerCase()).toContain("owner says to push");
    expect(phase3Goal?.target).toBe("Phase 3 desktop proof clearance");
    expect(phase3Goal?.current).toBe(true);
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-exit-gate");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-blocker-priority");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-traceability");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-handoff-gate");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-slash-ready");
  });

  it("separates the blocked owner hold from the active implementation target", () => {
    const summary = summarizeRemainingGoalPlan();

    expect(summary.currentTarget).toBe("Phase 3 desktop proof clearance");
    expect(summary.currentNextAction).toContain("Phase 3 command plan");
    expect(summary.ownerHoldTarget).toBe("Unblock Phase 1/2/6 publishing");
    expect(summary.ownerHoldNextAction).toContain("owner says to push");
    expect(summary.priorityGoalTraces[0]).toMatchObject({
      goalId: "goal-phase-3-proof-clearance",
      current: true
    });
    expect(summary.priorityGoalTraces[1]).toMatchObject({
      goalId: "goal-phase-1-2-6-publish",
      status: "blocked",
      current: false
    });
  });

  it("keeps the Phase 9 runner approval target linked to traceability and approval depth", () => {
    const phase9Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-9-runner");

    expect(phase9Goal).toMatchObject({
      target: "Desktop-backed runner approval",
      priority: "high",
      status: "next"
    });
    expect(phase9Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-09-child-reversible-action",
        "phase-09-child-runner-observability",
        "phase-09-child-traceability",
        "phase-09-child-approval-record",
        "phase-09-child-approval-depth"
      ])
    );
    expect(phase9Goal?.nextAction).toContain("terminal-readonly-probe");
  });

  it("keeps the Phase 5 migration hardening target linked to traceability and review depth", () => {
    const phase5Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-5-migration-hardening");

    expect(phase5Goal).toMatchObject({
      target: "Migration Center hardening",
      priority: "high",
      status: "next"
    });
    expect(phase5Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-05-child-profile-drafts",
        "phase-05-child-preview-metadata",
        "phase-05-child-audit-summary",
        "phase-05-child-review-depth",
        "phase-05-child-traceability"
      ])
    );
    expect(phase5Goal?.nextAction).toContain("traceability rows");
  });

  it("keeps the Phase 8 permission audit target linked to traceability and audit persistence", () => {
    const phase8Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-8-permission-audit");

    expect(phase8Goal).toMatchObject({
      target: "Permission and audit depth",
      priority: "high",
      status: "next"
    });
    expect(phase8Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-08-child-permission-labels",
        "phase-08-child-risk-blockers",
        "phase-08-child-risk-exceptions",
        "phase-08-child-traceability",
        "phase-08-child-audit-persistence"
      ])
    );
    expect(phase8Goal?.nextAction).toContain("risk traceability rows");
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
