import { describe, expect, it } from "vitest";
import type { RuntimeAdapterBridgeSnapshot } from "./runtimeAdapterBridge";
import type { RuntimeSourceConnectionSnapshot } from "./runtimeSourceConnection";
import type { RuntimeEventSourceSnapshot } from "./runtimeEventSource";
import { buildRuntimeLaunchRequestSnapshot } from "./runtimeLaunchRequest";

const bridgeSnapshot: RuntimeAdapterBridgeSnapshot = {
  id: "source-1",
  label: "Primary source",
  intent: "attached",
  state: "attached",
  attached: true,
  canAttach: false,
  canDetach: true,
  canStream: true,
  transport: "runtime-transport",
  readiness: 78,
  detail: "Bridge is currently attached."
};

const connectionSnapshot: RuntimeSourceConnectionSnapshot = {
  id: "source-1",
  label: "Primary source",
  state: "ready",
  canAttach: true,
  transport: "runtime-transport",
  readiness: 64,
  requiredCapabilities: ["Session stream"],
  missingCapabilities: [],
  enabledPermissions: 2,
  requiredPermissions: 2,
  detail: "Connection is ready."
};

const sourceSnapshot: RuntimeEventSourceSnapshot = {
  id: "source-1",
  label: "Primary source",
  mode: "mock",
  state: "ready",
  transport: "runtime-transport",
  total: 3,
  available: 2,
  emitted: 1,
  pending: 2,
  accepted: 1,
  review: 0,
  blocked: 0,
  nextEventLabel: "Run",
  detail: "Ready for handoff.",
  events: []
};

describe("runtime launch request snapshot", () => {
  it("returns blocked state when any component is blocked", () => {
    const blockedSource = {
      ...sourceSnapshot,
      state: "blocked" as const
    };

    const snapshot = buildRuntimeLaunchRequestSnapshot(
      { ...bridgeSnapshot, state: "blocked" },
      connectionSnapshot,
      blockedSource
    );

    expect(snapshot).toEqual({
      id: "source-1:launch-request",
      label: "Primary source launch request",
      state: "blocked",
      requiresApproval: false,
      canRequest: false,
      transport: "runtime-transport",
      eventCount: 2,
      readiness: 78,
      detail: "Bridge runtime state is blocked and blocks local handoff request.",
      safety: "This is a local-only preview; no external process has started. External process execution requires approval."
    });
  });

  it("returns waiting when the connection cannot attach and reuses connection detail", () => {
    const snapshot = buildRuntimeLaunchRequestSnapshot(
      bridgeSnapshot,
      {
        ...connectionSnapshot,
        canAttach: false,
        detail: "Adapter is missing required capabilities."
      },
      sourceSnapshot
    );

    expect(snapshot).toEqual({
      id: "source-1:launch-request",
      label: "Primary source launch request",
      state: "waiting",
      requiresApproval: false,
      canRequest: false,
      transport: "runtime-transport",
      eventCount: 2,
      readiness: 78,
      detail: "Adapter is missing required capabilities.",
      safety: "This is a local-only preview; no external process has started. External process execution requires approval."
    });
  });

  it("returns preview when bridge is detached", () => {
    const snapshot = buildRuntimeLaunchRequestSnapshot(
      { ...bridgeSnapshot, attached: false, canStream: false },
      connectionSnapshot,
      sourceSnapshot
    );

    expect(snapshot).toEqual({
      id: "source-1:launch-request",
      label: "Primary source launch request",
      state: "preview",
      requiresApproval: false,
      canRequest: false,
      transport: "runtime-transport",
      eventCount: 2,
      readiness: 78,
      detail: "Attach the local bridge before requesting runtime handoff.",
      safety: "This is a local-only preview; no external process has started. External process execution requires approval."
    });
  });

  it("returns ready when attached and stream-capable with queued events", () => {
    const snapshot = buildRuntimeLaunchRequestSnapshot(
      bridgeSnapshot,
      connectionSnapshot,
      sourceSnapshot
    );

    expect(snapshot).toEqual({
      id: "source-1:launch-request",
      label: "Primary source launch request",
      state: "ready",
      requiresApproval: true,
      canRequest: true,
      transport: "runtime-transport",
      eventCount: 2,
      readiness: 78,
      detail: "Ready to request handoff through runtime-transport.",
      safety: "This is a local-only preview; no external process has started. External process execution requires approval."
    });
  });

  it("returns waiting when no queued events are available", () => {
    const snapshot = buildRuntimeLaunchRequestSnapshot(
      bridgeSnapshot,
      connectionSnapshot,
      { ...sourceSnapshot, available: 0 }
    );

    expect(snapshot).toEqual({
      id: "source-1:launch-request",
      label: "Primary source launch request",
      state: "waiting",
      requiresApproval: false,
      canRequest: false,
      transport: "runtime-transport",
      eventCount: 0,
      readiness: 78,
      detail: "No queued events are available for handoff.",
      safety: "This is a local-only preview; no external process has started. External process execution requires approval."
    });
  });

  it("clamps readiness to 0..100", () => {
    const low = buildRuntimeLaunchRequestSnapshot(
      { ...bridgeSnapshot, readiness: -40 },
      connectionSnapshot,
      sourceSnapshot
    );
    const high = buildRuntimeLaunchRequestSnapshot(
      { ...bridgeSnapshot, readiness: 142 },
      connectionSnapshot,
      sourceSnapshot
    );

    expect(low.readiness).toBe(0);
    expect(high.readiness).toBe(100);
  });

  it("does not mutate input snapshots", () => {
    const bridge: RuntimeAdapterBridgeSnapshot = {
      ...bridgeSnapshot,
      detail: "Bridge snapshot"
    };
    const connection: RuntimeSourceConnectionSnapshot = {
      ...connectionSnapshot,
      requiredCapabilities: [...connectionSnapshot.requiredCapabilities],
      missingCapabilities: [...connectionSnapshot.missingCapabilities],
      detail: "Connection snapshot"
    };
    const source: RuntimeEventSourceSnapshot = {
      ...sourceSnapshot,
      events: [...sourceSnapshot.events]
    };
    const bridgeClone = JSON.parse(JSON.stringify(bridge));
    const connectionClone = JSON.parse(JSON.stringify(connection));
    const sourceClone = JSON.parse(JSON.stringify(source));

    buildRuntimeLaunchRequestSnapshot(bridge, connection, source);

    expect(bridge).toEqual(bridgeClone);
    expect(connection).toEqual(connectionClone);
    expect(source).toEqual(sourceClone);
  });
});
