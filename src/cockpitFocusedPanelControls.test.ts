import { describe, expect, it } from "vitest";
import { createCockpitFocusedPanelControls } from "./cockpitFocusedPanelControls";
import type { CockpitFocusedPanelStatus } from "./cockpitFocusedPanelStatus";

const baseStatus = {
  panelId: "panel-1",
  tone: "active",
  label: "Focused",
  clearStatusTitle: "Panel detail."
} as const;

describe("createCockpitFocusedPanelControls", () => {
  it("returns enabled clear controls when focus is active", () => {
    const status = {
      ...baseStatus,
      hasFocus: true,
      detail: "Panel 1 is focused."
    } satisfies CockpitFocusedPanelStatus;

    expect(createCockpitFocusedPanelControls(status)).toEqual({
      clearLabel: "Clear",
      clearDisabled: false,
      clearTitle: "Clear focused cockpit panel.",
      ariaLabel: "Clear focused cockpit panel",
      statusTitle: "Panel 1 is focused."
    });
  });

  it("returns disabled clear controls when no panel is focused", () => {
    const status = {
      ...baseStatus,
      panelId: "none",
      hasFocus: false,
      label: "No focus",
      detail: "No cockpit panel is focused."
    } satisfies CockpitFocusedPanelStatus;

    expect(createCockpitFocusedPanelControls(status)).toEqual({
      clearLabel: "Clear",
      clearDisabled: true,
      clearTitle: "No focused panel to clear.",
      ariaLabel: "No focused panel to clear",
      statusTitle: "No cockpit panel is focused."
    });
  });

  it("reuses status detail verbatim for statusTitle", () => {
    const status = {
      panelId: "panel-2",
      hasFocus: true,
      label: "Focused",
      tone: "attention",
      detail: "Special detail with spaces and punctuation!"
    } satisfies CockpitFocusedPanelStatus;

    expect(createCockpitFocusedPanelControls(status).statusTitle).toBe(
      "Special detail with spaces and punctuation!"
    );
  });
});
