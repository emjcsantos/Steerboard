import { describe, expect, it } from "vitest";
import {
  buildRuntimeStreamSnapshot,
  clampRuntimeStreamPosition,
  nextRuntimeStreamPosition,
  type RuntimeStreamPlaybackState,
  type RuntimeStreamSnapshot
} from "./runtimeStream";
import type { RuntimeIngestionEvent } from "./runtimeIngestion";

function makeIngestionEvent(
  id: string,
  adapterStatus: RuntimeIngestionEvent["adapterStatus"]
): RuntimeIngestionEvent {
  return {
    id,
    sourceEventId: `${id}:source`,
    eventKind: "run",
    label: `${id} label`,
    detail: "ingestion detail",
    adapterStatus,
    reason: `${adapterStatus} reason`,
    sequence: Number(id.replace("evt-", ""))
  };
}

describe("runtime stream position", () => {
  it("clamps position to 0 for negative, decimal, and non-finite values", () => {
    expect(clampRuntimeStreamPosition(-2, 3)).toBe(0);
    expect(clampRuntimeStreamPosition(-0.5, 3)).toBe(0);
    expect(clampRuntimeStreamPosition(NaN, 3)).toBe(0);
    expect(clampRuntimeStreamPosition(Infinity, 3)).toBe(0);
    expect(clampRuntimeStreamPosition(-Infinity, 3)).toBe(0);
  });

  it("clamps position to total for over-total values", () => {
    expect(clampRuntimeStreamPosition(5, 3)).toBe(3);
    expect(clampRuntimeStreamPosition(3.9, 3)).toBe(3);
  });

  it("advances position by one without exceeding total", () => {
    expect(nextRuntimeStreamPosition(0, 3)).toBe(1);
    expect(nextRuntimeStreamPosition(2.2, 3)).toBe(3);
    expect(nextRuntimeStreamPosition(3, 3)).toBe(3);
    expect(nextRuntimeStreamPosition(3.5, 3)).toBe(3);
    expect(nextRuntimeStreamPosition(-1, 2)).toBe(0);
  });
});

describe("runtime stream snapshot", () => {
  it("emits the first cursor events, preserving order, and computes latest, pending, readiness, and counts", () => {
    const events: RuntimeIngestionEvent[] = [
      makeIngestionEvent("evt-1", "accepted"),
      makeIngestionEvent("evt-2", "review"),
      makeIngestionEvent("evt-3", "accepted"),
      makeIngestionEvent("evt-4", "blocked")
    ];

    const snapshot = buildRuntimeStreamSnapshot(events, 2.9, "streaming");

    expect(snapshot).toEqual({
      state: "streaming",
      cursor: 2,
      total: 4,
      emitted: 2,
      pending: 2,
      accepted: 1,
      review: 1,
      blocked: 0,
      readiness: 50,
      latestEvent: events[1],
      emittedEvents: events.slice(0, 2)
    });
  });

  it("builds complete state when streaming position reaches total", () => {
    const events: RuntimeIngestionEvent[] = [
      makeIngestionEvent("evt-1", "accepted"),
      makeIngestionEvent("evt-2", "accepted")
    ];

    const snapshot = buildRuntimeStreamSnapshot(events, 2, "streaming");

    expect(snapshot.state).toBe("complete");
  });

  it("forces blocked state when any emitted event is blocked", () => {
    const events: RuntimeIngestionEvent[] = [
      makeIngestionEvent("evt-1", "accepted"),
      makeIngestionEvent("evt-2", "blocked")
    ];

    const streamingBlocked = buildRuntimeStreamSnapshot(events, 2.2, "streaming");
    const pausedBlocked = buildRuntimeStreamSnapshot(events, 2.2, "paused");

    expect(streamingBlocked.state).toBe("blocked");
    expect(pausedBlocked.state).toBe("blocked");
  });

  it("has no latest event and zero readiness for an empty idle snapshot", () => {
    const snapshot = buildRuntimeStreamSnapshot([], 0, "idle");

    expect(snapshot.latestEvent).toBeUndefined();
    expect(snapshot.readiness).toBe(0);
    expect(snapshot).toEqual({
      state: "idle",
      cursor: 0,
      total: 0,
      emitted: 0,
      pending: 0,
      accepted: 0,
      review: 0,
      blocked: 0,
      readiness: 0,
      latestEvent: undefined,
      emittedEvents: []
    });
  });

  it("treats position as emitted count and does not mutate inputs", () => {
    const events: RuntimeIngestionEvent[] = [
      makeIngestionEvent("evt-1", "accepted"),
      makeIngestionEvent("evt-2", "review")
    ];
    const eventsSnapshot: RuntimeIngestionEvent[] = JSON.parse(JSON.stringify(events));
    const requestedState: RuntimeStreamPlaybackState = "paused";
    const position = 10.6;

    const snapshot: RuntimeStreamSnapshot = buildRuntimeStreamSnapshot(
      events,
      position,
      requestedState
    );

    expect(snapshot.cursor).toBe(events.length);
    expect(snapshot.emittedEvents).toEqual(events);
    expect(events).toEqual(eventsSnapshot);
    expect(position).toBe(10.6);
    expect(requestedState).toBe("paused");
  });
});
