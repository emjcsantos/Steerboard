import type { RuntimeIngestionEvent } from "./runtimeIngestion";

export type RuntimeStreamPlaybackState =
  | "idle"
  | "streaming"
  | "paused"
  | "complete"
  | "blocked";

export interface RuntimeStreamSnapshot {
  state: RuntimeStreamPlaybackState;
  cursor: number;
  total: number;
  emitted: number;
  pending: number;
  accepted: number;
  review: number;
  blocked: number;
  readiness: number;
  latestEvent?: RuntimeIngestionEvent;
  emittedEvents: RuntimeIngestionEvent[];
}

const clampToInteger = (value: number): number =>
  Number.isFinite(value) ? Math.floor(value) : 0;

export function clampRuntimeStreamPosition(
  cursor: number,
  total: number
): number {
  const safePosition = clampToInteger(cursor);
  const safeTotal = Math.max(0, clampToInteger(total));

  if (!Number.isFinite(cursor) || safePosition < 0) {
    return 0;
  }

  if (safePosition > safeTotal) {
    return safeTotal;
  }

  return safePosition;
}

export function nextRuntimeStreamPosition(cursor: number, total: number): number {
  return clampRuntimeStreamPosition(cursor + 1, total);
}

export function buildRuntimeStreamSnapshot(
  events: readonly RuntimeIngestionEvent[],
  cursor: number,
  requestedState: RuntimeStreamPlaybackState
): RuntimeStreamSnapshot {
  const total = events.length;
  const clampedPosition = clampRuntimeStreamPosition(cursor, total);
  const emittedEvents = events.slice(0, clampedPosition);

  const { accepted, review, blocked } = emittedEvents.reduce(
    (acc, event) => {
      if (event.adapterStatus === "accepted") {
        acc.accepted += 1;
      } else if (event.adapterStatus === "review") {
        acc.review += 1;
      } else if (event.adapterStatus === "blocked") {
        acc.blocked += 1;
      }

      return acc;
    },
    { accepted: 0, review: 0, blocked: 0 }
  );

  const emitted = emittedEvents.length;
  const pending = total - emitted;
  const latestEvent = emittedEvents.at(-1);
  const readiness = emitted === 0 ? 0 : Math.round((accepted / emitted) * 100);
  const hasBlocked = blocked > 0;

  let state = requestedState;
  if (hasBlocked && !(requestedState === "idle" && emitted === 0)) {
    state = "blocked";
  } else if (requestedState === "streaming" && emitted >= total) {
    state = "complete";
  }

  return {
    state,
    cursor: clampedPosition,
    total,
    emitted,
    pending,
    accepted,
    review,
    blocked,
    readiness,
    latestEvent,
    emittedEvents
  };
}
