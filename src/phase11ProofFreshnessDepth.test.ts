import { describe, expect, it } from "vitest";
import type { Phase3ClearanceCommandPlan } from "./phase3ClearanceCommandPlan";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3CommandValidationRecordValidation } from "./phase3CommandValidationRecord";
import type { Phase3HandoffGate } from "./phase3HandoffGate";
import type { Phase3SmokeProofReadinessResult } from "./phase3SmokeProofReadiness";
import { buildPhase11ProofFreshnessDepth } from "./phase11ProofFreshnessDepth";
import type { PhasePriorityEvidenceResult } from "./phasePriorityEvidence";

function phasePriority(
  overrides: Partial<PhasePriorityEvidenceResult> = {}
): PhasePriorityEvidenceResult {
  return {
    state: "ready",
    readiness: 100,
    statusLabel: "Ready",
    detail: "Priority proof is ready.",
    counts: { ready: 3, review: 0, blocked: 0, waiting: 0 },
    items: [],
    ...overrides
  };
}

function clearance(
  overrides: Partial<Phase3ClearancePackage> = {}
): Phase3ClearancePackage {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canExit: true,
    detail: "Phase 3 clearance is ready.",
    nextAction: "Record handoff.",
    readyCount: 5,
    openCount: 0,
    blockerCount: 0,
    reviewCount: 0,
    waitingCount: 0,
    blockers: [],
    safety: "Evidence only.",
    ...overrides
  };
}

function smoke(
  overrides: Partial<Phase3SmokeProofReadinessResult> = {}
): Phase3SmokeProofReadinessResult {
  return {
    state: "ready",
    readiness: 100,
    items: [],
    counts: { ready: 3, review: 0, blocked: 0, waiting: 0 },
    ...overrides
  };
}

function commandPlan(
  overrides: Partial<Phase3ClearanceCommandPlan> = {}
): Phase3ClearanceCommandPlan {
  return {
    id: "phase-3-clearance-command-plan",
    label: "Phase 3 desktop smoke command plan",
    state: "ready",
    statusLabel: "Ready",
    command: "npm.cmd run smoke:phase3",
    canRunCommand: false,
    coveredSmokeCount: 3,
    readySmokeCount: 3,
    openSmokeCount: 0,
    nextAction: "Desktop smoke command is no longer needed.",
    safety: "Evidence only.",
    ariaLabel: "Ready.",
    items: [],
    ...overrides
  };
}

function handoff(
  overrides: Partial<Phase3HandoffGate> = {}
): Phase3HandoffGate {
  return {
    id: "phase-3-handoff-gate",
    label: "Phase 3 handoff gate",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canAdvanceProviderIntegration: true,
    readyCount: 4,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    exactBlockerCount: 0,
    nextAction: "Advance Phase 4 provider integration from the reviewed handoff.",
    safety: "Evidence only.",
    ariaLabel: "Ready.",
    items: [],
    ...overrides
  };
}

function commandValidation(
  overrides: Partial<Phase3CommandValidationRecordValidation> = {}
): Phase3CommandValidationRecordValidation {
  return {
    state: "ready",
    statusLabel: "Ready",
    detail:
      "Phase 3 CLI smoke validation is fresh, but persisted desktop UI proof rows remain the exit-readiness source.",
    nextAction:
      "Keep the CLI smoke validation attached for owner review without using it to unlock handoff.",
    isFresh: true,
    ...overrides
  };
}

function snapshot(
  overrides: Partial<Parameters<typeof buildPhase11ProofFreshnessDepth>[0]> = {}
) {
  return buildPhase11ProofFreshnessDepth({
    phasePriorityEvidence: phasePriority(),
    phase3ClearancePackage: clearance(),
    phase3SmokeProofReadiness: smoke(),
    phase3ClearanceCommandPlan: commandPlan(),
    phase3CommandValidationRecordValidation: commandValidation(),
    phase3HandoffGate: handoff(),
    ...overrides
  });
}

describe("phase 11 proof freshness depth", () => {
  it("trusts owner proof only when priority, clearance, smoke, command, CLI validation, and handoff rows are ready", () => {
    const result = snapshot();

    expect(result.state).toBe("ready");
    expect(result.canTrustOwnerProof).toBe(true);
    expect(result.readiness).toBe(100);
    expect(result.openProofCount).toBe(0);
    expect(result.items.every((item) => item.status === "ready")).toBe(true);
    expect(result.ariaLabel).toContain("0 open proof rows");
  });

  it("holds on a waiting command plan and desktop smoke rows", () => {
    const result = snapshot({
      phase3SmokeProofReadiness: smoke({
        state: "waiting",
        readiness: 35,
        counts: { ready: 1, review: 0, blocked: 0, waiting: 2 }
      }),
      phase3ClearanceCommandPlan: commandPlan({
        state: "waiting",
        statusLabel: "Waiting",
        canRunCommand: true,
        readySmokeCount: 1,
        openSmokeCount: 2,
        nextAction: "Run npm.cmd run smoke:phase3 locally."
      })
    });

    expect(result.state).toBe("waiting");
    expect(result.canTrustOwnerProof).toBe(false);
    expect(result.nextAction).toContain("Use the Phase 3 command plan");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Desktop smoke proof", status: "waiting" }),
        expect.objectContaining({ label: "Desktop smoke command plan", status: "waiting" })
      ])
    );
  });

  it("reviews owner proof when CLI smoke validation is stale", () => {
    const result = snapshot({
      phase3CommandValidationRecordValidation: commandValidation({
        state: "review",
        statusLabel: "Review",
        detail:
          "Phase 3 CLI smoke validation record is stale and must be recorded again.",
        nextAction:
          "Rerun npm.cmd run smoke:phase3 manually, then record a fresh local CLI pass.",
        isFresh: false
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerProof).toBe(false);
    expect(result.nextAction).toContain("fresh local CLI pass");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "CLI smoke validation record",
          status: "review",
          detail: expect.stringContaining("stale")
        })
      ])
    );
  });

  it("blocks when the priority proof is blocked", () => {
    const result = snapshot({
      phasePriorityEvidence: phasePriority({
        state: "blocked",
        readiness: 15,
        detail: "Phase 1/2/6 proof is blocked.",
        counts: { ready: 2, review: 0, blocked: 1, waiting: 0 }
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.canTrustOwnerProof).toBe(false);
    expect(result.nextAction).toBe("Phase 1/2/6 proof is blocked.");
    expect(result.blockedCount).toBe(1);
  });

  it("keeps owner proof waiting until the handoff gate can advance provider integration", () => {
    const result = snapshot({
      phase3HandoffGate: handoff({
        state: "waiting",
        statusLabel: "Waiting",
        canAdvanceProviderIntegration: false,
        readyCount: 2,
        waitingCount: 2,
        exactBlockerCount: 0,
        nextAction: "Record the owner-reviewed Phase 3 handoff."
      })
    });

    expect(result.state).toBe("waiting");
    expect(result.openProofCount).toBe(1);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff proof",
          status: "waiting",
          nextAction: "Record the owner-reviewed Phase 3 handoff."
        })
      ])
    );
  });
});
