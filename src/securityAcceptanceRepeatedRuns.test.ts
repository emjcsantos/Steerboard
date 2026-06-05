import { describe, expect, it } from "vitest";
import type { SecurityAcceptanceCoverageState, SecurityAcceptanceCoverageSnapshot } from "./securityAcceptanceCoverage";
import { createSecurityAcceptanceRepeatedRuns } from "./securityAcceptanceRepeatedRuns";

function snapshotFactory(
  state: SecurityAcceptanceCoverageState
): SecurityAcceptanceCoverageSnapshot {
  return {
    id: `run-${state}`,
    label: `${state} run`,
    state,
    statusLabel: `${state} status`,
    readiness: 0,
    detail: `${state} run detail`,
    safety: "No filesystem action, process action, network action, or release action is performed by this helper.",
    canAdvanceSecurity: false,
    items: [],
    ariaLabel: `${state} run`
  };
}

describe("security acceptance repeated runs", () => {
  it("returns ready for three ready snapshots", () => {
    const snapshot = createSecurityAcceptanceRepeatedRuns([
      snapshotFactory("ready"),
      snapshotFactory("ready"),
      snapshotFactory("ready")
    ]);

    expect(snapshot.state).toBe("ready");
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.canCloseEvidence).toBe(true);
    expect(snapshot.requiredRunCount).toBe(3);
    expect(snapshot.readyRunCount).toBe(3);
    expect(snapshot.reviewedRunCount).toBe(3);
    expect(snapshot.reviewRunCount).toBe(0);
    expect(snapshot.blockedRunCount).toBe(0);
    expect(snapshot.waitingRunCount).toBe(0);
  });

  it("returns review for reviewed runs that have not all passed", () => {
    const snapshot = createSecurityAcceptanceRepeatedRuns([
      snapshotFactory("ready"),
      snapshotFactory("review"),
      snapshotFactory("waiting")
    ]);

    expect(snapshot.state).toBe("review");
    expect(snapshot.readyRunCount).toBe(1);
    expect(snapshot.reviewedRunCount).toBe(2);
    expect(snapshot.readiness).toBe(52);
  });

  it("returns blocked when any blocked run exists", () => {
    const snapshot = createSecurityAcceptanceRepeatedRuns([
      snapshotFactory("blocked"),
      snapshotFactory("ready"),
      snapshotFactory("waiting")
    ]);

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.readiness).toBe(20);
    expect(snapshot.canCloseEvidence).toBe(false);
    expect(snapshot.blockedRunCount).toBe(1);
  });

  it("returns waiting for no reviewed runs and for all waiting runs", () => {
    const emptyRunSnapshots = createSecurityAcceptanceRepeatedRuns();
    const waitingRuns = createSecurityAcceptanceRepeatedRuns([
      snapshotFactory("waiting"),
      snapshotFactory("waiting")
    ]);

    expect(emptyRunSnapshots.state).toBe("waiting");
    expect(emptyRunSnapshots.readiness).toBe(0);
    expect(emptyRunSnapshots.reviewedRunCount).toBe(0);
    expect(waitingRuns.state).toBe("waiting");
    expect(waitingRuns.readiness).toBe(0);
    expect(waitingRuns.reviewedRunCount).toBe(0);
  });

  it("respects custom required run count", () => {
    const snapshot = createSecurityAcceptanceRepeatedRuns(
      [snapshotFactory("ready"), snapshotFactory("ready")],
      { requiredRunCount: 2 }
    );

    expect(snapshot.requiredRunCount).toBe(2);
    expect(snapshot.reviewedRunCount).toBe(2);
    expect(snapshot.state).toBe("ready");
    expect(snapshot.readiness).toBe(100);
  });

  it("keeps item order stable", () => {
    const snapshot = createSecurityAcceptanceRepeatedRuns([
      snapshotFactory("ready"),
      snapshotFactory("review")
    ]);

    expect(snapshot.items.map((item) => item.id)).toEqual([
      "security-acceptance-repeated-runs:run-sample-coverage",
      "security-acceptance-repeated-runs:ready-run-coverage",
      "security-acceptance-repeated-runs:review-run-coverage",
      "security-acceptance-repeated-runs:blocked-run-coverage",
      "security-acceptance-repeated-runs:waiting-run-coverage"
    ]);
  });

  it("does not mutate input snapshots", () => {
    const input: SecurityAcceptanceCoverageSnapshot[] = [
      snapshotFactory("ready"),
      snapshotFactory("review"),
      snapshotFactory("waiting")
    ];
    const before = structuredClone(input);

    createSecurityAcceptanceRepeatedRuns(input);

    expect(input).toEqual(before);
  });

  it("safety text is local-only and read-only", () => {
    const snapshot = createSecurityAcceptanceRepeatedRuns([snapshotFactory("ready")]);

    expect(snapshot.safety).toContain("No filesystem action");
    expect(snapshot.safety).toContain("process action");
    expect(snapshot.safety).toContain("network action");
    expect(snapshot.safety).toContain("release action");
  });
});
