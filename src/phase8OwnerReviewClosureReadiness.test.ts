import { describe, expect, it } from "vitest";
import type {
  Phase8AuditReviewBlockerHandoff
} from "./phase8AuditReviewBlockerHandoff";
import type { Phase8AuditReviewHandoff } from "./phase8AuditReviewHandoff";
import {
  buildPhase8OwnerReviewClosureReadiness
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

function auditReviewHandoff(
  overrides: Partial<Phase8AuditReviewHandoff> = {}
): Phase8AuditReviewHandoff {
  return {
    id: "phase-8-audit-review-handoff",
    label: "Phase 8 audit review handoff",
    state: "waiting",
    statusLabel: "Review recordable",
    readiness: 60,
    canRecordOwnerReview: true,
    ownerReviewRecorded: false,
    mutationLocked: true,
    artifactVerified: true,
    artifactState: "ready",
    traceabilityTrusted: false,
    auditFingerprintCurrent: false,
    reviewedBlockerProof: false,
    openBlockerCount: 1,
    openExceptionCount: 1,
    topBlockerSourceId: "phase8-live-action-terminal:permission",
    topBlockerStatus: "waiting",
    topBlockerReviewable: true,
    phase8AuditReviewHandoffProof: "phase8AuditReviewHandoffProof=state=waiting",
    nextAction: "Record local owner audit review.",
    safety: "Phase 8 review only.",
    ariaLabel: "Phase 8 audit review handoff.",
    ...overrides
  };
}

function auditReviewBlockerHandoff(
  overrides: Partial<Phase8AuditReviewBlockerHandoff> = {}
): Phase8AuditReviewBlockerHandoff {
  return {
    id: "phase-8-audit-review-blocker-handoff",
    label: "Phase 8 audit-review blocker handoff",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 50,
    auditReviewBlockerCount: 1,
    ownerActionBlockerCount: 0,
    openBlockerCount: 1,
    ownerActionClear: true,
    canRecordAuditReview: true,
    topAuditReviewSourceId: "phase8-live-action-terminal:permission",
    topAuditReviewLabel: "terminal action",
    topAuditReviewStatus: "waiting",
    topAuditReviewKind: "audit-depth",
    topAuditReviewPriority: 1,
    topAuditReviewNextAction: "Review Phase 8 audit evidence.",
    phase8AuditReviewBlockerHandoffProof:
      "phase8AuditReviewBlockerHandoffProof=state=waiting",
    nextAction: "Review audit-review blocker phase8-live-action-terminal:permission.",
    safety: "Phase 8 review only.",
    ariaLabel: "Phase 8 audit-review blocker handoff.",
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

describe("phase 8 owner-review closure readiness", () => {
  it("waits on audit-review blockers before owner-review closure", () => {
    const readiness = buildPhase8OwnerReviewClosureReadiness({
      riskClosure: riskClosure(),
      auditReviewHandoff: auditReviewHandoff(),
      auditReviewBlockerHandoff: auditReviewBlockerHandoff(),
      completionGate: completionGate()
    });

    expect(readiness.state).toBe("waiting");
    expect(readiness.ownerReviewRecorded).toBe(false);
    expect(readiness.auditReviewBlockersRemaining).toBe(1);
    expect(readiness.canCloseOwnerReview).toBe(false);
    expect(readiness.nextAction).toContain("Review audit-review blocker");
    expect(readiness.phase8OwnerReviewClosureReadinessProof).toContain(
      "phase8OwnerReviewClosureReadinessProof"
    );
    expect(readiness.phase8OwnerReviewClosureReadinessProof).toContain("auditReviewBlockers=1");
    expect(readiness.phase8OwnerReviewClosureReadinessProof).toContain("canClose=no");
  });

  it("is ready only with owner review, current fingerprint, reviewed blocker, and completion gate", () => {
    const readiness = buildPhase8OwnerReviewClosureReadiness({
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
      auditReviewHandoff: auditReviewHandoff({
        state: "ready",
        statusLabel: "Review recorded",
        readiness: 100,
        canRecordOwnerReview: false,
        ownerReviewRecorded: true,
        traceabilityTrusted: true,
        auditFingerprintCurrent: true,
        reviewedBlockerProof: true,
        openBlockerCount: 0,
        openExceptionCount: 0
      }),
      auditReviewBlockerHandoff: auditReviewBlockerHandoff({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        auditReviewBlockerCount: 0,
        openBlockerCount: 0,
        canRecordAuditReview: false,
        topAuditReviewSourceId: "phase8.audit-review.none",
        topAuditReviewStatus: "ready",
        topAuditReviewKind: "none",
        topAuditReviewPriority: 0
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

    expect(readiness.state).toBe("ready");
    expect(readiness.phaseComplete).toBe(true);
    expect(readiness.canCloseOwnerReview).toBe(true);
    expect(readiness.nextAction).toContain("preserve Phase 8 completion proof");
    expect(readiness.phase8OwnerReviewClosureReadinessProof).toContain("recorded=yes");
    expect(readiness.phase8OwnerReviewClosureReadinessProof).toContain("fingerprint=current");
    expect(readiness.phase8OwnerReviewClosureReadinessProof).toContain("canClose=yes");
  });
});
