import { describe, expect, it } from "vitest";
import type { Phase7DispatchReviewArtifactVerification } from "./phase7DispatchReviewArtifact";
import { buildPhase7LiveWorkerLaunchGate } from "./phase7LiveWorkerLaunchGate";

function verification(
  overrides: Partial<Phase7DispatchReviewArtifactVerification> = {}
): Phase7DispatchReviewArtifactVerification {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canVerifyOffline: true,
    detail: "Phase 7 dispatch review artifact is verified.",
    nextAction: "Keep the artifact attached.",
    latestRecordId: "dispatch-review-record",
    reviewRecordCount: 1,
    openDepthCount: 0,
    openOwnershipCount: 0,
    openBlockerCount: 0,
    linkedPmTaskCount: 10,
    liveWorkerLockCount: 2,
    recordEvidenceFingerprint: "phase7-dispatch-ready",
    currentEvidenceFingerprint: "phase7-dispatch-ready",
    expectedEvidenceFingerprint: "phase7-dispatch-ready",
    matchesExpectedEvidence: true,
    executionLocked: true,
    handoffPacketCount: 4,
    ...overrides
  };
}

describe("phase 7 live worker launch gate", () => {
  it("keeps verified dispatch artifacts locked until separate owner expansion", () => {
    const gate = buildPhase7LiveWorkerLaunchGate(verification());

    expect(gate).toMatchObject({
      state: "locked",
      statusLabel: "Locked",
      readiness: 95,
      canSpawnLiveWorker: false,
      approvalRequired: true,
      artifactVerificationState: "ready",
      executionLocked: true,
      openBlockerCount: 0,
      liveWorkerLockCount: 2,
      handoffPacketCount: 4
    });
    expect(gate.detail).toContain("owner approves a separate live-worker expansion");
    expect(gate.launchGateProof).toContain("artifactVerification=ready");
    expect(gate.launchGateProof).toContain("approval=required");
    expect(gate.launchGateProof).toContain("canSpawn=no");
    expect(gate.launchGateProof).toContain("execution=locked");
  });

  it("keeps review artifacts locked with the verifier next action", () => {
    const gate = buildPhase7LiveWorkerLaunchGate(
      verification({
        state: "review",
        statusLabel: "Review",
        readiness: 70,
        openBlockerCount: 1,
        nextAction: "Review handoff packet evidence."
      })
    );

    expect(gate).toMatchObject({
      state: "review",
      canSpawnLiveWorker: false,
      approvalRequired: true,
      artifactVerificationState: "review",
      openBlockerCount: 1
    });
    expect(gate.nextAction).toBe("Review handoff packet evidence.");
    expect(gate.launchGateProof).toContain("open=1");
  });

  it("blocks launch review when the artifact loses the execution lock", () => {
    const gate = buildPhase7LiveWorkerLaunchGate(
      verification({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 20,
        executionLocked: false,
        liveWorkerLockCount: 0
      })
    );

    expect(gate).toMatchObject({
      state: "blocked",
      canSpawnLiveWorker: false,
      artifactVerificationState: "blocked",
      executionLocked: false,
      liveWorkerLockCount: 0
    });
    expect(gate.detail).toContain("does not prove the execution lock");
    expect(gate.launchGateProof).toContain("execution=unlocked");
  });
});
