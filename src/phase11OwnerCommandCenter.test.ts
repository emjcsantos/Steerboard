import { describe, expect, it } from "vitest";
import { buildFailureStateFixtures, summarizeFailureStateFixtures } from "./failureStateFixtures";
import { buildOwnerTestingChecklist } from "./ownerTestingChecklist";
import { evaluatePhase11EvidenceRecord } from "./phase11EvidenceRecords";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3SmokeProofReadinessResult } from "./phase3SmokeProofReadiness";
import type { Phase11ProofFreshnessDepthSnapshot } from "./phase11ProofFreshnessDepth";
import type { PhasePriorityEvidenceResult } from "./phasePriorityEvidence";
import {
  buildRemainingGoalPriorityTraces,
  type RemainingGoalPlanSummary
} from "./remainingGoalPlan";
import { buildPhase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";

function readyChecklist() {
  return buildOwnerTestingChecklist({
    launch: "ready",
    connect: "ready",
    chat: "ready",
    "multi-panel": "ready",
    controls: "ready",
    "slash-commands": "ready",
    catalogs: "ready",
    "catalog-command-refresh": "ready",
    "catalog-skill-refresh": "ready",
    "catalog-plugin-refresh": "ready",
    "catalog-mcp-refresh": "ready",
    "catalog-automation-refresh": "ready",
    "catalog-personalization-refresh": "ready",
    migration: "ready",
    planning: "ready",
    dispatch: "ready",
    permissions: "ready",
    reload: "ready",
    recovery: "ready"
  });
}

function phasePriority(
  overrides: Partial<PhasePriorityEvidenceResult> = {}
): PhasePriorityEvidenceResult {
  return {
    state: "ready",
    readiness: 100,
    statusLabel: "Ready",
    detail: "Priority proof is ready.",
    counts: { ready: 3, review: 0, blocked: 0, waiting: 0 },
    items: [],
    ...overrides
  };
}

function phase3Clearance(
  overrides: Partial<Phase3ClearancePackage> = {}
): Phase3ClearancePackage {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canExit: true,
    detail: "Phase 3 is clear.",
    nextAction: "Record Phase 3 handoff.",
    readyCount: 5,
    openCount: 0,
    blockerCount: 0,
    reviewCount: 0,
    waitingCount: 0,
    blockers: [],
    safety: "Evidence only.",
    ...overrides
  };
}

function smokeProof(
  overrides: Partial<Phase3SmokeProofReadinessResult> = {}
): Phase3SmokeProofReadinessResult {
  return {
    state: "ready",
    readiness: 100,
    evaluatedAt: "2026-06-06T00:01:00.000Z",
    maxProofAgeMs: 7 * 24 * 60 * 60 * 1000,
    items: [],
    counts: { ready: 3, review: 0, blocked: 0, waiting: 0 },
    ...overrides
  };
}

function proofFreshnessDepth(
  overrides: Partial<Phase11ProofFreshnessDepthSnapshot> = {}
): Phase11ProofFreshnessDepthSnapshot {
  return {
    id: "phase-11-proof-freshness-depth",
    label: "Phase 11 proof freshness depth",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canTrustOwnerProof: true,
    readyCount: 6,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    openProofCount: 0,
    nextAction: "Keep owner proof attached and fresh.",
    safety: "Evidence only.",
    ariaLabel: "Proof depth ready.",
    items: [],
    ...overrides
  };
}

function remainingSummary(
  overrides: Partial<RemainingGoalPlanSummary> = {}
): RemainingGoalPlanSummary {
  return {
    total: 10,
    blocked: 0,
    active: 0,
    next: 0,
    planned: 0,
    paused: 0,
    averageCompletionPercent: 100,
    currentTarget: "Owner Testing command center",
    currentNextAction: "Keep Owner Testing as the release gate.",
    ownerHoldTarget: "No owner hold",
    ownerHoldNextAction: "No owner hold action.",
    coveredPhaseCount: 11,
    remainingPhaseCount: 11,
    priorityGoalTraceCount: 9,
    priorityGoalTraces: buildRemainingGoalPriorityTraces(),
    ...overrides
  };
}

function readyFailureSummary() {
  return summarizeFailureStateFixtures(
    buildFailureStateFixtures({
      "failure-offline-runtime": { state: "ready", severity: "info" },
      "failure-missing-auth": { state: "ready", severity: "info" },
      "failure-app-server-unavailable": { state: "ready", severity: "info" },
      "failure-stream-timeout": { state: "ready", severity: "info" },
      "failure-unsupported-capability": { state: "ready", severity: "info" },
      "failure-rate-limit": { state: "ready", severity: "info" }
    })
  );
}

function snapshot(
  overrides: Partial<Parameters<typeof buildPhase11OwnerCommandCenterSnapshot>[0]> = {}
) {
  return buildPhase11OwnerCommandCenterSnapshot({
    checklist: readyChecklist(),
    phasePriorityEvidence: phasePriority(),
    phase3ClearancePackage: phase3Clearance(),
    phase3SmokeProofReadiness: smokeProof(),
    proofFreshnessDepth: proofFreshnessDepth(),
    failureSummary: readyFailureSummary(),
    remainingGoalSummary: remainingSummary(),
    freshCheckoutState: "ready",
    freshCheckoutEvidence: evaluatePhase11EvidenceRecord(
      "fresh-checkout",
      {
        gate: "fresh-checkout",
        state: "ready",
        source: "owner checkout",
        recordedAt: "2026-06-17T10:00:00.000Z",
        detail: "Fresh checkout install, test, build, and desktop run passed."
      },
      "2026-06-17T12:00:00.000Z"
    ),
    ...overrides
  });
}

describe("phase 11 owner command center", () => {
  it("is release-ready when checklist, proofs, blockers, phases, next action, and fresh checkout are ready", () => {
    const result = snapshot();

    expect(result.state).toBe("ready");
    expect(result.canRelease).toBe(true);
    expect(result.readiness).toBe(100);
    expect(result.blockerCount).toBe(0);
    expect(result.items.every((item) => item.status === "ready")).toBe(true);
    expect(result.ariaLabel).toContain("0 blockers");
  });

  it("keeps the command center blocked when remaining goal and failure blockers exist", () => {
    const result = snapshot({
      checklist: buildOwnerTestingChecklist({
        launch: "ready",
        connect: "blocked"
      }),
      failureSummary: summarizeFailureStateFixtures(),
      remainingGoalSummary: remainingSummary({
        blocked: 1,
        active: 1,
        averageCompletionPercent: 44,
        currentTarget: "Phase 3 desktop proof clearance",
        currentNextAction: "Use Phase 3 command plan and handoff gate.",
        ownerHoldTarget: "Unblock Phase 1/2/6 publishing",
        ownerHoldNextAction:
          "Keep the branch local and push only after the owner says to push."
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.canRelease).toBe(false);
    expect(result.blockerCount).toBeGreaterThan(1);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Owner checklist", status: "blocked" }),
        expect.objectContaining({ label: "Blocker triage", status: "blocked" }),
        expect.objectContaining({
          label: "Phase readiness",
          status: "blocked",
          detail: expect.stringContaining("owner hold")
        })
      ])
    );
    expect(result.nextAction).toContain("waiting, review, or blocked owner checklist");
  });

  it("waits for fresh-checkout evidence even when other release-gate signals are ready", () => {
    const result = snapshot({
      freshCheckoutState: "waiting",
      freshCheckoutEvidence: undefined
    });

    expect(result.state).toBe("waiting");
    expect(result.canRelease).toBe(false);
    expect(result.waitingCount).toBe(1);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Fresh checkout",
          status: "waiting",
          nextAction: "Run the fresh-checkout checklist once live workflow blockers are cleared."
        })
      ])
    );
  });

  it("reviews state-only ready fresh checkout without structured evidence", () => {
    const result = snapshot({ freshCheckoutEvidence: undefined });

    expect(result.state).toBe("review");
    expect(result.canRelease).toBe(false);
    expect(result.reviewCount).toBe(1);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Fresh checkout",
          status: "review",
          detail: expect.stringContaining("structured evidence record"),
          nextAction: "Attach fresh-checkout evidence metadata before the Owner Testing command center can release."
        })
      ])
    );
  });

  it("keeps release held while active or next remaining goals exist", () => {
    const result = snapshot({
      remainingGoalSummary: remainingSummary({
        active: 1,
        next: 2,
        averageCompletionPercent: 64,
        currentTarget: "Phase 3 desktop proof clearance",
        currentNextAction: "Clear the current Phase 3 proof blocker before release readiness."
      })
    });

    expect(result.state).toBe("review");
    expect(result.canRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Phase readiness",
          status: "review",
          detail: expect.stringContaining("1 active and 2 next remaining goals remain"),
          nextAction: "Clear the current Phase 3 proof blocker before release readiness."
        })
      ])
    );
  });

  it("uses structured fresh-checkout evidence in the owner command center", () => {
    const result = snapshot({
      freshCheckoutEvidence: evaluatePhase11EvidenceRecord(
        "fresh-checkout",
        {
          gate: "fresh-checkout",
          state: "ready",
          source: "owner checkout",
          recordedAt: "2026-06-17T10:00:00.000Z",
          detail: "Fresh checkout install, test, build, and desktop run passed."
        },
        "2026-06-17T12:00:00.000Z"
      )
    });

    expect(result.state).toBe("ready");
    expect(result.canRelease).toBe(true);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Fresh checkout",
          status: "ready",
          detail: expect.stringContaining("owner checkout"),
          nextAction: expect.stringContaining("fresh-checkout evidence attached")
        })
      ])
    );
  });

  it("tracks proof freshness depth blockers and review rows", () => {
    const blocked = snapshot({
      proofFreshnessDepth: proofFreshnessDepth({
        state: "blocked",
        statusLabel: "Blocked",
        canTrustOwnerProof: false,
        readyCount: 5,
        blockedCount: 1,
        openProofCount: 1,
        nextAction: "Phase 1/2/6 proof is blocked."
      })
    });
    const review = snapshot({
      proofFreshnessDepth: proofFreshnessDepth({
        state: "review",
        statusLabel: "Review",
        canTrustOwnerProof: false,
        readyCount: 5,
        reviewCount: 1,
        openProofCount: 1,
        nextAction:
          "Rerun npm.cmd run smoke:phase3 manually, then record a fresh local CLI pass."
      })
    });

    expect(blocked.state).toBe("blocked");
    expect(blocked.canRelease).toBe(false);
    expect(blocked.blockerCount).toBe(1);
    expect(blocked.nextAction).toBe("Phase 1/2/6 proof is blocked.");
    expect(blocked.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Proof freshness", status: "blocked" })
      ])
    );
    expect(review.state).toBe("review");
    expect(review.canRelease).toBe(false);
    expect(review.nextAction).toContain("fresh local CLI pass");
    expect(review.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Proof freshness",
          status: "review",
          nextAction:
            "Rerun npm.cmd run smoke:phase3 manually, then record a fresh local CLI pass."
        })
      ])
    );
  });

  it("keeps release held when Phase 1/2/6 priority proof is blocked despite ready proof freshness", () => {
    const result = snapshot({
      phasePriorityEvidence: phasePriority({
        state: "blocked",
        readiness: 72,
        statusLabel: "Blocked",
        detail: "Priority proof has one blocked row.",
        counts: { ready: 2, review: 0, blocked: 1, waiting: 0 },
        items: [
          {
            id: "phase-6-pm-board",
            label: "Phase 6 PM phase board",
            state: "blocked",
            readiness: 15,
            detail: "Project Management board cannot stage a child row.",
            nextAction: "Repair PM child staging before release readiness."
          }
        ]
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.canRelease).toBe(false);
    expect(result.blockerCount).toBe(1);
    expect(result.ariaLabel).toContain("1 blockers");
    expect(result.nextAction).toBe("Repair PM child staging before release readiness.");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Phase 1/2/6 priority proof",
          status: "blocked",
          detail: expect.stringContaining("Priority proof has one blocked row"),
          nextAction: "Repair PM child staging before release readiness."
        }),
        expect.objectContaining({
          label: "Proof freshness",
          status: "ready"
        })
      ])
    );
  });

  it("keeps release held when Phase 3 clearance is blocked despite ready proof freshness", () => {
    const result = snapshot({
      phase3ClearancePackage: phase3Clearance({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 84,
        canExit: false,
        openCount: 1,
        blockerCount: 1,
        reviewCount: 0,
        waitingCount: 0,
        blockers: [
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "blocked",
            detail: "Provider-routed slash execution evidence is blocked.",
            nextAction: "Refresh slash execution evidence from the current Arena panel transcript.",
            pmTaskId: "phase-03-child-slash-ready",
            evidenceKey: "phase3.slash-execution"
          }
        ],
        nextAction: "Refresh slash execution evidence from the current Arena panel transcript."
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.canRelease).toBe(false);
    expect(result.blockerCount).toBe(1);
    expect(result.nextAction).toBe(
      "Refresh slash execution evidence from the current Arena panel transcript."
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Phase 3 clearance",
          status: "blocked",
          detail: expect.stringContaining("phase-03-child-slash-ready / phase3.slash-execution"),
          nextAction: "Refresh slash execution evidence from the current Arena panel transcript."
        }),
        expect.objectContaining({
          label: "Proof freshness",
          status: "ready"
        })
      ])
    );
  });

  it("keeps release held when Phase 3 desktop smoke proof is stale despite ready proof freshness", () => {
    const result = snapshot({
      phase3SmokeProofReadiness: smokeProof({
        state: "review",
        readiness: 65,
        counts: { ready: 2, review: 1, blocked: 0, waiting: 0 },
        items: [
          {
            proof: "active-turn-steer",
            label: "Active-turn steer desktop smoke proof",
            state: "review",
            source: "desktop",
            checkedAt: "2026-06-01T00:00:00.000Z",
            persisted: true,
            detail: "Active-turn steer desktop smoke proof is stale."
          }
        ]
      })
    });

    expect(result.state).toBe("review");
    expect(result.canRelease).toBe(false);
    expect(result.nextAction).toBe(
      "Refresh Phase 3 desktop smoke proof for Active-turn steer desktop smoke proof before release readiness."
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Phase 3 desktop smoke proof",
          status: "review",
          detail: expect.stringContaining("Active-turn steer desktop smoke proof is stale"),
          nextAction:
            "Refresh Phase 3 desktop smoke proof for Active-turn steer desktop smoke proof before release readiness."
        }),
        expect.objectContaining({
          label: "Proof freshness",
          status: "ready"
        })
      ])
    );
  });

  it("keeps release held when proof freshness depth is waiting on handoff proof", () => {
    const result = snapshot({
      proofFreshnessDepth: proofFreshnessDepth({
        state: "waiting",
        statusLabel: "Waiting",
        canTrustOwnerProof: false,
        readyCount: 5,
        waitingCount: 1,
        openProofCount: 1,
        nextAction: "Record the owner-reviewed Phase 3 handoff."
      })
    });

    expect(result.state).toBe("waiting");
    expect(result.canRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Proof freshness",
          status: "waiting",
          nextAction: "Record the owner-reviewed Phase 3 handoff."
        })
      ])
    );
  });

  it("exposes prioritized remaining goal and PM task trace links", () => {
    const result = snapshot();

    expect(result.priorityGoalTraceCount).toBeGreaterThan(0);
    expect(result.priorityGoalTraces.map((trace) => trace.goalId).slice(0, 2)).toEqual([
      "goal-phase-3-proof-clearance",
      "goal-phase-1-2-6-publish"
    ]);
    expect(result.priorityGoalTraces[0].current).toBe(true);
    expect(result.priorityGoalTraces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          goalId: "goal-phase-11-owner-command-center",
          priority: "high",
          phaseIds: ["phase-11-owner-packaging"],
          pmTaskIds: expect.arrayContaining(["phase-11-child-evidence-records"])
        })
      ])
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Phase readiness",
          detail: expect.stringContaining("Top priority")
        })
      ])
    );
  });

  it("keeps command center text public-safe", () => {
    const result = snapshot({
      remainingGoalSummary: remainingSummary({
        blocked: 1,
        currentTarget: "Review C:\\Users\\MJ\\Desktop\\secret-plan.md",
        currentNextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
        ownerHoldTarget: "Hold C:\\Users\\MJ\\Desktop\\secret-release.md",
        ownerHoldNextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret-release.md with token sk-OWNER1234567890 <unsafe>",
        priorityGoalTraces: [
          {
            goalId: "goal-unsafe",
            target: "Review C:\\Users\\MJ\\Desktop\\secret-plan.md",
            status: "blocked",
            priority: "critical",
            completionPercent: 10,
            phaseIds: ["phase-unsafe"],
            pmTaskIds: ["task-unsafe"],
            nextAction:
              "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
            current: true
          }
        ],
        priorityGoalTraceCount: 1
      })
    });
    const combinedText = [
      result.label,
      result.nextAction,
      result.safety,
      result.ariaLabel,
      ...result.items.flatMap((item) => [item.label, item.detail, item.nextAction]),
      ...result.priorityGoalTraces.flatMap((trace) => [
        trace.goalId,
        trace.target,
        trace.phaseIds.join(" "),
        trace.pmTaskIds.join(" "),
        trace.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("sk-OWNER1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
