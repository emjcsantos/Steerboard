import { describe, expect, it } from "vitest";
import type { RuntimeIngestionEvent } from "./runtimeIngestion";
import type { RuntimeEventSourceSnapshot } from "./runtimeEventSource";
import { buildCockpitMonitorNextEventPreview } from "./cockpitMonitorNextEvent";

function makeEvent(overrides: Partial<RuntimeIngestionEvent> = {}): RuntimeIngestionEvent {
  return {
    id: "evt-default",
    sourceEventId: "source-default",
    eventKind: "run",
    label: "Run event label",
    detail: "Run detail payload",
    adapterStatus: "accepted",
    reason: "Run event accepted.",
    sequence: 0,
    ...overrides
  };
}

function makeSourceSnapshot(
  events: RuntimeIngestionEvent[]
): RuntimeEventSourceSnapshot {
  return {
    id: "source-1",
    label: "Runtime event source",
    mode: "mock",
    state: "ready",
    transport: "mock",
    total: events.length,
    available: events.length,
    emitted: 0,
    pending: events.length,
    accepted: 0,
    review: 0,
    blocked: 0,
    nextEventLabel: events[0]?.label ?? "No queued events",
    detail: "Ready.",
    events
  };
}

describe("buildCockpitMonitorNextEventPreview", () => {
  it("returns safe defaults for empty queue", () => {
    const snapshot = makeSourceSnapshot([]);

    const preview = buildCockpitMonitorNextEventPreview(snapshot);

    expect(preview).toEqual({
      hasNext: false,
      label: "No queued local events",
      detail: "Stream queue is clear.",
      status: "empty",
      sequenceLabel: "--"
    });
  });

  it("returns the first remaining queued event", () => {
    const snapshot = makeSourceSnapshot([
      makeEvent({ eventKind: "task", adapterStatus: "review", reason: "first queued reason", sequence: 3 }),
      makeEvent({
        id: "evt-second",
        sourceEventId: "source-second",
        eventKind: "session",
        adapterStatus: "accepted",
        reason: "second queued reason",
        sequence: 4
      })
    ]);

    const preview = buildCockpitMonitorNextEventPreview(snapshot);

    expect(preview.hasNext).toBe(true);
    expect(preview.label).toBe("Task review");
    expect(preview.detail).toBe("first queued reason");
    expect(preview.status).toBe("review");
    expect(preview.sequenceLabel).toBe("#4");
  });

  it("sanitizes path-like detail text", () => {
    const reason = "path/to\\local  event//detail\n  with\\spaces";
    const snapshot = makeSourceSnapshot([makeEvent({ reason })]);

    const preview = buildCockpitMonitorNextEventPreview(snapshot);

    expect(preview.detail).toBe("path to local event detail with spaces");
    expect(preview.detail).not.toContain("/");
    expect(preview.detail).not.toContain("\\");
    expect(preview.detail.length).toBeLessThanOrEqual(96);
  });

  it("normalizes non-finite and negative sequence values", () => {
    const negativeSequence = makeSourceSnapshot([makeEvent({ sequence: -9 })]);
    const nanSequence = makeSourceSnapshot([makeEvent({ sequence: Number.NaN })]);
    const decimalSequence = makeSourceSnapshot([makeEvent({ sequence: 4.8 })]);

    const negativePreview = buildCockpitMonitorNextEventPreview(negativeSequence);
    const nanPreview = buildCockpitMonitorNextEventPreview(nanSequence);
    const decimalPreview = buildCockpitMonitorNextEventPreview(decimalSequence);

    expect(negativePreview.sequenceLabel).toBe("#1");
    expect(nanPreview.sequenceLabel).toBe("#1");
    expect(decimalPreview.sequenceLabel).toBe("#5");
  });

  it("does not expose raw event label or event detail", () => {
    const secretLabel = "SHOULD_NOT_EXPOSE_LABEL_123";
    const secretDetail = "SHOULD_NOT_EXPOSE_DETAIL_456";
    const snapshot = makeSourceSnapshot([
      makeEvent({
        label: secretLabel,
        detail: secretDetail,
        reason: "Queueing review event."
      })
    ]);

    const preview = buildCockpitMonitorNextEventPreview(snapshot);

    expect(preview.label).not.toContain(secretLabel);
    expect(preview.detail).not.toContain(secretLabel);
    expect(preview.label).not.toContain(secretDetail);
    expect(preview.detail).not.toContain(secretDetail);
  });

  it("does not mutate source snapshot input", () => {
    const snapshot: RuntimeEventSourceSnapshot = {
      ...makeSourceSnapshot([
        makeEvent({ reason: "A queued reason" }),
        makeEvent({ id: "evt-second", sourceEventId: "source-second", reason: "Second reason" })
      ])
    };
    const snapshotCopy = JSON.parse(JSON.stringify(snapshot));

    buildCockpitMonitorNextEventPreview(snapshot);

    expect(snapshot).toEqual(snapshotCopy);
  });
});
