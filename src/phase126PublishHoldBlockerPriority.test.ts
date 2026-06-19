import { describe, expect, it } from "vitest";
import { buildPhase126PublishHoldBlockerPriority } from "./phase126PublishHoldBlockerPriority";
import type { Phase126PublishHoldTraceabilitySummary } from "./phase126PublishHoldTraceability";
import type { PhasePriorityEvidenceResult } from "./phasePriorityEvidence";

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

function traceability(
  overrides: Partial<Phase126PublishHoldTraceabilitySummary> = {}
): Phase126PublishHoldTraceabilitySummary {
  return {
    id: "phase-1-2-6-publish-hold-traceability",
    label: "Phase 1/2/6 publish hold traceability",
    state: "blocked",
    statusLabel: "Blocked",
    readiness: 67,
    canTrustLocalHold: true,
    readyCount: 4,
    reviewCount: 0,
    blockedCount: 2,
    waitingCount: 0,
    missingPmTaskIds: [],
    linkedGoalId: "goal-phase-1-2-6-publish",
    linkedPhaseCount: 3,
    linkedPmTaskCount: 20,
    publishHoldStatus: "blocked",
    nextAction: "Keep the branch local and push only after the owner says to push.",
    safety: "Evidence only.",
    ariaLabel: "Traceability blocked.",
    items: [
      {
        id: "phase-1-2-6-publish-hold-traceability:publish-goal",
        label: "Publish hold goal",
        kind: "publish-goal",
        status: "blocked",
        detail: "Publish goal is blocked by owner approval.",
        nextAction: "Keep the branch local and push only after the owner says to push."
      },
      {
        id: "phase-1-2-6-publish-hold-traceability:pm-coverage",
        label: "PM row coverage",
        kind: "pm-coverage",
        status: "ready",
        detail: "PM coverage is complete.",
        nextAction: "Keep PM links aligned."
      },
      {
        id: "phase-1-2-6-publish-hold-traceability:publish-hold",
        label: "Publish hold",
        kind: "publish-hold",
        status: "blocked",
        detail: "Publishing remains intentionally blocked.",
        nextAction: "Keep the branch local and push only after the owner says to push."
      }
    ],
    ...overrides
  };
}

function priority(
  overrides: Partial<Parameters<typeof buildPhase126PublishHoldBlockerPriority>[0]> = {}
) {
  return buildPhase126PublishHoldBlockerPriority({
    phasePriorityEvidence: priorityEvidence(),
    traceability: traceability(),
    ...overrides
  });
}

describe("phase 1/2/6 publish hold blocker priority", () => {
  it("ranks the owner publish hold as the top blocker when proof is ready", () => {
    const result = priority();

    expect(result.state).toBe("blocked");
    expect(result.readiness).toBe(0);
    expect(result.openBlockerCount).toBe(2);
    expect(result.ownerReviewAddressableCount).toBe(1);
    expect(result.ownerReviewCanAddressTopBlocker).toBe(true);
    expect(result.topPriorityLabel).toBe("Publish hold");
    expect(result.ariaLabel).toContain(
      "Phase 1/2/6 publish hold blocker priority: Blocked; 2 open blockers; 1 owner-review addressable; top priority Publish hold; next action:"
    );
    expect(result.items[0]).toMatchObject({
      priority: 1,
      status: "blocked",
      severity: "critical"
    });
    expect(result.items[1]).toMatchObject({
      label: "Publish hold goal",
      ownerReviewAddressable: false,
      nextAction: "Keep the branch local and push only after the owner says to push."
    });
  });

  it("keeps proof review below the publish hold when both are open", () => {
    const result = priority({
      phasePriorityEvidence: priorityEvidence({
        state: "review",
        counts: { ready: 2, review: 1, blocked: 0, waiting: 0 },
        items: [
          ...priorityEvidence().items.slice(0, 2),
          {
            id: "phase-6-pm-board",
            label: "Phase 6 PM phase board",
            state: "review",
            readiness: 65,
            detail: "PM staging coverage needs review.",
            nextAction: "Review staged Arena package coverage."
          }
        ]
      })
    });

    expect(result.items.map((item) => item.label).slice(0, 3)).toEqual([
      "Publish hold",
      "Publish hold goal",
      "Phase 6 PM phase board"
    ]);
    expect(result.readiness).toBe(22);
    expect(result.ownerReviewAddressableCount).toBe(2);
    expect(result.ariaLabel).toContain(
      "Phase 1/2/6 publish hold blocker priority: Blocked; 3 open blockers; 2 owner-review addressable; top priority Publish hold; next action:"
    );
    expect(result.items[1]).toMatchObject({
      label: "Publish hold goal",
      ownerReviewAddressable: false
    });
    expect(result.items[2]).toMatchObject({
      status: "review",
      severity: "high",
      ownerReviewAddressable: true
    });
  });

  it("is ready when traceability is trusted and no blocker rows remain", () => {
    const result = priority({
      traceability: traceability({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        items: [],
        blockedCount: 0,
        readyCount: 6,
        publishHoldStatus: "ready"
      })
    });

    expect(result.state).toBe("ready");
    expect(result.readiness).toBe(100);
    expect(result.openBlockerCount).toBe(0);
    expect(result.ownerReviewAddressableCount).toBe(0);
    expect(result.topPriorityLabel).toBe("No open Phase 1/2/6 publish-hold blocker");
    expect(result.ariaLabel).toBe(
      "Phase 1/2/6 publish hold blocker priority: Ready; 0 open blockers; 0 owner-review addressable; top priority No open Phase 1/2/6 publish-hold blocker; next action: No Phase 1/2/6 publish-hold blockers remain; keep publishing held until owner approval."
    );
  });

  it("keeps blocker-priority text public-safe", () => {
    const result = priority({
      traceability: traceability({
        items: [
          {
            id: "phase-1-2-6-publish-hold-traceability:publish-hold",
            label: "Publish hold",
            kind: "publish-hold",
            status: "blocked",
            detail:
              "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
            nextAction:
              "Open C:\\Users\\MJ\\Desktop\\secret.md with token sk-OWNER1234567890 <unsafe>"
          }
        ]
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
