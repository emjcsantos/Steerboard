import { describe, expect, it } from "vitest";
import { createCockpitPanelFocusControls } from "./cockpitPanelFocusControls";
import type { CockpitPanelFocusTarget } from "./cockpitPanelFocus";

function buildTarget(overrides: Partial<CockpitPanelFocusTarget>): CockpitPanelFocusTarget {
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

describe("createCockpitPanelFocusControls", () => {
  it("enables focus action and disables clear when target can be focused", () => {
    const target = buildTarget({
      canFocus: true,
      isFocused: false,
      positionLabel: "Panel 2 of 4"
    });

    expect(createCockpitPanelFocusControls(target)).toEqual({
      focusLabel: "Focus",
      focusDisabled: false,
      focusTitle: "Focus this panel.",
      clearLabel: "Clear",
      clearDisabled: true,
      clearTitle: "No focused panel to clear.",
      statusLabel: "Panel 2 of 4"
    });
  });

  it("disables focus action when already focused and enables clear", () => {
    const target = buildTarget({
      canFocus: false,
      isFocused: true,
      positionLabel: "Panel 1 of 2"
    });

    expect(createCockpitPanelFocusControls(target)).toEqual({
      focusLabel: "Focused",
      focusDisabled: true,
      focusTitle: "Current panel already has focus.",
      clearLabel: "Clear",
      clearDisabled: false,
      clearTitle: "Clear panel focus.",
      statusLabel: "Panel 1 of 2"
    });
  });

  it("disables both actions and returns no-target status when no focus target exists", () => {
    const target = buildTarget({
      canFocus: false,
      isFocused: false,
      positionLabel: "Panel 1 of 2"
    });

    expect(createCockpitPanelFocusControls(target)).toEqual({
      focusLabel: "Focus",
      focusDisabled: true,
      focusTitle: "Focus unavailable.",
      clearLabel: "Clear",
      clearDisabled: true,
      clearTitle: "Clear unavailable.",
      statusLabel: "No focus target"
    });
  });
});
