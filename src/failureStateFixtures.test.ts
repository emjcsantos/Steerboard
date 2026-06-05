import { describe, expect, it } from "vitest";
import {
  buildFailureStateFixtures,
  normalizeFailureStateFixture,
  summarizeFailureStateFixtures,
  FAILURE_STATE_FIXTURES,
  FAILURE_STATE_FIXTURE_ORDER
} from "./failureStateFixtures";

describe("failure state fixtures", () => {
  it("exports all required deterministic fixture ids in fixed order", () => {
    expect(FAILURE_STATE_FIXTURE_ORDER).toEqual([
      "failure-offline-runtime",
      "failure-missing-auth",
      "failure-app-server-unavailable",
      "failure-stream-timeout",
      "failure-unsupported-capability",
      "failure-rate-limit"
    ]);

    const builtIds = FAILURE_STATE_FIXTURES.map((fixture) => fixture.id);
    expect(builtIds).toEqual(FAILURE_STATE_FIXTURE_ORDER);
  });

  it("reports deterministic summary counts, readiness, and top-priority next action", () => {
    const summary = summarizeFailureStateFixtures(FAILURE_STATE_FIXTURES);

    expect(summary.total).toBe(6);
    expect(summary.ready).toBe(0);
    expect(summary.review).toBe(3);
    expect(summary.blocked).toBe(3);
    expect(summary.critical).toBe(2);
    expect(summary.high).toBe(2);
    expect(summary.medium).toBe(2);
    expect(summary.low).toBe(0);
    expect(summary.info).toBe(0);
    expect(summary.state).toBe("blocked");
    expect(summary.statusLabel).toBe("Blocked");
    expect(summary.readiness).toBe(40);
    expect(summary.nextAction.fixtureId).toBe("failure-offline-runtime");
    expect(summary.nextAction.severity).toBe("critical");
  });

  it("enforces next-action priority by state then severity", () => {
    const summary = summarizeFailureStateFixtures(
      buildFailureStateFixtures({
        "failure-offline-runtime": {
          state: "review",
          severity: "low"
        },
        "failure-missing-auth": {
          state: "review",
          severity: "critical"
        },
        "failure-app-server-unavailable": {
          state: "blocked",
          severity: "low",
          nextAction: "Bridge requires manual restart."
        }
      })
    );

    expect(summary.state).toBe("blocked");
    expect(summary.nextAction.fixtureId).toBe("failure-app-server-unavailable");
    expect(summary.nextAction.label).toBe("Bridge requires manual restart.");
    expect(summary.nextAction.state).toBe("blocked");
    expect(summary.nextAction.severity).toBe("low");
  });

  it("marks fixture safety as local-only and keeps provider-neutral fixture data safe", () => {
    const fixtures = buildFailureStateFixtures();

    for (const fixture of fixtures) {
      expect(fixture.providerNeutral).toBe(true);
      expect(fixture.safety).toContain("No process execution");
      expect(fixture.safety).not.toMatch(/https?:\/\/|C:\\|D:\\|[\\/ ]Users[\\/ ]/);
      expect(fixture.detail).not.toMatch(/\r|\n/);
      expect(fixture.nextAction).not.toMatch(/\r|\n/);
      expect(fixture.detail).not.toMatch(/\/tmp\//);
      expect(fixture.nextAction).not.toMatch(/\/tmp\//);
      expect(fixture.detail).not.toMatch(/secret|token|key|credential/i);
      expect(fixture.nextAction).not.toMatch(/secret|token|key|credential/i);
      expect(fixture.detail.toLowerCase()).not.toContain("path:");
    }
  });

  it("keeps ordering stable when building and does not mutate overrides", () => {
    const overrides = {
      "failure-rate-limit": {
        state: "ready",
        nextAction: "Keep checks smooth."
      },
      "failure-offline-runtime": {
        state: "ready"
      }
    } as const;
    const snapshot = structuredClone(overrides);

    const fixtures = buildFailureStateFixtures(overrides);
    const builtIds = fixtures.map((fixture) => fixture.id);

    expect(builtIds).toEqual(FAILURE_STATE_FIXTURE_ORDER);
    expect(overrides).toEqual(snapshot);
  });

  it("repairs invalid fixture inputs during normalization", () => {
    const repaired = normalizeFailureStateFixture({
      id: "failure-offline-runtime",
      label: "   ",
      detail: "",
      nextAction: "\n",
      safety: "   ",
      state: "invalid-state",
      severity: "invalid-severity"
    });

    expect(repaired.label).toBe("Offline runtime");
    expect(repaired.detail).toBe("Runtime transport is unavailable for owner testing.");
    expect(repaired.nextAction).toBe("Restart the local runtime transport and re-check availability before retrying.");
    expect(repaired.safety).toBe("No process execution, filesystem action, or network action is performed by this fixture.");
    expect(repaired.state).toBe("blocked");
    expect(repaired.severity).toBe("critical");
  });

  it("does not mutate input snapshots when summarizing", () => {
    const fixtures = buildFailureStateFixtures();
    const snapshot = structuredClone(fixtures);

    summarizeFailureStateFixtures(fixtures);

    expect(fixtures).toEqual(snapshot);
  });
});
