import { describe, expect, it } from "vitest";
import type { Phase3ClearanceBlockerPrioritySnapshot } from "./phase3ClearanceBlockerPriority";
import type { Phase3ClearanceCommandPlan } from "./phase3ClearanceCommandPlan";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3CommandValidationRecordValidation } from "./phase3CommandValidationRecord";
import type { Phase3HandoffGate } from "./phase3HandoffGate";
import {
  buildPhase3ClearanceTraceability,
  buildPhase3ClearanceTraceabilityPrecondition,
  PHASE3_CLEARANCE_GOAL_ID,
  PHASE3_CLEARANCE_PHASE_ID,
  REQUIRED_PHASE3_CLEARANCE_CHILD_PM_TASK_IDS,
  REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS
} from "./phase3ClearanceTraceability";
import {
  PHASE3_PROOF_EXPORT_EVIDENCE_KEY,
  PHASE3_PROOF_EXPORT_PM_TASK_ID
} from "./phase3ProofExportTrace";
import { createDefaultProjectManagementPhasePlan } from "./projectManagementPhasePlan";
import { remainingGoalPlan, type RemainingGoalPlanItem } from "./remainingGoalPlan";

function phase3Goal(
  overrides: Partial<RemainingGoalPlanItem> = {}
): RemainingGoalPlanItem {
  const base = remainingGoalPlan.find((goal) => goal.id === PHASE3_CLEARANCE_GOAL_ID);

  if (!base) {
    throw new Error("Missing Phase 3 goal fixture.");
  }

  return {
    ...base,
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
    detail: "Phase 3 is clear.",
    nextAction: "Record owner handoff.",
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
    nextAction: "Record owner handoff.",
    safety: "Evidence only.",
    ariaLabel: "Ready.",
    items: [],
    ...overrides
  };
}

function blockerPriority(
  overrides: Partial<Phase3ClearanceBlockerPrioritySnapshot> = {}
): Phase3ClearanceBlockerPrioritySnapshot {
  return {
    id: "phase-3-clearance-blocker-priority",
    label: "Phase 3 blocker priority",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    openBlockerCount: 0,
    commandAddressableCount: 0,
    topPriorityLabel: "No open Phase 3 blocker",
    topPriorityEvidenceKey: "phase3.clearance.none",
    topPriorityPmTaskId: "phase-03-child-handoff-gate",
    topPriorityAction: "Record owner handoff.",
    commandCanAddressTopBlocker: false,
    nextAction: "Record owner handoff.",
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
    nextAction:
      "Resume Phase 4 review from the reviewed handoff while keeping proof-export offline verification, current active goal, and PM traceability trusted.",
    ownerReviewSummary:
      "Owner handoff current: fingerprint, clearance snapshot, proof export, and age metadata match; Phase 4 review remains behind owner review plus proof-export offline verification.",
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

function snapshot(
  overrides: Partial<Parameters<typeof buildPhase3ClearanceTraceability>[0]> = {}
) {
  return buildPhase3ClearanceTraceability({
    goals: [phase3Goal()],
    pmTasks: createDefaultProjectManagementPhasePlan(),
    clearancePackage: clearance(),
    commandPlan: commandPlan(),
    commandValidation: commandValidation(),
    blockerPriority: blockerPriority(),
    handoffGate: handoff(),
    ...overrides
  });
}

describe("phase 3 clearance traceability", () => {
  it("exposes the clearance child PM rows required by downstream release gates", () => {
    expect(REQUIRED_PHASE3_CLEARANCE_CHILD_PM_TASK_IDS).toEqual([
      "phase-03-child-smoke-rows",
      "phase-03-child-exit-gate",
      "phase-03-child-command-plan",
      "phase-03-child-blocker-priority",
      "phase-03-child-traceability",
      PHASE3_PROOF_EXPORT_PM_TASK_ID,
      "phase-03-child-handoff-gate"
    ]);
    expect(REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS).toEqual(
      expect.arrayContaining([...REQUIRED_PHASE3_CLEARANCE_CHILD_PM_TASK_IDS])
    );
  });

  it("links the current active critical Phase 3 goal to every required PM row and ready evidence", () => {
    const result = snapshot();

    expect(result.state).toBe("ready");
    expect(result.canTrustTrace).toBe(true);
    expect(result.linkedGoalId).toBe(PHASE3_CLEARANCE_GOAL_ID);
    expect(result.linkedPhaseId).toBe(PHASE3_CLEARANCE_PHASE_ID);
    expect(result.requiredPmTaskCount).toBe(REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS.length);
    expect(result.linkedPmTaskCount).toBe(REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS.length);
    expect(result.missingPmTaskIds).toEqual([]);
    expect(result.missingGoalPmTaskIds).toEqual([]);
    expect(result.items.every((item) => item.status === "ready")).toBe(true);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "command-validation",
          detail: expect.stringContaining("phase3-smoke-record:2026-06-18T07:57:30.551Z")
        }),
        expect.objectContaining({
          kind: "command-validation",
          detail: expect.stringContaining("3/3 row fingerprints")
        }),
        expect.objectContaining({
          kind: "handoff-boundary",
          detail: expect.stringContaining("proof-export offline verification trusted"),
          nextAction: expect.stringContaining("proof-export offline verification"),
          pmTaskId: PHASE3_PROOF_EXPORT_PM_TASK_ID,
          evidenceKey: PHASE3_PROOF_EXPORT_EVIDENCE_KEY
        }),
        expect.objectContaining({
          kind: "goal-honesty",
          detail: expect.stringContaining("proof-export offline verification ready"),
          nextAction: expect.stringContaining("proof-export offline verification attached")
        })
      ])
    );
  });

  it("keeps old CLI validation records visibly distinct when smoke bundle provenance is missing", () => {
    const result = snapshot({
      commandValidation: commandValidation({
        hasSmokeBundleProvenance: false,
        smokeBundleProvenance: undefined
      })
    });

    expect(result.state).toBe("ready");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "command-validation",
          status: "ready",
          detail: expect.stringContaining("Smoke bundle provenance is not linked")
        })
      ])
    );
  });

  it("keeps trace untrusted when Phase 3 is active but no longer current", () => {
    for (const current of [false, undefined]) {
      const result = snapshot({
        goals: [phase3Goal({ current })]
      });

      expect(result.state).toBe("review");
      expect(result.canTrustTrace).toBe(false);
      expect(result.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "active-goal",
            status: "review",
            detail: expect.stringContaining("current no")
          })
        ])
      );
      expect(result.nextAction).toContain("current active critical goal");
    }
  });

  it("keeps trace blocked when Phase 3 is current but not active", () => {
    const result = snapshot({
      goals: [phase3Goal({ current: true, status: "next" })]
    });

    expect(result.state).toBe("blocked");
    expect(result.canTrustTrace).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "active-goal",
          status: "blocked",
          detail: expect.stringContaining("current yes")
        })
      ])
    );
  });

  it("keeps trace untrusted when another goal is also current active", () => {
    const phase4Goal = remainingGoalPlan.find(
      (goal) => goal.id === "goal-phase-4-provider-surfaces"
    );

    if (!phase4Goal) {
      throw new Error("Missing Phase 4 goal fixture.");
    }

    const result = snapshot({
      goals: [
        phase3Goal(),
        {
          ...phase4Goal,
          status: "active",
          current: true
        }
      ]
    });

    expect(result.state).toBe("review");
    expect(result.canTrustTrace).toBe(false);
    expect(result.nextAction).toContain("exactly one current active remaining goal");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "active-goal",
          status: "review",
          detail: expect.stringContaining("2 current active goals")
        })
      ])
    );
  });

  it("builds a handoff precondition from current-active goal and PM coverage", () => {
    const ready = buildPhase3ClearanceTraceabilityPrecondition({
      goals: [phase3Goal()],
      pmTasks: createDefaultProjectManagementPhasePlan()
    });
    const missingGoalLink = buildPhase3ClearanceTraceabilityPrecondition({
      goals: [
        phase3Goal({
          pmTaskIds: REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS.filter(
            (taskId) => taskId !== "phase-03-child-handoff-gate"
          )
        })
      ],
      pmTasks: createDefaultProjectManagementPhasePlan()
    });
    const duplicateCurrent = buildPhase3ClearanceTraceabilityPrecondition({
      goals: [
        phase3Goal(),
        {
          ...remainingGoalPlan.find(
            (goal) => goal.id === "goal-phase-4-provider-surfaces"
          )!,
          status: "active",
          current: true
        }
      ],
      pmTasks: createDefaultProjectManagementPhasePlan()
    });

    expect(ready).toMatchObject({
      state: "ready",
      canTrustTrace: true
    });
    expect(missingGoalLink).toMatchObject({
      state: "review",
      canTrustTrace: false,
      nextAction: expect.stringContaining("phase-03-child-handoff-gate")
    });
    expect(duplicateCurrent).toMatchObject({
      state: "review",
      canTrustTrace: false,
      detail: expect.stringContaining("2 current active")
    });
  });

  it("blocks when the required Phase 3 goal is missing or no longer active critical", () => {
    const missing = snapshot({ goals: [] });
    const wrongStatus = snapshot({
      goals: [
        phase3Goal({
          status: "next",
          priority: "high",
          phaseIds: []
        })
      ]
    });

    expect(missing.state).toBe("blocked");
    expect(missing.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "active-goal", status: "blocked" })
      ])
    );
    expect(wrongStatus.state).toBe("blocked");
    expect(wrongStatus.nextAction).toContain("Restore Phase 3");
  });

  it("blocks when required PM rows are missing from the board plan", () => {
    const pmTasks = createDefaultProjectManagementPhasePlan().filter(
      (task) => task.id !== "phase-03-child-control-ready"
    );
    const result = snapshot({ pmTasks });

    expect(result.state).toBe("blocked");
    expect(result.canTrustTrace).toBe(false);
    expect(result.linkedPmTaskCount).toBe(
      REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS.length - 1
    );
    expect(result.missingPmTaskIds).toEqual(["phase-03-child-control-ready"]);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "pm-coverage", status: "blocked" })
      ])
    );
  });

  it("reviews when the board has the PM rows but the active goal omits one", () => {
    const result = snapshot({
      goals: [
        phase3Goal({
          pmTaskIds: REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS.filter(
            (taskId) => taskId !== "phase-03-child-traceability"
          )
        })
      ]
    });

    expect(result.state).toBe("review");
    expect(result.canTrustTrace).toBe(false);
    expect(result.missingPmTaskIds).toEqual([]);
    expect(result.missingGoalPmTaskIds).toEqual(["phase-03-child-traceability"]);
    expect(result.nextAction).toContain("Link missing Phase 3 PM rows");
  });

  it("keeps goal completion honest until owner handoff can resume Phase 4 review", () => {
    const result = snapshot({
      goals: [phase3Goal({ completionPercent: 100 })],
      clearancePackage: clearance({ canExit: true }),
      handoffGate: handoff({
        state: "waiting",
        statusLabel: "Waiting",
        canAdvanceProviderIntegration: false,
        waitingCount: 2,
        nextAction: "Record the owner-reviewed Phase 3 handoff."
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.canTrustTrace).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "goal-honesty", status: "blocked" }),
        expect.objectContaining({ kind: "handoff-boundary", status: "waiting" })
      ])
    );
  });

  it("keeps trace untrusted when the handoff record no longer matches current evidence", () => {
    const result = snapshot({
      handoffGate: handoff({
        state: "review",
        statusLabel: "Review",
        canAdvanceProviderIntegration: false,
        reviewCount: 2,
        nextAction:
          "Clear and record the Phase 3 handoff again from the current exit-ready evidence."
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustTrace).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "handoff-boundary",
          status: "review",
          detail: expect.stringContaining("does not match current evidence")
        })
      ])
    );
  });

  it("carries handoff snapshot mismatch detail into traceability", () => {
    const result = snapshot({
      handoffGate: handoff({
        state: "review",
        statusLabel: "Review",
        canAdvanceProviderIntegration: false,
        reviewCount: 2,
        nextAction:
          "Clear and record the Phase 3 handoff again from the current clearance snapshot.",
        items: [
          {
            id: "phase-3-handoff-gate:handoff-record",
            label: "Owner handoff record",
            kind: "handoff-record",
            status: "review",
            detail:
              "Owner handoff record snapshot no longer matches current Phase 3 clearance readiness or blocker evidence.",
            nextAction:
              "Clear and record the Phase 3 handoff again from the current clearance snapshot."
          },
          {
            id: "phase-3-handoff-gate:provider-boundary",
            label: "Provider boundary",
            kind: "provider-boundary",
            status: "review",
            detail:
              "Phase 4 review remains held because Owner handoff record snapshot no longer matches current Phase 3 clearance readiness or blocker evidence.",
            nextAction:
              "Clear and record the Phase 3 handoff again from the current clearance snapshot."
          }
        ]
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustTrace).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "handoff-boundary",
          status: "review",
          detail: expect.stringContaining("snapshot no longer matches current Phase 3 clearance")
        })
      ])
    );
    expect(result.nextAction).toBe(
      "Clear and record the Phase 3 handoff again from the current clearance snapshot."
    );
  });

  it("keeps trace untrusted when CLI validation freshness needs review", () => {
    const result = snapshot({
      commandValidation: commandValidation({
        state: "review",
        statusLabel: "Review",
        detail: "Phase 3 CLI smoke validation record is stale and must be recorded again.",
        nextAction:
          "Rerun npm.cmd run smoke:phase3 manually, then record a fresh local CLI pass.",
        isFresh: false
      })
    });

    expect(result.state).toBe("review");
    expect(result.canTrustTrace).toBe(false);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "command-validation",
          status: "review",
          detail: expect.stringContaining("stale")
        }),
        expect.objectContaining({
          kind: "handoff-boundary",
          status: "ready"
        })
      ])
    );
    expect(result.nextAction).toContain("Rerun npm.cmd run smoke:phase3");
  });

  it("keeps traceability text public-safe and independent from Phase 7 ownership", () => {
    const result = snapshot({
      clearancePackage: clearance({
        state: "blocked",
        canExit: false,
        openCount: 1,
        nextAction:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      }),
      blockerPriority: blockerPriority({
        state: "blocked",
        openBlockerCount: 1,
        nextAction: "Repair Phase 3 blocker."
      }),
      commandPlan: commandPlan({ state: "blocked" })
    });
    const combinedText = [
      result.label,
      result.nextAction,
      result.safety,
      result.ariaLabel,
      ...result.items.flatMap((item) => [
        item.label,
        item.detail,
        item.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
    expect(combinedText).not.toContain("Phase 7");
  });

  it("carries exact blocked blocker-priority action into clearance traceability", () => {
    const result = snapshot({
      clearancePackage: clearance({
        state: "blocked",
        canExit: false,
        openCount: 1,
        blockerCount: 1,
        nextAction: "Generic blocked clearance action."
      }),
      blockerPriority: blockerPriority({
        state: "blocked",
        openBlockerCount: 1,
        topPriorityLabel: "Session controls",
        topPriorityAction: "Repair session controls.",
        nextAction: "Repair session controls."
      }),
      commandPlan: commandPlan({ state: "blocked" }),
      handoffGate: handoff({
        state: "blocked",
        canAdvanceProviderIntegration: false,
        nextAction: "Repair session controls."
      })
    });

    expect(result.state).toBe("blocked");
    expect(result.nextAction).toBe("Repair session controls.");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "clearance-evidence",
          status: "blocked",
          nextAction: "Repair session controls."
        })
      ])
    );
  });
});
