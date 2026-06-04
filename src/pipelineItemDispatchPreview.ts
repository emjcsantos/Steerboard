import type { PipelineItem } from "./fixtures";
import { canDispatchPipelineItem } from "./orchestration";
import type { RegistryEntry } from "./registry";
import { canRunWithAdapter, runtimeStateLabel, type RuntimeAdapter } from "./runtime";

export type PipelineItemDispatchPreviewState = "ready" | "blocked" | "review";

export type PipelineItemDispatchGateStatus = PipelineItemDispatchPreviewState;

export interface PipelineItemDispatchGate {
  id: "item" | "registry" | "runtime";
  label: string;
  status: PipelineItemDispatchGateStatus;
  detail: string;
}

export interface PipelineItemDispatchPreview {
  itemId: string;
  title: string;
  stage: PipelineItem["stage"];
  readiness: number;
  risk: PipelineItem["risk"];
  owner: string;
  state: PipelineItemDispatchPreviewState;
  canDispatch: boolean;
  gates: PipelineItemDispatchGate[];
  detail: string;
}

function buildItemGate(item: PipelineItem): PipelineItemDispatchGate {
  if (canDispatchPipelineItem(item)) {
    return {
      id: "item",
      label: "Pipeline item",
      status: "ready",
      detail: "Item stage and readiness meet dispatch criteria."
    };
  }

  return {
    id: "item",
    label: "Pipeline item",
    status: "review",
    detail: `Item must be in "ready" stage with readiness 80+. Current stage is ${item.stage} and readiness is ${item.readiness}.`
  };
}

function buildRegistryGate(registryEntry?: RegistryEntry): PipelineItemDispatchGate {
  if (!registryEntry) {
    return {
      id: "registry",
      label: "Registry entry",
      status: "review",
      detail: "No registry entry was provided for this item."
    };
  }

  if (registryEntry.permissionState === "blocked") {
    return {
      id: "registry",
      label: "Registry entry",
      status: "blocked",
      detail: "Registry permissions are blocked."
    };
  }

  if (registryEntry.readiness < 80) {
    return {
      id: "registry",
      label: "Registry entry",
      status: "review",
      detail: `Registry readiness is below 80. Current value is ${registryEntry.readiness}.`
    };
  }

  return {
    id: "registry",
    label: "Registry entry",
    status: "ready",
    detail: "Registry entry is ready for dispatch."
  };
}

function buildRuntimeGate(runtimeAdapter?: RuntimeAdapter): PipelineItemDispatchGate {
  if (!runtimeAdapter) {
    return {
      id: "runtime",
      label: "Runtime adapter",
      status: "review",
      detail: "Runtime adapter is not connected."
    };
  }

  const processPermission = runtimeAdapter.permissions.find(
    (permission) => permission.permission === "process"
  );

  if (runtimeAdapter.state === "blocked") {
    return {
      id: "runtime",
      label: "Runtime adapter",
      status: "blocked",
      detail: `Runtime adapter is blocked (${runtimeStateLabel(runtimeAdapter.state)}).`
    };
  }

  if (processPermission?.status === "disabled") {
    return {
      id: "runtime",
      label: "Runtime adapter",
      status: "blocked",
      detail: "Runtime process permission is disabled."
    };
  }

  if (canRunWithAdapter(runtimeAdapter)) {
    return {
      id: "runtime",
      label: "Runtime adapter",
      status: "ready",
      detail: `Runtime adapter is ${runtimeStateLabel(runtimeAdapter.state)} for dispatch.`
    };
  }

  return {
    id: "runtime",
    label: "Runtime adapter",
    status: "review",
    detail: `Runtime adapter readiness is ${runtimeAdapter.readiness} and readiness check is ${runtimeStateLabel(runtimeAdapter.state)}.`
  };
}

function buildDispatchDetail(gates: PipelineItemDispatchGate[]): string {
  const blockedGates = gates.filter((gate) => gate.status === "blocked");
  const reviewGates = gates.filter((gate) => gate.status === "review");

  if (blockedGates.length === 0 && reviewGates.length === 0) {
    return "Dispatch is ready.";
  }

  if (blockedGates.length > 0) {
    return `Dispatch is blocked. ${blockedGates.map((gate) => `${gate.label}: ${gate.detail}`).join(" | ")}`;
  }

  return `Dispatch requires review. ${reviewGates.map((gate) => `${gate.label}: ${gate.detail}`).join(" | ")}`;
}

export function buildPipelineItemDispatchPreview(
  item: PipelineItem,
  registryEntry?: RegistryEntry,
  runtimeAdapter?: RuntimeAdapter
): PipelineItemDispatchPreview {
  const itemGate = buildItemGate(item);
  const registryGate = buildRegistryGate(registryEntry);
  const runtimeGate = buildRuntimeGate(runtimeAdapter);
  const gates = [itemGate, registryGate, runtimeGate];
  const canDispatch = gates.every((gate) => gate.status === "ready");
  const state: PipelineItemDispatchPreviewState = canDispatch
    ? "ready"
    : gates.some((gate) => gate.status === "blocked")
      ? "blocked"
      : "review";

  return {
    itemId: item.id,
    title: item.title,
    stage: item.stage,
    readiness: item.readiness,
    risk: item.risk,
    owner: item.owner,
    state,
    canDispatch,
    gates,
    detail: buildDispatchDetail(gates)
  };
}
