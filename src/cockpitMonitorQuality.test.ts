import { describe, expect, it } from "vitest";
import type { RuntimeIngestionEvent } from "./runtimeIngestion";
import { buildRuntimeStreamSnapshot } from "./runtimeStream";
import { createCockpitMonitorQuality } from "./cockpitMonitorQuality";

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

describe("createCockpitMonitorQuality", () => {
  it("returns waiting signal for empty emissions", () => {
    const snapshot = buildRuntimeStreamSnapshot([], 0, "idle");

    const quality = createCockpitMonitorQuality(snapshot);

    expect(quality).toEqual({
      label: "No quality signal",
      detail: "Quality appears after local events are emitted.",
      tone: "waiting",
      readinessLabel: "0%",
      metrics: [
        { label: "Accepted", value: "0", tone: "accepted" },
        { label: "Review", value: "0", tone: "review" },
        { label: "Blocked", value: "0", tone: "blocked" }
      ]
    });
  });

  it("returns clean signal when emitted events are all accepted", () => {
    const snapshot = buildRuntimeStreamSnapshot(
      [makeEvent("evt-1", "accepted"), makeEvent("evt-2", "accepted")],
      2,
      "streaming"
    );

    const quality = createCockpitMonitorQuality(snapshot);

    expect(quality).toEqual({
      label: "Clean stream",
      detail: "All emitted local events are accepted.",
      tone: "clean",
      readinessLabel: "100%",
      metrics: [
        { label: "Accepted", value: "2", tone: "accepted" },
        { label: "Review", value: "0", tone: "review" },
        { label: "Blocked", value: "0", tone: "blocked" }
      ]
    });
  });

  it("returns review signal when any reviewed events are emitted", () => {
    const snapshot = buildRuntimeStreamSnapshot(
      [makeEvent("evt-1", "accepted"), makeEvent("evt-2", "review"), makeEvent("evt-3", "accepted")],
      2,
      "streaming"
    );
    const quality = createCockpitMonitorQuality(snapshot);

    expect(quality).toEqual({
      label: "Review needed",
      detail: "Some local events are waiting for review.",
      tone: "review",
      readinessLabel: "50%",
      metrics: [
        { label: "Accepted", value: "1", tone: "accepted" },
        { label: "Review", value: "1", tone: "review" },
        { label: "Blocked", value: "0", tone: "blocked" }
      ]
    });
  });

  it("returns blocked signal when blocked count is positive", () => {
    const snapshot = buildRuntimeStreamSnapshot(
      [makeEvent("evt-1", "accepted"), makeEvent("evt-2", "blocked"), makeEvent("evt-3", "review")],
      2,
      "streaming"
    );

    const quality = createCockpitMonitorQuality(snapshot);

    expect(quality).toEqual({
      label: "Blocked events",
      detail: "Blocked local events need operator review.",
      tone: "blocked",
      readinessLabel: "50%",
      metrics: [
        { label: "Accepted", value: "1", tone: "accepted" },
        { label: "Review", value: "0", tone: "review" },
        { label: "Blocked", value: "1", tone: "blocked" }
      ]
    });
  });

  it("returns blocked signal when stream state is blocked", () => {
    const snapshot = buildRuntimeStreamSnapshot([makeEvent("evt-1", "accepted")], 1, "blocked");

    const quality = createCockpitMonitorQuality(snapshot);

    expect(quality).toEqual({
      label: "Blocked events",
      detail: "Blocked local events need operator review.",
      tone: "blocked",
      readinessLabel: "100%",
      metrics: [
        { label: "Accepted", value: "1", tone: "accepted" },
        { label: "Review", value: "0", tone: "review" },
        { label: "Blocked", value: "0", tone: "blocked" }
      ]
    });
  });

  it("sanitizes counts and clamps readiness to 0..100", () => {
    const snapshot = {
      ...buildRuntimeStreamSnapshot(
        [makeEvent("evt-1", "accepted"), makeEvent("evt-2", "accepted")],
        2,
        "streaming"
      ),
      accepted: 2.9,
      review: -4.2,
      blocked: Infinity,
      readiness: 123.4
    };

    const quality = createCockpitMonitorQuality(snapshot);

    expect(quality.readinessLabel).toBe("100%");
    expect(quality.metrics).toEqual([
      { label: "Accepted", value: "2", tone: "accepted" },
      { label: "Review", value: "0", tone: "review" },
      { label: "Blocked", value: "0", tone: "blocked" }
    ]);
  });

  it("orders metrics as Accepted, Review, Blocked", () => {
    const snapshot = buildRuntimeStreamSnapshot(
      [
        makeEvent("evt-1", "accepted"),
        makeEvent("evt-2", "review"),
        makeEvent("evt-3", "blocked")
      ],
      3,
      "streaming"
    );

    const quality = createCockpitMonitorQuality(snapshot);

    expect(quality.metrics[0].label).toBe("Accepted");
    expect(quality.metrics[1].label).toBe("Review");
    expect(quality.metrics[2].label).toBe("Blocked");
  });
});
