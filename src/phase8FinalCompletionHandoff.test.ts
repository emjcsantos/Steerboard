import { describe, expect, it } from "vitest";
import type { Phase8ClosureAuditStatus } from "./phase8ClosureAuditStatus";
import {
  buildPhase8FinalCompletionHandoff
} from "./phase8FinalCompletionHandoff";
import type {
  Phase8OwnerReviewClosureReadiness
} from "./phase8OwnerReviewClosureReadiness";
import type {
  Phase8PermissionAuditCompletionGate
} from "./phase8PermissionAuditCompletionGate";
import type { Phase8RiskClosureSummary } from "./phase8RiskClosure";

function riskClosure(overrides: Partial<Phase8RiskClosureSummary> = {}): Phase8RiskClosureSummary {
  return {
    id: "phase-8-risk-closure",
    label: "Phase 8 risk closure",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 45,
    canCloseBlockers: false,
    mutationLocked: true,
    openBlockerCount: 1,
    auditReviewAddressableCount: 1,
    ownerActionBlockerCount: 0,
    closureReadyCount: 0,
    openExceptionCount: 1,
    topClosureSourceId: "phase8-live-action-terminal:permission",
    topClosureStatus: "waiting",
    phase8RiskClosureProof: "phase8RiskClosureProof=state=waiting",
    nextAction: "Review Phase 8 audit evidence.",
    safety: "Phase 8 review only.",
    ariaLabel: "Phase 8 risk closure.",
    ...overrides
  };
}

function closureAuditStatus(
  overrides: Partial<Phase8ClosureAuditStatus> = {}
): Phase8ClosureAuditStatus {
  return {
    id: "phase-8-closure-audit-status",
    label: "Phase 8 closure audit status",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 45,
    phaseComplete: false,
    canAdvanceMutationPaths: false,
    openBlockerCount: 1,
    ownerActionBlockerCount: 0,
    auditReviewAddressableCount: 1,
    openExceptionCount: 1,
    blockedCategoryCount: 4,
    closureReady: false,
    handoffReady: false,
    completionGateReady: false,
    closureState: "waiting",
    handoffState: "waiting",
    completionGateState: "waiting",
    topClosureSourceId: "phase8-live-action-terminal:permission",
    topClosureStatus: "waiting",
    phase8ClosureAuditStatusProof: "phase8ClosureAuditStatusProof=state=waiting",
    nextAction: "Use owner audit review.",
    safety: "Phase 8 review only.",
    ariaLabel: "Phase 8 closure audit status.",
    ...overrides
  };
}

function ownerReviewClosureReadiness(
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
    openExceptionCount: 1,
    artifactReady: true,
    fingerprintCurrent: false,
    reviewedBlockerProof: false,
    handoffReady: false,
    completionGateReady: false,
    phaseComplete: false,
    canCloseOwnerReview: false,
    topAuditReviewSourceId: "phase8-live-action-terminal:permission",
    phase8OwnerReviewClosureReadinessProof:
      "phase8OwnerReviewClosureReadinessProof=state=waiting",
    nextAction: "Record local owner audit review.",
    safety: "Phase 8 review only.",
    ariaLabel: "Phase 8 owner-review closure readiness.",
    ...overrides
  };
}

function completionGate(
  overrides: Partial<Phase8PermissionAuditCompletionGate> = {}
): Phase8PermissionAuditCompletionGate {
  return {
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 45,
    phaseComplete: false,
    canAdvanceMutationPaths: false,
    ownerReviewAttached: false,
    artifactReady: true,
    mutationLocked: true,
    openBlockerCount: 1,
    openExceptionCount: 1,
    traceabilityTrusted: false,
    reviewedBlockerProof: false,
    ownerHandoffReady: false,
    ownerHandoffState: "waiting",
    ownerHandoffFingerprintCurrent: false,
    detail: "Waiting for owner review.",
    nextAction: "Record owner audit review.",
    completionGateProof: "phase8PermissionAuditCompletionGate state=waiting",
    ariaLabel: "Phase 8 completion gate.",
    ...overrides
  };
}

describe("phase 8 final completion handoff", () => {
  it("holds Phase 9 when owner review has not been recorded", () => {
    const handoff = buildPhase8FinalCompletionHandoff({
      riskClosure: riskClosure(),
      closureAuditStatus: closureAuditStatus(),
      ownerReviewClosureReadiness: ownerReviewClosureReadiness({
        auditReviewBlockersRemaining: 0
      }),
      completionGate: completionGate()
    });

    expect(handoff.state).toBe("waiting");
    expect(handoff.phaseComplete).toBe(false);
    expect(handoff.canAdvancePhase9).toBe(false);
    expect(handoff.canAdvanceMutationPaths).toBe(false);
    expect(handoff.topHold).toBe("owner-review-record");
    expect(handoff.nextLaneStatus).toBe("held");
    expect(handoff.phase8FinalCompletionHandoffProof).toContain(
      "phase8FinalCompletionHandoffProof"
    );
    expect(handoff.phase8FinalCompletionHandoffProof).toContain("phase9=held");
    expect(handoff.phase8FinalCompletionHandoffProof).toContain("mutationAdvance=no");
  });

  it("allows Phase 9 dependency only when all Phase 8 closure gates are ready", () => {
    const handoff = buildPhase8FinalCompletionHandoff({
      riskClosure: riskClosure({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canCloseBlockers: true,
        openBlockerCount: 0,
        auditReviewAddressableCount: 0,
        openExceptionCount: 0,
        topClosureStatus: "ready"
      }),
      closureAuditStatus: closureAuditStatus({
        state: "complete",
        statusLabel: "Complete",
        readiness: 100,
        phaseComplete: true,
        openBlockerCount: 0,
        auditReviewAddressableCount: 0,
        openExceptionCount: 0,
        blockedCategoryCount: 0,
        closureReady: true,
        handoffReady: true,
        completionGateReady: true,
        closureState: "ready",
        handoffState: "ready",
        completionGateState: "complete",
        topClosureStatus: "ready"
      }),
      ownerReviewClosureReadiness: ownerReviewClosureReadiness({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        ownerReviewRecorded: true,
        ownerReviewRecordable: false,
        auditReviewBlockersRemaining: 0,
        openBlockerCount: 0,
        openExceptionCount: 0,
        fingerprintCurrent: true,
        reviewedBlockerProof: true,
        handoffReady: true,
        completionGateReady: true,
        phaseComplete: true,
        canCloseOwnerReview: true,
        topAuditReviewSourceId: "phase8.audit-review.none"
      }),
      completionGate: completionGate({
        state: "complete",
        statusLabel: "Complete",
        readiness: 100,
        phaseComplete: true,
        ownerReviewAttached: true,
        openBlockerCount: 0,
        openExceptionCount: 0,
        traceabilityTrusted: true,
        reviewedBlockerProof: true,
        ownerHandoffReady: true,
        ownerHandoffState: "ready",
        ownerHandoffFingerprintCurrent: true
      })
    });

    expect(handoff.state).toBe("ready");
    expect(handoff.phaseComplete).toBe(true);
    expect(handoff.canAdvancePhase9).toBe(true);
    expect(handoff.canAdvanceMutationPaths).toBe(false);
    expect(handoff.topHold).toBe("none");
    expect(handoff.nextLaneStatus).toBe("ready");
    expect(handoff.nextAction).toContain("Phase 9 runner approval");
    expect(handoff.phase8FinalCompletionHandoffProof).toContain("phaseComplete=yes");
    expect(handoff.phase8FinalCompletionHandoffProof).toContain("phase9=ready");
  });
});
