import { currentProjectManagementPhasePlanTaskIds } from "./projectManagementPhasePlan";
import type { Phase4ProviderCatalogDepthSummary } from "./phase4ProviderCatalogDepth";
import type {
  Phase4ProviderSurfaceDepthSnapshot,
  Phase4ProviderSurfaceDepthState
} from "./phase4ProviderSurfaceDepth";
import type { Phase4RefreshSafetyDepthSummary } from "./phase4RefreshSafetyDepth";
import {
  findCurrentActiveRemainingGoals,
  isCurrentActiveRemainingGoal,
  remainingGoalPlan,
  type RemainingGoalPlanItem
} from "./remainingGoalPlan";

export type Phase4ProviderTraceabilityState = Phase4ProviderSurfaceDepthState;

export type Phase4ProviderTraceabilityItemKind =
  | "active-goal"
  | "pm-coverage"
  | "catalog-depth"
  | "refresh-safety"
  | "surface-depth"
  | "record-chain"
  | "execution-lock";

export interface Phase4ProviderTraceabilityItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase4ProviderTraceabilityItemKind;
  readonly status: Phase4ProviderTraceabilityState;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase4ProviderTraceabilitySummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase4ProviderTraceabilityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canTrustProviderReview: boolean;
  readonly readyCount: number;
  readonly previewCount: number;
  readonly setupRequiredCount: number;
  readonly heldCount: number;
  readonly missingPmTaskIds: readonly string[];
  readonly linkedGoalId: string;
  readonly linkedPmTaskCount: number;
  readonly catalogDepthRecordCount: number;
  readonly refreshSafetyRecordCount: number;
  readonly surfaceDepthItemCount: number;
  readonly executionLockCount: number;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase4ProviderTraceabilityItem[];
}

const TRACE_ID = "phase-04-provider-traceability";
const TRACE_LABEL = "Phase 4 provider traceability";
const PHASE4_GOAL_ID = "goal-phase-4-provider-surfaces";
const PHASE4_PHASE_ID = "phase-04-provider-surfaces";
const REQUIRED_PM_TASK_IDS = [
  "phase-04-provider-surfaces",
  "phase-04-parent-catalogs",
  "phase-04-child-command-skill",
  "phase-04-child-plugin-mcp",
  "phase-04-child-catalog-depth",
  "phase-04-child-surface-depth",
  "phase-04-child-approval-record",
  "phase-04-child-audit-record",
  "phase-04-child-rollback-record",
  "phase-04-child-permission-record",
  "phase-04-child-traceability",
  "phase-04-child-blocker-priority",
  "phase-04-parent-refresh-safety",
  "phase-04-child-refresh-smoke",
  "phase-04-child-refresh-safety-depth"
] as const;
const SAFETY =
  "Phase 4 provider traceability is evidence-only. It links the remaining goal, Project Management rows, provider catalog depth, refresh safety depth, surface depth, and execution locks without running commands, skills, plugins, MCP tools, automations, personalization changes, network calls, terminal commands, Git actions, or profile mutations.";

const STATUS_LABELS: Record<Phase4ProviderTraceabilityState, string> = {
  ready: "Ready",
  preview: "Preview",
  "setup-required": "Setup required",
  blocked: "Blocked",
  unsupported: "Unsupported",
  unavailable: "Unavailable"
};

function stateWeight(state: Phase4ProviderTraceabilityState): number {
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

function scoreItems(items: readonly Phase4ProviderTraceabilityItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length);
}

function resolveState(
  items: readonly Phase4ProviderTraceabilityItem[]
): Phase4ProviderTraceabilityState {
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

function firstNextAction(items: readonly Phase4ProviderTraceabilityItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "setup-required")?.nextAction ??
    items.find((item) => item.status === "unavailable")?.nextAction ??
    items.find((item) => item.status === "unsupported")?.nextAction ??
    items.find((item) => item.status === "preview")?.nextAction ??
    "Keep Phase 4 provider traceability attached while provider execution remains locked."
  );
}

function publicText(value: string | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  const sanitized = value
    .replace(/[A-Za-z]:[\\/][^\s]+/g, "local path")
    .replace(/[\\/](Users|Projects|Documents|Desktop)[\\/][^\s]+/gi, "local path")
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "redacted token")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.length > 0 ? sanitized : fallback;
}

function activeGoalNextAction(
  goal: RemainingGoalPlanItem,
  currentActiveGoalIds: readonly string[],
  isTrustedPhase4Goal: boolean
): string {
  if (isTrustedPhase4Goal) {
    return publicText(
      goal.nextAction,
      "Keep Phase 4 provider traceability attached while provider execution remains locked."
    );
  }

  if (currentActiveGoalIds.length === 1) {
    return (
      `Keep Phase 4 provider review held until ${PHASE4_GOAL_ID} is the single current active remaining goal; ` +
      `current active goal is ${currentActiveGoalIds[0]}. After that, ${publicText(
        goal.nextAction,
        "run the owner-visible provider readiness check."
      )}`
    );
  }

  return `Keep exactly one current active remaining goal before Phase 4 provider review can be trusted: ${currentActiveGoalIds.join(", ") || "none"}.`;
}

function phase4Goal(goals: readonly RemainingGoalPlanItem[]): RemainingGoalPlanItem | undefined {
  return goals.find((goal) => goal.id === PHASE4_GOAL_ID);
}

function goalItem(
  goal: RemainingGoalPlanItem | undefined,
  currentActiveGoalIds: readonly string[]
): Phase4ProviderTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:active-goal`,
      label: "Remaining goal link",
      kind: "active-goal",
      status: "blocked",
      detail: "The Phase 4 provider surfaces goal is missing.",
      nextAction: "Restore goal-phase-4-provider-surfaces before provider review can be trusted."
    };
  }

  if (!goal.phaseIds.includes(PHASE4_PHASE_ID)) {
    return {
      id: `${TRACE_ID}:active-goal`,
      label: "Remaining goal link",
      kind: "active-goal",
      status: "blocked",
      detail: `${goal.id} does not link to ${PHASE4_PHASE_ID}.`,
      nextAction: "Restore the Phase 4 phase link on the provider surfaces goal."
    };
  }

  const exactlyOneCurrentActiveGoal = currentActiveGoalIds.length === 1;
  const isTrustedPhase4Goal =
    isCurrentActiveRemainingGoal(goal) && exactlyOneCurrentActiveGoal;

  return {
    id: `${TRACE_ID}:active-goal`,
    label: "Remaining goal link",
    kind: "active-goal",
    status:
      goal.status === "blocked"
        ? "blocked"
        : isTrustedPhase4Goal
          ? "ready"
          : goal.status === "active"
            ? "preview"
            : "preview",
    detail:
      `${goal.id} is ${goal.status} at ${goal.completionPercent}% with ${goal.pmTaskIds.length} PM task links ` +
      `and ${currentActiveGoalIds.length} current active goal${currentActiveGoalIds.length === 1 ? "" : "s"}.`,
    nextAction: activeGoalNextAction(goal, currentActiveGoalIds, isTrustedPhase4Goal)
  };
}

function pmCoverageItem(
  goal: RemainingGoalPlanItem | undefined,
  missingPmTaskIds: readonly string[]
): Phase4ProviderTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: "PM coverage cannot be checked without the Phase 4 goal.",
      nextAction: "Restore the Phase 4 remaining goal and PM task links."
    };
  }

  if (missingPmTaskIds.length > 0) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: `${missingPmTaskIds.length} required Phase 4 PM task link${missingPmTaskIds.length === 1 ? "" : "s"} are missing: ${missingPmTaskIds.join(", ")}.`,
      nextAction: "Add the missing Phase 4 PM child links before provider review advances."
    };
  }

  return {
    id: `${TRACE_ID}:pm-coverage`,
    label: "PM row coverage",
    kind: "pm-coverage",
    status: "ready",
    detail: `${goal.pmTaskIds.length} Phase 4 PM task links cover provider catalogs, surface depth, refresh safety, traceability, and blocker priority.`,
    nextAction: "Keep Phase 4 goal links aligned with the Project Management Epic, Parent, and Child rows."
  };
}

function catalogDepthItem(
  catalogDepth: Phase4ProviderCatalogDepthSummary
): Phase4ProviderTraceabilityItem {
  if (catalogDepth.heldCount > 0) {
    return {
      id: `${TRACE_ID}:catalog-depth`,
      label: "Catalog-depth evidence",
      kind: "catalog-depth",
      status: "unavailable",
      detail: `${catalogDepth.heldCount} provider catalog surface${catalogDepth.heldCount === 1 ? "" : "s"} remain held across ${catalogDepth.records.length} records.`,
      nextAction: publicText(catalogDepth.nextAction, "Resolve held provider catalog rows.")
    };
  }

  if (catalogDepth.setupRequiredCount > 0) {
    return {
      id: `${TRACE_ID}:catalog-depth`,
      label: "Catalog-depth evidence",
      kind: "catalog-depth",
      status: "setup-required",
      detail: `${catalogDepth.setupRequiredCount} catalog surface${catalogDepth.setupRequiredCount === 1 ? "" : "s"} still require setup.`,
      nextAction: publicText(catalogDepth.nextAction, "Resolve setup-required provider rows.")
    };
  }

  return {
    id: `${TRACE_ID}:catalog-depth`,
    label: "Catalog-depth evidence",
    kind: "catalog-depth",
    status: catalogDepth.previewCount > 0 ? "preview" : "ready",
    detail: `${catalogDepth.records.length} provider catalog depth rows expose ${catalogDepth.executionLockCount} execution locks.`,
    nextAction: publicText(catalogDepth.nextAction, "Review provider catalog depth rows.")
  };
}

function refreshSafetyItem(
  refreshSafety: Phase4RefreshSafetyDepthSummary
): Phase4ProviderTraceabilityItem {
  if (refreshSafety.blockedCount > 0) {
    return {
      id: `${TRACE_ID}:refresh-safety`,
      label: "Refresh-safety evidence",
      kind: "refresh-safety",
      status: "blocked",
      detail: `${refreshSafety.blockedCount} refresh-safety blocker${refreshSafety.blockedCount === 1 ? "" : "s"} remain across ${refreshSafety.records.length} records.`,
      nextAction: publicText(refreshSafety.nextAction, "Resolve refresh-safety blockers.")
    };
  }

  return {
    id: `${TRACE_ID}:refresh-safety`,
    label: "Refresh-safety evidence",
    kind: "refresh-safety",
    status: refreshSafety.previewCount > 0 ? "preview" : "ready",
    detail: `${refreshSafety.records.length} refresh-safety records show ${refreshSafety.readyCount} ready and ${refreshSafety.previewCount} preview rows.`,
    nextAction: publicText(refreshSafety.nextAction, "Keep refresh safety proof attached.")
  };
}

function surfaceDepthItem(
  surfaceDepth: Phase4ProviderSurfaceDepthSnapshot
): Phase4ProviderTraceabilityItem {
  return {
    id: `${TRACE_ID}:surface-depth`,
    label: "Surface-depth evidence",
    kind: "surface-depth",
    status: surfaceDepth.state,
    detail: `${surfaceDepth.items.length} surface-depth rows show ${surfaceDepth.attentionCount} attention items and ${surfaceDepth.heldCount} held rows.`,
    nextAction: publicText(surfaceDepth.nextAction, "Resolve Phase 4 surface-depth blockers.")
  };
}

const RECORD_CHAIN_KINDS = [
  "approval-gate",
  "audit-gate",
  "rollback-gate",
  "permission-gate"
] as const;

function recordChainItem(
  surfaceDepth: Phase4ProviderSurfaceDepthSnapshot
): Phase4ProviderTraceabilityItem {
  const gateItems = surfaceDepth.items.filter((item) =>
    RECORD_CHAIN_KINDS.includes(item.kind as (typeof RECORD_CHAIN_KINDS)[number])
  );
  const readyGateItems = gateItems.filter((item) => item.status === "ready");
  const firstOpenGate = gateItems.find((item) => item.status !== "ready");

  return {
    id: `${TRACE_ID}:record-chain`,
    label: "Local record chain",
    kind: "record-chain",
    status: firstOpenGate?.status ?? (readyGateItems.length === RECORD_CHAIN_KINDS.length ? "ready" : "preview"),
    detail:
      `${readyGateItems.length}/${RECORD_CHAIN_KINDS.length} local approval, audit, rollback, and permission record gates are ready.` +
      (firstOpenGate ? ` Next open gate: ${firstOpenGate.label}. ${firstOpenGate.detail}` : ""),
    nextAction: firstOpenGate
      ? publicText(firstOpenGate.nextAction, "Complete the next local provider record gate.")
      : "Keep the local approval, audit, rollback, and permission record chain attached while provider execution remains locked."
  };
}

function executionLockItem({
  catalogDepth,
  surfaceDepth
}: {
  catalogDepth: Phase4ProviderCatalogDepthSummary;
  surfaceDepth: Phase4ProviderSurfaceDepthSnapshot;
}): Phase4ProviderTraceabilityItem {
  const executionLocked =
    catalogDepth.executionLockCount >= 6 &&
    !surfaceDepth.canEnableExecution;

  return {
    id: `${TRACE_ID}:execution-lock`,
    label: "Provider execution lock",
    kind: "execution-lock",
    status: executionLocked ? "ready" : "blocked",
    detail: executionLocked
      ? `${catalogDepth.executionLockCount} catalog locks are visible and provider execution remains disabled.`
      : "Provider execution lock evidence is incomplete or execution is enabled too early.",
    nextAction: executionLocked
      ? "Keep command, skill, plugin, MCP, automation, and personalization execution locked."
      : "Restore provider execution locks before Phase 4 provider review can advance."
  };
}

function buildAriaLabel(
  summary: Omit<Phase4ProviderTraceabilitySummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `${summary.readyCount} ready, ${summary.previewCount} preview, ` +
    `${summary.setupRequiredCount} setup required, ${summary.heldCount} held; ` +
    `${summary.linkedPmTaskCount} PM links, ${summary.catalogDepthRecordCount} catalog-depth rows, ` +
    `${summary.refreshSafetyRecordCount} refresh-safety rows, ${summary.surfaceDepthItemCount} surface-depth rows, ` +
    `${summary.executionLockCount} execution locks; next action: ${summary.nextAction}`
  );
}

export function buildPhase4ProviderTraceabilitySummary({
  catalogDepth,
  refreshSafety,
  surfaceDepth,
  goals = remainingGoalPlan
}: {
  catalogDepth: Phase4ProviderCatalogDepthSummary;
  refreshSafety: Phase4RefreshSafetyDepthSummary;
  surfaceDepth: Phase4ProviderSurfaceDepthSnapshot;
  goals?: readonly RemainingGoalPlanItem[];
}): Phase4ProviderTraceabilitySummary {
  const goal = phase4Goal(goals);
  const goalPmTaskIds = new Set(goal?.pmTaskIds ?? []);
  const missingPlanPmTaskIds = REQUIRED_PM_TASK_IDS.filter(
    (taskId) => !currentProjectManagementPhasePlanTaskIds.has(taskId)
  );
  const missingGoalPmTaskIds = REQUIRED_PM_TASK_IDS.filter((taskId) => !goalPmTaskIds.has(taskId));
  const missingPmTaskIds = Array.from(
    new Set([...missingPlanPmTaskIds, ...missingGoalPmTaskIds])
  );
  const currentActiveGoalIds = findCurrentActiveRemainingGoals(goals).map((item) => item.id);
  const items = [
    goalItem(goal, currentActiveGoalIds),
    pmCoverageItem(goal, missingPmTaskIds),
    catalogDepthItem(catalogDepth),
    refreshSafetyItem(refreshSafety),
    surfaceDepthItem(surfaceDepth),
    recordChainItem(surfaceDepth),
    executionLockItem({ catalogDepth, surfaceDepth })
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
    id: TRACE_ID,
    label: TRACE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: scoreItems(items),
    canTrustProviderReview:
      state === "ready" &&
      isCurrentActiveRemainingGoal(goal) &&
      currentActiveGoalIds.length === 1 &&
      missingPmTaskIds.length === 0 &&
      catalogDepth.executionLockCount >= 6 &&
      !surfaceDepth.canEnableExecution,
    readyCount,
    previewCount,
    setupRequiredCount,
    heldCount,
    missingPmTaskIds,
    linkedGoalId: goal?.id ?? PHASE4_GOAL_ID,
    linkedPmTaskCount: goal?.pmTaskIds.length ?? 0,
    catalogDepthRecordCount: catalogDepth.records.length,
    refreshSafetyRecordCount: refreshSafety.records.length,
    surfaceDepthItemCount: surfaceDepth.items.length,
    executionLockCount: catalogDepth.executionLockCount,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
