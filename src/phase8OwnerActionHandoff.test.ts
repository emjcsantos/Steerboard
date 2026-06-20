import { describe, expect, it } from "vitest";
import type { Phase8ClosureAuditStatus } from "./phase8ClosureAuditStatus";
import {
  buildPhase8OwnerActionHandoff
} from "./phase8OwnerActionHandoff";
import type {
  Phase8RiskBlockerPriorityItem,
  Phase8RiskBlockerPrioritySummary
} from "./phase8RiskBlockerPriority";
import type { Phase8RiskClosureSummary } from "./phase8RiskClosure";

const ownerActionBlocker: Phase8RiskBlockerPriorityItem = {
  id: "blocker:pm",
  sourceId: "phase-08-risk-traceability:pm-coverage",
  label: "PM row coverage",
  kind: "traceability",
  status: "waiting",
  severity: "medium",
  priority: 1,
  canUseAuditReview: false,
  detail: "PM coverage is waiting.",
  nextAction: "Add the missing PM child link."
};

const auditReviewBlocker: Phase8RiskBlockerPriorityItem = {
  id: "blocker:audit",
  sourceId: "phase8-live-action-terminal:permission",
  label: "terminal action",
  kind: "audit-depth",
  status: "waiting",
  severity: "medium",
  priority: 2,
  canUseAuditReview: true,
  detail: "Terminal permission is waiting.",
  nextAction: "Review Phase 8 audit evidence."
};

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

function blockerPriority(
  items: readonly Phase8RiskBlockerPriorityItem[]
): Phase8RiskBlockerPrioritySummary {
  return {
    id: "phase-08-risk-blocker-priority",
    label: "Phase 8 risk blocker priority",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 35,
    openBlockerCount: items.length,
    auditReviewAddressableCount: items.filter((item) => item.canUseAuditReview).length,
    topPriorityLabel: items[0]?.label ?? "No open Phase 8 risk blocker",
    topPriorityAction: items[0]?.nextAction ?? "No blockers remain.",
    topPrioritySourceId: items[0]?.sourceId ?? "phase8.risk-blocker.none",
    topPriorityKind: items[0]?.kind ?? "none",
    topPriorityStatus: items[0]?.status ?? "ready",
    auditReviewCanAddressTopBlocker: items[0]?.canUseAuditReview === true,
    topBlockerProof: "topBlockerProof=source=phase8-live-action-terminal:permission",
    blockerQueueProof: "blockerQueueProof=open=1",
    nextAction: items[0]?.nextAction ?? "No blockers remain.",
    safety: "Evidence only.",
    ariaLabel: "Blockers waiting.",
    items
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

describe("phase 8 owner action handoff", () => {
  it("proves owner-action blockers are clear before audit-review blockers continue", () => {
    const handoff = buildPhase8OwnerActionHandoff({
      riskClosure: riskClosure(),
      blockerPriority: blockerPriority([auditReviewBlocker]),
      closureAuditStatus: closureAuditStatus()
    });

    expect(handoff.state).toBe("ready");
    expect(handoff.ownerActionBlockerCount).toBe(0);
    expect(handoff.auditReviewAddressableCount).toBe(1);
    expect(handoff.canContinueAuditReview).toBe(true);
    expect(handoff.nextAction).toContain("continue with audit-review addressable");
    expect(handoff.phase8OwnerActionHandoffProof).toContain("phase8OwnerActionHandoffProof");
    expect(handoff.phase8OwnerActionHandoffProof).toContain("ownerAction=0");
    expect(handoff.phase8OwnerActionHandoffProof).toContain("canContinueAuditReview=yes");
  });

  it("names the top owner-action blocker without using audit review", () => {
    const handoff = buildPhase8OwnerActionHandoff({
      riskClosure: riskClosure({
        ownerActionBlockerCount: 1,
        openBlockerCount: 2
      }),
      blockerPriority: blockerPriority([ownerActionBlocker, auditReviewBlocker]),
      closureAuditStatus: closureAuditStatus({
        ownerActionBlockerCount: 1,
        openBlockerCount: 2
      })
    });

    expect(handoff.state).toBe("waiting");
    expect(handoff.ownerActionBlockerCount).toBe(1);
    expect(handoff.canContinueAuditReview).toBe(false);
    expect(handoff.topOwnerActionSourceId).toBe("phase-08-risk-traceability:pm-coverage");
    expect(handoff.topOwnerActionNextAction).toBe("Add the missing PM child link.");
    expect(handoff.nextAction).toContain("Resolve owner-action blocker");
    expect(handoff.phase8OwnerActionHandoffProof).toContain("ownerAction=1");
    expect(handoff.phase8OwnerActionHandoffProof).toContain("topStatus=waiting");
  });
});
