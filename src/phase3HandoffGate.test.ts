import { describe, expect, it } from "vitest";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3ClearanceTraceabilityPrecondition } from "./phase3ClearanceTraceability";
import type { Phase3CommandValidationRecordValidation } from "./phase3CommandValidationRecord";
import { buildPhase3HandoffGate } from "./phase3HandoffGate";

function clearancePackage(
  overrides: Partial<Phase3ClearancePackage> = {}
): Phase3ClearancePackage {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canExit: true,
    detail: "Phase 3 has complete evidence.",
    nextAction:
      "Record the Phase 3 handoff before Phase 4 review resumes and proof-export offline verification is trusted.",
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

function trustedTraceability(
  overrides: Partial<Phase3ClearanceTraceabilityPrecondition> = {}
): Phase3ClearanceTraceabilityPrecondition {
  return {
    state: "ready",
    canTrustTrace: true,
    detail: "The current active Phase 3 goal and required PM rows are linked.",
    nextAction: "Keep the current active Phase 3 goal and required PM rows linked through handoff.",
    ...overrides
  };
}

function readyHandoffValidation() {
  return {
    state: "ready" as const,
    detail: "Owner-reviewed Phase 3 handoff record matches current evidence.",
    nextAction:
      "Keep the owner-reviewed handoff record attached before Phase 4 review resumes and proof-export offline verification is trusted.",
    expectedFingerprint: "current",
    recordFingerprint: "current",
    evaluatedAt: "2026-06-11T00:10:00.000Z",
    recordAgeMs: 600_000,
    maxRecordAgeMs: 86_400_000,
    matchesCurrentEvidence: true
  };
}

function readyCommandValidation(
  overrides: Partial<Phase3CommandValidationRecordValidation> = {}
): Phase3CommandValidationRecordValidation {
  return {
    state: "ready",
    statusLabel: "Ready",
    detail:
      "Phase 3 CLI smoke validation is fresh and matches current desktop smoke proof rows.",
    nextAction:
      "Keep the CLI smoke validation attached for owner review without using it to unlock handoff.",
    isFresh: true,
    hasSmokeBundleProvenance: true,
    ...overrides
  };
}

function buildGate(input: Parameters<typeof buildPhase3HandoffGate>[0]) {
  return buildPhase3HandoffGate({
    commandValidation: readyCommandValidation(),
    ...input
  });
}

describe("phase 3 handoff gate", () => {
  it("resumes Phase 4 review only after clearance and owner handoff are ready", () => {
    const result = buildGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability(),
      handoffRecordState: "ready",
      handoffRecordValidation: readyHandoffValidation()
    });

    expect(result.state).toBe("ready");
    expect(result.readiness).toBe(100);
    expect(result.canAdvanceProviderIntegration).toBe(true);
    expect(result.exactBlockerCount).toBe(0);
    expect(result.handoffEvidenceReview).toMatchObject({
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
        exactBlockerCount: 0
      }
    });
    expect(result.items.every((item) => item.status === "ready")).toBe(true);
    expect(result.ownerReviewSummary).toContain("Owner handoff current");
    expect(result.ariaLabel).toContain("owner review: Owner handoff current");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff record",
          detail: expect.stringContaining("age 600000ms of 86400000ms window")
        }),
        expect.objectContaining({
          label: "Provider boundary",
          detail: expect.stringContaining("proof-export offline verification"),
          nextAction: expect.stringContaining("proof-export offline verification")
        })
      ])
    );
    expect(result.ariaLabel).toContain("0 exact blockers");
  });

  it("holds provider integration when CLI smoke validation is missing or needs review", () => {
    const missing = buildPhase3HandoffGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability(),
      handoffRecordState: "ready",
      handoffRecordValidation: readyHandoffValidation()
    });
    const review = buildGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability(),
      commandValidation: readyCommandValidation({
        state: "review",
        statusLabel: "Review",
        detail:
          "Phase 3 CLI smoke validation record no longer matches the current desktop smoke proof rows.",
        nextAction:
          "Load or import the matching Phase 3 smoke proof bundle before owner handoff.",
        isFresh: true
      }),
      handoffRecordState: "ready",
      handoffRecordValidation: readyHandoffValidation()
    });

    expect(missing).toMatchObject({
      state: "waiting",
      canAdvanceProviderIntegration: false
    });
    expect(missing.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "CLI validation boundary",
          status: "waiting"
        }),
        expect.objectContaining({
          label: "Provider boundary",
          status: "waiting",
          detail: expect.stringContaining("CLI smoke validation")
        })
      ])
    );
    expect(review).toMatchObject({
      state: "review",
      canAdvanceProviderIntegration: false
    });
    expect(review.nextAction).toContain("matching Phase 3 smoke proof bundle");
    expect(review.ownerReviewSummary).toContain("no longer matches");
  });

  it("holds provider integration when Phase 3 traceability is not trusted", () => {
    const result = buildGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability({
        state: "review",
        canTrustTrace: false,
        detail: "2 current active remaining goals are set.",
        nextAction: "Keep exactly one current active remaining goal before Phase 3 handoff can advance."
      }),
      handoffRecordState: "ready",
      handoffRecordValidation: readyHandoffValidation()
    });

    expect(result.state).toBe("review");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.nextAction).toContain("exactly one current active remaining goal");
    expect(result.ownerReviewSummary).toContain("Owner handoff held");
    expect(result.ownerReviewSummary).toContain("2 current active remaining goals");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Traceability boundary",
          status: "review",
          detail: expect.stringContaining("2 current active")
        }),
        expect.objectContaining({
          label: "Provider boundary",
          status: "review",
          detail: expect.stringContaining("proof-export offline verification")
        })
      ])
    );
  });

  it("holds provider integration when Phase 3 traceability precondition is missing", () => {
    const result = buildGate({
      clearancePackage: clearancePackage(),
      handoffRecordState: "ready",
      handoffRecordValidation: readyHandoffValidation()
    });

    expect(result.state).toBe("review");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.nextAction).toContain("Attach Phase 3 traceability precondition");
    expect(result.ownerReviewSummary).toContain("Phase 3 current-goal and PM traceability");
    expect(result.ariaLabel).toContain("Phase 3 current-goal and PM traceability");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Traceability boundary",
          status: "review",
          detail: expect.stringContaining("not attached")
        }),
        expect.objectContaining({
          label: "Provider boundary",
          status: "review",
          detail: expect.stringContaining("traceability precondition is attached and proof-export offline verification is trusted")
        })
      ])
    );
  });

  it("holds provider integration when fingerprint-matched handoff lacks age metadata", () => {
    const result = buildGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability(),
      handoffRecordState: "ready",
      handoffRecordValidation: {
        state: "ready",
        detail: "Owner-reviewed Phase 3 handoff record matches current evidence.",
        nextAction:
          "Keep the owner-reviewed handoff record attached before Phase 4 review resumes and proof-export offline verification is trusted.",
        expectedFingerprint: "current",
        recordFingerprint: "current",
        matchesCurrentEvidence: true
      }
    });

    expect(result.state).toBe("review");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.handoffEvidenceReview).toMatchObject({
      expectedFingerprint: "current",
      recordFingerprint: "current",
      matchesCurrentEvidence: true,
      hasFreshAgeMetadata: false
    });
    expect(result.nextAction).toBe(
      "Attach current fingerprint-matched and age-checked handoff validation before Phase 4 review resumes and proof-export offline verification is trusted."
    );
    expect(result.ownerReviewSummary).toContain("must prove both");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff record",
          status: "review",
          detail: expect.stringContaining("fresh age metadata")
        }),
        expect.objectContaining({
          label: "Provider boundary",
          status: "review",
          detail: expect.stringContaining("proof-export offline verification")
        })
      ])
    );
  });

  it("holds provider integration when raw ready state is not fingerprint validated", () => {
    const result = buildGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability(),
      handoffRecordState: "ready"
    });

    expect(result.state).toBe("review");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.nextAction).toBe(
      "Attach current handoff validation before Phase 4 review resumes and proof-export offline verification is trusted."
    );
    expect(result.ownerReviewSummary).toContain("fingerprint validation is missing");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff record",
          status: "review",
          detail: expect.stringContaining("fingerprint validation is not attached")
        }),
        expect.objectContaining({
          label: "Provider boundary",
          status: "review",
          detail: expect.stringContaining("validated against current evidence and proof-export offline verification is trusted")
        })
      ])
    );
  });

  it("reviews ready handoff validation that does not prove a current fingerprint match", () => {
    const result = buildGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability(),
      handoffRecordState: "ready",
      handoffRecordValidation: {
        state: "ready",
        detail: "Owner-reviewed Phase 3 handoff record is attached.",
        nextAction:
          "Keep the owner-reviewed handoff record attached before Phase 4 review resumes and proof-export offline verification is trusted.",
        recordFingerprint: "phase3-handoff-existing",
        matchesCurrentEvidence: true
      }
    });

    expect(result.state).toBe("review");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.nextAction).toBe(
      "Attach current fingerprint-matched and age-checked handoff validation before Phase 4 review resumes and proof-export offline verification is trusted."
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff record",
          status: "review"
        }),
        expect.objectContaining({
          label: "Provider boundary",
          status: "review",
          detail: expect.stringContaining("current evidence fingerprint match")
        })
      ])
    );
  });

  it("reviews ready handoff validation when the record fingerprint is missing", () => {
    const result = buildGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability(),
      handoffRecordState: "ready",
      handoffRecordValidation: {
        ...readyHandoffValidation(),
        recordFingerprint: undefined,
        matchesCurrentEvidence: true
      }
    });

    expect(result.state).toBe("review");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.handoffEvidenceReview).toMatchObject({
      expectedFingerprint: "current",
      matchesCurrentEvidence: true,
      hasFreshAgeMetadata: true
    });
    expect(result.nextAction).toBe(
      "Attach current fingerprint-matched and age-checked handoff validation before Phase 4 review resumes and proof-export offline verification is trusted."
    );
    expect(result.ownerReviewSummary).toContain("must prove both");
    expect(result.ariaLabel).toContain("must prove both");
  });

  it("reviews ready handoff validation when the record fingerprint differs from the expected fingerprint", () => {
    const result = buildGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability(),
      handoffRecordState: "ready",
      handoffRecordValidation: {
        ...readyHandoffValidation(),
        expectedFingerprint: "current",
        recordFingerprint: "previous",
        matchesCurrentEvidence: true
      }
    });

    expect(result.state).toBe("review");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.handoffEvidenceReview).toMatchObject({
      expectedFingerprint: "current",
      recordFingerprint: "previous",
      matchesCurrentEvidence: true,
      hasFreshAgeMetadata: true
    });
    expect(result.nextAction).toBe(
      "Attach current fingerprint-matched and age-checked handoff validation before Phase 4 review resumes and proof-export offline verification is trusted."
    );
    expect(result.ownerReviewSummary).toContain("must prove both");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff record",
          status: "review",
          detail: expect.stringContaining("current evidence fingerprint match")
        }),
        expect.objectContaining({
          label: "Provider boundary",
          status: "review",
          detail: expect.stringContaining("current evidence fingerprint match")
        })
      ])
    );
  });

  it("holds provider integration when clearance is ready but owner handoff is not recorded", () => {
    const result = buildGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability()
    });

    expect(result.state).toBe("waiting");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.readyCount).toBe(4);
    expect(result.waitingCount).toBe(2);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Desktop proof clearance", status: "ready" }),
        expect.objectContaining({ label: "Exact blocker visibility", status: "ready" }),
        expect.objectContaining({ label: "Owner handoff record", status: "waiting" }),
        expect.objectContaining({ label: "Provider boundary", status: "waiting" })
      ])
    );
    expect(result.nextAction).toBe(
      "Record the owner-reviewed Phase 3 handoff before Phase 4 review resumes and proof-export offline verification is trusted."
    );
    expect(result.ownerReviewSummary).toContain("Owner handoff recordable");
    expect(result.ownerReviewSummary).toContain("CLI validation is ready");
    expect(result.ownerReviewSummary).toContain("proof-export offline verification is trusted");
    expect(result.ariaLabel).toContain("Owner handoff recordable");
  });

  it("blocks Phase 4 review when the owner handoff record fingerprint is stale", () => {
    const result = buildGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability(),
      handoffRecordState: "review",
      handoffRecordValidation: {
        state: "review",
        detail:
          "Owner handoff record no longer matches the current Phase 3 evidence fingerprint.",
        nextAction: "Clear and record the Phase 3 handoff again from the current exit-ready evidence.",
        expectedFingerprint: "current",
        recordFingerprint: "old",
        matchesCurrentEvidence: false
      }
    });

    expect(result.state).toBe("review");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.nextAction).toBe(
      "Clear and record the Phase 3 handoff again from the current exit-ready evidence."
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff record",
          status: "review",
          detail: expect.stringContaining("no longer matches")
        }),
        expect.objectContaining({
          label: "Provider boundary",
          status: "review",
          detail: expect.stringContaining("no longer matches")
        })
      ])
    );
  });

  it("blocks Phase 4 review when the owner handoff record age is stale", () => {
    const result = buildGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability(),
      handoffRecordState: "review",
      handoffRecordValidation: {
        state: "review",
        detail:
          "Owner handoff record is stale and must be recorded again from current exit-ready evidence.",
        nextAction: "Clear and record the Phase 3 handoff again from fresh exit-ready evidence.",
        expectedFingerprint: "current",
        recordFingerprint: "current",
        matchesCurrentEvidence: true
      }
    });

    expect(result.state).toBe("review");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.nextAction).toBe(
      "Clear and record the Phase 3 handoff again from fresh exit-ready evidence."
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff record",
          status: "review",
          detail: expect.stringContaining("stale")
        }),
        expect.objectContaining({
          label: "Provider boundary",
          status: "review",
          detail: expect.stringContaining("stale")
        })
      ])
    );
  });

  it("blocks Phase 4 review when the owner handoff snapshot no longer matches", () => {
    const result = buildGate({
      clearancePackage: clearancePackage(),
      traceabilityPrecondition: trustedTraceability(),
      handoffRecordState: "review",
      handoffRecordValidation: {
        state: "review",
        detail:
          "Owner handoff record snapshot no longer matches current Phase 3 clearance readiness or blocker evidence.",
        nextAction: "Clear and record the Phase 3 handoff again from the current clearance snapshot.",
        expectedFingerprint: "current",
        recordFingerprint: "current",
        matchesCurrentEvidence: false
      }
    });

    expect(result.state).toBe("review");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.nextAction).toBe(
      "Clear and record the Phase 3 handoff again from the current clearance snapshot."
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner handoff record",
          status: "review",
          detail: expect.stringContaining("snapshot no longer matches")
        }),
        expect.objectContaining({
          label: "Provider boundary",
          status: "review",
          detail: expect.stringContaining("snapshot no longer matches")
        })
      ])
    );
  });

  it("routes exact blockers from the clearance package before handoff", () => {
    const result = buildGate({
      clearancePackage: clearancePackage({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 15,
        canExit: false,
        detail: "Phase 3 is blocked.",
        nextAction: "Repair provider route.",
        readyCount: 3,
        openCount: 2,
        blockerCount: 1,
        waitingCount: 1,
        blockers: [
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "blocked",
            nextAction: "Repair provider route.",
            pmTaskId: "phase-03-child-slash-ready",
            evidenceKey: "phase3.slash-execution"
          },
          {
            id: "phase3-exit-gate:live-control-smoke",
            label: "Live control smoke",
            state: "waiting",
            nextAction: "Run live-control smoke.",
            pmTaskId: "phase-03-child-smoke-rows",
            evidenceKey: "phase3.live-control-smoke"
          }
        ]
      }),
      traceabilityPrecondition: trustedTraceability()
    });

    expect(result.state).toBe("blocked");
    expect(result.canAdvanceProviderIntegration).toBe(false);
    expect(result.exactBlockerCount).toBe(2);
    expect(result.nextAction).toBe("Repair provider route.");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Desktop proof clearance", status: "blocked" }),
        expect.objectContaining({ label: "Exact blocker visibility", status: "blocked" }),
        expect.objectContaining({ label: "Provider boundary", status: "blocked" })
      ])
    );
  });

  it("keeps handoff text public-safe", () => {
    const result = buildGate({
      clearancePackage: clearancePackage({
        state: "blocked",
        canExit: false,
        nextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
        openCount: 1,
        blockers: [
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "blocked",
            nextAction:
              "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
            pmTaskId: "phase-03-child-slash-ready",
            evidenceKey: "phase3.slash-execution"
          }
        ]
      })
    });
    const combinedText = [
      result.label,
      result.nextAction,
      result.safety,
      result.ariaLabel,
      ...result.items.flatMap((item) => [item.label, item.detail, item.nextAction])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
