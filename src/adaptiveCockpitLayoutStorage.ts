import {
  createDefaultAdaptiveCockpitLayout,
  repairAdaptiveCockpitLayout,
  type AdaptiveCockpitLayout
} from "./adaptiveCockpitLayout";

export const ADAPTIVE_COCKPIT_LAYOUT_STORAGE_KEY = "steerboard.adaptive.cockpit.layout";

export function parseStoredAdaptiveCockpitLayout(
  serialized: string | null
): AdaptiveCockpitLayout {
  if (!serialized) {
    return createDefaultAdaptiveCockpitLayout();
  }

  try {
    return repairAdaptiveCockpitLayout(JSON.parse(serialized));
  } catch {
    return createDefaultAdaptiveCockpitLayout();
  }
}

export function loadAdaptiveCockpitLayout(): AdaptiveCockpitLayout {
  if (typeof window === "undefined") {
    return createDefaultAdaptiveCockpitLayout();
  }

  return parseStoredAdaptiveCockpitLayout(
    window.localStorage.getItem(ADAPTIVE_COCKPIT_LAYOUT_STORAGE_KEY)
  );
}

export function saveAdaptiveCockpitLayout(layout: AdaptiveCockpitLayout) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ADAPTIVE_COCKPIT_LAYOUT_STORAGE_KEY,
    JSON.stringify(repairAdaptiveCockpitLayout(layout))
  );
}
