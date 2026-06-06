import { describe, expect, it } from "vitest";
import type { CockpitInteractionReadiness } from "./cockpitInteractionReadiness";
import type { CockpitModeHandoffQa } from "./cockpitModeHandoffQa";
import type { CockpitMonitorDepth } from "./cockpitMonitorDepth";
import { createCockpitAcceptancePass } from "./cockpitAcceptancePass";

function buildMonitorDepth(
  overrides: Partial<CockpitMonitorDepth> = {}
): CockpitMonitorDepth {
  return {
    label: "Monitor depth",
    detail: "Monitor depth is visible.",
    tone: "deep",
    signalLabel: "5/5 signals",
    eventLabel: "2 recent",
    gateLabel: "2/3 gates",
    scorePercent: 100,
    scoreValue: "100%",
    ...overrides
  };
}

function buildModeQa(overrides: Partial<CockpitModeHandoffQa> = {}): CockpitModeHandoffQa {
  return {
    label: "Mode QA",
    detail: "Mode handoff QA detail.",
    tone: "ready",
    checkLabel: "2/3 panels",
    checks: [],
    ariaLabel: "Mode QA ready",
    ...overrides
  };
}

function buildInteractionReadiness(
  overrides: Partial<CockpitInteractionReadiness> = {}
): CockpitInteractionReadiness {
  return {
    label: "Interaction readiness",
    detail: "Interaction is ready.",
    tone: "ready",
    checkLabel: "4/4 controls",
    checks: [],
    ariaLabel: "Interaction readiness",
    ...overrides
  };
}

describe("createCockpitAcceptancePass", () => {
  it("returns accepted when all gates are ok", () => {
    const result = createCockpitAcceptancePass({
      interactionReadiness: buildInteractionReadiness({ checkLabel: "4/4 controls" }),
      modeHandoffQa: buildModeQa({ checkLabel: "3/3 panels" }),
      monitorDepth: buildMonitorDepth({ tone: "deep", scoreValue: "100%" })
    });

    expect(result).toEqual({
      label: "Arena acceptance passed",
      detail:
        "Desktop, narrow-pane, monitor, mode, and interaction gates are ready to close.",
      tone: "accepted",
      checkLabel: "4/4 gates",
      checks: [
        { label: "Monitor", value: "100%", tone: "ok" },
        { label: "Mode QA", value: "3/3 panels", tone: "ok" },
        { label: "Interaction", value: "4/4 controls", tone: "ok" },
        { label: "Acceptance", value: "Desktop + narrow", tone: "ok" }
      ],
      ariaLabel:
        "Arena acceptance passed: 4/4 gates; Monitor 100%; Mode QA 3/3 panels; Interaction 4/4 controls; Acceptance Desktop + narrow"
    });
  });

  it.each([
    { blockedSource: "Monitor", monitorTone: "blocked", modeTone: "ready", interactionTone: "ready" },
    { blockedSource: "Mode QA", monitorTone: "deep", modeTone: "blocked", interactionTone: "ready" },
    { blockedSource: "Interaction", monitorTone: "deep", modeTone: "ready", interactionTone: "blocked" }
  ] as const)(
    "returns blocked when $blockedSource is blocked",
    ({ blockedSource, monitorTone, modeTone, interactionTone }) => {
      const result = createCockpitAcceptancePass({
        interactionReadiness: buildInteractionReadiness({ tone: interactionTone }),
        modeHandoffQa: buildModeQa({ tone: modeTone }),
        monitorDepth: buildMonitorDepth({ tone: monitorTone })
      });

      expect(result.tone).toBe("blocked");
      expect(result.checks.find((check) => check.label === blockedSource)?.tone).toBe("blocked");
      expect(result.checks[3].tone).toBe("blocked");
      expect(result.checkLabel).toBe("2/4 gates");
    }
  );

  it.each([
    { neutralSource: "monitor", monitorTone: "shallow", modeTone: "ready", interactionTone: "ready" },
    { neutralSource: "mode", monitorTone: "deep", modeTone: "idle", interactionTone: "ready" },
    { neutralSource: "interaction", monitorTone: "deep", modeTone: "ready", interactionTone: "idle" }
  ] as const)(
    "returns waiting when $neutralSource has neutral state",
    ({ monitorTone, modeTone, interactionTone }) => {
      const result = createCockpitAcceptancePass({
        interactionReadiness: buildInteractionReadiness({ tone: interactionTone }),
        modeHandoffQa: buildModeQa({ tone: modeTone }),
        monitorDepth: buildMonitorDepth({ tone: monitorTone })
      });

      expect(result.tone).toBe("waiting");
      expect(result.checks.find((check) => check.tone === "neutral")).toBeTruthy();
      expect(result.checks[3].tone).toBe("ok");
    }
  );

  it.each([
    { reviewedSource: "mode", monitorTone: "steady", modeTone: "review", interactionTone: "ready" },
    { reviewedSource: "interaction", monitorTone: "deep", modeTone: "ready", interactionTone: "review" }
  ] as const)(
    "returns review when $reviewedSource requires review",
    ({ reviewedSource, monitorTone, modeTone, interactionTone }) => {
      const result = createCockpitAcceptancePass({
        interactionReadiness: buildInteractionReadiness({ tone: interactionTone }),
        modeHandoffQa: buildModeQa({ tone: modeTone }),
        monitorDepth: buildMonitorDepth({ tone: monitorTone })
      });
      const reviewCheckLabel = reviewedSource === "mode" ? "Mode QA" : "Interaction";

      expect(result.tone).toBe("review");
      expect(result.checks.find((check) => check.label === reviewCheckLabel)?.tone).toBe("review");
      expect(result.checks[3].tone).toBe("review");
    }
  );

  it("keeps exact check order and computes checkLabel", () => {
    const result = createCockpitAcceptancePass({
      interactionReadiness: buildInteractionReadiness({
        tone: "review",
        checkLabel: "1/4 controls"
      }),
      modeHandoffQa: buildModeQa({
        tone: "ready",
        checkLabel: "2/3 panels"
      }),
      monitorDepth: buildMonitorDepth({ tone: "steady", scoreValue: "80%" })
    });

    expect(result.checks.map((check) => check.label)).toEqual([
      "Monitor",
      "Mode QA",
      "Interaction",
      "Acceptance"
    ]);
    expect(result.checkLabel).toBe("2/4 gates");
    expect(result.checks[1]).toEqual({ label: "Mode QA", value: "2/3 panels", tone: "ok" });
    expect(result.checks[2]).toEqual({ label: "Interaction", value: "1/4 controls", tone: "review" });
    expect(result.checks[3]).toEqual({ label: "Acceptance", value: "Desktop + narrow", tone: "review" });
  });

  it("does not mutate input objects", () => {
    const interactionReadiness = buildInteractionReadiness({ checkLabel: "4/4 controls" });
    const modeHandoffQa = buildModeQa({ tone: "review", checkLabel: "2/3 panels" });
    const monitorDepth = buildMonitorDepth({ tone: "shallow", scoreValue: "40%" });

    const interactionBefore = structuredClone(interactionReadiness);
    const modeBefore = structuredClone(modeHandoffQa);
    const monitorBefore = structuredClone(monitorDepth);

    createCockpitAcceptancePass({
      interactionReadiness,
      modeHandoffQa,
      monitorDepth
    });

    expect(interactionReadiness).toEqual(interactionBefore);
    expect(modeHandoffQa).toEqual(modeBefore);
    expect(monitorDepth).toEqual(monitorBefore);
  });
});
