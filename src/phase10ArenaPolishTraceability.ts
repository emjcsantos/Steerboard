import { currentProjectManagementPhasePlanTaskIds } from "./projectManagementPhasePlan";
import type { Phase10ArenaPolishSnapshot, Phase10ArenaPolishState } from "./phase10ArenaPolish";
import {
  findCurrentActiveRemainingGoals,
  isCurrentActiveRemainingGoal,
  remainingGoalPlan,
  type RemainingGoalPlanItem
} from "./remainingGoalPlan";

export type Phase10ArenaPolishTraceabilityState = Phase10ArenaPolishState;

export type Phase10ArenaPolishTraceabilityItemKind =
  | "active-goal"
  | "pm-coverage"
  | "polish-readiness"
  | "layout-evidence"
  | "acceptance-gate";

export interface Phase10ArenaPolishTraceabilityItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase10ArenaPolishTraceabilityItemKind;
  readonly status: Phase10ArenaPolishTraceabilityState;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase10ArenaPolishTraceabilitySummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase10ArenaPolishTraceabilityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canTrustArenaPolish: boolean;
  readonly readyCount: number;
  readonly reviewCount: number;
  readonly blockedCount: number;
  readonly waitingCount: number;
  readonly missingPmTaskIds: readonly string[];
  readonly linkedGoalId: string;
  readonly linkedPmTaskCount: number;
  readonly acceptanceGateStatus: Phase10ArenaPolishTraceabilityState;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase10ArenaPolishTraceabilityItem[];
}

export interface Phase10ArenaPolishTraceabilityInput {
  readonly snapshot: Phase10ArenaPolishSnapshot;
  readonly goals?: readonly RemainingGoalPlanItem[];
}

const TRACE_ID = "phase-10-arena-polish-traceability";
const TRACE_LABEL = "Phase 10 Arena polish traceability";
const PHASE10_GOAL_ID = "goal-phase-10-arena-polish";
const PHASE10_PHASE_ID = "phase-10-adaptive-arena";
const REQUIRED_PM_TASK_IDS = [
  "phase-10-adaptive-arena",
  "phase-10-parent-layout-foundation",
  "phase-10-child-layout-regression",
  "phase-10-child-density-polish",
  "phase-10-parent-arena-identity",
  "phase-10-child-term-scan",
  "phase-10-child-traceability",
  "phase-10-child-blocker-priority"
];
const SAFETY =
  "Phase 10 Arena polish traceability is evidence-only. It links the remaining goal, Project Management rows, layout regression, density, keyboard, focus, terminology, and acceptance gates without launching runtime, mutating sources, changing saved sessions, or resuming packaging.";

const STATUS_LABELS: Record<Phase10ArenaPolishTraceabilityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase10ArenaPolishTraceabilityState): number {
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

function scoreItems(items: readonly Phase10ArenaPolishTraceabilityItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function resolveState(
  items: readonly Phase10ArenaPolishTraceabilityItem[]
): Phase10ArenaPolishTraceabilityState {
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

function firstNextAction(items: readonly Phase10ArenaPolishTraceabilityItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Keep Phase 10 Arena polish traceability attached while release packaging remains held."
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

function phase10Goal(goals: readonly RemainingGoalPlanItem[]): RemainingGoalPlanItem | undefined {
  return goals.find((goal) => goal.id === PHASE10_GOAL_ID);
}

function activeGoalItem(
  goal: RemainingGoalPlanItem | undefined,
  currentActiveGoalIds: readonly string[]
): Phase10ArenaPolishTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:active-goal`,
      label: "Remaining goal link",
      kind: "active-goal",
      status: "blocked",
      detail: "The Phase 10 remaining goal is missing.",
      nextAction: "Restore goal-phase-10-arena-polish before Arena polish can be trusted."
    };
  }

  if (!goal.phaseIds.includes(PHASE10_PHASE_ID)) {
    return {
      id: `${TRACE_ID}:active-goal`,
      label: "Remaining goal link",
      kind: "active-goal",
      status: "blocked",
      detail: `${goal.id} does not link to ${PHASE10_PHASE_ID}.`,
      nextAction: "Restore the Phase 10 phase link on the Arena polish goal."
    };
  }

  const exactlyOneCurrentActiveGoal = currentActiveGoalIds.length === 1;
  const isTrustedPhase10Goal =
    isCurrentActiveRemainingGoal(goal) && exactlyOneCurrentActiveGoal;

  return {
    id: `${TRACE_ID}:active-goal`,
    label: "Remaining goal link",
    kind: "active-goal",
    status:
      goal.status === "blocked"
        ? "blocked"
        : isTrustedPhase10Goal
          ? "ready"
          : goal.status === "active"
            ? "review"
            : "waiting",
    detail:
      `${goal.id} is ${goal.status} at ${goal.completionPercent}% with ${goal.pmTaskIds.length} PM task links ` +
      `and ${currentActiveGoalIds.length} current active goal${currentActiveGoalIds.length === 1 ? "" : "s"}.`,
    nextAction: exactlyOneCurrentActiveGoal
      ? publicText(
          goal.nextAction,
          "Make Phase 10 the current active goal before Arena polish can be trusted."
        )
      : `Keep exactly one current active remaining goal before Phase 10 Arena polish can be trusted: ${currentActiveGoalIds.join(", ") || "none"}.`
  };
}

function pmCoverageItem(
  goal: RemainingGoalPlanItem | undefined,
  missingPmTaskIds: readonly string[]
): Phase10ArenaPolishTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: "PM coverage cannot be checked without the Phase 10 goal.",
      nextAction: "Restore the Phase 10 remaining goal and PM task links."
    };
  }

  if (missingPmTaskIds.length > 0) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: `${missingPmTaskIds.length} required Phase 10 PM task link${missingPmTaskIds.length === 1 ? "" : "s"} are missing: ${missingPmTaskIds.join(", ")}.`,
      nextAction: "Add the missing Phase 10 PM child links before Arena polish advances."
    };
  }

  return {
    id: `${TRACE_ID}:pm-coverage`,
    label: "PM row coverage",
    kind: "pm-coverage",
    status: "ready",
    detail: `${goal.pmTaskIds.length} Phase 10 PM task links cover layout foundation, density polish, Arena identity, traceability, and blocker priority rows.`,
    nextAction: "Keep Phase 10 goal links aligned with the Project Management Epic, Parent, and Child rows."
  };
}

function polishReadinessItem(
  snapshot: Phase10ArenaPolishSnapshot
): Phase10ArenaPolishTraceabilityItem {
  return {
    id: `${TRACE_ID}:polish-readiness`,
    label: "Arena polish readiness",
    kind: "polish-readiness",
    status: snapshot.state,
    detail: `${snapshot.readyCount} ready, ${snapshot.reviewCount} review, ${snapshot.blockedCount} blocked, and ${snapshot.waitingCount} waiting Phase 10 polish checks are visible.`,
    nextAction: publicText(snapshot.nextAction, "Resolve Phase 10 Arena polish blockers.")
  };
}

function layoutEvidenceItem(
  snapshot: Phase10ArenaPolishSnapshot
): Phase10ArenaPolishTraceabilityItem {
  const layoutItem = snapshot.items.find((item) => item.kind === "layout-regression");
  const densityItem = snapshot.items.find((item) => item.kind === "density");
  const status =
    layoutItem?.status === "blocked" || densityItem?.status === "blocked"
      ? "blocked"
      : layoutItem?.status === "review" || densityItem?.status === "review"
        ? "review"
        : layoutItem?.status === "waiting" || densityItem?.status === "waiting"
          ? "waiting"
          : "ready";

  return {
    id: `${TRACE_ID}:layout-evidence`,
    label: "Layout and density evidence",
    kind: "layout-evidence",
    status,
    detail: `${snapshot.visiblePanelCount}/${snapshot.adaptivePanelCount} adaptive panels are visible with ${snapshot.hiddenPanelCount} hidden panels.`,
    nextAction:
      status === "ready"
        ? "Keep layout regression and density evidence visible before packaging resumes."
        : "Resolve layout regression or density evidence before closing Phase 10."
  };
}

function acceptanceGateItem(
  snapshot: Phase10ArenaPolishSnapshot
): Phase10ArenaPolishTraceabilityItem {
  const acceptance = snapshot.items.find((item) => item.kind === "acceptance");

  return {
    id: `${TRACE_ID}:acceptance-gate`,
    label: "Acceptance gate",
    kind: "acceptance-gate",
    status: acceptance?.status ?? "waiting",
    detail: acceptance?.detail ?? "Phase 10 acceptance gate evidence is missing.",
    nextAction: publicText(
      acceptance?.nextAction,
      "Restore Phase 10 acceptance gate evidence before release packaging resumes."
    )
  };
}

function buildAriaLabel(
  summary: Omit<Phase10ArenaPolishTraceabilitySummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `${summary.linkedPmTaskCount} PM links; ${summary.blockedCount} blocked; ` +
    `${summary.waitingCount} waiting; acceptance ${summary.acceptanceGateStatus}; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase10ArenaPolishTraceability(
  input: Phase10ArenaPolishTraceabilityInput
): Phase10ArenaPolishTraceabilitySummary {
  const goals = input.goals ?? remainingGoalPlan;
  const goal = phase10Goal(goals);
  const planTaskIds = new Set(currentProjectManagementPhasePlanTaskIds);
  const missingPmTaskIds = REQUIRED_PM_TASK_IDS.filter(
    (taskId) => !goal?.pmTaskIds.includes(taskId) || !planTaskIds.has(taskId)
  );
  const currentActiveGoalIds = findCurrentActiveRemainingGoals(goals).map((item) => item.id);
  const items = [
    activeGoalItem(goal, currentActiveGoalIds),
    pmCoverageItem(goal, missingPmTaskIds),
    polishReadinessItem(input.snapshot),
    layoutEvidenceItem(input.snapshot),
    acceptanceGateItem(input.snapshot)
  ];
  const state = resolveState(items);
  const acceptanceGateStatus = items.find((item) => item.kind === "acceptance-gate")?.status ?? "waiting";
  const draft = {
    id: TRACE_ID,
    label: TRACE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: scoreItems(items),
    canTrustArenaPolish:
      state === "ready" &&
      isCurrentActiveRemainingGoal(goal) &&
      currentActiveGoalIds.length === 1 &&
      input.snapshot.state === "ready" &&
      missingPmTaskIds.length === 0,
    readyCount: items.filter((item) => item.status === "ready").length,
    reviewCount: items.filter((item) => item.status === "review").length,
    blockedCount: items.filter((item) => item.status === "blocked").length,
    waitingCount: items.filter((item) => item.status === "waiting").length,
    missingPmTaskIds,
    linkedGoalId: goal?.id ?? "",
    linkedPmTaskCount: goal?.pmTaskIds.length ?? 0,
    acceptanceGateStatus,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
