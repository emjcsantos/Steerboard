import type { CockpitPanelFocusTarget } from "./cockpitPanelFocus";

export interface CockpitPanelFocusControls {
  focusLabel: string;
  focusDisabled: boolean;
  focusTitle: string;
  clearLabel: string;
  clearDisabled: boolean;
  clearTitle: string;
  statusLabel: string;
}

export function createCockpitPanelFocusControls(
  target: CockpitPanelFocusTarget
): CockpitPanelFocusControls {
  if (target.isFocused) {
    return {
      focusLabel: "Focused",
      focusDisabled: true,
      focusTitle: "Current panel already has focus.",
      clearLabel: "Clear",
      clearDisabled: false,
      clearTitle: "Clear panel focus.",
      statusLabel: target.positionLabel
    };
  }

  if (target.canFocus) {
    return {
      focusLabel: "Focus",
      focusDisabled: false,
      focusTitle: "Focus this panel.",
      clearLabel: "Clear",
      clearDisabled: true,
      clearTitle: "No focused panel to clear.",
      statusLabel: target.positionLabel
    };
  }

  return {
    focusLabel: "Focus",
    focusDisabled: true,
    focusTitle: "Focus unavailable.",
    clearLabel: "Clear",
    clearDisabled: true,
    clearTitle: "Clear unavailable.",
    statusLabel: "No focus target"
  };
}
