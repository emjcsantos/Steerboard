import { describe, expect, it } from "vitest";
import type { CockpitMonitorHealth } from "./cockpitMonitorHealth";
import type { CockpitMonitorSummary } from "./cockpitMonitorSummary";
import { createCockpitMonitorAttention } from "./cockpitMonitorAttention";

function buildSummary(overrides: Partial<CockpitMonitorSummary> = {}): CockpitMonitorSummary {
  return {
    runLabel: "Monitor run",
    runState: "running",
    timelineTotal: 2,
    activeCount: 1,
    issueCount: 0,
    completeCount: 1,
    streamLabel: "Streaming",
    streamState: "streaming",
    streamProgressLabel: "1/2 emitted",
    streamProgressPercent: 50,
    streamProgressValue: "50%",
    pendingCount: 1,
    blockedCount: 0,
    latestEventLabel: "Latest run event",
    latestEventStatus: "accepted",
    latestEventDetail: "Local event detail",
    detail: "Run active. Active: 1, issues: 0, complete: 1, pending events: 1, blocked events: 0.",
    ...overrides
  };
}

function buildHealth(tone: CockpitMonitorHealth["tone"]): CockpitMonitorHealth {
  return {
    stateLabel: "N/A",
    detail: "N/A",
    tone,
    pulseLabel: "1/2"
  };
}

describe("createCockpitMonitorAttention", () => {
  it("returns blocked signal when summary has blocked events", () => {
    const summary = buildSummary({ blockedCount: 1 });
    const health = buildHealth("live");

    expect(createCockpitMonitorAttention(summary, health)).toEqual({
      label: "Needs review",
      detail: "Blocked or issue events need operator review.",
      tone: "blocked",
      actionLabel: "Review"
    });
  });

  it("returns blocked signal when summary has issue events", () => {
    const summary = buildSummary({ issueCount: 1 });
    const health = buildHealth("complete");

    expect(createCockpitMonitorAttention(summary, health)).toEqual({
      label: "Needs review",
      detail: "Blocked or issue events need operator review.",
      tone: "blocked",
      actionLabel: "Review"
    });
  });

  it("uses blocked tone from health as fallback when no summary issues", () => {
    const summary = buildSummary();
    const health = buildHealth("blocked");

    expect(createCockpitMonitorAttention(summary, health)).toEqual({
      label: "Needs review",
      detail: "Blocked or issue events need operator review.",
      tone: "blocked",
      actionLabel: "Review"
    });
  });

  it("returns waiting signal when stream is waiting", () => {
    const summary = buildSummary();
    const health = buildHealth("waiting");

    expect(createCockpitMonitorAttention(summary, health)).toEqual({
      label: "No run selected",
      detail: "Select or stage a run to begin monitoring.",
      tone: "waiting",
      actionLabel: "Select"
    });
  });

  it("returns ready signal when stream is ready", () => {
    const summary = buildSummary();
    const health = buildHealth("ready");

    expect(createCockpitMonitorAttention(summary, health)).toEqual({
      label: "Ready to stream",
      detail: "Attach and start the local event stream.",
      tone: "ready",
      actionLabel: "Start"
    });
  });

  it("returns live signal when stream is live", () => {
    const summary = buildSummary();
    const health = buildHealth("live");

    expect(createCockpitMonitorAttention(summary, health)).toEqual({
      label: "Watching live",
      detail: "Local events are streaming into the cockpit.",
      tone: "live",
      actionLabel: "Watch"
    });
  });

  it("returns paused signal when stream is paused", () => {
    const summary = buildSummary();
    const health = buildHealth("paused");

    expect(createCockpitMonitorAttention(summary, health)).toEqual({
      label: "Stream paused",
      detail: "Resume when you are ready to continue.",
      tone: "paused",
      actionLabel: "Resume"
    });
  });

  it("returns complete signal when stream is complete", () => {
    const summary = buildSummary();
    const health = buildHealth("complete");

    expect(createCockpitMonitorAttention(summary, health)).toEqual({
      label: "All clear",
      detail: "All queued local events have been emitted.",
      tone: "complete",
      actionLabel: "Done"
    });
  });

  it("falls back to waiting for unexpected tone inputs", () => {
    const summary = buildSummary();
    const health = {
      ...buildHealth("live"),
      tone: "invalid"
    } as unknown as CockpitMonitorHealth;

    expect(createCockpitMonitorAttention(summary, health)).toEqual({
      label: "No run selected",
      detail: "Select or stage a run to begin monitoring.",
      tone: "waiting",
      actionLabel: "Select"
    });
  });

  it("preserves blocked priority over complete by summary issue count", () => {
    const summary = buildSummary({ issueCount: 1 });
    const health = buildHealth("complete");

    expect(createCockpitMonitorAttention(summary, health).tone).toBe("blocked");
    expect(createCockpitMonitorAttention(summary, health).label).toBe("Needs review");
    expect(createCockpitMonitorAttention(summary, health).actionLabel).toBe("Review");
  });
});
