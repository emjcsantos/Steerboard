import { describe, expect, it } from "vitest";
import type { Phase11EvidenceRecordsSnapshot } from "./phase11EvidenceRecords";
import type { Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import type { Phase11OwnerReleaseBlockerPrioritySummary } from "./phase11OwnerReleaseBlockerPriority";
import type { Phase11OwnerReleaseTraceabilitySummary } from "./phase11OwnerReleaseTraceability";
import type { Phase11ProofFreshnessDepthSnapshot } from "./phase11ProofFreshnessDepth";
import {
  buildPhase11ReleaseCloseoutStatus
} from "./phase11ReleaseCloseoutStatus";
import type { Phase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";

function ownerCommand(
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
    readyCount: 9,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    nextAction: "Keep Owner Testing proof attached.",
    safety: "Evidence only.",
    ariaLabel: "Owner command ready.",
    items: [],
    priorityGoalTraceCount: 0,
    priorityGoalTraces: [],
    ...overrides
  };
}

function proofFreshness(
  overrides: Partial<Phase11ProofFreshnessDepthSnapshot> = {}
): Phase11ProofFreshnessDepthSnapshot {
  return {
    id: "phase-11-proof-freshness-depth",
    label: "Phase 11 proof freshness depth",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canTrustOwnerProof: true,
    readyCount: 7,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    openProofCount: 0,
    nextAction: "Keep proof freshness attached.",
    safety: "Evidence only.",
    ariaLabel: "Proof freshness ready.",
    items: [],
    ...overrides
  };
}

function evidenceRecords(
  overrides: Partial<Phase11EvidenceRecordsSnapshot> = {}
): Phase11EvidenceRecordsSnapshot {
  return {
    id: "phase-11-evidence-records",
    label: "Phase 11 evidence records",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    totalGateCount: 6,
    openGateCount: 0,
    readyCount: 6,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    staleCount: 0,
    missingCount: 0,
    malformedCount: 0,
    nextAction: "Keep evidence records attached.",
    ariaLabel: "Evidence records ready.",
    records: {
      "fresh-checkout": {
        gate: "fresh-checkout",
        label: "Fresh checkout",
        state: "ready",
        freshness: "fresh",
        source: "owner proof",
        recordedAt: "2026-06-17T10:00:00.000Z",
        detail: "Fresh checkout evidence is ready.",
        nextAction: "Keep fresh checkout evidence attached.",
        safety: "Evidence only."
      },
      "clean-checkout": {
        gate: "clean-checkout",
        label: "Clean checkout",
        state: "ready",
        freshness: "fresh",
        source: "owner proof",
        recordedAt: "2026-06-17T10:00:00.000Z",
        detail: "Clean checkout evidence is ready.",
        nextAction: "Keep clean checkout evidence attached.",
        safety: "Evidence only."
      },
      "build-test": {
        gate: "build-test",
        label: "Build and test",
        state: "ready",
        freshness: "fresh",
        source: "owner proof",
        recordedAt: "2026-06-17T10:00:00.000Z",
        detail: "Build and test evidence is ready.",
        nextAction: "Keep build and test evidence attached.",
        safety: "Evidence only."
      },
      "docs-known-limits": {
        gate: "docs-known-limits",
        label: "Docs and known limits",
        state: "ready",
        freshness: "fresh",
        source: "owner proof",
        recordedAt: "2026-06-17T10:00:00.000Z",
        detail: "Docs and known limits evidence is ready.",
        nextAction: "Keep docs and known limits evidence attached.",
        safety: "Evidence only."
      },
      "signed-audit-export": {
        gate: "signed-audit-export",
        label: "Signed audit export",
        state: "ready",
        freshness: "fresh",
        source: "owner proof",
        recordedAt: "2026-06-17T10:00:00.000Z",
        detail: "Signed audit export and rollback reference evidence is ready.",
        nextAction: "Keep signed audit export evidence attached.",
        safety: "Evidence only."
      },
      "release-decision": {
        gate: "release-decision",
        label: "Release decision evidence",
        state: "ready",
        freshness: "fresh",
        source: "owner proof",
        recordedAt: "2026-06-17T10:00:00.000Z",
        detail: "Release decision evidence is ready.",
        nextAction: "Keep release decision evidence attached.",
        safety: "Evidence only."
      }
    },
    ...overrides
  };
}

function releaseReadiness(
  overrides: Partial<Phase11ReleaseReadinessSnapshot> = {}
): Phase11ReleaseReadinessSnapshot {
  return {
    id: "phase-11-release-readiness",
    label: "Phase 11 Release readiness gate",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canRecommendRelease: true,
    releaseHoldCount: 0,
    readyCount: 9,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    ownerReadiness: 100,
    securityReadiness: 100,
    packagingReadiness: 100,
    nextAction: "Keep packaging paused until owner release action.",
    safety: "Evidence only.",
    ariaLabel: "Release readiness ready.",
    items: [
      {
        id: "phase-11-release-readiness:packaging-lock",
        label: "Packaging lock",
        kind: "packaging-lock",
        status: "ready",
        detail: "Packaging stays paused until owner resume.",
        nextAction: "Keep packaging paused."
      }
    ],
    ...overrides
  };
}

function traceability(
  overrides: Partial<Phase11OwnerReleaseTraceabilitySummary> = {}
): Phase11OwnerReleaseTraceabilitySummary {
  return {
    id: "phase-11-owner-release-traceability",
    label: "Phase 11 owner release traceability",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canTrustOwnerReleaseGate: true,
    readyCount: 10,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    missingPmTaskIds: [],
    linkedGoalIds: ["goal-phase-11-owner-command-center", "goal-phase-11-release-readiness"],
    linkedPmTaskCount: 12,
    releaseHoldStatus: "ready",
    nextAction: "Keep release traceability attached.",
    safety: "Evidence only.",
    ariaLabel: "Release traceability ready.",
    items: [],
    ...overrides
  };
}

function blockerPriority(
  overrides: Partial<Phase11OwnerReleaseBlockerPrioritySummary> = {}
): Phase11OwnerReleaseBlockerPrioritySummary {
  return {
    id: "phase-11-owner-release-blocker-priority",
    label: "Phase 11 owner release blocker priority",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    openBlockerCount: 0,
    ownerReviewAddressableCount: 0,
    topPriorityLabel: "No open Phase 11 owner release blocker",
    topPriorityAction: "Keep release evidence attached.",
    ownerReviewCanAddressTopBlocker: false,
    nextAction: "Keep release evidence attached.",
    safety: "Evidence only.",
    ariaLabel: "Release blocker priority ready.",
    items: [],
    ...overrides
  };
}

describe("phase 11 release closeout status", () => {
  it("completes when release readiness, traceability, evidence records, and packaging hold are ready", () => {
    const status = buildPhase11ReleaseCloseoutStatus({
      ownerCommandCenter: ownerCommand(),
      proofFreshnessDepth: proofFreshness(),
      evidenceRecords: evidenceRecords(),
      releaseReadiness: releaseReadiness(),
      traceability: traceability(),
      blockerPriority: blockerPriority()
    });

    expect(status.state).toBe("complete");
    expect(status.implementationComplete).toBe(true);
    expect(status.canRecommendRelease).toBe(true);
    expect(status.packagingPaused).toBe(true);
    expect(status.phase11ReleaseCloseoutStatusProof).toContain(
      "phase11ReleaseCloseoutStatusProof=state=complete"
    );
    expect(status.phase11ReleaseCloseoutStatusProof).toContain("pmLinks=12/12");
    expect(status.phase11ReleaseCloseoutStatusProof).toContain("packaging=paused");
  });

  it("keeps closeout in review while release readiness has evidence holds", () => {
    const status = buildPhase11ReleaseCloseoutStatus({
      ownerCommandCenter: ownerCommand(),
      proofFreshnessDepth: proofFreshness(),
      evidenceRecords: evidenceRecords({
        state: "review",
        statusLabel: "Review",
        readiness: 80,
        openGateCount: 1,
        readyCount: 4,
        reviewCount: 1,
        staleCount: 1,
        nextAction: "Refresh clean checkout evidence."
      }),
      releaseReadiness: releaseReadiness({
        state: "review",
        statusLabel: "Review",
        readiness: 90,
        canRecommendRelease: false,
        releaseHoldCount: 1,
        reviewCount: 1,
        nextAction: "Refresh clean checkout evidence before release readiness."
      }),
      traceability: traceability({
        state: "review",
        statusLabel: "Review",
        readiness: 90,
        canTrustOwnerReleaseGate: false,
        reviewCount: 1,
        nextAction: "Refresh evidence records before trusting release traceability."
      }),
      blockerPriority: blockerPriority({
        state: "review",
        statusLabel: "Review",
        readiness: 65,
        openBlockerCount: 1,
        ownerReviewAddressableCount: 1,
        topPriorityLabel: "Clean checkout",
        topPriorityAction: "Refresh clean checkout evidence.",
        ownerReviewCanAddressTopBlocker: true,
        nextAction: "Refresh clean checkout evidence."
      })
    });

    expect(status.state).toBe("review");
    expect(status.canRecommendRelease).toBe(false);
    expect(status.topHold).toBe("evidence-records");
    expect(status.nextAction).toBe("Refresh clean checkout evidence.");
    expect(status.phase11ReleaseCloseoutStatusProof).toContain("evidence=held");
  });

  it("blocks closeout when release readiness evidence is blocked", () => {
    const status = buildPhase11ReleaseCloseoutStatus({
      ownerCommandCenter: ownerCommand(),
      proofFreshnessDepth: proofFreshness(),
      evidenceRecords: evidenceRecords({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 40,
        openGateCount: 1,
        readyCount: 4,
        blockedCount: 1,
        malformedCount: 1,
        nextAction: "Repair docs and known limits evidence."
      }),
      releaseReadiness: releaseReadiness({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 0,
        canRecommendRelease: false,
        releaseHoldCount: 1,
        blockedCount: 1,
        nextAction: "Repair docs and known limits evidence."
      }),
      traceability: traceability(),
      blockerPriority: blockerPriority()
    });

    expect(status.state).toBe("blocked");
    expect(status.canRecommendRelease).toBe(false);
    expect(status.phase11ReleaseCloseoutStatusProof).toContain("release=held");
  });
});
