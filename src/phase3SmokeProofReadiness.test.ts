import { describe, expect, it } from "vitest";
import { buildPhase3SmokeProofReadiness } from "./phase3SmokeProofReadiness";

const persistedDesktopProofs = {
  liveControlSmoke: true,
  activeTurnInterruptSmoke: true,
  activeTurnSteerSmoke: true
};

describe("phase 3 smoke proof readiness", () => {
  it("returns ready when all desktop proofs are successful", () => {
    const result = buildPhase3SmokeProofReadiness({
      evaluatedAt: "2026-06-06T00:01:00.000Z",
      persistedDesktopProofs,
      liveControlSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.000Z",
        executed: true,
        ok: true,
        completed: true,
        supportedMethodCount: 3,
        totalMethodCount: 3
      },
      activeTurnInterruptSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.001Z",
        executed: true,
        completed: true,
        interruptObserved: true
      },
      activeTurnSteerSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.002Z",
        executed: true,
        completed: true,
        steerObserved: true
      }
    });

    expect(result.state).toBe("ready");
    expect(result.readiness).toBe(100);
    expect(result.counts).toEqual({
      ready: 3,
      review: 0,
      blocked: 0,
      waiting: 0
    });
    expect(result.items.map((item) => item.state)).toEqual(["ready", "ready", "ready"]);
    expect(result.items.every((item) => item.source === "desktop")).toBe(true);
    expect(result.items.every((item) => item.persisted)).toBe(true);
    expect(result.evaluatedAt).toBe("2026-06-06T00:01:00.000Z");
    expect(result.maxProofAgeMs).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("returns waiting for browser fallback or non-executed proofs", () => {
    const result = buildPhase3SmokeProofReadiness({
      evaluatedAt: "2026-06-06T00:01:00.000Z",
      persistedDesktopProofs: {
        liveControlSmoke: false,
        activeTurnInterruptSmoke: true,
        activeTurnSteerSmoke: false
      },
      liveControlSmoke: {
        source: "browser",
        checkedAt: "2026-06-06T00:00:00.000Z",
        executed: false,
        unsupported: true
      },
      activeTurnInterruptSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.001Z",
        executed: true,
        completed: true,
        interruptObserved: true
      },
      activeTurnSteerSmoke: {
        source: "browser",
        checkedAt: "2026-06-06T00:00:00.002Z",
        executed: false,
        unsupported: true
      }
    });

    expect(result.state).toBe("waiting");
    expect(result.readiness).toBe(35);
    expect(result.counts).toEqual({
      ready: 1,
      review: 0,
      blocked: 0,
      waiting: 2
    });
    expect(result.items[0].state).toBe("waiting");
    expect(result.items[2].state).toBe("waiting");
  });

  it("returns review for partial executed proofs", () => {
    const result = buildPhase3SmokeProofReadiness({
      evaluatedAt: "2026-06-06T00:01:00.000Z",
      persistedDesktopProofs,
      liveControlSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.000Z",
        executed: true,
        completed: true,
        supportedMethodCount: 1,
        totalMethodCount: 3
      },
      activeTurnInterruptSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.001Z",
        executed: true,
        completed: true,
        interruptObserved: false
      },
      activeTurnSteerSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.002Z",
        executed: true,
        completed: true,
        steerObserved: false
      }
    });

    expect(result.state).toBe("review");
    expect(result.readiness).toBe(65);
    expect(result.counts).toEqual({
      ready: 0,
      review: 3,
      blocked: 0,
      waiting: 0
    });
    expect(result.items.every((item) => item.detail.includes("needs further desktop evidence"))).toBe(true);
  });

  it("returns review when a previously ready desktop proof is stale", () => {
    const result = buildPhase3SmokeProofReadiness({
      evaluatedAt: "2026-06-20T00:00:00.000Z",
      maxProofAgeMs: 24 * 60 * 60 * 1000,
      persistedDesktopProofs,
      liveControlSmoke: {
        source: "desktop",
        checkedAt: "2026-06-18T00:00:00.000Z",
        executed: true,
        ok: true,
        completed: true,
        supportedMethodCount: 3,
        totalMethodCount: 3
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
        completed: true,
        steerObserved: true
      }
    });

    expect(result.state).toBe("review");
    expect(result.counts).toEqual({
      ready: 2,
      review: 1,
      blocked: 0,
      waiting: 0
    });
    expect(result.items[0]).toMatchObject({
      proof: "live-control",
      state: "review",
      detail: expect.stringContaining("stale")
    });
    expect(result.items[0].detail).toContain("rerun");
    expect(result.evaluatedAt).toBe("2026-06-20T00:00:00.000Z");
    expect(result.maxProofAgeMs).toBe(24 * 60 * 60 * 1000);
  });

  it("returns review when a ready desktop proof is dated after the current evaluation", () => {
    const result = buildPhase3SmokeProofReadiness({
      evaluatedAt: "2026-06-06T00:01:00.000Z",
      persistedDesktopProofs,
      liveControlSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:02:00.000Z",
        executed: true,
        ok: true,
        completed: true,
        supportedMethodCount: 3,
        totalMethodCount: 3
      },
      activeTurnInterruptSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.001Z",
        executed: true,
        completed: true,
        interruptObserved: true
      },
      activeTurnSteerSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.002Z",
        executed: true,
        completed: true,
        steerObserved: true
      }
    });

    expect(result.state).toBe("review");
    expect(result.counts).toEqual({
      ready: 2,
      review: 1,
      blocked: 0,
      waiting: 0
    });
    expect(result.items[0]).toMatchObject({
      proof: "live-control",
      state: "review",
      detail: expect.stringContaining("dated after the current evaluation timestamp")
    });
    expect(result.evaluatedAt).toBe("2026-06-06T00:01:00.000Z");
  });

  it("returns review when ready desktop proofs cannot be freshness-checked", () => {
    const result = buildPhase3SmokeProofReadiness({
      persistedDesktopProofs,
      liveControlSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.000Z",
        executed: true,
        ok: true,
        completed: true,
        supportedMethodCount: 3,
        totalMethodCount: 3
      },
      activeTurnInterruptSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.001Z",
        executed: true,
        completed: true,
        interruptObserved: true
      },
      activeTurnSteerSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.002Z",
        executed: true,
        completed: true,
        steerObserved: true
      }
    });

    expect(result.state).toBe("review");
    expect(result.counts).toEqual({
      ready: 0,
      review: 3,
      blocked: 0,
      waiting: 0
    });
    expect(result.items.every((item) => item.detail.includes("freshness-checked"))).toBe(true);
    expect(result.evaluatedAt).toBe("unavailable");
    expect(result.maxProofAgeMs).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("returns review when otherwise ready desktop proofs are not storage-attested", () => {
    const result = buildPhase3SmokeProofReadiness({
      evaluatedAt: "2026-06-06T00:01:00.000Z",
      liveControlSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.000Z",
        executed: true,
        ok: true,
        completed: true,
        supportedMethodCount: 3,
        totalMethodCount: 3
      },
      activeTurnInterruptSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.001Z",
        executed: true,
        completed: true,
        interruptObserved: true
      },
      activeTurnSteerSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.002Z",
        executed: true,
        completed: true,
        steerObserved: true
      }
    });

    expect(result.state).toBe("review");
    expect(result.readiness).toBe(65);
    expect(result.counts).toEqual({
      ready: 0,
      review: 3,
      blocked: 0,
      waiting: 0
    });
    expect(result.items.every((item) => item.persisted === false)).toBe(true);
    expect(result.items.every((item) => item.detail.includes("persisted/imported"))).toBe(true);
  });

  it("returns review when only one otherwise ready desktop proof is not storage-attested", () => {
    const result = buildPhase3SmokeProofReadiness({
      evaluatedAt: "2026-06-06T00:01:00.000Z",
      persistedDesktopProofs: {
        liveControlSmoke: true,
        activeTurnInterruptSmoke: false,
        activeTurnSteerSmoke: true
      },
      liveControlSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.000Z",
        executed: true,
        ok: true,
        completed: true,
        supportedMethodCount: 3,
        totalMethodCount: 3
      },
      activeTurnInterruptSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.001Z",
        executed: true,
        completed: true,
        interruptObserved: true
      },
      activeTurnSteerSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.002Z",
        executed: true,
        completed: true,
        steerObserved: true
      }
    });

    expect(result.state).toBe("review");
    expect(result.counts).toEqual({
      ready: 2,
      review: 1,
      blocked: 0,
      waiting: 0
    });
    expect(result.items[1]).toMatchObject({
      proof: "active-turn-interrupt",
      state: "review",
      persisted: false,
      detail: expect.stringContaining("persisted/imported")
    });
  });

  it("returns blocked when executed proof is unsupported-after-execution", () => {
    const result = buildPhase3SmokeProofReadiness({
      evaluatedAt: "2026-06-06T00:01:00.000Z",
      persistedDesktopProofs,
      liveControlSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.000Z",
        executed: false,
        unsupported: false,
        ok: true,
        state: "ready"
      },
      activeTurnInterruptSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.001Z",
        executed: true,
        unsupported: true,
        completed: true,
        interruptObserved: true
      },
      activeTurnSteerSmoke: {
        source: "desktop",
        checkedAt: "2026-06-06T00:00:00.002Z",
        executed: true,
        ok: true,
        completed: true,
        steerObserved: true
      }
    });

    expect(result.state).toBe("blocked");
    expect(result.readiness).toBe(15);
    expect(result.counts).toEqual({
      ready: 1,
      review: 0,
      blocked: 1,
      waiting: 1
    });
    expect(result.items[0].state).toBe("waiting");
    expect(result.items[1].state).toBe("blocked");
    expect(result.items[1].source).toBe("desktop");
  });

  it("returns waiting for malformed proof payloads", () => {
    const result = buildPhase3SmokeProofReadiness({
      liveControlSmoke: "malformed",
      activeTurnInterruptSmoke: null,
      activeTurnSteerSmoke: undefined
    });

    expect(result.state).toBe("waiting");
    expect(result.readiness).toBe(35);
    expect(result.counts).toEqual({
      ready: 0,
      review: 0,
      blocked: 0,
      waiting: 3
    });
    expect(result.items.every((item) => item.source === "unknown")).toBe(true);
    expect(result.items.every((item) => item.checkedAt === "unavailable")).toBe(true);
  });

  it("is immutable and does not mutate proof inputs", () => {
    const liveControlSmoke = {
      source: "desktop",
      checkedAt: "2026-06-06T00:00:00.000Z",
      executed: true,
      completed: true,
      supportedMethodCount: 1,
      totalMethodCount: 1
    };
    const activeTurnInterruptSmoke = {
      source: "desktop",
      checkedAt: "2026-06-06T00:00:00.001Z",
      executed: true,
      completed: true,
      interruptObserved: true
    };
    const activeTurnSteerSmoke = {
      source: "desktop",
      checkedAt: "2026-06-06T00:00:00.002Z",
      executed: true,
      completed: false
    };

    const liveControlSmokeCopy = JSON.parse(JSON.stringify(liveControlSmoke));
    const activeTurnInterruptSmokeCopy = JSON.parse(JSON.stringify(activeTurnInterruptSmoke));
    const activeTurnSteerSmokeCopy = JSON.parse(JSON.stringify(activeTurnSteerSmoke));

    const result = buildPhase3SmokeProofReadiness({
      evaluatedAt: "2026-06-06T00:01:00.000Z",
      persistedDesktopProofs,
      liveControlSmoke,
      activeTurnInterruptSmoke,
      activeTurnSteerSmoke
    });

    expect(result.state).toBe("review");
    expect(liveControlSmoke).toEqual(liveControlSmokeCopy);
    expect(activeTurnInterruptSmoke).toEqual(activeTurnInterruptSmokeCopy);
    expect(activeTurnSteerSmoke).toEqual(activeTurnSteerSmokeCopy);
  });
});
