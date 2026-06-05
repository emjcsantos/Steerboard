import { describe, expect, it } from "vitest";
import {
  buildRuntimeStreamSnapshot,
  clampRuntimeStreamPosition,
  nextRuntimeStreamPosition,
  createRuntimeStreamPanelRouterState,
  reduceRuntimeStreamPanelRouter,
  selectActiveRuntimePanels,
  selectPanelLatestRuntimeStatus,
  selectPanelRuntimeEvents,
  selectRuntimeStreamQuarantineEvents,
  selectRunningRuntimePanels,
  type RuntimeStreamPanelOwnership,
  type RuntimeStreamEventBatch,
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

function makeRoutedEventBatch(
  panelId: string,
  provider: string,
  sessionId: string,
  turnId: string,
  turnSequence: number,
  eventIds: readonly string[]
): RuntimeStreamEventBatch {
  return {
    panelId,
    provider,
    sessionId,
    turnId,
    turnSequence,
    events: eventIds.map((id, index) =>
      makeIngestionEvent(`${panelId}-${id}`, index % 2 === 0 ? "accepted" : "review")
    )
  };
}

describe("runtime stream panel router", () => {
  const ownerPanelA: RuntimeStreamPanelOwnership = {
    panelId: "panel-a",
    provider: "codex",
    sessionId: "shared-session"
  };
  const ownerPanelB: RuntimeStreamPanelOwnership = {
    panelId: "panel-b",
    provider: "codex",
    sessionId: "shared-session"
  };

  it("keeps overlapping turn and session ids in per-panel logs without cross-talk", () => {
    const state = createRuntimeStreamPanelRouterState([ownerPanelA, ownerPanelB]);
    const eventBatches: RuntimeStreamEventBatch[] = [
      makeRoutedEventBatch("panel-a", "codex", "shared-session", "turn-1", 1, ["a1", "a2"]),
      makeRoutedEventBatch("panel-b", "codex", "shared-session", "turn-1", 1, ["b1", "b2"])
    ];

    const next = reduceRuntimeStreamPanelRouter(state, eventBatches);

    expect(selectPanelRuntimeEvents(next, "panel-a").map((event) => event.id)).toEqual([
      "panel-a-a1",
      "panel-a-a2"
    ]);
    expect(selectPanelRuntimeEvents(next, "panel-b").map((event) => event.id)).toEqual([
      "panel-b-b1",
      "panel-b-b2"
    ]);

    expect(selectActiveRuntimePanels(next).sort()).toEqual(["panel-a", "panel-b"]);
    expect(selectRunningRuntimePanels(next).sort()).toEqual(["panel-a", "panel-b"]);
    expect(selectPanelLatestRuntimeStatus(next, "panel-a")?.latestStatus).toBe("review");
    expect(selectPanelLatestRuntimeStatus(next, "panel-b")?.latestStatus).toBe("review");
    expect(selectRuntimeStreamQuarantineEvents(next)).toHaveLength(0);
  });

  it("quarantines unknown panel events with explicit reason", () => {
    const state = createRuntimeStreamPanelRouterState([ownerPanelA]);
    const next = reduceRuntimeStreamPanelRouter(state, [
      makeRoutedEventBatch("panel-unknown", "codex", "unknown-session", "turn-1", 1, ["x"])
    ]);

    const quarantined = selectRuntimeStreamQuarantineEvents(next);
    expect(quarantined).toHaveLength(1);
    expect(quarantined[0]).toMatchObject({
      reason: "unknown-panel",
      event: {
        panelId: "panel-unknown",
        sessionId: "unknown-session"
      }
    });
    expect(selectPanelRuntimeEvents(next, "panel-unknown")).toEqual([]);
  });

  it("quarantines events with mismatched session/provider ownership and records reason", () => {
    const state = createRuntimeStreamPanelRouterState([ownerPanelA]);
    const next = reduceRuntimeStreamPanelRouter(state, [
      makeRoutedEventBatch("panel-a", "codex", "wrong-session", "turn-1", 1, ["bad"])
    ]);

    const quarantined = selectRuntimeStreamQuarantineEvents(next, "unknown-session");
    expect(quarantined).toHaveLength(1);
    expect(quarantined[0]).toMatchObject({
      reason: "unknown-session",
      detail: expect.stringContaining("Session/provider mismatch")
    });
    expect(selectPanelRuntimeEvents(next, "panel-a")).toHaveLength(0);
  });

  it("quarantines stale turn batches while preserving current panel log state", () => {
    const state = createRuntimeStreamPanelRouterState([ownerPanelA]);
    const withCurrentTurn = reduceRuntimeStreamPanelRouter(state, [
      makeRoutedEventBatch("panel-a", "codex", "shared-session", "turn-2", 2, ["fresh"])
    ]);
    const withStaleTurn = reduceRuntimeStreamPanelRouter(withCurrentTurn, [
      makeRoutedEventBatch("panel-a", "codex", "shared-session", "turn-1", 1, ["stale"])
    ]);

    expect(selectPanelRuntimeEvents(withStaleTurn, "panel-a").map((event) => event.id)).toEqual([
      "panel-a-fresh"
    ]);
    expect(selectRuntimeStreamQuarantineEvents(withStaleTurn, "stale-turn")).toHaveLength(1);
  });
});

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
