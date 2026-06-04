import { describe, expect, it } from "vitest";
import type { RuntimeIngestionEvent } from "./runtimeIngestion";
import { buildRuntimeStreamSnapshot } from "./runtimeStream";
import { createCockpitMonitorHealth } from "./cockpitMonitorHealth";

function makeEvent(
  id: string,
  adapterStatus: RuntimeIngestionEvent["adapterStatus"]
): RuntimeIngestionEvent {
  return {
    id,
    sourceEventId: `${id}:source`,
    eventKind: "run",
    label: `${id} label`,
    detail: `${id} detail`,
    adapterStatus,
    reason: `${id} reason`,
    sequence: Number(id.replace("evt-", ""))
  };
}

describe("createCockpitMonitorHealth", () => {
  it("returns waiting state for no events and no run", () => {
    const snapshot = buildRuntimeStreamSnapshot([], 0, "idle");
    const health = createCockpitMonitorHealth(snapshot);

    expect(health).toEqual({
      stateLabel: "Waiting",
      detail: "Select or stage a local run.",
      tone: "waiting",
      pulseLabel: "0/0"
    });
  });

  it("returns ready state when local stream is idle with queued events", () => {
    const snapshot = buildRuntimeStreamSnapshot([makeEvent("evt-1", "accepted")], 0, "idle");
    const health = createCockpitMonitorHealth(snapshot);

    expect(health).toEqual({
      stateLabel: "Ready",
      detail: "Attach and start the local stream.",
      tone: "ready",
      pulseLabel: "0/1"
    });
  });

  it("returns live state while streaming", () => {
    const snapshot = buildRuntimeStreamSnapshot(
      [makeEvent("evt-1", "accepted"), makeEvent("evt-2", "accepted")],
      1,
      "streaming"
    );
    const health = createCockpitMonitorHealth(snapshot);

    expect(health).toEqual({
      stateLabel: "Live",
      detail: "Emitting local events now.",
      tone: "live",
      pulseLabel: "1/2"
    });
  });

  it("returns paused state when stream is paused", () => {
    const snapshot = buildRuntimeStreamSnapshot(
      [makeEvent("evt-1", "accepted"), makeEvent("evt-2", "review")],
      0,
      "paused"
    );
    const health = createCockpitMonitorHealth(snapshot);

    expect(health).toEqual({
      stateLabel: "Paused",
      detail: "Stream is paused.",
      tone: "paused",
      pulseLabel: "0/2"
    });
  });

  it("returns complete state when stream is complete", () => {
    const snapshot = buildRuntimeStreamSnapshot(
      [makeEvent("evt-1", "accepted"), makeEvent("evt-2", "accepted")],
      2,
      "streaming"
    );
    const health = createCockpitMonitorHealth(snapshot);

    expect(health).toEqual({
      stateLabel: "Complete",
      detail: "All queued events emitted.",
      tone: "complete",
      pulseLabel: "2/2"
    });
  });

  it("returns blocked state when stream is blocked or blocked count is positive", () => {
    const snapshot = {
      ...buildRuntimeStreamSnapshot(
        [makeEvent("evt-1", "accepted"), makeEvent("evt-2", "accepted")],
        2,
        "streaming"
      ),
      blocked: 1
    };
    const health = createCockpitMonitorHealth(snapshot);

    expect(health).toEqual({
      stateLabel: "Blocked",
      detail: "Local adapter review is blocking the stream.",
      tone: "blocked",
      pulseLabel: "2/2"
    });
  });
});
