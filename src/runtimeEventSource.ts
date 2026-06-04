import type { RuntimeIngestionEvent } from "./runtimeIngestion";
import type { RuntimeAdapterSessionSnapshot } from "./runtimeAdapterSession";
import type { RuntimeStreamSnapshot } from "./runtimeStream";

export type RuntimeEventSourceState = "offline" | "ready" | "emitting" | "paused" | "complete" | "blocked";
export type RuntimeEventSourceMode = "mock" | "adapter";

export interface RuntimeEventSourceSnapshot {
  id: string;
  label: string;
  mode: RuntimeEventSourceMode;
  state: RuntimeEventSourceState;
  transport: string;
  total: number;
  available: number;
  emitted: number;
  pending: number;
  accepted: number;
  review: number;
  blocked: number;
  nextEventLabel: string;
  detail: string;
  events: RuntimeIngestionEvent[];
}

const noQueuedEventsLabel = "No queued events";

function resolveState(session: RuntimeAdapterSessionSnapshot, stream: RuntimeStreamSnapshot): RuntimeEventSourceState {
  if (
    session.state === "blocked" ||
    session.health === "blocked" ||
    stream.state === "blocked"
  ) {
    return "blocked";
  }

  if (session.state === "offline") {
    return "offline";
  }

  if (stream.state === "streaming") {
    return "emitting";
  }

  if (stream.state === "paused") {
    return "paused";
  }

  if (stream.state === "complete") {
    return "complete";
  }

  return "ready";
}

function resolveNextEventLabel(
  events: readonly RuntimeIngestionEvent[],
  emittedStart: number
): string {
  const safeIndex = Math.max(0, Math.floor(emittedStart));
  return events[safeIndex]?.label ?? noQueuedEventsLabel;
}

export function buildRuntimeEventSourceSnapshot(
  session: RuntimeAdapterSessionSnapshot,
  stream: RuntimeStreamSnapshot,
  events: readonly RuntimeIngestionEvent[]
): RuntimeEventSourceSnapshot {
  const total = events.length;
  const emittedStart = Math.max(0, Math.min(total, Math.floor(stream.emitted)));
  const remainingEvents = events.slice(emittedStart);
  const available = Math.max(0, total - stream.emitted);
  const state = resolveState(session, stream);
  const { accepted, review, blocked } = remainingEvents.reduce(
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

  const detailByState: Record<RuntimeEventSourceState, string> = {
    blocked: "Event source is blocked by adapter or stream state.",
    offline: "Adapter session is offline.",
    emitting: `Emitting via ${session.transport}.`,
    paused: "Event source is paused.",
    complete: "Event source has emitted all queued events.",
    ready: `Ready on ${session.transport}.`
  };

  return {
    id: `${session.id}:event-source`,
    label: `${session.label} event source`,
    mode: "mock",
    state,
    transport: session.transport,
    total,
    available,
    emitted: stream.emitted,
    pending: stream.pending,
    accepted,
    review,
    blocked,
    nextEventLabel: resolveNextEventLabel(events, emittedStart),
    detail: detailByState[state],
    events: [...remainingEvents]
  };
}
