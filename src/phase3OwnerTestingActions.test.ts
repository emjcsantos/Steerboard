import { describe, expect, it } from "vitest";
import { buildPhase3OwnerTestingActions } from "./phase3OwnerTestingActions";

describe("phase 3 owner-testing actions", () => {
  it("returns five actions in stable order with expected ids and kinds", () => {
    const actions = buildPhase3OwnerTestingActions({
      canStartSession: true,
      liveControlSmokeGate: { state: "ready" },
      activeTurnInterruptSmokeGate: { state: "ready" },
      activeTurnSteerSmokeGate: { state: "ready" }
    });

    expect(actions.map((action) => action.id)).toEqual([
      "phase3-owner-testing:slash-guidance",
      "phase3-owner-testing:session-guidance",
      "phase3-owner-testing:live-control-smoke",
      "phase3-owner-testing:active-turn-interrupt-smoke",
      "phase3-owner-testing:active-turn-steer-smoke"
    ]);

    expect(actions.map((action) => action.kind)).toEqual([
      "guidance",
      "guidance",
      "smoke",
      "smoke",
      "smoke"
    ]);
  });

  it("returns disabled guidance actions with cockpit-facing copy", () => {
    const actions = buildPhase3OwnerTestingActions({
      canStartSession: true,
      liveControlSmokeGate: { state: "ready" },
      activeTurnInterruptSmokeGate: { state: "ready" },
      activeTurnSteerSmokeGate: { state: "ready" }
    });

    expect(actions[0]).toMatchObject({
      id: "phase3-owner-testing:slash-guidance",
      kind: "guidance",
      disabled: true
    });
    expect(actions[1]).toMatchObject({
      id: "phase3-owner-testing:session-guidance",
      kind: "guidance",
      disabled: true
    });
    expect(actions[0].detail.toLowerCase()).toContain("arena composer");
    expect(actions[1].detail.toLowerCase()).toContain("session controls");
  });

  it("returns blocked smoke actions when canStartSession is false", () => {
    const actions = buildPhase3OwnerTestingActions({
      canStartSession: false,
      liveControlSmokeGate: { state: "ready" },
      activeTurnInterruptSmokeGate: { state: "ready" },
      activeTurnSteerSmokeGate: { state: "ready" }
    });

    expect(actions[2]).toMatchObject({
      id: "phase3-owner-testing:live-control-smoke",
      kind: "smoke",
      state: "blocked",
      disabled: true
    });
    expect(actions[3]).toMatchObject({
      id: "phase3-owner-testing:active-turn-interrupt-smoke",
      kind: "smoke",
      state: "blocked",
      disabled: true
    });
    expect(actions[4]).toMatchObject({
      id: "phase3-owner-testing:active-turn-steer-smoke",
      kind: "smoke",
      state: "blocked",
      disabled: true
    });
  });

  it("marks a loading smoke action as running", () => {
    const actions = buildPhase3OwnerTestingActions({
      canStartSession: true,
      loading: {
        liveControlSmoke: true
      },
      liveControlSmokeGate: { state: "ready" },
      activeTurnInterruptSmokeGate: { state: "ready" },
      activeTurnSteerSmokeGate: { state: "ready" }
    });

    expect(actions[2]).toMatchObject({
      state: "running",
      disabled: true
    });
    expect(actions[2].buttonLabel).toBe("Running smoke...");
    expect(actions[3].state).toBe("ready");
    expect(actions[4].state).toBe("ready");
  });

  it("returns ready smoke action from ready gate items", () => {
    const actions = buildPhase3OwnerTestingActions({
      canStartSession: true,
      liveControlSmokeGate: { state: "ready" },
      activeTurnInterruptSmokeGate: { state: "ready" },
      activeTurnSteerSmokeGate: { state: "ready" }
    });

    expect(actions[2]).toMatchObject({ state: "ready", disabled: false });
    expect(actions[3]).toMatchObject({ state: "ready", disabled: false });
    expect(actions[4]).toMatchObject({ state: "ready", disabled: false });
  });

  it("returns recommended smoke action from waiting/review/blocked gate states", () => {
    for (const state of ["waiting", "review", "blocked"] as const) {
      const actions = buildPhase3OwnerTestingActions({
        canStartSession: true,
        liveControlSmokeGate: { state },
        activeTurnInterruptSmokeGate: { state: "ready" },
        activeTurnSteerSmokeGate: { state: "ready" }
      });

      expect(actions[2]).toMatchObject({
        state: "recommended",
        disabled: false
      });
    }
  });
});
