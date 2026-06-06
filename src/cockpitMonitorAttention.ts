import type { CockpitMonitorHealth } from "./cockpitMonitorHealth";
import type { CockpitMonitorSummary } from "./cockpitMonitorSummary";

export interface CockpitMonitorAttention {
  label: string;
  detail: string;
  tone: "waiting" | "ready" | "live" | "paused" | "blocked" | "complete";
  actionLabel: string;
}

export function createCockpitMonitorAttention(
  summary: CockpitMonitorSummary,
  health: CockpitMonitorHealth
): CockpitMonitorAttention {
  if (summary.blockedCount > 0 || summary.issueCount > 0 || health.tone === "blocked") {
    return {
      label: "Needs review",
      detail: "Blocked or issue events need operator review.",
      tone: "blocked",
      actionLabel: "Review"
    };
  }

  if (health.tone === "waiting") {
    return {
      label: "No run selected",
      detail: "Select or stage a run to begin monitoring.",
      tone: "waiting",
      actionLabel: "Select"
    };
  }

  if (health.tone === "ready") {
    return {
      label: "Ready to stream",
      detail: "Attach and start the local event stream.",
      tone: "ready",
      actionLabel: "Start"
    };
  }

  if (health.tone === "live") {
    return {
      label: "Watching live",
      detail: "Local events are streaming into the arena.",
      tone: "live",
      actionLabel: "Watch"
    };
  }

  if (health.tone === "paused") {
    return {
      label: "Stream paused",
      detail: "Resume when you are ready to continue.",
      tone: "paused",
      actionLabel: "Resume"
    };
  }

  if (health.tone === "complete") {
    return {
      label: "All clear",
      detail: "All queued local events have been emitted.",
      tone: "complete",
      actionLabel: "Done"
    };
  }

  return {
    label: "No run selected",
    detail: "Select or stage a run to begin monitoring.",
    tone: "waiting",
    actionLabel: "Select"
  };
}
