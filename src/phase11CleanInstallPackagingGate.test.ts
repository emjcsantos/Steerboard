import { describe, expect, it } from "vitest";
import type { Phase11ReleaseCloseoutStatus } from "./phase11ReleaseCloseoutStatus";
import type { Phase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";
import { buildPhase11CleanInstallPackagingGate } from "./phase11CleanInstallPackagingGate";

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

function releaseReadiness(
  overrides: Partial<Phase11ReleaseReadinessSnapshot> = {}
): Phase11ReleaseReadinessSnapshot {
  const items: Phase11ReleaseReadinessSnapshot["items"] = [
    {
      id: "phase-11-release-readiness:fresh-checkout",
      label: "Fresh checkout",
      kind: "fresh-checkout",
      status: "ready",
      detail: "Fresh checkout evidence passed.",
      nextAction: "Keep fresh checkout evidence attached."
    },
    {
      id: "phase-11-release-readiness:clean-checkout",
      label: "Clean checkout",
      kind: "clean-checkout",
      status: "ready",
      detail: "Clean checkout evidence passed.",
      nextAction: "Keep clean checkout evidence attached."
    },
    {
      id: "phase-11-release-readiness:build-test",
      label: "Build and test",
      kind: "build-test",
      status: "ready",
      detail: "Build/test evidence passed.",
      nextAction: "Keep build/test evidence attached."
    },
    {
      id: "phase-11-release-readiness:owner-smoke-proof",
      label: "Owner smoke proof",
      kind: "smoke-proof",
      status: "ready",
      detail: "Owner smoke proof with Phase 3 proof-export detail passed.",
      nextAction: "Keep smoke proof attached."
    },
    {
      id: "phase-11-release-readiness:packaging-lock",
      label: "Packaging lock",
      kind: "packaging-lock",
      status: "ready",
      detail: "Packaging stays locked.",
      nextAction: "Keep packaging locked."
    }
  ];

  return {
    id: "phase-11-release-readiness",
    label: "Phase 11 Release readiness gate",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canRecommendRelease: true,
    releaseHoldCount: 0,
    readyCount: items.length,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    ownerReadiness: 100,
    securityReadiness: 100,
    packagingReadiness: 80,
    nextAction: "Release readiness is recorded.",
    safety: "Evidence-only.",
    ariaLabel: "Phase 11 release readiness ready.",
    items,
    ...overrides
  };
}

describe("Phase 11 clean install packaging gate", () => {
  it("holds when release readiness prerequisites are incomplete", () => {
    const readiness = releaseReadiness({
      state: "review",
      statusLabel: "Review",
      canRecommendRelease: false,
      items: releaseReadiness().items.map((item) =>
        item.kind === "clean-checkout" ? { ...item, status: "review" } : item
      )
    });
    const gate = buildPhase11CleanInstallPackagingGate(closeout(), readiness);

    expect(gate.state).toBe("review");
    expect(gate.cleanInstallEvidenceReady).toBe(false);
    expect(gate.canPrepareInstallPackage).toBe(false);
    expect(gate.phase11CleanInstallPackagingGateProof).toContain("cleanInstall=held");
  });

  it("keeps install and packaging locked when owner approval is missing", () => {
    const gate = buildPhase11CleanInstallPackagingGate(closeout(), releaseReadiness());

    expect(gate.state).toBe("review");
    expect(gate.releaseCloseoutReady).toBe(true);
    expect(gate.cleanInstallEvidenceReady).toBe(true);
    expect(gate.buildTestEvidenceReady).toBe(true);
    expect(gate.smokeProofReady).toBe(true);
    expect(gate.packagingLockReady).toBe(true);
    expect(gate.ownerInstallPackagingApproved).toBe(false);
    expect(gate.canPrepareInstallPackage).toBe(false);
    expect(gate.gitInstallPathLocked).toBe(true);
    expect(gate.desktopPackagingLocked).toBe(true);
    expect(gate.phase11CleanInstallPackagingGateProof).toContain("ownerInstallPackaging=missing");
  });

  it("allows preparation only after explicit owner approval while keeping actions separately gated", () => {
    const gate = buildPhase11CleanInstallPackagingGate(closeout(), releaseReadiness(), {
      ownerInstallPackagingApproved: true
    });

    expect(gate.state).toBe("ready");
    expect(gate.canPrepareInstallPackage).toBe(true);
    expect(gate.phase11CleanInstallPackagingGateProof).toContain("canPrepare=yes");
    expect(gate.nextAction).toContain("separately gated");
  });

  it("blocks when release closeout is blocked", () => {
    const gate = buildPhase11CleanInstallPackagingGate(
      closeout({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 0,
        canRecommendRelease: false,
        phase11ReleaseCloseoutStatusProof:
          "phase11ReleaseCloseoutStatusProof=state=blocked release=held packaging=paused"
      }),
      releaseReadiness()
    );

    expect(gate.state).toBe("blocked");
    expect(gate.canPrepareInstallPackage).toBe(false);
    expect(gate.detail).toContain("blocked by Phase 11 release readiness");
  });
});
