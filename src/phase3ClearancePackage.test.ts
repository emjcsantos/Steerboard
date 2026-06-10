import { describe, expect, it } from "vitest";
import { buildPhase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3ExitGateEvidence } from "./phase3ExitGateEvidence";
import type { Phase3OwnerTestingAction } from "./phase3OwnerTestingActions";

function buildExitGate(overrides: Partial<Phase3ExitGateEvidence> = {}): Phase3ExitGateEvidence {
  return {
    state: "ready",
    readiness: 100,
    pass: true,
    statusLabel: "Ready",
    detail: "Ready.",
    safety: "evidence-only",
    nextAction: "Proceed.",
    counts: {
      ready: 5,
      review: 0,
      blocked: 0,
      waiting: 0
    },
    items: [
      {
        id: "phase3-exit-gate:slash-execution",
        label: "Slash execution",
        state: "ready",
        detail: "Slash ready.",
        nextAction: "Proceed."
      },
      {
        id: "phase3-exit-gate:session-controls",
        label: "Session controls",
        state: "ready",
        detail: "Controls ready.",
        nextAction: "Proceed."
      },
      {
        id: "phase3-exit-gate:live-control-smoke",
        label: "Live control smoke",
        state: "ready",
        detail: "Live control ready.",
        nextAction: "Proceed."
      },
      {
        id: "phase3-exit-gate:active-turn-interrupt-smoke",
        label: "Active-turn interrupt smoke",
        state: "ready",
        detail: "Interrupt ready.",
        nextAction: "Proceed."
      },
      {
        id: "phase3-exit-gate:active-turn-steer-smoke",
        label: "Active-turn steer smoke",
        state: "ready",
        detail: "Steer ready.",
        nextAction: "Proceed."
      }
    ],
    ...overrides
  };
}

function smokeAction(overrides: Partial<Phase3OwnerTestingAction>): Phase3OwnerTestingAction {
  return {
    id: "phase3-owner-testing:live-control-smoke",
    label: "Live-control smoke",
    kind: "smoke",
    state: "recommended",
    detail: "Run it.",
    buttonLabel: "Run smoke",
    disabled: false,
    ...overrides
  };
}

describe("phase 3 clearance package", () => {
  it("waits with a synthetic blocker when exit-gate evidence is missing", () => {
    expect(buildPhase3ClearancePackage()).toMatchObject({
      state: "waiting",
      statusLabel: "Waiting",
      canExit: false,
      readyCount: 0,
      openCount: 1,
      waitingCount: 1,
      blockers: [
        {
          id: "phase3-clearance:exit-gate",
          label: "Exit gate evidence",
          state: "waiting"
        }
      ]
    });
  });

  it("allows exit only when the exit gate is fully ready", () => {
    const result = buildPhase3ClearancePackage({
      exitGate: buildExitGate()
    });

    expect(result).toMatchObject({
      state: "ready",
      statusLabel: "Ready",
      readiness: 100,
      canExit: true,
      readyCount: 5,
      openCount: 0,
      blockerCount: 0,
      reviewCount: 0,
      waitingCount: 0,
      nextAction: "Record the Phase 3 handoff and advance provider integration only after owner review."
    });
    expect(result.blockers).toEqual([]);
    expect(result.safety).toContain("evidence-only");
  });

  it("keeps blocked diagnostics as exact blockers", () => {
    const result = buildPhase3ClearancePackage({
      exitGate: buildExitGate({
        state: "blocked",
        readiness: 15,
        pass: false,
        counts: {
          ready: 3,
          review: 0,
          blocked: 1,
          waiting: 1
        },
        items: [
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "blocked",
            detail: "Provider route unavailable.",
            nextAction: "Repair provider route."
          },
          {
            id: "phase3-exit-gate:live-control-smoke",
            label: "Live control smoke",
            state: "waiting",
            detail: "Smoke missing.",
            nextAction: "Run live-control smoke."
          }
        ]
      })
    });

    expect(result).toMatchObject({
      state: "blocked",
      statusLabel: "Blocked",
      canExit: false,
      readyCount: 3,
      openCount: 2,
      blockerCount: 1,
      waitingCount: 1,
      nextAction: "Repair provider route."
    });
    expect(result.blockers.map((blocker) => blocker.id)).toEqual([
      "phase3-exit-gate:slash-execution",
      "phase3-exit-gate:live-control-smoke"
    ]);
  });

  it("promotes the first runnable smoke action as the next owner action", () => {
    const result = buildPhase3ClearancePackage({
      exitGate: buildExitGate({
        state: "waiting",
        readiness: 35,
        pass: false,
        counts: {
          ready: 2,
          review: 0,
          blocked: 0,
          waiting: 3
        },
        items: [
          {
            id: "phase3-exit-gate:active-turn-interrupt-smoke",
            label: "Active-turn interrupt smoke",
            state: "waiting",
            detail: "Interrupt missing.",
            nextAction: "Run interrupt smoke."
          }
        ]
      }),
      actions: [
        smokeAction({
          id: "phase3-owner-testing:active-turn-interrupt-smoke",
          label: "Active-turn interrupt smoke"
        })
      ]
    });

    expect(result).toMatchObject({
      state: "waiting",
      canExit: false,
      primaryActionId: "phase3-owner-testing:active-turn-interrupt-smoke",
      primaryActionLabel: "Active-turn interrupt smoke",
      nextAction: "Run Active-turn interrupt smoke from Owner Testing."
    });
  });

  it("prefers a running smoke action over another recommended action", () => {
    const result = buildPhase3ClearancePackage({
      exitGate: buildExitGate({
        state: "review",
        readiness: 65,
        pass: false,
        counts: {
          ready: 4,
          review: 1,
          blocked: 0,
          waiting: 0
        },
        items: [
          {
            id: "phase3-exit-gate:active-turn-steer-smoke",
            label: "Active-turn steer smoke",
            state: "review",
            detail: "Steer incomplete.",
            nextAction: "Rerun steer smoke."
          }
        ]
      }),
      actions: [
        smokeAction({
          id: "phase3-owner-testing:live-control-smoke",
          label: "Live-control smoke",
          state: "recommended"
        }),
        smokeAction({
          id: "phase3-owner-testing:active-turn-steer-smoke",
          label: "Active-turn steer smoke",
          state: "running",
          disabled: true,
          buttonLabel: "Running smoke..."
        })
      ]
    });

    expect(result.primaryActionId).toBe("phase3-owner-testing:active-turn-steer-smoke");
    expect(result.nextAction).toBe("Run Active-turn steer smoke from Owner Testing.");
  });
});
