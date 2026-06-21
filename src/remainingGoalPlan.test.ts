import { describe, expect, it } from "vitest";
import packageJson from "../package.json";
import { PHASE3_PROOF_EXPORT_PM_TASK_ID } from "./phase3ProofExportTrace";
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
      averageCompletionPercent: 99.9,
      currentTarget: "Desktop-backed runner approval",
      currentNextAction:
        "Use the Phase 9 runner closeout status proof as the current active implementation target with approval, approval-depth, traceability, blocker-priority, visible desktop-probe gate status, complete Phase 8 dependency proof, phase9RequestGateProof, phase9RunnerCompletionGateProof, backendScope provider/intent proof, PM-link, and runner-expansion lock evidence visible. Phase 9 runner closeout status proof attached. Only the fixed terminal-readonly-probe may advance after live gates are ready; broader runner actions remain locked.",
      ownerHoldTarget: "Unblock Phase 1/2/6 publishing",
      ownerHoldNextAction:
        "Use the Phase 1/2/6 priority evidence, publish-hold traceability, blocker-priority queue, and phase126PublishHoldCloseoutStatusProof to keep the branch local, preserve proof commits, rank the owner/remote publish hold above proof review, and push only after the remote is recreated and the owner says to push.",
      coveredPhaseCount: 11,
      remainingPhaseCount: 11,
      priorityGoalTraceCount: 9,
      priorityGoalTraces: buildRemainingGoalPriorityTraces()
    });
  });

  it("keeps critical and high-priority goal traces at the top with PM task links", () => {
    const traces = buildRemainingGoalPriorityTraces();

    expect(traces.map((trace) => trace.goalId).slice(0, 2)).toEqual([
      "goal-phase-9-runner",
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
            "phase-05-child-blocker-priority",
            "phase-05-child-owner-approval-handoff",
            "phase-05-child-apply-implementation-boundary",
            "phase-05-child-completion-gate"
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
            "phase-11-child-owner-command-closeout-status",
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

  it("does not round the owner-held publish blocker into a complete overall score", () => {
    expect(summarizeRemainingGoalPlan().averageCompletionPercent).toBe(99.9);
  });

  it("keeps the visible remaining goal queue priority-first", () => {
    const queue = buildRemainingGoalPriorityQueue();

    expect(queue.map((goal) => goal.id).slice(0, 4)).toEqual([
      "goal-phase-9-runner",
      "goal-phase-1-2-6-publish",
      "goal-phase-3-proof-clearance",
      "goal-phase-4-provider-surfaces"
    ]);
    expect(queue[0]).toMatchObject({
      current: true,
      priority: "high",
      status: "active"
    });
    expect(queue[1]).toMatchObject({
      priority: "critical",
      status: "blocked"
    });
  });

  it("keeps stale current next goals below the critical owner hold", () => {
    const staleCurrentNextGoals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-3-proof-clearance"
        ? { ...goal, current: true }
        : goal
    );
    const queue = buildRemainingGoalPriorityQueue(staleCurrentNextGoals);

    expect(queue.map((goal) => goal.id).slice(0, 3)).toEqual([
      "goal-phase-9-runner",
      "goal-phase-1-2-6-publish",
      "goal-phase-3-proof-clearance"
    ]);
    expect(isCurrentActiveRemainingGoal(queue[0])).toBe(true);
    expect(queue[1]).toMatchObject({
      priority: "critical",
      status: "blocked"
    });
  });

  it("reports only current active goals as current in priority traces", () => {
    const staleCurrentNextGoals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-3-proof-clearance"
        ? { ...goal, current: true }
        : goal
    );
    const traces = buildRemainingGoalPriorityTraces(staleCurrentNextGoals);

    expect(traces.find((trace) => trace.goalId === "goal-phase-3-proof-clearance")).toMatchObject({
      current: false,
      status: "next"
    });
    expect(traces.find((trace) => trace.goalId === "goal-phase-7-dispatch-loop")).toMatchObject({
      current: false,
      status: "next"
    });
    expect(traces.find((trace) => trace.goalId === "goal-phase-5-migration-hardening")).toMatchObject({
      current: false,
      status: "next"
    });
    expect(traces.find((trace) => trace.goalId === "goal-phase-8-permission-audit")).toMatchObject({
      current: false,
      status: "next"
    });
    expect(traces.find((trace) => trace.goalId === "goal-phase-9-runner")).toMatchObject({
      current: true,
      status: "active"
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
        "phase-06-child-publish-hold-blocker-priority",
        "phase-06-child-publish-hold-closeout-status"
      ])
    );
    expect(publishGoal?.nextAction).toContain("publish-hold traceability");
    expect(publishGoal?.nextAction).toContain("blocker-priority queue");
    expect(publishGoal?.nextAction).toContain("phase126PublishHoldCloseoutStatusProof");
    expect(phase3Goal?.target).toBe("Phase 3 desktop proof clearance");
    expect(phase3Goal?.current).toBeUndefined();
    expect(phase3Goal?.completionPercent).toBe(100);
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-exit-gate");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-blocker-priority");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-traceability");
    expect(phase3Goal?.pmTaskIds).toContain(PHASE3_PROOF_EXPORT_PM_TASK_ID);
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-handoff-gate");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-clearance-completion-status");
    expect(phase3Goal?.pmTaskIds).toContain("phase-03-child-slash-ready");
    expect(phase3Goal?.nextAction).toContain("CLI validation");
    expect(phase3Goal?.nextAction).toContain("desktop smoke proof");
    expect(phase3Goal?.nextAction).toContain("current-panel slash/session storage proof");
    expect(phase3Goal?.goal).toContain("fail-closed proof-export rows");
    expect(phase3Goal?.goal).toContain("owner-held publish execution proof");
    expect(phase3Goal?.nextAction).toContain("proof-export offline verification");
    expect(phase3Goal?.goal).toContain("phase3ClearanceCompletionStatusProof");
    expect(phase3Goal?.nextAction).toContain("phase3ClearanceCompletionStatusProof");
    expect(phase3Goal?.nextAction).toContain("publishExecution/noPush proof");
    expect(phase3Goal?.nextAction).toContain("Phase 4 provider integration remains staged behind the current Phase 9 runner implementation target");
  });

  it("keeps the Phase 3 PM traceability child aligned to the current active goal boundary", () => {
    const traceabilityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-03-child-traceability"
    );
    const handoffGateChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-03-child-handoff-gate"
    );
    const proofExportChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === PHASE3_PROOF_EXPORT_PM_TASK_ID
    );
    const completionStatusChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-03-child-clearance-completion-status"
    );

    expect(traceabilityChild).toMatchObject({
      title: "Clearance Traceability",
      sourceDocument: "Phase 3 clearance traceability"
    });
    expect(traceabilityChild?.description).toContain("trusted Phase 3 clearance goal");
    expect(traceabilityChild?.description).toContain("required PM rows");
    expect(traceabilityChild?.description).toContain("proof-export offline verification");
    expect(traceabilityChild?.description).toContain("phase3ClearanceCompletionStatusProof");
    expect(traceabilityChild?.description).toContain("handoff-review details");
    expect(proofExportChild).toMatchObject({
      title: "Proof Export Boundary",
      completionPercent: 100,
      sourceDocument: "Phase 3 proof export"
    });
    expect(proofExportChild?.description).toContain("fail-closed");
    expect(proofExportChild?.description).toContain("offline verification");
    expect(proofExportChild?.description).toContain("phase3ClearanceCompletionStatusProof");
    expect(proofExportChild?.description).toContain("Phase 4 review can advance");
    expect(handoffGateChild?.description).toContain("fail-closed proof-export offline verification");
    expect(handoffGateChild?.description).toContain("phase3ClearanceCompletionStatusProof");
    expect(completionStatusChild).toMatchObject({
      title: "Clearance Completion Status",
      completionPercent: 100,
      sourceDocument: "Phase 3 clearance completion status"
    });
    expect(completionStatusChild?.description).toContain("phase3ClearanceCompletionStatusProof");
    expect(completionStatusChild?.description).toContain("smokeRows");
    expect(completionStatusChild?.description).toContain("publishExecution/noPush");
    expect(completionStatusChild?.description).toContain("execution and pushing stay owner-held");
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
      status: "next",
      completionPercent: 100
    });
    expect(incompleteTaskIds).toEqual([]);
    expect(taskCompletionById.get("phase-03-controls-slash")).toBe(100);
    expect(taskCompletionById.get("phase-03-parent-proof-clearance")).toBe(100);
    expect(taskCompletionById.get("phase-03-child-smoke-rows")).toBe(100);
    expect(taskCompletionById.get("phase-03-child-exit-gate")).toBe(100);
    expect(taskCompletionById.get("phase-03-child-command-plan")).toBe(100);
    expect(taskCompletionById.get("phase-03-child-blocker-priority")).toBe(100);
    expect(taskCompletionById.get("phase-03-child-traceability")).toBe(100);
    expect(taskCompletionById.get(PHASE3_PROOF_EXPORT_PM_TASK_ID)).toBe(100);
    expect(taskCompletionById.get("phase-03-child-handoff-gate")).toBe(100);
    expect(taskCompletionById.get("phase-03-child-clearance-completion-status")).toBe(100);
    expect(taskCompletionById.get("phase-03-parent-slash-controls")).toBe(100);
    expect(taskCompletionById.get("phase-03-child-slash-ready")).toBe(100);
    expect(taskCompletionById.get("phase-03-child-control-ready")).toBe(100);
  });

  it("separates the blocked owner hold from the active implementation target", () => {
    const summary = summarizeRemainingGoalPlan();

    expect(summary.currentTarget).toBe("Desktop-backed runner approval");
    expect(summary.currentNextAction).toContain("current active implementation target");
    expect(summary.ownerHoldTarget).toBe("Unblock Phase 1/2/6 publishing");
    expect(summary.ownerHoldNextAction).toContain("owner says to push");
    expect(summary.priorityGoalTraces[0]).toMatchObject({
      goalId: "goal-phase-9-runner",
      current: true
    });
    expect(summary.priorityGoalTraces[1]).toMatchObject({
      goalId: "goal-phase-1-2-6-publish",
      status: "blocked",
      current: false
    });
  });

  it("identifies only the current active remaining goal as implementation-trustable", () => {
    const phase9Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-9-runner");

    expect(findCurrentActiveRemainingGoals()).toEqual([phase9Goal]);
    expect(isCurrentActiveRemainingGoal(phase9Goal)).toBe(true);
    expect(isCurrentActiveRemainingGoal({ ...phase9Goal!, current: false })).toBe(false);
    expect(isCurrentActiveRemainingGoal({ ...phase9Goal!, status: "next" })).toBe(false);
    expect(isCurrentActiveRemainingGoal({ ...phase9Goal!, status: "active", current: true })).toBe(true);
    expect(isCurrentActiveRemainingGoal(undefined)).toBe(false);
  });

  it("reports duplicate current active goals before summaries and traceability can disagree", () => {
    const duplicateCurrentGoals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-3-proof-clearance"
        ? { ...goal, status: "active" as const, current: true }
        : goal
    );

    expect(findCurrentActiveRemainingGoals(duplicateCurrentGoals).map((goal) => goal.id)).toEqual([
      "goal-phase-3-proof-clearance",
      "goal-phase-9-runner"
    ]);
    expect(findRemainingGoalPlanIssues(duplicateCurrentGoals)).toContain(
      "Remaining goals must have exactly one current active goal; found 2: goal-phase-3-proof-clearance, goal-phase-9-runner."
    );
  });

  it("reports stale current flags on non-active goals", () => {
    const staleCurrentGoals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-3-proof-clearance"
        ? { ...goal, current: true }
        : goal
    );

    expect(findCurrentActiveRemainingGoals(staleCurrentGoals).map((goal) => goal.id)).toEqual([
      "goal-phase-9-runner"
    ]);
    expect(findRemainingGoalPlanIssues(staleCurrentGoals)).toContain(
      "Remaining goal goal-phase-3-proof-clearance is marked current but has status next; current goals must be active."
    );
  });

  it("keeps active work as the current summary when current metadata is stale", () => {
    const staleCurrentGoals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-3-proof-clearance"
        ? { ...goal, current: false }
        : goal.id === "goal-phase-7-dispatch-loop"
          ? { ...goal, current: false }
          : goal.id === "goal-phase-4-provider-surfaces"
            ? { ...goal, current: true }
            : goal
    );
    const summary = summarizeRemainingGoalPlan(staleCurrentGoals);

    expect(summary.currentTarget).toBe("Desktop-backed runner approval");
    expect(summary.currentNextAction).toContain("current active implementation target");
  });

  it("keeps the Phase 9 runner approval target linked to traceability, approval depth, and blocker priority", () => {
    const phase9Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-9-runner");

    expect(phase9Goal).toMatchObject({
      target: "Desktop-backed runner approval",
      priority: "high",
      status: "active",
      current: true,
      completionPercent: 100
    });
    expect(phase9Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-09-child-reversible-action",
        "phase-09-child-runner-observability",
        "phase-09-child-traceability",
        "phase-09-child-blocker-priority",
        "phase-09-child-approval-record",
        "phase-09-child-approval-depth",
        "phase-09-child-completion-gate",
        "phase-09-child-closeout-status"
      ])
    );
    expect(phase9Goal?.nextAction).toContain("terminal-readonly-probe");
    expect(phase9Goal?.nextAction).toContain("Phase 9 runner closeout status proof attached");
    expect(phase9Goal?.goal).toContain("trusted Phase 9 traceability/current active goal proof");
    expect(phase9Goal?.goal).toContain("visible Phase 9 desktop probe gate status");
    expect(phase9Goal?.goal).toContain("phase9RequestGateProof");
    expect(phase9Goal?.nextAction).toContain("phase9RequestGateProof");
    expect(phase9Goal?.nextAction).toContain("visible desktop-probe gate status");
    expect(phase9Goal?.goal).toContain("phase9RunnerCompletionGateProof");
    expect(phase9Goal?.nextAction).toContain("phase9RunnerCompletionGateProof");
    expect(phase9Goal?.goal).toContain("backendScope provider/intent proof");
    expect(phase9Goal?.nextAction).toContain("backendScope provider/intent proof");
    expect(phase9Goal?.nextAction).toContain("runner-expansion lock evidence");

    const phase9Parent = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-desktop-runner"
    );
    const phase9RunnerProbeParent = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-parent-runner-probe"
    );
    const reversibleChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-child-reversible-action"
    );
    const observabilityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-child-runner-observability"
    );
    const traceabilityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-child-traceability"
    );
    const blockerPriorityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-child-blocker-priority"
    );
    const completionGateChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-child-completion-gate"
    );
    const closeoutStatusChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-09-child-closeout-status"
    );

    expect(phase9Parent?.description).toContain(
      "trusted Phase 9 traceability/current active goal gates"
    );
    expect(phase9Parent?.completionPercent).toBe(100);
    expect(phase9RunnerProbeParent?.completionPercent).toBe(100);
    expect(reversibleChild?.completionPercent).toBe(100);
    expect(observabilityChild?.completionPercent).toBe(100);
    expect(completionGateChild?.completionPercent).toBe(100);
    expect(closeoutStatusChild?.completionPercent).toBe(100);
    expect(phase9Parent?.description).toContain("owner-visible Phase 9 proof summaries");
    expect(phase9Parent?.description).toContain("visible Phase 9 desktop probe gate status");
    expect(phase9Parent?.description).toContain("phase9RequestGateProof");
    expect(phase9Parent?.description).toContain("phase9RunnerCompletionGateProof");
    expect(phase9Parent?.description).toContain("phase9RunnerCloseoutStatusProof");
    expect(phase9Parent?.description).toContain("backendScope provider/intent proof");
    expect(phase9RunnerProbeParent?.description).toContain("runner approval proof summary");
    expect(phase9RunnerProbeParent?.description).toContain("visible Phase 9 desktop probe gate status");
    expect(phase9RunnerProbeParent?.description).toContain("backendScope provider/intent proof");
    expect(phase9RunnerProbeParent?.description).toContain("phase9RequestGateProof");
    expect(phase9RunnerProbeParent?.description).toContain("phase9RunnerCompletionGateProof");
    expect(observabilityChild?.description).toContain("validation output evidence key");
    expect(observabilityChild?.description).toContain("backendScope provider/intent proof");
    expect(observabilityChild?.description).toContain("visible Phase 9 desktop probe gate held/ready status");
    expect(observabilityChild?.description).toContain("phase9RequestGateProof");
    expect(observabilityChild?.description).toContain("phase9RunnerCompletionGateProof");
    expect(observabilityChild?.description).toContain("proof summaries");
    expect(observabilityChild?.description).toContain("mutation-lock count");
    expect(reversibleChild?.description).toContain(
      "trusted Phase 9 traceability/current active goal proof"
    );
    expect(reversibleChild?.description).toContain("no workspace write");
    expect(reversibleChild?.description).toContain("no Git operation");
    expect(traceabilityChild?.description).toContain("current active goal trust");
    expect(traceabilityChild?.description).toContain("traceability proof summary");
    expect(blockerPriorityChild?.description).toContain(
      "owner-action blockers from runner-review-addressable blockers"
    );
    expect(blockerPriorityChild?.description).toContain("blocker-priority proof summary");
    expect(completionGateChild?.description).toContain("phase9RunnerCompletionGateProof");
    expect(completionGateChild?.description).toContain("fixed terminal-readonly-probe");
    expect(completionGateChild?.description).toContain("broader runner actions stay locked");
    expect(closeoutStatusChild?.description).toContain("phase9RunnerCloseoutStatusProof");
  });

  it("keeps the Phase 5 migration hardening target linked to traceability and review depth", () => {
    const phase5Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-5-migration-hardening");
    const phase5Epic = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-05-migration-center"
    );
    const rollbackAuditParent = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-05-parent-rollback-audit"
    );
    const profileDraftsChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-05-child-profile-drafts"
    );
    const previewMetadataChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-05-child-preview-metadata"
    );
    const auditSummaryChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-05-child-audit-summary"
    );
    const reviewDepthChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-05-child-review-depth"
    );
    const traceabilityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-05-child-traceability"
    );
    const blockerPriorityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-05-child-blocker-priority"
    );
    const ownerApprovalHandoffChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-05-child-owner-approval-handoff"
    );
    const applyImplementationBoundaryChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-05-child-apply-implementation-boundary"
    );
    const completionGateChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-05-child-completion-gate"
    );

    expect(phase5Goal).toMatchObject({
      target: "Migration Center hardening",
      priority: "high",
      status: "next",
      completionPercent: 100
    });
    expect(phase5Goal?.current).toBeUndefined();
    expect(phase5Epic?.completionPercent).toBe(100);
    expect(phase5Epic?.description).toContain("migrationReviewDepthProof");
    expect(phase5Epic?.description).toContain("migrationTraceabilityProof");
    expect(phase5Epic?.description).toContain("trust=ready");
    expect(phase5Epic?.description).toContain("migrationBlockerPriorityProof");
    expect(phase5Epic?.description).toContain("open=0");
    expect(phase5Epic?.description).toContain("migrationApplyDecisionProof");
    expect(phase5Epic?.description).toContain("canApply=no");
    expect(phase5Epic?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(phase5Epic?.description).toContain("applyImplementationBoundaryProof");
    expect(phase5Epic?.description).toContain("phase5MigrationCompletionGate");
    expect(profileDraftsChild?.completionPercent).toBe(100);
    expect(profileDraftsChild?.description).toContain("apply-review-staged audit actions");
    expect(profileDraftsChild?.description).toContain("migrationReviewDepthProof");
    expect(profileDraftsChild?.description).toContain("evidenceKeys=6/6");
    expect(profileDraftsChild?.description).toContain("without changing active profiles or source data");
    expect(profileDraftsChild?.description).toContain("migrationApplyDecisionProof");
    expect(profileDraftsChild?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(previewMetadataChild?.completionPercent).toBe(100);
    expect(previewMetadataChild?.description).toContain("sensitive-exclusion evidence keys");
    expect(previewMetadataChild?.description).toContain("migrationReviewDepthProof");
    expect(previewMetadataChild?.description).toContain("sourceMutation=locked");
    expect(previewMetadataChild?.description).toContain("migrationApplyDecisionProof");
    expect(previewMetadataChild?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(previewMetadataChild?.description).toContain("applyImplementationBoundaryProof");
    expect(auditSummaryChild?.completionPercent).toBe(100);
    expect(auditSummaryChild?.description).toContain("draft/audit fingerprint match");
    expect(auditSummaryChild?.description).toContain("migrationReviewDepthProof");
    expect(auditSummaryChild?.description).toContain("records=6/6");
    expect(auditSummaryChild?.description).toContain("migrationApplyDecisionProof");
    expect(auditSummaryChild?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(reviewDepthChild?.completionPercent).toBe(100);
    expect(reviewDepthChild?.description).toContain("six separate ready owner-review records");
    expect(reviewDepthChild?.description).toContain("unique evidence keys");
    expect(reviewDepthChild?.description).toContain("migrationReviewDepthProof");
    expect(reviewDepthChild?.description).toContain("ready owner-review records");
    expect(reviewDepthChild?.description).toContain("migrationApplyDecisionProof");
    expect(reviewDepthChild?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(traceabilityChild?.completionPercent).toBe(100);
    expect(traceabilityChild?.description).toContain("source-mutation locks");
    expect(traceabilityChild?.description).toContain("migrationTraceabilityProof");
    expect(traceabilityChild?.description).toContain("trust=ready");
    expect(traceabilityChild?.description).toContain("openReview=0");
    expect(traceabilityChild?.description).toContain("owner-approval handoff");
    expect(blockerPriorityChild?.completionPercent).toBe(100);
    expect(blockerPriorityChild?.description).toContain("source-mutation locks");
    expect(blockerPriorityChild?.description).toContain("migrationBlockerPriorityProof");
    expect(blockerPriorityChild?.description).toContain("open=0");
    expect(blockerPriorityChild?.description).toContain("migrationApplyDecisionProof");
    expect(blockerPriorityChild?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(blockerPriorityChild?.description).toContain("applyImplementationBoundaryProof");
    expect(ownerApprovalHandoffChild?.completionPercent).toBe(100);
    expect(ownerApprovalHandoffChild?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(ownerApprovalHandoffChild?.description).toContain("recorded state");
    expect(ownerApprovalHandoffChild?.description).toContain("canApply=no");
    expect(applyImplementationBoundaryChild?.completionPercent).toBe(100);
    expect(applyImplementationBoundaryChild?.description).toContain("applyImplementationBoundaryProof");
    expect(applyImplementationBoundaryChild?.description).toContain("executor=missing");
    expect(applyImplementationBoundaryChild?.description).toContain("canApply=no");
    expect(completionGateChild?.completionPercent).toBe(100);
    expect(completionGateChild?.description).toContain("phase5MigrationCompletionGate");
    expect(completionGateChild?.description).toContain("phaseComplete=yes");
    expect(completionGateChild?.description).toContain("canApply=no");
    expect(rollbackAuditParent?.completionPercent).toBe(100);
    expect(rollbackAuditParent?.description).toContain("sensitive-boundary traceability");
    expect(rollbackAuditParent?.description).toContain("migrationTraceabilityProof");
    expect(rollbackAuditParent?.description).toContain("openReview=0");
    expect(phase5Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-05-child-profile-drafts",
        "phase-05-child-preview-metadata",
        "phase-05-child-audit-summary",
        "phase-05-child-review-depth",
        "phase-05-child-traceability",
        "phase-05-child-blocker-priority",
        "phase-05-child-apply-decision-gate",
        "phase-05-child-owner-approval-handoff",
        "phase-05-child-apply-implementation-boundary",
        "phase-05-child-completion-gate"
      ])
    );
    expect(phase5Goal?.nextAction).toContain("blocker-priority queue");
    expect(phase5Goal?.nextAction).toContain("completed handoff evidence");
    expect(phase5Goal?.nextAction).toContain("Phase 8 becomes the active implementation target");
    expect(phase5Goal?.nextAction).toContain("migrationReviewDepthProof");
    expect(phase5Goal?.nextAction).toContain("trust=ready");
    expect(phase5Goal?.nextAction).toContain("migrationTraceabilityProof");
    expect(phase5Goal?.nextAction).toContain("openReview=0");
    expect(phase5Goal?.nextAction).toContain("migrationBlockerPriorityProof");
    expect(phase5Goal?.nextAction).toContain("open=0");
    expect(phase5Goal?.nextAction).toContain("migrationApplyDecisionProof");
    expect(phase5Goal?.nextAction).toContain("canApply=no");
    expect(phase5Goal?.nextAction).toContain("migrationOwnerApprovalHandoffProof");
    expect(phase5Goal?.nextAction).toContain("recorded=no");
    expect(phase5Goal?.nextAction).toContain("local owner approval record persistence");
    expect(phase5Goal?.nextAction).toContain("applyImplementationBoundaryProof");
    expect(phase5Goal?.nextAction).toContain("executor=missing");
    expect(phase5Goal?.nextAction).toContain("phase5MigrationCompletionGate");
    expect(phase5Goal?.nextAction).toContain("phaseComplete=yes");
    expect(phase5Goal?.nextAction).toContain("owner-visible Phase 5 check");
    expect(phase5Goal?.nextAction).toContain("apply-review-staged audit record");
  });

  it("keeps the Phase 8 permission audit target linked to traceability and audit persistence", () => {
    const phase8Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-8-permission-audit");
    const phase8Epic = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-permissions-audit"
    );
    const permissionLabelsChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-permission-labels"
    );
    const riskBlockersChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-risk-blockers"
    );
    const riskExceptionsChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-risk-exceptions"
    );
    const traceabilityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-traceability"
    );
    const blockerPriorityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-blocker-priority"
    );
    const riskClosureChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-risk-closure"
    );
    const auditPersistenceChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-audit-persistence"
    );
    const completionGateChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-completion-gate"
    );
    const closureAuditStatusChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-closure-audit-status"
    );
    const ownerActionHandoffChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-owner-action-handoff"
    );
    const auditReviewBlockerHandoffChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-audit-review-blocker-handoff"
    );
    const ownerReviewClosureReadinessChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-owner-review-closure-readiness"
    );
    const finalCompletionHandoffChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-final-completion-handoff"
    );
    const closeoutStatusChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-closeout-status"
    );
    const ownerReviewHandoffChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-08-child-owner-review-handoff"
    );

    expect(phase8Goal).toMatchObject({
      target: "Permission and audit depth",
      priority: "high",
      status: "next",
      completionPercent: 100
    });
    expect(phase8Epic?.completionPercent).toBe(100);
    expect(permissionLabelsChild?.completionPercent).toBe(100);
    expect(permissionLabelsChild?.description).toContain("permissionLabelSummaryProof total");
    expect(permissionLabelsChild?.description).toContain("phase8CloseoutStatusProof");
    expect(riskBlockersChild?.completionPercent).toBe(100);
    expect(riskBlockersChild?.description).toContain("topBlockerProof source/kind/status");
    expect(riskBlockersChild?.description).toContain("blockerQueueProof open/kind/status");
    expect(riskBlockersChild?.description).toContain("phase8CloseoutStatusProof");
    expect(riskExceptionsChild?.completionPercent).toBe(100);
    expect(riskExceptionsChild?.description).toContain("riskExceptionSummaryProof severity/status/ready");
    expect(riskExceptionsChild?.description).toContain("phase8CloseoutStatusProof");
    expect(traceabilityChild?.completionPercent).toBe(100);
    expect(traceabilityChild?.description).toContain("traceabilityProof goal/missing-PM/trust");
    expect(traceabilityChild?.description).toContain("phase8CloseoutStatusProof");
    expect(blockerPriorityChild?.completionPercent).toBe(100);
    expect(blockerPriorityChild?.description).toContain("topBlockerProof source/kind/status");
    expect(blockerPriorityChild?.description).toContain("blockerQueueProof open/kind/status");
    expect(blockerPriorityChild?.description).toContain("phase8CloseoutStatusProof");
    expect(riskClosureChild?.completionPercent).toBe(100);
    expect(riskClosureChild?.description).toContain("phase8RiskClosureProof");
    expect(riskClosureChild?.description).toContain("phase8CloseoutStatusProof");
    expect(auditPersistenceChild?.completionPercent).toBe(100);
    expect(auditPersistenceChild?.description).toContain("auditPersistenceProof state/readiness/record");
    expect(auditPersistenceChild?.description).toContain("fingerprint-current");
    expect(auditPersistenceChild?.description).toContain("phase8CloseoutStatusProof");
    expect(completionGateChild?.completionPercent).toBe(100);
    expect(completionGateChild?.description).toContain("phase8PermissionAuditCompletionGate");
    expect(completionGateChild?.description).toContain("phase8AuditReviewHandoffProof");
    expect(completionGateChild?.description).toContain("current fingerprint");
    expect(completionGateChild?.description).toContain("phase8CloseoutStatusProof");
    expect(closureAuditStatusChild?.completionPercent).toBe(100);
    expect(closureAuditStatusChild?.description).toContain("phase8ClosureAuditStatusProof");
    expect(closureAuditStatusChild?.description).toContain("blocked-category counts");
    expect(closureAuditStatusChild?.description).toContain("phase8CloseoutStatusProof");
    expect(ownerActionHandoffChild?.completionPercent).toBe(100);
    expect(ownerActionHandoffChild?.description).toContain("phase8OwnerActionHandoffProof");
    expect(ownerActionHandoffChild?.description).toContain("owner-action-clear proof");
    expect(ownerActionHandoffChild?.description).toContain("phase8CloseoutStatusProof");
    expect(auditReviewBlockerHandoffChild?.completionPercent).toBe(100);
    expect(auditReviewBlockerHandoffChild?.description).toContain(
      "phase8AuditReviewBlockerHandoffProof"
    );
    expect(auditReviewBlockerHandoffChild?.description).toContain("reviewable-blocker handoff");
    expect(auditReviewBlockerHandoffChild?.description).toContain("phase8CloseoutStatusProof");
    expect(ownerReviewClosureReadinessChild?.completionPercent).toBe(100);
    expect(ownerReviewClosureReadinessChild?.description).toContain(
      "phase8OwnerReviewClosureReadinessProof"
    );
    expect(ownerReviewClosureReadinessChild?.description).toContain("can-close counts");
    expect(ownerReviewClosureReadinessChild?.description).toContain("phase8CloseoutStatusProof");
    expect(finalCompletionHandoffChild?.completionPercent).toBe(100);
    expect(finalCompletionHandoffChild?.description).toContain(
      "phase8FinalCompletionHandoffProof"
    );
    expect(finalCompletionHandoffChild?.description).toContain("phase8CloseoutStatusProof");
    expect(finalCompletionHandoffChild?.description).toContain("Phase 9");
    expect(finalCompletionHandoffChild?.description).toContain("top-hold counts");
    expect(closeoutStatusChild?.completionPercent).toBe(100);
    expect(closeoutStatusChild?.description).toContain("phase8CloseoutStatusProof");
    expect(closeoutStatusChild?.description).toContain("phase9-dependency");
    expect(closeoutStatusChild?.description).toContain("mutationExpansion");
    expect(closeoutStatusChild?.description).toContain("approvals");
    expect(closeoutStatusChild?.description).toContain("handlers");
    expect(closeoutStatusChild?.description).toContain("canAdvanceMutation");
    expect(closeoutStatusChild?.description).toContain("mutation expansion and mutation paths stay locked");
    expect(ownerReviewHandoffChild?.completionPercent).toBe(100);
    expect(ownerReviewHandoffChild?.description).toContain("phase8AuditReviewHandoffProof");
    expect(ownerReviewHandoffChild?.description).toContain("artifactState/fingerprintCurrent/reviewedBlocker");
    expect(ownerReviewHandoffChild?.description).toContain("phase8CloseoutStatusProof");
    expect(phase8Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-08-child-permission-labels",
        "phase-08-child-risk-blockers",
        "phase-08-child-risk-exceptions",
        "phase-08-child-traceability",
        "phase-08-child-blocker-priority",
        "phase-08-child-risk-closure",
        "phase-08-child-audit-persistence",
        "phase-08-child-owner-review-handoff",
        "phase-08-child-completion-gate",
        "phase-08-child-closure-audit-status",
        "phase-08-child-owner-action-handoff",
        "phase-08-child-audit-review-blocker-handoff",
        "phase-08-child-owner-review-closure-readiness",
        "phase-08-child-final-completion-handoff",
        "phase-08-child-closeout-status"
      ])
    );
    expect(phase8Goal?.nextAction).toContain("blocker-priority queue");
    expect(phase8Goal?.nextAction).toContain("current active implementation target");
    expect(phase8Goal?.nextAction).toContain("permissionLabelSummaryProof");
    expect(phase8Goal?.nextAction).toContain("riskBlockerProof");
    expect(phase8Goal?.nextAction).toContain("topBlockerProof");
    expect(phase8Goal?.nextAction).toContain("blockerQueueProof");
    expect(phase8Goal?.nextAction).toContain("phase8RiskClosureProof");
    expect(phase8Goal?.nextAction).toContain("riskExceptionSummaryProof");
    expect(phase8Goal?.nextAction).toContain("traceabilityProof");
    expect(phase8Goal?.nextAction).toContain("auditPersistenceProof");
    expect(phase8Goal?.nextAction).toContain("phase8AuditReviewHandoffProof");
    expect(phase8Goal?.nextAction).toContain("artifactState/fingerprintCurrent/reviewedBlocker");
    expect(phase8Goal?.nextAction).toContain("phase8PermissionAuditCompletionGate");
    expect(phase8Goal?.nextAction).toContain("handoff-ready/fingerprint-current proof");
    expect(phase8Goal?.nextAction).toContain("phase8ClosureAuditStatusProof");
    expect(phase8Goal?.nextAction).toContain("closure-audit status");
    expect(phase8Goal?.nextAction).toContain("phase8OwnerActionHandoffProof");
    expect(phase8Goal?.nextAction).toContain("owner-action handoff");
    expect(phase8Goal?.nextAction).toContain("phase8AuditReviewBlockerHandoffProof");
    expect(phase8Goal?.nextAction).toContain("audit-review blocker handoff");
    expect(phase8Goal?.nextAction).toContain("phase8OwnerReviewClosureReadinessProof");
    expect(phase8Goal?.nextAction).toContain("owner-review closure readiness");
    expect(phase8Goal?.nextAction).toContain("phase8FinalCompletionHandoffProof");
    expect(phase8Goal?.nextAction).toContain("Phase 9 handoff readiness");
    expect(phase8Goal?.nextAction).toContain("final completion handoff");
    expect(phase8Goal?.nextAction).toContain("phase8CloseoutStatusProof");
    expect(phase8Goal?.nextAction).toContain("closeout status");
    expect(phase8Goal?.nextAction).toContain("mutationExpansion=held");
    expect(phase8Goal?.nextAction).toContain("approvals=0/9");
    expect(phase8Goal?.nextAction).toContain("handlers=0/9");
    expect(phase8Goal?.nextAction).toContain("canAdvanceMutation=no");
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
    const commandSkillChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-command-skill"
    );
    const pluginMcpChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-plugin-mcp"
    );
    const catalogDepthChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-catalog-depth"
    );
    const refreshSafetyParent = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-parent-refresh-safety"
    );
    const refreshSmokeChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-refresh-smoke"
    );
    const refreshSafetyDepthChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-refresh-safety-depth"
    );
    const surfaceDepthChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-surface-depth"
    );
    const approvalRecordChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-approval-record"
    );
    const auditRecordChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-audit-record"
    );
    const rollbackRecordChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-rollback-record"
    );
    const permissionRecordChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-permission-record"
    );
    const traceabilityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-traceability"
    );
    const blockerPriorityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-blocker-priority"
    );
    const completionStatusChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-04-child-completion-status"
    );

    expect(phase4Goal).toMatchObject({
      target: "Provider integration surfaces",
      priority: "high",
      status: "next",
      completionPercent: 100
    });
    expect(phase4Epic?.completionPercent).toBe(100);
    expect(commandSkillChild?.completionPercent).toBe(100);
    expect(commandSkillChild?.description).toContain("commandScopeProof");
    expect(pluginMcpChild?.completionPercent).toBe(100);
    expect(pluginMcpChild?.description).toContain("mcpToolPolicyProof");
    expect(catalogDepthChild?.completionPercent).toBe(100);
    expect(catalogDepthChild?.description).toContain("catalogDepthProof");
    expect(refreshSafetyParent?.completionPercent).toBe(100);
    expect(refreshSmokeChild?.completionPercent).toBe(100);
    expect(refreshSmokeChild?.description).toContain("refreshSmokeProof");
    expect(refreshSafetyDepthChild?.completionPercent).toBe(100);
    expect(refreshSafetyDepthChild?.description).toContain("refreshSafetyDepthProof");
    expect(surfaceDepthChild?.completionPercent).toBe(100);
    expect(surfaceDepthChild?.description).toContain("surfaceDepthProof");
    expect(surfaceDepthChild?.description).toContain("localRecordValidationProof");
    expect(approvalRecordChild?.completionPercent).toBe(100);
    expect(approvalRecordChild?.description).toContain("approvalChainProof");
    expect(auditRecordChild?.completionPercent).toBe(100);
    expect(auditRecordChild?.description).toContain("auditChainProof");
    expect(rollbackRecordChild?.completionPercent).toBe(100);
    expect(rollbackRecordChild?.description).toContain("rollbackChainProof");
    expect(permissionRecordChild?.completionPercent).toBe(100);
    expect(permissionRecordChild?.description).toContain("permissionChainProof");
    expect(traceabilityChild?.completionPercent).toBe(100);
    expect(traceabilityChild?.description).toContain("traceabilityProof");
    expect(blockerPriorityChild?.completionPercent).toBe(100);
    expect(blockerPriorityChild?.description).toContain("blockerPriorityProof");
    expect(completionStatusChild?.completionPercent).toBe(100);
    expect(completionStatusChild?.description).toContain("phase4ProviderCompletionStatusProof");
    expect(completionStatusChild?.description).toContain("providerExecutionGateHeld proof");
    expect(completionStatusChild?.description).toContain("providerGate held proof");
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
        "phase-04-child-completion-status",
        "phase-04-child-refresh-safety-depth"
      ])
    );
    expect(phase4Goal?.nextAction).toContain("Phase 4 provider completion status proof attached");
    expect(phase4Goal?.nextAction).toContain("catalog-depth, refresh-safety, surface-depth, traceability, blocker-priority");
    expect(phase4Goal?.nextAction).toContain("providerExecutionGateHeld proof");
    expect(phase4Goal?.nextAction).toContain("PM-link");
    expect(phase4Goal?.nextAction).toContain("providerGate hold proof");
    expect(phase4Goal?.nextAction).toContain("Provider execution remains locked");
  });

  it("keeps the Phase 7 dispatch loop target linked to traceability and blocker priority", () => {
    const phase7Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-7-dispatch-loop");

    expect(phase7Goal).toMatchObject({
      target: "Planning and dispatch loop",
      priority: "high",
      status: "next",
      completionPercent: 100
    });
    expect(phase7Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-07-child-worker-preview",
        "phase-07-child-integration-owner",
        "phase-07-child-integration-ownership-depth",
        "phase-07-child-handoff-trace",
        "phase-07-child-review-depth",
        "phase-07-child-traceability",
        "phase-07-child-blocker-priority",
        "phase-07-child-artifact-verification",
        "phase-07-child-launch-gate",
        "phase-07-child-closure-gate",
        "phase-07-child-closeout-proof",
        "phase-07-child-owner-handoff-report",
        "phase-07-child-completion-gate"
      ])
    );
    expect(phase7Goal?.nextAction).toContain("traceability rows");
    expect(phase7Goal?.nextAction).toContain("local metadata handoff evidence");
    expect(phase7Goal?.nextAction).toContain("handoff packet integrity");
    expect(phase7Goal?.nextAction).toContain("current evidence fingerprint");
    expect(phase7Goal?.nextAction).toContain("offline dispatch-review artifact verification");
    expect(phase7Goal?.nextAction).toContain("owner-visible artifact verification counts");
    expect(phase7Goal?.nextAction).toContain("live-worker launch-gate proof");
    expect(phase7Goal?.nextAction).toContain("workerSession=held/sessionApproval=required/canCreateSession=no proof");
    expect(phase7Goal?.nextAction).toContain("metadata closure-gate proof");
    expect(phase7Goal?.nextAction).toContain("aggregate closeout proof");
    expect(phase7Goal?.nextAction).toContain("owner handoff report proof");
    expect(phase7Goal?.nextAction).toContain("phase7DispatchCompletionGate proof");
    expect(phase7Goal?.nextAction).toContain("dispatchReviewDepthProof");
    expect(phase7Goal?.nextAction).toContain("integrationOwnershipProof");
    expect(phase7Goal?.nextAction).toContain("dispatchTraceabilityProof");
    expect(phase7Goal?.nextAction).toContain("dispatchBlockerPriorityProof");
    expect(phase7Goal?.nextAction).toContain("blocker-priority queue");
    expect(phase7Goal?.nextAction).toContain("owner-visible Phase 7 dispatch proof");
    expect(phase7Goal?.nextAction).toContain("Phase 9 runner dependency review remains the current active implementation target");
    for (const rowId of phase7Goal?.pmTaskIds ?? []) {
      const row = createDefaultProjectManagementPhasePlan().find((task) => task.id === rowId);
      expect(row?.completionPercent, rowId).toBe(100);
    }
    const completionGateChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-07-child-completion-gate"
    );

    expect(completionGateChild?.description).toContain("workerSession=held");
    expect(completionGateChild?.description).toContain("sessionApproval=required");
    expect(completionGateChild?.description).toContain("canCreateSession=no");
  });

  it("keeps the Phase 10 Arena polish target linked to traceability and blocker priority", () => {
    const phase10Goal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-10-arena-polish");

    expect(phase10Goal).toMatchObject({
      target: "Adaptive Arena polish",
      priority: "medium",
      status: "next",
      completionPercent: 100
    });
    expect(phase10Goal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-10-child-layout-regression",
        "phase-10-child-density-polish",
        "phase-10-child-flexlayout-spike",
        "phase-10-child-term-scan",
        "phase-10-child-traceability",
        "phase-10-child-blocker-priority",
        "phase-10-child-closeout-status"
      ])
    );
    expect(phase10Goal?.goal).toContain("traceabilityProof");
    expect(phase10Goal?.goal).toContain("blockerPriorityProof");
    expect(phase10Goal?.nextAction).toContain("traceabilityProof rows");
    expect(phase10Goal?.nextAction).toContain("blockerPriorityProof queue");
    expect(phase10Goal?.nextAction).toContain("phase10ArenaPolishCloseoutStatusProof");
    expect(phase10Goal?.nextAction).toContain("owner-visible Phase 10 proof");
    expect(phase10Goal?.nextAction).toContain("npm.cmd run test:phase10:owner-visible");
    expect(packageJson.scripts["test:phase10:owner-visible"]).toBe(
      "vitest run src/phase10ArenaPolishOwnerVisible.test.tsx"
    );
    const phase10Epic = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-10-adaptive-arena"
    );
    const layoutFoundationParent = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-10-parent-layout-foundation"
    );
    const flexLayoutSpikeChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-10-child-flexlayout-spike"
    );
    const blockerPriorityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-10-child-blocker-priority"
    );
    const closeoutStatusChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-10-child-closeout-status"
    );
    expect(phase10Epic?.completionPercent).toBe(100);
    expect(phase10Epic?.description).toContain("npm.cmd run test:phase10:owner-visible");
    expect(phase10Epic?.description).toContain("traceabilityProof");
    expect(phase10Epic?.description).toContain("blockerPriorityProof");
    expect(phase10Epic?.description).toContain("phase10ArenaPolishCloseoutStatusProof");
    expect(layoutFoundationParent?.completionPercent).toBe(100);
    expect(flexLayoutSpikeChild?.completionPercent).toBe(100);
    expect(flexLayoutSpikeChild?.description).toContain("dependency-install status");
    expect(flexLayoutSpikeChild?.description).toContain("decisionProof");
    expect(flexLayoutSpikeChild?.description).toContain("traceabilityProof");
    expect(flexLayoutSpikeChild?.description).toContain("blockerPriorityProof");
    expect(flexLayoutSpikeChild?.description).toContain("phase10ArenaPolishCloseoutStatusProof");
    expect(flexLayoutSpikeChild?.description).toContain("custom adaptive-grid fallback");
    expect(blockerPriorityChild?.completionPercent).toBe(100);
    expect(blockerPriorityChild?.description).toContain("blockerPriorityProof open/kind/status");
    expect(blockerPriorityChild?.description).toContain("phase10ArenaPolishCloseoutStatusProof");
    expect(blockerPriorityChild?.description).toContain("Arena-review addressable count");
    expect(blockerPriorityChild?.description).toContain("top-priority action detail");
    expect(closeoutStatusChild?.completionPercent).toBe(100);
    expect(closeoutStatusChild?.description).toContain("phase10ArenaPolishCloseoutStatusProof");
  });

  it("keeps the Phase 11 owner and release targets linked to traceability and blocker priority", () => {
    const ownerGoal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-11-owner-command-center");
    const releaseGoal = remainingGoalPlan.find((goal) => goal.id === "goal-phase-11-release-readiness");

    expect(ownerGoal).toMatchObject({
      target: "Owner Testing command center",
      priority: "high",
      status: "next",
      completionPercent: 100
    });
    expect(ownerGoal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-11-child-owner-checklist",
        "phase-11-child-proof-freshness-depth",
        "phase-11-child-evidence-records",
        "phase-11-child-fresh-checkout",
        "phase-11-child-owner-command-closeout-status",
        "phase-11-child-traceability",
        "phase-11-child-blocker-priority"
      ])
    );
    expect(ownerGoal?.goal).toContain("proof freshness depth");
    expect(ownerGoal?.nextAction).toContain("Proof Freshness Depth");
    expect(ownerGoal?.nextAction).toContain("Evidence Records");
    expect(ownerGoal?.nextAction).toContain("PM-link");
    expect(ownerGoal?.nextAction).toContain("release-hold");
    expect(ownerGoal?.nextAction).toContain("owner release traceability");
    expect(ownerGoal?.nextAction).toContain("blocker-priority");
    expect(ownerGoal?.nextAction).toContain("Phase 11 owner command closeout status proof attached");
    expect(ownerGoal?.nextAction).toContain("packaging-paused");
    expect(ownerGoal?.nextAction).toContain("publishExecution/noPush");
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
    const freshCheckoutChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-child-fresh-checkout"
    );
    const traceabilityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-child-traceability"
    );
    const blockerPriorityChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-child-blocker-priority"
    );

    expect(phase11Epic?.completionPercent).toBe(100);
    expect(ownerTestingParent?.completionPercent).toBe(100);
    expect(ownerTestingParent?.description).toContain("phase11OwnerCommandCloseoutStatusProof");
    expect(ownerChecklistChild?.completionPercent).toBe(100);
    expect(ownerChecklistChild?.description).toContain("ready/total owner checklist counts");
    expect(ownerChecklistChild?.description).toContain("priority goal traces");
    expect(ownerChecklistChild?.description).toContain("phase11OwnerCommandCloseoutStatusProof");
    expect(proofFreshnessChild?.completionPercent).toBe(100);
    expect(proofFreshnessChild?.description).toContain("seven-row readiness");
    expect(proofFreshnessChild?.description).toContain("open-proof counts");
    expect(proofFreshnessChild?.description).toContain("phase11OwnerCommandCloseoutStatusProof");
    const evidenceRecordsChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-child-evidence-records"
    );
    const ownerCommandCloseoutChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-child-owner-command-closeout-status"
    );
    expect(evidenceRecordsChild?.completionPercent).toBe(100);
    expect(evidenceRecordsChild?.description).toContain("phase11OwnerCommandCloseoutStatusProof");
    expect(freshCheckoutChild?.completionPercent).toBe(100);
    expect(freshCheckoutChild?.description).toContain("structured evidence record states");
    expect(freshCheckoutChild?.description).toContain("held release-gate actions");
    expect(freshCheckoutChild?.description).toContain("phase11OwnerCommandCloseoutStatusProof");
    expect(ownerCommandCloseoutChild?.completionPercent).toBe(100);
    expect(ownerCommandCloseoutChild?.description).toContain("phase11OwnerCommandCloseoutStatusProof");
    expect(ownerCommandCloseoutChild?.description).toContain("publishExecution/noPush");
    expect(traceabilityChild?.completionPercent).toBe(100);
    expect(blockerPriorityChild?.completionPercent).toBe(100);
    expect(blockerPriorityChild?.description).toContain("open blocker count");
    expect(blockerPriorityChild?.description).toContain("top-priority action detail");
    expect(releaseGoal).toMatchObject({
      target: "Release readiness pass",
      priority: "high",
      status: "next",
      completionPercent: 100
    });
    const releasePackagingParent = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-parent-release-packaging"
    );
    const packageValidationChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-child-package-validation"
    );
    const signedAuditExportChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-child-signed-audit-export"
    );
    const releaseCloseoutChild = createDefaultProjectManagementPhasePlan().find(
      (task) => task.id === "phase-11-child-release-closeout-status"
    );
    expect(releasePackagingParent?.completionPercent).toBe(100);
    expect(packageValidationChild?.completionPercent).toBe(100);
    expect(signedAuditExportChild?.completionPercent).toBe(100);
    expect(releaseCloseoutChild?.completionPercent).toBe(100);
    expect(packageValidationChild?.description).toContain("packaging lock readiness");
    expect(packageValidationChild?.description).toContain("release-decision prerequisite detail");
    expect(signedAuditExportChild?.description).toContain("signed audit export metadata");
    expect(signedAuditExportChild?.description).toContain("rollback references");
    expect(releaseCloseoutChild?.description).toContain("phase11ReleaseCloseoutStatusProof");
    expect(releaseCloseoutChild?.description).toContain("publishExecution/noPush");
    expect(releaseGoal?.pmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-11-child-package-validation",
        "phase-11-child-signed-audit-export",
        "phase-11-child-traceability",
        "phase-11-child-blocker-priority",
        "phase-11-child-release-closeout-status"
      ])
    );
    expect(releaseGoal?.goal).toContain("structured evidence records");
    expect(releaseGoal?.goal).toContain("fresh-checkout");
    expect(releaseGoal?.goal).toContain("signed audit export and rollback reference evidence");
    expect(releaseGoal?.goal).toContain(
      "completed Phase 3 clearance PM traceability with handoff proof and proof-export evidence"
    );
    expect(releaseGoal?.goal).toContain(
      "current non-ready proof freshness row actions for handoff/proof-export review"
    );
    expect(releaseGoal?.nextAction).toContain("Phase 11 release closeout status proof attached");
    expect(releaseGoal?.nextAction).toContain("evidence records");
    expect(releaseGoal?.nextAction).toContain("signed audit export and rollback reference evidence");
    expect(releaseGoal?.nextAction).toContain("owner release traceability");
    expect(releaseGoal?.nextAction).toContain("packaging-paused evidence");
    expect(releaseGoal?.nextAction).toContain("publishExecution/noPush evidence");
    expect(releaseGoal?.nextAction).toContain("Release and publish execution actions remain paused");
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
