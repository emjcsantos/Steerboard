import { describe, expect, it } from "vitest";
import type { Phase8PermissionAuditDepthSnapshot } from "./phase8PermissionAuditDepth";
import type {
  Phase8RiskBlockerPriorityItem,
  Phase8RiskBlockerPrioritySummary
} from "./phase8RiskBlockerPriority";
import { buildPhase8RiskClosure } from "./phase8RiskClosure";
import type { Phase8RiskTraceabilitySummary } from "./phase8RiskTraceability";

const waitingBlocker: Phase8RiskBlockerPriorityItem = {
  id: "blocker:terminal",
  sourceId: "phase8-live-action-terminal:permission",
  label: "terminal action",
  kind: "audit-depth",
  status: "waiting",
  severity: "medium",
  priority: 1,
  canUseAuditReview: true,
  detail: "Terminal permission is waiting.",
  nextAction: "Review Phase 8 audit evidence."
};

const ownerActionBlocker: Phase8RiskBlockerPriorityItem = {
  id: "blocker:goal",
  sourceId: "phase-08-risk-traceability:active-goal",
  label: "Remaining goal link",
  kind: "traceability",
  status: "waiting",
  severity: "medium",
  priority: 2,
  canUseAuditReview: false,
  detail: "Current goal link is waiting.",
  nextAction: "Restore one current active goal."
};

function snapshot(
  overrides: Partial<Phase8PermissionAuditDepthSnapshot> = {}
): Phase8PermissionAuditDepthSnapshot {
  return {
    id: "phase-08-permission-audit-depth",
    label: "Phase 8 permission and audit depth",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 55,
    riskyActionCount: 3,
    auditRecordCount: 1,
    openExceptionCount: 2,
    disabledPathCount: 2,
    readyCount: 0,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 2,
    permissionLabelSummaryProof: "permissionLabelSummaryProof=total=3",
    riskExceptionSummaryProof: "riskExceptionSummaryProof=total=2",
    nextAction: "Review Phase 8 evidence.",
    safety: "Phase 8 review only.",
    ariaLabel: "Phase 8 waiting.",
    items: [],
    exceptions: [
      {
        id: "exception:terminal",
        label: "terminal action",
        severity: "medium",
        status: "waiting",
        disabledPath: "Access stays disabled until permission is reviewed.",
        evidenceRequired: "Permission evidence required.",
        rollbackExpectation: "Rollback evidence remains required.",
        auditSource: "permission review record",
        pmTaskId: "phase-08-child-permission-labels",
        evidenceKey: "phase8.permission.terminal",
        riskExceptionProof: "riskExceptionProof=source=terminal"
      },
      {
        id: "exception:git",
        label: "git action",
        severity: "medium",
        status: "waiting",
        disabledPath: "Git mutation stays locked until permission is reviewed.",
        evidenceRequired: "Git evidence required.",
        rollbackExpectation: "Rollback evidence remains required.",
        auditSource: "permission review record",
        pmTaskId: "phase-08-child-permission-labels",
        evidenceKey: "phase8.permission.git",
        riskExceptionProof: "riskExceptionProof=source=git"
      }
    ],
    ...overrides
  };
}

function traceability(
  overrides: Partial<Phase8RiskTraceabilitySummary> = {}
): Phase8RiskTraceabilitySummary {
  return {
    id: "phase-08-risk-traceability",
    label: "Phase 8 risk traceability",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 70,
    canTrustPermissionAudit: false,
    readyCount: 2,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 3,
    missingPmTaskIds: [],
    linkedGoalId: "goal-phase-8-permission-audit",
    linkedPmTaskCount: 12,
    auditDepthItemCount: 10,
    exceptionCount: 10,
    openExceptionCount: 2,
    evidenceKeyCount: 20,
    disabledPathCount: 10,
    traceabilityProof: "traceabilityProof=goal=goal-phase-8-permission-audit",
    traceabilityRowStateProof: "traceabilityRowStateProof=rows=5",
    nextAction: "Review Phase 8 traceability.",
    safety: "Evidence only.",
    ariaLabel: "Traceability waiting.",
    items: [],
    ...overrides
  };
}

function blockerPriority(
  items: readonly Phase8RiskBlockerPriorityItem[],
  overrides: Partial<Phase8RiskBlockerPrioritySummary> = {}
): Phase8RiskBlockerPrioritySummary {
  return {
    id: "phase-08-risk-blocker-priority",
    label: "Phase 8 risk blocker priority",
    state: items.some((item) => item.status === "blocked") ? "blocked" : "waiting",
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
    blockerQueueProof: "blockerQueueProof=open=2",
    nextAction: items[0]?.nextAction ?? "No blockers remain.",
    safety: "Evidence only.",
    ariaLabel: "Blockers waiting.",
    items,
    ...overrides
  };
}

describe("phase 8 risk closure", () => {
  it("separates audit-review addressable blockers from owner-action blockers", () => {
    const closure = buildPhase8RiskClosure({
      snapshot: snapshot(),
      traceability: traceability(),
      blockerPriority: blockerPriority([waitingBlocker, ownerActionBlocker])
    });

    expect(closure.state).toBe("waiting");
    expect(closure.canCloseBlockers).toBe(false);
    expect(closure.auditReviewAddressableCount).toBe(1);
    expect(closure.ownerActionBlockerCount).toBe(1);
    expect(closure.openExceptionCount).toBe(2);
    expect(closure.phase8RiskClosureProof).toContain("phase8RiskClosureProof");
    expect(closure.phase8RiskClosureProof).toContain("auditReview=1");
    expect(closure.phase8RiskClosureProof).toContain("ownerAction=1");
    expect(closure.phase8RiskClosureProof).toContain("mutation=locked");
  });

  it("blocks closure when disabled-path mutation locks are missing", () => {
    const closure = buildPhase8RiskClosure({
      snapshot: snapshot({
        exceptions: [
          {
            ...snapshot().exceptions[0],
            disabledPath: "Path can execute."
          }
        ]
      }),
      traceability: traceability(),
      blockerPriority: blockerPriority([waitingBlocker])
    });

    expect(closure.state).toBe("blocked");
    expect(closure.mutationLocked).toBe(false);
    expect(closure.phase8RiskClosureProof).toContain("mutation=unlocked");
  });

  it("allows closure only when no blockers remain and traceability is trusted", () => {
    const closure = buildPhase8RiskClosure({
      snapshot: snapshot({
        state: "ready",
        statusLabel: "Ready",
        openExceptionCount: 0,
        exceptions: []
      }),
      traceability: traceability({
        state: "ready",
        statusLabel: "Ready",
        canTrustPermissionAudit: true,
        openExceptionCount: 0
      }),
      blockerPriority: blockerPriority([], {
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        openBlockerCount: 0,
        auditReviewAddressableCount: 0
      })
    });

    expect(closure.state).toBe("ready");
    expect(closure.canCloseBlockers).toBe(true);
    expect(closure.phase8RiskClosureProof).toContain("canClose=yes");
    expect(closure.nextAction).toContain("No Phase 8 blockers remain");
  });
});
