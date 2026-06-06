import { describe, expect, it } from "vitest";
import { createCockpitModeHandoff } from "./cockpitModeHandoff";
import type { LayoutSpec } from "./layout";

function buildLayout(override: Partial<LayoutSpec>): LayoutSpec {
  return {
    id: "2x1",
    label: "2x1",
    description: "Two panels side by side.",
    columns: 2,
    rows: 1,
    kind: "fixed",
    ...override
  };
}

describe("createCockpitModeHandoff", () => {
  it("builds focus handoff details and labels", () => {
    const handoff = createCockpitModeHandoff("focus", buildLayout({ id: "2x1", label: "2x1" }), 3, 5);

    expect(handoff).toEqual({
      currentModeLabel: "Focus",
      nextModeLabel: "Orchestrator",
      currentLayoutLabel: "2x1",
      nextLayoutLabel: "2x2",
      preservedLabel: "3/5 panels preserved",
      detail:
        "Handoff expands from focused review into orchestrated worker visibility.",
      tone: "focused",
      ariaLabel:
        "Arena handoff from Focus (2x1) to Orchestrator (2x2); 3/5 panels preserved"
    });
  });

  it("builds orchestrator handoff details and labels", () => {
    const handoff = createCockpitModeHandoff("orchestrator", buildLayout({ id: "3x2", label: "3x2" }), 2, 2);

    expect(handoff).toEqual({
      currentModeLabel: "Orchestrator",
      nextModeLabel: "Monitor",
      currentLayoutLabel: "3x2",
      nextLayoutLabel: "3x2",
      preservedLabel: "2/2 panels preserved",
      detail:
        "Handoff expands worker coordination into multi-project monitoring.",
      tone: "expanding",
      ariaLabel:
        "Arena handoff from Orchestrator (3x2) to Monitor (3x2); 2/2 panels preserved"
    });
  });

  it("builds monitor handoff details and labels", () => {
    const handoff = createCockpitModeHandoff("monitor", buildLayout({ id: "1x3", label: "1x3" }), 1, 4);

    expect(handoff).toEqual({
      currentModeLabel: "Monitor",
      nextModeLabel: "Focus",
      currentLayoutLabel: "1x3",
      nextLayoutLabel: "2x1",
      preservedLabel: "1/4 panels preserved",
      detail: "Handoff returns monitoring context to focused review.",
      tone: "watching",
      ariaLabel:
        "Arena handoff from Monitor (1x3) to Focus (2x1); 1/4 panels preserved"
    });
  });

  it("clamps visible and total counts to non-negative integers and caps visible by total", () => {
    expect(createCockpitModeHandoff("focus", buildLayout({ id: "1x1" }), -3, 3).preservedLabel).toBe(
      "0/3 panels preserved"
    );

    expect(createCockpitModeHandoff("focus", buildLayout({ id: "1x1" }), 10.7, 5.2).preservedLabel).toBe(
      "5/5 panels preserved"
    );
    expect(createCockpitModeHandoff("focus", buildLayout({ id: "1x1" }), 7, -2).preservedLabel).toBe(
      "0/0 panels preserved"
    );
  });

  it("returns zero visible when total is zero, even if visible is positive", () => {
    expect(createCockpitModeHandoff("orchestrator", buildLayout({ id: "2x3" }), 9, 0).preservedLabel).toBe(
      "0/0 panels preserved"
    );
  });

  it("resolves next layout labels from default layout by mode", () => {
    expect(createCockpitModeHandoff("focus", buildLayout({ id: "1x1" }), 1, 1).nextLayoutLabel).toBe("2x2");
    expect(createCockpitModeHandoff("orchestrator", buildLayout({ id: "1x1" }), 1, 1).nextLayoutLabel).toBe("3x2");
    expect(createCockpitModeHandoff("monitor", buildLayout({ id: "1x1" }), 1, 1).nextLayoutLabel).toBe("2x1");
  });

  it("uses the adaptive label when adaptive is the selected placeholder layout", () => {
    const handoff = createCockpitModeHandoff(
      "orchestrator",
      buildLayout({
        id: "adaptive",
        label: "Adaptive",
        description: "Freeform Arena entry point.",
        columns: 3,
        rows: 3,
        kind: "adaptive"
      }),
      4,
      4
    );

    expect(handoff.currentLayoutLabel).toBe("Adaptive");
    expect(handoff.ariaLabel).toContain("Orchestrator (Adaptive)");
  });

  it("falls back to stable tone when mode is unexpected", () => {
    const handoff = createCockpitModeHandoff(
      "invalid" as unknown as "focus" | "orchestrator" | "monitor",
      buildLayout({ id: "1x1" }),
      1,
      1
    );

    expect(handoff.tone).toBe("stable");
    expect(handoff.currentModeLabel).toBe("Focus");
    expect(handoff.nextModeLabel).toBe("Orchestrator");
  });
});
