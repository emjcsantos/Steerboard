import { describe, expect, it } from "vitest";
import type { DesktopPackagingReadinessSnapshot } from "./desktopPackagingReadiness";
import {
  evaluatePhase11EvidenceRecord,
  type Phase11EvidenceGate
} from "./phase11EvidenceRecords";
import type { Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import { buildPhase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";
import {
  buildRemainingGoalPriorityTraces,
  type RemainingGoalPlanSummary
} from "./remainingGoalPlan";
import type { SecurityFinalReviewSnapshot } from "./securityFinalReview";

function ownerSnapshot(
  overrides: Partial<Phase11OwnerCommandCenterSnapshot> = {}
): Phase11OwnerCommandCenterSnapshot {
  return {
    id: "phase-11-owner-command-center",
    label: "Phase 11 Owner Testing command center",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canRelease: true,
    checklistReadiness: 100,
    phaseReadiness: 100,
    blockerCount: 0,
    readyCount: 6,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    nextAction: "Keep owner proof attached.",
    safety: "Evidence only.",
    ariaLabel: "Owner command ready.",
    items: [],
    priorityGoalTraceCount: 0,
    priorityGoalTraces: [],
    ...overrides
  };
}

function packagingSnapshot(
  overrides: Partial<DesktopPackagingReadinessSnapshot> = {}
): DesktopPackagingReadinessSnapshot {
  return {
    id: "desktop-packaging-readiness",
    label: "Desktop packaging readiness",
    state: "held",
    statusLabel: "Inputs ready",
    readiness: 80,
    canPackage: false,
    packagingLocked: true,
    detail: "Packaging inputs are prepared but actions stay locked.",
    safety: "Preview only.",
    items: [],
    ...overrides
  };
}

function securitySnapshot(
  overrides: Partial<SecurityFinalReviewSnapshot> = {}
): SecurityFinalReviewSnapshot {
  return {
    id: "security-final-review",
    label: "Security final review",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canCloseSecurity: true,
    canResumePackaging: false,
    detail: "Security review can close.",
    safety: "Evidence only.",
    ariaLabel: "Security ready.",
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
    currentTarget: "Release readiness pass",
    currentNextAction: "Attach release readiness proof.",
    ownerHoldTarget: "No owner hold",
    ownerHoldNextAction: "No owner hold action.",
    coveredPhaseCount: 11,
    remainingPhaseCount: 11,
    priorityGoalTraceCount: 9,
    priorityGoalTraces: buildRemainingGoalPriorityTraces(),
    ...overrides
  };
}

function readyEvidence(gate: Phase11EvidenceGate) {
  return evaluatePhase11EvidenceRecord(
    gate,
    {
      gate,
      state: "ready",
      source: `owner ${gate}`,
      recordedAt: "2026-06-17T10:00:00.000Z",
      detail: `${gate} passed.`
    },
    "2026-06-17T12:00:00.000Z"
  );
}

function snapshot(
  overrides: Partial<Parameters<typeof buildPhase11ReleaseReadinessSnapshot>[0]> = {}
) {
  return buildPhase11ReleaseReadinessSnapshot({
    ownerCommandCenter: ownerSnapshot(),
    desktopPackaging: packagingSnapshot(),
    securityFinalReview: securitySnapshot(),
    remainingGoalSummary: remainingSummary(),
    cleanCheckoutEvidence: readyEvidence("clean-checkout"),
    buildTestEvidence: readyEvidence("build-test"),
    docsKnownLimitsEvidence: readyEvidence("docs-known-limits"),
    ...overrides
  });
}

describe("phase 11 release readiness", () => {
  it("can recommend release only when every evidence row is ready and packaging remains locked", () => {
    const result = snapshot();

    expect(result.state).toBe("ready");
    expect(result.readiness).toBe(100);
    expect(result.canRecommendRelease).toBe(true);
    expect(result.releaseHoldCount).toBe(0);
    expect(result.items.every((item) => item.status === "ready")).toBe(true);
    expect(result.ariaLabel).toContain("0 holds");
  });

  it("does not recommend release from state-only ready flags without evidence records", () => {
    const result = snapshot({
      cleanCheckoutEvidence: undefined,
      buildTestEvidence: undefined,
      docsKnownLimitsEvidence: undefined,
      cleanCheckoutState: "ready",
      buildTestState: "ready",
      docsKnownLimitsState: "ready"
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Clean checkout",
          status: "review",
          detail: expect.stringContaining("structured evidence record")
        }),
        expect.objectContaining({
          label: "Build and test",
          status: "review",
          detail: expect.stringContaining("structured evidence record")
        }),
        expect.objectContaining({
          label: "Docs and known limits",
          status: "review",
          detail: expect.stringContaining("structured evidence record")
        }),
        expect.objectContaining({
          label: "Release decision",
          status: "review"
        })
      ])
    );
  });

  it("keeps the current release pass held when proof and clean-run evidence are missing", () => {
    const result = snapshot({
      ownerCommandCenter: ownerSnapshot({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 45,
        canRelease: false,
        blockerCount: 1,
        nextAction: "Keep the branch local and push only after the owner says to push."
      }),
      remainingGoalSummary: remainingSummary({
        blocked: 1,
        active: 1,
        next: 7,
        paused: 1,
        averageCompletionPercent: 48,
        currentTarget: "Phase 3 desktop proof clearance",
        currentNextAction: "Use Phase 3 command plan and handoff gate.",
        ownerHoldTarget: "Unblock Phase 1/2/6 publishing",
        ownerHoldNextAction:
          "Keep the branch local, preserve the proof commit, and push only after the owner says to push."
      }),
      cleanCheckoutEvidence: undefined,
      buildTestEvidence: undefined,
      docsKnownLimitsEvidence: undefined,
      cleanCheckoutState: "waiting",
      buildTestState: "waiting",
      docsKnownLimitsState: "review"
    });

    expect(result.state).toBe("blocked");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.releaseHoldCount).toBe(5);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Clean checkout", status: "waiting" }),
        expect.objectContaining({ label: "Build and test", status: "waiting" }),
        expect.objectContaining({ label: "Owner smoke proof", status: "blocked" }),
        expect.objectContaining({ label: "Packaging lock", status: "ready" }),
        expect.objectContaining({ label: "Docs and known limits", status: "review" }),
        expect.objectContaining({ label: "Release decision", status: "blocked" })
      ])
    );
    expect(result.nextAction).toContain("owner says to push");
  });

  it("blocks release readiness when packaging or resume controls are open", () => {
    const unlocked = snapshot({
      desktopPackaging: packagingSnapshot({
        canPackage: true,
        packagingLocked: false
      })
    });
    const resumable = snapshot({
      securityFinalReview: securitySnapshot({
        canResumePackaging: true
      })
    });

    expect(unlocked.state).toBe("blocked");
    expect(unlocked.canRecommendRelease).toBe(false);
    expect(unlocked.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Packaging lock", status: "blocked" })
      ])
    );
    expect(resumable.state).toBe("blocked");
    expect(resumable.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Packaging lock", status: "blocked" })
      ])
    );
  });

  it("keeps docs and known limits in review when every other release input is ready", () => {
    const result = snapshot({
      docsKnownLimitsEvidence: undefined,
      docsKnownLimitsState: "review"
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Docs and known limits", status: "review" }),
        expect.objectContaining({ label: "Release decision", status: "review" })
      ])
    );
  });

  it("maps structured release evidence records into clean checkout, build, and docs gates", () => {
    const result = snapshot({
      cleanCheckoutEvidence: evaluatePhase11EvidenceRecord(
        "clean-checkout",
        {
          gate: "clean-checkout",
          state: "ready",
          source: "owner fresh checkout",
          recordedAt: "2026-06-12T10:00:00.000Z",
          detail: "Clean checkout passed."
        },
        "2026-06-17T12:00:00.000Z"
      ),
      buildTestEvidence: evaluatePhase11EvidenceRecord(
        "build-test",
        {
          gate: "build-test",
          state: "ready",
          source: "owner build",
          recordedAt: "2026-06-17T10:00:00.000Z",
          detail: "Build and tests passed."
        },
        "2026-06-17T12:00:00.000Z"
      ),
      docsKnownLimitsEvidence: evaluatePhase11EvidenceRecord(
        "docs-known-limits",
        undefined,
        "2026-06-17T12:00:00.000Z"
      )
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Clean checkout",
          status: "review",
          detail: expect.stringContaining("stale")
        }),
        expect.objectContaining({
          label: "Build and test",
          status: "ready",
          detail: expect.stringContaining("owner build")
        }),
        expect.objectContaining({
          label: "Docs and known limits",
          status: "waiting",
          detail: expect.stringContaining("has not been recorded")
        })
      ])
    );
  });

  it("keeps release readiness text public-safe", () => {
    const result = snapshot({
      ownerCommandCenter: ownerSnapshot({
        state: "blocked",
        statusLabel: "Blocked",
        canRelease: false,
        nextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      }),
      remainingGoalSummary: remainingSummary({
        currentTarget: "Review C:\\Users\\MJ\\Desktop\\secret-plan.md",
        currentNextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
        ownerHoldTarget: "Hold C:\\Users\\MJ\\Desktop\\secret-release.md",
        ownerHoldNextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret-release.md with token sk-OWNER1234567890 <unsafe>"
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
    expect(combinedText).not.toContain("sk-OWNER1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
