import { describe, expect, it } from "vitest";
import type { Phase4ProviderBlockerPrioritySummary } from "./phase4ProviderBlockerPriority";
import {
  buildPhase4ProviderCompletionStatus
} from "./phase4ProviderCompletionStatus";
import type { Phase4ProviderCatalogDepthSummary } from "./phase4ProviderCatalogDepth";
import type { Phase4ProviderSurfaceDepthSnapshot } from "./phase4ProviderSurfaceDepth";
import type { Phase4ProviderTraceabilitySummary } from "./phase4ProviderTraceability";
import type { Phase4RefreshSafetyDepthSummary } from "./phase4RefreshSafetyDepth";
import type { ProviderExecutionGate } from "./providerExecutionGate";

function catalogDepth(
  overrides: Partial<Phase4ProviderCatalogDepthSummary> = {}
): Phase4ProviderCatalogDepthSummary {
  return {
    id: "phase-4-provider-catalog-depth",
    label: "Phase 4 provider catalog depth",
    records: Array.from({ length: 6 }, (_, index) => ({
      id: `catalog-${index}`,
      label: `Catalog ${index}`,
      kind: "command",
      status: "ready",
      statusLabel: "Ready",
      sourceLabel: "Provider live",
      total: 2,
      itemOrder: ["one", "two"],
      metadataProof: ["metadata"],
      scopedExecutionProof: "metadataOnly=locked execution=locked",
      evidenceKey: `catalog-${index}`,
      readiness: 100,
      evidence: "Ready provider catalog evidence.",
      ownerSafeProof: "Owner-safe provider catalog proof.",
      nextAction: "Keep provider catalog proof attached.",
      safety: "metadata/status-only",
      executionLocked: true
    })),
    readyCount: 6,
    previewCount: 0,
    setupRequiredCount: 0,
    heldCount: 0,
    executionLockCount: 6,
    nextAction: "Keep provider catalog proof attached.",
    catalogDepthProof: "records=6/6 metadataOnly=locked execution=locked",
    commandSkillProof: "command=ready skill=ready metadataOnly=locked execution=locked",
    pluginMcpProof: "plugin=ready mcp=ready metadataOnly=locked execution=locked",
    ariaLabel: "Phase 4 provider catalog depth ready.",
    ...overrides
  };
}

function refreshSafety(
  overrides: Partial<Phase4RefreshSafetyDepthSummary> = {}
): Phase4RefreshSafetyDepthSummary {
  return {
    id: "phase-4-refresh-safety-depth",
    label: "Phase 4 refresh safety depth",
    records: Array.from({ length: 8 }, (_, index) => ({
      id: `refresh-${index}`,
      label: `Refresh ${index}`,
      kind: "run-state",
      status: "ready",
      statusLabel: "Ready",
      evidence: "Refresh safety proof.",
      nextAction: "Keep refresh safety proof attached."
    })),
    readyCount: 8,
    previewCount: 0,
    blockedCount: 0,
    refreshSmokeProof: "surfaces=6/6 metadataOnly=locked execution=locked",
    refreshSafetyDepthProof: "records=8/8 metadataOnly=locked execution=locked",
    nextAction: "Keep refresh safety proof attached.",
    ariaLabel: "Phase 4 refresh safety depth ready.",
    ...overrides
  };
}

function surfaceDepth(
  overrides: Partial<Phase4ProviderSurfaceDepthSnapshot> = {}
): Phase4ProviderSurfaceDepthSnapshot {
  return {
    id: "phase-4-provider-surface-depth",
    label: "Phase 4 provider surface depth",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canEnableExecution: false,
    attentionCount: 0,
    readyCount: 9,
    previewCount: 0,
    setupRequiredCount: 0,
    heldCount: 0,
    nextSurfaceLabel: "Execution lock",
    nextAction: "Keep provider execution locked.",
    safety: "metadata/status-only",
    surfaceDepthProof: "items=9/9 ownerBoundary=present metadataOnly=locked execution=locked",
    localRecordValidationProof:
      "approvalValidation=ready auditValidation=ready rollbackValidation=ready permissionValidation=ready metadataOnly=locked execution=locked",
    ariaLabel: "Phase 4 provider surface depth ready.",
    items: Array.from({ length: 9 }, (_, index) => ({
      id: `surface-${index}`,
      label: `Surface ${index}`,
      kind: "execution-lock",
      status: "ready",
      evidenceKey: `surface-${index}`,
      detail: "Surface evidence ready.",
      nextAction: "Keep provider execution locked."
    })),
    ...overrides
  };
}

function traceability(
  overrides: Partial<Phase4ProviderTraceabilitySummary> = {}
): Phase4ProviderTraceabilitySummary {
  return {
    id: "phase-04-provider-traceability",
    label: "Phase 4 provider traceability",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canTrustProviderReview: true,
    readyCount: 7,
    previewCount: 0,
    setupRequiredCount: 0,
    heldCount: 0,
    missingPmTaskIds: [],
    linkedGoalId: "goal-phase-4-provider-surfaces",
    linkedPmTaskCount: 16,
    catalogDepthRecordCount: 6,
    refreshSafetyRecordCount: 8,
    surfaceDepthItemCount: 9,
    executionLockCount: 6,
    traceabilityProof:
      "items=7/7 activeGoal=goal-phase-4-provider-surfaces pmLinks=16/16 trust=ready metadataOnly=locked execution=locked",
    nextAction: "Keep Phase 4 provider traceability attached.",
    safety: "metadata/status-only",
    ariaLabel: "Phase 4 provider traceability ready.",
    items: Array.from({ length: 7 }, (_, index) => ({
      id: `trace-${index}`,
      label: `Trace ${index}`,
      kind: "execution-lock",
      status: "ready",
      detail: "Trace evidence ready.",
      nextAction: "Keep trace evidence attached."
    })),
    ...overrides
  };
}

function blockerPriority(
  overrides: Partial<Phase4ProviderBlockerPrioritySummary> = {}
): Phase4ProviderBlockerPrioritySummary {
  return {
    id: "phase-4-provider-blocker-priority",
    label: "Phase 4 provider blocker priority",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    openBlockerCount: 0,
    catalogSmokeAddressableCount: 0,
    topPriorityLabel: "No open Phase 4 provider blocker",
    topPriorityAction: "Keep provider execution locked.",
    topPrioritySourceId: "phase4.provider-blocker.none",
    topPriorityKind: "none",
    topPriorityStatus: "ready",
    topPriorityEvidenceKey: "phase-04-provider-blocker:none",
    catalogSmokeCanAddressTopBlocker: false,
    blockerPriorityProof:
      "open=0 recordChain=ready traceability=ready metadataOnly=locked execution=locked",
    nextAction: "Keep provider execution locked.",
    safety: "metadata/status-only",
    ariaLabel: "Phase 4 provider blocker priority ready.",
    items: [],
    ...overrides
  };
}

function executionGate(overrides: Partial<ProviderExecutionGate> = {}): ProviderExecutionGate {
  return {
    id: "provider-execution-gate",
    label: "Provider execution gate",
    state: "review",
    statusLabel: "Review",
    readiness: 65,
    canRequestExecution: false,
    providerSupportedCount: 4,
    approvalRecordedCount: 0,
    requiredSurfaceCount: 4,
    readyCount: 0,
    reviewCount: 4,
    blockedCount: 0,
    waitingCount: 0,
    detail: "4/4 execution surfaces have explicit provider-live support; 0/4 have explicit approval evidence.",
    nextAction: "Record explicit owner approval before provider execution can be requested.",
    safety: "Provider execution gate is evidence-only.",
    executionGateProof:
      "providerExecutionGate state=review canRequest=no support=4/4 approval=0/4 surfaces=skill:review:support=yes:approval=no|plugin:review:support=yes:approval=no|mcp:review:support=yes:approval=no|automation:review:support=yes:approval=no safety=metadata-only",
    items: [],
    ...overrides
  };
}

describe("phase 4 provider completion status", () => {
  it("marks Phase 4 complete only when all aggregate proof is trusted and execution stays locked", () => {
    const status = buildPhase4ProviderCompletionStatus({
      catalogDepth: catalogDepth(),
      refreshSafety: refreshSafety(),
      surfaceDepth: surfaceDepth(),
      traceability: traceability(),
      blockerPriority: blockerPriority(),
      executionGate: executionGate()
    });

    expect(status.state).toBe("complete");
    expect(status.phaseComplete).toBe(true);
    expect(status.canAdvanceMigrationReview).toBe(true);
    expect(status.providerExecutionLocked).toBe(true);
    expect(status.providerExecutionGateHeld).toBe(true);
    expect(status.phase4ProviderCompletionStatusProof).toContain(
      "phase4ProviderCompletionStatusProof=state=complete"
    );
    expect(status.phase4ProviderCompletionStatusProof).toContain("pmLinks=16/16");
    expect(status.phase4ProviderCompletionStatusProof).toContain("providerGate=held");
    expect(status.phase4ProviderCompletionStatusProof).toContain("execution=locked");
  });

  it("keeps completion in review when provider blockers remain open", () => {
    const status = buildPhase4ProviderCompletionStatus({
      catalogDepth: catalogDepth(),
      refreshSafety: refreshSafety(),
      surfaceDepth: surfaceDepth(),
      traceability: traceability(),
      executionGate: executionGate(),
      blockerPriority: blockerPriority({
        state: "preview",
        statusLabel: "Preview",
        readiness: 90,
        openBlockerCount: 1,
        topPriorityLabel: "Approval gate",
        topPriorityAction: "Complete provider approval record.",
        topPrioritySourceId: "phase-4-provider-surface-depth:approval-gate",
        topPriorityKind: "surface-depth",
        topPriorityStatus: "preview",
        topPriorityEvidenceKey: "phase-04-surface-depth:approval-gate",
        blockerPriorityProof:
          "open=1 recordChain=review traceability=ready metadataOnly=locked execution=locked",
        nextAction: "Complete provider approval record."
      })
    });

    expect(status.state).toBe("review");
    expect(status.phaseComplete).toBe(false);
    expect(status.topHold).toBe("blocker-priority");
    expect(status.nextAction).toBe("Complete provider approval record.");
    expect(status.phase4ProviderCompletionStatusProof).toContain("blockers=open");
  });

  it("blocks completion when refresh-safety evidence is blocked", () => {
    const status = buildPhase4ProviderCompletionStatus({
      catalogDepth: catalogDepth(),
      refreshSafety: refreshSafety({
        readyCount: 7,
        blockedCount: 1,
        records: refreshSafety().records.map((record, index) =>
          index === 0 ? { ...record, status: "blocked" as const, statusLabel: "Blocked" } : record
        )
      }),
      surfaceDepth: surfaceDepth(),
      traceability: traceability(),
      blockerPriority: blockerPriority(),
      executionGate: executionGate()
    });

    expect(status.state).toBe("blocked");
    expect(status.phaseComplete).toBe(false);
    expect(status.topHold).toBe("refresh-safety");
    expect(status.phase4ProviderCompletionStatusProof).toContain("refresh=held");
  });

  it("keeps completion in review when provider execution can be requested", () => {
    const status = buildPhase4ProviderCompletionStatus({
      catalogDepth: catalogDepth(),
      refreshSafety: refreshSafety(),
      surfaceDepth: surfaceDepth(),
      traceability: traceability(),
      blockerPriority: blockerPriority(),
      executionGate: executionGate({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canRequestExecution: true,
        approvalRecordedCount: 4,
        readyCount: 4,
        reviewCount: 0,
        nextAction: "Keep provider execution requests attached to explicit support and approval evidence.",
        executionGateProof:
          "providerExecutionGate state=ready canRequest=yes support=4/4 approval=4/4 surfaces=skill:ready:support=yes:approval=yes|plugin:ready:support=yes:approval=yes|mcp:ready:support=yes:approval=yes|automation:ready:support=yes:approval=yes safety=metadata-only"
      })
    });

    expect(status.state).toBe("review");
    expect(status.phaseComplete).toBe(false);
    expect(status.providerExecutionGateHeld).toBe(false);
    expect(status.providerExecutionLocked).toBe(false);
    expect(status.topHold).toBe("provider-execution-gate");
    expect(status.nextAction).toContain("Hold provider execution requests");
    expect(status.phase4ProviderCompletionStatusProof).toContain("providerGate=requestable");
    expect(status.phase4ProviderCompletionStatusProof).toContain("execution=review");
  });
});
