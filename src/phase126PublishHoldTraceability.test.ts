import { describe, expect, it } from "vitest";
import { buildPhase126PublishHoldTraceability } from "./phase126PublishHoldTraceability";
import type { PhasePriorityEvidenceResult } from "./phasePriorityEvidence";
import { remainingGoalPlan, type RemainingGoalPlanItem } from "./remainingGoalPlan";

function priorityEvidence(
  overrides: Partial<PhasePriorityEvidenceResult> = {}
): PhasePriorityEvidenceResult {
  return {
    state: "ready",
    readiness: 100,
    statusLabel: "Ready",
    detail: "Tracks the current Phase 1, Phase 2, and Phase 6 priority slice without running live actions automatically.",
    counts: { ready: 3, review: 0, blocked: 0, waiting: 0 },
    items: [
      {
        id: "phase-1-live-panel",
        label: "Phase 1 live Arena panel",
        state: "ready",
        readiness: 100,
        detail: "One live Arena panel has proof.",
        nextAction: "Keep this as the one-panel regression proof."
      },
      {
        id: "phase-2-panel-isolation",
        label: "Phase 2 multi-panel isolation",
        state: "ready",
        readiness: 100,
        detail: "Two live panels completed without cross-talk.",
        nextAction: "Keep two-panel smoke as isolation proof."
      },
      {
        id: "phase-6-pm-board",
        label: "Phase 6 PM phase board",
        state: "ready",
        readiness: 100,
        detail: "Project Management board has staged package coverage.",
        nextAction: "Use row-level Run buttons to stage Arena review packages."
      }
    ],
    ...overrides
  };
}

function readyPublishGoal(): RemainingGoalPlanItem[] {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-1-2-6-publish"
      ? {
          ...goal,
          pmTaskIds: Array.from(new Set([
            ...goal.pmTaskIds,
            "phase-01-child-live-start",
            "phase-01-child-stream-evidence",
            "phase-01-parent-owner-check",
            "phase-01-child-reload-proof",
            "phase-02-child-two-panel-smoke",
            "phase-02-child-no-cross-talk",
            "phase-02-parent-session-persistence",
            "phase-02-child-restore-panels",
            "phase-06-child-current-phase-map",
            "phase-06-child-saved-state-upgrade",
            "phase-06-parent-arena-staging",
            "phase-06-child-run-context",
            "phase-06-child-publish-hold-traceability",
            "phase-06-child-publish-hold-blocker-priority"
          ]))
        }
      : goal
  );
}

function trace(
  overrides: Partial<Parameters<typeof buildPhase126PublishHoldTraceability>[0]> = {}
) {
  return buildPhase126PublishHoldTraceability({
    phasePriorityEvidence: priorityEvidence(),
    goals: readyPublishGoal(),
    ...overrides
  });
}

describe("phase 1/2/6 publish hold traceability", () => {
  it("links the publish goal, PM rows, priority proof, and owner publish hold", () => {
    const result = trace();

    expect(result.state).toBe("blocked");
    expect(result.canTrustLocalHold).toBe(true);
    expect(result.linkedGoalId).toBe("goal-phase-1-2-6-publish");
    expect(result.linkedPhaseCount).toBe(3);
    expect(result.missingPmTaskIds).toEqual([]);
    expect(result.requiredPmTaskCount).toBe(20);
    expect(result.linkedRequiredPmTaskCount).toBe(20);
    expect(result.linkedRequiredPmTaskKindCounts).toEqual({
      epic: 3,
      parent: 6,
      child: 11
    });
    expect(result.readyPriorityEvidenceCount).toBe(3);
    expect(result.requiredPriorityEvidenceCount).toBe(3);
    expect(result.localHoldEvidenceKey).toBe(
      "goal=goal-phase-1-2-6-publish phases=3/3 pm=20/20 trustedPm=20/20 epics=3 parents=6 children=11 priority=3/3 hold=blocked"
    );
    expect(result.publishHoldStatus).toBe("blocked");
    expect(result.ariaLabel).toContain(
      "Phase 1/2/6 publish hold traceability: Blocked; 67% ready; 3 phases; 20 PM links; 20/20 trusted PM links; 3 Epics, 6 Parents, 11 Children; 3/3 priority proofs; 2 blocked; 0 waiting; publish hold blocked; local hold evidence goal=goal-phase-1-2-6-publish phases=3/3 pm=20/20 trustedPm=20/20 epics=3 parents=6 children=11 priority=3/3 hold=blocked; next action:"
    );
    expect(result.items.map((item) => item.kind)).toEqual([
      "publish-goal",
      "pm-coverage",
      "phase-1-proof",
      "phase-2-proof",
      "phase-6-board",
      "publish-hold"
    ]);
  });

  it("reports missing publish-hold traceability and blocker-priority PM children", () => {
    const goals = readyPublishGoal().map((goal) =>
      goal.id === "goal-phase-1-2-6-publish"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter(
              (taskId) =>
                taskId !== "phase-06-child-publish-hold-traceability" &&
                taskId !== "phase-06-child-publish-hold-blocker-priority"
            )
          }
        : goal
    );
    const result = trace({ goals });

    expect(result.state).toBe("blocked");
    expect(result.canTrustLocalHold).toBe(false);
    expect(result.linkedRequiredPmTaskCount).toBe(18);
    expect(result.linkedRequiredPmTaskKindCounts).toEqual({
      epic: 3,
      parent: 6,
      child: 9
    });
    expect(result.ariaLabel).toContain(
      "Phase 1/2/6 publish hold traceability: Blocked; 50% ready; 3 phases; 18 PM links; 18/20 trusted PM links; 3 Epics, 6 Parents, 9 Children; 3/3 priority proofs; 3 blocked; 0 waiting; publish hold blocked; local hold evidence goal=goal-phase-1-2-6-publish phases=3/3 pm=18/20 trustedPm=18/20 epics=3 parents=6 children=9 priority=3/3 hold=blocked; next action:"
    );
    expect(result.missingPmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-06-child-publish-hold-traceability",
        "phase-06-child-publish-hold-blocker-priority"
      ])
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "pm-coverage", status: "blocked" })
      ])
    );
  });

  it("keeps proof gaps visible separately from the owner publish hold", () => {
    const result = trace({
      phasePriorityEvidence: priorityEvidence({
        state: "waiting",
        readiness: 78,
        counts: { ready: 2, review: 0, blocked: 0, waiting: 1 },
        items: [
          ...priorityEvidence().items.slice(0, 2),
          {
            id: "phase-6-pm-board",
            label: "Phase 6 PM phase board",
            state: "waiting",
            readiness: 35,
            detail: "PM staging proof is missing.",
            nextAction: "Repair saved PM state."
          }
        ]
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.canTrustLocalHold).toBe(false);
    expect(result.ariaLabel).toContain(
      "Phase 1/2/6 publish hold traceability: Blocked; 56% ready; 3 phases; 20 PM links; 20/20 trusted PM links; 3 Epics, 6 Parents, 11 Children; 2/3 priority proofs; 2 blocked; 1 waiting; publish hold blocked; local hold evidence goal=goal-phase-1-2-6-publish phases=3/3 pm=20/20 trustedPm=20/20 epics=3 parents=6 children=11 priority=2/3 hold=blocked; next action:"
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "phase-6-board", status: "waiting" }),
        expect.objectContaining({ kind: "publish-hold", status: "blocked" })
      ])
    );
  });

  it("does not trust the local hold when a required priority proof row is missing", () => {
    const result = trace({
      phasePriorityEvidence: priorityEvidence({
        items: priorityEvidence().items.filter((item) => item.id !== "phase-2-panel-isolation")
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.canTrustLocalHold).toBe(false);
    expect(result.ariaLabel).toContain(
      "Phase 1/2/6 publish hold traceability: Blocked; 50% ready; 3 phases; 20 PM links; 20/20 trusted PM links; 3 Epics, 6 Parents, 11 Children; 2/3 priority proofs; 3 blocked; 0 waiting; publish hold blocked; local hold evidence goal=goal-phase-1-2-6-publish phases=3/3 pm=20/20 trustedPm=20/20 epics=3 parents=6 children=11 priority=2/3 hold=blocked; next action:"
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "phase-2-proof",
          status: "blocked",
          detail: expect.stringContaining("missing")
        }),
        expect.objectContaining({ kind: "publish-hold", status: "blocked" })
      ])
    );
  });

  it("keeps traceability text public-safe", () => {
    const result = trace({
      goals: readyPublishGoal().map((goal) =>
        goal.id === "goal-phase-1-2-6-publish"
          ? {
              ...goal,
              nextAction:
                "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
            }
          : goal
      )
    });
    const combinedText = [
      result.label,
      result.nextAction,
      result.safety,
      result.ariaLabel,
      ...result.items.flatMap((item) => [item.label, item.detail, item.nextAction])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
