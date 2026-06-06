import { describe, expect, it } from "vitest";
import { buildCockpitMonitorEventFeed } from "./cockpitMonitorEventFeed";
import type { RuntimeIngestionEvent } from "./runtimeIngestion";
import { buildRuntimeStreamSnapshot } from "./runtimeStream";

function makeEvent(
  id: string,
  eventKind: RuntimeIngestionEvent["eventKind"],
  adapterStatus: RuntimeIngestionEvent["adapterStatus"],
  sequence: number
): RuntimeIngestionEvent {
  return {
    id,
    sourceEventId: `${id}:source`,
    eventKind,
    label: `${id} raw label`,
    detail: `${id} raw detail`,
    adapterStatus,
    reason: `${adapterStatus} reason`,
    sequence
  };
}

describe("Arena monitor event feed", () => {
  it("returns the newest three emitted events first by default", () => {
    const events = [
      makeEvent("evt-1", "run", "accepted", 0),
      makeEvent("evt-2", "task", "review", 1),
      makeEvent("evt-3", "validation", "accepted", 2),
      makeEvent("evt-4", "session", "blocked", 3)
    ];
    const snapshot = buildRuntimeStreamSnapshot(events, 4, "paused");

    const feed = buildCockpitMonitorEventFeed(snapshot);

    expect(feed).toEqual([
      {
        id: "evt-4",
        label: "Session blocked",
        detail: "blocked reason",
        status: "blocked",
        sequenceLabel: "#4"
      },
      {
        id: "evt-3",
        label: "Validation accepted",
        detail: "accepted reason",
        status: "accepted",
        sequenceLabel: "#3"
      },
      {
        id: "evt-2",
        label: "Task review",
        detail: "review reason",
        status: "review",
        sequenceLabel: "#2"
      }
    ]);
  });

  it("honors custom limits and caps the feed at five events", () => {
    const events = Array.from({ length: 7 }, (_, index) =>
      makeEvent(`evt-${index + 1}`, "task", "accepted", index)
    );
    const snapshot = buildRuntimeStreamSnapshot(events, 7, "paused");

    expect(buildCockpitMonitorEventFeed(snapshot, { limit: 2 })).toHaveLength(2);
    expect(buildCockpitMonitorEventFeed(snapshot, { limit: 99 })).toHaveLength(5);
    expect(buildCockpitMonitorEventFeed(snapshot, { limit: 2.9 })).toHaveLength(2);
    expect(buildCockpitMonitorEventFeed(snapshot, { limit: 0 })).toHaveLength(3);
    expect(buildCockpitMonitorEventFeed(snapshot, { limit: Number.NaN })).toHaveLength(3);
  });

  it("returns an empty feed when no events have emitted", () => {
    const snapshot = buildRuntimeStreamSnapshot(
      [makeEvent("evt-1", "run", "accepted", 0)],
      0,
      "idle"
    );

    expect(buildCockpitMonitorEventFeed(snapshot)).toEqual([]);
  });

  it("sanitizes path-like details and normalizes unsafe sequence values", () => {
    const event = {
      ...makeEvent("evt-private", "validation", "blocked", Number.NaN),
      reason: "C:\\private\\source failed /tmp/file.ts"
    };
    const snapshot = buildRuntimeStreamSnapshot([event], 1, "paused");
    const [item] = buildCockpitMonitorEventFeed(snapshot);

    expect(item.detail).toBe("C: private source failed tmp file.ts");
    expect(item.sequenceLabel).toBe("#1");
    expect(item.detail).not.toContain("/");
    expect(item.detail).not.toContain("\\");
  });

  it("does not mutate the stream snapshot or emitted events", () => {
    const events = [
      makeEvent("evt-1", "run", "accepted", 0),
      makeEvent("evt-2", "task", "review", 1)
    ];
    const snapshot = buildRuntimeStreamSnapshot(events, 2, "paused");
    const snapshotCopy = structuredClone(snapshot);

    buildCockpitMonitorEventFeed(snapshot);

    expect(snapshot).toEqual(snapshotCopy);
  });
});
