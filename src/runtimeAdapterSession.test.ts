import { describe, expect, it } from "vitest";
import type { RuntimeAdapter } from "./runtime";
import type { RuntimeStreamSnapshot } from "./runtimeStream";
import { buildRuntimeAdapterSessionSnapshot } from "./runtimeAdapterSession";

const runtimeAdapterBase: RuntimeAdapter = {
  id: "adapter-1",
  label: "Runtime adapter",
  state: "ready",
  readiness: 88,
  transport: "local",
  capabilities: ["session events", "task events"],
  requiredPermissions: ["workspace_read", "process"],
  permissions: [
    { permission: "workspace_read", status: "enabled" },
    { permission: "workspace_write", status: "review" },
    { permission: "process", status: "disabled" }
  ]
};

const idleStream: RuntimeStreamSnapshot = {
  state: "idle",
  cursor: 0,
  total: 5,
  emitted: 0,
  pending: 5,
  accepted: 0,
  review: 0,
  blocked: 0,
  readiness: 20,
  emittedEvents: []
};

const streamingWithEvent: RuntimeStreamSnapshot = {
  state: "streaming",
  cursor: 3,
  total: 10,
  emitted: 3,
  pending: 7,
  accepted: 2,
  review: 0,
  blocked: 0,
  readiness: 73.4,
  latestEvent: {
    id: "evt-3",
    sourceEventId: "evt-3-source",
    eventKind: "run",
    label: "Run heartbeat check",
    detail: "Event detail",
    adapterStatus: "accepted",
    reason: "accepted",
    sequence: 3
  },
  emittedEvents: []
};

describe("runtime adapter session snapshot", () => {
  it("uses the missing adapter defaults while still copying stream counters", () => {
    const snapshot = buildRuntimeAdapterSessionSnapshot(undefined, {
      ...idleStream,
      state: "streaming",
      emitted: 2,
      pending: 3,
      latestEvent: undefined
    });

    expect(snapshot).toEqual({
      id: "adapter:missing",
      label: "Missing runtime adapter",
      state: "offline",
      health: "blocked",
      transport: "not configured",
      readiness: 0,
      emitted: 2,
      pending: 3,
      accepted: 0,
      review: 0,
      blocked: 0,
      enabledPermissions: 0,
      requiredPermissions: 0,
      heartbeat: "No adapter is configured.",
      latestEventLabel: "No emitted events"
    });
  });

  it("returns ready and quiet for an adapter-ready idle stream with adapter readiness", () => {
    const snapshot = buildRuntimeAdapterSessionSnapshot(runtimeAdapterBase, idleStream);

    expect(snapshot).toMatchObject({
      state: "ready",
      health: "quiet",
      readiness: 88,
      heartbeat: "Adapter session is ready.",
      latestEventLabel: "No emitted events",
      transport: "local"
    });
  });

  it("reports live/emitting state with min readiness and latest event label for emitted stream events", () => {
    const snapshot = buildRuntimeAdapterSessionSnapshot(
      {
        ...runtimeAdapterBase,
        readiness: 93
      },
      {
        ...streamingWithEvent,
        readiness: 72
      }
    );

    expect(snapshot.state).toBe("live");
    expect(snapshot.health).toBe("emitting");
    expect(snapshot.readiness).toBe(72);
    expect(snapshot.heartbeat).toBe("Streaming 3 of 10 events.");
    expect(snapshot.latestEventLabel).toBe("Run heartbeat check");
  });

  it("maps paused and complete stream states to corresponding session states", () => {
    const pausedSnapshot = buildRuntimeAdapterSessionSnapshot(runtimeAdapterBase, {
      ...streamingWithEvent,
      state: "paused",
      emitted: 4,
      pending: 2,
      latestEvent: {
        id: "evt-4",
        sourceEventId: "evt-4-source",
        eventKind: "run",
        label: "Pause point",
        detail: "Event detail",
        adapterStatus: "accepted",
        reason: "accepted",
        sequence: 4
      }
    });

    expect(pausedSnapshot.state).toBe("paused");
    expect(pausedSnapshot.health).toBe("emitting");
    expect(pausedSnapshot.heartbeat).toBe("Paused after 4 events.");

    const completeSnapshot = buildRuntimeAdapterSessionSnapshot(runtimeAdapterBase, {
      ...streamingWithEvent,
      state: "complete",
      emitted: 10,
      pending: 0,
      review: 0,
      accepted: 10
    });

    expect(completeSnapshot.state).toBe("complete");
    expect(completeSnapshot.health).toBe("quiet");
    expect(completeSnapshot.heartbeat).toBe("Completed 10 events.");
  });

  it("uses review health without changing a non-blocked stream state", () => {
    const snapshot = buildRuntimeAdapterSessionSnapshot(runtimeAdapterBase, {
      ...streamingWithEvent,
      review: 2,
      emitted: 3,
      pending: 3
    });

    expect(snapshot.state).toBe("live");
    expect(snapshot.health).toBe("review");
  });

  it("forces blocked state and health when adapter or stream is blocked", () => {
    const blockedByAdapter = buildRuntimeAdapterSessionSnapshot(
      {
        ...runtimeAdapterBase,
        state: "blocked",
        readiness: 98
      },
      streamingWithEvent
    );

    expect(blockedByAdapter.state).toBe("blocked");
    expect(blockedByAdapter.health).toBe("blocked");
    expect(blockedByAdapter.heartbeat).toBe("Session needs attention.");

    const blockedByStream = buildRuntimeAdapterSessionSnapshot(runtimeAdapterBase, {
      ...streamingWithEvent,
      state: "streaming",
      blocked: 1
    });

    expect(blockedByStream.state).toBe("blocked");
    expect(blockedByStream.health).toBe("blocked");
    expect(blockedByStream.heartbeat).toBe("Session needs attention.");
  });

  it("maps checking and limited adapters to connecting while stream is idle", () => {
    const checkingAdapterSnapshot = buildRuntimeAdapterSessionSnapshot(
      {
        ...runtimeAdapterBase,
        state: "checking"
      },
      idleStream
    );
    expect(checkingAdapterSnapshot.state).toBe("connecting");
    expect(checkingAdapterSnapshot.heartbeat).toBe("Adapter session is preparing.");

    const limitedAdapterSnapshot = buildRuntimeAdapterSessionSnapshot(
      {
        ...runtimeAdapterBase,
        state: "limited"
      },
      idleStream
    );

    expect(limitedAdapterSnapshot.state).toBe("connecting");
    expect(limitedAdapterSnapshot.heartbeat).toBe("Adapter session is preparing.");
  });

  it("counts enabled and required permissions from the adapter", () => {
    const snapshot = buildRuntimeAdapterSessionSnapshot(runtimeAdapterBase, idleStream);

    expect(snapshot.enabledPermissions).toBe(1);
    expect(snapshot.requiredPermissions).toBe(2);
  });

  it("does not mutate input objects", () => {
    const adapter = {
      ...runtimeAdapterBase,
      permissions: [...runtimeAdapterBase.permissions]
    };
    const stream: RuntimeStreamSnapshot = {
      ...streamingWithEvent,
      emittedEvents: [...streamingWithEvent.emittedEvents]
    };
    const adapterClone = JSON.parse(JSON.stringify(adapter));
    const streamClone = JSON.parse(JSON.stringify(stream));

    buildRuntimeAdapterSessionSnapshot(adapter, stream);

    expect(adapter).toEqual(adapterClone);
    expect(stream).toEqual(streamClone);
  });
});
