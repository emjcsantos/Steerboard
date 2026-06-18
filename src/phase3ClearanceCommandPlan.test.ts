import { describe, expect, it } from "vitest";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import { buildPhase3ClearanceCommandPlan } from "./phase3ClearanceCommandPlan";
import type { Phase3OwnerTestingAction } from "./phase3OwnerTestingActions";

function clearancePackage(
  overrides: Partial<Phase3ClearancePackage> = {}
): Phase3ClearancePackage {
  return {
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 35,
    canExit: false,
    detail: "Phase 3 is waiting on desktop proof.",
    nextAction: "Run live-control smoke.",
    readyCount: 2,
    openCount: 3,
    blockerCount: 0,
    reviewCount: 0,
    waitingCount: 3,
    blockers: [
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

function smokeAction(
  id: string,
  overrides: Partial<Phase3OwnerTestingAction> = {}
): Phase3OwnerTestingAction {
  return {
    id,
    label: "Smoke",
    kind: "smoke",
    state: "recommended",
    detail: "Run it.",
    buttonLabel: "Run smoke",
    disabled: false,
    ...overrides
  };
}

const smokeActions = [
  smokeAction("phase3-owner-testing:live-control-smoke", { label: "Live-control smoke" }),
  smokeAction("phase3-owner-testing:active-turn-interrupt-smoke", {
    label: "Active-turn interrupt smoke"
  }),
  smokeAction("phase3-owner-testing:active-turn-steer-smoke", {
    label: "Active-turn steer smoke"
  })
];

describe("phase 3 clearance command plan", () => {
  it("exposes the explicit desktop smoke command when smoke actions are runnable", () => {
    const plan = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage(),
      actions: smokeActions
    });

    expect(plan.command).toBe("npm.cmd run smoke:phase3");
    expect(plan.canRunCommand).toBe(true);
    expect(plan.state).toBe("waiting");
    expect(plan.coveredSmokeCount).toBe(3);
    expect(plan.readySmokeCount).toBe(2);
    expect(plan.openSmokeCount).toBe(1);
    expect(plan.nextAction).toContain("npm.cmd run smoke:phase3");
    expect(plan.safety).toContain("does not run commands");
    expect(plan.items.map((item) => item.kind)).toEqual([
      "slash-evidence",
      "session-control",
      "live-control-smoke",
      "active-turn-interrupt-smoke",
      "active-turn-steer-smoke"
    ]);
    expect(plan.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Live-control smoke proof",
          state: "waiting",
          detail: expect.stringContaining("live-control")
        }),
        expect.objectContaining({
          label: "Active-turn interrupt smoke proof",
          state: "ready",
          detail: expect.stringContaining("active-turn interrupt")
        }),
        expect.objectContaining({
          label: "Active-turn steer smoke proof",
          state: "ready",
          detail: expect.stringContaining("active-turn steer")
        })
      ])
    );
  });

  it("holds the command plan when session start is blocked", () => {
    const plan = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage({
        state: "blocked",
        blockers: [
          {
            id: "phase3-exit-gate:session-controls",
            label: "Session controls",
            state: "blocked",
            nextAction: "Repair session controls.",
            pmTaskId: "phase-03-child-control-ready",
            evidenceKey: "phase3.session-controls"
          }
        ]
      }),
      actions: smokeActions.map((action) => ({ ...action, state: "blocked", disabled: true }))
    });

    expect(plan.state).toBe("blocked");
    expect(plan.canRunCommand).toBe(false);
    expect(plan.nextAction).toBe("Repair session controls.");
    expect(plan.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Session-control evidence",
          state: "blocked"
        })
      ])
    );
  });

  it("keeps slash blockers ahead of unrelated runnable smoke commands", () => {
    const plan = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage({
        blockers: [
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "waiting",
            nextAction: "Run slash proof first.",
            pmTaskId: "phase-03-child-slash-ready",
            evidenceKey: "phase3.slash-execution"
          }
        ]
      }),
      actions: smokeActions
    });

    expect(plan.canRunCommand).toBe(false);
    expect(plan.nextAction).toBe("Run slash proof first.");
    expect(plan.readySmokeCount).toBe(3);
    expect(plan.openSmokeCount).toBe(0);
    expect(plan.items.filter((item) => item.kind.endsWith("-smoke"))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Live-control smoke proof", state: "ready" }),
        expect.objectContaining({ label: "Active-turn interrupt smoke proof", state: "ready" }),
        expect.objectContaining({ label: "Active-turn steer smoke proof", state: "ready" })
      ])
    );
  });

  it("keeps slash blockers ahead when a smoke blocker is also open", () => {
    const plan = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage({
        blockers: [
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "waiting",
            nextAction: "Run slash proof first.",
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
      actions: smokeActions
    });

    expect(plan.canRunCommand).toBe(false);
    expect(plan.nextAction).toBe("Run slash proof first.");
    expect(plan.readySmokeCount).toBe(2);
    expect(plan.openSmokeCount).toBe(1);
    expect(plan.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Slash execution evidence",
          detail: "Slash execution proof is still open before Phase 3 can clear."
        })
      ])
    );
    expect(plan.items.filter((item) => item.kind.endsWith("-smoke"))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Live-control smoke proof", state: "waiting" }),
        expect.objectContaining({ label: "Active-turn interrupt smoke proof", state: "ready" }),
        expect.objectContaining({ label: "Active-turn steer smoke proof", state: "ready" })
      ])
    );
  });

  it("preserves focused-panel blocker detail in the command-plan row", () => {
    const plan = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage({
        state: "review",
        blockers: [
          {
            id: "phase3-exit-gate:slash-execution",
            label: "Slash execution",
            state: "review",
            detail:
              "Slash execution storage provenance belongs to another panel and must be refreshed from the current Arena panel.",
            nextAction: "Refresh slash execution evidence from the current Arena panel transcript.",
            pmTaskId: "phase-03-child-slash-ready",
            evidenceKey: "phase3.slash-execution"
          }
        ]
      }),
      actions: smokeActions
    });

    expect(plan.canRunCommand).toBe(false);
    expect(plan.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Slash execution evidence",
          state: "review",
          detail: expect.stringContaining("belongs to another panel")
        })
      ])
    );
    expect(plan.nextAction).toBe(
      "Refresh slash execution evidence from the current Arena panel transcript."
    );
  });

  it("holds first smoke blocker command addressability when the matching action is unavailable", () => {
    const plan = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage({
        blockers: [
          {
            id: "phase3-exit-gate:active-turn-steer-smoke",
            label: "Active-turn steer smoke",
            state: "waiting",
            nextAction: "Run steer smoke first.",
            pmTaskId: "phase-03-child-smoke-rows",
            evidenceKey: "phase3.active-turn-steer-smoke"
          }
        ]
      }),
      actions: [
        smokeAction("phase3-owner-testing:live-control-smoke", {
          label: "Live-control smoke",
          disabled: true
        })
      ]
    });

    expect(plan.canRunCommand).toBe(false);
    expect(plan.nextAction).toBe(
      "Attach the matching Phase 3 owner smoke action before running npm.cmd run smoke:phase3."
    );
  });

  it("uses the matching runnable smoke action for command addressability", () => {
    const plan = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage({
        blockers: [
          {
            id: "phase3-exit-gate:active-turn-steer-smoke",
            label: "Active-turn steer smoke",
            state: "waiting",
            nextAction: "Run steer smoke first.",
            pmTaskId: "phase-03-child-smoke-rows",
            evidenceKey: "phase3.active-turn-steer-smoke"
          }
        ]
      }),
      actions: [
        smokeAction("phase3-owner-testing:active-turn-steer-smoke", {
          label: "Active-turn steer smoke",
          disabled: false,
          state: "recommended"
        })
      ]
    });

    expect(plan.canRunCommand).toBe(true);
    expect(plan.nextAction).toBe(
      "Run npm.cmd run smoke:phase3 locally to refresh live-control, active-turn interrupt, and active-turn steer proofs."
    );
  });

  it("keeps blocked smoke blockers command-addressable only when their action can rerun evidence", () => {
    const held = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 15,
        blockers: [
          {
            id: "phase3-exit-gate:active-turn-interrupt-smoke",
            label: "Active-turn interrupt smoke",
            state: "blocked",
            nextAction: "Rerun interrupt smoke.",
            pmTaskId: "phase-03-child-smoke-rows",
            evidenceKey: "phase3.active-turn-interrupt-smoke"
          }
        ]
      }),
      actions: []
    });
    const plan = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage({
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 15,
        blockers: [
          {
            id: "phase3-exit-gate:active-turn-interrupt-smoke",
            label: "Active-turn interrupt smoke",
            state: "blocked",
            nextAction: "Rerun interrupt smoke.",
            pmTaskId: "phase-03-child-smoke-rows",
            evidenceKey: "phase3.active-turn-interrupt-smoke"
          }
        ]
      }),
      actions: [
        smokeAction("phase3-owner-testing:active-turn-interrupt-smoke", {
          label: "Active-turn interrupt smoke"
        })
      ]
    });

    expect(held.state).toBe("blocked");
    expect(held.canRunCommand).toBe(false);
    expect(held.nextAction).toContain("matching Phase 3 owner smoke action");
    expect(plan.state).toBe("blocked");
    expect(plan.canRunCommand).toBe(true);
    expect(plan.nextAction).toContain("npm.cmd run smoke:phase3");
  });

  it("keeps transient smoke passes open until storage-attested proof rows exist", () => {
    const plan = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage({
        state: "review",
        statusLabel: "Review",
        readiness: 65,
        blockers: [
          {
            id: "phase3-exit-gate:live-control-smoke",
            label: "Live control smoke",
            state: "review",
            detail:
              "Live-control desktop smoke proof must be loaded from persisted/imported desktop proof storage before Phase 3 handoff.",
            nextAction: "Import storage-attested live-control desktop proof.",
            pmTaskId: "phase-03-child-smoke-rows",
            evidenceKey: "phase3.live-control-smoke"
          },
          {
            id: "phase3-exit-gate:active-turn-interrupt-smoke",
            label: "Active-turn interrupt smoke",
            state: "review",
            detail:
              "Active-turn interrupt desktop smoke proof must be loaded from persisted/imported desktop proof storage before Phase 3 handoff.",
            nextAction: "Import storage-attested interrupt desktop proof.",
            pmTaskId: "phase-03-child-smoke-rows",
            evidenceKey: "phase3.active-turn-interrupt-smoke"
          },
          {
            id: "phase3-exit-gate:active-turn-steer-smoke",
            label: "Active-turn steer smoke",
            state: "review",
            detail:
              "Active-turn steer desktop smoke proof must be loaded from persisted/imported desktop proof storage before Phase 3 handoff.",
            nextAction: "Import storage-attested steer desktop proof.",
            pmTaskId: "phase-03-child-smoke-rows",
            evidenceKey: "phase3.active-turn-steer-smoke"
          }
        ]
      }),
      actions: smokeActions
    });

    expect(plan.canRunCommand).toBe(true);
    expect(plan.readySmokeCount).toBe(0);
    expect(plan.openSmokeCount).toBe(3);
    expect(plan.items.filter((item) => item.kind.endsWith("-smoke"))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Live-control smoke proof",
          state: "review",
          detail: expect.stringContaining("storage-attested")
        }),
        expect.objectContaining({
          label: "Active-turn interrupt smoke proof",
          state: "review",
          detail: expect.stringContaining("persisted/imported desktop proof storage")
        }),
        expect.objectContaining({
          label: "Active-turn steer smoke proof",
          state: "review"
        })
      ])
    );
  });

  it("keeps command-plan blocker detail public-safe", () => {
    const plan = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage({
        state: "review",
        blockers: [
          {
            id: "phase3-exit-gate:session-controls",
            label: "Session controls",
            state: "review",
            detail:
              "Review C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
            nextAction:
              "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>",
            pmTaskId: "phase-03-child-control-ready",
            evidenceKey: "phase3.session-controls"
          }
        ]
      }),
      actions: smokeActions
    });
    const combinedText = [
      plan.nextAction,
      plan.ariaLabel,
      ...plan.items.flatMap((item) => [item.detail, item.nextAction])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });

  it("stops recommending the command after Phase 3 is exit-ready", () => {
    const plan = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canExit: true,
        readyCount: 5,
        openCount: 0,
        waitingCount: 0,
        blockers: []
      }),
      actions: smokeActions.map((action) => ({ ...action, state: "ready" }))
    });

    expect(plan.state).toBe("ready");
    expect(plan.canRunCommand).toBe(false);
    expect(plan.readySmokeCount).toBe(3);
    expect(plan.openSmokeCount).toBe(0);
    expect(plan.nextAction).toContain("no longer needed");
    expect(plan.ariaLabel).toContain("3/3 smoke proofs ready");
  });

  it("keeps exit-ready smoke rows ready when current smoke controls are disabled", () => {
    const plan = buildPhase3ClearanceCommandPlan({
      clearancePackage: clearancePackage({
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canExit: true,
        readyCount: 5,
        openCount: 0,
        waitingCount: 0,
        blockers: []
      }),
      actions: smokeActions.map((action) => ({ ...action, state: "blocked", disabled: true }))
    });

    expect(plan.state).toBe("ready");
    expect(plan.canRunCommand).toBe(false);
    expect(plan.readySmokeCount).toBe(3);
    expect(plan.openSmokeCount).toBe(0);
    expect(plan.items.filter((item) => item.kind.endsWith("-smoke")).map((item) => item.state)).toEqual([
      "ready",
      "ready",
      "ready"
    ]);
  });
});
