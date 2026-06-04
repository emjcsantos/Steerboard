import type { RuntimeStreamPlaybackState } from "./runtimeStream";

export interface CockpitMonitorControlState {
  canStart: boolean;
  canPause: boolean;
  canReset: boolean;
  startReason: string;
  pauseReason: string;
  resetReason: string;
}

interface BuildCockpitMonitorControlStateArgs {
  hasRun: boolean;
  eventCount: number;
  canStream: boolean;
  streamState: RuntimeStreamPlaybackState;
  cursor: number;
}

function normalizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

export function buildCockpitMonitorControlState({
  hasRun,
  eventCount,
  canStream,
  streamState,
  cursor
}: BuildCockpitMonitorControlStateArgs): CockpitMonitorControlState {
  const normalizedEventCount = normalizeCount(eventCount);
  const normalizedPosition = normalizeCount(cursor);

  const startCan =
    hasRun &&
    normalizedEventCount > 0 &&
    canStream &&
    !["streaming", "complete", "blocked"].includes(streamState);
  const canPause = hasRun && streamState === "streaming";
  const canReset = hasRun && (normalizedPosition > 0 || streamState !== "idle");

  let startReason: string;
  if (!hasRun) {
    startReason = "Select or stage a run first.";
  } else if (normalizedEventCount <= 0) {
    startReason = "No local stream events are queued.";
  } else if (!canStream) {
    startReason = "Attach an allowed local event source first.";
  } else if (streamState === "streaming") {
    startReason = "Stream is already running.";
  } else if (streamState === "complete") {
    startReason = "Stream is complete; reset to replay.";
  } else if (streamState === "blocked") {
    startReason = "Stream is blocked by local adapter review.";
  } else {
    startReason = "Start local stream preview.";
  }

  const pauseReason = canPause ? "Pause local stream preview." : "Stream is not running.";
  const resetReason = canReset ? "Reset local stream preview." : "Nothing to reset.";

  return {
    canStart: startCan,
    canPause,
    canReset,
    startReason,
    pauseReason,
    resetReason
  };
}
