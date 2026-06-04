import { describe, expect, it } from "vitest";
import type { RuntimeSourceConnectionSnapshot } from "./runtimeSourceConnection";
import type { RuntimeStreamSnapshot } from "./runtimeStream";
import type { RuntimeAdapterBridgeIntent } from "./runtimeAdapterBridge";
import { buildRuntimeAdapterBridgeSnapshot } from "./runtimeAdapterBridge";

const baseConnection: RuntimeSourceConnectionSnapshot = {
  id: "source-1",
  label: "Primary source",
  state: "ready",
  canAttach: true,
  transport: "runtime",
  readiness: 72,
  requiredCapabilities: [],
  missingCapabilities: [],
  enabledPermissions: 0,
  requiredPermissions: 0,
  detail: "Ready from source model."
};

const idleStream: RuntimeStreamSnapshot = {
  state: "idle",
  cursor: 0,
  total: 10,
  emitted: 0,
  pending: 10,
  accepted: 0,
  review: 0,
  blocked: 0,
  readiness: 50,
  emittedEvents: []
};

const streamingStream: RuntimeStreamSnapshot = {
  ...idleStream,
  state: "streaming",
  emitted: 3,
  pending: 7
};

describe("runtime adapter bridge snapshot", () => {
  it("keeps non-attachable connections detached and reuses source detail", () => {
    const connection: RuntimeSourceConnectionSnapshot = {
      ...baseConnection,
      canAttach: false,
      state: "ready",
      detail: "Source is missing required prerequisites."
    };

    const snapshot = buildRuntimeAdapterBridgeSnapshot(connection, idleStream, "attached");

    expect(snapshot).toEqual({
      id: "source-1:bridge",
      label: "Primary source bridge",
      intent: "attached",
      state: "detached",
      attached: false,
      canAttach: false,
      canDetach: false,
      canStream: false,
      transport: "runtime",
      readiness: 72,
      detail: "Source is missing required prerequisites."
    });
  });

  it("maps attachable detached intent to attachable and blocks streaming", () => {
    const snapshot = buildRuntimeAdapterBridgeSnapshot(baseConnection, idleStream, "detached");

    expect(snapshot).toEqual({
      id: "source-1:bridge",
      label: "Primary source bridge",
      intent: "detached",
      state: "attachable",
      attached: false,
      canAttach: true,
      canDetach: false,
      canStream: false,
      transport: "runtime",
      readiness: 72,
      detail: "Ready to attach without starting external execution."
    });
  });

  it("maps attaching intent to attaching with detach action and no streaming", () => {
    const snapshot = buildRuntimeAdapterBridgeSnapshot(baseConnection, idleStream, "attaching");

    expect(snapshot).toEqual({
      id: "source-1:bridge",
      label: "Primary source bridge",
      intent: "attaching",
      state: "attaching",
      attached: false,
      canAttach: false,
      canDetach: true,
      canStream: false,
      transport: "runtime",
      readiness: 72,
      detail: "Adapter bridge is preparing the local stream handoff."
    });
  });

  it("maps attached idle stream to attached state and allows streaming", () => {
    const snapshot = buildRuntimeAdapterBridgeSnapshot(baseConnection, idleStream, "attached");

    expect(snapshot).toEqual({
      id: "source-1:bridge",
      label: "Primary source bridge",
      intent: "attached",
      state: "attached",
      attached: true,
      canAttach: false,
      canDetach: true,
      canStream: true,
      transport: "runtime",
      readiness: 72,
      detail: "Bridge attached through runtime."
    });
  });

  it("maps attached streaming stream to live with streaming detail", () => {
    const snapshot = buildRuntimeAdapterBridgeSnapshot(baseConnection, streamingStream, "attached");

    expect(snapshot.state).toBe("live");
    expect(snapshot.detail).toBe("Bridge is streaming through runtime.");
  });

  it("maps attached paused and complete streams correctly", () => {
    const paused = buildRuntimeAdapterBridgeSnapshot(
      baseConnection,
      { ...streamingStream, state: "paused", emitted: 3, pending: 7 },
      "attached"
    );
    expect(paused.state).toBe("paused");
    expect(paused.detail).toBe("Bridge stream is paused.");

    const complete = buildRuntimeAdapterBridgeSnapshot(
      baseConnection,
      { ...streamingStream, state: "complete", emitted: 10, pending: 0 },
      "attached"
    );
    expect(complete.state).toBe("complete");
    expect(complete.detail).toBe("Bridge stream is complete.");
  });

  it("forces blocked state when blocked and keeps detach only when not detached", () => {
    const blockedByConnection = buildRuntimeAdapterBridgeSnapshot(
      { ...baseConnection, state: "blocked" },
      idleStream,
      "attached"
    );
    expect(blockedByConnection.state).toBe("blocked");
    expect(blockedByConnection.canDetach).toBe(true);

    const blockedByStream = buildRuntimeAdapterBridgeSnapshot(baseConnection, { ...idleStream, state: "blocked" }, "detached");
    expect(blockedByStream.state).toBe("blocked");
    expect(blockedByStream.canDetach).toBe(false);
  });

  it("clamps readiness to 0..100", () => {
    const clampedLow = buildRuntimeAdapterBridgeSnapshot(
      { ...baseConnection, readiness: -40 },
      idleStream,
      "detached"
    );
    const clampedHigh = buildRuntimeAdapterBridgeSnapshot(
      { ...baseConnection, readiness: 142 },
      idleStream,
      "detached"
    );

    expect(clampedLow.readiness).toBe(0);
    expect(clampedHigh.readiness).toBe(100);
  });

  it("does not mutate input objects", () => {
    const connection: RuntimeSourceConnectionSnapshot = {
      ...baseConnection,
      requiredCapabilities: [...baseConnection.requiredCapabilities],
      missingCapabilities: [...baseConnection.missingCapabilities]
    };
    const stream: RuntimeStreamSnapshot = {
      ...streamingStream,
      emittedEvents: [...streamingStream.emittedEvents],
      latestEvent: {
        id: "stream-event",
        sourceEventId: "source-event",
        eventKind: "task",
        label: "Task update",
        detail: "Task update event",
        adapterStatus: "accepted",
        reason: "accepted",
        sequence: 3
      }
    };
    const connectionClone = JSON.parse(JSON.stringify(connection));
    const streamClone = JSON.parse(JSON.stringify(stream));
    const runtimeAdapterBridgeIntent: RuntimeAdapterBridgeIntent = "attaching";

    buildRuntimeAdapterBridgeSnapshot(connection, stream, runtimeAdapterBridgeIntent);

    expect(connection).toEqual(connectionClone);
    expect(stream).toEqual(streamClone);
  });

  it("treats an unknown intent as detached at runtime", () => {
    const snapshot = buildRuntimeAdapterBridgeSnapshot(
      baseConnection,
      idleStream,
      "drift" as unknown as RuntimeAdapterBridgeIntent
    );

    expect(snapshot.state).toBe("attachable");
    expect(snapshot.intent).toBe("detached");
  });
});
