import { describe, expect, it } from "vitest";
import { buildFailureStateFixtures, summarizeFailureStateFixtures } from "./failureStateFixtures";
import { buildOwnerTestingChecklist } from "./ownerTestingChecklist";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3SmokeProofReadinessResult } from "./phase3SmokeProofReadiness";
import type { PhasePriorityEvidenceResult } from "./phasePriorityEvidence";
import type { RemainingGoalPlanSummary } from "./remainingGoalPlan";
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
    items: [],
    counts: { ready: 3, review: 0, blocked: 0, waiting: 0 },
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
    next: 10,
    planned: 0,
    paused: 0,
    averageCompletionPercent: 100,
    currentTarget: "Owner Testing command center",
    currentNextAction: "Keep Owner Testing as the release gate.",
    coveredPhaseCount: 11,
    remainingPhaseCount: 11,
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
    failureSummary: readyFailureSummary(),
    remainingGoalSummary: remainingSummary(),
    freshCheckoutState: "ready",
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
        currentTarget: "Unblock Phase 1/2/6 publishing",
        currentNextAction:
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
        expect.objectContaining({ label: "Phase readiness", status: "blocked" })
      ])
    );
    expect(result.nextAction).toContain("waiting, review, or blocked owner checklist");
  });

  it("waits for fresh-checkout evidence even when other release-gate signals are ready", () => {
    const result = snapshot({ freshCheckoutState: "waiting" });

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

  it("tracks proof freshness blockers and review rows", () => {
    const blocked = snapshot({
      phasePriorityEvidence: phasePriority({
        state: "blocked",
        counts: { ready: 2, review: 0, blocked: 1, waiting: 0 }
      })
    });
    const review = snapshot({
      phase3SmokeProofReadiness: smokeProof({
        state: "review",
        counts: { ready: 2, review: 1, blocked: 0, waiting: 0 }
      })
    });

    expect(blocked.state).toBe("blocked");
    expect(blocked.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Proof freshness", status: "blocked" })
      ])
    );
    expect(review.state).toBe("review");
    expect(review.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Proof freshness", status: "review" })
      ])
    );
  });

  it("keeps command center text public-safe", () => {
    const result = snapshot({
      remainingGoalSummary: remainingSummary({
        blocked: 1,
        currentTarget: "Review C:\\Users\\MJ\\Desktop\\secret-plan.md",
        currentNextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      })
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
