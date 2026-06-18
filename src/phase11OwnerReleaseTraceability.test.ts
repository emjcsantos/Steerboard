import { describe, expect, it } from "vitest";
import type { Phase11EvidenceRecordsSnapshot } from "./phase11EvidenceRecords";
import type { Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import { buildPhase11OwnerReleaseTraceability } from "./phase11OwnerReleaseTraceability";
import type { Phase11ProofFreshnessDepthSnapshot } from "./phase11ProofFreshnessDepth";
import type { Phase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";
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
    readyCount: 6,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    openProofCount: 0,
    nextAction: "Keep proof fresh.",
    safety: "Evidence only.",
    ariaLabel: "Proof ready.",
    items: [
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
      }
    },
    readyCount: 4,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    staleCount: 0,
    missingCount: 0,
    malformedCount: 0,
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

describe("phase 11 owner release traceability", () => {
  it("holds owner release traceability while Phase 11 goals are still next", () => {
    const result = trace();

    expect(result.state).toBe("review");
    expect(result.canTrustOwnerReleaseGate).toBe(false);
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
        expect.objectContaining({ kind: "owner-goal", status: "review" }),
        expect.objectContaining({ kind: "release-goal", status: "review" }),
        expect.objectContaining({ kind: "pm-coverage", status: "ready" }),
        expect.objectContaining({ kind: "phase3-trace", status: "ready" }),
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
    expect(result.nextAction).toContain("Phase 3 clearance PM traceability");
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
    const result = trace({
      ownerCommandCenter: ownerSnapshot({
        priorityGoalTraces: buildRemainingGoalPriorityTraces().map((trace) =>
          trace.goalId === "goal-phase-3-proof-clearance"
            ? { ...trace, status: "next" }
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
          status: "ready",
          detail: expect.stringContaining("is next"),
          nextAction: expect.stringContaining("Phase 3 clearance PM traceability")
        })
      ])
    );
  });

  it("reviews when the current Phase 3 trace misses clearance child PM rows", () => {
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
          nextAction: "Re-lock package and resume controls."
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
