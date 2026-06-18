import { describe, expect, it } from "vitest";
import type { Phase11EvidenceRecordsSnapshot } from "./phase11EvidenceRecords";
import type { Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import { buildPhase11OwnerReleaseBlockerPriority } from "./phase11OwnerReleaseBlockerPriority";
import {
  buildPhase11OwnerReleaseTraceability,
  type Phase11OwnerReleaseTraceabilitySummary
} from "./phase11OwnerReleaseTraceability";
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
    readyCount: 1,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    nextAction: "Keep owner proof attached.",
    safety: "Evidence only.",
    ariaLabel: "Owner ready.",
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
    readyCount: 1,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    openProofCount: 0,
    nextAction: "Keep proof fresh.",
    safety: "Evidence only.",
    ariaLabel: "Proof ready.",
    items: [],
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
    readyCount: 1,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    ownerReadiness: 100,
    securityReadiness: 100,
    packagingReadiness: 100,
    nextAction: "Release readiness is recorded.",
    safety: "Evidence only.",
    ariaLabel: "Release ready.",
    items: [],
    ...overrides
  };
}

function traceabilitySnapshot(
  overrides: Partial<Phase11OwnerReleaseTraceabilitySummary> = {}
): Phase11OwnerReleaseTraceabilitySummary {
  return {
    id: "phase-11-owner-release-traceability",
    label: "Phase 11 owner release traceability",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canTrustOwnerReleaseGate: true,
    readyCount: 1,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    missingPmTaskIds: [],
    linkedGoalIds: ["goal-phase-11-owner-command-center", "goal-phase-11-release-readiness"],
    linkedPmTaskCount: 10,
    releaseHoldStatus: "ready",
    nextAction: "Keep traceability attached.",
    safety: "Evidence only.",
    ariaLabel: "Traceability ready.",
    items: [],
    ...overrides
  };
}

function withReadyPhase11Goals(): RemainingGoalPlanItem[] {
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

function priority(
  overrides: Partial<Parameters<typeof buildPhase11OwnerReleaseBlockerPriority>[0]> = {}
) {
  return buildPhase11OwnerReleaseBlockerPriority({
    ownerCommandCenter: ownerSnapshot(),
    proofFreshnessDepth: proofSnapshot(),
    evidenceRecords: evidenceSnapshot(),
    releaseReadiness: releaseSnapshot(),
    traceability: traceabilitySnapshot(),
    ...overrides
  });
}

describe("phase 11 owner release blocker priority", () => {
  it("is ready when no Phase 11 blocker rows remain", () => {
    const result = priority();

    expect(result.state).toBe("ready");
    expect(result.openBlockerCount).toBe(0);
    expect(result.ownerReviewCanAddressTopBlocker).toBe(false);
    expect(result.topPriorityLabel).toBe("No open Phase 11 owner release blocker");
  });

  it("surfaces missing current Phase 3 traceability from the real traceability summary", () => {
    const ownerCommandCenter = ownerSnapshot({
      priorityGoalTraceCount: 0,
      priorityGoalTraces: []
    });
    const traceability = buildPhase11OwnerReleaseTraceability({
      ownerCommandCenter,
      proofFreshnessDepth: proofSnapshot(),
      evidenceRecords: evidenceSnapshot(),
      releaseReadiness: releaseSnapshot(),
      goals: withReadyPhase11Goals()
    });
    const result = priority({ ownerCommandCenter, traceability });

    expect(result.state).toBe("review");
    expect(result.openBlockerCount).toBe(3);
    expect(result.topPriorityLabel).toBe("Current Phase 3 trace");
    expect(result.topPriorityAction).toContain("current Phase 3 goal/PM traceability");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "traceability",
          status: "review",
          detail: expect.stringContaining("not visible")
        })
      ])
    );
  });

  it("ranks blocked owner and release rows before waiting evidence rows", () => {
    const result = priority({
      ownerCommandCenter: ownerSnapshot({
        state: "blocked",
        items: [
          {
            id: "phase-11-owner-command-center:phase-readiness",
            label: "Phase readiness",
            kind: "phase-readiness",
            status: "blocked",
            detail: "One remaining goal is blocked.",
            nextAction: "Keep the branch local until owner push approval."
          }
        ]
      }),
      evidenceRecords: evidenceSnapshot({
        records: {
          ...evidenceSnapshot().records,
          "fresh-checkout": {
            ...evidenceSnapshot().records["fresh-checkout"],
            state: "waiting",
            freshness: "missing",
            detail: "Fresh checkout is missing.",
            nextAction: "Record fresh-checkout evidence."
          }
        },
        readyCount: 3,
        waitingCount: 1,
        missingCount: 1
      }),
      traceability: traceabilitySnapshot({
        state: "blocked",
        canTrustOwnerReleaseGate: false,
        items: [
          {
            id: "phase-11-owner-release-traceability:pm-coverage",
            label: "PM row coverage",
            kind: "pm-coverage",
            status: "blocked",
            detail: "Traceability child link is missing.",
            nextAction: "Add the missing Phase 11 PM child link."
          }
        ]
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.openBlockerCount).toBe(3);
    expect(result.ownerReviewAddressableCount).toBe(3);
    expect(result.items.map((item) => item.priority)).toEqual([1, 2, 3]);
    expect(result.topPriorityLabel).toBe("Phase readiness");
    expect(result.ownerReviewCanAddressTopBlocker).toBe(true);
    expect(result.items.at(-1)).toMatchObject({
      label: "Fresh checkout",
      status: "waiting"
    });
  });

  it("ranks open packaging holds above proof and evidence blockers", () => {
    const result = priority({
      proofFreshnessDepth: proofSnapshot({
        state: "blocked",
        canTrustOwnerProof: false,
        items: [
          {
            id: "phase-11-proof-freshness-depth:command-validation",
            label: "CLI smoke validation record",
            kind: "command-validation",
            status: "blocked",
            detail: "CLI validation is blocked.",
            nextAction: "Record a fresh CLI validation."
          }
        ]
      }),
      evidenceRecords: evidenceSnapshot({
        records: {
          ...evidenceSnapshot().records,
          "build-test": {
            ...evidenceSnapshot().records["build-test"],
            state: "blocked",
            freshness: "fresh",
            detail: "Build and test evidence is blocked.",
            nextAction: "Record build and test evidence."
          },
          "docs-known-limits": {
            ...evidenceSnapshot().records["docs-known-limits"],
            state: "review",
            freshness: "fresh",
            detail: "Docs need review.",
            nextAction: "Review docs and known limits."
          }
        },
        readyCount: 2,
        reviewCount: 1,
        blockedCount: 1
      }),
      releaseReadiness: releaseSnapshot({
        state: "blocked",
        canRecommendRelease: false,
        items: [
          {
            id: "phase-11-release-readiness:packaging-lock",
            label: "Packaging lock",
            kind: "packaging-lock",
            status: "blocked",
            detail: "Packaging is not fully locked.",
            nextAction: "Restore the packaging lock before reviewing release readiness."
          },
          {
            id: "phase-11-release-readiness:release-decision",
            label: "Release decision",
            kind: "release-decision",
            status: "review",
            detail: "Release decision needs review.",
            nextAction: "Review release readiness evidence."
          }
        ]
      })
    });
    const priorityByLabel = new Map(result.items.map((item) => [item.label, item.priority]));

    expect(result.state).toBe("blocked");
    expect(result.topPriorityLabel).toBe("Packaging lock");
    expect(priorityByLabel.get("Packaging lock")).toBeLessThan(
      priorityByLabel.get("CLI smoke validation record") ?? Number.POSITIVE_INFINITY
    );
    expect(priorityByLabel.get("Packaging lock")).toBeLessThan(
      priorityByLabel.get("Build and test") ?? Number.POSITIVE_INFINITY
    );
    expect(priorityByLabel.get("Packaging lock")).toBeLessThan(
      priorityByLabel.get("Docs and known limits") ?? Number.POSITIVE_INFINITY
    );
  });

  it("keeps blocker priority text public-safe", () => {
    const result = priority({
      releaseReadiness: releaseSnapshot({
        state: "blocked",
        items: [
          {
            id: "phase-11-release-readiness:release-decision",
            label: "Release decision",
            kind: "release-decision",
            status: "blocked",
            detail:
              "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
            nextAction:
              "Open C:\\Users\\MJ\\Desktop\\secret.md with token sk-OWNER1234567890 <unsafe>"
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
    expect(combinedText).not.toContain("sk-OWNER1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
