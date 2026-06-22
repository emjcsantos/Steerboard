import type { IJsonModel } from "flexlayout-react";
import type { SessionSummary } from "./fixtures";
import {
  repairPhase10FlexLayoutDockingModel,
  type Phase10FlexLayoutDockingRepairResult
} from "./phase10FlexLayoutDockingModel";

export const PHASE10_FLEXLAYOUT_DOCKING_STORAGE_KEY =
  "steerboard.phase10.flexlayout.docking.model";

export function parseStoredPhase10FlexLayoutDockingModel(
  serialized: string | null,
  sessions: readonly SessionSummary[]
): Phase10FlexLayoutDockingRepairResult {
  if (!serialized) {
    return repairPhase10FlexLayoutDockingModel(undefined, sessions, {
      fallbackState: "generated"
    });
  }

  try {
    return repairPhase10FlexLayoutDockingModel(JSON.parse(serialized), sessions, {
      appendMissingSessions: true,
      fallbackState: "restored"
    });
  } catch {
    return repairPhase10FlexLayoutDockingModel(undefined, sessions, {
      fallbackState: "generated"
    });
  }
}

export function loadPhase10FlexLayoutDockingModel(
  sessions: readonly SessionSummary[]
): Phase10FlexLayoutDockingRepairResult {
  if (typeof window === "undefined") {
    return repairPhase10FlexLayoutDockingModel(undefined, sessions, {
      fallbackState: "generated"
    });
  }

  return parseStoredPhase10FlexLayoutDockingModel(
    window.localStorage.getItem(PHASE10_FLEXLAYOUT_DOCKING_STORAGE_KEY),
    sessions
  );
}

export function savePhase10FlexLayoutDockingModel(model: IJsonModel) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PHASE10_FLEXLAYOUT_DOCKING_STORAGE_KEY,
    JSON.stringify(model)
  );
}
