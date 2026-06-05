import { describe, expect, it } from "vitest";
import { createSecurityAcceptanceCoverage } from "./securityAcceptanceCoverage";

describe("security acceptance coverage", () => {
  it("returns ready/100 when all evidence is ready", () => {
    const snapshot = createSecurityAcceptanceCoverage({
      hasSelectedRun: true,
      selectedRunStatus: "running",
      releasePrivacyState: "ready",
      releasePrivacyReadiness: 100,
      realProjectDataReady: true,
      runtimeAdapterEdgesReady: true,
      auditReviewReady: true
    });

    expect(snapshot.state).toBe("ready");
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.canAdvanceSecurity).toBe(true);
    expect(snapshot.items.every((item) => item.status === "ready")).toBe(true);
  });

  it("returns waiting/0 when evidence is missing", () => {
    const snapshot = createSecurityAcceptanceCoverage();

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.readiness).toBe(0);
    expect(snapshot.canAdvanceSecurity).toBe(false);
    expect(snapshot.items.every((item) => item.status === "waiting")).toBe(true);
  });

  it("returns review when evidence indicates review is needed", () => {
    const snapshot = createSecurityAcceptanceCoverage({
      hasSelectedRun: true,
      selectedRunStatus: "running",
      releasePrivacyState: "review",
      realProjectDataReady: "review",
      runtimeAdapterEdgesReady: true,
      auditReviewReady: true
    });

    expect(snapshot.state).toBe("review");
    expect(snapshot.readiness).toBe(80);
    expect(snapshot.canAdvanceSecurity).toBe(false);
    expect(
      snapshot.items.some((item) => item.label === "Release privacy readiness")
    ).toBe(true);
  });

  it("returns blocked when release privacy is blocked", () => {
    const snapshot = createSecurityAcceptanceCoverage({
      hasSelectedRun: true,
      selectedRunStatus: "running",
      releasePrivacyState: "blocked",
      realProjectDataReady: true,
      runtimeAdapterEdgesReady: true,
      auditReviewReady: true
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.readiness).toBe(80);
    expect(snapshot.canAdvanceSecurity).toBe(false);
  });

  it("returns blocked when selected run status is failed", () => {
    const snapshot = createSecurityAcceptanceCoverage({
      hasSelectedRun: true,
      selectedRunStatus: "failed",
      releasePrivacyState: "ready",
      realProjectDataReady: true,
      runtimeAdapterEdgesReady: true,
      auditReviewReady: true
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.readiness).toBe(80);
  });

  it("preserves stable item order", () => {
    const snapshot = createSecurityAcceptanceCoverage({
      hasSelectedRun: true,
      selectedRunStatus: "running",
      releasePrivacyState: "ready",
      realProjectDataReady: true,
      runtimeAdapterEdgesReady: "ready",
      auditReviewReady: "ready"
    });

    expect(snapshot.items.map((item) => item.id)).toEqual([
      "security-acceptance-coverage:live-cockpit-run-selected",
      "security-acceptance-coverage:release-privacy-readiness",
      "security-acceptance-coverage:real-project-data-boundary",
      "security-acceptance-coverage:runtime-adapter-edge-evidence",
      "security-acceptance-coverage:audit-review-trail"
    ]);
  });

  it("does not mutate input evidence object", () => {
    const evidence = {
      hasSelectedRun: true,
      selectedRunStatus: "running",
      releasePrivacyState: "ready" as const,
      releasePrivacyReadiness: 88,
      realProjectDataReady: true,
      runtimeAdapterEdgesReady: true,
      auditReviewReady: true
    } as const;
    const clone = structuredClone(evidence);

    createSecurityAcceptanceCoverage(evidence);

    expect(evidence).toEqual(clone);
  });

  it("is read-only and no side-effect oriented in safety text", () => {
    const snapshot = createSecurityAcceptanceCoverage();

    expect(snapshot.safety).toContain("No filesystem action");
    expect(snapshot.safety).toContain("process action");
    expect(snapshot.safety).toContain("network action");
    expect(snapshot.safety).toContain("release action");
    expect(snapshot.safety).not.toContain("delete");
  });
});
