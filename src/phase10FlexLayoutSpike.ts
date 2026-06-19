export type Phase10FlexLayoutSpikeState = "ready" | "review" | "blocked" | "waiting";

export interface Phase10FlexLayoutSpikeInput {
  readonly repositoryName: string;
  readonly expectedLicense: string;
  readonly hasMitLicenseNotice: boolean;
  readonly supportsTabsets: boolean;
  readonly supportsSplitters: boolean;
  readonly supportsSavedLayoutJson: boolean;
  readonly supportsDockablePanels: boolean;
  readonly dependencyInstalled: boolean;
  readonly preservesCustomLayoutFallback: boolean;
  readonly ownerApprovedDependency: boolean;
}

export interface Phase10FlexLayoutSpikeSummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase10FlexLayoutSpikeState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly coveredCapabilityCount: number;
  readonly requiredCapabilityCount: number;
  readonly dependencyInstalled: boolean;
  readonly ownerApprovedDependency: boolean;
  readonly detail: string;
  readonly nextAction: string;
  readonly safety: string;
}

const SPIKE_ID = "phase-10-flexlayout-docking-spike";
const SPIKE_LABEL = "FlexLayout docking spike";
const REQUIRED_CAPABILITY_COUNT = 4;
const SAFETY =
  "Phase 10 FlexLayout docking spike is evidence-only. It records license, tabset, splitter, saved-layout JSON, dockable-panel, dependency, owner approval, and fallback feasibility without installing packages, changing layout runtime, mutating saved sessions, or replacing the custom adaptive grid.";

const STATUS_LABELS: Record<Phase10FlexLayoutSpikeState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function score(state: Phase10FlexLayoutSpikeState): number {
  switch (state) {
    case "ready":
      return 100;
    case "review":
      return 65;
    case "waiting":
      return 35;
    case "blocked":
    default:
      return 0;
  }
}

function resolveState(
  input: Phase10FlexLayoutSpikeInput,
  coveredCapabilityCount: number
): Phase10FlexLayoutSpikeState {
  if (!input.hasMitLicenseNotice || !input.preservesCustomLayoutFallback) {
    return "blocked";
  }

  if (coveredCapabilityCount < REQUIRED_CAPABILITY_COUNT) {
    return "waiting";
  }

  if (!input.dependencyInstalled || !input.ownerApprovedDependency) {
    return "review";
  }

  return "ready";
}

function capabilityCount(input: Phase10FlexLayoutSpikeInput): number {
  return [
    input.supportsTabsets,
    input.supportsSplitters,
    input.supportsSavedLayoutJson,
    input.supportsDockablePanels
  ].filter(Boolean).length;
}

function detailFor(
  input: Phase10FlexLayoutSpikeInput,
  state: Phase10FlexLayoutSpikeState,
  coveredCapabilityCount: number
): string {
  if (state === "blocked") {
    return `${input.repositoryName} cannot advance until MIT license notice and custom adaptive-grid fallback are both preserved.`;
  }

  if (state === "waiting") {
    return `${input.repositoryName} covers ${coveredCapabilityCount}/${REQUIRED_CAPABILITY_COUNT} docking capabilities: tabsets, splitters, saved layout JSON, and dockable panels.`;
  }

  if (state === "review") {
    return `${input.repositoryName} has ${input.expectedLicense} license evidence and ${coveredCapabilityCount}/${REQUIRED_CAPABILITY_COUNT} docking capabilities, but dependency installation or owner approval is still held.`;
  }

  return `${input.repositoryName} has ${input.expectedLicense} license evidence, owner approval, installed dependency, fallback coverage, and all docking capabilities.`;
}

function nextActionFor(
  input: Phase10FlexLayoutSpikeInput,
  state: Phase10FlexLayoutSpikeState
): string {
  if (state === "blocked") {
    return "Restore MIT license evidence and custom adaptive-grid fallback before FlexLayout can be considered.";
  }

  if (state === "waiting") {
    return "Complete tabset, splitter, saved layout JSON, and dockable-panel feasibility evidence before reviewing FlexLayout.";
  }

  if (state === "review") {
    return input.dependencyInstalled
      ? "Record owner approval before replacing any custom adaptive-grid behavior with FlexLayout."
      : "Keep FlexLayout as a reviewed spike and defer package installation until owner approval.";
  }

  return "Keep FlexLayout spike evidence attached while the custom adaptive-grid fallback remains available.";
}

export function buildPhase10FlexLayoutSpikeSummary(
  input: Phase10FlexLayoutSpikeInput
): Phase10FlexLayoutSpikeSummary {
  const coveredCapabilityCount = capabilityCount(input);
  const state = resolveState(input, coveredCapabilityCount);

  return {
    id: SPIKE_ID,
    label: SPIKE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: score(state),
    coveredCapabilityCount,
    requiredCapabilityCount: REQUIRED_CAPABILITY_COUNT,
    dependencyInstalled: input.dependencyInstalled,
    ownerApprovedDependency: input.ownerApprovedDependency,
    detail: detailFor(input, state, coveredCapabilityCount),
    nextAction: nextActionFor(input, state),
    safety: SAFETY
  };
}
