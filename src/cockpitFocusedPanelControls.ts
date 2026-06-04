import type { CockpitFocusedPanelStatus } from "./cockpitFocusedPanelStatus";

export type CockpitFocusedPanelControls = {
  clearLabel: string;
  clearDisabled: boolean;
  clearTitle: string;
  ariaLabel: string;
  statusTitle: string;
};

export function createCockpitFocusedPanelControls(
  status: CockpitFocusedPanelStatus
): CockpitFocusedPanelControls {
  if (status.hasFocus) {
    return {
      clearLabel: "Clear",
      clearDisabled: false,
      clearTitle: "Clear focused cockpit panel.",
      ariaLabel: "Clear focused cockpit panel",
      statusTitle: status.detail
    };
  }

  return {
    clearLabel: "Clear",
    clearDisabled: true,
    clearTitle: "No focused panel to clear.",
    ariaLabel: "No focused panel to clear",
    statusTitle: status.detail
  };
}
