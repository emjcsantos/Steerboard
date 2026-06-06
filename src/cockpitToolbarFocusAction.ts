import type { CockpitPanelFocusTarget } from "./cockpitPanelFocus";
import type { CockpitFocusedPanelStatus } from "./cockpitFocusedPanelStatus";

export interface CockpitToolbarFocusAction {
  focusLabel: string;
  focusDisabled: boolean;
  focusTitle: string;
  focusAriaLabel: string;
  clearLabel: string;
  clearDisabled: boolean;
  clearTitle: string;
  clearAriaLabel: string;
  statusTitle: string;
}

export function createCockpitToolbarFocusAction(
  target: CockpitPanelFocusTarget,
  status: CockpitFocusedPanelStatus
): CockpitToolbarFocusAction {
  if (target.isFocused || status.hasFocus) {
    return {
      focusLabel: target.isFocused ? "Focused" : "Focus",
      focusDisabled: true,
      focusTitle: target.isFocused ? "Target panel is already focused." : "Another Arena panel is already focused.",
      focusAriaLabel: target.isFocused ? "Target panel is already focused" : "Another Arena panel is already focused",
      clearLabel: "Clear",
      clearDisabled: false,
      clearTitle: "Clear focused Arena panel.",
      clearAriaLabel: "Clear focused Arena panel",
      statusTitle: status.detail
    };
  }

  if (target.canFocus) {
    return {
      focusLabel: "Focus",
      focusDisabled: false,
      focusTitle: "Focus the next attention Arena panel.",
      focusAriaLabel: "Focus the next attention Arena panel",
      clearLabel: "Clear",
      clearDisabled: !status.hasFocus,
      clearTitle: status.hasFocus ? "Clear focused Arena panel." : "No focused panel to clear.",
      clearAriaLabel: status.hasFocus ? "Clear focused Arena panel" : "No focused panel to clear",
      statusTitle: status.detail
    };
  }

  return {
    focusLabel: "Focus",
    focusDisabled: true,
    focusTitle: "Focus unavailable.",
    focusAriaLabel: "Focus unavailable",
    clearLabel: "Clear",
    clearDisabled: true,
    clearTitle: "No focused panel to clear.",
    clearAriaLabel: "No focused panel to clear",
    statusTitle: status.detail
  };
}
