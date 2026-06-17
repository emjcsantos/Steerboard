import { describe, expect, it } from "vitest";
import type { Phase3ClearanceBlockerPrioritySnapshot } from "./phase3ClearanceBlockerPriority";
import type { Phase3ClearanceCommandPlan } from "./phase3ClearanceCommandPlan";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3HandoffGate } from "./phase3HandoffGate";
import {
  buildPhase3ClearanceTraceability,
  PHASE3_CLEARANCE_GOAL_ID,
  PHASE3_CLEARANCE_PHASE_ID,
  REQUIRED_PHASE3_CLEARANCE_PM_TASK_IDS
} from "./phase3ClearanceTraceability";
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
    topPriorityAction: "Record owner handoff.",
    commandCanAddressTopBlocker: false,
    nextAction: "Record owner handoff.",
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
    nextAction: "Advance after owner review.",
    safety: "Evidence only.",
    ariaLabel: "Ready.",
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
    blockerPriority: blockerPriority(),
    handoffGate: handoff(),
    ...overrides
  });
}

describe("phase 3 clearance traceability", () => {
  it("links the active critical Phase 3 goal to every required PM row and ready evidence", () => {
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

  it("keeps goal completion honest until owner handoff can advance provider integration", () => {
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
});
