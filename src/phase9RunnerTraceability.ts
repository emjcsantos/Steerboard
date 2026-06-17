import { currentProjectManagementPhasePlanTaskIds } from "./projectManagementPhasePlan";
import type { Phase8PermissionAuditDepthSnapshot } from "./phase8PermissionAuditDepth";
import type { Phase9RunnerApprovalDepthSummary } from "./phase9RunnerApprovalDepth";
import type { Phase9RunnerApprovalSnapshot, Phase9RunnerApprovalState } from "./phase9RunnerApproval";
import { remainingGoalPlan, type RemainingGoalPlanItem } from "./remainingGoalPlan";

export type Phase9RunnerTraceabilityState = Phase9RunnerApprovalState;

export type Phase9RunnerTraceabilityItemKind =
  | "active-goal"
  | "pm-coverage"
  | "phase8-gate"
  | "approval-depth"
  | "mutation-lock";

export interface Phase9RunnerTraceabilityItem {
  id: string;
  label: string;
  kind: Phase9RunnerTraceabilityItemKind;
  status: Phase9RunnerTraceabilityState;
  detail: string;
  nextAction: string;
}

export interface Phase9RunnerTraceabilitySummary {
  id: string;
  label: string;
  state: Phase9RunnerTraceabilityState;
  statusLabel: string;
  readiness: number;
  canTrustRunnerApproval: boolean;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  waitingCount: number;
  missingPmTaskIds: string[];
  linkedGoalId: string;
  linkedPmTaskCount: number;
  phase8OpenExceptionCount: number;
  mutationLockCount: number;
  nextAction: string;
  safety: string;
  ariaLabel: string;
  items: Phase9RunnerTraceabilityItem[];
}

const TRACE_ID = "phase-09-runner-traceability";
const TRACE_LABEL = "Phase 9 runner traceability";
const PHASE9_GOAL_ID = "goal-phase-9-runner";
const PHASE9_PHASE_ID = "phase-09-desktop-runner";
const REQUIRED_PM_TASK_IDS = [
  "phase-09-desktop-runner",
  "phase-09-parent-runner-probe",
  "phase-09-child-reversible-action",
  "phase-09-child-runner-observability",
  "phase-09-child-traceability",
  "phase-09-parent-approval-flow",
  "phase-09-child-approval-record",
  "phase-09-child-approval-depth"
];
const SAFETY =
  "Phase 9 runner traceability is evidence-only. It links the remaining goal, Project Management rows, Phase 8 permission/audit depth, runner approval depth, and mutation locks without requesting permission, running the desktop probe, mutating files, or unlocking broader execution.";

const STATUS_LABELS: Record<Phase9RunnerTraceabilityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase9RunnerTraceabilityState): number {
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

function scoreItems(items: readonly Phase9RunnerTraceabilityItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function resolveState(items: readonly Phase9RunnerTraceabilityItem[]): Phase9RunnerTraceabilityState {
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

function firstNextAction(items: readonly Phase9RunnerTraceabilityItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Keep Phase 9 runner approval traceability attached while broader desktop execution stays locked."
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

function phase9Goal(goals: readonly RemainingGoalPlanItem[]): RemainingGoalPlanItem | undefined {
  return goals.find((goal) => goal.id === PHASE9_GOAL_ID);
}

function activeGoalItem(goal: RemainingGoalPlanItem | undefined): Phase9RunnerTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:active-goal`,
      label: "Remaining goal link",
      kind: "active-goal",
      status: "blocked",
      detail: "The Phase 9 remaining goal is missing.",
      nextAction: "Restore goal-phase-9-runner before runner approval can be trusted."
    };
  }

  if (!goal.phaseIds.includes(PHASE9_PHASE_ID)) {
    return {
      id: `${TRACE_ID}:active-goal`,
      label: "Remaining goal link",
      kind: "active-goal",
      status: "blocked",
      detail: `${goal.id} does not link to ${PHASE9_PHASE_ID}.`,
      nextAction: "Restore the Phase 9 phase link on the runner approval goal."
    };
  }

  return {
    id: `${TRACE_ID}:active-goal`,
    label: "Remaining goal link",
    kind: "active-goal",
    status: goal.status === "blocked" ? "blocked" : goal.status === "active" ? "review" : "ready",
    detail: `${goal.id} is ${goal.status} at ${goal.completionPercent}% with ${goal.pmTaskIds.length} PM task links.`,
    nextAction: publicText(goal.nextAction, "Review the Phase 9 runner approval goal.")
  };
}

function pmCoverageItem(
  goal: RemainingGoalPlanItem | undefined,
  missingPmTaskIds: readonly string[]
): Phase9RunnerTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: "PM coverage cannot be checked without the Phase 9 goal.",
      nextAction: "Restore the Phase 9 remaining goal and PM task links."
    };
  }

  if (missingPmTaskIds.length > 0) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: `${missingPmTaskIds.length} required Phase 9 PM task link${missingPmTaskIds.length === 1 ? "" : "s"} are missing: ${missingPmTaskIds.join(", ")}.`,
      nextAction: "Add the missing Phase 9 PM child links before runner approval advances."
    };
  }

  return {
    id: `${TRACE_ID}:pm-coverage`,
    label: "PM row coverage",
    kind: "pm-coverage",
    status: "ready",
    detail: `${goal.pmTaskIds.length} Phase 9 PM task links cover the runner probe, approval flow, depth, and traceability rows.`,
    nextAction: "Keep Phase 9 goal links aligned with the Project Management Epic, Parent, and Child rows."
  };
}

function phase8GateItem(
  phase8: Phase8PermissionAuditDepthSnapshot
): Phase9RunnerTraceabilityItem {
  if (phase8.blockedCount > 0) {
    return {
      id: `${TRACE_ID}:phase8-gate`,
      label: "Phase 8 audit gate",
      kind: "phase8-gate",
      status: "blocked",
      detail: `${phase8.blockedCount} Phase 8 permission or audit blocker${phase8.blockedCount === 1 ? "" : "s"} remain before Phase 9 can advance.`,
      nextAction: publicText(phase8.nextAction, "Resolve Phase 8 blockers before Phase 9.")
    };
  }

  if (phase8.openExceptionCount > 0 || phase8.reviewCount > 0) {
    return {
      id: `${TRACE_ID}:phase8-gate`,
      label: "Phase 8 audit gate",
      kind: "phase8-gate",
      status: "review",
      detail: `${phase8.openExceptionCount} Phase 8 open exception${phase8.openExceptionCount === 1 ? "" : "s"} remain across permission, approval, evidence, and rollback rows.`,
      nextAction: publicText(phase8.nextAction, "Review Phase 8 exceptions before Phase 9.")
    };
  }

  if (phase8.waitingCount > 0) {
    return {
      id: `${TRACE_ID}:phase8-gate`,
      label: "Phase 8 audit gate",
      kind: "phase8-gate",
      status: "waiting",
      detail: `${phase8.waitingCount} Phase 8 permission or audit row${phase8.waitingCount === 1 ? "" : "s"} are still waiting.`,
      nextAction: publicText(phase8.nextAction, "Complete Phase 8 waiting rows before Phase 9.")
    };
  }

  return {
    id: `${TRACE_ID}:phase8-gate`,
    label: "Phase 8 audit gate",
    kind: "phase8-gate",
    status: "ready",
    detail: "Phase 8 permission, approval, evidence, audit, and rollback rows are ready for the fixed probe path.",
    nextAction: "Keep Phase 8 ready before any Phase 9 runner request is treated as trustworthy."
  };
}

function approvalDepthItem(
  approval: Phase9RunnerApprovalSnapshot,
  depth: Phase9RunnerApprovalDepthSummary
): Phase9RunnerTraceabilityItem {
  if (approval.blockedCount > 0 || depth.blockedCount > 0) {
    return {
      id: `${TRACE_ID}:approval-depth`,
      label: "Runner approval depth",
      kind: "approval-depth",
      status: "blocked",
      detail: `${approval.blockedCount + depth.blockedCount} approval or depth blocker${approval.blockedCount + depth.blockedCount === 1 ? "" : "s"} remain for the selected runner path.`,
      nextAction: publicText(approval.nextAction, "Resolve Phase 9 approval blockers.")
    };
  }

  if (approval.reviewCount > 0 || depth.reviewCount > 0) {
    return {
      id: `${TRACE_ID}:approval-depth`,
      label: "Runner approval depth",
      kind: "approval-depth",
      status: "review",
      detail: `${approval.reviewCount + depth.reviewCount} approval or depth row${approval.reviewCount + depth.reviewCount === 1 ? "" : "s"} need review before Phase 9 can advance.`,
      nextAction: publicText(approval.nextAction, "Review Phase 9 approval rows.")
    };
  }

  if (approval.waitingCount > 0 || depth.waitingCount > 0) {
    return {
      id: `${TRACE_ID}:approval-depth`,
      label: "Runner approval depth",
      kind: "approval-depth",
      status: "waiting",
      detail: `${approval.waitingCount + depth.waitingCount} approval or depth row${approval.waitingCount + depth.waitingCount === 1 ? "" : "s"} are waiting for owner-approved probe evidence.`,
      nextAction: publicText(approval.nextAction, "Complete Phase 9 approval evidence.")
    };
  }

  return {
    id: `${TRACE_ID}:approval-depth`,
    label: "Runner approval depth",
    kind: "approval-depth",
    status: "ready",
    detail: "Runner approval and depth records are ready for the fixed terminal-readonly-probe path.",
    nextAction: "Keep approval, preview, validation, audit, rollback, and desktop lock rows attached."
  };
}

function mutationLockItem(
  approval: Phase9RunnerApprovalSnapshot,
  depth: Phase9RunnerApprovalDepthSummary
): Phase9RunnerTraceabilityItem {
  const hasSelectedProbe = approval.selectedAction === "terminal-readonly-probe";
  const hasDepthLocks = depth.mutationLockCount >= 5;
  const canTrustLock = hasSelectedProbe && hasDepthLocks && !approval.canRequestDesktopProbe;

  if (!hasSelectedProbe || !hasDepthLocks) {
    return {
      id: `${TRACE_ID}:mutation-lock`,
      label: "Mutation lock",
      kind: "mutation-lock",
      status: "blocked",
      detail: `Selected probe check: ${hasSelectedProbe ? "ready" : "blocked"}; depth mutation locks: ${depth.mutationLockCount}.`,
      nextAction: "Restore the fixed read-only probe and all mutation-lock depth records before runner approval advances."
    };
  }

  return {
    id: `${TRACE_ID}:mutation-lock`,
    label: "Mutation lock",
    kind: "mutation-lock",
    status: "ready",
    detail: canTrustLock
      ? "The fixed read-only probe is selected, depth locks are visible, and the desktop request remains held."
      : "The fixed read-only probe is requestable after approval, and broader terminal, Git, MCP, plugin, automation, runtime, profile, and external-service mutation locks remain visible.",
    nextAction: canTrustLock
      ? "Keep terminal, Git, MCP, plugin, automation, runtime, profile, and external-service mutation paths locked."
      : "Review the requestable probe state and confirm only the fixed read-only request can run."
  };
}

function buildAriaLabel(summary: Omit<Phase9RunnerTraceabilitySummary, "ariaLabel">): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `${summary.readyCount} ready, ${summary.reviewCount} review, ` +
    `${summary.blockedCount} blocked, ${summary.waitingCount} waiting; ` +
    `${summary.linkedPmTaskCount} PM links, ${summary.phase8OpenExceptionCount} Phase 8 exceptions, ` +
    `${summary.mutationLockCount} mutation locks; next action: ${summary.nextAction}`
  );
}

export function buildPhase9RunnerTraceabilitySummary({
  approval,
  depth,
  phase8,
  goals = remainingGoalPlan
}: {
  approval: Phase9RunnerApprovalSnapshot;
  depth: Phase9RunnerApprovalDepthSummary;
  phase8: Phase8PermissionAuditDepthSnapshot;
  goals?: readonly RemainingGoalPlanItem[];
}): Phase9RunnerTraceabilitySummary {
  const goal = phase9Goal(goals);
  const knownRequiredPmTaskIds = REQUIRED_PM_TASK_IDS.filter((taskId) =>
    currentProjectManagementPhasePlanTaskIds.has(taskId)
  );
  const goalPmTaskIds = new Set(goal?.pmTaskIds ?? []);
  const missingPmTaskIds = knownRequiredPmTaskIds.filter((taskId) => !goalPmTaskIds.has(taskId));
  const items = [
    activeGoalItem(goal),
    pmCoverageItem(goal, missingPmTaskIds),
    phase8GateItem(phase8),
    approvalDepthItem(approval, depth),
    mutationLockItem(approval, depth)
  ];
  const state = resolveState(items);
  const readiness = scoreItems(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const waitingCount = items.filter((item) => item.status === "waiting").length;
  const draft = {
    id: TRACE_ID,
    label: TRACE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    canTrustRunnerApproval:
      state === "ready" &&
      missingPmTaskIds.length === 0 &&
      phase8.openExceptionCount === 0 &&
      phase8.blockedCount === 0,
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    missingPmTaskIds,
    linkedGoalId: goal?.id ?? PHASE9_GOAL_ID,
    linkedPmTaskCount: goal?.pmTaskIds.length ?? 0,
    phase8OpenExceptionCount: phase8.openExceptionCount,
    mutationLockCount: depth.mutationLockCount,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
