import { describe, expect, it } from "vitest";
import type { DesktopPackagingReadinessSnapshot } from "./desktopPackagingReadiness";
import {
  evaluatePhase11EvidenceRecord,
  type Phase11EvidenceGate
} from "./phase11EvidenceRecords";
import type { Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import type { Phase11ProofFreshnessDepthSnapshot } from "./phase11ProofFreshnessDepth";
import { buildPhase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";
import { createDefaultProjectManagementPhasePlan } from "./projectManagementPhasePlan";
import {
  buildRemainingGoalPriorityTraces,
  type RemainingGoalPlanSummary
} from "./remainingGoalPlan";
import type { SecurityFinalReviewSnapshot } from "./securityFinalReview";

function ownerSnapshot(
  overrides: Partial<Phase11OwnerCommandCenterSnapshot> = {}
): Phase11OwnerCommandCenterSnapshot {
  const priorityGoalTraces = buildRemainingGoalPriorityTraces().map((trace) =>
    trace.goalId === "goal-phase-3-proof-clearance"
      ? {
          ...trace,
          status: "active" as const,
          completionPercent: 100,
          current: true,
          nextAction: "Keep the completed Phase 3 handoff proof attached."
        }
      : trace
  );

  return {
    id: "phase-11-owner-command-center",
    label: "Phase 11 Owner Testing command center",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canRelease: true,
    checklistReadiness: 100,
    phaseReadiness: 100,
    blockerCount: 0,
    readyCount: 6,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    nextAction: "Keep owner proof attached.",
    safety: "Evidence only.",
    ariaLabel: "Owner command ready.",
    items: [],
    priorityGoalTraceCount: priorityGoalTraces.length,
    priorityGoalTraces,
    ...overrides
  };
}

function proofSnapshot(
  overrides: Partial<Phase11ProofFreshnessDepthSnapshot> = {}
): Phase11ProofFreshnessDepthSnapshot {
  return {
    id: "phase-11-proof-freshness-depth",
    label: "Phase 11 proof freshness depth",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canTrustOwnerProof: true,
    readyCount: 3,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    openProofCount: 0,
    nextAction: "Keep owner proof attached.",
    safety: "Evidence only.",
    ariaLabel: "Proof ready.",
    items: [
      {
        id: "phase-11-proof-freshness-depth:desktop-smoke",
        label: "Desktop smoke proof",
        kind: "desktop-smoke",
        status: "ready",
        detail:
          "3/3 desktop smoke rows are ready; 0 review, 0 blocked, and 0 waiting; 3/3 storage-proof attested, 0 storage review; freshness evaluated at 2026-06-11T00:10:00.000Z.",
        nextAction: "Keep desktop smoke proof rows fresh and storage-proof attested."
      },
      {
        id: "phase-11-proof-freshness-depth:proof-export",
        label: "Phase 3 proof export",
        kind: "proof-export",
        status: "ready",
        detail:
          "Proof export is ready at 100% ready; panel proof 2/2, desktop proof 3/3, CLI attached, handoff attached, expected fingerprint current, record fingerprint current, clearance snapshot 100% with 0 open blockers.",
        nextAction:
          "Keep the offline-verifiable Phase 3 proof export attached before release readiness resumes."
      },
      {
        id: "phase-11-proof-freshness-depth:handoff-proof",
        label: "Owner handoff proof",
        kind: "handoff-proof",
        status: "ready",
        detail:
          "4 handoff rows are ready; 0 exact blockers remain; expected fingerprint current, record fingerprint current, current evidence matched, age 600000ms of 86400000ms window, evaluated at 2026-06-11T00:10:00.000Z; clearance snapshot ready at 100% with 5 ready, 0 open, 0 review, 0 blocked, and 0 waiting.",
        nextAction: "Keep the owner handoff record attached."
      }
    ],
    ...overrides
  };
}

function packagingSnapshot(
  overrides: Partial<DesktopPackagingReadinessSnapshot> = {}
): DesktopPackagingReadinessSnapshot {
  return {
    id: "desktop-packaging-readiness",
    label: "Desktop packaging readiness",
    state: "held",
    statusLabel: "Inputs ready",
    readiness: 80,
    canPackage: false,
    packagingLocked: true,
    detail: "Packaging inputs are prepared but actions stay locked.",
    safety: "Preview only.",
    items: [],
    ...overrides
  };
}

function securitySnapshot(
  overrides: Partial<SecurityFinalReviewSnapshot> = {}
): SecurityFinalReviewSnapshot {
  return {
    id: "security-final-review",
    label: "Security final review",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canCloseSecurity: true,
    canResumePackaging: false,
    detail: "Security review can close.",
    safety: "Evidence only.",
    ariaLabel: "Security ready.",
    items: [],
    ...overrides
  };
}

function remainingSummary(
  overrides: Partial<RemainingGoalPlanSummary> = {}
): RemainingGoalPlanSummary {
  return {
    total: 10,
    blocked: 0,
    active: 0,
    next: 0,
    planned: 0,
    paused: 0,
    averageCompletionPercent: 100,
    currentTarget: "Release readiness pass",
    currentNextAction: "Attach release readiness proof.",
    ownerHoldTarget: "No owner hold",
    ownerHoldNextAction: "No owner hold action.",
    coveredPhaseCount: 11,
    remainingPhaseCount: 11,
    priorityGoalTraceCount: 9,
    priorityGoalTraces: buildRemainingGoalPriorityTraces(),
    ...overrides
  };
}

function readyEvidence(gate: Phase11EvidenceGate) {
  const detailByGate: Record<Phase11EvidenceGate, string> = {
    "fresh-checkout": "Fresh checkout install, test, build, desktop run, and proof-panel evidence passed.",
    "clean-checkout": "Clean checkout install, dependency verification, and startup proof passed.",
    "build-test": "Final test, build, and output evidence passed.",
    "docs-known-limits": "Release docs, owner checklist, packaging limits, and known limits reviewed.",
    "release-decision":
      "Owner release decision recorded while packaging locked, Phase 3 handoff proof stayed attached, and security closure proof was ready."
  };

  return evaluatePhase11EvidenceRecord(
    gate,
    {
      gate,
      state: "ready",
      source: `owner ${gate}`,
      recordedAt: "2026-06-17T10:00:00.000Z",
      detail: detailByGate[gate]
    },
    "2026-06-17T12:00:00.000Z"
  );
}

function snapshot(
  overrides: Partial<Parameters<typeof buildPhase11ReleaseReadinessSnapshot>[0]> = {}
) {
  return buildPhase11ReleaseReadinessSnapshot({
    ownerCommandCenter: ownerSnapshot(),
    proofFreshnessDepth: proofSnapshot(),
    desktopPackaging: packagingSnapshot(),
    securityFinalReview: securitySnapshot(),
    remainingGoalSummary: remainingSummary(),
    projectManagementTasks: createDefaultProjectManagementPhasePlan(),
    freshCheckoutEvidence: readyEvidence("fresh-checkout"),
    cleanCheckoutEvidence: readyEvidence("clean-checkout"),
    buildTestEvidence: readyEvidence("build-test"),
    docsKnownLimitsEvidence: readyEvidence("docs-known-limits"),
    releaseDecisionEvidence: readyEvidence("release-decision"),
    ...overrides
  });
}

function underThresholdPhase3ProjectManagementPlan() {
  return createDefaultProjectManagementPhasePlan().map((task) =>
    task.id === "phase-03-child-blocker-priority" ||
    task.id === "phase-03-child-handoff-gate"
      ? { ...task, completionPercent: 82 }
      : task
  );
}

describe("phase 11 release readiness", () => {
  it("can recommend release only when every evidence row is ready and packaging remains locked", () => {
    const result = snapshot();

    expect(result.state).toBe("ready");
    expect(result.readiness).toBe(100);
    expect(result.canRecommendRelease).toBe(true);
    expect(result.releaseHoldCount).toBe(0);
    expect(result.items.every((item) => item.status === "ready")).toBe(true);
    const phase3Trace = result.items.find((item) => item.label === "Current Phase 3 trace");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner smoke proof",
          status: "ready",
          detail: expect.stringContaining("3/3 storage-proof attested")
        }),
        expect.objectContaining({
          label: "Owner smoke proof",
          detail: expect.stringContaining("proof export: Proof export is ready at 100% ready")
        }),
        expect.objectContaining({
          label: "Current Phase 3 trace",
          status: "ready",
          nextAction: expect.stringContaining("current active Phase 3 clearance PM traceability")
        }),
        expect.objectContaining({
          label: "Packaging lock",
          status: "ready",
          detail: expect.stringContaining("local storage repair")
        }),
        expect.objectContaining({
          label: "Packaging lock",
          detail: expect.stringContaining("safety-disabled live-action")
        }),
        expect.objectContaining({
          label: "Security closure",
          status: "ready",
          detail: expect.stringContaining("closure capability")
        }),
        expect.objectContaining({
          label: "Release decision",
          nextAction: expect.stringContaining("current active Phase 3 clearance PM traceability with handoff proof")
        })
      ])
    );
    expect(phase3Trace?.detail).toContain("expected fingerprint current");
    expect(phase3Trace?.detail).toContain("proof export: Proof export is ready at 100% ready");
    expect(phase3Trace?.detail).toContain("phase-03-child-blocker-priority");
    expect(phase3Trace?.detail).toContain("phase-03-child-traceability");
    expect(phase3Trace?.detail).toContain("phase-03-child-handoff-gate");
    expect(phase3Trace?.detail).toContain("age 600000ms of 86400000ms window");
    expect(result.ariaLabel).toContain("0 holds");
  });

  it("reviews release readiness when Owner Testing is ready but proof freshness is not trusted", () => {
    const result = snapshot({
      proofFreshnessDepth: proofSnapshot({
        state: "review",
        statusLabel: "Review",
        readiness: 84,
        canTrustOwnerProof: false,
        readyCount: 5,
        reviewCount: 1,
        openProofCount: 1,
        nextAction: "Record the owner-reviewed Phase 3 handoff before exporting.",
        items: [
          {
            id: "phase-11-proof-freshness-depth:proof-export",
            label: "Phase 3 proof export",
            kind: "proof-export",
            status: "review",
            detail:
              "Proof export is review at 65% ready; panel proof 2/2, desktop proof 3/3, CLI attached, handoff missing, expected fingerprint missing, record fingerprint missing, clearance snapshot 0% with 0 open blockers.",
            nextAction: "Record the owner-reviewed Phase 3 handoff before exporting."
          },
          {
            id: "phase-11-proof-freshness-depth:desktop-smoke",
            label: "Desktop smoke proof",
            kind: "desktop-smoke",
            status: "ready",
            detail:
              "3/3 desktop smoke rows are ready; 0 review, 0 blocked, and 0 waiting; 3/3 storage-proof attested, 0 storage review; freshness evaluated at 2026-06-11T00:10:00.000Z.",
            nextAction: "Keep desktop smoke proof rows fresh and storage-proof attested."
          },
          {
            id: "phase-11-proof-freshness-depth:handoff-proof",
            label: "Owner handoff proof",
            kind: "handoff-proof",
            status: "ready",
            detail:
              "4 handoff rows are ready; 0 exact blockers remain; expected fingerprint current, record fingerprint current, current evidence matched, age 600000ms of 86400000ms window, evaluated at 2026-06-11T00:10:00.000Z; clearance snapshot ready at 100% with 5 ready, 0 open, 0 review, 0 blocked, and 0 waiting.",
            nextAction: "Keep the owner handoff record attached."
          }
        ]
      })
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    const phase3Trace = result.items.find((item) => item.label === "Current Phase 3 trace");
    const smokeProof = result.items.find((item) => item.label === "Owner smoke proof");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner smoke proof",
          status: "review",
          detail: expect.stringContaining("proof export: Proof export is review at 65% ready"),
          nextAction:
            "Record the owner-reviewed Phase 3 handoff before exporting."
        }),
        expect.objectContaining({
          label: "Current Phase 3 trace",
          status: "review",
          nextAction: expect.stringContaining("phase-11-proof-freshness-depth")
        }),
        expect.objectContaining({
          label: "Release decision",
          status: "review"
        })
      ])
    );
    expect(phase3Trace?.detail).toContain("proof freshness not trusted");
    expect(phase3Trace?.detail).toContain("proof export: Proof export is review at 65% ready");
    expect(phase3Trace?.detail).toContain("expected fingerprint missing");
    expect(smokeProof?.detail).toContain("proof freshness is review at 84%");
    expect(smokeProof?.detail).toContain("handoff missing");
  });

  it("reviews release readiness when owner proof lacks Phase 3 clearance traceability", () => {
    const result = snapshot({
      ownerCommandCenter: ownerSnapshot({
        priorityGoalTraceCount: 0,
        priorityGoalTraces: []
      })
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Owner smoke proof",
          status: "ready"
        }),
        expect.objectContaining({
          label: "Current Phase 3 trace",
          status: "review",
          detail: expect.stringContaining("not visible"),
          nextAction: expect.stringContaining("current active Phase 3 clearance PM traceability")
        }),
        expect.objectContaining({
          label: "Release decision",
          status: "review"
        })
      ])
    );
  });

  it("reviews release readiness when Phase 3 traceability is not current", () => {
    const result = snapshot({
      ownerCommandCenter: ownerSnapshot({
        priorityGoalTraces: buildRemainingGoalPriorityTraces().map((trace) =>
          trace.goalId === "goal-phase-3-proof-clearance"
            ? {
                ...trace,
                status: "next" as const,
                completionPercent: 100,
                current: false,
                nextAction: "Keep the completed Phase 3 handoff proof attached."
              }
            : trace
        )
      })
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Current Phase 3 trace",
          status: "review",
          detail: expect.stringContaining("current no"),
          nextAction: expect.stringContaining("goal-phase-3-proof-clearance")
        }),
        expect.objectContaining({
          label: "Release decision",
          status: "review"
        })
      ])
    );
  });

  it("reviews release readiness when Phase 3 traceability is current but not active", () => {
    const result = snapshot({
      ownerCommandCenter: ownerSnapshot({
        priorityGoalTraces: buildRemainingGoalPriorityTraces().map((trace) =>
          trace.goalId === "goal-phase-3-proof-clearance"
            ? {
                ...trace,
                status: "next" as const,
                completionPercent: 100,
                current: true,
                nextAction: "Keep the completed Phase 3 handoff proof attached."
              }
            : trace
        )
      })
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Current Phase 3 trace",
          status: "review",
          detail: expect.stringContaining("is next"),
          nextAction: expect.stringContaining("goal-phase-3-proof-clearance")
        }),
        expect.objectContaining({
          label: "Release decision",
          status: "review"
        })
      ])
    );
  });

  it("keeps release held for a coherent current active Phase 3 summary", () => {
    const result = snapshot({
      ownerCommandCenter: ownerSnapshot({
        canRelease: false,
        state: "review",
        statusLabel: "Review",
        nextAction: "Clear the current Phase 3 proof blocker before release readiness.",
        priorityGoalTraces: buildRemainingGoalPriorityTraces()
      }),
      remainingGoalSummary: remainingSummary({
        active: 1,
        currentTarget: "Phase 3 desktop proof clearance",
        currentNextAction: "Clear the current Phase 3 proof blocker before release readiness."
      })
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Current Phase 3 trace",
          status: "ready",
          detail: expect.stringContaining("handoff proof ready")
        }),
        expect.objectContaining({
          label: "Owner smoke proof",
          status: "review",
          nextAction: "Clear the current Phase 3 proof blocker before release readiness."
        }),
        expect.objectContaining({
          label: "Release decision",
          status: "review",
          detail: expect.stringContaining("held until all prerequisite evidence rows are ready")
        })
      ])
    );
  });

  it("reviews release readiness when the current Phase 3 trace misses clearance child PM rows", () => {
    const result = snapshot({
      ownerCommandCenter: ownerSnapshot({
        priorityGoalTraces: buildRemainingGoalPriorityTraces().map((trace) =>
          trace.goalId === "goal-phase-3-proof-clearance"
            ? {
                ...trace,
                pmTaskIds: trace.pmTaskIds.filter(
                  (taskId) =>
                    taskId !== "phase-03-child-smoke-rows" &&
                    taskId !== "phase-03-child-command-plan"
                )
              }
            : trace
        )
      })
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Current Phase 3 trace",
          status: "review",
          nextAction: expect.stringContaining("phase-03-child-smoke-rows")
        }),
        expect.objectContaining({
          label: "Current Phase 3 trace",
          nextAction: expect.stringContaining("phase-03-child-command-plan")
        })
      ])
    );
  });

  it("reviews release readiness when Phase 3 PM board evidence is missing", () => {
    const result = snapshot({
      projectManagementTasks: undefined
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Current Phase 3 trace",
          status: "review",
          detail: expect.stringContaining("PM board evidence missing"),
          nextAction: expect.stringContaining("phase-03-child-blocker-priority")
        })
      ])
    );
  });

  it("reviews release readiness when required Phase 3 PM rows remain below clearance completion", () => {
    const result = snapshot({
      projectManagementTasks: underThresholdPhase3ProjectManagementPlan()
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Current Phase 3 trace",
          status: "review",
          detail: expect.stringContaining("incomplete PM rows below 85%"),
          nextAction: expect.stringContaining("phase-03-child-handoff-gate")
        }),
        expect.objectContaining({
          label: "Current Phase 3 trace",
          nextAction: expect.stringContaining("phase-03-child-blocker-priority")
        })
      ])
    );
  });

  it("does not recommend release from state-only ready flags without evidence records", () => {
    const result = snapshot({
      freshCheckoutEvidence: undefined,
      cleanCheckoutEvidence: undefined,
      buildTestEvidence: undefined,
      docsKnownLimitsEvidence: undefined,
      releaseDecisionEvidence: undefined,
      freshCheckoutState: "ready",
      cleanCheckoutState: "ready",
      buildTestState: "ready",
      docsKnownLimitsState: "ready"
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Fresh checkout",
          status: "review",
          detail: expect.stringContaining("structured evidence record")
        }),
        expect.objectContaining({
          label: "Clean checkout",
          status: "review",
          detail: expect.stringContaining("structured evidence record")
        }),
        expect.objectContaining({
          label: "Build and test",
          status: "review",
          detail: expect.stringContaining("structured evidence record")
        }),
        expect.objectContaining({
          label: "Docs and known limits",
          status: "review",
          detail: expect.stringContaining("structured evidence record")
        }),
        expect.objectContaining({
          label: "Release decision",
          status: "review"
        })
      ])
    );
    const releaseDecision = result.items.find((item) => item.label === "Release decision");
    expect(releaseDecision?.detail).toContain("Top prerequisite row: Fresh checkout is review");
    expect(releaseDecision?.detail).toContain(
      "Fresh-checkout install, test, build, desktop run, and proof-panel evidence"
    );
  });

  it("does not recommend release without fresh structured release-decision evidence", () => {
    const missing = snapshot({
      releaseDecisionEvidence: undefined
    });
    const stale = snapshot({
      releaseDecisionEvidence: evaluatePhase11EvidenceRecord(
        "release-decision",
        {
          gate: "release-decision",
          state: "ready",
          source: "owner release review",
          recordedAt: "2026-06-12T10:00:00.000Z",
          detail:
            "Owner approved release decision while packaging locked, Phase 3 handoff proof stayed attached, and security closure proof was ready."
        },
        "2026-06-17T12:00:00.000Z"
      )
    });

    expect(missing.state).toBe("waiting");
    expect(missing.canRecommendRelease).toBe(false);
    expect(missing.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Release decision",
          status: "waiting",
          detail: expect.stringContaining("structured Phase 11 evidence record")
        })
      ])
    );
    expect(stale.state).toBe("review");
    expect(stale.canRecommendRelease).toBe(false);
    expect(stale.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Release decision",
          status: "review",
          detail: expect.stringContaining("stale")
        })
      ])
    );
  });

  it("does not recommend release when release-decision evidence omits security closure proof", () => {
    const result = snapshot({
      releaseDecisionEvidence: evaluatePhase11EvidenceRecord(
        "release-decision",
        {
          gate: "release-decision",
          state: "ready",
          source: "owner release review",
          recordedAt: "2026-06-17T10:00:00.000Z",
          detail:
            "Owner release decision recorded while packaging locked and Phase 3 handoff proof stayed attached."
        },
        "2026-06-17T12:00:00.000Z"
      )
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Release decision",
          status: "review",
          detail: expect.stringContaining("security closure")
        })
      ])
    );
  });

  it("reviews release readiness when release-decision evidence predates prerequisite evidence", () => {
    const result = snapshot({
      buildTestEvidence: evaluatePhase11EvidenceRecord(
        "build-test",
        {
          gate: "build-test",
          state: "ready",
          source: "owner build",
          recordedAt: "2026-06-17T11:30:00.000Z",
          detail: "Final test, build, and output evidence passed."
        },
        "2026-06-17T12:00:00.000Z"
      ),
      releaseDecisionEvidence: evaluatePhase11EvidenceRecord(
        "release-decision",
        {
          gate: "release-decision",
          state: "ready",
          source: "owner release review",
          recordedAt: "2026-06-17T10:00:00.000Z",
          detail:
            "Owner release decision recorded while packaging locked, Phase 3 handoff proof stayed attached, and security closure proof was ready."
        },
        "2026-06-17T12:00:00.000Z"
      )
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Release decision",
          status: "review",
          detail: expect.stringContaining(
            "recorded before build and test evidence at 2026-06-17T11:30:00.000Z"
          ),
          nextAction: expect.stringContaining(
            "Re-record owner release-decision evidence after all prerequisite evidence rows are current"
          )
        })
      ])
    );
  });

  it("keeps the current release pass held when proof and clean-run evidence are missing", () => {
    const result = snapshot({
      ownerCommandCenter: ownerSnapshot({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 45,
        canRelease: false,
        blockerCount: 1,
        nextAction: "Keep the branch local and push only after the owner says to push."
      }),
      remainingGoalSummary: remainingSummary({
        blocked: 1,
        active: 1,
        next: 7,
        paused: 1,
        averageCompletionPercent: 48,
        currentTarget: "Phase 3 desktop proof clearance",
        currentNextAction: "Use Phase 3 command plan and handoff gate.",
        ownerHoldTarget: "Unblock Phase 1/2/6 publishing",
        ownerHoldNextAction:
          "Keep the branch local, preserve the proof commit, and push only after the owner says to push."
      }),
      cleanCheckoutEvidence: undefined,
      buildTestEvidence: undefined,
      docsKnownLimitsEvidence: undefined,
      cleanCheckoutState: "waiting",
      buildTestState: "waiting",
      docsKnownLimitsState: "review"
    });

    expect(result.state).toBe("blocked");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.releaseHoldCount).toBe(5);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Clean checkout", status: "waiting" }),
        expect.objectContaining({ label: "Build and test", status: "waiting" }),
        expect.objectContaining({
          label: "Owner smoke proof",
          status: "blocked",
          detail: expect.stringContaining("with 1 blocker")
        }),
        expect.objectContaining({ label: "Current Phase 3 trace", status: "ready" }),
        expect.objectContaining({ label: "Packaging lock", status: "ready" }),
        expect.objectContaining({ label: "Docs and known limits", status: "review" }),
        expect.objectContaining({ label: "Release decision", status: "blocked" })
      ])
    );
    expect(result.nextAction).toContain("owner says to push");
  });

  it("blocks release readiness when packaging or resume controls are open", () => {
    const unlocked = snapshot({
      desktopPackaging: packagingSnapshot({
        canPackage: true,
        packagingLocked: false
      })
    });
    const resumable = snapshot({
      securityFinalReview: securitySnapshot({
        canResumePackaging: true
      })
    });

    expect(unlocked.state).toBe("blocked");
    expect(unlocked.canRecommendRelease).toBe(false);
    expect(unlocked.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Packaging lock", status: "blocked" })
      ])
    );
    expect(resumable.state).toBe("blocked");
    expect(resumable.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Packaging lock", status: "blocked" })
      ])
    );
  });

  it("reviews release readiness when final security closure capability is held", () => {
    const result = snapshot({
      securityFinalReview: securitySnapshot({
        canCloseSecurity: false,
        detail: "Security review is ready, but closure capability is held."
      })
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.releaseHoldCount).toBe(2);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Security closure",
          status: "review",
          detail: expect.stringContaining("closure capability is held"),
          nextAction: expect.stringContaining("final security capability evidence")
        }),
        expect.objectContaining({
          label: "Release decision",
          status: "review",
          detail: expect.stringContaining("final security closure capability"),
          nextAction: expect.stringContaining("final security capability evidence")
        })
      ])
    );
  });

  it("keeps docs and known limits in review when every other release input is ready", () => {
    const result = snapshot({
      docsKnownLimitsEvidence: undefined,
      docsKnownLimitsState: "review"
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Docs and known limits", status: "review" }),
        expect.objectContaining({ label: "Release decision", status: "review" })
      ])
    );
  });

  it("maps structured release evidence records into clean checkout, build, and docs gates", () => {
    const result = snapshot({
      freshCheckoutEvidence: evaluatePhase11EvidenceRecord(
        "fresh-checkout",
        {
          gate: "fresh-checkout",
          state: "ready",
          source: "owner fresh checkout",
          recordedAt: "2026-06-17T11:00:00.000Z",
          detail: "Fresh checkout install, test, build, desktop run, and proof-panel evidence passed."
        },
        "2026-06-17T12:00:00.000Z"
      ),
      cleanCheckoutEvidence: evaluatePhase11EvidenceRecord(
        "clean-checkout",
        {
          gate: "clean-checkout",
          state: "ready",
          source: "owner fresh checkout",
          recordedAt: "2026-06-12T10:00:00.000Z",
          detail: "Clean checkout passed."
        },
        "2026-06-17T12:00:00.000Z"
      ),
      buildTestEvidence: evaluatePhase11EvidenceRecord(
        "build-test",
        {
          gate: "build-test",
          state: "ready",
          source: "owner build",
          recordedAt: "2026-06-17T10:00:00.000Z",
          detail: "Final test, build, and output evidence passed."
        },
        "2026-06-17T12:00:00.000Z"
      ),
      docsKnownLimitsEvidence: evaluatePhase11EvidenceRecord(
        "docs-known-limits",
        undefined,
        "2026-06-17T12:00:00.000Z"
      )
    });

    expect(result.state).toBe("review");
    expect(result.canRecommendRelease).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Fresh checkout",
          status: "ready",
          detail: expect.stringContaining("proof-panel evidence passed")
        }),
        expect.objectContaining({
          label: "Clean checkout",
          status: "review",
          detail: expect.stringContaining("stale")
        }),
        expect.objectContaining({
          label: "Build and test",
          status: "ready",
          detail: expect.stringContaining("owner build")
        }),
        expect.objectContaining({
          label: "Docs and known limits",
          status: "waiting",
          detail: expect.stringContaining("has not been recorded")
        })
      ])
    );
  });

  it("keeps release readiness text public-safe", () => {
    const result = snapshot({
      ownerCommandCenter: ownerSnapshot({
        state: "blocked",
        statusLabel: "Blocked",
        canRelease: false,
        nextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      }),
      remainingGoalSummary: remainingSummary({
        currentTarget: "Review C:\\Users\\MJ\\Desktop\\secret-plan.md",
        currentNextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
        ownerHoldTarget: "Hold C:\\Users\\MJ\\Desktop\\secret-release.md",
        ownerHoldNextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret-release.md with token sk-OWNER1234567890 <unsafe>"
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
    expect(combinedText).not.toContain("sk-OWNER1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
