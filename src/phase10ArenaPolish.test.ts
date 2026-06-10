import { describe, expect, it } from "vitest";
import type { CockpitAcceptancePass } from "./cockpitAcceptancePass";
import type { CockpitInteractionReadiness } from "./cockpitInteractionReadiness";
import type { CockpitLayoutCapacity } from "./cockpitLayoutCapacity";
import { buildPhase10ArenaPolishSnapshot } from "./phase10ArenaPolish";

function layout(overrides: Partial<CockpitLayoutCapacity> = {}): CockpitLayoutCapacity {
  return {
    label: "Layout active",
    detail: "Layout has open capacity.",
    tone: "active",
    layoutLabel: "Adaptive",
    capacityLabel: "9 cells",
    usageLabel: "3/9 visible",
    ...overrides
  };
}

function interaction(
  overrides: Partial<CockpitInteractionReadiness> = {}
): CockpitInteractionReadiness {
  return {
    label: "Interaction QA ready",
    detail: "Mode, layout, focus, and clear controls are ready for final Arena QA.",
    tone: "ready",
    checkLabel: "4/4 controls",
    checks: [
      { label: "Mode", value: "3/3 panels", tone: "ok" },
      { label: "Layout", value: "3/9 visible", tone: "ok" },
      { label: "Focus", value: "Focused", tone: "ok" },
      { label: "Clear", value: "Ready", tone: "ok" }
    ],
    ariaLabel: "Interaction QA ready",
    ...overrides
  };
}

function acceptance(overrides: Partial<CockpitAcceptancePass> = {}): CockpitAcceptancePass {
  return {
    label: "Arena acceptance passed",
    detail: "Desktop, narrow-pane, monitor, mode, and interaction gates are ready to close.",
    tone: "accepted",
    checkLabel: "4/4 gates",
    checks: [],
    ariaLabel: "Arena acceptance passed",
    ...overrides
  };
}

function snapshot(
  overrides: Partial<Parameters<typeof buildPhase10ArenaPolishSnapshot>[0]> = {}
) {
  return buildPhase10ArenaPolishSnapshot({
    isAdaptiveLayout: true,
    adaptivePanelCount: 4,
    visiblePanelCount: 3,
    hiddenPanelCount: 1,
    layoutCapacity: layout(),
    interactionReadiness: interaction(),
    acceptancePass: acceptance(),
    hasKeyboardAdjustment: true,
    hasDropPreview: true,
    hasSavedLayoutRepair: true,
    terminologyIssues: [],
    ...overrides
  });
}

describe("phase 10 Arena polish", () => {
  it("is ready when adaptive layout, density, keyboard, focus, terminology, and acceptance gates pass", () => {
    const result = snapshot();

    expect(result.state).toBe("ready");
    expect(result.readiness).toBe(100);
    expect(result.visiblePanelCount).toBe(3);
    expect(result.hiddenPanelCount).toBe(1);
    expect(result.items.every((item) => item.status === "ready")).toBe(true);
    expect(result.ariaLabel).toContain("3/4 adaptive panels visible");
  });

  it("waits for an adaptive-mode regression pass when fixed layout is active", () => {
    const result = snapshot({ isAdaptiveLayout: false });

    expect(result.state).toBe("waiting");
    expect(result.nextAction).toContain("Switch to Adaptive Arena");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Layout regression",
          kind: "layout-regression",
          status: "waiting"
        })
      ])
    );
  });

  it("blocks layout overflow and missing keyboard access", () => {
    const result = snapshot({
      layoutCapacity: layout({
        tone: "overflow",
        usageLabel: "9/9 visible / 2 queued"
      }),
      hasKeyboardAdjustment: false
    });

    expect(result.state).toBe("blocked");
    expect(result.blockedCount).toBe(3);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Layout regression", status: "blocked" }),
        expect.objectContaining({ label: "Density and readability", status: "blocked" }),
        expect.objectContaining({ label: "Keyboard controls", status: "blocked" })
      ])
    );
  });

  it("flags focus review without blocking the whole polish pass", () => {
    const result = snapshot({
      interactionReadiness: interaction({
        tone: "review",
        checkLabel: "2/4 controls",
        checks: [
          { label: "Mode", value: "3/3 panels", tone: "ok" },
          { label: "Layout", value: "3/9 visible", tone: "ok" },
          { label: "Focus", value: "Unavailable", tone: "review" },
          { label: "Clear", value: "Ready", tone: "ok" }
        ]
      }),
      acceptancePass: acceptance({ tone: "review" })
    });

    expect(result.state).toBe("review");
    expect(result.reviewCount).toBe(3);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Focus state", status: "review" }),
        expect.objectContaining({ label: "Keyboard controls", status: "review" }),
        expect.objectContaining({ label: "Acceptance gates", status: "review" })
      ])
    );
  });

  it("reports terminology issue counts without exposing raw issue text", () => {
    const result = snapshot({
      terminologyIssues: [
        "C:\\Users\\MJ\\private\\old-public-term.md",
        "token sk-ABCDEF1234567890 appeared near an old public label"
      ]
    });
    const combinedText = [
      result.label,
      result.nextAction,
      result.safety,
      result.ariaLabel,
      ...result.items.flatMap((item) => [item.label, item.detail, item.nextAction])
    ].join(" ");

    expect(result.state).toBe("blocked");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Arena terminology",
          status: "blocked",
          detail: "2 public terminology issues need review."
        })
      ])
    );
    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toContain("sk-ABCDEF1234567890");
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
