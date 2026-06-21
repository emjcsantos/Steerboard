import { describe, expect, it } from "vitest";
import type { Phase10ArenaPolishSnapshot } from "./phase10ArenaPolish";
import type { Phase10ArenaPolishBlockerPrioritySummary } from "./phase10ArenaPolishBlockerPriority";
import {
  buildPhase10ArenaPolishCloseoutStatus
} from "./phase10ArenaPolishCloseoutStatus";
import type { Phase10ArenaPolishTraceabilitySummary } from "./phase10ArenaPolishTraceability";

function snapshot(
  overrides: Partial<Phase10ArenaPolishSnapshot> = {}
): Phase10ArenaPolishSnapshot {
  return {
    id: "phase-10-adaptive-arena-polish",
    label: "Phase 10 adaptive Arena polish",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    adaptivePanelCount: 4,
    visiblePanelCount: 3,
    hiddenPanelCount: 1,
    readyCount: 7,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    nextAction: "Keep Phase 10 Arena polish proof attached.",
    safety: "Evidence only.",
    ariaLabel: "Phase 10 ready.",
    items: [
      {
        id: "phase-10-adaptive-arena-polish:layout-regression",
        label: "Layout regression",
        kind: "layout-regression",
        status: "ready",
        detail: "Layout regression is ready.",
        nextAction: "Keep layout proof attached."
      },
      {
        id: "phase-10-adaptive-arena-polish:docking-spike",
        label: "FlexLayout docking spike",
        kind: "docking-spike",
        status: "ready",
        detail: "decision=adopt dependencyInstalled=yes ownerApproved=yes",
        nextAction: "Keep FlexLayout spike evidence attached."
      }
    ],
    ...overrides
  };
}

function traceability(
  overrides: Partial<Phase10ArenaPolishTraceabilitySummary> = {}
): Phase10ArenaPolishTraceabilitySummary {
  return {
    id: "phase-10-arena-polish-traceability",
    label: "Phase 10 Arena polish traceability",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canTrustArenaPolish: true,
    readyCount: 5,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    missingPmTaskIds: [],
    linkedGoalId: "goal-phase-10-arena-polish",
    linkedPmTaskCount: 10,
    acceptanceGateStatus: "ready",
    nextAction: "Keep Phase 10 traceability attached.",
    safety: "Evidence only.",
    ariaLabel: "Traceability ready.",
    items: [],
    ...overrides
  };
}

function blockerPriority(
  overrides: Partial<Phase10ArenaPolishBlockerPrioritySummary> = {}
): Phase10ArenaPolishBlockerPrioritySummary {
  return {
    id: "phase-10-arena-polish-blocker-priority",
    label: "Phase 10 Arena polish blocker priority",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    openBlockerCount: 0,
    arenaReviewAddressableCount: 0,
    topPriorityLabel: "No open Phase 10 Arena polish blocker",
    topPriorityAction: "Keep Phase 10 evidence attached.",
    arenaReviewCanAddressTopBlocker: false,
    nextAction: "Keep Phase 10 evidence attached.",
    safety: "Evidence only.",
    ariaLabel: "Blocker priority ready.",
    items: [],
    ...overrides
  };
}

describe("phase 10 Arena polish closeout status", () => {
  it("completes when polish, traceability, blocker priority, and PM links are ready", () => {
    const status = buildPhase10ArenaPolishCloseoutStatus({
      snapshot: snapshot(),
      traceability: traceability(),
      blockerPriority: blockerPriority()
    });

    expect(status.state).toBe("complete");
    expect(status.implementationComplete).toBe(true);
    expect(status.arenaPolishReady).toBe(true);
    expect(status.packagingPaused).toBe(true);
    expect(status.canResumePackaging).toBe(false);
    expect(status.ownerResumeApproved).toBe(false);
    expect(status.installPathLocked).toBe(true);
    expect(status.desktopPackagingLocked).toBe(true);
    expect(status.releaseGateRequired).toBe(true);
    expect(status.phase10ArenaPolishCloseoutStatusProof).toContain(
      "phase10ArenaPolishCloseoutStatusProof=state=complete"
    );
    expect(status.phase10ArenaPolishCloseoutStatusProof).toContain("pmLinks=10/10");
    expect(status.phase10ArenaPolishCloseoutStatusProof).toContain("canResumePackaging=no");
    expect(status.phase10ArenaPolishCloseoutStatusProof).toContain("ownerResume=missing");
    expect(status.phase10ArenaPolishCloseoutStatusProof).toContain("installPath=locked");
    expect(status.phase10ArenaPolishCloseoutStatusProof).toContain("desktopPackaging=locked");
    expect(status.phase10ArenaPolishCloseoutStatusProof).toContain("releaseGate=required");
  });

  it("allows a deferred FlexLayout package install without counting it as an open closeout blocker", () => {
    const status = buildPhase10ArenaPolishCloseoutStatus({
      snapshot: snapshot({
        state: "review",
        statusLabel: "Review",
        readiness: 95,
        readyCount: 6,
        reviewCount: 1,
        items: [
          {
            id: "phase-10-adaptive-arena-polish:layout-regression",
            label: "Layout regression",
            kind: "layout-regression",
            status: "ready",
            detail: "Layout regression is ready.",
            nextAction: "Keep layout proof attached."
          },
          {
            id: "phase-10-adaptive-arena-polish:docking-spike",
            label: "FlexLayout docking spike",
            kind: "docking-spike",
            status: "review",
            detail: "decision=defer dependencyInstalled=no ownerApproved=no",
            nextAction: "Keep FlexLayout as a reviewed spike and defer package installation until owner approval."
          }
        ]
      }),
      traceability: traceability(),
      blockerPriority: blockerPriority({
        state: "review",
        statusLabel: "Review",
        readiness: 90,
        openBlockerCount: 1,
        arenaReviewAddressableCount: 1,
        topPriorityLabel: "FlexLayout docking spike",
        topPriorityAction:
          "Review Phase 10 Arena polish evidence; Keep FlexLayout as a reviewed spike and defer package installation until owner approval.",
        arenaReviewCanAddressTopBlocker: true,
        nextAction:
          "Review Phase 10 Arena polish evidence; Keep FlexLayout as a reviewed spike and defer package installation until owner approval.",
        items: [
          {
            id: "phase-10-arena-polish-blocker-priority:polish:docking-spike",
            sourceId: "phase-10-adaptive-arena-polish:docking-spike",
            label: "FlexLayout docking spike",
            kind: "polish",
            status: "review",
            severity: "high",
            priority: 1,
            canUseArenaReview: true,
            detail: "FlexLayout docking spike is Review; decision=defer dependencyInstalled=no ownerApproved=no",
            nextAction:
              "Review Phase 10 Arena polish evidence; Keep FlexLayout as a reviewed spike and defer package installation until owner approval."
          }
        ]
      })
    });

    expect(status.state).toBe("complete");
    expect(status.flexLayoutDeferred).toBe(true);
    expect(status.openBlockerCount).toBe(0);
    expect(status.phase10ArenaPolishCloseoutStatusProof).toContain("flexLayout=defer");
  });

  it("blocks closeout when layout regression evidence is blocked", () => {
    const status = buildPhase10ArenaPolishCloseoutStatus({
      snapshot: snapshot({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 0,
        blockedCount: 1,
        nextAction: "Restore adaptive layout regression proof."
      }),
      traceability: traceability(),
      blockerPriority: blockerPriority({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 0,
        openBlockerCount: 1,
        arenaReviewAddressableCount: 1,
        topPriorityLabel: "Layout regression",
        topPriorityAction: "Restore adaptive layout regression proof.",
        arenaReviewCanAddressTopBlocker: true,
        nextAction: "Restore adaptive layout regression proof."
      })
    });

    expect(status.state).toBe("blocked");
    expect(status.arenaPolishReady).toBe(false);
    expect(status.phase10ArenaPolishCloseoutStatusProof).toContain("polish=held");
  });
});
