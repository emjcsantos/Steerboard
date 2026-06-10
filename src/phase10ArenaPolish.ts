import type { CockpitAcceptancePass } from "./cockpitAcceptancePass";
import type { CockpitInteractionReadiness } from "./cockpitInteractionReadiness";
import type { CockpitLayoutCapacity } from "./cockpitLayoutCapacity";

export type Phase10ArenaPolishState = "ready" | "review" | "blocked" | "waiting";

export type Phase10ArenaPolishItemKind =
  | "layout-regression"
  | "density"
  | "keyboard"
  | "focus"
  | "terminology"
  | "acceptance";

export interface Phase10ArenaPolishItem {
  id: string;
  label: string;
  kind: Phase10ArenaPolishItemKind;
  status: Phase10ArenaPolishState;
  detail: string;
  nextAction: string;
}

export interface Phase10ArenaPolishSnapshot {
  id: string;
  label: string;
  state: Phase10ArenaPolishState;
  statusLabel: string;
  readiness: number;
  adaptivePanelCount: number;
  visiblePanelCount: number;
  hiddenPanelCount: number;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  waitingCount: number;
  nextAction: string;
  safety: string;
  ariaLabel: string;
  items: Phase10ArenaPolishItem[];
}

export interface Phase10ArenaPolishInput {
  isAdaptiveLayout: boolean;
  adaptivePanelCount: number;
  visiblePanelCount: number;
  hiddenPanelCount: number;
  layoutCapacity: CockpitLayoutCapacity;
  interactionReadiness: CockpitInteractionReadiness;
  acceptancePass: CockpitAcceptancePass;
  hasKeyboardAdjustment: boolean;
  hasDropPreview: boolean;
  hasSavedLayoutRepair: boolean;
  terminologyIssues?: readonly string[];
}

const SNAPSHOT_ID = "phase-10-adaptive-arena-polish";
const SNAPSHOT_LABEL = "Phase 10 adaptive Arena polish";
const SAFETY =
  "Phase 10 polish only. Adaptive changes must preserve sessions, saved-state repair, keyboard paths, readable density, and Arena vocabulary without launching runtime or mutating sources.";

const STATUS_LABELS: Record<Phase10ArenaPolishState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function sanitizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function stateWeight(state: Phase10ArenaPolishState): number {
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

function scoreItems(items: readonly Phase10ArenaPolishItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function resolveState(items: readonly Phase10ArenaPolishItem[]): Phase10ArenaPolishState {
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "review")) {
    return "review";
  }
  if (items.some((item) => item.status === "waiting")) {
    return "waiting";
  }
  return "ready";
}

function firstNextAction(items: readonly Phase10ArenaPolishItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Keep Phase 10 layout, density, keyboard, focus, terminology, and acceptance checks green before release packaging resumes."
  );
}

function mapAcceptanceState(tone: CockpitAcceptancePass["tone"]): Phase10ArenaPolishState {
  switch (tone) {
    case "accepted":
      return "ready";
    case "review":
      return "review";
    case "blocked":
      return "blocked";
    case "waiting":
    default:
      return "waiting";
  }
}

function layoutRegressionItem(input: Phase10ArenaPolishInput): Phase10ArenaPolishItem {
  if (!input.hasDropPreview || !input.hasSavedLayoutRepair) {
    return {
      id: `${SNAPSHOT_ID}:layout-regression`,
      label: "Layout regression",
      kind: "layout-regression",
      status: "blocked",
      detail:
        "Adaptive layout regression needs drop previews and saved-state repair before polish can close.",
      nextAction:
        "Restore adaptive drop preview and saved layout repair coverage before continuing Phase 10."
    };
  }

  if (input.layoutCapacity.tone === "overflow") {
    return {
      id: `${SNAPSHOT_ID}:layout-regression`,
      label: "Layout regression",
      kind: "layout-regression",
      status: "blocked",
      detail: "The current Arena layout has queued panels beyond visible capacity.",
      nextAction: "Resolve layout overflow before treating adaptive regression as stable."
    };
  }

  if (!input.isAdaptiveLayout) {
    return {
      id: `${SNAPSHOT_ID}:layout-regression`,
      label: "Layout regression",
      kind: "layout-regression",
      status: "waiting",
      detail: "Adaptive mode is available but not currently selected for the visible regression pass.",
      nextAction: "Switch to Adaptive Arena and verify panel move, resize, hide, reveal, reset, and drop-preview behavior."
    };
  }

  if (sanitizeCount(input.visiblePanelCount) === 0) {
    return {
      id: `${SNAPSHOT_ID}:layout-regression`,
      label: "Layout regression",
      kind: "layout-regression",
      status: "waiting",
      detail: "Adaptive mode is selected but no visible panel is available for layout regression.",
      nextAction: "Reveal at least one adaptive panel before running the layout regression pass."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:layout-regression`,
    label: "Layout regression",
    kind: "layout-regression",
    status: "ready",
    detail:
      "Adaptive mode has visible panels, drop preview support, saved-state repair, and no layout overflow.",
    nextAction: "Keep the adaptive layout regression pass in the owner checklist across desktop and narrow panes."
  };
}

function densityItem(input: Phase10ArenaPolishInput): Phase10ArenaPolishItem {
  if (input.layoutCapacity.tone === "overflow") {
    return {
      id: `${SNAPSHOT_ID}:density`,
      label: "Density and readability",
      kind: "density",
      status: "blocked",
      detail: "Queued panels exceed visible layout capacity.",
      nextAction: "Reduce visible panel pressure or use Adaptive Arena before density polish can pass."
    };
  }

  if (input.layoutCapacity.tone === "full") {
    return {
      id: `${SNAPSHOT_ID}:density`,
      label: "Density and readability",
      kind: "density",
      status: "review",
      detail: `${input.layoutCapacity.usageLabel} keeps every visible cell occupied.`,
      nextAction: "Review compact labels, buttons, and evidence rows at full density before closing Phase 10."
    };
  }

  if (sanitizeCount(input.adaptivePanelCount) === 0) {
    return {
      id: `${SNAPSHOT_ID}:density`,
      label: "Density and readability",
      kind: "density",
      status: "waiting",
      detail: "No adaptive panel set is available for density review.",
      nextAction: "Create or reveal adaptive panels before completing density polish."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:density`,
    label: "Density and readability",
    kind: "density",
    status: "ready",
    detail: `${input.layoutCapacity.usageLabel} is within visible capacity.`,
    nextAction: "Keep controls, labels, and evidence rows scannable at the current density."
  };
}

function keyboardItem(input: Phase10ArenaPolishInput): Phase10ArenaPolishItem {
  if (!input.hasKeyboardAdjustment) {
    return {
      id: `${SNAPSHOT_ID}:keyboard`,
      label: "Keyboard controls",
      kind: "keyboard",
      status: "blocked",
      detail: "Adaptive panel movement and resize need a keyboard path.",
      nextAction: "Restore arrow-key movement and shift-arrow resize handling for adaptive panels."
    };
  }

  if (input.interactionReadiness.tone === "blocked") {
    return {
      id: `${SNAPSHOT_ID}:keyboard`,
      label: "Keyboard controls",
      kind: "keyboard",
      status: "blocked",
      detail: input.interactionReadiness.detail,
      nextAction: "Resolve blocked interaction QA before accepting keyboard controls."
    };
  }

  if (input.interactionReadiness.tone === "review") {
    return {
      id: `${SNAPSHOT_ID}:keyboard`,
      label: "Keyboard controls",
      kind: "keyboard",
      status: "review",
      detail: input.interactionReadiness.detail,
      nextAction: "Review the interaction QA item before closing keyboard polish."
    };
  }

  if (input.interactionReadiness.tone === "idle") {
    return {
      id: `${SNAPSHOT_ID}:keyboard`,
      label: "Keyboard controls",
      kind: "keyboard",
      status: "waiting",
      detail: "Keyboard controls exist but no active Arena interaction state is available to verify.",
      nextAction: "Focus an Arena panel and verify keyboard move, resize, clear, and reset behavior."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:keyboard`,
    label: "Keyboard controls",
    kind: "keyboard",
    status: "ready",
    detail: "Adaptive panel movement and resize have keyboard-accessible control paths.",
    nextAction: "Keep keyboard checks in the owner layout regression pass."
  };
}

function focusItem(input: Phase10ArenaPolishInput): Phase10ArenaPolishItem {
  const focusChecks = input.interactionReadiness.checks.filter(
    (check) => check.label === "Focus" || check.label === "Clear"
  );

  if (focusChecks.some((check) => check.tone === "blocked")) {
    return {
      id: `${SNAPSHOT_ID}:focus`,
      label: "Focus state",
      kind: "focus",
      status: "blocked",
      detail: "Focus or clear controls are blocked.",
      nextAction: "Resolve blocked focus and clear controls before closing Phase 10."
    };
  }

  if (focusChecks.some((check) => check.tone === "review")) {
    return {
      id: `${SNAPSHOT_ID}:focus`,
      label: "Focus state",
      kind: "focus",
      status: "review",
      detail: "Focus or clear controls need review.",
      nextAction: "Verify focused panel highlight, focus action, and clear action stay synchronized."
    };
  }

  if (focusChecks.length < 2 || focusChecks.some((check) => check.tone === "neutral")) {
    return {
      id: `${SNAPSHOT_ID}:focus`,
      label: "Focus state",
      kind: "focus",
      status: "waiting",
      detail: "Focus and clear controls are not both active for review.",
      nextAction: "Focus a visible Arena panel and verify the clear action."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:focus`,
    label: "Focus state",
    kind: "focus",
    status: "ready",
    detail: "Focus and clear controls are synchronized for the current Arena view.",
    nextAction: "Keep focus state visible when panels move, resize, hide, reveal, or reset."
  };
}

function terminologyItem(input: Phase10ArenaPolishInput): Phase10ArenaPolishItem {
  const issueCount = input.terminologyIssues?.length ?? 0;

  if (issueCount > 0) {
    return {
      id: `${SNAPSHOT_ID}:terminology`,
      label: "Arena terminology",
      kind: "terminology",
      status: "blocked",
      detail: `${issueCount} public terminology issue${issueCount === 1 ? "" : "s"} need review.`,
      nextAction: "Replace old public vocabulary while keeping backward-compatible internal keys where required."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:terminology`,
    label: "Arena terminology",
    kind: "terminology",
    status: "ready",
    detail: "Public-facing labels and docs stay aligned to Arena language.",
    nextAction: "Keep old public vocabulary from returning during layout polish."
  };
}

function acceptanceItem(input: Phase10ArenaPolishInput): Phase10ArenaPolishItem {
  const status = mapAcceptanceState(input.acceptancePass.tone);

  return {
    id: `${SNAPSHOT_ID}:acceptance`,
    label: "Acceptance gates",
    kind: "acceptance",
    status,
    detail: input.acceptancePass.detail,
    nextAction:
      status === "ready"
        ? "Keep monitor, mode, interaction, desktop, and narrow-pane gates green."
        : "Resolve Arena acceptance gates before closing Phase 10 polish."
  };
}

function buildAriaLabel(snapshot: Omit<Phase10ArenaPolishSnapshot, "ariaLabel">): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.visiblePanelCount}/${snapshot.adaptivePanelCount} adaptive panels visible; ` +
    `${snapshot.readyCount} ready, ${snapshot.reviewCount} review, ` +
    `${snapshot.blockedCount} blocked, ${snapshot.waitingCount} waiting; ` +
    `next action: ${snapshot.nextAction}`
  );
}

export function buildPhase10ArenaPolishSnapshot(
  input: Phase10ArenaPolishInput
): Phase10ArenaPolishSnapshot {
  const adaptivePanelCount = sanitizeCount(input.adaptivePanelCount);
  const visiblePanelCount = sanitizeCount(input.visiblePanelCount);
  const hiddenPanelCount = sanitizeCount(input.hiddenPanelCount);
  const normalizedInput = {
    ...input,
    adaptivePanelCount,
    visiblePanelCount,
    hiddenPanelCount
  };
  const items = [
    layoutRegressionItem(normalizedInput),
    densityItem(normalizedInput),
    keyboardItem(normalizedInput),
    focusItem(normalizedInput),
    terminologyItem(normalizedInput),
    acceptanceItem(normalizedInput)
  ];
  const state = resolveState(items);
  const readiness = scoreItems(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const waitingCount = items.filter((item) => item.status === "waiting").length;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    adaptivePanelCount,
    visiblePanelCount,
    hiddenPanelCount,
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
