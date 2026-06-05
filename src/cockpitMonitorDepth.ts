import type { CockpitMonitorSummary } from "./cockpitMonitorSummary";
import type { CockpitMonitorQuality } from "./cockpitMonitorQuality";
import type { CockpitMonitorLoop } from "./cockpitMonitorLoop";
import type { CockpitMonitorEventFeedItem } from "./cockpitMonitorEventFeed";

export type CockpitMonitorDepthTone = "empty" | "shallow" | "steady" | "deep" | "blocked";

export type CockpitMonitorDepth = {
  label: string;
  detail: string;
  tone: CockpitMonitorDepthTone;
  signalLabel: string;
  eventLabel: string;
  gateLabel: string;
  scorePercent: number;
  scoreValue: string;
};

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function computeSignals(
  summary: CockpitMonitorSummary,
  quality: CockpitMonitorQuality,
  loop: CockpitMonitorLoop,
  recentEventFeed: ReadonlyArray<CockpitMonitorEventFeedItem>
): number {
  const signalChecks = [
    summary.timelineTotal > 0,
    summary.streamProgressPercent > 0 || summary.pendingCount > 0,
    quality.tone !== "waiting",
    loop.tone !== "waiting",
    recentEventFeed.length > 0
  ];

  return signalChecks.reduce((count, active) => (active ? count + 1 : count), 0);
}

function resolveTone(
  summary: CockpitMonitorSummary,
  quality: CockpitMonitorQuality,
  loop: CockpitMonitorLoop,
  signals: number
): CockpitMonitorDepthTone {
  if (
    summary.issueCount > 0 ||
    summary.blockedCount > 0 ||
    quality.tone === "blocked" ||
    loop.tone === "blocked"
  ) {
    return "blocked";
  }

  if (signals === 0) {
    return "empty";
  }

  if (signals <= 2) {
    return "shallow";
  }

  if (signals <= 4) {
    return "steady";
  }

  return "deep";
}

function resolveCopy(tone: CockpitMonitorDepthTone): { label: string; detail: string } {
  switch (tone) {
    case "blocked":
      return {
        label: "Depth needs review",
        detail: "Monitoring has enough signal to review blocked or issue states."
      };
    case "empty":
      return {
        label: "No monitor depth",
        detail: "Select or stage a run to build monitoring context."
      };
    case "shallow":
      return {
        label: "Shallow monitor",
        detail: "Only partial monitoring context is visible."
      };
    case "steady":
      return {
        label: "Steady monitor",
        detail: "Core monitoring context is visible."
      };
    case "deep":
      return {
        label: "Deep monitor",
        detail: "Timeline, stream, quality, loop, and recent-event context are all visible."
      };
  }
}

export function createCockpitMonitorDepth(
  summary: CockpitMonitorSummary,
  quality: CockpitMonitorQuality,
  loop: CockpitMonitorLoop,
  recentEventFeed: CockpitMonitorEventFeedItem[]
): CockpitMonitorDepth {
  const signals = computeSignals(summary, quality, loop, recentEventFeed);
  const scorePercent = clampPercent(Math.round((signals / 5) * 100));
  const tone = resolveTone(summary, quality, loop, signals);
  const resolved = resolveCopy(tone);

  return {
    ...resolved,
    tone,
    signalLabel: `${signals}/5 signals`,
    eventLabel: `${recentEventFeed.length} recent`,
    gateLabel: loop.gateLabel,
    scorePercent,
    scoreValue: `${scorePercent}%`
  };
}
