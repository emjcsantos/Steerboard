import { describe, expect, it } from "vitest";
import type { Phase9RunnerApprovalSnapshot } from "./phase9RunnerApproval";
import {
  buildPhase9RunnerCompletionGate
} from "./phase9RunnerCompletionGate";
import type { Phase9RunnerBlockerPrioritySummary } from "./phase9RunnerBlockerPriority";
import type {
  Phase9DesktopProbeGate,
  Phase9RunnerTraceabilitySummary
} from "./phase9RunnerTraceability";

function approval(overrides: Partial<Phase9RunnerApprovalSnapshot> = {}): Phase9RunnerApprovalSnapshot {
  return {
    id: "phase-09-desktop-runner-approval",
    label: "Phase 9 desktop runner approval",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 65,
    selectedAction: "terminal-readonly-probe",
    canRequestDesktopProbe: false,
    auditRecordCount: 0,
    readyCount: 3,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 5,
    runnerApprovalProof: "items=8/8 requestGate=held execution=locked",
    nextAction: "Request owner approval for the fixed terminal read-only probe.",
    safety: "Phase 9 review only.",
    ariaLabel: "Phase 9 approval.",
    items: [],
    ...overrides
  };
}

function traceability(
  overrides: Partial<Phase9RunnerTraceabilitySummary> = {}
): Phase9RunnerTraceabilitySummary {
  return {
    id: "phase-09-runner-traceability",
    label: "Phase 9 runner traceability",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 89,
    canTrustRunnerApproval: false,
    readyCount: 5,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 1,
    missingPmTaskIds: [],
    linkedGoalId: "goal-phase-9-runner",
    linkedPmTaskCount: 10,
    phase8OpenExceptionCount: 0,
    mutationLockCount: 6,
    runnerReviewRecordReady: true,
    runnerTraceabilityProof: "items=6/6 pmLinks=10/10 trust=held execution=locked",
    nextAction: "Make Phase 9 the current active goal.",
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
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 35,
    openBlockerCount: 1,
    runnerReviewAddressableCount: 0,
    topPriorityLabel: "Remaining goal link",
    topPriorityAction: "Make Phase 9 current before running the probe.",
    topPrioritySourceId: "phase-09-runner-traceability:active-goal",
    topPriorityKind: "traceability",
    topPriorityStatus: "waiting",
    runnerReviewCanAddressTopBlocker: false,
    runnerBlockerPriorityProof: "open=1 pmLinks=10/10 execution=locked",
    nextAction: "Make Phase 9 current before running the probe.",
    safety: "Phase 9 blocker priority only.",
    ariaLabel: "Phase 9 blocker priority.",
    items: [],
    ...overrides
  };
}

function requestGate(overrides: Partial<Phase9DesktopProbeGate> = {}): Phase9DesktopProbeGate {
  return {
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 50,
    canRun: false,
    holdReason: "goal-phase-9-runner is next.",
    phase9RequestGateProof:
      "phase9RequestGateProof=state=waiting readiness=50 canRun=no execution=locked",
    safety: "Phase 9 request gate only.",
    ariaLabel: "Phase 9 request gate.",
    ...overrides
  };
}

describe("phase 9 runner completion gate", () => {
  it("holds completion when the request gate is not ready", () => {
    const gate = buildPhase9RunnerCompletionGate({
      approval: approval({ state: "ready", statusLabel: "Ready", readiness: 100 }),
      traceability: traceability(),
      blockerPriority: blockerPriority(),
      requestGate: requestGate()
    });

    expect(gate.state).toBe("waiting");
    expect(gate.phaseComplete).toBe(false);
    expect(gate.canAdvanceFixedProbe).toBe(false);
    expect(gate.canExpandRunnerActions).toBe(false);
    expect(gate.topHold).toBe("request-gate");
    expect(gate.nextAction).toContain("goal-phase-9-runner");
    expect(gate.completionGateProof).toContain("phase9RunnerCompletionGateProof");
    expect(gate.completionGateProof).toContain("fixedProbe=held");
    expect(gate.completionGateProof).toContain("runnerExpansion=locked");
  });

  it("completes only for the fixed probe after all Phase 9 gates are ready", () => {
    const gate = buildPhase9RunnerCompletionGate({
      approval: approval({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canRequestDesktopProbe: true,
        waitingCount: 0,
        readyCount: 8
      }),
      traceability: traceability({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canTrustRunnerApproval: true,
        readyCount: 6,
        waitingCount: 0
      }),
      blockerPriority: blockerPriority({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        openBlockerCount: 0,
        topPriorityLabel: "No open Phase 9 runner blocker",
        topPriorityKind: "none",
        topPriorityStatus: "ready"
      }),
      requestGate: requestGate({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canRun: true,
        holdReason: "Run a fixed read-only terminal probe through the desktop runner."
      })
    });

    expect(gate.state).toBe("complete");
    expect(gate.phaseComplete).toBe(true);
    expect(gate.canAdvanceFixedProbe).toBe(true);
    expect(gate.canExpandRunnerActions).toBe(false);
    expect(gate.topHold).toBe("none");
    expect(gate.completionGateProof).toContain("phaseComplete=yes");
    expect(gate.completionGateProof).toContain("fixedProbe=ready");
    expect(gate.completionGateProof).toContain("runnerExpansion=locked");
  });
});
