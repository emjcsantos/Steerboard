import { describe, expect, it } from "vitest";
import {
  buildPhase8CloseoutStatus
} from "./phase8CloseoutStatus";
import type {
  Phase8FinalCompletionHandoff
} from "./phase8FinalCompletionHandoff";
import type {
  Phase8OwnerReviewClosureReadiness
} from "./phase8OwnerReviewClosureReadiness";

function ownerReviewClosure(
  overrides: Partial<Phase8OwnerReviewClosureReadiness> = {}
): Phase8OwnerReviewClosureReadiness {
  return {
    id: "phase-8-owner-review-closure-readiness",
    label: "Phase 8 owner-review closure readiness",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 60,
    ownerReviewRecorded: false,
    ownerReviewRecordable: true,
    auditReviewBlockersRemaining: 1,
    openBlockerCount: 1,
    openExceptionCount: 0,
    artifactReady: true,
    fingerprintCurrent: false,
    reviewedBlockerProof: false,
    handoffReady: false,
    completionGateReady: true,
    phaseComplete: true,
    canCloseOwnerReview: false,
    topAuditReviewSourceId: "phase8.audit-review-blocker",
    phase8OwnerReviewClosureReadinessProof:
      "phase8OwnerReviewClosureReadinessProof=state=waiting canClose=no",
    nextAction: "Record local owner audit review before Phase 8 closure.",
    safety: "Phase 8 owner-review closure readiness is evidence-only.",
    ariaLabel: "Phase 8 owner-review closure readiness.",
    ...overrides
  };
}

function finalHandoff(
  overrides: Partial<Phase8FinalCompletionHandoff> = {}
): Phase8FinalCompletionHandoff {
  return {
    id: "phase-8-final-completion-handoff",
    label: "Phase 8 final completion handoff",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 70,
    phaseComplete: false,
    canAdvancePhase9: false,
    canAdvanceMutationPaths: false,
    closureReady: true,
    ownerReviewClosureReady: false,
    completionGateReady: true,
    ownerReviewRecorded: false,
    openBlockerCount: 1,
    openExceptionCount: 0,
    auditReviewBlockersRemaining: 1,
    nextLane: "Phase 9 runner approval",
    nextLaneStatus: "held",
    topHold: "audit-review-blockers",
    phase8FinalCompletionHandoffProof:
      "phase8FinalCompletionHandoffProof=state=waiting phaseComplete=no",
    nextAction: "Record local owner audit review before Phase 8 can hand off.",
    safety: "Phase 8 final completion handoff is evidence-only.",
    ariaLabel: "Phase 8 final completion handoff.",
    ...overrides
  };
}

describe("phase 8 closeout status", () => {
  it("holds closeout when owner-review closure still has blockers", () => {
    const status = buildPhase8CloseoutStatus({
      ownerReviewClosureReadiness: ownerReviewClosure(),
      finalCompletionHandoff: finalHandoff()
    });

    expect(status.state).toBe("waiting");
    expect(status.phaseComplete).toBe(false);
    expect(status.phase9DependencyReady).toBe(false);
    expect(status.mutationPathsLocked).toBe(true);
    expect(status.topHold).toBe("audit-review-blockers");
    expect(status.nextAction).toContain("owner audit review");
    expect(status.phase8CloseoutStatusProof).toContain("phase8CloseoutStatusProof");
    expect(status.phase8CloseoutStatusProof).toContain("phaseComplete=no");
    expect(status.phase8CloseoutStatusProof).toContain("phase9Dependency=held");
    expect(status.phase8CloseoutStatusProof).toContain("mutationPaths=locked");
  });

  it("closes Phase 8 for Phase 9 dependency while mutation paths stay locked", () => {
    const status = buildPhase8CloseoutStatus({
      ownerReviewClosureReadiness: ownerReviewClosure({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        ownerReviewRecorded: true,
        auditReviewBlockersRemaining: 0,
        openBlockerCount: 0,
        fingerprintCurrent: true,
        reviewedBlockerProof: true,
        handoffReady: true,
        canCloseOwnerReview: true,
        topAuditReviewSourceId: "none",
        phase8OwnerReviewClosureReadinessProof:
          "phase8OwnerReviewClosureReadinessProof=state=ready canClose=yes"
      }),
      finalCompletionHandoff: finalHandoff({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        phaseComplete: true,
        canAdvancePhase9: true,
        ownerReviewClosureReady: true,
        ownerReviewRecorded: true,
        openBlockerCount: 0,
        auditReviewBlockersRemaining: 0,
        nextLaneStatus: "ready",
        topHold: "none",
        phase8FinalCompletionHandoffProof:
          "phase8FinalCompletionHandoffProof=state=ready phaseComplete=yes"
      })
    });

    expect(status.state).toBe("ready");
    expect(status.phaseComplete).toBe(true);
    expect(status.phase9DependencyReady).toBe(true);
    expect(status.mutationPathsLocked).toBe(true);
    expect(status.ownerReviewClosed).toBe(true);
    expect(status.finalHandoffReady).toBe(true);
    expect(status.topHold).toBe("none");
    expect(status.phase8CloseoutStatusProof).toContain("phaseComplete=yes");
    expect(status.phase8CloseoutStatusProof).toContain("phase9Dependency=ready");
    expect(status.phase8CloseoutStatusProof).toContain("mutationPaths=locked");
  });
});
