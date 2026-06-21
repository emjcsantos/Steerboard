import { describe, expect, it } from "vitest";
import type { Phase11EvidenceRecordsSnapshot } from "./phase11EvidenceRecords";
import type { Phase11ReleaseCloseoutStatus } from "./phase11ReleaseCloseoutStatus";
import { buildPhase11ExternalDeliveryGate } from "./phase11ExternalDeliveryGate";

function closeout(
  overrides: Partial<Phase11ReleaseCloseoutStatus> = {}
): Phase11ReleaseCloseoutStatus {
  return {
    id: "phase-11-release-closeout-status",
    label: "Phase 11 release closeout status",
    state: "complete",
    statusLabel: "Complete",
    readiness: 100,
    implementationComplete: true,
    canRecommendRelease: true,
    packagingPaused: true,
    publishExecutionGateState: "blocked",
    publishExecutionHeld: true,
    publishExecutionTopHold: "owner-held",
    ownerCommandReady: true,
    proofFreshnessTrusted: true,
    evidenceRecordsReady: true,
    releaseReadinessReady: true,
    traceabilityTrusted: true,
    blockerPriorityClear: true,
    linkedPmTaskCount: 12,
    requiredPmTaskCount: 12,
    openBlockerCount: 0,
    releaseHoldCount: 0,
    topHold: "none",
    phase11ReleaseCloseoutStatusProof:
      "phase11ReleaseCloseoutStatusProof=state=complete release=ready packaging=paused publishExecution=held noPush=active owner=ready proof=ready evidence=ready readiness=ready traceability=ready blockers=clear",
    nextAction:
      "Phase 11 release closeout proof is ready; keep packaging paused until the owner explicitly resumes release actions.",
    safety: "Evidence-only.",
    ariaLabel: "Phase 11 release closeout status: Complete",
    ...overrides
  };
}

function evidence(
  overrides: Partial<Phase11EvidenceRecordsSnapshot> = {}
): Phase11EvidenceRecordsSnapshot {
  const safety = "Phase 11 evidence records are metadata-only.";

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
    nextAction: "Keep all evidence records attached.",
    ariaLabel: "Phase 11 evidence records ready.",
    records: {
      "fresh-checkout": {
        gate: "fresh-checkout",
        label: "Fresh checkout",
        state: "ready",
        freshness: "fresh",
        source: "owner",
        recordedAt: "2026-06-18T10:00:00.000Z",
        detail: "Fresh checkout evidence passed.",
        nextAction: "Keep fresh checkout evidence attached.",
        safety
      },
      "clean-checkout": {
        gate: "clean-checkout",
        label: "Clean checkout",
        state: "ready",
        freshness: "fresh",
        source: "owner",
        recordedAt: "2026-06-18T10:00:00.000Z",
        detail: "Clean checkout evidence passed.",
        nextAction: "Keep clean checkout evidence attached.",
        safety
      },
      "build-test": {
        gate: "build-test",
        label: "Build and test",
        state: "ready",
        freshness: "fresh",
        source: "owner",
        recordedAt: "2026-06-18T10:00:00.000Z",
        detail: "Build and test evidence passed.",
        nextAction: "Keep build and test evidence attached.",
        safety
      },
      "docs-known-limits": {
        gate: "docs-known-limits",
        label: "Docs and known limits",
        state: "ready",
        freshness: "fresh",
        source: "owner",
        recordedAt: "2026-06-18T10:00:00.000Z",
        detail: "Docs and known limits were reviewed.",
        nextAction: "Keep docs evidence attached.",
        safety
      },
      "signed-audit-export": {
        gate: "signed-audit-export",
        label: "Signed audit export",
        state: "ready",
        freshness: "fresh",
        source: "owner",
        recordedAt: "2026-06-18T10:00:00.000Z",
        detail:
          "Signed audit export, signature verification, rollback references, no-mutation scope, and release privacy readiness were reviewed.",
        nextAction: "Keep rollback references attached.",
        safety
      },
      "release-decision": {
        gate: "release-decision",
        label: "Release decision evidence",
        state: "ready",
        freshness: "fresh",
        source: "owner",
        recordedAt: "2026-06-18T10:00:00.000Z",
        detail: "Owner release-decision evidence was recorded while packaging stayed locked.",
        nextAction: "Keep release decision evidence attached.",
        safety
      }
    },
    ...overrides
  };
}

describe("Phase 11 external delivery gate", () => {
  it("holds delivery when owner delivery approval is missing", () => {
    const gate = buildPhase11ExternalDeliveryGate(closeout(), evidence());

    expect(gate.state).toBe("review");
    expect(gate.releaseCloseoutReady).toBe(true);
    expect(gate.signedAuditReady).toBe(true);
    expect(gate.rollbackReferenceReady).toBe(true);
    expect(gate.releaseDecisionReady).toBe(true);
    expect(gate.ownerDeliveryApproved).toBe(false);
    expect(gate.canDeliverExternally).toBe(false);
    expect(gate.phase11ExternalDeliveryGateProof).toContain("ownerDelivery=missing");
    expect(gate.phase11ExternalDeliveryGateProof).toContain("delivery=locked");
  });

  it("allows delivery only after explicit owner delivery approval", () => {
    const gate = buildPhase11ExternalDeliveryGate(closeout(), evidence(), {
      ownerDeliveryApproved: true
    });

    expect(gate.state).toBe("ready");
    expect(gate.canDeliverExternally).toBe(true);
    expect(gate.signingLocked).toBe(true);
    expect(gate.packageUploadLocked).toBe(true);
    expect(gate.phase11ExternalDeliveryGateProof).toContain("canDeliver=yes");
  });

  it("holds when signed audit rollback evidence is stale or missing", () => {
    const staleEvidence = evidence({
      records: {
        ...evidence().records,
        "signed-audit-export": {
          ...evidence().records["signed-audit-export"],
          freshness: "stale",
          detail: "Signed audit export needs review."
        }
      }
    });
    const gate = buildPhase11ExternalDeliveryGate(closeout(), staleEvidence, {
      ownerDeliveryApproved: true
    });

    expect(gate.state).toBe("review");
    expect(gate.signedAuditReady).toBe(false);
    expect(gate.rollbackReferenceReady).toBe(false);
    expect(gate.canDeliverExternally).toBe(false);
    expect(gate.phase11ExternalDeliveryGateProof).toContain("signedAudit=held");
  });

  it("blocks when release closeout is blocked", () => {
    const gate = buildPhase11ExternalDeliveryGate(
      closeout({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 0,
        canRecommendRelease: false,
        phase11ReleaseCloseoutStatusProof:
          "phase11ReleaseCloseoutStatusProof=state=blocked release=held packaging=paused"
      }),
      evidence()
    );

    expect(gate.state).toBe("blocked");
    expect(gate.canDeliverExternally).toBe(false);
    expect(gate.detail).toContain("blocked by Phase 11 release closeout");
  });
});
