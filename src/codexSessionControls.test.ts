import { describe, expect, it } from "vitest";
import {
  buildCodexSessionControls,
  summarizeUnsupportedSessionControls
} from "./codexSessionControls";

describe("codex session controls", () => {
  it("returns live interrupt on starting and live steer on running with steer draft", () => {
    const controls = buildCodexSessionControls({
      sessionStatus: "running",
      liveTransportAvailable: true,
      activeTurn: { status: "streaming" },
      lastUserPrompt: "Last prompt",
      draftText: "steer this response"
    });

    expect(controls.interrupt).toEqual({
      state: "live",
      reason: "Interrupt the active live turn."
    });
    expect(controls.steer).toEqual({
      state: "live",
      reason: "Steer the running turn with your draft text."
    });
    expect(controls.retry.state).toBe("disabled");
    expect(controls.retry.reason).toBe("Wait until the current turn finishes before retry.");
  });

  it("returns interrupt live during start and steer disabled while starting", () => {
    const controls = buildCodexSessionControls({
      sessionStatus: "starting",
      liveTransportAvailable: true,
      activeTurn: { status: "starting" },
      lastUserPrompt: "Last prompt",
      draftText: "steer text"
    });

    expect(controls.interrupt).toEqual({
      state: "live",
      reason: "Interrupt the active live turn."
    });
    expect(controls.steer).toEqual({
      state: "disabled",
      reason: "A live turn must be running before steering."
    });
  });

  it("returns retry as live when a last user prompt exists and session is idle", () => {
    const controls = buildCodexSessionControls({
      sessionStatus: "idle",
      liveTransportAvailable: true,
      lastUserPrompt: "Need to retry this.",
      draftText: ""
    });

    expect(controls.retry).toEqual({
      state: "live",
      reason: "Retry the last user prompt."
    });
  });

  it("returns preview/unavailable states when live transport is not available", () => {
    const controls = buildCodexSessionControls({
      sessionStatus: "idle",
      liveTransportAvailable: false,
      activeTurn: { status: "streaming" },
      lastUserPrompt: "Previous message",
      draftText: "Steer now"
    });

    expect(controls.interrupt.state).toBe("unavailable");
    expect(controls.interrupt.reason).toBe("Live transport is not available in preview mode.");
    expect(controls.steer.state).toBe("unavailable");
    expect(controls.retry.state).toBe("unavailable");
  });

  it("returns disabled states for unmet prerequisites", () => {
    const controls = buildCodexSessionControls({
      sessionStatus: "completed",
      liveTransportAvailable: true,
      activeTurn: null,
      draftText: ""
    });

    expect(controls.steer).toEqual({
      state: "disabled",
      reason: "A live turn must be running before steering."
    });
    expect(controls.retry).toEqual({
      state: "disabled",
      reason: "No previous user prompt is available to retry."
    });
  });

  it("marks fork, resume, and archive as unsupported for the first app-server adapter", () => {
    const controls = buildCodexSessionControls({
      sessionStatus: "idle",
      liveTransportAvailable: true,
      lastUserPrompt: "Previous",
      draftText: "Steer"
    });

    expect(controls.fork).toEqual({
      state: "unsupported",
      reason: "Fork is unsupported in the first Codex app-server adapter."
    });
    expect(controls.resume).toEqual({
      state: "unsupported",
      reason: "Resume is unsupported in the first Codex app-server adapter."
    });
    expect(controls.archive).toEqual({
      state: "unsupported",
      reason: "Archive is unsupported in the first Codex app-server adapter."
    });
  });

  it("summarizes unsupported controls with fork, resume, and archive evidence", () => {
    const controls = buildCodexSessionControls({
      sessionStatus: "running",
      liveTransportAvailable: true,
      activeTurn: { status: "streaming" },
      lastUserPrompt: "Previous",
      draftText: "steer"
    });
    const summary = summarizeUnsupportedSessionControls(controls);

    expect(summary).toEqual({
      count: 3,
      label: "3 unsupported controls",
      detail:
        "3 unsupported controls: Fork: Fork is unsupported in the first Codex app-server adapter. | Resume: Resume is unsupported in the first Codex app-server adapter. | Archive: Archive is unsupported in the first Codex app-server adapter."
    });
  });

  it("returns a safe zero state when no unsupported controls exist", () => {
    const baselineControls = buildCodexSessionControls({
      sessionStatus: "running",
      liveTransportAvailable: true,
      activeTurn: { status: "streaming" },
      lastUserPrompt: "Previous",
      draftText: "steer"
    });

    const controls = {
      ...baselineControls,
      fork: { ...baselineControls.fork, state: "disabled" as const, reason: "Fork is currently enabled." },
      resume: { ...baselineControls.resume, state: "disabled" as const, reason: "Resume is currently enabled." },
      archive: { ...baselineControls.archive, state: "disabled" as const, reason: "Archive is currently enabled." }
    };
    const summary = summarizeUnsupportedSessionControls(controls);

    expect(summary).toEqual({
      count: 0,
      label: "No unsupported controls",
      detail: "No unsupported controls are currently available."
    });
  });
});
