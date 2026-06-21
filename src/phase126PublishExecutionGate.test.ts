import { describe, expect, it } from "vitest";
import type { Phase126PublishHoldCloseoutStatus } from "./phase126PublishHoldCloseoutStatus";
import { buildPhase126PublishExecutionGate } from "./phase126PublishExecutionGate";

function closeoutStatus(
  overrides: Partial<Phase126PublishHoldCloseoutStatus> = {}
): Phase126PublishHoldCloseoutStatus {
  return {
    id: "phase-1-2-6-publish-hold-closeout-status",
    label: "Phase 1/2/6 publish-hold closeout status",
    state: "complete",
    statusLabel: "Complete",
    readiness: 100,
    implementationComplete: true,
    priorityProofReady: true,
    localHoldTrusted: true,
    publishHeld: true,
    pushPaused: true,
    linkedPmTaskCount: 21,
    requiredPmTaskCount: 21,
    readyPriorityEvidenceCount: 3,
    requiredPriorityEvidenceCount: 3,
    openBlockerCount: 0,
    ownerReviewAddressableCount: 0,
    topHold: "owner-publish-hold",
    localHoldEvidenceKey:
      "goal=goal-phase-1-2-6-publish phases=3/3 pm=21/21 trustedPm=21/21",
    phase126PublishHoldCloseoutStatusProof:
      "phase126PublishHoldCloseoutStatusProof=state=complete push=paused",
    nextAction:
      "Phase 1/2/6 local publish-hold closeout proof is ready; keep push paused until the owner restores the remote and explicitly says to push.",
    safety: "Evidence only.",
    ariaLabel: "Phase 1/2/6 publish-hold closeout status: Complete.",
    ...overrides
  };
}

describe("phase 1/2/6 publish execution gate", () => {
  it("keeps push and publish execution blocked until the public remote is restored", () => {
    const gate = buildPhase126PublishExecutionGate({
      closeoutStatus: closeoutStatus()
    });

    expect(gate.state).toBe("blocked");
    expect(gate.closeoutReady).toBe(true);
    expect(gate.publicRemoteRestored).toBe(false);
    expect(gate.ownerPushApprovalRecorded).toBe(false);
    expect(gate.branchTargetVerified).toBe(false);
    expect(gate.canPush).toBe(false);
    expect(gate.canPublish).toBe(false);
    expect(gate.noPushBoundaryActive).toBe(true);
    expect(gate.topHold).toBe("public-remote");
    expect(gate.phase126PublishExecutionGateProof).toContain(
      "phase126PublishExecutionGateProof=state=blocked"
    );
    expect(gate.phase126PublishExecutionGateProof).toContain("remote=missing");
    expect(gate.phase126PublishExecutionGateProof).toContain("ownerApproval=missing");
    expect(gate.phase126PublishExecutionGateProof).toContain("target=unverified");
    expect(gate.phase126PublishExecutionGateProof).toContain("canPush=no");
    expect(gate.phase126PublishExecutionGateProof).toContain("noPush=active");
  });

  it("stays blocked after remote restoration until owner approval is recorded", () => {
    const gate = buildPhase126PublishExecutionGate({
      closeoutStatus: closeoutStatus(),
      publicRemoteRestored: true
    });

    expect(gate.state).toBe("blocked");
    expect(gate.topHold).toBe("owner-push-approval");
    expect(gate.phase126PublishExecutionGateProof).toContain("remote=restored");
    expect(gate.phase126PublishExecutionGateProof).toContain("ownerApproval=missing");
    expect(gate.nextAction).toContain("Record explicit owner approval");
  });

  it("stays in review when local closeout proof needs review", () => {
    const gate = buildPhase126PublishExecutionGate({
      closeoutStatus: closeoutStatus({
        state: "review",
        statusLabel: "Review",
        readiness: 90,
        topHold: "priority-proof",
        nextAction: "Review Phase 6 PM board evidence."
      }),
      publicRemoteRestored: true,
      ownerPushApprovalRecorded: true,
      branchTargetVerified: true
    });

    expect(gate.state).toBe("review");
    expect(gate.topHold).toBe("local-closeout");
    expect(gate.canPush).toBe(false);
    expect(gate.nextAction).toBe("Review Phase 6 PM board evidence.");
  });

  it("allows publish execution only when closeout, remote, owner approval, and target are all ready", () => {
    const gate = buildPhase126PublishExecutionGate({
      closeoutStatus: closeoutStatus(),
      publicRemoteRestored: true,
      ownerPushApprovalRecorded: true,
      branchTargetVerified: true,
      targetBranch: "codex/remaining-goal-phase9-active"
    });

    expect(gate.state).toBe("ready");
    expect(gate.readiness).toBe(100);
    expect(gate.canPush).toBe(true);
    expect(gate.canPublish).toBe(true);
    expect(gate.noPushBoundaryActive).toBe(false);
    expect(gate.topHold).toBe("none");
    expect(gate.phase126PublishExecutionGateProof).toContain("canPush=yes");
    expect(gate.phase126PublishExecutionGateProof).toContain("noPush=cleared");
    expect(gate.phase126PublishExecutionGateProof).toContain(
      "branch=codex/remaining-goal-phase9-active"
    );
  });
});
