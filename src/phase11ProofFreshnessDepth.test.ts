import { describe, expect, it } from "vitest";
import type { Phase3ClearanceCommandPlan } from "./phase3ClearanceCommandPlan";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3CommandValidationRecordValidation } from "./phase3CommandValidationRecord";
import { buildPhase3HandoffGate, type Phase3HandoffGate } from "./phase3HandoffGate";
import type { Phase3ProofExportVerification } from "./phase3ProofExport";
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
    evaluatedAt: "2026-06-06T00:01:00.000Z",
    maxProofAgeMs: 7 * 24 * 60 * 60 * 1000,
    storageAttestedCount: 3,
    storageReviewCount: 0,
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
    nextAction: "Resume Phase 4 review from the reviewed handoff.",
    ownerReviewSummary:
      "Owner handoff current: fingerprint, clearance snapshot, and age metadata match; Phase 4 remains behind owner review.",
    safety: "Evidence only.",
    ariaLabel: "Ready.",
    handoffEvidenceReview: {
      expectedFingerprint: "current",
      recordFingerprint: "current",
      matchesCurrentEvidence: true,
      evaluatedAt: "2026-06-11T00:10:00.000Z",
      recordAgeMs: 600_000,
      maxRecordAgeMs: 86_400_000,
      hasFreshAgeMetadata: true,
      clearanceSnapshot: {
        state: "ready",
        readiness: 100,
        canExit: true,
        readyCount: 5,
        exactBlockerCount: 0,
        reviewCount: 0,
        blockedCount: 0,
        waitingCount: 0
      }
    },
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
    hasSmokeBundleProvenance: true,
    smokeBundleProvenance: {
      source: "steerboard.phase3.smoke-record.v1",
      command: "npm.cmd run smoke:phase3",
      runId: "phase3-smoke-record:2026-06-18T07:57:30.551Z",
      artifactPath: "local_private/phase3-smoke-proof-bundle.json",
      rowFingerprintCount: 3
    },
    ...overrides
  };
}

function proofExport(
  overrides: Partial<Phase3ProofExportVerification> = {}
): Phase3ProofExportVerification {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canVerifyOffline: true,
    detail:
      "Phase 3 proof export artifact contains current-panel panel proof, storage-attested desktop proof, CLI validation, and current exit-ready owner handoff evidence for handoff fingerprint current.",
    nextAction:
      "Keep the exported Phase 3 proof package attached while Phase 4 remains gated by owner review.",
    currentPanelId: "panel-phase3-owner-visible",
    readyPanelEvidenceCount: 2,
    storageAttestedDesktopProofCount: 3,
    hasCommandValidationRecord: true,
    hasOwnerHandoffRecord: true,
    handoffEvidenceFingerprint: "current",
    ownerHandoffRecordFingerprint: "current",
    ownerHandoffClearanceReadiness: 100,
    ownerHandoffExactBlockerCount: 0,
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
    phase3ProofExportVerification: proofExport(),
    phase3HandoffGate: handoff(),
    ...overrides
  });
}

describe("phase 11 proof freshness depth", () => {
  it("trusts owner proof only when priority, clearance, smoke, command, CLI validation, proof export, and handoff rows are ready", () => {
    const result = snapshot();

    expect(result.state).toBe("ready");
    expect(result.canTrustOwnerProof).toBe(true);
    expect(result.readiness).toBe(100);
    expect(result.openProofCount).toBe(0);
    expect(result.nextAction).toContain("npm.cmd run test:phase3:owner-visible");
    expect(result.nextAction).toContain("proof-export evidence");
    expect(result.items.every((item) => item.status === "ready")).toBe(true);
    const handoffProof = result.items.find((item) => item.label === "Owner handoff proof");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Desktop smoke proof",
          detail: expect.stringContaining("freshness evaluated at 2026-06-06T00:01:00.000Z")
        }),
        expect.objectContaining({
          label: "Desktop smoke proof",
          detail: expect.stringContaining("3/3 storage-proof attested")
        }),
        expect.objectContaining({
          label: "Owner handoff proof",
          nextAction: expect.stringContaining("npm.cmd run test:phase3:owner-visible")
        }),
        expect.objectContaining({
          label: "Owner handoff proof",
          nextAction: expect.stringContaining("current active goal/PM traceability")
        }),
        expect.objectContaining({
          label: "Owner handoff proof",
          nextAction: expect.stringContaining("fresh matching CLI validation")
        }),
        expect.objectContaining({
          label: "Owner handoff proof",
          nextAction: expect.stringContaining("proof-export evidence")
        }),
        expect.objectContaining({
          label: "CLI smoke validation record",
          detail: expect.stringContaining("phase3-smoke-record:2026-06-18T07:57:30.551Z")
        }),
        expect.objectContaining({
          label: "CLI smoke validation record",
          detail: expect.stringContaining("3/3 row fingerprints")
        }),
        expect.objectContaining({
          label: "Phase 3 proof export",
          status: "ready",
          detail: expect.stringContaining("expected fingerprint current")
        }),
        expect.objectContaining({
          label: "Phase 3 proof export",
          detail: expect.stringContaining("clearance snapshot 100% with 0 open blockers")
        })
      ])
    );
    expect(handoffProof?.detail).toContain("expected fingerprint current");
    expect(handoffProof?.detail).toContain("record fingerprint current");
    expect(handoffProof?.detail).toContain("age 600000ms of 86400000ms window");
    expect(handoffProof?.detail).toContain("clearance snapshot ready at 100%");
    expect(result.ariaLabel).toContain("0 open proof rows");
  });

  it("reviews owner proof when Phase 3 proof export is not offline-verifiable", () => {
    const result = snapshot({
      phase3ProofExportVerification: proofExport({
        state: "review",
        statusLabel: "Review",
        readiness: 65,
        canVerifyOffline: false,
        hasOwnerHandoffRecord: false,
        handoffEvidenceFingerprint: undefined,
        ownerHandoffRecordFingerprint: undefined,
        ownerHandoffClearanceReadiness: undefined,
        ownerHandoffExactBlockerCount: undefined,
        detail: "Phase 3 proof export artifact is missing the owner handoff record.",
        nextAction: "Record the owner-reviewed Phase 3 handoff before exporting."
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerProof).toBe(false);
    expect(result.nextAction).toBe("Record the owner-reviewed Phase 3 handoff before exporting.");
    expect(result.openProofCount).toBe(1);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Phase 3 proof export",
          status: "review",
          detail: expect.stringContaining("handoff missing"),
          nextAction: "Record the owner-reviewed Phase 3 handoff before exporting."
        }),
        expect.objectContaining({
          label: "Phase 3 proof export",
          detail: expect.stringContaining("expected fingerprint missing")
        })
      ])
    );
  });

  it("reviews owner proof when the handoff gate lacks Phase 3 traceability precondition", () => {
    const result = snapshot({
      phase3HandoffGate: buildPhase3HandoffGate({
        clearancePackage: clearance(),
        commandValidation: commandValidation(),
        handoffRecordState: "ready",
        handoffRecordValidation: {
          state: "ready",
          detail: "Owner-reviewed Phase 3 handoff record matches current evidence.",
          nextAction: "Keep the owner-reviewed handoff record attached before Phase 4 review resumes.",
          expectedFingerprint: "current",
          recordFingerprint: "current",
          matchesCurrentEvidence: true
        }
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerProof).toBe(false);
    expect(result.nextAction).toContain("Phase 3 traceability precondition");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff proof",
          status: "review",
          nextAction: expect.stringContaining("Phase 3 traceability precondition")
        })
      ])
    );
  });

  it("holds on a waiting command plan and desktop smoke rows", () => {
    const result = snapshot({
      phase3SmokeProofReadiness: smoke({
        state: "waiting",
        readiness: 35,
        storageAttestedCount: 1,
        storageReviewCount: 2,
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
    expect(result.nextAction).toContain("storage-proof attested");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Desktop smoke proof", status: "waiting" }),
        expect.objectContaining({
          label: "Desktop smoke proof",
          detail: expect.stringContaining("freshness evaluated at 2026-06-06T00:01:00.000Z")
        }),
        expect.objectContaining({
          label: "Desktop smoke proof",
          detail: expect.stringContaining("1/3 storage-proof attested, 2 storage review")
        }),
        expect.objectContaining({ label: "Desktop smoke command plan", status: "waiting" })
      ])
    );
  });

  it("keeps release proof in review when desktop smoke rows are not storage-attested", () => {
    const result = snapshot({
      phase3SmokeProofReadiness: smoke({
        state: "review",
        readiness: 65,
        storageAttestedCount: 2,
        storageReviewCount: 1,
        counts: { ready: 2, review: 1, blocked: 0, waiting: 0 }
      })
    });
    const desktopSmoke = result.items.find((item) => item.label === "Desktop smoke proof");

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerProof).toBe(false);
    expect(result.nextAction).toBe(
      "Import or rerun desktop smoke proof rows until each required row is storage-proof attested."
    );
    expect(desktopSmoke?.detail).toContain("2/3 storage-proof attested, 1 storage review");
    expect(desktopSmoke?.nextAction).toBe(
      "Import or rerun desktop smoke proof rows until each required row is storage-proof attested."
    );
  });

  it("surfaces missing desktop smoke freshness evaluation metadata for release review", () => {
    const result = snapshot({
      phase3SmokeProofReadiness: smoke({
        state: "review",
        readiness: 65,
        evaluatedAt: "unavailable",
        counts: { ready: 2, review: 1, blocked: 0, waiting: 0 }
      })
    });

    expect(result.state).toBe("review");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Desktop smoke proof",
          status: "review",
          detail: expect.stringContaining("freshness evaluation timestamp unavailable")
        })
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

  it("keeps missing CLI smoke bundle provenance visible in release proof", () => {
    const result = snapshot({
      phase3CommandValidationRecordValidation: commandValidation({
        hasSmokeBundleProvenance: false,
        smokeBundleProvenance: undefined
      })
    });

    expect(result.state).toBe("ready");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "CLI smoke validation record",
          status: "ready",
          detail: expect.stringContaining("Smoke bundle provenance is not attached")
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

  it("carries the Phase 3 clearance next action into proof freshness when clearance is blocked", () => {
    const result = snapshot({
      phase3ClearancePackage: clearance({
        state: "blocked",
        statusLabel: "Blocked",
        canExit: false,
        readiness: 15,
        openCount: 1,
        blockerCount: 1,
        blockers: [
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "blocked",
            detail:
              "Slash execution storage provenance fingerprint does not match the current evidence payload and must be refreshed from the current panel.",
            nextAction:
              "Refresh slash execution evidence from the current Arena panel transcript before Phase 3 can exit.",
            pmTaskId: "phase-03-child-slash-ready",
            evidenceKey: "phase3.slash-execution"
          }
        ],
        nextAction:
          "Submit a provider-routed slash command from an Arena panel before Phase 3 can exit."
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.nextAction).toBe(
      "Submit a provider-routed slash command from an Arena panel before Phase 3 can exit."
    );
    const clearanceProof = result.items.find((item) => item.label === "Phase 3 clearance proof");

    expect(clearanceProof?.detail).toContain("phase-03-child-slash-ready / phase3.slash-execution");
    expect(clearanceProof?.detail).toContain("storage provenance fingerprint");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Phase 3 clearance proof",
          status: "blocked",
          nextAction:
            "Submit a provider-routed slash command from an Arena panel before Phase 3 can exit."
        })
      ])
    );
  });

  it("keeps Phase 3 clearance proof detail public-safe", () => {
    const result = snapshot({
      phase3ClearancePackage: clearance({
        state: "review",
        statusLabel: "Needs review",
        canExit: false,
        readiness: 65,
        openCount: 1,
        reviewCount: 1,
        blockers: [
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "review",
            detail:
              "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
            nextAction:
              "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
            pmTaskId: "phase-03-child-slash-ready",
            evidenceKey: "phase3.slash-execution"
          }
        ],
        nextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      })
    });
    const clearanceProof = result.items.find((item) => item.label === "Phase 3 clearance proof");
    const combinedText = [
      clearanceProof?.detail,
      clearanceProof?.nextAction
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });

  it("keeps owner proof waiting until the handoff gate can resume Phase 4 review", () => {
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
    const handoffProof = result.items.find((item) => item.label === "Owner handoff proof");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff proof",
          status: "waiting",
          nextAction: "Record the owner-reviewed Phase 3 handoff."
        })
      ])
    );
    expect(handoffProof?.detail).toContain("expected fingerprint current");
    expect(handoffProof?.detail).toContain("current evidence matched");
  });
});
