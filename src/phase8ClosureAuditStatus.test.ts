import { describe, expect, it } from "vitest";
import type { Phase8AuditReviewHandoff } from "./phase8AuditReviewHandoff";
import { buildPhase8ClosureAuditStatus } from "./phase8ClosureAuditStatus";
import type { Phase8PermissionAuditCompletionGate } from "./phase8PermissionAuditCompletionGate";
import type { Phase8RiskClosureSummary } from "./phase8RiskClosure";

const riskClosure: Phase8RiskClosureSummary = {
  id: "phase-08-risk-closure",
  label: "Phase 8 risk closure",
  state: "waiting",
  statusLabel: "Waiting",
  readiness: 35,
  canCloseBlockers: false,
  mutationLocked: true,
  openBlockerCount: 3,
  auditReviewAddressableCount: 2,
  ownerActionBlockerCount: 1,
  closureReadyCount: 0,
  openExceptionCount: 2,
  topClosureSourceId: "phase8-live-action-terminal:permission",
  topClosureStatus: "waiting",
  phase8RiskClosureProof: "phase8RiskClosureProof=state=waiting open=3",
  nextAction: "Use owner audit review on addressable blockers.",
  safety: "Evidence only.",
  ariaLabel: "Phase 8 risk closure."
};

const auditReviewHandoff: Phase8AuditReviewHandoff = {
  id: "phase-8-audit-review-handoff",
  label: "Phase 8 audit review handoff",
  state: "waiting",
  statusLabel: "Review recordable",
  readiness: 60,
  canRecordOwnerReview: true,
  ownerReviewRecorded: false,
  mutationLocked: true,
  artifactVerified: false,
  artifactState: "review",
  traceabilityTrusted: false,
  auditFingerprintCurrent: false,
  reviewedBlockerProof: false,
  openBlockerCount: 3,
  openExceptionCount: 2,
  topBlockerSourceId: "phase8-live-action-terminal:permission",
  topBlockerStatus: "waiting",
  topBlockerReviewable: true,
  phase8AuditReviewHandoffProof: "phase8AuditReviewHandoffProof=state=waiting",
  nextAction: "Record local owner audit review.",
  safety: "Evidence only.",
  ariaLabel: "Phase 8 audit review handoff."
};

const completionGate: Phase8PermissionAuditCompletionGate = {
  state: "waiting",
  statusLabel: "Waiting",
  readiness: 45,
  phaseComplete: false,
  canAdvanceMutationPaths: false,
  ownerReviewAttached: false,
  artifactReady: false,
  mutationLocked: true,
  openBlockerCount: 3,
  openExceptionCount: 2,
  traceabilityTrusted: false,
  reviewedBlockerProof: false,
  ownerHandoffReady: false,
  ownerHandoffState: "waiting",
  ownerHandoffFingerprintCurrent: false,
  detail: "Waiting for owner review.",
  nextAction: "Record owner audit review.",
  completionGateProof: "phase8PermissionAuditCompletionGate state=waiting",
  ariaLabel: "Phase 8 permission audit completion gate."
};

describe("phase 8 closure audit status", () => {
  it("summarizes open blocker categories without marking Phase 8 complete", () => {
    const status = buildPhase8ClosureAuditStatus({
      riskClosure,
      auditReviewHandoff,
      completionGate
    });

    expect(status.state).toBe("waiting");
    expect(status.phaseComplete).toBe(false);
    expect(status.blockedCategoryCount).toBe(7);
    expect(status.openBlockerCount).toBe(3);
    expect(status.ownerActionBlockerCount).toBe(1);
    expect(status.auditReviewAddressableCount).toBe(2);
    expect(status.phase8ClosureAuditStatusProof).toContain("phase8ClosureAuditStatusProof");
    expect(status.phase8ClosureAuditStatusProof).toContain("phaseComplete=no");
    expect(status.phase8ClosureAuditStatusProof).toContain("blockedCategories=7");
    expect(status.phase8ClosureAuditStatusProof).toContain("handoff=waiting");
    expect(status.phase8ClosureAuditStatusProof).toContain("gate=waiting");
  });

  it("prioritizes owner-action blockers before audit-review blockers", () => {
    const status = buildPhase8ClosureAuditStatus({
      riskClosure: { ...riskClosure, state: "review", statusLabel: "Review" },
      auditReviewHandoff: { ...auditReviewHandoff, state: "review" },
      completionGate: { ...completionGate, state: "review" }
    });

    expect(status.state).toBe("review");
    expect(status.nextAction).toContain("owner-action Phase 8 blockers");
  });

  it("reports complete only when closure, handoff, and completion gate are all ready", () => {
    const status = buildPhase8ClosureAuditStatus({
      riskClosure: {
        ...riskClosure,
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canCloseBlockers: true,
        openBlockerCount: 0,
        auditReviewAddressableCount: 0,
        ownerActionBlockerCount: 0,
        openExceptionCount: 0,
        topClosureSourceId: "phase8.risk-blocker.none",
        topClosureStatus: "ready"
      },
      auditReviewHandoff: {
        ...auditReviewHandoff,
        state: "ready",
        statusLabel: "Review recorded",
        readiness: 100,
        ownerReviewRecorded: true,
        artifactVerified: true,
        auditFingerprintCurrent: true,
        reviewedBlockerProof: true
      },
      completionGate: {
        ...completionGate,
        state: "complete",
        statusLabel: "Complete",
        readiness: 100,
        phaseComplete: true,
        ownerReviewAttached: true,
        artifactReady: true,
        openBlockerCount: 0,
        openExceptionCount: 0,
        traceabilityTrusted: true,
        reviewedBlockerProof: true,
        ownerHandoffReady: true,
        ownerHandoffState: "ready",
        ownerHandoffFingerprintCurrent: true
      }
    });

    expect(status.state).toBe("complete");
    expect(status.phaseComplete).toBe(true);
    expect(status.blockedCategoryCount).toBe(0);
    expect(status.phase8ClosureAuditStatusProof).toContain("phaseComplete=yes");
    expect(status.nextAction).toContain("Phase 9 runner approval");
  });
});
