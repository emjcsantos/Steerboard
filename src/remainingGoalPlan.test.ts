import { describe, expect, it } from "vitest";
import { createDefaultProjectManagementPhasePlan } from "./projectManagementPhasePlan";
import {
  buildRemainingGoalPriorityTraces,
  buildRemainingGoalPriorityQueue,
  findCurrentActiveRemainingGoals,
  findRemainingGoalPlanIssues,
  isCurrentActiveRemainingGoal,
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
      next: 8,
      planned: 0,
      paused: 0,
      averageCompletionPercent: 68,
      currentTarget: "Phase 3 desktop proof clearance",
      currentNextAction:
        "Use the Phase 3 command plan, visible CLI validation record actions and provenance, PM-link and evidence-key counted exit gate, slash/session-first blocker-priority queue, row-specific slash/session/smoke exit actions, traceability rows, storage-attested current-panel smoke proof rows, and visible handoff record-gate reason with compact fingerprint-plus-clearance-snapshot-plus-age matched handoff gate to clear the exact top blocker, keep the current active goal linked to every required PM child, run the held desktop smoke command only when it matches the blocker, record fresh owner handoff only after current evidence is exit-ready, current active goal/PM traceability is trusted, and CLI validation is fresh and matching, and keep Phase 4 held behind the provider boundary.",
      ownerHoldTarget: "Unblock Phase 1/2/6 publishing",
      ownerHoldNextAction:
        "Use the Phase 1/2/6 priority evidence, publish-hold traceability, and blocker-priority queue to keep the branch local, preserve proof commits, rank the owner/remote publish hold above proof review, and push only after the remote is recreated and the owner says to push.",
      coveredPhaseCount: 11,
      remainingPhaseCount: 11,
      priorityGoalTraceCount: 9,
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
          pmTaskIds: expect.arrayContaining([
            "phase-04-child-surface-depth",
            "phase-04-child-approval-record",
            "phase-04-child-audit-record",
            "phase-04-child-rollback-record",
            "phase-04-child-permission-record",
            "phase-04-child-traceability",
            "phase-04-child-blocker-priority"
          ])
        }),
        expect.objectContaining({
          goalId: "goal-phase-5-migration-hardening",
          priority: "high",
          pmTaskIds: expect.arrayContaining([
            "phase-05-child-review-depth",
            "phase-05-child-traceability",
            "phase-05-child-blocker-priority"
          ])
        }),
        expect.objectContaining({
          goalId: "goal-phase-7-dispatch-loop",
          priority: "high",
          pmTaskIds: expect.arrayContaining([
            "phase-07-child-review-depth",
            "phase-07-child-integration-ownership-depth",
            "phase-07-child-traceability",
            "phase-07-child-blocker-priority"
          ])
        }),
        expect.objectContaining({
          goalId: "goal-phase-8-permission-audit",
          priority: "high",
          pmTaskIds: expect.arrayContaining([
            "phase-08-child-audit-persistence",
            "phase-08-child-traceability",
            "phase-08-child-blocker-priority"
          ])
        }),
        expect.objectContaining({
          goalId: "goal-phase-9-runner",
          priority: "high",
          pmTaskIds: expect.arrayContaining([
            "phase-09-child-traceability",
            "phase-09-child-blocker-priority"
          ])
        }),
        expect.objectContaining({
          goalId: "goal-phase-11-owner-command-center",
          priority: "high",
          pmTaskIds: expect.arrayContaining([
            "phase-11-child-evidence-records",
            "phase-11-child-traceability",
            "phase-11-child-blocker-priority"
          ])
        }),
        expect.objectContaining({
          goalId: "goal-phase-11-release-readiness",
          priority: "high",
          pmTaskIds: expect.arrayContaining([
            "phase-11-child-package-validation",
            "phase-11-child-traceability",
            "phase-11-child-blocker-priority"
          ])
        })
      ])
    );
    expect(traces.every((trace) => trace.phaseIds.length > 0 && trace.pmTaskIds.length > 0)).toBe(true);
  });

  it("keeps the visible remaining goal queue priority-first", () => {
    const queue = buildRemainingGoalPriorityQueue();

    expect(queue.map((goal) => goal.id).slice(0, 4)).toEqual([
      "goal-phase-3-proof-clearance",
      "goal-phase-1-2-6-publish",
      "goal-phase-11-release-readiness",
      "goal-phase-11-owner-command-center"
    ]);
    expect(queue[0]).toMatchObject({
      current: true,
      priority: "critical",
      status: "active"
    });
    expect(queue[1]).toMatchObject({
      priority: "critical",
      status: "blocked"
    });
  });

  it("keeps stale current next goals below the critical owner hold", () => {
    const staleCurrentNextGoals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-4-provider-surfaces"
        ? { ...goal, current: true }
        : goal
    );
    const queue = buildRemainingGoalPriorityQueue(staleCurrentNextGoals);

    expect(queue.map((goal) => goal.id).slice(0, 3)).toEqual([
      "goal-phase-3-proof-clearance",
      "goal-phase-1-2-6-publish",
      "goal-phase-11-release-readiness"
    ]);
    expect(isCurrentActiveRemainingGoal(queue[0])).toBe(true);
    expect(queue[1]).toMatchObject({
      priority: "critical",
      status: "blocked"
    });
  });

  it("reports only current active goals as current in priority traces", () => {
    const staleCurrentNextGoals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-4-provider-surfaces"
        ? { ...goal, current: true }
        : goal
    );
    const traces = buildRemainingGoalPriorityTraces(staleCurrentNextGoals);

    expect(traces.find((trace) => trace.goalId === "goal-phase-3-proof-clearance")).toMatchObject({
      current: true,
      status: "active"
    });
    expect(traces.find((trace) => trace.goalId === "goal-phase-4-provider-surfaces")).toMatchObject({
      current: false,
      status: "next"
    });
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
    expect(publishGoal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-01-child-live-start",
        "phase-01-child-stream-evidence",
        "phase-01-child-reload-proof",
        "phase-02-child-two-panel-smoke",
        "phase-02-child-no-cross-talk",
        "phase-02-child-restore-panels",
        "phase-06-child-current-phase-map",
        "phase-06-child-saved-state-upgrade",
        "phase-06-child-run-context",
        "phase-06-child-publish-hold-traceability",
        "phase-06-child-publish-hold-blocker-priority"
      ])
    );
    expect(publishGoal?.nextAction).toContain("publish-hold traceability");
    expect(publishGoal?.nextAction).toContain("blocker-priority queue");
    expect(phase3Goal?.target).toBe("Phase 3 desktop proof clearance");
    expect(phase3Goal?.current).toBe(true);
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-exit-gate");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-blocker-priority");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-traceability");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-handoff-gate");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-slash-ready");
    expect(phase3Goal?.nextAction).toContain("clearance-snapshot");
    expect(phase3Goal?.nextAction).toContain("visible CLI validation record actions and provenance");
    expect(phase3Goal?.nextAction).toContain("PM-link and evidence-key counted exit gate");
    expect(phase3Goal?.nextAction).toContain("row-specific slash/session/smoke exit actions");
    expect(phase3Goal?.nextAction).toContain("storage-attested current-panel smoke proof rows");
    expect(phase3Goal?.nextAction).toContain("visible handoff record-gate reason");
    expect(phase3Goal?.nextAction).toContain("current active goal");
    expect(phase3Goal?.nextAction).toContain("current active goal/PM traceability is trusted");
  });

  it("keeps the Phase 3 PM traceability child aligned to the current active goal boundary", () => {
    const traceabilityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-03-child-traceability"
    );

    expect(traceabilityChild).toMatchObject({
      title: "Clearance Traceability",
      sourceDocument: "Phase 3 clearance traceability"
    });
    expect(traceabilityChild?.description).toContain("current active Phase 3 goal");
    expect(traceabilityChild?.description).toContain("required PM rows");
    expect(traceabilityChild?.description).toContain("handoff-review details");
  });

  it("keeps active Phase 3 PM rows at or above the release-trace trust threshold", () => {
    const phase3Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-3-proof-clearance");
    const phase3Tasks = createDefaultProjectManagementPhasePlan().filter((task) =>
      phase3Goal?.pmTaskIds.includes(task.id)
    );
    const taskCompletionById = new Map(
      phase3Tasks.map((task) => [task.id, task.completionPercent])
    );
    const incompleteTaskIds = phase3Tasks
      .filter((task) => task.completionPercent < 85)
      .map((task) => task.id);

    expect(phase3Goal).toMatchObject({
      current: true,
      status: "active",
      completionPercent: 98
    });
    expect(incompleteTaskIds).toEqual([]);
    expect(taskCompletionById.get("phase-03-child-smoke-rows")).toBe(90);
    expect(taskCompletionById.get("phase-03-child-exit-gate")).toBe(94);
    expect(taskCompletionById.get("phase-03-child-command-plan")).toBe(90);
    expect(taskCompletionById.get("phase-03-child-blocker-priority")).toBe(90);
    expect(taskCompletionById.get("phase-03-child-handoff-gate")).toBe(90);
    expect(taskCompletionById.get("phase-03-parent-slash-controls")).toBe(90);
    expect(taskCompletionById.get("phase-03-child-slash-ready")).toBe(90);
    expect(taskCompletionById.get("phase-03-child-control-ready")).toBe(90);
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

  it("identifies only the current active remaining goal as implementation-trustable", () => {
    const phase3Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-3-proof-clearance");
    const phase4Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-4-provider-surfaces");

    expect(findCurrentActiveRemainingGoals()).toEqual([phase3Goal]);
    expect(isCurrentActiveRemainingGoal(phase3Goal)).toBe(true);
    expect(isCurrentActiveRemainingGoal(phase4Goal)).toBe(false);
    expect(isCurrentActiveRemainingGoal({ ...phase3Goal!, current: false })).toBe(false);
    expect(isCurrentActiveRemainingGoal({ ...phase4Goal!, current: true })).toBe(false);
    expect(isCurrentActiveRemainingGoal({ ...phase4Goal!, status: "active" })).toBe(false);
    expect(isCurrentActiveRemainingGoal({ ...phase4Goal!, status: "active", current: true })).toBe(true);
    expect(isCurrentActiveRemainingGoal(undefined)).toBe(false);
  });

  it("reports duplicate current active goals before summaries and traceability can disagree", () => {
    const duplicateCurrentGoals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-4-provider-surfaces"
        ? { ...goal, status: "active" as const, current: true }
        : goal
    );

    expect(findCurrentActiveRemainingGoals(duplicateCurrentGoals).map((goal) => goal.id)).toEqual([
      "goal-phase-3-proof-clearance",
      "goal-phase-4-provider-surfaces"
    ]);
    expect(findRemainingGoalPlanIssues(duplicateCurrentGoals)).toContain(
      "Remaining goals must have exactly one current active goal; found 2: goal-phase-3-proof-clearance, goal-phase-4-provider-surfaces."
    );
  });

  it("reports stale current flags on non-active goals", () => {
    const staleCurrentGoals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-4-provider-surfaces"
        ? { ...goal, current: true }
        : goal
    );

    expect(findCurrentActiveRemainingGoals(staleCurrentGoals).map((goal) => goal.id)).toEqual([
      "goal-phase-3-proof-clearance"
    ]);
    expect(findRemainingGoalPlanIssues(staleCurrentGoals)).toContain(
      "Remaining goal goal-phase-4-provider-surfaces is marked current but has status next; current goals must be active."
    );
  });

  it("keeps active work as the current summary when current metadata is stale", () => {
    const staleCurrentGoals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-3-proof-clearance"
        ? { ...goal, current: false }
        : goal.id === "goal-phase-4-provider-surfaces"
          ? { ...goal, current: true }
          : goal
    );
    const summary = summarizeRemainingGoalPlan(staleCurrentGoals);

    expect(summary.currentTarget).toBe("Phase 3 desktop proof clearance");
    expect(summary.currentNextAction).toContain("Phase 3 command plan");
  });

  it("keeps the Phase 9 runner approval target linked to traceability, approval depth, and blocker priority", () => {
    const phase9Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-9-runner");

    expect(phase9Goal).toMatchObject({
      target: "Desktop-backed runner approval",
      priority: "high",
      status: "next",
      completionPercent: 64
    });
    expect(phase9Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-09-child-reversible-action",
        "phase-09-child-runner-observability",
        "phase-09-child-traceability",
        "phase-09-child-blocker-priority",
        "phase-09-child-approval-record",
        "phase-09-child-approval-depth"
      ])
    );
    expect(phase9Goal?.nextAction).toContain("terminal-readonly-probe");
    expect(phase9Goal?.nextAction).toContain("Phase 9 request gate");
    expect(phase9Goal?.goal).toContain("trusted Phase 9 traceability/current active goal proof");
    expect(phase9Goal?.nextAction).toContain("trusted Phase 9 traceability/current active goal proof");
    expect(phase9Goal?.nextAction).toContain("current runner evidence fingerprint");
    expect(phase9Goal?.nextAction).toContain("blocker-priority queue");
    expect(phase9Goal?.nextAction).toContain("owner-visible Phase 9 runner proof");

    const phase9Parent = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-desktop-runner"
    );
    const phase9RunnerProbeParent = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-parent-runner-probe"
    );
    const reversibleChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-child-reversible-action"
    );
    const traceabilityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-child-traceability"
    );
    const blockerPriorityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-child-blocker-priority"
    );

    expect(phase9Parent?.description).toContain(
      "trusted Phase 9 traceability/current active goal gates"
    );
    expect(phase9Parent?.completionPercent).toBe(64);
    expect(phase9RunnerProbeParent?.completionPercent).toBe(62);
    expect(reversibleChild?.description).toContain(
      "trusted Phase 9 traceability/current active goal proof"
    );
    expect(traceabilityChild?.description).toContain("current active goal trust");
    expect(blockerPriorityChild?.description).toContain(
      "owner-action blockers from runner-review-addressable blockers"
    );
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
        "phase-05-child-traceability",
        "phase-05-child-blocker-priority"
      ])
    );
    expect(phase5Goal?.nextAction).toContain("blocker-priority queue");
    expect(phase5Goal?.nextAction).toContain("owner-visible Phase 5 check");
    expect(phase5Goal?.nextAction).toContain("apply-review-staged audit record");
  });

  it("keeps the Phase 8 permission audit target linked to traceability and audit persistence", () => {
    const phase8Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-8-permission-audit");

    expect(phase8Goal).toMatchObject({
      target: "Permission and audit depth",
      priority: "high",
      status: "next",
      completionPercent: 65
    });
    expect(phase8Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-08-child-permission-labels",
        "phase-08-child-risk-blockers",
        "phase-08-child-risk-exceptions",
        "phase-08-child-traceability",
        "phase-08-child-blocker-priority",
        "phase-08-child-audit-persistence"
      ])
    );
    expect(phase8Goal?.nextAction).toContain("blocker-priority queue");
    expect(phase8Goal?.nextAction).toContain("local owner audit-review record");
    expect(phase8Goal?.nextAction).toContain("current audit evidence fingerprint");
    expect(phase8Goal?.nextAction).toContain("record-specific rollback review");
    expect(phase8Goal?.nextAction).toContain("owner-visible Phase 8 audit proof");
  });

  it("keeps the Phase 4 provider surfaces target linked to traceability and surface depth", () => {
    const phase4Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-4-provider-surfaces");
    const phase4Epic = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-provider-surfaces"
    );

    expect(phase4Goal).toMatchObject({
      target: "Provider integration surfaces",
      priority: "high",
      status: "next",
      completionPercent: 64
    });
    expect(phase4Epic?.completionPercent).toBe(64);
    expect(phase4Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-04-child-command-skill",
        "phase-04-child-plugin-mcp",
        "phase-04-child-catalog-depth",
        "phase-04-child-surface-depth",
        "phase-04-child-approval-record",
        "phase-04-child-audit-record",
        "phase-04-child-rollback-record",
        "phase-04-child-permission-record",
        "phase-04-child-traceability",
        "phase-04-child-blocker-priority",
        "phase-04-child-refresh-safety-depth"
      ])
    );
    expect(phase4Goal?.nextAction).toContain("blocker-priority panels");
    expect(phase4Goal?.nextAction).toContain(
      "local approval, audit, rollback, and permission record validation"
    );
    expect(phase4Goal?.nextAction).toContain("owner-visible provider readiness check");
    expect(phase4Goal?.nextAction).toContain("approval, audit, rollback, permission");
  });

  it("keeps the Phase 7 dispatch loop target linked to traceability and blocker priority", () => {
    const phase7Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-7-dispatch-loop");

    expect(phase7Goal).toMatchObject({
      target: "Planning and dispatch loop",
      priority: "high",
      status: "next",
      completionPercent: 64
    });
    expect(phase7Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-07-child-worker-preview",
        "phase-07-child-integration-owner",
        "phase-07-child-integration-ownership-depth",
        "phase-07-child-handoff-trace",
        "phase-07-child-review-depth",
        "phase-07-child-traceability",
        "phase-07-child-blocker-priority"
      ])
    );
    expect(phase7Goal?.nextAction).toContain("traceability rows");
    expect(phase7Goal?.nextAction).toContain("handoff packet integrity");
    expect(phase7Goal?.nextAction).toContain("current evidence fingerprint");
    expect(phase7Goal?.nextAction).toContain("blocker-priority queue");
    expect(phase7Goal?.nextAction).toContain("owner-visible Phase 7 dispatch proof");
  });

  it("keeps the Phase 10 Arena polish target linked to traceability and blocker priority", () => {
    const phase10Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-10-arena-polish");

    expect(phase10Goal).toMatchObject({
      target: "Adaptive Arena polish",
      priority: "medium",
      status: "next"
    });
    expect(phase10Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-10-child-layout-regression",
        "phase-10-child-density-polish",
        "phase-10-child-term-scan",
        "phase-10-child-traceability",
        "phase-10-child-blocker-priority"
      ])
    );
    expect(phase10Goal?.nextAction).toContain("traceability rows");
    expect(phase10Goal?.nextAction).toContain("blocker-priority queue");
  });

  it("keeps the Phase 11 owner and release targets linked to traceability and blocker priority", () => {
    const ownerGoal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-11-owner-command-center");
    const releaseGoal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-11-release-readiness");

    expect(ownerGoal).toMatchObject({
      target: "Owner Testing command center",
      priority: "high",
      status: "next",
      completionPercent: 60
    });
    expect(ownerGoal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-11-child-owner-checklist",
        "phase-11-child-proof-freshness-depth",
        "phase-11-child-evidence-records",
        "phase-11-child-fresh-checkout",
        "phase-11-child-traceability",
        "phase-11-child-blocker-priority"
      ])
    );
    expect(ownerGoal?.goal).toContain("proof freshness depth");
    expect(ownerGoal?.nextAction).toContain("Proof Freshness Depth");
    expect(ownerGoal?.nextAction).toContain("CLI-validation freshness");
    expect(ownerGoal?.nextAction).toContain("handoff proof depth");
    expect(ownerGoal?.nextAction).toContain("owner release traceability");
    expect(ownerGoal?.nextAction).toContain("blocker-priority panels");
    expect(ownerGoal?.nextAction).toContain("owner-visible Phase 11 proof");
    const phase11Epic = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-owner-packaging"
    );
    const ownerTestingParent = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-parent-owner-testing"
    );
    const ownerChecklistChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-child-owner-checklist"
    );
    const proofFreshnessChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-child-proof-freshness-depth"
    );

    expect(phase11Epic?.completionPercent).toBe(56);
    expect(ownerTestingParent?.completionPercent).toBe(62);
    expect(ownerChecklistChild?.completionPercent).toBe(58);
    expect(proofFreshnessChild?.completionPercent).toBe(52);
    expect(releaseGoal).toMatchObject({
      target: "Release readiness pass",
      priority: "high",
      status: "next",
      completionPercent: 54
    });
    expect(releaseGoal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-11-child-package-validation",
        "phase-11-child-traceability",
        "phase-11-child-blocker-priority"
      ])
    );
    expect(releaseGoal?.goal).toContain("structured evidence records");
    expect(releaseGoal?.goal).toContain("fresh-checkout");
    expect(releaseGoal?.goal).toContain("current active Phase 3 clearance PM traceability and handoff proof");
    expect(releaseGoal?.nextAction).toContain("Evidence Records");
    expect(releaseGoal?.nextAction).toContain("structured fresh-checkout");
    expect(releaseGoal?.nextAction).toContain("structured clean-checkout");
    expect(releaseGoal?.nextAction).toContain("current active Phase 3 clearance PM traceability with handoff proof");
    expect(releaseGoal?.nextAction).toContain("owner release traceability");
    expect(releaseGoal?.nextAction).toContain("blocker-priority panels");
    expect(releaseGoal?.nextAction).toContain("owner-visible Phase 11 proof");
    expect(releaseGoal?.nextAction).toContain("visible Security 100% final closure guidance");
    expect(releaseGoal?.nextAction).toContain("visible release-decision top-prerequisite detail");
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
