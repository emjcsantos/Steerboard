import type { MockOrchestratorRun, MockRunStatus } from "./run";
import type { RuntimeStreamPlaybackState, RuntimeStreamSnapshot } from "./runtimeStream";
import type { RunTimelineSummary } from "./runEvents";

export interface CockpitMonitorSummary {
  runLabel: string;
  runState: MockRunStatus | "none" | string;
  timelineTotal: number;
  activeCount: number;
  issueCount: number;
  completeCount: number;
  streamLabel: string;
  streamState: RuntimeStreamPlaybackState | "blocked" | "complete" | string;
  streamProgressLabel: string;
  pendingCount: number;
  blockedCount: number;
  detail: string;
}

function buildNoRunSummary(): CockpitMonitorSummary {
  return {
    runLabel: "No run selected",
    runState: "none",
    timelineTotal: 0,
    activeCount: 0,
    issueCount: 0,
    completeCount: 0,
    streamLabel: "Idle",
    streamState: "idle",
    streamProgressLabel: "0/0 emitted",
    pendingCount: 0,
    blockedCount: 0,
    detail: "Select or stage a run to monitor local cockpit activity."
  };
}

function buildStreamLabel(state: string): string {
  switch (state) {
    case "idle":
      return "Idle";
    case "streaming":
      return "Streaming";
    case "paused":
      return "Paused";
    case "complete":
      return "Complete";
    case "blocked":
      return "Blocked";
    default:
      return "Stream";
  }
}

export function buildCockpitMonitorSummary(
  run: MockOrchestratorRun | undefined,
  timelineSummary: RunTimelineSummary,
  streamSnapshot: RuntimeStreamSnapshot
): CockpitMonitorSummary {
  if (!run) {
    return buildNoRunSummary();
  }

  const safeStreamState: string = streamSnapshot.state;

  return {
    runLabel: run.title,
    runState: run.status,
    timelineTotal: timelineSummary.total,
    activeCount: timelineSummary.activeCount,
    issueCount: timelineSummary.issueCount,
    completeCount: timelineSummary.completeCount,
    streamLabel: buildStreamLabel(streamSnapshot.state),
    streamState: safeStreamState,
    streamProgressLabel: `${streamSnapshot.emitted}/${streamSnapshot.total} emitted`,
    pendingCount: streamSnapshot.pending,
    blockedCount: streamSnapshot.blocked,
    detail: `Run ${run.status}. Active: ${timelineSummary.activeCount}, issues: ${timelineSummary.issueCount}, complete: ${timelineSummary.completeCount}, pending events: ${streamSnapshot.pending}, blocked events: ${streamSnapshot.blocked}.`
  };
}
