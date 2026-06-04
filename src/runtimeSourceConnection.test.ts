import { describe, expect, it } from "vitest";
import { buildRuntimeSourceConnectionSnapshot } from "./runtimeSourceConnection";
import type { RuntimeAdapter } from "./runtime";
import type { RuntimeEventSourceSnapshot } from "./runtimeEventSource";
import type { RuntimeIngestionEvent } from "./runtimeIngestion";

function makeEvent(id: string, kind: RuntimeIngestionEvent["eventKind"]): RuntimeIngestionEvent {
  return {
    id,
    sourceEventId: `${id}-source`,
    eventKind: kind,
    label: `${id} label`,
    detail: `${id} detail`,
    adapterStatus: "accepted",
    reason: "Accepted",
    sequence: Number(id)
  };
}

const baseSource: RuntimeEventSourceSnapshot = {
  id: "source-1",
  label: "Source",
  mode: "mock",
  state: "ready",
  transport: "mock-transport",
  total: 2,
  available: 2,
  emitted: 0,
  pending: 2,
  accepted: 0,
  review: 0,
  blocked: 0,
  nextEventLabel: "Run event",
  detail: "Ready on mock-transport.",
  events: [makeEvent("1", "run"), makeEvent("2", "validation")]
};

const baseAdapter: RuntimeAdapter = {
  id: "adapter-1",
  label: "Local adapter",
  state: "ready",
  readiness: 91,
  transport: "remote-proxy",
  capabilities: ["Session stream", "Validation evidence", "Task state"],
  requiredPermissions: ["workspace_read", "process"],
  permissions: [
    {
      permission: "workspace_read",
      status: "enabled"
    },
    {
      permission: "process",
      status: "enabled"
    }
  ]
};

describe("runtime source connection snapshot", () => {
  it("uses mock state and marks all required capabilities as missing when no adapter exists", () => {
    const source = {
      ...baseSource,
      events: [makeEvent("1", "run"), makeEvent("2", "session"), makeEvent("3", "validation")]
    };

    const snapshot = buildRuntimeSourceConnectionSnapshot(undefined, source);

    expect(snapshot).toEqual({
      id: "source-1:connection",
      label: "Source connection",
      state: "mock",
      canAttach: false,
      transport: "mock-transport",
      readiness: 0,
      requiredCapabilities: ["Session stream", "Validation evidence"],
      missingCapabilities: ["Session stream", "Validation evidence"],
      enabledPermissions: 0,
      requiredPermissions: 0,
      detail: "Using local event queue until an adapter is configured."
    });
  });

  it("forces blocked state when source is blocked", () => {
    const snapshot = buildRuntimeSourceConnectionSnapshot(
      {
        ...baseAdapter,
        readiness: 55,
        capabilities: ["Session stream"]
      },
      {
        ...baseSource,
        state: "blocked",
        available: 2,
        events: [makeEvent("1", "run")]
      }
    );

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.readiness).toBe(0);
    expect(snapshot.canAttach).toBe(false);
    expect(snapshot.missingCapabilities).toEqual([]);
    expect(snapshot.detail).toBe("Connection is blocked by the event source.");
  });

  it("forces blocked state when adapter is blocked", () => {
    const snapshot = buildRuntimeSourceConnectionSnapshot(
      {
        ...baseAdapter,
        state: "blocked",
        readiness: 120,
        capabilities: []
      },
      {
        ...baseSource,
        events: [makeEvent("1", "run")]
      }
    );

    expect(snapshot).toEqual({
      id: "source-1:connection",
      label: "Source connection",
      state: "blocked",
      canAttach: false,
      transport: "remote-proxy",
      readiness: 100,
      requiredCapabilities: ["Session stream"],
      missingCapabilities: ["Session stream"],
      enabledPermissions: 2,
      requiredPermissions: 2,
      detail: "Connection is blocked by adapter state."
    });
  });

  it.each(["checking", "limited", "not_configured"] as const)(
    "maps adapter state %s to waiting",
    (adapterState) => {
      const snapshot = buildRuntimeSourceConnectionSnapshot(
        {
          ...baseAdapter,
          state: adapterState,
          readiness: 210
        },
        {
          ...baseSource,
          events: [makeEvent("1", "run")]
        }
      );

      expect(snapshot.state).toBe("waiting");
      expect(snapshot.canAttach).toBe(false);
      expect(snapshot.readiness).toBe(100);
      expect(snapshot.detail).toBe("Adapter connection is waiting for setup.");
    }
  );

  it("allows attachment when ready adapter has all capabilities and process permission", () => {
    const snapshot = buildRuntimeSourceConnectionSnapshot(
      {
        ...baseAdapter,
        state: "ready",
        readiness: 77,
        capabilities: ["Session stream", "Validation evidence", "Task state"],
        requiredPermissions: ["workspace_read", "process", "network"],
        permissions: [
          {
            permission: "workspace_read",
            status: "enabled"
          },
          {
            permission: "process",
            status: "enabled"
          },
          {
            permission: "network",
            status: "disabled"
          }
        ]
      },
      {
        ...baseSource,
        available: 3,
        events: [makeEvent("1", "run"), makeEvent("2", "validation")]
      }
    );

    expect(snapshot.state).toBe("ready");
    expect(snapshot.canAttach).toBe(true);
    expect(snapshot.detail).toBe("Ready to attach via remote-proxy.");
    expect(snapshot.enabledPermissions).toBe(2);
    expect(snapshot.requiredPermissions).toBe(3);
    expect(snapshot.missingCapabilities).toEqual([]);
  });

  it("waits when ready adapter lacks required capabilities", () => {
    const snapshot = buildRuntimeSourceConnectionSnapshot(
      {
        ...baseAdapter,
        state: "ready",
        capabilities: ["Session stream", "Task state"],
        requiredPermissions: ["workspace_read"]
      },
      {
        ...baseSource,
        available: 1,
        events: [makeEvent("1", "run"), makeEvent("2", "validation")]
      }
    );

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.canAttach).toBe(false);
    expect(snapshot.missingCapabilities).toEqual(["Validation evidence"]);
    expect(snapshot.detail).toBe("Adapter is missing required event capabilities.");
  });

  it("waits when required process permission is not enabled", () => {
    const snapshot = buildRuntimeSourceConnectionSnapshot(
      {
        ...baseAdapter,
        state: "ready",
        readiness: 90,
        permissions: [
          {
            permission: "workspace_read",
            status: "enabled"
          },
          {
            permission: "process",
            status: "review"
          }
        ]
      },
      {
        ...baseSource,
        available: 1,
        events: [makeEvent("1", "run")]
      }
    );

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.canAttach).toBe(false);
    expect(snapshot.detail).toBe("Adapter process permission is not enabled.");
  });

  it("waits when there are no queued source events", () => {
    const snapshot = buildRuntimeSourceConnectionSnapshot(
      {
        ...baseAdapter,
        state: "ready"
      },
      {
        ...baseSource,
        available: 0,
        events: [makeEvent("1", "run")]
      }
    );

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.canAttach).toBe(false);
    expect(snapshot.detail).toBe("No queued events are ready to attach.");
  });

  it("preserves first-seen order and removes duplicate required capabilities", () => {
    const events: RuntimeIngestionEvent[] = [
      makeEvent("1", "session"),
      makeEvent("2", "run"),
      makeEvent("3", "validation"),
      makeEvent("4", "task"),
      makeEvent("5", "validation")
    ];

    const snapshot = buildRuntimeSourceConnectionSnapshot(
      {
        ...baseAdapter,
        state: "ready",
        capabilities: ["Session stream", "Validation evidence", "Task state"]
      },
      {
        ...baseSource,
        events
      }
    );

    expect(snapshot.requiredCapabilities).toEqual([
      "Session stream",
      "Validation evidence",
      "Task state"
    ]);
  });

  it("does not mutate adapter, source, or events inputs", () => {
    const adapter: RuntimeAdapter = {
      ...baseAdapter,
      permissions: [...baseAdapter.permissions],
      capabilities: [...baseAdapter.capabilities],
      requiredPermissions: [...baseAdapter.requiredPermissions]
    };
    const source: RuntimeEventSourceSnapshot = {
      ...baseSource,
      events: [...baseSource.events],
      state: "ready"
    };
    const events: RuntimeIngestionEvent[] = [
      { ...source.events[0] },
      { ...source.events[1] }
    ];

    const adapterSnapshot = JSON.parse(JSON.stringify(adapter));
    const sourceSnapshot = JSON.parse(JSON.stringify(source));
    const eventsSnapshot = JSON.parse(JSON.stringify(events));

    buildRuntimeSourceConnectionSnapshot(
      {
        ...adapter,
        permissions: [...adapter.permissions],
        capabilities: [...adapter.capabilities],
        requiredPermissions: [...adapter.requiredPermissions]
      },
      {
        ...source,
        events
      }
    );

    expect(adapter).toEqual(adapterSnapshot);
    expect(source).toEqual(sourceSnapshot);
    expect(events).toEqual(eventsSnapshot);
  });
});
