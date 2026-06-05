import { describe, expect, it } from "vitest";
import { buildCodexSessionControls } from "./codexSessionControls";

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
});
