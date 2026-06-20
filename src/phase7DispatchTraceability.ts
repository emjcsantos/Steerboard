import { currentProjectManagementPhasePlanTaskIds } from "./projectManagementPhasePlan";
import type { DispatchReviewRecord } from "./dispatchReviewRecord";
import type { Phase7DispatchReviewDepthSnapshot } from "./phase7DispatchReviewDepth";
import type { Phase7IntegrationOwnershipDepthSnapshot } from "./phase7IntegrationOwnershipDepth";
import {
  findCurrentActiveRemainingGoals,
  isCurrentActiveRemainingGoal,
  remainingGoalPlan,
  type RemainingGoalPlanItem
} from "./remainingGoalPlan";

export type Phase7DispatchTraceabilityState = "ready" | "review" | "blocked" | "waiting";

export type Phase7DispatchTraceabilityItemKind =
  | "active-goal"
  | "pm-coverage"
  | "review-depth"
  | "integration-ownership"
  | "live-worker-lock";

export interface Phase7DispatchTraceabilityItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase7DispatchTraceabilityItemKind;
  readonly status: Phase7DispatchTraceabilityState;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase7DispatchTraceabilitySummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase7DispatchTraceabilityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canTrustDispatchReview: boolean;
  readonly readyCount: number;
  readonly reviewCount: number;
  readonly blockedCount: number;
  readonly waitingCount: number;
  readonly missingPmTaskIds: readonly string[];
  readonly linkedGoalId: string;
  readonly linkedPmTaskCount: number;
  readonly liveWorkerLockCount: number;
  readonly dispatchTraceabilityProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase7DispatchTraceabilityItem[];
}

export interface Phase7DispatchTraceabilityInput {
  readonly record?: DispatchReviewRecord;
  readonly depth: Phase7DispatchReviewDepthSnapshot;
  readonly ownership: Phase7IntegrationOwnershipDepthSnapshot;
  readonly goals?: readonly RemainingGoalPlanItem[];
}

const TRACE_ID = "phase-07-dispatch-traceability";
const TRACE_LABEL = "Phase 7 dispatch traceability";
const PHASE7_GOAL_ID = "goal-phase-7-dispatch-loop";
const PHASE7_PHASE_ID = "phase-07-dispatch-loop";
const REQUIRED_PM_TASK_IDS = [
  "phase-07-dispatch-loop",
  "phase-07-parent-role-panels",
  "phase-07-child-worker-preview",
  "phase-07-child-integration-owner",
  "phase-07-child-integration-ownership-depth",
  "phase-07-parent-observed-loop",
  "phase-07-child-handoff-trace",
  "phase-07-child-review-depth",
  "phase-07-child-traceability",
  "phase-07-child-blocker-priority",
  "phase-07-child-artifact-verification",
  "phase-07-child-launch-gate",
  "phase-07-child-closure-gate",
  "phase-07-child-closeout-proof",
  "phase-07-child-owner-handoff-report",
  "phase-07-child-completion-gate"
];
const SAFETY =
  "Phase 7 dispatch traceability is evidence-only. It links the remaining goal, Project Management rows, dispatch review depth, integration ownership depth, and live-worker lock without spawning workers, launching runtime sessions, running tools, mutating files, or pushing branches.";

const STATUS_LABELS: Record<Phase7DispatchTraceabilityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function statusWeight(status: Phase7DispatchTraceabilityState): number {
  switch (status) {
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

function readiness(items: readonly Phase7DispatchTraceabilityItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + statusWeight(item.status), 0) / items.length
  );
}

function resolveState(
  items: readonly Phase7DispatchTraceabilityItem[]
): Phase7DispatchTraceabilityState {
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

function firstNextAction(items: readonly Phase7DispatchTraceabilityItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Keep Phase 7 dispatch traceability attached while live worker spawning remains locked."
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

function phase7Goal(goals: readonly RemainingGoalPlanItem[]): RemainingGoalPlanItem | undefined {
  return goals.find((goal) => goal.id === PHASE7_GOAL_ID);
}

function isCompletedPhase7Goal(goal: RemainingGoalPlanItem): boolean {
  return (
    goal.id === PHASE7_GOAL_ID &&
    goal.status !== "blocked" &&
    goal.completionPercent === 100 &&
    goal.phaseIds.includes(PHASE7_PHASE_ID)
  );
}

function activeGoalItem(
  goal: RemainingGoalPlanItem | undefined,
  currentActiveGoalIds: readonly string[]
): Phase7DispatchTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:active-goal`,
      label: "Remaining goal link",
      kind: "active-goal",
      status: "blocked",
      detail: "The Phase 7 remaining goal is missing.",
      nextAction: "Restore goal-phase-7-dispatch-loop before dispatch review can be trusted."
    };
  }

  if (!goal.phaseIds.includes(PHASE7_PHASE_ID)) {
    return {
      id: `${TRACE_ID}:active-goal`,
      label: "Remaining goal link",
      kind: "active-goal",
      status: "blocked",
      detail: `${goal.id} does not link to ${PHASE7_PHASE_ID}.`,
      nextAction: "Restore the Phase 7 phase link on the dispatch loop goal."
    };
  }

  const exactlyOneCurrentActiveGoal = currentActiveGoalIds.length === 1;
  const isTrustedPhase7Goal =
    (isCurrentActiveRemainingGoal(goal) || isCompletedPhase7Goal(goal)) &&
    exactlyOneCurrentActiveGoal;

  return {
    id: `${TRACE_ID}:active-goal`,
    label: "Remaining goal link",
    kind: "active-goal",
    status:
      goal.status === "blocked"
        ? "blocked"
        : isTrustedPhase7Goal
          ? "ready"
          : goal.status === "active" || isCompletedPhase7Goal(goal)
            ? "review"
            : "waiting",
    detail:
      `${goal.id} is ${goal.status} at ${goal.completionPercent}% with ${goal.pmTaskIds.length} PM task links ` +
      `and ${currentActiveGoalIds.length} current active goal${currentActiveGoalIds.length === 1 ? "" : "s"}.`,
    nextAction: exactlyOneCurrentActiveGoal
      ? publicText(
          goal.nextAction,
          "Complete Phase 7 or make it the current active goal before dispatch review can be trusted."
        )
      : `Keep exactly one current active remaining goal before Phase 7 dispatch review can be trusted: ${currentActiveGoalIds.join(", ") || "none"}.`
  };
}

function pmCoverageItem(
  goal: RemainingGoalPlanItem | undefined,
  missingPmTaskIds: readonly string[]
): Phase7DispatchTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: "PM coverage cannot be checked without the Phase 7 goal.",
      nextAction: "Restore the Phase 7 remaining goal and PM task links."
    };
  }

  if (missingPmTaskIds.length > 0) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: `${missingPmTaskIds.length} required Phase 7 PM task link${missingPmTaskIds.length === 1 ? "" : "s"} are missing: ${missingPmTaskIds.join(", ")}.`,
      nextAction: "Add the missing Phase 7 PM child links before dispatch review advances."
    };
  }

  return {
    id: `${TRACE_ID}:pm-coverage`,
    label: "PM row coverage",
    kind: "pm-coverage",
    status: "ready",
    detail: `${goal.pmTaskIds.length} Phase 7 PM task links cover role panels, integration ownership, observed handoff, traceability, and blocker priority rows.`,
    nextAction: "Keep Phase 7 goal links aligned with the Project Management Epic, Parent, and Child rows."
  };
}

function reviewDepthItem(depth: Phase7DispatchReviewDepthSnapshot): Phase7DispatchTraceabilityItem {
  return {
    id: `${TRACE_ID}:review-depth`,
    label: "Dispatch review depth",
    kind: "review-depth",
    status: depth.state,
    detail: `${depth.openDepthCount} dispatch review depth check${depth.openDepthCount === 1 ? "" : "s"} are open across role coverage, attempt limits, handoff tasks, validation gates, and live-worker lock.`,
    nextAction: publicText(depth.nextAction, "Resolve Phase 7 dispatch review depth blockers.")
  };
}

function ownershipItem(
  ownership: Phase7IntegrationOwnershipDepthSnapshot
): Phase7DispatchTraceabilityItem {
  return {
    id: `${TRACE_ID}:integration-ownership`,
    label: "Integration ownership depth",
    kind: "integration-ownership",
    status: ownership.state,
    detail: `${ownership.openDepthCount} integration ownership check${ownership.openDepthCount === 1 ? "" : "s"} are open across final integration, final validation, commit/push/reporting, traceability, and closure boundary.`,
    nextAction: publicText(
      ownership.nextAction,
      "Resolve Phase 7 integration ownership depth blockers."
    )
  };
}

function liveWorkerLockItem(
  record: DispatchReviewRecord | undefined,
  depth: Phase7DispatchReviewDepthSnapshot,
  ownership: Phase7IntegrationOwnershipDepthSnapshot
): Phase7DispatchTraceabilityItem {
  const depthLockReady = depth.items.some(
    (item) => item.kind === "execution-lock" && item.status === "ready"
  );
  const ownershipLockReady = ownership.items.some(
    (item) => item.kind === "closure-boundary" && item.status === "ready"
  );

  if (!record) {
    return {
      id: `${TRACE_ID}:live-worker-lock`,
      label: "Live-worker lock",
      kind: "live-worker-lock",
      status: "waiting",
      detail: "No dispatch review record exists yet, so the live-worker lock cannot be proven.",
      nextAction: "Create a local dispatch review record before live worker spawning is considered."
    };
  }

  if (!depthLockReady || !ownershipLockReady) {
    return {
      id: `${TRACE_ID}:live-worker-lock`,
      label: "Live-worker lock",
      kind: "live-worker-lock",
      status: "blocked",
      detail: "The dispatch review depth or ownership closure boundary does not prove the local metadata-only live-worker lock.",
      nextAction: "Restore local metadata-only lock evidence before dispatch can leave review."
    };
  }

  return {
    id: `${TRACE_ID}:live-worker-lock`,
    label: "Live-worker lock",
    kind: "live-worker-lock",
    status: "ready",
    detail: "Dispatch review depth and closure boundary both keep live worker spawning locked.",
    nextAction: "Keep live worker spawning locked until explicit runtime approval exists."
  };
}

function buildAriaLabel(
  summary: Omit<Phase7DispatchTraceabilitySummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `${summary.blockedCount} blocked; ${summary.waitingCount} waiting; ` +
    `${summary.linkedPmTaskCount} PM links; ${summary.liveWorkerLockCount} live-worker locks; ` +
    `next action: ${summary.nextAction}`
  );
}

function buildDispatchTraceabilityProof(input: {
  readonly items: readonly Phase7DispatchTraceabilityItem[];
  readonly missingPmTaskIds: readonly string[];
  readonly linkedPmTaskCount: number;
  readonly liveWorkerLockCount: number;
  readonly canTrustDispatchReview: boolean;
}): string {
  const itemKinds = input.items.map((item) => item.kind).join("|");

  return (
    `items=${input.items.length}/5 ready=${input.items.filter((item) => item.status === "ready").length} ` +
    `review=${input.items.filter((item) => item.status === "review").length} ` +
    `blocked=${input.items.filter((item) => item.status === "blocked").length} ` +
    `waiting=${input.items.filter((item) => item.status === "waiting").length} ` +
    `itemKinds=${itemKinds} pmLinks=${input.linkedPmTaskCount}/16 ` +
    `missingPm=${input.missingPmTaskIds.length} liveWorkerLocks=${input.liveWorkerLockCount}/2 ` +
    `trust=${input.canTrustDispatchReview ? "ready" : "review"} execution=locked`
  );
}

export function buildPhase7DispatchTraceability(
  input: Phase7DispatchTraceabilityInput
): Phase7DispatchTraceabilitySummary {
  const goals = input.goals ?? remainingGoalPlan;
  const goal = phase7Goal(goals);
  const planTaskIds = new Set(currentProjectManagementPhasePlanTaskIds);
  const missingPmTaskIds = REQUIRED_PM_TASK_IDS.filter(
    (taskId) => !goal?.pmTaskIds.includes(taskId) || !planTaskIds.has(taskId)
  );
  const currentActiveGoalIds = findCurrentActiveRemainingGoals(goals).map((item) => item.id);
  const items = [
    activeGoalItem(goal, currentActiveGoalIds),
    pmCoverageItem(goal, missingPmTaskIds),
    reviewDepthItem(input.depth),
    ownershipItem(input.ownership),
    liveWorkerLockItem(input.record, input.depth, input.ownership)
  ];
  const state = resolveState(items);
  const liveWorkerLockCount =
    input.depth.items.filter((item) => item.kind === "execution-lock" && item.status === "ready").length +
    input.ownership.items.filter((item) => item.kind === "closure-boundary" && item.status === "ready").length;
  const canTrustDispatchReview =
    state === "ready" &&
    Boolean(goal && (isCurrentActiveRemainingGoal(goal) || isCompletedPhase7Goal(goal))) &&
    currentActiveGoalIds.length === 1 &&
    input.depth.state === "ready" &&
    input.ownership.state === "ready" &&
    missingPmTaskIds.length === 0 &&
    Boolean(input.record);
  const draft = {
    id: TRACE_ID,
    label: TRACE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readiness(items),
    canTrustDispatchReview,
    readyCount: items.filter((item) => item.status === "ready").length,
    reviewCount: items.filter((item) => item.status === "review").length,
    blockedCount: items.filter((item) => item.status === "blocked").length,
    waitingCount: items.filter((item) => item.status === "waiting").length,
    missingPmTaskIds,
    linkedGoalId: goal?.id ?? "",
    linkedPmTaskCount: goal?.pmTaskIds.length ?? 0,
    liveWorkerLockCount,
    dispatchTraceabilityProof: buildDispatchTraceabilityProof({
      items,
      missingPmTaskIds,
      linkedPmTaskCount: goal?.pmTaskIds.length ?? 0,
      liveWorkerLockCount,
      canTrustDispatchReview
    }),
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
