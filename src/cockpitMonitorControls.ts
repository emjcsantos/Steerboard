import type { RuntimeStreamPlaybackState } from "./runtimeStream";

export interface CockpitMonitorControlState {
  canStart: boolean;
  canPause: boolean;
  canReset: boolean;
  canAttach: boolean;
  startReason: string;
  pauseReason: string;
  resetReason: string;
  attachReason: string;
}

interface BuildCockpitMonitorControlStateArgs {
  hasRun: boolean;
  eventCount: number;
  canStream: boolean;
  streamState: RuntimeStreamPlaybackState;
  cursor: number;
  canAttachSource: boolean;
  isSourceAttached: boolean;
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
  cursor,
  canAttachSource,
  isSourceAttached
}: BuildCockpitMonitorControlStateArgs): CockpitMonitorControlState {
  const normalizedEventCount = normalizeCount(eventCount);
  const normalizedPosition = normalizeCount(cursor);

  const startCan =
    hasRun &&
    normalizedEventCount > 0 &&
    canStream &&
    isSourceAttached &&
    !["streaming", "complete", "blocked"].includes(streamState);
  const canPause = hasRun && streamState === "streaming";
  const canReset = hasRun && (normalizedPosition > 0 || streamState !== "idle");
  const canAttach =
    hasRun &&
    normalizedEventCount > 0 &&
    canAttachSource &&
    !isSourceAttached &&
    streamState !== "blocked";

  let startReason: string;
  if (!hasRun) {
    startReason = "Select or stage a run first.";
  } else if (normalizedEventCount <= 0) {
    startReason = "No local stream events are queued.";
  } else if (streamState === "streaming") {
    startReason = "Stream is already running.";
  } else if (streamState === "complete") {
    startReason = "Stream is complete; reset to replay.";
  } else if (streamState === "blocked") {
    startReason = "Stream is blocked by local adapter review.";
  } else if (!isSourceAttached || !canStream) {
    startReason = "Attach an allowed local event source first.";
  } else {
    startReason = "Start local stream preview.";
  }

  const pauseReason = canPause ? "Pause local stream preview." : "Stream is not running.";
  const resetReason = canReset ? "Reset local stream preview." : "Nothing to reset.";
  let attachReason: string;
  if (!hasRun) {
    attachReason = "Select or stage a run first.";
  } else if (normalizedEventCount <= 0) {
    attachReason = "No local stream events are queued.";
  } else if (streamState === "blocked") {
    attachReason = "Stream is blocked by local adapter review.";
  } else if (isSourceAttached) {
    attachReason = "Local event source is already attached.";
  } else if (!canAttachSource) {
    attachReason = "Local event source is not ready to attach.";
  } else {
    attachReason = "Attach local event source preview.";
  }

  return {
    canStart: startCan,
    canPause,
    canReset,
    canAttach,
    startReason,
    pauseReason,
    resetReason,
    attachReason
  };
}
