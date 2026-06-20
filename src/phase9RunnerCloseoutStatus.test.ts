import { describe, expect, it } from "vitest";
import type { Phase9RunnerApprovalDepthSummary } from "./phase9RunnerApprovalDepth";
import type { Phase9RunnerApprovalSnapshot } from "./phase9RunnerApproval";
import type { Phase9RunnerBlockerPrioritySummary } from "./phase9RunnerBlockerPriority";
import type { Phase9RunnerCompletionGate } from "./phase9RunnerCompletionGate";
import {
  buildPhase9RunnerCloseoutStatus
} from "./phase9RunnerCloseoutStatus";
import type {
  Phase9DesktopProbeGate,
  Phase9RunnerTraceabilitySummary
} from "./phase9RunnerTraceability";

function approval(overrides: Partial<Phase9RunnerApprovalSnapshot> = {}): Phase9RunnerApprovalSnapshot {
  return {
    id: "phase-09-desktop-runner-approval",
    label: "Phase 9 desktop runner approval",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    selectedAction: "terminal-readonly-probe",
    canRequestDesktopProbe: true,
    auditRecordCount: 2,
    readyCount: 8,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    runnerApprovalProof: "items=8/8 requestGate=ready execution=locked",
    nextAction: "Keep the fixed probe approval attached.",
    safety: "Phase 9 review only.",
    ariaLabel: "Phase 9 approval.",
    items: Array.from({ length: 8 }, (_, index) => ({
      id: `approval-${index}`,
      label: `Approval ${index}`,
      kind: "selected-action",
      status: "ready",
      detail: "Approval evidence ready.",
      nextAction: "Keep approval evidence attached."
    })),
    ...overrides
  };
}

function approvalDepth(
  overrides: Partial<Phase9RunnerApprovalDepthSummary> = {}
): Phase9RunnerApprovalDepthSummary {
  return {
    id: "phase-09-desktop-runner-approval:depth",
    label: "Phase 9 runner approval depth",
    records: Array.from({ length: 8 }, (_, index) => ({
      id: `depth-${index}`,
      label: `Depth ${index}`,
      kind: "desktop-execution-lock",
      pmTaskId: "phase-09-child-approval-depth",
      evidenceKey: `phase9.depth-${index}`,
      status: "ready",
      statusLabel: "Ready",
      evidence: "Runner approval depth evidence.",
      nextAction: "Keep runner approval depth attached.",
      locksMutation: index < 6
    })),
    readyCount: 8,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    mutationLockCount: 6,
    runnerApprovalDepthProof: "records=8/8 mutationLocks=6/6 execution=locked",
    ariaLabel: "Phase 9 approval depth ready.",
    ...overrides
  };
}

function traceability(
  overrides: Partial<Phase9RunnerTraceabilitySummary> = {}
): Phase9RunnerTraceabilitySummary {
  return {
    id: "phase-09-runner-traceability",
    label: "Phase 9 runner traceability",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canTrustRunnerApproval: true,
    readyCount: 6,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    missingPmTaskIds: [],
    linkedGoalId: "goal-phase-9-runner",
    linkedPmTaskCount: 11,
    phase8OpenExceptionCount: 0,
    mutationLockCount: 6,
    runnerReviewRecordReady: true,
    runnerTraceabilityProof: "items=6/6 pmLinks=11/11 trust=ready execution=locked",
    nextAction: "Keep Phase 9 runner traceability attached.",
    safety: "Phase 9 traceability only.",
    ariaLabel: "Phase 9 traceability.",
    items: [],
    ...overrides
  };
}

function blockerPriority(
  overrides: Partial<Phase9RunnerBlockerPrioritySummary> = {}
): Phase9RunnerBlockerPrioritySummary {
  return {
    id: "phase-09-runner-blocker-priority",
    label: "Phase 9 runner blocker priority",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    openBlockerCount: 0,
    runnerReviewAddressableCount: 0,
    topPriorityLabel: "No open Phase 9 runner blocker",
    topPriorityAction: "Keep the fixed probe locked.",
    topPrioritySourceId: "phase9.runner.none",
    topPriorityKind: "none",
    topPriorityStatus: "ready",
    runnerReviewCanAddressTopBlocker: false,
    runnerBlockerPriorityProof: "open=0 execution=locked",
    nextAction: "Keep the fixed probe locked.",
    safety: "Phase 9 blocker priority only.",
    ariaLabel: "Phase 9 blocker priority.",
    items: [],
    ...overrides
  };
}

function requestGate(overrides: Partial<Phase9DesktopProbeGate> = {}): Phase9DesktopProbeGate {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canRun: true,
    holdReason: "Run a fixed read-only terminal probe through the desktop runner.",
    phase9RequestGateProof:
      "phase9RequestGateProof=state=ready readiness=100 canRun=yes execution=locked",
    safety: "Phase 9 request gate only.",
    ariaLabel: "Phase 9 request gate.",
    ...overrides
  };
}

function completionGate(
  overrides: Partial<Phase9RunnerCompletionGate> = {}
): Phase9RunnerCompletionGate {
  return {
    id: "phase-9-runner-completion-gate",
    label: "Phase 9 runner completion gate",
    state: "complete",
    statusLabel: "Complete",
    readiness: 100,
    phaseComplete: true,
    canAdvanceFixedProbe: true,
    canExpandRunnerActions: false,
    approvalReady: true,
    traceabilityTrusted: true,
    blockerPriorityClear: true,
    requestGateReady: true,
    openBlockerCount: 0,
    phase8OpenExceptionCount: 0,
    mutationLockCount: 6,
    topHold: "none",
    completionGateProof:
      "phase9RunnerCompletionGateProof=state=complete phaseComplete=yes fixedProbe=ready runnerExpansion=locked",
    nextAction: "Phase 9 can advance only the fixed terminal-readonly-probe.",
    safety: "Phase 9 completion gate only.",
    ariaLabel: "Phase 9 completion gate.",
    ...overrides
  };
}

describe("phase 9 runner closeout status", () => {
  it("completes when the fixed probe gates are ready and runner expansion stays locked", () => {
    const status = buildPhase9RunnerCloseoutStatus({
      approval: approval(),
      approvalDepth: approvalDepth(),
      traceability: traceability(),
      blockerPriority: blockerPriority(),
      requestGate: requestGate(),
      completionGate: completionGate()
    });

    expect(status.state).toBe("complete");
    expect(status.implementationComplete).toBe(true);
    expect(status.fixedProbeReady).toBe(true);
    expect(status.runnerExpansionLocked).toBe(true);
    expect(status.phase9RunnerCloseoutStatusProof).toContain(
      "phase9RunnerCloseoutStatusProof=state=complete"
    );
    expect(status.phase9RunnerCloseoutStatusProof).toContain("pmLinks=11/11");
    expect(status.phase9RunnerCloseoutStatusProof).toContain("runnerExpansion=locked");
  });

  it("keeps closeout waiting when current-goal traceability still holds the request gate", () => {
    const status = buildPhase9RunnerCloseoutStatus({
      approval: approval(),
      approvalDepth: approvalDepth(),
      traceability: traceability({
        state: "waiting",
        statusLabel: "Waiting",
        readiness: 89,
        canTrustRunnerApproval: false,
        waitingCount: 1,
        runnerTraceabilityProof: "items=6/6 pmLinks=11/11 trust=held execution=locked",
        nextAction: "Make Phase 9 the current active goal."
      }),
      blockerPriority: blockerPriority({
        state: "waiting",
        statusLabel: "Waiting",
        readiness: 35,
        openBlockerCount: 1,
        topPriorityLabel: "Remaining goal link",
        topPriorityKind: "traceability",
        topPriorityStatus: "waiting",
        runnerBlockerPriorityProof: "open=1 execution=locked",
        nextAction: "Make Phase 9 current before running the probe."
      }),
      requestGate: requestGate({
        state: "waiting",
        statusLabel: "Waiting",
        readiness: 50,
        canRun: false,
        holdReason: "goal-phase-9-runner is next."
      }),
      completionGate: completionGate({
        state: "waiting",
        statusLabel: "Waiting",
        readiness: 60,
        phaseComplete: false,
        canAdvanceFixedProbe: false,
        traceabilityTrusted: false,
        blockerPriorityClear: false,
        requestGateReady: false,
        openBlockerCount: 1,
        topHold: "request-gate"
      })
    });

    expect(status.state).toBe("waiting");
    expect(status.implementationComplete).toBe(true);
    expect(status.fixedProbeReady).toBe(false);
    expect(status.topHold).toBe("traceability");
    expect(status.nextAction).toBe("Make Phase 9 the current active goal.");
    expect(status.phase9RunnerCloseoutStatusProof).toContain("fixedProbe=held");
  });

  it("blocks closeout when request-gate evidence is blocked", () => {
    const status = buildPhase9RunnerCloseoutStatus({
      approval: approval(),
      approvalDepth: approvalDepth(),
      traceability: traceability(),
      blockerPriority: blockerPriority(),
      requestGate: requestGate({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 0,
        canRun: false,
        holdReason: "Request gate blocked."
      }),
      completionGate: completionGate({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 0,
        phaseComplete: false,
        canAdvanceFixedProbe: false,
        requestGateReady: false,
        topHold: "request-gate"
      })
    });

    expect(status.state).toBe("blocked");
    expect(status.fixedProbeReady).toBe(false);
    expect(status.phase9RunnerCloseoutStatusProof).toContain("requestGate=held");
  });
});
