import { describe, expect, it } from "vitest";
import type { Phase126PublishHoldBlockerPrioritySummary } from "./phase126PublishHoldBlockerPriority";
import {
  buildPhase126PublishHoldCloseoutStatus
} from "./phase126PublishHoldCloseoutStatus";
import type { Phase126PublishHoldTraceabilitySummary } from "./phase126PublishHoldTraceability";
import type { PhasePriorityEvidenceResult } from "./phasePriorityEvidence";

function priorityEvidence(
  overrides: Partial<PhasePriorityEvidenceResult> = {}
): PhasePriorityEvidenceResult {
  return {
    state: "ready",
    readiness: 100,
    statusLabel: "Ready",
    detail: "Priority evidence ready.",
    counts: { ready: 3, review: 0, blocked: 0, waiting: 0 },
    items: [
      {
        id: "phase-1-live-panel",
        label: "Phase 1 live Arena panel",
        state: "ready",
        readiness: 100,
        detail: "Phase 1 proof ready.",
        nextAction: "Keep Phase 1 proof attached."
      },
      {
        id: "phase-2-panel-isolation",
        label: "Phase 2 multi-panel isolation",
        state: "ready",
        readiness: 100,
        detail: "Phase 2 proof ready.",
        nextAction: "Keep Phase 2 proof attached."
      },
      {
        id: "phase-6-pm-board",
        label: "Phase 6 PM phase board",
        state: "ready",
        readiness: 100,
        detail: "Phase 6 proof ready.",
        nextAction: "Keep Phase 6 proof attached."
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
    linkedPmTaskCount: 21,
    requiredPmTaskCount: 21,
    linkedRequiredPmTaskCount: 21,
    linkedRequiredPmTaskKindCounts: {
      epic: 3,
      parent: 6,
      child: 12
    },
    requiredPriorityEvidenceCount: 3,
    readyPriorityEvidenceCount: 3,
    publishHoldStatus: "blocked",
    localHoldEvidenceKey:
      "goal=goal-phase-1-2-6-publish phases=3/3 pm=21/21 trustedPm=21/21 epics=3 parents=6 children=12 priority=3/3 hold=blocked trust=ready",
    nextAction: "Keep the branch local and push only after the owner says to push.",
    safety: "Evidence only.",
    ariaLabel: "Traceability blocked.",
    items: [],
    ...overrides
  };
}

function blockerPriority(
  overrides: Partial<Phase126PublishHoldBlockerPrioritySummary> = {}
): Phase126PublishHoldBlockerPrioritySummary {
  return {
    id: "phase-1-2-6-publish-hold-blocker-priority",
    label: "Phase 1/2/6 publish hold blocker priority",
    state: "blocked",
    statusLabel: "Blocked",
    readiness: 0,
    openBlockerCount: 2,
    ownerReviewAddressableCount: 1,
    topPriorityLabel: "Publish hold",
    topPriorityAction: "Keep the branch local and push only after the owner says to push.",
    ownerReviewCanAddressTopBlocker: true,
    nextAction: "Keep the branch local and push only after the owner says to push.",
    safety: "Evidence only.",
    ariaLabel: "Blocker priority blocked.",
    items: [
      {
        id: "phase-1-2-6-publish-hold-blocker-priority:traceability:publish-hold",
        sourceId: "phase-1-2-6-publish-hold-traceability:publish-hold",
        label: "Publish hold",
        kind: "traceability",
        status: "blocked",
        severity: "critical",
        priority: 1,
        ownerReviewAddressable: true,
        detail: "Publishing remains intentionally blocked.",
        nextAction: "Keep the branch local and push only after the owner says to push."
      },
      {
        id: "phase-1-2-6-publish-hold-blocker-priority:traceability:publish-goal",
        sourceId: "phase-1-2-6-publish-hold-traceability:publish-goal",
        label: "Publish hold goal",
        kind: "traceability",
        status: "blocked",
        severity: "critical",
        priority: 2,
        ownerReviewAddressable: false,
        detail: "Publish goal is blocked by owner approval.",
        nextAction: "Keep the branch local and push only after the owner says to push."
      }
    ],
    ...overrides
  };
}

describe("phase 1/2/6 publish hold closeout status", () => {
  it("completes local closeout when only the owner publish hold remains", () => {
    const status = buildPhase126PublishHoldCloseoutStatus({
      phasePriorityEvidence: priorityEvidence(),
      traceability: traceability(),
      blockerPriority: blockerPriority()
    });

    expect(status.state).toBe("complete");
    expect(status.implementationComplete).toBe(true);
    expect(status.localHoldTrusted).toBe(true);
    expect(status.publishHeld).toBe(true);
    expect(status.pushPaused).toBe(true);
    expect(status.openBlockerCount).toBe(0);
    expect(status.phase126PublishHoldCloseoutStatusProof).toContain(
      "phase126PublishHoldCloseoutStatusProof=state=complete"
    );
    expect(status.phase126PublishHoldCloseoutStatusProof).toContain("pmLinks=21/21");
    expect(status.phase126PublishHoldCloseoutStatusProof).toContain("publish=held");
    expect(status.phase126PublishHoldCloseoutStatusProof).toContain("push=paused");
  });

  it("keeps closeout in review while priority proof is not ready", () => {
    const status = buildPhase126PublishHoldCloseoutStatus({
      phasePriorityEvidence: priorityEvidence({
        state: "review",
        readiness: 88,
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
      }),
      traceability: traceability({
        canTrustLocalHold: false,
        readyPriorityEvidenceCount: 2,
        localHoldEvidenceKey:
          "goal=goal-phase-1-2-6-publish phases=3/3 pm=21/21 trustedPm=21/21 epics=3 parents=6 children=12 priority=2/3 hold=blocked trust=review"
      }),
      blockerPriority: blockerPriority()
    });

    expect(status.state).toBe("review");
    expect(status.topHold).toBe("priority-proof");
    expect(status.nextAction).toBe("Review staged Arena package coverage.");
    expect(status.phase126PublishHoldCloseoutStatusProof).toContain("priority=2/3");
  });

  it("blocks closeout when PM coverage is missing", () => {
    const status = buildPhase126PublishHoldCloseoutStatus({
      phasePriorityEvidence: priorityEvidence(),
      traceability: traceability({
        canTrustLocalHold: false,
        linkedPmTaskCount: 20,
        linkedRequiredPmTaskCount: 20,
        missingPmTaskIds: ["phase-06-child-publish-hold-closeout-status"],
        localHoldEvidenceKey:
          "goal=goal-phase-1-2-6-publish phases=3/3 pm=20/21 trustedPm=20/21 epics=3 parents=6 children=11 priority=3/3 hold=blocked trust=review"
      }),
      blockerPriority: blockerPriority()
    });

    expect(status.state).toBe("blocked");
    expect(status.localHoldTrusted).toBe(false);
    expect(status.topHold).toBe("local-hold-traceability");
    expect(status.phase126PublishHoldCloseoutStatusProof).toContain("localHold=held");
  });
});
