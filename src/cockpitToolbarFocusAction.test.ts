import { describe, expect, it } from "vitest";
import { createCockpitToolbarFocusAction } from "./cockpitToolbarFocusAction";
import type { CockpitFocusedPanelStatus } from "./cockpitFocusedPanelStatus";
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

const baseStatus = {
  panelId: "none",
  hasFocus: false,
  tone: "neutral",
  label: "No focus",
  detail: "No Arena panel is focused."
} satisfies CockpitFocusedPanelStatus;

describe("createCockpitToolbarFocusAction", () => {
  it("enables focus for visible unfocused target when no focus exists and keeps clear disabled", () => {
    const target = buildTarget({ canFocus: true, isFocused: false });
    const status = {
      ...baseStatus,
      hasFocus: false
    } satisfies CockpitFocusedPanelStatus;

    expect(createCockpitToolbarFocusAction(target, status)).toEqual({
      focusLabel: "Focus",
      focusDisabled: false,
      focusTitle: "Focus the next attention Arena panel.",
      focusAriaLabel: "Focus the next attention Arena panel",
      clearLabel: "Clear",
      clearDisabled: true,
      clearTitle: "No focused panel to clear.",
      clearAriaLabel: "No focused panel to clear",
      statusTitle: "No Arena panel is focused."
    });
  });

  it("disables focus and enables clear when target is already focused", () => {
    const target = buildTarget({ canFocus: false, isFocused: true });
    const status = {
      ...baseStatus,
      hasFocus: true,
      label: "Focused",
      detail: "Panel 1 is focused."
    } satisfies CockpitFocusedPanelStatus;

    expect(createCockpitToolbarFocusAction(target, status)).toEqual({
      focusLabel: "Focused",
      focusDisabled: true,
      focusTitle: "Target panel is already focused.",
      focusAriaLabel: "Target panel is already focused",
      clearLabel: "Clear",
      clearDisabled: false,
      clearTitle: "Clear focused Arena panel.",
      clearAriaLabel: "Clear focused Arena panel",
      statusTitle: "Panel 1 is focused."
    });
  });

  it("disables focus and enables clear when another panel has focus", () => {
    const target = buildTarget({ canFocus: true, isFocused: false });
    const status = {
      panelId: "panel-2",
      hasFocus: true,
      tone: "attention",
      label: "Focused",
      detail: "Panel 2 is focused."
    } satisfies CockpitFocusedPanelStatus;

    expect(createCockpitToolbarFocusAction(target, status)).toEqual({
      focusLabel: "Focus",
      focusDisabled: true,
      focusTitle: "Another Arena panel is already focused.",
      focusAriaLabel: "Another Arena panel is already focused",
      clearLabel: "Clear",
      clearDisabled: false,
      clearTitle: "Clear focused Arena panel.",
      clearAriaLabel: "Clear focused Arena panel",
      statusTitle: "Panel 2 is focused."
    });
  });

  it("disables both actions when no focus target and no focus state exists", () => {
    const target = buildTarget({ canFocus: false, isFocused: false });
    const status = { ...baseStatus, hasFocus: false } satisfies CockpitFocusedPanelStatus;

    expect(createCockpitToolbarFocusAction(target, status)).toEqual({
      focusLabel: "Focus",
      focusDisabled: true,
      focusTitle: "Focus unavailable.",
      focusAriaLabel: "Focus unavailable",
      clearLabel: "Clear",
      clearDisabled: true,
      clearTitle: "No focused panel to clear.",
      clearAriaLabel: "No focused panel to clear",
      statusTitle: "No Arena panel is focused."
    });
  });
});
