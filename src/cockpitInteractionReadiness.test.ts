import { describe, expect, it } from "vitest";
import { createCockpitInteractionReadiness } from "./cockpitInteractionReadiness";
import type { CockpitFocusedPanelStatus } from "./cockpitFocusedPanelStatus";
import type { CockpitLayoutCapacity } from "./cockpitLayoutCapacity";
import type { CockpitModeHandoffQa } from "./cockpitModeHandoffQa";
import type { CockpitPanelFocusTarget } from "./cockpitPanelFocus";
import type { CockpitToolbarFocusAction } from "./cockpitToolbarFocusAction";

function buildModeQa(overrides: Partial<CockpitModeHandoffQa> = {}): CockpitModeHandoffQa {
  return {
    label: "Mode QA",
    detail: "Mode QA detail.",
    tone: "ready",
    checkLabel: "2/2 panels",
    checks: [],
    ariaLabel: "Mode QA",
    ...overrides
  };
}

function buildLayout(overrides: Partial<CockpitLayoutCapacity> = {}): CockpitLayoutCapacity {
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

function buildTarget(overrides: Partial<CockpitPanelFocusTarget> = {}): CockpitPanelFocusTarget {
  return {
    panelId: "panel-1",
    canFocus: false,
    isFocused: false,
    positionLabel: "Panel 1 of 2",
    detail: "Panel is visible.",
    tone: "active",
    ...overrides
  };
}

function buildStatus(overrides: Partial<CockpitFocusedPanelStatus> = {}): CockpitFocusedPanelStatus {
  return {
    panelId: "panel-1",
    hasFocus: false,
    label: "No focus",
    detail: "No cockpit panel is focused.",
    tone: "neutral",
    ...overrides
  };
}

function buildAction(overrides: Partial<CockpitToolbarFocusAction> = {}): CockpitToolbarFocusAction {
  return {
    focusLabel: "Focus",
    focusDisabled: true,
    focusTitle: "Focus unavailable.",
    focusAriaLabel: "Focus unavailable",
    clearLabel: "Clear",
    clearDisabled: true,
    clearTitle: "No focused panel to clear.",
    clearAriaLabel: "No focused panel to clear",
    statusTitle: "No cockpit panel is focused.",
    ...overrides
  };
}

describe("createCockpitInteractionReadiness", () => {
  it("returns ready when all required controls are ok", () => {
    const result = createCockpitInteractionReadiness({
      modeHandoffQa: buildModeQa({ tone: "ready", checkLabel: "1/2 panels" }),
      layoutCapacity: buildLayout(),
      focusTarget: buildTarget({ isFocused: true, canFocus: false }),
      focusedStatus: buildStatus({ hasFocus: true, label: "Focused" }),
      toolbarFocusAction: buildAction({ clearDisabled: false })
    });

    expect(result).toEqual({
      label: "Interaction QA ready",
      detail: "Mode, layout, focus, and clear controls are ready for final cockpit QA.",
      tone: "ready",
      checkLabel: "4/4 controls",
      checks: [
        { label: "Mode", value: "1/2 panels", tone: "ok" },
        { label: "Layout", value: "2/4 visible", tone: "ok" },
        { label: "Focus", value: "Focused", tone: "ok" },
        { label: "Clear", value: "Ready", tone: "ok" }
      ],
      ariaLabel:
        "Interaction QA ready: 4/4 controls; Mode 1/2 panels; Layout 2/4 visible; Focus Focused; Clear Ready"
    });
  });

  it("returns blocked when mode is blocked", () => {
    const result = createCockpitInteractionReadiness({
      modeHandoffQa: buildModeQa({ tone: "blocked", checkLabel: "0/2 panels" }),
      layoutCapacity: buildLayout(),
      focusTarget: buildTarget({ isFocused: true, canFocus: false }),
      focusedStatus: buildStatus({ hasFocus: true, label: "Focused" }),
      toolbarFocusAction: buildAction({ clearDisabled: false })
    });

    expect(result.tone).toBe("blocked");
    expect(result.checks[0]).toEqual({ label: "Mode", value: "0/2 panels", tone: "blocked" });
    expect(result.checks[1].tone).toBe("ok");
  });

  it("returns blocked when layout overflows", () => {
    const result = createCockpitInteractionReadiness({
      modeHandoffQa: buildModeQa(),
      layoutCapacity: buildLayout({
        tone: "overflow",
        usageLabel: "4/4 visible / 2 queued"
      }),
      focusTarget: buildTarget({ isFocused: true, canFocus: false }),
      focusedStatus: buildStatus({ hasFocus: true, label: "Focused" }),
      toolbarFocusAction: buildAction({ clearDisabled: false })
    });

    expect(result.tone).toBe("blocked");
    expect(result.checks[1]).toEqual({ label: "Layout", value: "4/4 visible / 2 queued", tone: "blocked" });
  });

  it("returns review when focused status exists but target is not focused", () => {
    const result = createCockpitInteractionReadiness({
      modeHandoffQa: buildModeQa(),
      layoutCapacity: buildLayout(),
      focusTarget: buildTarget({ isFocused: false, canFocus: false }),
      focusedStatus: buildStatus({ hasFocus: true, label: "Focused" }),
      toolbarFocusAction: buildAction({ clearDisabled: false })
    });

    expect(result.tone).toBe("review");
    expect(result.checks[2]).toEqual({ label: "Focus", value: "Unavailable", tone: "review" });
    expect(result.checks[3]).toEqual({ label: "Clear", value: "Ready", tone: "ok" });
  });

  it("returns review when clear control mismatch exists", () => {
    const result = createCockpitInteractionReadiness({
      modeHandoffQa: buildModeQa(),
      layoutCapacity: buildLayout(),
      focusTarget: buildTarget({ isFocused: true, canFocus: false }),
      focusedStatus: buildStatus({ hasFocus: false }),
      toolbarFocusAction: buildAction({ clearDisabled: false })
    });

    expect(result.tone).toBe("review");
    expect(result.checks[3]).toEqual({ label: "Clear", value: "Ready", tone: "review" });
  });

  it("returns idle when all checks are neutral", () => {
    const result = createCockpitInteractionReadiness({
      modeHandoffQa: buildModeQa({ tone: "idle", checkLabel: "0/2 panels" }),
      layoutCapacity: buildLayout({ tone: "clear", usageLabel: "0/4 visible" }),
      focusTarget: buildTarget({ isFocused: false, canFocus: false }),
      focusedStatus: buildStatus({ hasFocus: false }),
      toolbarFocusAction: buildAction({ clearDisabled: true })
    });

    expect(result.tone).toBe("idle");
    expect(result.label).toBe("Interaction QA idle");
    expect(result.checkLabel).toBe("0/4 controls");
    expect(result.checks).toEqual([
      { label: "Mode", value: "0/2 panels", tone: "neutral" },
      { label: "Layout", value: "0/4 visible", tone: "neutral" },
      { label: "Focus", value: "Unavailable", tone: "neutral" },
      { label: "Clear", value: "Disabled", tone: "neutral" }
    ]);
  });

  it("keeps checks in fixed order and builds the expected check label", () => {
    const result = createCockpitInteractionReadiness({
      modeHandoffQa: buildModeQa({ tone: "review", checkLabel: "1/2 panels" }),
      layoutCapacity: buildLayout({ tone: "full", usageLabel: "3/4 visible" }),
      focusTarget: buildTarget({ isFocused: false, canFocus: true }),
      focusedStatus: buildStatus({ hasFocus: false }),
      toolbarFocusAction: buildAction({ clearDisabled: false })
    });

    expect(result.checks.map((check) => check.label)).toEqual(["Mode", "Layout", "Focus", "Clear"]);
    expect(result.checkLabel).toBe("2/4 controls");
    expect(result.checks).toEqual([
      { label: "Mode", value: "1/2 panels", tone: "review" },
      { label: "Layout", value: "3/4 visible", tone: "ok" },
      { label: "Focus", value: "Ready", tone: "ok" },
      { label: "Clear", value: "Ready", tone: "review" }
    ]);
  });

  it("does not mutate input objects", () => {
    const modeHandoffQa = buildModeQa();
    const layoutCapacity = buildLayout();
    const focusTarget = buildTarget({ canFocus: true });
    const focusedStatus = buildStatus({ hasFocus: true, label: "Focused" });
    const toolbarFocusAction = buildAction({ clearDisabled: false });

    const modeBefore = structuredClone(modeHandoffQa);
    const layoutBefore = structuredClone(layoutCapacity);
    const targetBefore = structuredClone(focusTarget);
    const statusBefore = structuredClone(focusedStatus);
    const actionBefore = structuredClone(toolbarFocusAction);

    createCockpitInteractionReadiness({
      modeHandoffQa,
      layoutCapacity,
      focusTarget,
      focusedStatus,
      toolbarFocusAction
    });

    expect(modeHandoffQa).toEqual(modeBefore);
    expect(layoutCapacity).toEqual(layoutBefore);
    expect(focusTarget).toEqual(targetBefore);
    expect(focusedStatus).toEqual(statusBefore);
    expect(toolbarFocusAction).toEqual(actionBefore);
  });
});
