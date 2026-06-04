import { describe, expect, it } from "vitest";
import type { RuntimeIngestionEvent } from "./runtimeIngestion";
import type { RuntimeAdapterSessionSnapshot } from "./runtimeAdapterSession";
import type { RuntimeStreamSnapshot } from "./runtimeStream";
import { buildRuntimeEventSourceSnapshot } from "./runtimeEventSource";

function makeEvent(id: string, adapterStatus: RuntimeIngestionEvent["adapterStatus"]): RuntimeIngestionEvent {
  return {
    id,
    sourceEventId: `${id}-source`,
    eventKind: "run",
    label: `${id} label`,
    detail: "Event detail",
    adapterStatus,
    reason: `${adapterStatus} reason`,
    sequence: Number(id.replace("evt-", ""))
  };
}

describe("runtime event source snapshot", () => {
  const baseSession: RuntimeAdapterSessionSnapshot = {
    id: "session-1",
    label: "Runtime",
    state: "ready",
    health: "quiet",
    transport: "mock-transport",
    readiness: 84,
    emitted: 0,
    pending: 0,
    accepted: 0,
    review: 0,
    blocked: 0,
    enabledPermissions: 1,
    requiredPermissions: 2,
    heartbeat: "Adapter session is ready.",
    latestEventLabel: "No emitted events"
  };

  const baseStream: RuntimeStreamSnapshot = {
    state: "idle",
    cursor: 0,
    total: 3,
    emitted: 0,
    pending: 3,
    accepted: 0,
    review: 0,
    blocked: 0,
    readiness: 0,
    emittedEvents: []
  };

  it("uses mock mode, ready state, remaining counts, and ready detail for idle session", () => {
    const events: RuntimeIngestionEvent[] = [
      makeEvent("evt-1", "accepted"),
      makeEvent("evt-2", "blocked"),
      makeEvent("evt-3", "review")
    ];
    const stream: RuntimeStreamSnapshot = {
      ...baseStream,
      state: "idle",
      emitted: 1,
      pending: 2,
      accepted: 1,
      review: 1,
      blocked: 0
    };

    const snapshot = buildRuntimeEventSourceSnapshot(baseSession, stream, events);

    expect(snapshot).toEqual({
      id: "session-1:event-source",
      label: "Runtime event source",
      mode: "mock",
      state: "ready",
      transport: "mock-transport",
      total: 3,
      available: 2,
      emitted: 1,
      pending: 2,
      accepted: 0,
      review: 1,
      blocked: 1,
      nextEventLabel: "evt-2 label",
      detail: "Ready on mock-transport.",
      events: [events[1], events[2]]
    });
  });

  it("maps streaming stream state to emitting and uses transport detail", () => {
    const events: RuntimeIngestionEvent[] = [makeEvent("evt-1", "accepted")];

    const snapshot = buildRuntimeEventSourceSnapshot(
      {
        ...baseSession,
        transport: "remote-proxy"
      },
      {
        ...baseStream,
        state: "streaming",
        emitted: 0,
        pending: 1,
        total: 1
      },
      events
    );

    expect(snapshot.state).toBe("emitting");
    expect(snapshot.detail).toBe("Emitting via remote-proxy.");
    expect(snapshot.nextEventLabel).toBe("evt-1 label");
  });

  it("maps paused and complete stream states to the matching source states", () => {
    const events = [makeEvent("evt-1", "accepted"), makeEvent("evt-2", "review")];

    const pausedSnapshot = buildRuntimeEventSourceSnapshot(
      baseSession,
      {
        ...baseStream,
        state: "paused",
        emitted: 1,
        pending: 1
      },
      events
    );

    const completeSnapshot = buildRuntimeEventSourceSnapshot(
      baseSession,
      {
        ...baseStream,
        state: "complete",
        emitted: 2,
        pending: 0
      },
      events
    );

    expect(pausedSnapshot.state).toBe("paused");
    expect(pausedSnapshot.detail).toBe("Event source is paused.");
    expect(completeSnapshot.state).toBe("complete");
    expect(completeSnapshot.detail).toBe("Event source has emitted all queued events.");
  });

  it("maps blocked session and blocked stream states to blocked state/detail", () => {
    const events: RuntimeIngestionEvent[] = [makeEvent("evt-1", "blocked")];

    const blockedBySession = buildRuntimeEventSourceSnapshot(
      {
        ...baseSession,
        state: "blocked"
      },
      {
        ...baseStream,
        state: "idle"
      },
      events
    );
    const blockedByStream = buildRuntimeEventSourceSnapshot(
      baseSession,
      {
        ...baseStream,
        state: "blocked",
        emitted: 0,
        pending: 0,
        total: 1
      },
      events
    );

    expect(blockedBySession.state).toBe("blocked");
    expect(blockedBySession.detail).toBe("Event source is blocked by adapter or stream state.");
    expect(blockedByStream.state).toBe("blocked");
    expect(blockedByStream.detail).toBe("Event source is blocked by adapter or stream state.");
  });

  it("maps offline session state to offline state/detail", () => {
    const events: RuntimeIngestionEvent[] = [];
    const snapshot = buildRuntimeEventSourceSnapshot(
      {
        ...baseSession,
        state: "offline"
      },
      {
        ...baseStream,
        state: "streaming",
        emitted: 0,
        pending: 0
      },
      events
    );

    expect(snapshot.state).toBe("offline");
    expect(snapshot.detail).toBe("Adapter session is offline.");
  });

  it("counts accepted/review/blocked among remaining events only", () => {
    const events: RuntimeIngestionEvent[] = [
      makeEvent("evt-1", "accepted"),
      makeEvent("evt-2", "review"),
      makeEvent("evt-3", "blocked"),
      makeEvent("evt-4", "accepted")
    ];

    const snapshot = buildRuntimeEventSourceSnapshot(baseSession, { ...baseStream, emitted: 2 }, events);

    expect(snapshot.accepted).toBe(1);
    expect(snapshot.review).toBe(0);
    expect(snapshot.blocked).toBe(1);
    expect(snapshot.events).toEqual([events[2], events[3]]);
  });

  it("clamps remaining events when stream has over-emitted and sets no queued event label", () => {
    const events: RuntimeIngestionEvent[] = [makeEvent("evt-1", "accepted")];
    const stream: RuntimeStreamSnapshot = {
      ...baseStream,
      state: "complete",
      emitted: 5,
      pending: -1,
      total: 1
    };

    const snapshot = buildRuntimeEventSourceSnapshot(baseSession, stream, events);

    expect(snapshot.available).toBe(0);
    expect(snapshot.events).toEqual([]);
    expect(snapshot.nextEventLabel).toBe("No queued events");
  });

  it("does not mutate input objects", () => {
    const session = {
      ...baseSession
    };
    const stream: RuntimeStreamSnapshot = {
      ...baseStream,
      emittedEvents: [...baseStream.emittedEvents]
    };
    const events: RuntimeIngestionEvent[] = [makeEvent("evt-1", "accepted"), makeEvent("evt-2", "review")];
    const sessionSnapshot = JSON.parse(JSON.stringify(session));
    const streamSnapshot = JSON.parse(JSON.stringify(stream));
    const eventsSnapshot = JSON.parse(JSON.stringify(events));

    buildRuntimeEventSourceSnapshot(session, stream, events);

    expect(session).toEqual(sessionSnapshot);
    expect(stream).toEqual(streamSnapshot);
    expect(events).toEqual(eventsSnapshot);
  });
});
