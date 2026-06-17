import type {
  ProviderIntegrationReadiness,
  ProviderIntegrationReadinessState
} from "./providerIntegrationReadiness";

export type Phase4ProviderSurfaceDepthState = ProviderIntegrationReadinessState;

export type Phase4ProviderSurfaceDepthItemKind =
  | "surface-coverage"
  | "setup-blockers"
  | "capability-gaps"
  | "preview-review"
  | "execution-lock";

export interface Phase4ProviderSurfaceDepthItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase4ProviderSurfaceDepthItemKind;
  readonly status: Phase4ProviderSurfaceDepthState;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase4ProviderSurfaceDepthSnapshot {
  readonly id: string;
  readonly label: string;
  readonly state: Phase4ProviderSurfaceDepthState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canEnableExecution: boolean;
  readonly attentionCount: number;
  readonly readyCount: number;
  readonly previewCount: number;
  readonly setupRequiredCount: number;
  readonly heldCount: number;
  readonly nextSurfaceLabel: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase4ProviderSurfaceDepthItem[];
}

const SNAPSHOT_ID = "phase-4-provider-surface-depth";
const SNAPSHOT_LABEL = "Phase 4 provider surface depth";
const SAFETY =
  "Phase 4 provider surface depth is metadata-only. It does not execute commands, skills, plugins, MCP tools, automations, personalization changes, network calls, profile mutations, terminal commands, or Git actions.";

const STATUS_LABELS: Record<Phase4ProviderSurfaceDepthState, string> = {
  ready: "Ready",
  preview: "Preview",
  "setup-required": "Setup required",
  blocked: "Blocked",
  unsupported: "Unsupported",
  unavailable: "Unavailable"
};

function stateWeight(state: Phase4ProviderSurfaceDepthState): number {
  switch (state) {
    case "ready":
      return 100;
    case "preview":
      return 70;
    case "setup-required":
      return 40;
    case "unsupported":
    case "unavailable":
      return 25;
    case "blocked":
    default:
      return 0;
  }
}

function resolveState(
  items: readonly Phase4ProviderSurfaceDepthItem[]
): Phase4ProviderSurfaceDepthState {
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "setup-required")) {
    return "setup-required";
  }
  if (items.some((item) => item.status === "unavailable")) {
    return "unavailable";
  }
  if (items.some((item) => item.status === "unsupported")) {
    return "unsupported";
  }
  if (items.some((item) => item.status === "preview")) {
    return "preview";
  }
  return "ready";
}

function scoreItems(items: readonly Phase4ProviderSurfaceDepthItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function firstNextAction(items: readonly Phase4ProviderSurfaceDepthItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "setup-required")?.nextAction ??
    items.find((item) => item.status === "unavailable")?.nextAction ??
    items.find((item) => item.status === "unsupported")?.nextAction ??
    items.find((item) => item.status === "preview")?.nextAction ??
    "Keep provider execution locked until approval, audit, rollback, and explicit execution gates are implemented."
  );
}

function surfaceCoverageItem(
  readiness: ProviderIntegrationReadiness
): Phase4ProviderSurfaceDepthItem {
  const missingSurfaceCount = Math.max(0, 6 - readiness.surfaces.length);
  const emptySurfaceCount = readiness.surfaces.filter((surface) => surface.total === 0).length;

  if (missingSurfaceCount > 0 || emptySurfaceCount > 0) {
    return {
      id: `${SNAPSHOT_ID}:surface-coverage`,
      label: "Surface coverage",
      kind: "surface-coverage",
      status: "unavailable",
      detail: `${readiness.surfaces.length}/6 provider surfaces are present; ${emptySurfaceCount} present surface${emptySurfaceCount === 1 ? "" : "s"} have no entries.`,
      nextAction: "Refresh or connect provider metadata until all six provider surfaces have visible rows."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:surface-coverage`,
    label: "Surface coverage",
    kind: "surface-coverage",
    status: "ready",
    detail: "Command, skill, plugin, MCP, automation, and personalization surfaces are all visible.",
    nextAction: "Keep all six surfaces visible while execution remains locked."
  };
}

function setupBlockersItem(
  readiness: ProviderIntegrationReadiness
): Phase4ProviderSurfaceDepthItem {
  if (readiness.counts.setupRequired > 0) {
    return {
      id: `${SNAPSHOT_ID}:setup-blockers`,
      label: "Setup blockers",
      kind: "setup-blockers",
      status: "setup-required",
      detail: `${readiness.counts.setupRequired} setup-required or disconnected provider row${readiness.counts.setupRequired === 1 ? "" : "s"} remain.`,
      nextAction: "Resolve setup-required or disconnected provider rows before execution can be considered."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:setup-blockers`,
    label: "Setup blockers",
    kind: "setup-blockers",
    status: "ready",
    detail: "No setup-required or disconnected provider rows remain.",
    nextAction: "Keep setup blockers clear across refreshes."
  };
}

function capabilityGapsItem(
  readiness: ProviderIntegrationReadiness
): Phase4ProviderSurfaceDepthItem {
  if (readiness.counts.blocked > 0) {
    return {
      id: `${SNAPSHOT_ID}:capability-gaps`,
      label: "Capability gaps",
      kind: "capability-gaps",
      status: "blocked",
      detail: `${readiness.counts.blocked} provider validation blocker${readiness.counts.blocked === 1 ? "" : "s"} remain.`,
      nextAction: "Fix provider validation inconsistencies before refreshing again or enabling execution."
    };
  }

  if (readiness.counts.unavailable > 0) {
    return {
      id: `${SNAPSHOT_ID}:capability-gaps`,
      label: "Capability gaps",
      kind: "capability-gaps",
      status: "unavailable",
      detail: `${readiness.counts.unavailable} unavailable provider row${readiness.counts.unavailable === 1 ? "" : "s"} remain.`,
      nextAction: "Connect provider metadata or keep unavailable rows visibly held."
    };
  }

  if (readiness.counts.unsupported > 0) {
    return {
      id: `${SNAPSHOT_ID}:capability-gaps`,
      label: "Capability gaps",
      kind: "capability-gaps",
      status: "unsupported",
      detail: `${readiness.counts.unsupported} unsupported provider row${readiness.counts.unsupported === 1 ? "" : "s"} remain.`,
      nextAction: "Document unsupported rows and replacement paths before enabling execution."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:capability-gaps`,
    label: "Capability gaps",
    kind: "capability-gaps",
    status: "ready",
    detail: "No blocked, unavailable, or unsupported provider rows remain.",
    nextAction: "Keep capability gaps clear across catalog refreshes."
  };
}

function previewReviewItem(
  readiness: ProviderIntegrationReadiness
): Phase4ProviderSurfaceDepthItem {
  if (readiness.counts.preview > 0) {
    return {
      id: `${SNAPSHOT_ID}:preview-review`,
      label: "Preview review",
      kind: "preview-review",
      status: "preview",
      detail: `${readiness.counts.preview} preview provider row${readiness.counts.preview === 1 ? "" : "s"} need owner review before execution.`,
      nextAction: "Review preview rows against live provider metadata before treating them as execution-ready."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:preview-review`,
    label: "Preview review",
    kind: "preview-review",
    status: "ready",
    detail: "No provider rows are preview-only.",
    nextAction: "Keep preview rows at zero before execution gates are considered."
  };
}

function executionLockItem(): Phase4ProviderSurfaceDepthItem {
  return {
    id: `${SNAPSHOT_ID}:execution-lock`,
    label: "Execution lock",
    kind: "execution-lock",
    status: "preview",
    detail: "Provider execution remains locked behind future approval, audit, rollback, and permission gates.",
    nextAction:
      "Keep provider metadata review separate from execution readiness until approval, audit, rollback, and permission gates exist."
  };
}

function nextSurfaceLabel(readiness: ProviderIntegrationReadiness): string {
  return (
    readiness.surfaces.find((surface) => surface.state !== "ready")?.label ??
    "Execution lock"
  );
}

function buildAriaLabel(
  snapshot: Omit<Phase4ProviderSurfaceDepthSnapshot, "ariaLabel">
): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.attentionCount} attention items; next surface: ${snapshot.nextSurfaceLabel}; ` +
    `execution ${snapshot.canEnableExecution ? "enabled" : "locked"}; next action: ${snapshot.nextAction}`
  );
}

export function buildPhase4ProviderSurfaceDepth(
  readiness: ProviderIntegrationReadiness
): Phase4ProviderSurfaceDepthSnapshot {
  const items = [
    surfaceCoverageItem(readiness),
    setupBlockersItem(readiness),
    capabilityGapsItem(readiness),
    previewReviewItem(readiness),
    executionLockItem()
  ];
  const state = resolveState(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const previewCount = items.filter((item) => item.status === "preview").length;
  const setupRequiredCount = items.filter((item) => item.status === "setup-required").length;
  const heldCount = items.filter((item) =>
    item.status === "blocked" ||
    item.status === "unsupported" ||
    item.status === "unavailable"
  ).length;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: scoreItems(items),
    canEnableExecution: false,
    attentionCount: items.length - readyCount,
    readyCount,
    previewCount,
    setupRequiredCount,
    heldCount,
    nextSurfaceLabel: nextSurfaceLabel(readiness),
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
