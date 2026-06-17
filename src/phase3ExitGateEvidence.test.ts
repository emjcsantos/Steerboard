import { describe, expect, it } from "vitest";
import { buildPhase3ExitGateEvidence } from "./phase3ExitGateEvidence";

describe("phase 3 exit gate evidence", () => {
  it("returns ready only when slash/session evidence and all desktop smokes are satisfied", () => {
    const result = buildPhase3ExitGateEvidence({
      slashEvidence: {
        state: "ready",
        pass: true,
        readiness: 100,
        status: "Ready",
        detail: "slash command execution live",
        safety: "none",
        executable: true,
        command: "/plan",
        route: "provider"
      },
      sessionControlEvidence: {
        state: "ready",
        readiness: 100,
        pass: true,
        statusLabel: "Ready",
        detail: "session controls observed",
        safety: "none",
        counts: {
          live: 3,
          review: 0,
          unsupported: 3,
          blocked: 0
        }
      },
      liveControlSmoke: { source: "desktop", executed: true, ok: true },
      activeTurnInterruptSmoke: {
        source: "desktop",
        executed: true,
        completed: true,
        interruptObserved: true
      },
      activeTurnSteerSmoke: { source: "desktop", executed: true, ok: true }
    });

    expect(result.state).toBe("ready");
    expect(result.pass).toBe(true);
    expect(result.readiness).toBe(100);
    expect(result.statusLabel).toBe("Ready");
    expect(result.nextAction).toContain("Proceed");
    expect(result.counts).toEqual({
      ready: 5,
      review: 0,
      blocked: 0,
      waiting: 0
    });

    expect(result.items).toHaveLength(5);
    expect(result.items.map((item) => item.id)).toEqual([
      "phase3-exit-gate:slash-execution",
      "phase3-exit-gate:session-controls",
      "phase3-exit-gate:live-control-smoke",
      "phase3-exit-gate:active-turn-interrupt-smoke",
      "phase3-exit-gate:active-turn-steer-smoke"
    ]);
    expect(result.items.every((item) => item.state === "ready")).toBe(true);
    expect(result.items.every((item) => item.nextAction)).toBe(true);
    expect(result.pmTaskLinkCount).toBe(3);
    expect(result.evidenceKeyCount).toBe(5);
    expect(result.items.map((item) => [item.pmTaskId, item.evidenceKey])).toEqual([
      ["phase-03-child-slash-ready", "phase3.slash-execution"],
      ["phase-03-child-control-ready", "phase3.session-controls"],
      ["phase-03-child-smoke-rows", "phase3.live-control-smoke"],
      ["phase-03-child-smoke-rows", "phase3.active-turn-interrupt-smoke"],
      ["phase-03-child-smoke-rows", "phase3.active-turn-steer-smoke"]
    ]);
  });

  it("returns review when desktop proof is incomplete despite good slash/session evidence", () => {
    const result = buildPhase3ExitGateEvidence({
      slashEvidence: {
        state: "ready",
        pass: true,
        readiness: 100,
        status: "Ready",
        detail: "slash command execution live",
        safety: "none",
        executable: true,
        command: "/plan",
        route: "provider"
      },
      sessionControlEvidence: {
        state: "ready",
        readiness: 100,
        pass: true,
        statusLabel: "Ready",
        detail: "session controls observed",
        safety: "none",
        counts: {
          live: 3,
          review: 0,
          unsupported: 3,
          blocked: 0
        }
      },
      liveControlSmoke: { source: "desktop", executed: true, ok: true },
      activeTurnInterruptSmoke: {
        source: "desktop",
        executed: true,
        completed: true,
        interruptObserved: false
      },
      activeTurnSteerSmoke: {
        source: "desktop",
        executed: true,
        ok: false,
        completed: false
      }
    });

    expect(result.state).toBe("review");
    expect(result.pass).toBe(false);
    expect(result.readiness).toBe(65);
    expect(result.counts).toEqual({
      ready: 3,
      review: 2,
      blocked: 0,
      waiting: 0
    });

    expect(result.items[2]).toMatchObject({
      id: "phase3-exit-gate:live-control-smoke",
      label: "Live control smoke",
      state: "ready"
    });
    expect(result.items[3]).toMatchObject({
      id: "phase3-exit-gate:active-turn-interrupt-smoke",
      label: "Active-turn interrupt smoke",
      state: "review",
      detail: expect.stringContaining("needs further desktop evidence")
    });
    expect(result.items[4]).toMatchObject({
      id: "phase3-exit-gate:active-turn-steer-smoke",
      label: "Active-turn steer smoke",
      state: "review",
      detail: expect.stringContaining("needs further desktop evidence")
    });
    expect(result.items[3].nextAction).toBe("Run missing desktop smoke proofs until active-turn controls report completion/readiness.");
  });

  it("returns review when a ready desktop proof is stale", () => {
    const result = buildPhase3ExitGateEvidence({
      evaluatedAt: "2026-06-20T00:00:00.000Z",
      maxProofAgeMs: 24 * 60 * 60 * 1000,
      slashEvidence: {
        state: "ready",
        pass: true,
        readiness: 100,
        status: "Ready",
        detail: "slash command execution live",
        safety: "none"
      },
      sessionControlEvidence: {
        state: "ready",
        readiness: 100,
        pass: true,
        statusLabel: "Ready",
        detail: "session controls observed",
        safety: "none"
      },
      liveControlSmoke: {
        source: "desktop",
        checkedAt: "2026-06-18T00:00:00.000Z",
        executed: true,
        ok: true
      },
      activeTurnInterruptSmoke: {
        source: "desktop",
        checkedAt: "2026-06-19T12:00:00.000Z",
        executed: true,
        completed: true,
        interruptObserved: true
      },
      activeTurnSteerSmoke: {
        source: "desktop",
        checkedAt: "2026-06-19T12:00:00.001Z",
        executed: true,
        ok: true
      }
    });

    expect(result.state).toBe("review");
    expect(result.pass).toBe(false);
    expect(result.items[2]).toMatchObject({
      id: "phase3-exit-gate:live-control-smoke",
      state: "review",
      detail: expect.stringContaining("stale")
    });
  });

  it("returns blocked when any smoke proof is unsupported after execution", () => {
    const result = buildPhase3ExitGateEvidence({
      slashEvidence: {
        state: "ready",
        pass: true,
        readiness: 100,
        status: "Ready",
        detail: "slash command execution live",
        safety: "none"
      },
      sessionControlEvidence: {
        state: "ready",
        readiness: 100,
        pass: true,
        statusLabel: "Ready",
        detail: "session controls observed",
        safety: "none",
        counts: {
          live: 3,
          review: 0,
          unsupported: 3,
          blocked: 0
        }
      },
      liveControlSmoke: null,
      activeTurnInterruptSmoke: {
        source: "desktop",
        executed: true,
        unsupported: true,
        interruptObserved: false,
        completed: true
      },
      activeTurnSteerSmoke: { source: "desktop", executed: true, ok: true }
    });

    expect(result.state).toBe("blocked");
    expect(result.pass).toBe(false);
    expect(result.readiness).toBe(15);
    expect(result.counts).toEqual({
      ready: 3,
      review: 0,
      blocked: 1,
      waiting: 1
    });
    expect(result.items[3]).toMatchObject({
      id: "phase3-exit-gate:active-turn-interrupt-smoke",
      label: "Active-turn interrupt smoke",
      state: "blocked",
      detail: expect.stringContaining("blocked after execution")
    });
    expect(result.nextAction).toBe("Address the blocked control or unsupported-after-execution desktop proof before retrying phase exit.");
  });

  it("keeps blocked slash or session evidence above missing smoke proof", () => {
    const result = buildPhase3ExitGateEvidence({
      slashEvidence: {
        state: "blocked",
        pass: false,
        readiness: 0,
        status: "Blocked",
        detail: "provider route unavailable",
        safety: "none"
      },
      sessionControlEvidence: {
        state: "ready",
        readiness: 100,
        pass: true,
        statusLabel: "Ready",
        detail: "session controls observed",
        safety: "none",
        counts: {
          live: 3,
          review: 0,
          unsupported: 3,
          blocked: 0
        }
      },
      liveControlSmoke: null,
      activeTurnInterruptSmoke: { completed: true },
      activeTurnSteerSmoke: { source: "desktop", executed: true, ok: true }
    });

    expect(result.state).toBe("blocked");
    expect(result.pass).toBe(false);
    expect(result.counts).toEqual({
      ready: 2,
      review: 0,
      blocked: 1,
      waiting: 2
    });

    expect(result.items[0]).toMatchObject({
      id: "phase3-exit-gate:slash-execution",
      label: "Slash execution",
      state: "blocked",
      detail: "Slash execution is blocked."
    });
    expect(result.items[2]).toMatchObject({
      id: "phase3-exit-gate:live-control-smoke",
      label: "Live control smoke",
      state: "waiting",
      detail: expect.stringContaining("has not been executed on desktop")
    });
  });

  it("returns waiting when key evidence is malformed or missing", () => {
    const result = buildPhase3ExitGateEvidence({
      slashEvidence: "not-an-object",
      sessionControlEvidence: {
        state: "ready",
        readiness: 100,
        pass: true,
        statusLabel: "Ready",
        detail: "session controls observed",
        safety: "none",
        counts: {
          live: 3,
          review: 0,
          unsupported: 3,
          blocked: 0
        }
      },
      liveControlSmoke: null,
      activeTurnInterruptSmoke: { completed: true },
      activeTurnSteerSmoke: { source: "desktop", executed: true, ok: true }
    });

    expect(result.state).toBe("waiting");
    expect(result.pass).toBe(false);
    expect(result.readiness).toBe(35);
    expect(result.statusLabel).toBe("Waiting");
    expect(result.items[0]).toMatchObject({
      id: "phase3-exit-gate:slash-execution",
      label: "Slash execution",
      state: "waiting",
      detail: "Slash execution is malformed or missing; provide complete evidence payload."
    });
    expect(result.items[2]).toMatchObject({
      id: "phase3-exit-gate:live-control-smoke",
      label: "Live control smoke",
      state: "waiting",
      detail: expect.stringContaining("has not been executed on desktop")
    });
  });

  it("reports stable counts and does not mutate evidence inputs", () => {
    const slashEvidence = {
      state: "ready",
      pass: true,
      readiness: 100,
      status: "Ready",
      detail: "slash command execution live",
      safety: "none"
    };
    const sessionControlEvidence = {
      state: "ready",
      readiness: 100,
      pass: true,
      statusLabel: "Ready",
      detail: "session controls observed",
      safety: "none",
      counts: {
        live: 3,
        review: 0,
        unsupported: 3,
        blocked: 0
      }
    };
    const liveControlSmoke = { source: "desktop", executed: true, ok: true };
    const activeTurnInterruptSmoke = {
      source: "desktop",
      executed: true,
      completed: true
    };
    const activeTurnSteerSmoke = {
      source: "desktop",
      executed: true,
      ok: false
    };

    const slashEvidenceCopy = JSON.parse(JSON.stringify(slashEvidence));
    const sessionControlEvidenceCopy = JSON.parse(JSON.stringify(sessionControlEvidence));
    const liveControlSmokeCopy = JSON.parse(JSON.stringify(liveControlSmoke));
    const activeTurnInterruptSmokeCopy = JSON.parse(JSON.stringify(activeTurnInterruptSmoke));
    const activeTurnSteerSmokeCopy = JSON.parse(JSON.stringify(activeTurnSteerSmoke));

    const result = buildPhase3ExitGateEvidence({
      slashEvidence,
      sessionControlEvidence,
      liveControlSmoke,
      activeTurnInterruptSmoke,
      activeTurnSteerSmoke
    });

    expect(result.state).toBe("review");
    expect(result.counts).toEqual({
      ready: 3,
      review: 2,
      blocked: 0,
      waiting: 0
    });
    expect(result.items.map((item) => item.id)).toEqual([
      "phase3-exit-gate:slash-execution",
      "phase3-exit-gate:session-controls",
      "phase3-exit-gate:live-control-smoke",
      "phase3-exit-gate:active-turn-interrupt-smoke",
      "phase3-exit-gate:active-turn-steer-smoke"
    ]);
    expect(slashEvidence).toEqual(slashEvidenceCopy);
    expect(sessionControlEvidence).toEqual(sessionControlEvidenceCopy);
    expect(liveControlSmoke).toEqual(liveControlSmokeCopy);
    expect(activeTurnInterruptSmoke).toEqual(activeTurnInterruptSmokeCopy);
    expect(activeTurnSteerSmoke).toEqual(activeTurnSteerSmokeCopy);
  });

  it("returns review diagnostics and item details for mixed evidence states", () => {
    const result = buildPhase3ExitGateEvidence({
      slashEvidence: {
        state: "ready",
        pass: true,
        readiness: 100,
        status: "Ready",
        detail: "slash command execution live",
        safety: "none",
        executable: true
      },
      sessionControlEvidence: {
        state: "ready",
        readiness: 100,
        pass: true,
        statusLabel: "Ready",
        detail: "session controls observed",
        safety: "none",
        counts: {
          live: 3,
          review: 0,
          unsupported: 3,
          blocked: 0
        }
      },
      liveControlSmoke: { source: "desktop", executed: true, ok: false },
      activeTurnInterruptSmoke: {},
      activeTurnSteerSmoke: { source: "desktop", executed: true, ok: true }
    });

    expect(result.state).toBe("waiting");
    expect(result.items[2].state).toBe("review");
    expect(result.items[2].detail).toContain("needs further desktop evidence");
    expect(result.items[2].nextAction).toContain("Run missing desktop smoke proofs");
    expect(result.items[3].state).toBe("waiting");
  });
});
