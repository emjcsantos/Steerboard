import { describe, expect, it } from "vitest";
import { createCockpitModeHandoffQa } from "./cockpitModeHandoffQa";
import type { CockpitFocusedPanelStatus } from "./cockpitFocusedPanelStatus";
import type { CockpitLayoutCapacity } from "./cockpitLayoutCapacity";
import type { CockpitModeHandoff } from "./cockpitModeHandoff";
import type { CockpitPanelOverflow } from "./cockpitPanelOverflow";

function buildHandoff(overrides: Partial<CockpitModeHandoff> = {}): CockpitModeHandoff {
  return {
    currentModeLabel: "Monitor",
    nextModeLabel: "Focus",
    currentLayoutLabel: "2x2",
    nextLayoutLabel: "2x2",
    preservedLabel: "1/2 panels preserved",
    detail: "Mode handoff ready.",
    tone: "watching",
    ariaLabel: "Cockpit handoff from Monitor (2x2) to Focus (2x2); 1/2 panels preserved",
    ...overrides
  };
}

function buildCapacity(
  overrides: Partial<CockpitLayoutCapacity>
): CockpitLayoutCapacity {
  return {
    label: "Layout active",
    detail: "Layout has open capacity.",
    tone: "active",
    layoutLabel: "2x2",
    capacityLabel: "4 cells",
    usageLabel: "2/4 visible",
    ...overrides
  };
}

function buildFocus(
  overrides: Partial<CockpitFocusedPanelStatus>
): CockpitFocusedPanelStatus {
  return {
    panelId: "panel-1",
    hasFocus: false,
    label: "Open",
    detail: "No cockpit panel is focused.",
    tone: "neutral",
    ...overrides
  };
}

function buildOverflow(
  overrides: Partial<CockpitPanelOverflow>
): CockpitPanelOverflow {
  return {
    label: "All panels visible",
    detail: "No cockpit panels are outside the current grid.",
    tone: "clear",
    hiddenLabel: "0 hidden",
    nextLabel: "None",
    reviewLabel: "0 need review",
    ...overrides
  };
}

describe("createCockpitModeHandoffQa", () => {
  it("returns ready state when everything is stable", () => {
    const handoff = buildHandoff({ preservedLabel: "1/2 panels preserved" });
    const capacity = buildCapacity({ tone: "active" });
    const focusedStatus = buildFocus({
      hasFocus: true,
      label: "Focused",
      tone: "complete"
    });
    const overflow = buildOverflow({ tone: "clear", hiddenLabel: "0 hidden" });

    const qa = createCockpitModeHandoffQa(
      handoff,
      capacity,
      focusedStatus,
      overflow
    );

    expect(qa).toEqual({
      label: "Handoff QA ready",
      detail: "Mode handoff, layout, and focus controls are stable.",
      tone: "ready",
      checkLabel: "3/3 checks",
      checks: [
        { label: "Layout", value: "2/4 visible", tone: "ok" },
        { label: "Focus", value: "Focused", tone: "ok" },
        { label: "Overflow", value: "0 hidden", tone: "ok" }
      ],
      ariaLabel:
        "Handoff QA ready: Monitor to Focus; 3/3 checks; Layout 2/4 visible; Focus Focused; Overflow 0 hidden"
    });
  });

  it("returns review state when overflow is queued", () => {
    const handoff = buildHandoff({ preservedLabel: "2/6 panels preserved" });
    const capacity = buildCapacity({ tone: "active" });
    const focusedStatus = buildFocus({
      hasFocus: false,
      tone: "neutral"
    });
    const overflow = buildOverflow({
      tone: "queued",
      hiddenLabel: "3 hidden",
      reviewLabel: "0 need review"
    });

    const qa = createCockpitModeHandoffQa(
      handoff,
      capacity,
      focusedStatus,
      overflow
    );

    expect(qa.tone).toBe("review");
    expect(qa.label).toBe("Handoff QA review");
    expect(qa.checkLabel).toBe("1/3 checks");
    expect(qa.checks[1]).toEqual({ label: "Focus", value: "No focus", tone: "neutral" });
    expect(qa.checks[2]).toEqual({ label: "Overflow", value: "3 hidden", tone: "review" });
  });

  it("returns blocked state when any blocked condition is detected", () => {
    const handoff = buildHandoff({ preservedLabel: "2/6 panels preserved" });
    const capacity = buildCapacity({ tone: "overflow", layoutLabel: "1x1" });
    const focusedStatus = buildFocus({
      hasFocus: true,
      tone: "critical",
      label: "Focused"
    });
    const overflow = buildOverflow({ tone: "clear", hiddenLabel: "0 hidden" });

    const qa = createCockpitModeHandoffQa(
      handoff,
      capacity,
      focusedStatus,
      overflow
    );

    expect(qa).toMatchObject({
      tone: "blocked",
      label: "Handoff QA needs review",
      checkLabel: "1/3 checks",
      detail:
        "Resolve layout, hidden-panel, or focused-panel blockers before mode handoff.",
      checks: [
        { label: "Layout", value: "2/4 visible", tone: "blocked" },
        { label: "Focus", value: "Focused", tone: "blocked" },
        { label: "Overflow", value: "0 hidden", tone: "ok" }
      ]
    });
  });

  it("returns idle state when preserved panel count is zero", () => {
    const handoff = buildHandoff({ preservedLabel: "0/0 panels preserved" });
    const capacity = buildCapacity({ tone: "clear" });
    const focusedStatus = buildFocus({ hasFocus: false, tone: "neutral" });
    const overflow = buildOverflow({ tone: "queued", hiddenLabel: "1 hidden" });

    const qa = createCockpitModeHandoffQa(
      handoff,
      capacity,
      focusedStatus,
      overflow
    );

    expect(qa.tone).toBe("idle");
    expect(qa.label).toBe("Handoff QA idle");
    expect(qa.checkLabel).toBe("0/3 checks");
    expect(qa.detail).toBe("No active cockpit panels need handoff QA yet.");
    expect(qa.checks[0].tone).toBe("neutral");
    expect(qa.checks[2].tone).toBe("review");
  });

  it("returns idle state when the layout is clear and no panel has focus", () => {
    const handoff = buildHandoff({ preservedLabel: "1/2 panels preserved" });
    const capacity = buildCapacity({ tone: "clear" });
    const focusedStatus = buildFocus({ hasFocus: false, tone: "neutral" });
    const overflow = buildOverflow({ tone: "clear", hiddenLabel: "0 hidden" });

    const qa = createCockpitModeHandoffQa(
      handoff,
      capacity,
      focusedStatus,
      overflow
    );

    expect(qa.tone).toBe("idle");
    expect(qa.checkLabel).toBe("1/3 checks");
  });

  it("maps all metric tones from source tones", () => {
    const handoff = buildHandoff();
    const metricsByCondition = createCockpitModeHandoffQa(
      handoff,
      buildCapacity({ tone: "full", layoutLabel: "4x4" }),
      buildFocus({
        hasFocus: true,
        tone: "attention",
        label: "Focused"
      }),
      buildOverflow({ tone: "blocked", hiddenLabel: "5 hidden" })
    );

    expect(metricsByCondition.checks).toEqual([
      { label: "Layout", value: "2/4 visible", tone: "ok" },
      { label: "Focus", value: "Focused", tone: "review" },
      { label: "Overflow", value: "5 hidden", tone: "blocked" }
    ]);
  });

  it("builds an aria label that includes key handoff and metric context", () => {
    const handoff = buildHandoff({
      currentModeLabel: "Focus",
      nextModeLabel: "Monitor"
    });
    const capacity = buildCapacity({
      tone: "full",
      layoutLabel: "3x2"
    });
    const focusedStatus = buildFocus({
      hasFocus: true,
      tone: "active",
      label: "Focused"
    });
    const overflow = buildOverflow({
      tone: "clear",
      hiddenLabel: "2 hidden"
    });

    const qa = createCockpitModeHandoffQa(
      handoff,
      capacity,
      focusedStatus,
      overflow
    );

    expect(qa.ariaLabel).toContain("Focus");
    expect(qa.ariaLabel).toContain("Monitor");
    expect(qa.ariaLabel).toContain("Handoff QA ready");
    expect(qa.ariaLabel).toContain("3/3 checks");
    expect(qa.ariaLabel).toContain("2/4 visible");
    expect(qa.ariaLabel).toContain("Focused");
    expect(qa.ariaLabel).toContain("2 hidden");
  });

  it("does not mutate input objects", () => {
    const handoff = buildHandoff({ preservedLabel: "1/2 panels preserved" });
    const capacity = buildCapacity({ tone: "active", layoutLabel: "2x2" });
    const focusedStatus = buildFocus({
      hasFocus: true,
      tone: "active",
      label: "Focused"
    });
    const overflow = buildOverflow({ tone: "clear", hiddenLabel: "0 hidden" });

    const handoffBefore = structuredClone(handoff);
    const capacityBefore = structuredClone(capacity);
    const focusedStatusBefore = structuredClone(focusedStatus);
    const overflowBefore = structuredClone(overflow);

    createCockpitModeHandoffQa(handoff, capacity, focusedStatus, overflow);

    expect(handoff).toEqual(handoffBefore);
    expect(capacity).toEqual(capacityBefore);
    expect(focusedStatus).toEqual(focusedStatusBefore);
    expect(overflow).toEqual(overflowBefore);
  });
});
