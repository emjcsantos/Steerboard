import { describe, expect, it } from "vitest";
import type {
  Phase10ArenaPolishBlockerPriorityItem,
  Phase10ArenaPolishBlockerPrioritySummary
} from "./phase10ArenaPolishBlockerPriority";
import {
  buildPhase10ArenaReviewAddressabilityGate
} from "./phase10ArenaReviewAddressabilityGate";
import type { Phase10ArenaPolishCloseoutStatus } from "./phase10ArenaPolishCloseoutStatus";

function blockerItem(
  overrides: Partial<Phase10ArenaPolishBlockerPriorityItem> = {}
): Phase10ArenaPolishBlockerPriorityItem {
  return {
    id: "phase-10-arena-polish-blocker-priority:polish:docking-spike",
    sourceId: "phase-10-adaptive-arena-polish:docking-spike",
    label: "FlexLayout docking spike",
    kind: "polish",
    status: "review",
    severity: "high",
    priority: 1,
    canUseArenaReview: true,
    detail: "FlexLayout docking spike is Review; decision=defer.",
    nextAction: "Review Phase 10 Arena polish evidence; defer package installation.",
    ...overrides
  };
}

function blockerPriority(
  overrides: Partial<Phase10ArenaPolishBlockerPrioritySummary> = {}
): Phase10ArenaPolishBlockerPrioritySummary {
  const items = overrides.items ?? [blockerItem()];

  return {
    id: "phase-10-arena-polish-blocker-priority",
    label: "Phase 10 Arena polish blocker priority",
    state: "review",
    statusLabel: "Review",
    readiness: 65,
    openBlockerCount: items.length,
    arenaReviewAddressableCount: items.filter((item) => item.canUseArenaReview).length,
    topPriorityLabel: items[0]?.label ?? "No open Phase 10 Arena polish blocker",
    topPriorityAction:
      items[0]?.nextAction ??
      "Keep layout, density, keyboard, focus, terminology, acceptance, and traceability checks ready before packaging resumes.",
    arenaReviewCanAddressTopBlocker: items[0]?.canUseArenaReview === true,
    nextAction:
      items[0]?.nextAction ??
      "No Phase 10 Arena polish blockers remain; keep packaging held until owner release readiness clears.",
    safety:
      "Phase 10 Arena polish blocker priority is evidence-only. It ranks blockers but does not launch runtime, mutate sources, change saved sessions, or resume packaging.",
    ariaLabel: "Phase 10 Arena polish blocker priority: Review; 1 open blockers.",
    items,
    ...overrides
  };
}

function closeoutStatus(
  overrides: Partial<Phase10ArenaPolishCloseoutStatus> = {}
): Phase10ArenaPolishCloseoutStatus {
  return {
    id: "phase-10-arena-polish-closeout-status",
    label: "Phase 10 Arena polish closeout status",
    state: "complete",
    statusLabel: "Complete",
    readiness: 100,
    implementationComplete: true,
    arenaPolishReady: true,
    traceabilityTrusted: true,
    blockerPriorityClear: true,
    flexLayoutDeferred: true,
    packagingPaused: true,
    canResumePackaging: false,
    ownerResumeApproved: false,
    installPathLocked: true,
    desktopPackagingLocked: true,
    releaseGateRequired: true,
    linkedPmTaskCount: 10,
    requiredPmTaskCount: 10,
    openBlockerCount: 0,
    arenaReviewAddressableCount: 0,
    topHold: "none",
    phase10ArenaPolishCloseoutStatusProof:
      "phase10ArenaPolishCloseoutStatusProof=state=complete readiness=100 implementationComplete=yes polish=ready traceability=ready blockers=clear flexLayout=defer packaging=paused canResumePackaging=no ownerResume=missing installPath=locked desktopPackaging=locked releaseGate=required pmLinks=10/10 open=0 review=0 topHold=none",
    nextAction:
      "Phase 10 Arena polish closeout proof is ready; keep packaging paused until the owner explicitly resumes release actions.",
    safety:
      "Phase 10 Arena polish closeout status is evidence-only. It summarizes proof without installing dependencies, launching runtime, mutating sources, changing saved sessions, or resuming packaging.",
    ariaLabel:
      "Phase 10 Arena polish closeout status: Complete; 100% ready; packaging paused.",
    ...overrides
  };
}

describe("phase 10 Arena review addressability gate", () => {
  it("holds source-aware Arena review until owner approval is recorded", () => {
    const gate = buildPhase10ArenaReviewAddressabilityGate(
      blockerPriority(),
      closeoutStatus()
    );

    expect(gate).toMatchObject({
      state: "review",
      canRequestArenaReview: false,
      openBlockerCount: 1,
      addressableSourceCount: 1,
      topSourceAddressable: true,
      packagingPaused: true,
      mutationLocked: true,
      ownerArenaReviewApprovalRecorded: false
    });
    expect(gate.arenaReviewAddressabilityGateProof).toContain("ownerReview=required");
    expect(gate.arenaReviewAddressabilityGateProof).toContain("topSource=phase-10-adaptive-arena-polish:docking-spike");
  });

  it("allows an Arena review request only after owner approval for source-aware blockers", () => {
    const gate = buildPhase10ArenaReviewAddressabilityGate(
      blockerPriority(),
      closeoutStatus(),
      { ownerArenaReviewApprovalRecorded: true }
    );

    expect(gate).toMatchObject({
      state: "ready",
      canRequestArenaReview: true,
      ownerArenaReviewApprovalRecorded: true,
      addressableSourceCount: 1
    });
    expect(gate.arenaReviewAddressabilityGateProof).toContain("canRequest=yes");
    expect(gate.arenaReviewAddressabilityGateProof).toContain("ownerReview=recorded");
  });

  it("marks addressability ready when no open blockers remain and packaging is paused", () => {
    const gate = buildPhase10ArenaReviewAddressabilityGate(
      blockerPriority({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        openBlockerCount: 0,
        arenaReviewAddressableCount: 0,
        items: []
      }),
      closeoutStatus()
    );

    expect(gate).toMatchObject({
      state: "ready",
      canRequestArenaReview: false,
      openBlockerCount: 0,
      addressableSourceCount: 0,
      topSourceKind: "none"
    });
    expect(gate.detail).toContain("no open Arena-review blockers");
  });

  it("waits when open blockers are not Arena-review addressable", () => {
    const gate = buildPhase10ArenaReviewAddressabilityGate(
      blockerPriority({
        arenaReviewAddressableCount: 0,
        items: [
          blockerItem({
            canUseArenaReview: false,
            sourceId: "phase-10-arena-polish-traceability:pm-coverage",
            kind: "traceability"
          })
        ]
      }),
      closeoutStatus()
    );

    expect(gate).toMatchObject({
      state: "waiting",
      canRequestArenaReview: false,
      addressableSourceCount: 0,
      topSourceAddressable: false
    });
    expect(gate.detail).toContain("none are source-aware");
  });

  it("blocks Arena review when packaging is not paused", () => {
    const gate = buildPhase10ArenaReviewAddressabilityGate(
      blockerPriority(),
      closeoutStatus({ packagingPaused: false })
    );

    expect(gate).toMatchObject({
      state: "blocked",
      canRequestArenaReview: false,
      packagingPaused: false
    });
    expect(gate.detail).toContain("packaging is not paused");
    expect(gate.arenaReviewAddressabilityGateProof).toContain("packaging=review");
  });
});
