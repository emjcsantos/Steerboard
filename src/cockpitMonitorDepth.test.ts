import { describe, expect, it } from "vitest";
import type { CockpitMonitorSummary } from "./cockpitMonitorSummary";
import type { CockpitMonitorQuality } from "./cockpitMonitorQuality";
import type { CockpitMonitorLoop } from "./cockpitMonitorLoop";
import type { CockpitMonitorEventFeedItem } from "./cockpitMonitorEventFeed";
import { createCockpitMonitorDepth } from "./cockpitMonitorDepth";

function buildSummary(overrides: Partial<CockpitMonitorSummary> = {}): CockpitMonitorSummary {
  return {
    runLabel: "Monitor run",
    runState: "ready",
    timelineTotal: 0,
    activeCount: 0,
    issueCount: 0,
    completeCount: 0,
    streamLabel: "Idle",
    streamState: "idle",
    streamProgressLabel: "0/0 emitted",
    streamProgressPercent: 0,
    streamProgressValue: "0%",
    pendingCount: 0,
    blockedCount: 0,
    latestEventLabel: "Waiting for first local event.",
    latestEventStatus: "idle",
    latestEventDetail: "No emitted events yet.",
    detail: "",
    ...overrides
  };
}

function buildQuality(overrides: Partial<CockpitMonitorQuality> = {}): CockpitMonitorQuality {
  return {
    label: "No quality signal",
    detail: "Quality appears after local events are emitted.",
    tone: "waiting",
    readinessLabel: "0%",
    metrics: [],
    ...overrides
  };
}

function buildLoop(overrides: Partial<CockpitMonitorLoop> = {}): CockpitMonitorLoop {
  return {
    label: "No loop active",
    detail: "Stage a run to monitor worker attempts.",
    tone: "waiting",
    attemptLabel: "0/3",
    gateLabel: "0/0 gates",
    workerLabel: "0 panels",
    ...overrides
  };
}

function buildEventFeed(overrides: Partial<CockpitMonitorEventFeedItem>[] = []): CockpitMonitorEventFeedItem[] {
  return overrides.map((item, index) => ({
    id: `event-${index + 1}`,
    label: "Event label",
    detail: "Event detail",
    status: "accepted",
    sequenceLabel: `#${index + 1}`,
    ...item
  }));
}

describe("createCockpitMonitorDepth", () => {
  it("returns empty when no signals are available", () => {
    const result = createCockpitMonitorDepth(
      buildSummary(),
      buildQuality(),
      buildLoop(),
      buildEventFeed()
    );

    expect(result).toEqual({
      tone: "empty",
      label: "No monitor depth",
      detail: "Select or stage a run to build monitoring context.",
      scorePercent: 0,
      scoreValue: "0%",
      signalLabel: "0/5 signals",
      eventLabel: "0 recent",
      gateLabel: "0/0 gates"
    });
  });

  it("returns shallow for low signal counts", () => {
    const summary = buildSummary({ timelineTotal: 4 });
    const quality = buildQuality({ tone: "waiting" });
    const loop = buildLoop({ tone: "running" });

    const result = createCockpitMonitorDepth(summary, quality, loop, []);

    expect(result.tone).toBe("shallow");
    expect(result.label).toBe("Shallow monitor");
    expect(result.scorePercent).toBe(40);
    expect(result.signalLabel).toBe("2/5 signals");
  });

  it("returns steady when four signals are visible", () => {
    const summary = buildSummary({ timelineTotal: 4, streamProgressPercent: 5 });
    const quality = buildQuality({ tone: "review" });
    const loop = buildLoop({ tone: "running" });

    const result = createCockpitMonitorDepth(summary, quality, loop, []);

    expect(result.tone).toBe("steady");
    expect(result.label).toBe("Steady monitor");
    expect(result.scorePercent).toBe(80);
    expect(result.signalLabel).toBe("4/5 signals");
  });

  it("returns deep when all signals are visible", () => {
    const summary = buildSummary({ timelineTotal: 2, streamProgressPercent: 10, pendingCount: 1 });
    const quality = buildQuality({ tone: "clean" });
    const loop = buildLoop({ tone: "running", gateLabel: "2/3 gates" });
    const feed = buildEventFeed([{}]);

    const result = createCockpitMonitorDepth(summary, quality, loop, feed);

    expect(result.tone).toBe("deep");
    expect(result.label).toBe("Deep monitor");
    expect(result.scorePercent).toBe(100);
    expect(result.scoreValue).toBe("100%");
    expect(result.gateLabel).toBe("2/3 gates");
    expect(result.eventLabel).toBe("1 recent");
  });

  it("returns blocked when issues or blocked states exist", () => {
    const summary = buildSummary({
      issueCount: 1,
      blockedCount: 0,
      timelineTotal: 6,
      streamProgressPercent: 100,
      pendingCount: 2
    });
    const quality = buildQuality({ tone: "clean" });
    const loop = buildLoop({ tone: "running", gateLabel: "1 failed" });

    const result = createCockpitMonitorDepth(
      summary,
      quality,
      loop,
      buildEventFeed([{}, {}])
    );

    expect(result.tone).toBe("blocked");
    expect(result.label).toBe("Depth needs review");
    expect(result.detail).toBe("Monitoring has enough signal to review blocked or issue states.");
    expect(result.scorePercent).toBe(100);
  });

  it("supports score clamping at full scale and preserves immutability", () => {
    const summary = buildSummary({
      timelineTotal: 2,
      streamProgressPercent: 1,
      pendingCount: 0
    });
    const quality = buildQuality({ tone: "review" });
    const loop = buildLoop({ tone: "running" });
    const feed = buildEventFeed([{ status: "review" }, { status: "accepted" }]);

    const summaryCopy = structuredClone(summary);
    const qualityCopy = structuredClone(quality);
    const loopCopy = structuredClone(loop);
    const feedCopy = structuredClone(feed);

    const result = createCockpitMonitorDepth(summary, quality, loop, feed);

    expect(result.scorePercent).toBe(100);
    expect(result.scoreValue).toBe("100%");
    expect(summary).toEqual(summaryCopy);
    expect(quality).toEqual(qualityCopy);
    expect(loop).toEqual(loopCopy);
    expect(feed).toEqual(feedCopy);
  });
});
