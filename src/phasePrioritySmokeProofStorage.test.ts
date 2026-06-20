import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getFallbackPhasePrioritySmokeProofBundle,
  loadPhasePrioritySmokeProofBundle,
  parseStoredPhasePrioritySmokeProofBundle,
  PHASE_PRIORITY_SMOKE_PROOF_STORAGE_KEY,
  savePhasePrioritySmokeProofBundle
} from "./phasePrioritySmokeProofStorage";

const fallbackBundle = getFallbackPhasePrioritySmokeProofBundle();

const desktopLiveSmoke = {
  source: "desktop",
  checkedAt: "2026-06-10T00:00:00.000Z",
  executed: true,
  ok: true,
  detail: "Live smoke passed.",
  threadIdSeen: true,
  turnIdSeen: true,
  agentDeltaMethodSeen: true,
  turnCompletedSeen: true,
  failedSeen: false,
  expectedTokenSeen: true,
  methodCount: 4,
  uniqueMethods: ["thread/start", "turn/start", "item/agentMessage/delta", "turn/completed"]
};

const desktopTwoPanelSmoke = {
  source: "desktop",
  checkedAt: "1781107200",
  executed: true,
  ok: true,
  detail: "Two-panel smoke passed.",
  panelCount: 2,
  distinctSessionIds: true,
  distinctThreadIds: true,
  bothCompleted: true,
  crossTalkDetected: false,
  panels: [
    {
      panelId: "phase-2-a",
      sessionId: "session-a",
      threadId: "thread-a",
      sessionIdSeen: true,
      threadIdSeen: true,
      completed: true,
      failed: false,
      expectedTokenSeen: true,
      foreignTokenSeen: false,
      eventCount: 8,
      transcriptLength: 2,
      detail: "Panel A complete."
    },
    {
      panelId: "phase-2-b",
      sessionId: "session-b",
      threadId: "thread-b",
      sessionIdSeen: true,
      threadIdSeen: true,
      completed: true,
      failed: false,
      expectedTokenSeen: true,
      foreignTokenSeen: false,
      eventCount: 8,
      transcriptLength: 2,
      detail: "Panel B complete."
    }
  ]
};

describe("phase priority smoke proof storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads safe fallback proofs without a browser window", () => {
    vi.stubGlobal("window", undefined);

    expect(loadPhasePrioritySmokeProofBundle()).toEqual(fallbackBundle);
  });

  it("falls back on malformed stored JSON", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => "{")
      }
    });

    expect(loadPhasePrioritySmokeProofBundle()).toEqual(fallbackBundle);
  });

  it("normalizes stored desktop proofs", () => {
    const parsed = parseStoredPhasePrioritySmokeProofBundle(
      JSON.stringify({
        liveSmoke: {
          ...desktopLiveSmoke,
          checkedAt: "1781107200",
          methodCount: "4",
          uniqueMethods: ["thread/start", 42]
        },
        twoPanelSmoke: {
          ...desktopTwoPanelSmoke,
          panelCount: "2",
          panels: [
            desktopTwoPanelSmoke.panels[0],
            { panelId: "", completed: true },
            { detail: "missing panel id" }
          ]
        }
      })
    );

    expect(parsed.liveSmoke).toEqual({
      ...desktopLiveSmoke,
      checkedAt: "2026-06-10T16:00:00.000Z",
      methodCount: 0,
      uniqueMethods: ["thread/start"]
    });
    expect(parsed.twoPanelSmoke).toEqual({
      ...desktopTwoPanelSmoke,
      checkedAt: "2026-06-10T16:00:00.000Z",
      panelCount: 0,
      panels: [desktopTwoPanelSmoke.panels[0]]
    });
  });

  it("falls back for desktop-executed stored proofs without reload-safe timestamps", () => {
    const parsed = parseStoredPhasePrioritySmokeProofBundle(
      JSON.stringify({
        liveSmoke: {
          ...desktopLiveSmoke,
          checkedAt: ""
        },
        twoPanelSmoke: {
          ...desktopTwoPanelSmoke,
          checkedAt: "not-a-date"
        }
      })
    );

    expect(parsed).toEqual(fallbackBundle);
  });

  it("does not persist browser fallback or non-executed proofs", () => {
    const setItem = vi.fn();
    vi.stubGlobal("window", {
      localStorage: {
        setItem,
        getItem: vi.fn(() => null)
      }
    });

    savePhasePrioritySmokeProofBundle({
      liveSmoke: { source: "browser", executed: false, ok: false },
      twoPanelSmoke: { source: "desktop", executed: false, ok: false }
    });

    expect(setItem).not.toHaveBeenCalled();
  });

  it("does not persist desktop-executed proofs without reload-safe timestamps", () => {
    const setItem = vi.fn();
    vi.stubGlobal("window", {
      localStorage: {
        setItem,
        getItem: vi.fn(() => null)
      }
    });

    savePhasePrioritySmokeProofBundle({
      liveSmoke: { ...desktopLiveSmoke, checkedAt: null },
      twoPanelSmoke: { ...desktopTwoPanelSmoke, checkedAt: "" }
    });

    expect(setItem).not.toHaveBeenCalled();
  });

  it("persists and loads a desktop-executed proof bundle roundtrip", () => {
    const store: { value: string | null } = { value: null };
    const setItem = vi.fn((_key: string, value: string) => {
      store.value = value;
    });

    vi.stubGlobal("window", {
      localStorage: {
        setItem,
        getItem: vi.fn(() => store.value)
      }
    });

    savePhasePrioritySmokeProofBundle({
      liveSmoke: desktopLiveSmoke,
      twoPanelSmoke: desktopTwoPanelSmoke
    });

    const expectedBundle = {
      liveSmoke: desktopLiveSmoke,
      twoPanelSmoke: {
        ...desktopTwoPanelSmoke,
        checkedAt: "2026-06-10T16:00:00.000Z"
      }
    };

    expect(setItem).toHaveBeenCalledWith(
      PHASE_PRIORITY_SMOKE_PROOF_STORAGE_KEY,
      JSON.stringify(expectedBundle)
    );
    expect(loadPhasePrioritySmokeProofBundle()).toEqual(expectedBundle);
  });

  it("no-ops when localStorage read or write throws", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => {
          throw new Error("read failed");
        }),
        setItem: vi.fn(() => {
          throw new Error("write failed");
        })
      }
    });

    expect(loadPhasePrioritySmokeProofBundle()).toEqual(fallbackBundle);
    expect(() =>
      savePhasePrioritySmokeProofBundle({
        liveSmoke: desktopLiveSmoke,
        twoPanelSmoke: desktopTwoPanelSmoke
      })
    ).not.toThrow();
  });
});
