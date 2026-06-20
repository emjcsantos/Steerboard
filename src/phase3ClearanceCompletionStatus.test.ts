import { describe, expect, it } from "vitest";
import type { Phase3ClearanceBlockerPrioritySnapshot } from "./phase3ClearanceBlockerPriority";
import type { Phase3ClearanceCommandPlan } from "./phase3ClearanceCommandPlan";
import {
  buildPhase3ClearanceCompletionStatus
} from "./phase3ClearanceCompletionStatus";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3ClearanceTraceabilitySnapshot } from "./phase3ClearanceTraceability";
import type { Phase3CommandValidationRecordValidation } from "./phase3CommandValidationRecord";
import type { Phase3ExitGateEvidence } from "./phase3ExitGateEvidence";
import type { Phase3HandoffGate } from "./phase3HandoffGate";
import type { Phase3ProofExportVerification } from "./phase3ProofExport";
import type { Phase3SmokeProofReadinessResult } from "./phase3SmokeProofReadiness";

function smoke(
  overrides: Partial<Phase3SmokeProofReadinessResult> = {}
): Phase3SmokeProofReadinessResult {
  return {
    state: "waiting",
    readiness: 35,
    evaluatedAt: "2026-06-21T00:00:00.000Z",
    maxProofAgeMs: 604800000,
    storageAttestedCount: 1,
    storageReviewCount: 2,
    items: [],
    counts: { ready: 1, review: 0, blocked: 0, waiting: 2 },
    ...overrides
  };
}

function exitGate(overrides: Partial<Phase3ExitGateEvidence> = {}): Phase3ExitGateEvidence {
  return {
    currentPanelLabel: "Panel A",
    state: "waiting",
    readiness: 35,
    pass: false,
    statusLabel: "Waiting",
    detail: "Waiting for Phase 3 proof.",
    safety: "No command execution.",
    nextAction: "Collect Phase 3 proof.",
    items: [],
    counts: { ready: 1, review: 0, blocked: 0, waiting: 4 },
    pmTaskLinkCount: 5,
    evidenceKeyCount: 5,
    ...overrides
  };
}

function clearancePackage(
  overrides: Partial<Phase3ClearancePackage> = {}
): Phase3ClearancePackage {
  return {
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 35,
    canExit: false,
    detail: "Waiting for clearance.",
    nextAction: "Collect Phase 3 proof.",
    readyCount: 1,
    openCount: 4,
    blockerCount: 0,
    reviewCount: 0,
    waitingCount: 4,
    blockers: [],
    safety: "Evidence only.",
    ...overrides
  };
}

function commandPlan(
  overrides: Partial<Phase3ClearanceCommandPlan> = {}
): Phase3ClearanceCommandPlan {
  return {
    id: "phase-3-clearance-command-plan",
    label: "Phase 3 desktop smoke command plan",
    state: "waiting",
    statusLabel: "Waiting",
    command: "npm.cmd run smoke:phase3",
    canRunCommand: false,
    coveredSmokeCount: 3,
    readySmokeCount: 1,
    openSmokeCount: 2,
    nextAction: "Run Phase 3 smoke.",
    safety: "Evidence only.",
    ariaLabel: "Phase 3 command plan.",
    items: [],
    ...overrides
  };
}

function commandValidation(
  overrides: Partial<Phase3CommandValidationRecordValidation> = {}
): Phase3CommandValidationRecordValidation {
  return {
    state: "waiting",
    statusLabel: "Waiting",
    detail: "Missing CLI validation.",
    nextAction: "Record CLI validation.",
    isFresh: false,
    ...overrides
  };
}

function blockerPriority(
  overrides: Partial<Phase3ClearanceBlockerPrioritySnapshot> = {}
): Phase3ClearanceBlockerPrioritySnapshot {
  return {
    id: "phase-3-clearance-blocker-priority",
    label: "Phase 3 blocker priority",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 35,
    openBlockerCount: 1,
    commandAddressableCount: 1,
    topPriorityLabel: "Smoke row",
    topPriorityEvidenceKey: "phase3.live-control-smoke",
    topPriorityPmTaskId: "phase-03-child-smoke-rows",
    topPriorityAction: "Refresh smoke row.",
    commandCanAddressTopBlocker: true,
    nextAction: "Refresh smoke row.",
    safety: "Evidence only.",
    ariaLabel: "Phase 3 blocker priority.",
    items: [],
    ...overrides
  };
}

function traceability(
  overrides: Partial<Phase3ClearanceTraceabilitySnapshot> = {}
): Phase3ClearanceTraceabilitySnapshot {
  return {
    id: "phase-3-clearance-traceability",
    label: "Phase 3 clearance traceability",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 80,
    linkedGoalId: "goal-phase-3-proof-clearance",
    linkedPhaseId: "phase-03-controls-slash",
    requiredPmTaskCount: 13,
    linkedPmTaskCount: 12,
    missingPmTaskIds: ["phase-03-child-clearance-completion-status"],
    missingGoalPmTaskIds: ["phase-03-child-clearance-completion-status"],
    openTraceCount: 1,
    canTrustTrace: false,
    nextAction: "Link Phase 3 PM row.",
    safety: "Evidence only.",
    ariaLabel: "Phase 3 traceability.",
    items: [],
    ...overrides
  };
}

function proofExport(
  overrides: Partial<Phase3ProofExportVerification> = {}
): Phase3ProofExportVerification {
  return {
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 50,
    canVerifyOffline: false,
    pmTaskId: "phase-03-child-proof-export",
    evidenceKey: "phase3.proof-export",
    detail: "Missing proof export.",
    nextAction: "Attach proof export.",
    readyPanelEvidenceCount: 1,
    storageAttestedDesktopProofCount: 1,
    hasCommandValidationRecord: false,
    hasOwnerHandoffRecord: false,
    ...overrides
  };
}

function handoffGate(overrides: Partial<Phase3HandoffGate> = {}): Phase3HandoffGate {
  return {
    id: "phase-3-handoff-gate",
    label: "Phase 3 handoff gate",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 60,
    canAdvanceProviderIntegration: false,
    readyCount: 4,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 3,
    exactBlockerCount: 1,
    nextAction: "Record Phase 3 handoff.",
    ownerReviewSummary: "Waiting for handoff.",
    safety: "Evidence only.",
    ariaLabel: "Phase 3 handoff.",
    handoffEvidenceReview: {
      matchesCurrentEvidence: false,
      hasFreshAgeMetadata: false,
      clearanceSnapshot: {
        state: "waiting",
        readiness: 60,
        canExit: false,
        readyCount: 4,
        exactBlockerCount: 1,
        reviewCount: 0,
        blockedCount: 0,
        waitingCount: 3
      }
    },
    items: [],
    ...overrides
  };
}

describe("phase 3 clearance completion status", () => {
  it("holds completion when smoke rows are not storage-attested", () => {
    const status = buildPhase3ClearanceCompletionStatus({
      smokeReadiness: smoke(),
      exitGate: exitGate(),
      clearancePackage: clearancePackage(),
      commandPlan: commandPlan(),
      commandValidation: commandValidation(),
      blockerPriority: blockerPriority(),
      traceability: traceability(),
      proofExport: proofExport(),
      handoffGate: handoffGate()
    });

    expect(status.state).toBe("waiting");
    expect(status.phaseComplete).toBe(false);
    expect(status.canAdvancePhase4Review).toBe(false);
    expect(status.topHold).toBe("smoke-rows");
    expect(status.phase3ClearanceCompletionStatusProof).toContain(
      "phase3ClearanceCompletionStatusProof"
    );
    expect(status.phase3ClearanceCompletionStatusProof).toContain("smokeRows=1/3");
    expect(status.phase3ClearanceCompletionStatusProof).toContain("phase4=held");
  });

  it("marks completion ready only when every Phase 3 proof surface is ready", () => {
    const status = buildPhase3ClearanceCompletionStatus({
      smokeReadiness: smoke({
        state: "ready",
        readiness: 100,
        storageAttestedCount: 3,
        storageReviewCount: 0,
        counts: { ready: 3, review: 0, blocked: 0, waiting: 0 }
      }),
      exitGate: exitGate({ state: "ready", readiness: 100, pass: true, statusLabel: "Ready" }),
      clearancePackage: clearancePackage({
        state: "ready",
        readiness: 100,
        statusLabel: "Ready",
        canExit: true,
        readyCount: 5,
        openCount: 0,
        waitingCount: 0
      }),
      commandPlan: commandPlan({
        state: "ready",
        statusLabel: "Ready",
        readySmokeCount: 3,
        openSmokeCount: 0
      }),
      commandValidation: commandValidation({
        state: "ready",
        statusLabel: "Ready",
        isFresh: true
      }),
      blockerPriority: blockerPriority({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        openBlockerCount: 0,
        commandAddressableCount: 0,
        topPriorityLabel: "None",
        topPriorityAction: "No open blocker.",
        commandCanAddressTopBlocker: false
      }),
      traceability: traceability({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        linkedPmTaskCount: 13,
        missingPmTaskIds: [],
        missingGoalPmTaskIds: [],
        openTraceCount: 0,
        canTrustTrace: true
      }),
      proofExport: proofExport({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canVerifyOffline: true,
        readyPanelEvidenceCount: 2,
        storageAttestedDesktopProofCount: 3,
        hasCommandValidationRecord: true,
        hasOwnerHandoffRecord: true
      }),
      handoffGate: handoffGate({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canAdvanceProviderIntegration: true,
        exactBlockerCount: 0,
        waitingCount: 0
      })
    });

    expect(status.state).toBe("ready");
    expect(status.phaseComplete).toBe(true);
    expect(status.canAdvancePhase4Review).toBe(true);
    expect(status.topHold).toBe("none");
    expect(status.phase3ClearanceCompletionStatusProof).toContain("phaseComplete=yes");
    expect(status.phase3ClearanceCompletionStatusProof).toContain("phase4=ready");
    expect(status.phase3ClearanceCompletionStatusProof).toContain("pmLinks=13/13");
  });
});
