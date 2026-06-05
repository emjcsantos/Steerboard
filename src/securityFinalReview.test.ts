import { describe, expect, it } from "vitest";
import { createSecurityFinalReview } from "./securityFinalReview";

describe("security final review", () => {
  it("returns ready/100 when all evidence is ready", () => {
    const snapshot = createSecurityFinalReview({
      releasePrivacy: {
        id: "release",
        label: "release privacy",
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canRecommendRelease: true,
        detail: "",
        safety: "",
        items: [],
        ariaLabel: ""
      },
      currentAcceptance: {
        id: "current",
        label: "current security acceptance",
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        detail: "",
        safety: "",
        canAdvanceSecurity: true,
        items: [],
        ariaLabel: ""
      },
      repeatedRuns: {
        id: "repeated",
        label: "repeated runs",
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        reviewedRunCount: 3,
        requiredRunCount: 3,
        readyRunCount: 3,
        reviewRunCount: 0,
        blockedRunCount: 0,
        waitingRunCount: 0,
        canCloseEvidence: true,
        detail: "",
        safety: "",
        items: [],
        ariaLabel: ""
      },
      packagingPaused: true,
      packagingLocked: true
    });

    expect(snapshot.state).toBe("ready");
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.canCloseSecurity).toBe(true);
    expect(snapshot.canResumePackaging).toBe(false);
    expect(snapshot.items[4].status).toBe("ready");
    expect(snapshot.items.every((item) => item.status === "ready")).toBe(true);
  });

  it("returns waiting when evidence is missing", () => {
    const snapshot = createSecurityFinalReview();

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.readiness).toBe(0);
    expect(snapshot.canCloseSecurity).toBe(false);
    expect(snapshot.items.every((item) => item.status === "waiting")).toBe(true);
  });

  it("returns blocked when any major evidence item is blocked", () => {
    const snapshot = createSecurityFinalReview({
      releasePrivacy: {
        id: "release",
        label: "release privacy",
        state: "blocked",
        statusLabel: "Blocked",
        readiness: 10,
        canRecommendRelease: false,
        detail: "",
        safety: "",
        items: [],
        ariaLabel: ""
      },
      currentAcceptance: {
        id: "current",
        label: "current security acceptance",
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        detail: "",
        safety: "",
        canAdvanceSecurity: true,
        items: [],
        ariaLabel: ""
      },
      repeatedRuns: {
        id: "repeated",
        label: "repeated runs",
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        reviewedRunCount: 3,
        requiredRunCount: 3,
        readyRunCount: 3,
        reviewRunCount: 0,
        blockedRunCount: 0,
        waitingRunCount: 0,
        canCloseEvidence: true,
        detail: "",
        safety: "",
        items: [],
        ariaLabel: ""
      },
      packagingPaused: true,
      packagingLocked: true
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.readiness).toBe(20);
    expect(snapshot.canCloseSecurity).toBe(false);
    expect(snapshot.items[4].status).toBe("blocked");
  });

  it("returns blocked when packaging is false", () => {
    const snapshot = createSecurityFinalReview({
      releasePrivacy: {
        id: "release",
        label: "release privacy",
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canRecommendRelease: true,
        detail: "",
        safety: "",
        items: [],
        ariaLabel: ""
      },
      currentAcceptance: {
        id: "current",
        label: "current security acceptance",
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        detail: "",
        safety: "",
        canAdvanceSecurity: true,
        items: [],
        ariaLabel: ""
      },
      repeatedRuns: {
        id: "repeated",
        label: "repeated runs",
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        reviewedRunCount: 3,
        requiredRunCount: 3,
        readyRunCount: 3,
        reviewRunCount: 0,
        blockedRunCount: 0,
        waitingRunCount: 0,
        canCloseEvidence: true,
        detail: "",
        safety: "",
        items: [],
        ariaLabel: ""
      },
      packagingPaused: true,
      packagingLocked: false
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.items[3].status).toBe("blocked");
    expect(snapshot.readiness).toBe(20);
  });

  it("returns review for partial-ready evidence", () => {
    const snapshot = createSecurityFinalReview({
      releasePrivacy: {
        id: "release",
        label: "release privacy",
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canRecommendRelease: true,
        detail: "",
        safety: "",
        items: [],
        ariaLabel: ""
      },
      currentAcceptance: {
        id: "current",
        label: "current security acceptance",
        state: "review",
        statusLabel: "Needs review",
        readiness: 50,
        detail: "",
        safety: "",
        canAdvanceSecurity: false,
        items: [],
        ariaLabel: ""
      },
      repeatedRuns: {
        id: "repeated",
        label: "repeated runs",
        state: "waiting",
        statusLabel: "Waiting",
        readiness: 0,
        reviewedRunCount: 0,
        requiredRunCount: 3,
        readyRunCount: 0,
        reviewRunCount: 0,
        blockedRunCount: 0,
        waitingRunCount: 0,
        canCloseEvidence: false,
        detail: "",
        safety: "",
        items: [],
        ariaLabel: ""
      },
      packagingPaused: true,
      packagingLocked: true
    });

    expect(snapshot.state).toBe("review");
    expect(snapshot.canCloseSecurity).toBe(false);
    expect(snapshot.items[4].status).toBe("review");
  });

  it("preserves stable item order", () => {
    const snapshot = createSecurityFinalReview({
      releasePrivacy: {
        id: "release",
        label: "release privacy",
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        canRecommendRelease: true,
        detail: "",
        safety: "",
        items: [],
        ariaLabel: ""
      },
      currentAcceptance: {
        id: "current",
        label: "current security acceptance",
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        detail: "",
        safety: "",
        canAdvanceSecurity: true,
        items: [],
        ariaLabel: ""
      },
      repeatedRuns: {
        id: "repeated",
        label: "repeated runs",
        state: "ready",
        statusLabel: "Ready",
        readiness: 100,
        reviewedRunCount: 3,
        requiredRunCount: 3,
        readyRunCount: 3,
        reviewRunCount: 0,
        blockedRunCount: 0,
        waitingRunCount: 0,
        canCloseEvidence: true,
        detail: "",
        safety: "",
        items: [],
        ariaLabel: ""
      },
      packagingPaused: true,
      packagingLocked: true
    });

    expect(snapshot.items.map((item) => item.id)).toEqual([
      "security-final-review:release-privacy-review",
      "security-final-review:current-security-acceptance",
      "security-final-review:repeated-evidence-closure",
      "security-final-review:packaging-pause-lock",
      "security-final-review:final-security-closure"
    ]);
  });

  it("does not mutate input evidence object", () => {
    const evidence = {
      releasePrivacy: {
        id: "release",
        label: "release privacy",
        state: "ready" as const,
        statusLabel: "Ready",
        readiness: 100,
        canRecommendRelease: true,
        detail: "",
        safety: "",
        items: [],
        ariaLabel: ""
      },
      currentAcceptance: {
        id: "current",
        label: "current security acceptance",
        state: "ready" as const,
        statusLabel: "Ready",
        readiness: 100,
        detail: "",
        safety: "",
        canAdvanceSecurity: true,
        items: [],
        ariaLabel: ""
      },
      repeatedRuns: {
        id: "repeated",
        label: "repeated runs",
        state: "ready" as const,
        statusLabel: "Ready",
        readiness: 100,
        reviewedRunCount: 3,
        requiredRunCount: 3,
        readyRunCount: 3,
        reviewRunCount: 0,
        blockedRunCount: 0,
        waitingRunCount: 0,
        canCloseEvidence: true,
        detail: "",
        safety: "",
        items: [],
        ariaLabel: ""
      },
      packagingPaused: true,
      packagingLocked: true
    };
    const clone = structuredClone(evidence);

    createSecurityFinalReview(evidence);

    expect(evidence).toEqual(clone);
  });

  it("is read-only and no side-effect oriented in safety text", () => {
    const snapshot = createSecurityFinalReview();

    expect(snapshot.safety).toContain("No filesystem action");
    expect(snapshot.safety).toContain("process action");
    expect(snapshot.safety).toContain("network action");
    expect(snapshot.safety).toContain("release action");
    expect(snapshot.safety).toContain("packaging action");
    expect(snapshot.safety).not.toContain("write");
  });
});
