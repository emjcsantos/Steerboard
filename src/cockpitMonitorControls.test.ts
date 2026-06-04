import { describe, expect, it } from "vitest";
import type { RuntimeStreamPlaybackState } from "./runtimeStream";
import { buildCockpitMonitorControlState } from "./cockpitMonitorControls";

function controlsFor(args: {
  hasRun: boolean;
  eventCount: number;
  canStream: boolean;
  streamState: RuntimeStreamPlaybackState;
  cursor: number;
  canAttachSource?: boolean;
  isSourceAttached?: boolean;
}) {
  return buildCockpitMonitorControlState({
    canAttachSource: true,
    isSourceAttached: true,
    ...args
  });
}

describe("cockpit monitor control state", () => {
  it("allows start only when all start preconditions are met", () => {
    const enabled = controlsFor({
      hasRun: true,
      eventCount: 4,
      canStream: true,
      streamState: "idle",
      cursor: 0
    });

    expect(enabled).toEqual({
      canStart: true,
      canPause: false,
      canReset: false,
      canAttach: false,
      startReason: "Start local stream preview.",
      attachReason: "Local event source is already attached.",
      pauseReason: "Stream is not running.",
      resetReason: "Nothing to reset."
    });
  });

  it("blocks start when no run is selected", () => {
    expect(
      controlsFor({
        hasRun: false,
        eventCount: 3,
        canStream: true,
        streamState: "idle",
        cursor: 0
      })
    ).toMatchObject({
      canStart: false,
      startReason: "Select or stage a run first."
    });
  });

  it("blocks start when no queued events are available", () => {
    expect(
      controlsFor({
        hasRun: true,
        eventCount: 0,
        canStream: true,
        streamState: "idle",
        cursor: 0
      })
    ).toMatchObject({
      canStart: false,
      startReason: "No local stream events are queued."
    });
  });

  it("blocks start when local stream source is not attached for streaming", () => {
    expect(
      controlsFor({
        hasRun: true,
        eventCount: 4,
        canStream: true,
        streamState: "idle",
        cursor: 0,
        isSourceAttached: false
      })
    ).toMatchObject({
      canStart: false,
      canAttach: true,
      startReason: "Attach an allowed local event source first.",
      attachReason: "Attach local event source preview."
    });
  });

  it("blocks start when stream is already running", () => {
    expect(
      controlsFor({
        hasRun: true,
        eventCount: 4,
        canStream: true,
        streamState: "streaming",
        cursor: 1
      })
    ).toMatchObject({
      canStart: false,
      startReason: "Stream is already running.",
      canPause: true
    });
  });

  it("blocks start when stream is complete", () => {
    expect(
      controlsFor({
        hasRun: true,
        eventCount: 4,
        canStream: true,
        streamState: "complete",
        cursor: 4
      })
    ).toMatchObject({
      canStart: false,
      startReason: "Stream is complete; reset to replay."
    });
  });

  it("blocks start when stream is blocked", () => {
    expect(
      controlsFor({
        hasRun: true,
        eventCount: 4,
        canStream: true,
        streamState: "blocked",
        cursor: 2
      })
    ).toMatchObject({
      canStart: false,
      startReason: "Stream is blocked by local adapter review."
    });
  });

  it("allows attach when run is selected, events are queued, and source can be attached", () => {
    expect(
      controlsFor({
        hasRun: true,
        eventCount: 4,
        canStream: true,
        streamState: "idle",
        cursor: 0,
        isSourceAttached: false,
        canAttachSource: true
      })
    ).toMatchObject({
      canAttach: true,
      canStart: false,
      startReason: "Attach an allowed local event source first.",
      attachReason: "Attach local event source preview."
    });
  });

  it("blocks attach when stream is blocked", () => {
    expect(
      controlsFor({
        hasRun: true,
        eventCount: 4,
        canStream: true,
        streamState: "blocked",
        cursor: 0,
        isSourceAttached: false,
        canAttachSource: true
      })
    ).toMatchObject({
      canAttach: false,
      canStart: false,
      startReason: "Stream is blocked by local adapter review.",
      attachReason: "Stream is blocked by local adapter review."
    });
  });

  it("blocks attach when source is already attached", () => {
    expect(
      controlsFor({
        hasRun: true,
        eventCount: 4,
        canStream: true,
        streamState: "idle",
        cursor: 0,
        isSourceAttached: true
      })
    ).toMatchObject({
      canAttach: false,
      attachReason: "Local event source is already attached."
    });
  });

  it("allows pause only when stream is running", () => {
    const enabled = controlsFor({
      hasRun: true,
      eventCount: 5,
      canStream: true,
      streamState: "streaming",
      cursor: 1
    });
    const disabled = controlsFor({
      hasRun: true,
      eventCount: 5,
      canStream: true,
      streamState: "paused",
      cursor: 1
    });

    expect(enabled.canPause).toBe(true);
    expect(enabled.pauseReason).toBe("Pause local stream preview.");
    expect(disabled.canPause).toBe(false);
    expect(disabled.pauseReason).toBe("Stream is not running.");
  });

  it("allows reset when cursor is positive", () => {
    expect(
      controlsFor({
        hasRun: true,
        eventCount: 5,
        canStream: true,
        streamState: "paused",
        cursor: 3
      })
    ).toMatchObject({
      canReset: true,
      resetReason: "Reset local stream preview."
    });
  });

  it("allows reset when stream is not idle even with zero cursor", () => {
    expect(
      controlsFor({
        hasRun: true,
        eventCount: 5,
        canStream: true,
        streamState: "streaming",
        cursor: 0
      })
    ).toMatchObject({
      canReset: true,
      resetReason: "Reset local stream preview."
    });
  });

  it("marks reset unavailable when nothing can be reset", () => {
    expect(
      controlsFor({
        hasRun: true,
        eventCount: 0,
        canStream: true,
        streamState: "idle",
        cursor: 0
      })
    ).toMatchObject({
      canReset: false,
      resetReason: "Nothing to reset."
    });
  });

  it("normalizes eventCount and cursor before computing control flags", () => {
    const normalized = controlsFor({
      hasRun: true,
      eventCount: -1.9,
      canStream: true,
      streamState: "paused",
      cursor: 2.9
    });
    const normalizedNoRun = controlsFor({
      hasRun: true,
      eventCount: 1.2,
      canStream: true,
      streamState: "idle",
      cursor: -2.8
    });
    const nonFinite = controlsFor({
      hasRun: true,
      eventCount: Number.NaN,
      canStream: true,
      streamState: "idle",
      cursor: Infinity
    });

    expect(normalized.canReset).toBe(true);
    expect(normalized.canStart).toBe(false);
    expect(normalizedNoRun.canReset).toBe(false);
    expect(nonFinite.canStart).toBe(false);
  });

  it("does not mutate arguments", () => {
    const args = {
      hasRun: true,
      eventCount: 3,
      canStream: true,
      streamState: "streaming" as RuntimeStreamPlaybackState,
      canAttachSource: true,
      isSourceAttached: true,
      cursor: 1
    };

    const argsCopy = structuredClone(args);
    controlsFor(args);
    expect(args).toEqual(argsCopy);
  });

  it("returns public-safe reasons with no path-like output", () => {
    const states: Array<RuntimeStreamPlaybackState> = ["idle", "streaming", "paused", "complete", "blocked"];
    const results = states.map((streamState, index) =>
      controlsFor({
        hasRun: true,
        eventCount: 1,
        canStream: true,
        streamState,
        isSourceAttached: false,
        cursor: index
      })
    );

    for (const result of results) {
      expect(result.startReason).not.toMatch(/[\\/]/);
      expect(result.pauseReason).not.toMatch(/[\\/]/);
      expect(result.resetReason).not.toMatch(/[\\/]/);
      expect(result.attachReason).not.toMatch(/[\\/]/);
    }
  });
});
