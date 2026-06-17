import { describe, expect, it } from "vitest";
import type { Phase3ClearanceCommandPlan } from "./phase3ClearanceCommandPlan";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import { buildPhase3ClearanceBlockerPriority } from "./phase3ClearanceBlockerPriority";

function clearancePackage(
  overrides: Partial<Phase3ClearancePackage> = {}
): Phase3ClearancePackage {
  return {
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 35,
    canExit: false,
    detail: "Phase 3 is waiting on blockers.",
    nextAction: "Run missing proof.",
    readyCount: 2,
    openCount: 3,
    blockerCount: 0,
    reviewCount: 0,
    waitingCount: 3,
    blockers: [
      {
        id: "phase3-exit-gate:active-turn-steer-smoke",
        label: "Active-turn steer smoke",
        state: "waiting",
        nextAction: "Run steer smoke.",
        pmTaskId: "phase-03-child-smoke-rows",
        evidenceKey: "phase3.active-turn-steer-smoke"
      },
      {
        id: "phase3-exit-gate:slash-execution",
        label: "Slash execution",
        state: "waiting",
        nextAction: "Run provider-routed slash proof.",
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
    ],
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
    canRunCommand: true,
    coveredSmokeCount: 3,
    readySmokeCount: 0,
    openSmokeCount: 3,
    nextAction: "Run npm.cmd run smoke:phase3 locally.",
    safety: "Evidence only.",
    ariaLabel: "Waiting.",
    items: [],
    ...overrides
  };
}

describe("phase 3 clearance blocker priority", () => {
  it("ranks blocked and non-smoke blockers above command-addressable smoke blockers", () => {
    const snapshot = buildPhase3ClearanceBlockerPriority({
      clearancePackage: clearancePackage({
        state: "blocked",
        readiness: 15,
        blockers: [
          {
            id: "phase3-exit-gate:active-turn-steer-smoke",
            label: "Active-turn steer smoke",
            state: "waiting",
            nextAction: "Run steer smoke.",
            pmTaskId: "phase-03-child-smoke-rows",
            evidenceKey: "phase3.active-turn-steer-smoke"
          },
          {
            id: "phase3-exit-gate:session-controls",
            label: "Session controls",
            state: "blocked",
            nextAction: "Repair session controls.",
            pmTaskId: "phase-03-child-control-ready",
            evidenceKey: "phase3.session-controls"
          },
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "waiting",
            nextAction: "Run provider-routed slash proof.",
            pmTaskId: "phase-03-child-slash-ready",
            evidenceKey: "phase3.slash-execution"
          }
        ]
      }),
      commandPlan: commandPlan()
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.topPriorityLabel).toBe("Session controls");
    expect(snapshot.commandCanAddressTopBlocker).toBe(false);
    expect(snapshot.items.map((item) => item.label)).toEqual([
      "Session controls",
      "Slash execution",
      "Active-turn steer smoke"
    ]);
    expect(snapshot.items[0]).toMatchObject({
      priority: 1,
      kind: "session-control",
      severity: "critical",
      canUseSmokeCommand: false
    });
  });

  it("keeps slash or session blockers ahead of blocked desktop smoke", () => {
    const snapshot = buildPhase3ClearanceBlockerPriority({
      clearancePackage: clearancePackage({
        state: "blocked",
        readiness: 15,
        blockers: [
          {
            id: "phase3-exit-gate:active-turn-steer-smoke",
            label: "Active-turn steer smoke",
            state: "blocked",
            nextAction: "Repair steer smoke.",
            pmTaskId: "phase-03-child-smoke-rows",
            evidenceKey: "phase3.active-turn-steer-smoke"
          },
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "waiting",
            nextAction: "Run provider-routed slash proof.",
            pmTaskId: "phase-03-child-slash-ready",
            evidenceKey: "phase3.slash-execution"
          }
        ]
      }),
      commandPlan: commandPlan()
    });

    expect(snapshot.topPriorityLabel).toBe("Slash execution");
    expect(snapshot.commandCanAddressTopBlocker).toBe(false);
    expect(snapshot.items.map((item) => item.label)).toEqual([
      "Slash execution",
      "Active-turn steer smoke"
    ]);
    expect(snapshot.items[0]).toMatchObject({
      priority: 1,
      kind: "slash-evidence",
      severity: "high",
      canUseSmokeCommand: false
    });
  });

  it("marks desktop smoke blockers as command-addressable only when the command plan is runnable", () => {
    const runnable = buildPhase3ClearanceBlockerPriority({
      clearancePackage: clearancePackage({
        blockers: [
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
      commandPlan: commandPlan({ canRunCommand: true })
    });
    const held = buildPhase3ClearanceBlockerPriority({
      clearancePackage: clearancePackage({
        blockers: [
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
      commandPlan: commandPlan({ canRunCommand: false })
    });

    expect(runnable.commandAddressableCount).toBe(1);
    expect(runnable.commandCanAddressTopBlocker).toBe(true);
    expect(runnable.nextAction).toBe(
      "Run npm.cmd run smoke:phase3 locally when desktop session start is available."
    );
    expect(runnable.items[0].detail).toContain("npm.cmd run smoke:phase3 can refresh this blocker");
    expect(held.commandAddressableCount).toBe(0);
    expect(held.commandCanAddressTopBlocker).toBe(false);
  });

  it("returns ready when no Phase 3 blockers remain", () => {
    const snapshot = buildPhase3ClearanceBlockerPriority({
      clearancePackage: clearancePackage({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canExit: true,
        openCount: 0,
        blockers: []
      }),
      commandPlan: commandPlan({ canRunCommand: false })
    });

    expect(snapshot.state).toBe("ready");
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.openBlockerCount).toBe(0);
    expect(snapshot.items).toEqual([]);
    expect(snapshot.topPriorityLabel).toBe("No open Phase 3 blocker");
    expect(snapshot.nextAction).toContain("No Phase 3 blockers remain");
  });

  it("keeps prioritized blocker text public-safe", () => {
    const snapshot = buildPhase3ClearanceBlockerPriority({
      clearancePackage: clearancePackage({
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
      }),
      commandPlan: commandPlan()
    });
    const combinedText = [
      snapshot.label,
      snapshot.nextAction,
      snapshot.safety,
      snapshot.ariaLabel,
      ...snapshot.items.flatMap((item) => [
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
  });
});
