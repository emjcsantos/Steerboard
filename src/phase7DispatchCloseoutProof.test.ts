import { describe, expect, it } from "vitest";
import type { Phase7DispatchClosureGate } from "./phase7DispatchClosureGate";
import { buildPhase7DispatchCloseoutProof } from "./phase7DispatchCloseoutProof";
import type { Phase7DispatchReviewArtifactVerification } from "./phase7DispatchReviewArtifact";
import type { Phase7LiveWorkerLaunchGate } from "./phase7LiveWorkerLaunchGate";

function artifactVerification(
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

function launchGate(overrides: Partial<Phase7LiveWorkerLaunchGate> = {}): Phase7LiveWorkerLaunchGate {
  return {
    state: "locked",
    statusLabel: "Locked",
    readiness: 95,
    canSpawnLiveWorker: false,
    approvalRequired: true,
    artifactVerificationState: "ready",
    executionLocked: true,
    openBlockerCount: 0,
    liveWorkerLockCount: 2,
    handoffPacketCount: 4,
    detail: "Phase 7 dispatch artifact is verified, but live-worker spawning remains locked.",
    nextAction: "Keep dispatch work in local metadata review.",
    launchGateProof:
      "phase7LiveWorkerLaunchGate state=locked artifactVerification=ready approval=required canSpawn=no execution=locked locks=2/2 packets=4/4 open=0",
    ...overrides
  };
}

function closureGate(overrides: Partial<Phase7DispatchClosureGate> = {}): Phase7DispatchClosureGate {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canCloseDispatchReview: true,
    canSpawnLiveWorker: false,
    closureState: "ready-to-close",
    artifactVerificationState: "ready",
    launchGateState: "locked",
    traceabilityLinkCount: 5,
    openBlockerCount: 0,
    approvalRequired: true,
    detail: "Phase 7 dispatch review can close as a metadata handoff.",
    nextAction: "Close the local dispatch review only as handoff proof.",
    closureGateProof:
      "phase7DispatchClosureGate state=ready closure=ready-to-close artifactVerification=ready launchGate=locked canClose=yes canSpawn=no approval=required traceabilityLinks=5/5 open=0",
    ...overrides
  };
}

describe("phase 7 dispatch closeout proof", () => {
  it("creates a ready closeout proof when artifact, launch, and closure gates are ready", () => {
    const closeout = buildPhase7DispatchCloseoutProof({
      artifactVerification: artifactVerification(),
      launchGate: launchGate(),
      closureGate: closureGate()
    });

    expect(closeout).toMatchObject({
      state: "ready",
      statusLabel: "Ready",
      readiness: 100,
      canCloseDispatchReview: true,
      canSpawnLiveWorker: false,
      artifactVerificationState: "ready",
      launchGateState: "locked",
      closureGateState: "ready",
      openBlockerCount: 0,
      approvalRequired: true
    });
    expect(closeout.detail).toContain("local metadata handoff");
    expect(closeout.closeoutProof).toContain("phase7DispatchCloseoutProof");
    expect(closeout.closeoutProof).toContain("canClose=yes");
    expect(closeout.closeoutProof).toContain("canSpawn=no");
  });

  it("keeps closeout in review when one gate still needs owner review", () => {
    const closeout = buildPhase7DispatchCloseoutProof({
      artifactVerification: artifactVerification({ state: "review", statusLabel: "Review" }),
      launchGate: launchGate({ state: "review", statusLabel: "Review" }),
      closureGate: closureGate({
        state: "review",
        statusLabel: "Review",
        canCloseDispatchReview: false,
        openBlockerCount: 1,
        nextAction: "Review the dispatch closure gate."
      })
    });

    expect(closeout).toMatchObject({
      state: "review",
      canCloseDispatchReview: false,
      canSpawnLiveWorker: false,
      artifactVerificationState: "review",
      launchGateState: "review",
      closureGateState: "review",
      openBlockerCount: 1
    });
    expect(closeout.nextAction).toBe("Review the dispatch closure gate.");
    expect(closeout.closeoutProof).toContain("open=1");
  });

  it("blocks closeout when any gate loses the no-spawn boundary", () => {
    const closeout = buildPhase7DispatchCloseoutProof({
      artifactVerification: artifactVerification({ state: "blocked", statusLabel: "Blocked" }),
      launchGate: launchGate({ state: "blocked", statusLabel: "Blocked" }),
      closureGate: closureGate({ state: "blocked", statusLabel: "Blocked" })
    });

    expect(closeout).toMatchObject({
      state: "blocked",
      canCloseDispatchReview: false,
      canSpawnLiveWorker: false,
      artifactVerificationState: "blocked",
      launchGateState: "blocked",
      closureGateState: "blocked"
    });
    expect(closeout.detail).toContain("gate proofs failed");
  });
});
