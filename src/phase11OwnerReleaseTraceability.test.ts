import { describe, expect, it } from "vitest";
import type { Phase11EvidenceRecordsSnapshot } from "./phase11EvidenceRecords";
import type { Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import { buildPhase11OwnerReleaseTraceability } from "./phase11OwnerReleaseTraceability";
import type { Phase11ProofFreshnessDepthSnapshot } from "./phase11ProofFreshnessDepth";
import type { Phase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";
import {
  PHASE3_PROOF_EXPORT_EVIDENCE_KEY,
  PHASE3_PROOF_EXPORT_PM_TASK_ID
} from "./phase3ProofExportTrace";
import { createDefaultProjectManagementPhasePlan } from "./projectManagementPhasePlan";
import {
  buildRemainingGoalPriorityTraces,
  remainingGoalPlan,
  type RemainingGoalPlanItem
} from "./remainingGoalPlan";

function ownerSnapshot(
  overrides: Partial<Phase11OwnerCommandCenterSnapshot> = {}
): Phase11OwnerCommandCenterSnapshot {
  const priorityGoalTraces = buildRemainingGoalPriorityTraces();

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
    readyCount: 7,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    openProofCount: 0,
    nextAction: "Keep proof fresh.",
    safety: "Evidence only.",
    ariaLabel: "Proof ready.",
    items: [
      {
        id: "phase-11-proof-freshness-depth:proof-export",
        label: "Phase 3 proof export",
        kind: "proof-export",
        status: "ready",
        detail:
          "Proof export is ready for offline verification. PM trace phase-03-child-proof-export-boundary / phase3.proof-export.offline-verification.",
        nextAction: "Keep the offline-verifiable Phase 3 proof export attached."
      },
      {
        id: "phase-11-proof-freshness-depth:handoff-proof",
        label: "Owner handoff proof",
        kind: "handoff-proof",
        status: "ready",
        detail: "Owner handoff proof is attached.",
        nextAction: "Keep the owner handoff record attached."
      }
    ],
    ...overrides
  };
}

function evidenceSnapshot(
  overrides: Partial<Phase11EvidenceRecordsSnapshot> = {}
): Phase11EvidenceRecordsSnapshot {
  return {
    id: "phase-11-evidence-records",
    label: "Phase 11 evidence records",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    totalGateCount: 5,
    openGateCount: 0,
    records: {
      "fresh-checkout": {
        gate: "fresh-checkout",
        label: "Fresh checkout",
        state: "ready",
        freshness: "fresh",
        source: "owner",
        recordedAt: "2026-06-17T12:00:00.000Z",
        detail: "Fresh checkout recorded.",
        nextAction: "Keep evidence attached.",
        safety: "Evidence only."
      },
      "clean-checkout": {
        gate: "clean-checkout",
        label: "Clean checkout",
        state: "ready",
        freshness: "fresh",
        source: "owner",
        recordedAt: "2026-06-17T12:00:00.000Z",
        detail: "Clean checkout recorded.",
        nextAction: "Keep evidence attached.",
        safety: "Evidence only."
      },
      "build-test": {
        gate: "build-test",
        label: "Build and test",
        state: "ready",
        freshness: "fresh",
        source: "owner",
        recordedAt: "2026-06-17T12:00:00.000Z",
        detail: "Build and test recorded.",
        nextAction: "Keep evidence attached.",
        safety: "Evidence only."
      },
      "docs-known-limits": {
        gate: "docs-known-limits",
        label: "Docs and known limits",
        state: "ready",
        freshness: "fresh",
        source: "owner",
        recordedAt: "2026-06-17T12:00:00.000Z",
        detail: "Docs recorded.",
        nextAction: "Keep evidence attached.",
        safety: "Evidence only."
      },
      "release-decision": {
        gate: "release-decision",
        label: "Release decision evidence",
        state: "ready",
        freshness: "fresh",
        source: "owner",
        recordedAt: "2026-06-17T12:00:00.000Z",
        detail: "Release decision recorded.",
        nextAction: "Keep evidence attached.",
        safety: "Evidence only."
      }
    },
    readyCount: 5,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    staleCount: 0,
    missingCount: 0,
    malformedCount: 0,
    nextAction: "Keep all Phase 11 evidence records attached while release packaging remains held.",
    ariaLabel:
      "Phase 11 evidence records: Ready; 100% ready; 0 open evidence gates; 0 missing; 0 stale; 0 malformed; next action: Keep all Phase 11 evidence records attached while release packaging remains held.",
    ...overrides
  };
}

function releaseSnapshot(
  overrides: Partial<Phase11ReleaseReadinessSnapshot> = {}
): Phase11ReleaseReadinessSnapshot {
  return {
    id: "phase-11-release-readiness",
    label: "Phase 11 Release readiness gate",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canRecommendRelease: true,
    releaseHoldCount: 0,
    readyCount: 6,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    ownerReadiness: 100,
    securityReadiness: 100,
    packagingReadiness: 100,
    nextAction: "Release readiness is recorded.",
    safety: "Evidence only.",
    ariaLabel: "Release ready.",
    items: [
      {
        id: "phase-11-release-readiness:packaging-lock",
        label: "Packaging lock",
        kind: "packaging-lock",
        status: "ready",
        detail: "Packaging remains locked.",
        nextAction: "Keep packaging locked."
      },
      {
        id: "phase-11-release-readiness:release-decision",
        label: "Release decision",
        kind: "release-decision",
        status: "ready",
        detail: "Release decision is ready.",
        nextAction: "Owner can decide whether to resume."
      }
    ],
    ...overrides
  };
}

function withLinkedPhase11Goals(): RemainingGoalPlanItem[] {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-11-owner-command-center"
      ? {
          ...goal,
          status: "next",
          pmTaskIds: Array.from(new Set([
            ...goal.pmTaskIds,
            "phase-11-parent-release-packaging",
            "phase-11-child-package-validation",
            "phase-11-child-traceability",
            "phase-11-child-blocker-priority"
          ]))
        }
      : goal.id === "goal-phase-11-release-readiness"
        ? {
            ...goal,
            status: "next",
            pmTaskIds: Array.from(new Set([
              ...goal.pmTaskIds,
              "phase-11-parent-owner-testing",
              "phase-11-child-owner-checklist",
              "phase-11-child-proof-freshness-depth",
              "phase-11-child-evidence-records",
              "phase-11-child-fresh-checkout",
              "phase-11-child-owner-command-closeout-status",
              "phase-11-child-traceability",
              "phase-11-child-blocker-priority"
            ]))
          }
        : goal
  );
}

function trace(overrides: Partial<Parameters<typeof buildPhase11OwnerReleaseTraceability>[0]> = {}) {
  return buildPhase11OwnerReleaseTraceability({
    ownerCommandCenter: ownerSnapshot(),
    proofFreshnessDepth: proofSnapshot(),
    evidenceRecords: evidenceSnapshot(),
    releaseReadiness: releaseSnapshot(),
    goals: withLinkedPhase11Goals(),
    ...overrides
  });
}

function underThresholdPhase3ProjectManagementPlan() {
  return createDefaultProjectManagementPhasePlan().map((task) =>
    task.id === "phase-03-child-blocker-priority" ||
    task.id === PHASE3_PROOF_EXPORT_PM_TASK_ID ||
    task.id === "phase-03-child-handoff-gate"
      ? { ...task, completionPercent: 82 }
      : task
  );
}

describe("phase 11 owner release traceability", () => {
  it("trusts owner release traceability when Phase 11 goals are next but complete", () => {
    const result = trace();

    expect(result.state).toBe("ready");
    expect(result.canTrustOwnerReleaseGate).toBe(true);
    expect(result.missingPmTaskIds).toEqual([]);
    expect(result.linkedGoalIds).toEqual([
      "goal-phase-11-owner-command-center",
      "goal-phase-11-release-readiness"
    ]);
    expect(result.items.map((item) => item.kind)).toEqual([
      "owner-goal",
      "release-goal",
      "pm-coverage",
      "owner-command",
      "phase3-trace",
      "proof-freshness",
      "evidence-records",
      "release-readiness",
      "packaging-hold"
    ]);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "owner-goal", status: "ready" }),
        expect.objectContaining({ kind: "release-goal", status: "ready" }),
        expect.objectContaining({ kind: "pm-coverage", status: "ready" }),
        expect.objectContaining({ kind: "phase3-trace", status: "ready" }),
        expect.objectContaining({ kind: "packaging-hold", status: "ready" })
      ])
    );
  });

  it("trusts owner release traceability from the real remaining goal plan", () => {
    const result = trace({ goals: remainingGoalPlan });

    expect(result.state).toBe("ready");
    expect(result.canTrustOwnerReleaseGate).toBe(true);
    expect(result.missingPmTaskIds).toEqual([]);
    expect(result.linkedGoalIds).toEqual([
      "goal-phase-11-owner-command-center",
      "goal-phase-11-release-readiness"
    ]);
  });

  it("trusts owner release traceability when Phase 11 goals reach 100% with required links", () => {
    const goals = withLinkedPhase11Goals().map((goal) =>
      goal.id === "goal-phase-11-owner-command-center" ||
      goal.id === "goal-phase-11-release-readiness"
        ? {
            ...goal,
            completionPercent: 100,
            nextAction: "Keep Phase 11 release proof attached while packaging remains owner-held."
          }
        : goal
    );
    const result = trace({ goals });

    expect(result.state).toBe("ready");
    expect(result.canTrustOwnerReleaseGate).toBe(true);
    expect(result.releaseHoldStatus).toBe("ready");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "owner-goal", status: "ready" }),
        expect.objectContaining({ kind: "release-goal", status: "ready" }),
        expect.objectContaining({ kind: "pm-coverage", status: "ready" }),
        expect.objectContaining({ kind: "release-readiness", status: "ready" }),
        expect.objectContaining({ kind: "packaging-hold", status: "ready" })
      ])
    );
  });

  it("reviews when Phase 3 clearance traceability is missing from owner proof", () => {
    const result = trace({
      ownerCommandCenter: ownerSnapshot({
        priorityGoalTraceCount: 0,
        priorityGoalTraces: []
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.nextAction).toContain("completed Phase 3 clearance PM traceability");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "phase3-trace",
          status: "review",
          detail: expect.stringContaining("not visible")
        })
      ])
    );
  });

  it("keeps the Phase 3 release trace ready when handoff proof is ready after active work", () => {
    const result = trace();

    expect(result.state).toBe("ready");
    expect(result.canTrustOwnerReleaseGate).toBe(true);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "phase3-trace",
          status: "ready",
          detail: expect.stringContaining("is next"),
          nextAction: expect.stringContaining("proof-export evidence")
        })
      ])
    );
    const phase3Trace = result.items.find((item) => item.kind === "phase3-trace");
    expect(phase3Trace?.detail).toContain("phase-03-child-blocker-priority");
    expect(phase3Trace?.detail).toContain("phase-03-child-traceability");
    expect(phase3Trace?.detail).toContain(PHASE3_PROOF_EXPORT_PM_TASK_ID);
    expect(phase3Trace?.detail).toContain(PHASE3_PROOF_EXPORT_EVIDENCE_KEY);
    expect(phase3Trace?.detail).toContain("phase-03-child-handoff-gate");
    expect(phase3Trace?.detail).toContain("proof export ready");
    expect(phase3Trace?.detail).toContain("Proof export is ready for offline verification.");
  });

  it("carries the top blocked owner command row into release traceability", () => {
    const result = trace({
      ownerCommandCenter: ownerSnapshot({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 88,
        canRelease: false,
        blockerCount: 1,
        readyCount: 8,
        blockedCount: 1,
        nextAction: "Refresh slash execution evidence from the current Arena panel transcript.",
        items: [
          {
            id: "phase-11-owner-command-center:phase3-clearance",
            label: "Phase 3 clearance",
            kind: "phase3-clearance",
            status: "blocked",
            detail:
              "Top blocker: Slash execution (phase-03-child-slash-ready / phase3.slash-execution) is blocked.",
            nextAction: "Refresh slash execution evidence from the current Arena panel transcript."
          }
        ]
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.nextAction).toBe(
      "Refresh slash execution evidence from the current Arena panel transcript."
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "owner-command",
          status: "blocked",
          detail: expect.stringContaining("Top owner row: Phase 3 clearance is blocked"),
          nextAction: "Refresh slash execution evidence from the current Arena panel transcript."
        }),
        expect.objectContaining({
          kind: "owner-command",
          detail: expect.stringContaining("phase-03-child-slash-ready / phase3.slash-execution")
        })
      ])
    );
  });

  it("reviews completed Phase 3 trace when proof export is not ready", () => {
    const result = trace({
      ownerCommandCenter: ownerSnapshot({
        priorityGoalTraces: buildRemainingGoalPriorityTraces().map((trace) =>
          trace.goalId === "goal-phase-3-proof-clearance"
            ? { ...trace, status: "next" as const, completionPercent: 100, current: false }
            : trace
        )
      }),
      proofFreshnessDepth: proofSnapshot({
        readiness: 86,
        readyCount: 6,
        reviewCount: 1,
        openProofCount: 1,
        items: [
          {
            id: "phase-11-proof-freshness-depth:proof-export",
            label: "Phase 3 proof export",
            kind: "proof-export",
            status: "review",
            detail:
              "Proof export is held until offline verification is ready. PM trace phase-03-child-proof-export-boundary / phase3.proof-export.offline-verification.",
            nextAction: "Refresh Phase 3 proof export before release readiness."
          },
          {
            id: "phase-11-proof-freshness-depth:handoff-proof",
            label: "Owner handoff proof",
            kind: "handoff-proof",
            status: "ready",
            detail: "Owner handoff proof is attached.",
            nextAction: "Keep the owner handoff record attached."
          }
        ]
      })
    });

    const phase3Trace = result.items.find((item) => item.kind === "phase3-trace");

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(phase3Trace).toEqual(
      expect.objectContaining({
        status: "review",
        detail: expect.stringContaining("proof export not ready"),
        nextAction: expect.stringContaining("phase-11-proof-freshness-depth:proof-export")
      })
    );
    expect(phase3Trace?.nextAction).toContain(
      "Refresh Phase 3 proof export before release readiness."
    );
    expect(phase3Trace?.detail).toContain("Proof export is held until offline verification is ready.");
    expect(phase3Trace?.detail).toContain(PHASE3_PROOF_EXPORT_EVIDENCE_KEY);
  });

  it("reviews completed Phase 3 trace when handoff is ready but proof freshness is not trusted", () => {
    const result = trace({
      ownerCommandCenter: ownerSnapshot({
        priorityGoalTraces: buildRemainingGoalPriorityTraces().map((trace) =>
          trace.goalId === "goal-phase-3-proof-clearance"
            ? { ...trace, status: "next" as const, completionPercent: 100, current: false }
            : trace
        )
      }),
      proofFreshnessDepth: proofSnapshot({
        state: "review",
        statusLabel: "Review",
        readiness: 84,
        canTrustOwnerProof: false,
        readyCount: 5,
        reviewCount: 1,
        openProofCount: 1,
        nextAction: "Refresh Phase 3 CLI validation and proof-export evidence before release readiness."
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "phase3-trace",
          status: "review",
          detail: expect.stringContaining("proof freshness not trusted"),
          nextAction: expect.stringContaining("phase-11-proof-freshness-depth")
        }),
        expect.objectContaining({
          kind: "proof-freshness",
          status: "review",
          nextAction: "Refresh Phase 3 CLI validation and proof-export evidence before release readiness."
        })
      ])
    );
  });

  it("carries the top blocked proof freshness row into owner release traceability", () => {
    const result = trace({
      proofFreshnessDepth: proofSnapshot({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 78,
        canTrustOwnerProof: false,
        readyCount: 5,
        blockedCount: 1,
        openProofCount: 1,
        nextAction: "Record a fresh CLI validation.",
        items: [
          {
            id: "phase-11-proof-freshness-depth:command-validation",
            label: "CLI smoke validation record",
            kind: "command-validation",
            status: "blocked",
            detail: "CLI validation is blocked by stale command output.",
            nextAction: "Record a fresh CLI validation."
          },
          {
            id: "phase-11-proof-freshness-depth:handoff-proof",
            label: "Owner handoff proof",
            kind: "handoff-proof",
            status: "ready",
            detail: "Owner handoff proof is attached.",
            nextAction: "Keep the owner handoff record attached."
          }
        ]
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.nextAction).toBe("Record a fresh CLI validation.");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "proof-freshness",
          status: "blocked",
          detail: expect.stringContaining("Top proof row: CLI smoke validation record is blocked"),
          nextAction: "Record a fresh CLI validation."
        }),
        expect.objectContaining({
          kind: "proof-freshness",
          detail: expect.stringContaining("stale command output")
        })
      ])
    );
  });

  it("carries waiting handoff proof detail into owner release traceability", () => {
    const result = trace({
      proofFreshnessDepth: proofSnapshot({
        state: "waiting",
        statusLabel: "Waiting",
        readiness: 82,
        canTrustOwnerProof: false,
        readyCount: 5,
        waitingCount: 1,
        openProofCount: 1,
        nextAction: "Record the owner-reviewed Phase 3 handoff.",
        items: [
          {
            id: "phase-11-proof-freshness-depth:handoff-proof",
            label: "Owner handoff proof",
            kind: "handoff-proof",
            status: "waiting",
            detail: "Owner handoff proof has not been recorded.",
            nextAction: "Record the owner-reviewed Phase 3 handoff."
          }
        ]
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "proof-freshness",
          status: "waiting",
          detail: expect.stringContaining("Top proof row: Owner handoff proof is waiting"),
          nextAction: "Record the owner-reviewed Phase 3 handoff."
        })
      ])
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "phase3-trace",
          status: "review",
          nextAction: expect.stringContaining("Record the owner-reviewed Phase 3 handoff.")
        })
      ])
    );
  });

  it("reviews when completed Phase 3 traceability is incomplete", () => {
    const result = trace({
      ownerCommandCenter: ownerSnapshot({
        priorityGoalTraces: buildRemainingGoalPriorityTraces().map((trace) =>
          trace.goalId === "goal-phase-3-proof-clearance"
            ? {
                ...trace,
                status: "next" as const,
                completionPercent: 99,
                current: false,
                nextAction: "Keep the completed Phase 3 handoff proof and proof-export evidence attached."
              }
            : trace
        )
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.nextAction).toContain("goal-phase-3-proof-clearance");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "phase3-trace",
          status: "review",
          detail: expect.stringContaining("current no"),
          nextAction: expect.stringContaining("goal-phase-3-proof-clearance")
        })
      ])
    );
  });

  it("reviews when Phase 3 traceability is current but incomplete", () => {
    const result = trace({
      ownerCommandCenter: ownerSnapshot({
        priorityGoalTraces: buildRemainingGoalPriorityTraces().map((trace) =>
          trace.goalId === "goal-phase-3-proof-clearance"
            ? {
                ...trace,
                status: "next" as const,
                completionPercent: 99,
                current: true,
                nextAction: "Keep the completed Phase 3 handoff proof and proof-export evidence attached."
              }
            : trace
        )
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.nextAction).toContain("goal-phase-3-proof-clearance");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "phase3-trace",
          status: "review",
          detail: expect.stringContaining("is next"),
          nextAction: expect.stringContaining("goal-phase-3-proof-clearance")
        })
      ])
    );
  });

  it("reviews when another goal duplicates the current active trace", () => {
    const result = trace({
      ownerCommandCenter: ownerSnapshot({
        priorityGoalTraces: buildRemainingGoalPriorityTraces().map((trace) =>
          trace.goalId === "goal-phase-3-proof-clearance"
            ? { ...trace, status: "active" as const, completionPercent: 100, current: true }
            : trace
        )
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.nextAction).toContain("goal-phase-3-proof-clearance");
    expect(result.nextAction).toContain("goal-phase-9-runner");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "phase3-trace",
          status: "review",
          detail: expect.stringContaining("current active goals 2"),
          nextAction: expect.stringContaining("goal-phase-9-runner")
        })
      ])
    );
  });

  it("reviews when the completed Phase 3 trace misses clearance child PM rows", () => {
    const result = trace({
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
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "phase3-trace",
          status: "review",
          nextAction: expect.stringContaining("phase-03-child-smoke-rows")
        }),
        expect.objectContaining({
          kind: "phase3-trace",
          nextAction: expect.stringContaining("phase-03-child-command-plan")
        })
      ])
    );
  });

  it("reviews when required Phase 3 PM rows remain below owner release completion", () => {
    const result = trace({
      projectManagementTasks: underThresholdPhase3ProjectManagementPlan()
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.nextAction).toContain("phase-03-child-blocker-priority");
    expect(result.nextAction).toContain("at least 85%");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "phase3-pm-completion",
          label: expect.stringContaining("phase-03-child-blocker-priority"),
          status: "review",
          detail: expect.stringContaining("82% complete"),
          nextAction: expect.stringContaining("phase-03-child-blocker-priority")
        }),
        expect.objectContaining({
          kind: "phase3-pm-completion",
          label: expect.stringContaining("phase-03-child-handoff-gate"),
          detail: expect.stringContaining("82% complete")
        }),
        expect.objectContaining({
          kind: "phase3-trace",
          detail: expect.stringContaining("incomplete PM rows below 85%")
        })
      ])
    );
  });

  it("trusts the default Phase 3 PM rows once they meet the owner release completion threshold", () => {
    const result = trace({
      projectManagementTasks: createDefaultProjectManagementPhasePlan()
    });

    expect(result.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "phase3-pm-completion" })
      ])
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "phase3-trace",
          detail: expect.not.stringContaining("incomplete PM rows below 85%")
        })
      ])
    );
  });

  it("reports missing traceability and blocker-priority PM coverage", () => {
    const goals = withLinkedPhase11Goals().map((goal) =>
      goal.phaseIds.includes("phase-11-owner-packaging")
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter(
              (taskId) =>
                taskId !== "phase-11-child-traceability" &&
                taskId !== "phase-11-child-blocker-priority"
            )
          }
        : goal
    );
    const result = trace({ goals });

    expect(result.state).toBe("blocked");
    expect(result.missingPmTaskIds).toEqual(
      expect.arrayContaining([
        "phase-11-child-traceability",
        "phase-11-child-blocker-priority"
      ])
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "pm-coverage", status: "blocked" })
      ])
    );
  });

  it("carries the top blocked evidence record into owner release traceability", () => {
    const result = trace({
      evidenceRecords: evidenceSnapshot({
        records: {
          ...evidenceSnapshot().records,
          "docs-known-limits": {
            ...evidenceSnapshot().records["docs-known-limits"],
            state: "blocked",
            freshness: "malformed",
            source: "owner docs",
            recordedAt: "malformed",
            detail: "Docs and known limits evidence is malformed.",
            nextAction: "Repair docs and known limits evidence metadata before release readiness."
          }
        },
        readyCount: 3,
        blockedCount: 1,
        malformedCount: 1
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.nextAction).toBe(
      "Repair docs and known limits evidence metadata before release readiness."
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "evidence-records",
          status: "blocked",
          detail: expect.stringContaining(
            "Top evidence row: Docs and known limits is blocked/malformed"
          ),
          nextAction: "Repair docs and known limits evidence metadata before release readiness."
        }),
        expect.objectContaining({
          kind: "evidence-records",
          detail: expect.stringContaining("Docs and known limits evidence is malformed")
        })
      ])
    );
  });

  it("carries stale evidence review detail into owner release traceability", () => {
    const result = trace({
      evidenceRecords: evidenceSnapshot({
        records: {
          ...evidenceSnapshot().records,
          "clean-checkout": {
            ...evidenceSnapshot().records["clean-checkout"],
            state: "review",
            freshness: "stale",
            source: "owner checkout",
            recordedAt: "2026-06-12T11:00:00.000Z",
            detail: "Clean checkout evidence is 121 hours old and needs owner review.",
            nextAction: "Refresh or re-review clean checkout evidence before release readiness."
          }
        },
        readyCount: 3,
        reviewCount: 1,
        staleCount: 1
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "evidence-records",
          status: "review",
          detail: expect.stringContaining("Top evidence row: Clean checkout is review/stale"),
          nextAction: "Refresh or re-review clean checkout evidence before release readiness."
        })
      ])
    );
  });

  it("keeps packaging holds from being trusted when release readiness is blocked", () => {
    const result = trace({
      releaseReadiness: releaseSnapshot({
        state: "blocked",
        statusLabel: "Blocked",
        canRecommendRelease: false,
        releaseHoldCount: 2,
        items: [
          {
            id: "phase-11-release-readiness:packaging-lock",
            label: "Packaging lock",
            kind: "packaging-lock",
            status: "blocked",
            detail: "Packaging controls are not locked.",
            nextAction: "Re-lock package and resume controls."
          }
        ]
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.releaseHoldStatus).toBe("blocked");
    expect(result.nextAction).toBe("Re-lock package and resume controls.");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "packaging-hold",
          status: "blocked",
          detail: "Packaging controls are not locked.",
          nextAction: "Re-lock package and resume controls."
        })
      ])
    );
  });

  it("uses release-decision detail for packaging hold when packaging is locked but release remains held", () => {
    const result = trace({
      releaseReadiness: releaseSnapshot({
        state: "review",
        statusLabel: "Review",
        canRecommendRelease: false,
        releaseHoldCount: 1,
        items: [
          {
            id: "phase-11-release-readiness:packaging-lock",
            label: "Packaging lock",
            kind: "packaging-lock",
            status: "ready",
            detail: "Packaging and resume actions remain locked while readiness evidence is reviewed.",
            nextAction: "Keep packaging locked until the owner explicitly resumes release actions."
          },
          {
            id: "phase-11-release-readiness:release-decision",
            label: "Release decision",
            kind: "release-decision",
            status: "review",
            detail: "Release decision is held until security closure capability is attached.",
            nextAction: "Attach final security capability evidence before making the release decision."
          }
        ]
      })
    });

    expect(result.state).toBe("review");
    expect(result.releaseHoldStatus).toBe("review");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "packaging-hold",
          status: "review",
          detail: "Release decision is held until security closure capability is attached.",
          nextAction: "Attach final security capability evidence before making the release decision."
        })
      ])
    );
  });

  it("keeps release hold in review when release readiness rows omit packaging details", () => {
    const result = trace({
      releaseReadiness: releaseSnapshot({
        state: "review",
        statusLabel: "Review",
        canRecommendRelease: false,
        releaseHoldCount: 1,
        items: []
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.releaseHoldStatus).toBe("review");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "packaging-hold",
          status: "review",
          detail: "Packaging hold evidence is missing from release readiness.",
          nextAction: "Keep packaging locked until the owner explicitly resumes release actions."
        })
      ])
    );
  });

  it("carries the top release readiness row into owner release traceability", () => {
    const result = trace({
      releaseReadiness: releaseSnapshot({
        state: "review",
        statusLabel: "Review",
        canRecommendRelease: false,
        releaseHoldCount: 2,
        securityReadiness: 92,
        items: [
          {
            id: "phase-11-release-readiness:security-closure",
            label: "Security closure",
            kind: "security-closure",
            status: "review",
            detail: "Security final review is ready; closure capability is held.",
            nextAction: "Attach final security capability evidence before making the release decision."
          },
          {
            id: "phase-11-release-readiness:release-decision",
            label: "Release decision",
            kind: "release-decision",
            status: "review",
            detail: "Release decision is held until security closure capability is attached.",
            nextAction: "Attach final security capability evidence before making the release decision."
          }
        ]
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "release-readiness",
          status: "review",
          detail: expect.stringContaining("Top release row: Security closure is review"),
          nextAction: "Attach final security capability evidence before making the release decision."
        }),
        expect.objectContaining({
          kind: "release-readiness",
          detail: expect.stringContaining("closure capability is held")
        })
      ])
    );
  });

  it("carries fresh-checkout release readiness detail into owner release traceability", () => {
    const result = trace({
      releaseReadiness: releaseSnapshot({
        state: "review",
        statusLabel: "Review",
        canRecommendRelease: false,
        releaseHoldCount: 1,
        items: [
          {
            id: "phase-11-release-readiness:fresh-checkout",
            label: "Fresh checkout",
            kind: "fresh-checkout",
            status: "review",
            detail:
              "Fresh-checkout install, test, build, desktop run, and proof-panel evidence need a structured evidence record.",
            nextAction: "Attach fresh-checkout evidence metadata before release readiness can proceed."
          }
        ]
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "release-readiness",
          status: "review",
          detail: expect.stringContaining("Top release row: Fresh checkout is review"),
          nextAction: "Attach fresh-checkout evidence metadata before release readiness can proceed."
        }),
        expect.objectContaining({
          kind: "release-readiness",
          detail: expect.stringContaining("proof-panel evidence need a structured evidence record")
        })
      ])
    );
  });

  it("keeps traceability text public-safe", () => {
    const result = trace({
      ownerCommandCenter: ownerSnapshot({
        state: "blocked",
        nextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
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
