import { currentProjectManagementPhasePlanTaskIds } from "./projectManagementPhasePlan";
import type {
  Phase8PermissionAuditDepthSnapshot,
  Phase8PermissionAuditDepthState
} from "./phase8PermissionAuditDepth";
import {
  findCurrentActiveRemainingGoals,
  isCurrentActiveRemainingGoal,
  remainingGoalPlan,
  type RemainingGoalPlanItem
} from "./remainingGoalPlan";

export type Phase8RiskTraceabilityState = Phase8PermissionAuditDepthState;

export type Phase8RiskTraceabilityItemKind =
  | "active-goal"
  | "pm-coverage"
  | "audit-depth"
  | "exception-register"
  | "disabled-path-lock";

export interface Phase8RiskTraceabilityItem {
  id: string;
  label: string;
  kind: Phase8RiskTraceabilityItemKind;
  status: Phase8RiskTraceabilityState;
  detail: string;
  nextAction: string;
}

export interface Phase8RiskTraceabilitySummary {
  id: string;
  label: string;
  state: Phase8RiskTraceabilityState;
  statusLabel: string;
  readiness: number;
  canTrustPermissionAudit: boolean;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  waitingCount: number;
  missingPmTaskIds: string[];
  linkedGoalId: string;
  linkedPmTaskCount: number;
  auditDepthItemCount: number;
  exceptionCount: number;
  openExceptionCount: number;
  evidenceKeyCount: number;
  disabledPathCount: number;
  traceabilityProof: string;
  traceabilityRowStateProof: string;
  nextAction: string;
  safety: string;
  ariaLabel: string;
  items: Phase8RiskTraceabilityItem[];
}

const TRACE_ID = "phase-08-risk-traceability";
const TRACE_LABEL = "Phase 8 risk traceability";
const PHASE8_GOAL_ID = "goal-phase-8-permission-audit";
const PHASE8_PHASE_ID = "phase-08-permissions-audit";
const REQUIRED_PM_TASK_IDS = [
  "phase-08-permissions-audit",
  "phase-08-parent-risk-gates",
  "phase-08-child-permission-labels",
  "phase-08-child-risk-blockers",
  "phase-08-child-risk-exceptions",
  "phase-08-child-traceability",
  "phase-08-child-blocker-priority",
  "phase-08-child-risk-closure",
  "phase-08-parent-audit-log",
  "phase-08-child-audit-persistence",
  "phase-08-child-owner-review-handoff",
  "phase-08-child-completion-gate",
  "phase-08-child-closure-audit-status",
  "phase-08-child-owner-action-handoff",
  "phase-08-child-audit-review-blocker-handoff"
];
const SAFETY =
  "Phase 8 risk traceability is evidence-only. It links the remaining goal, Project Management rows, permission/audit depth records, risk exceptions, disabled paths, evidence keys, and rollback expectations without requesting approval, granting access, running commands, mutating files, or unlocking provider execution.";

const STATUS_LABELS: Record<Phase8RiskTraceabilityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase8RiskTraceabilityState): number {
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

function scoreItems(items: readonly Phase8RiskTraceabilityItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function resolveState(items: readonly Phase8RiskTraceabilityItem[]): Phase8RiskTraceabilityState {
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

function firstNextAction(items: readonly Phase8RiskTraceabilityItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Keep Phase 8 risk traceability attached while mutation-capable paths remain locked."
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

function phase8Goal(goals: readonly RemainingGoalPlanItem[]): RemainingGoalPlanItem | undefined {
  return goals.find((goal) => goal.id === PHASE8_GOAL_ID);
}

function activeGoalItem(
  goal: RemainingGoalPlanItem | undefined,
  currentActiveGoalIds: readonly string[]
): Phase8RiskTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:active-goal`,
      label: "Remaining goal link",
      kind: "active-goal",
      status: "blocked",
      detail: "The Phase 8 remaining goal is missing.",
      nextAction: "Restore goal-phase-8-permission-audit before permission audit can be trusted."
    };
  }

  if (!goal.phaseIds.includes(PHASE8_PHASE_ID)) {
    return {
      id: `${TRACE_ID}:active-goal`,
      label: "Remaining goal link",
      kind: "active-goal",
      status: "blocked",
      detail: `${goal.id} does not link to ${PHASE8_PHASE_ID}.`,
      nextAction: "Restore the Phase 8 phase link on the permission and audit goal."
    };
  }

  const exactlyOneCurrentActiveGoal = currentActiveGoalIds.length === 1;
  const isTrustedPhase8Goal =
    isCurrentActiveRemainingGoal(goal) && exactlyOneCurrentActiveGoal;

  return {
    id: `${TRACE_ID}:active-goal`,
    label: "Remaining goal link",
    kind: "active-goal",
    status:
      goal.status === "blocked"
        ? "blocked"
        : isTrustedPhase8Goal
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
          "Make Phase 8 the current active goal before permission audit can be trusted."
        )
      : `Keep exactly one current active remaining goal before Phase 8 permission audit can be trusted: ${currentActiveGoalIds.join(", ") || "none"}.`
  };
}

function pmCoverageItem(
  goal: RemainingGoalPlanItem | undefined,
  missingPmTaskIds: readonly string[]
): Phase8RiskTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: "PM coverage cannot be checked without the Phase 8 goal.",
      nextAction: "Restore the Phase 8 remaining goal and PM task links."
    };
  }

  if (missingPmTaskIds.length > 0) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: `${missingPmTaskIds.length} required Phase 8 PM task link${missingPmTaskIds.length === 1 ? "" : "s"} are missing: ${missingPmTaskIds.join(", ")}.`,
      nextAction: "Add the missing Phase 8 PM child links before permission audit advances."
    };
  }

  return {
    id: `${TRACE_ID}:pm-coverage`,
    label: "PM row coverage",
    kind: "pm-coverage",
    status: "ready",
    detail: `${goal.pmTaskIds.length} Phase 8 PM task links cover risk gates, exception rows, blocker closure, audit persistence, owner review handoff, traceability, blocker priority, and completion gate.`,
    nextAction: "Keep Phase 8 goal links aligned with the Project Management Epic, Parent, and Child rows."
  };
}

function auditDepthItem(snapshot: Phase8PermissionAuditDepthSnapshot): Phase8RiskTraceabilityItem {
  const itemKeys = new Set(snapshot.items.map((item) => item.evidenceKey));
  const exceptionKeys = new Set(snapshot.exceptions.map((exception) => exception.evidenceKey));
  const hasUniqueItemKeys = itemKeys.size === snapshot.items.length;
  const hasExceptionTrace = snapshot.exceptions.every((exception) =>
    Boolean(exception.pmTaskId && exception.evidenceKey)
  );

  if (!hasUniqueItemKeys || !hasExceptionTrace) {
    return {
      id: `${TRACE_ID}:audit-depth`,
      label: "Audit-depth evidence",
      kind: "audit-depth",
      status: "blocked",
      detail: "Phase 8 audit-depth records do not have complete PM links and unique evidence keys.",
      nextAction: "Restore PM task IDs and unique evidence keys on every Phase 8 depth and exception row."
    };
  }

  return {
    id: `${TRACE_ID}:audit-depth`,
    label: "Audit-depth evidence",
    kind: "audit-depth",
    status: snapshot.state,
    detail: `${snapshot.items.length} audit-depth rows expose ${itemKeys.size} item keys and ${exceptionKeys.size} exception keys.`,
    nextAction: publicText(snapshot.nextAction, "Resolve Phase 8 audit-depth rows before mutation paths grow.")
  };
}

function exceptionRegisterItem(snapshot: Phase8PermissionAuditDepthSnapshot): Phase8RiskTraceabilityItem {
  if (snapshot.openExceptionCount > 0) {
    return {
      id: `${TRACE_ID}:exception-register`,
      label: "Risk exception register",
      kind: "exception-register",
      status: snapshot.blockedCount > 0 ? "blocked" : snapshot.reviewCount > 0 ? "review" : "waiting",
      detail: `${snapshot.openExceptionCount} open exception${snapshot.openExceptionCount === 1 ? "" : "s"} remain across ${snapshot.disabledPathCount} disabled paths.`,
      nextAction: publicText(snapshot.nextAction, "Resolve open risk exceptions before permission audit can be trusted.")
    };
  }

  return {
    id: `${TRACE_ID}:exception-register`,
    label: "Risk exception register",
    kind: "exception-register",
    status: "ready",
    detail: `${snapshot.exceptions.length} risk exceptions have disabled-path, evidence, rollback, audit, PM, and evidence-key records.`,
    nextAction: "Keep risk exceptions attached even when all rows are ready."
  };
}

function disabledPathLockItem(snapshot: Phase8PermissionAuditDepthSnapshot): Phase8RiskTraceabilityItem {
  const hasDisabledPaths = snapshot.exceptions.length > 0 && snapshot.disabledPathCount === snapshot.exceptions.length;
  const hasLockCopy = snapshot.exceptions.every((exception) =>
    exception.disabledPath.toLowerCase().includes("disabled") ||
    exception.disabledPath.toLowerCase().includes("locked")
  );

  if (!hasDisabledPaths || !hasLockCopy) {
    return {
      id: `${TRACE_ID}:disabled-path-lock`,
      label: "Disabled-path lock",
      kind: "disabled-path-lock",
      status: "blocked",
      detail: "One or more Phase 8 exception rows is missing explicit disabled or locked path language.",
      nextAction: "Restore disabled-path lock copy before mutation-capable work can advance."
    };
  }

  return {
    id: `${TRACE_ID}:disabled-path-lock`,
    label: "Disabled-path lock",
    kind: "disabled-path-lock",
    status: snapshot.blockedCount > 0 ? "blocked" : snapshot.reviewCount > 0 ? "review" : snapshot.waitingCount > 0 ? "waiting" : "ready",
    detail: `${snapshot.disabledPathCount} disabled paths keep permission, approval, evidence, and rollback gates from unlocking mutation-capable work.`,
    nextAction: "Keep desktop, terminal, Git, MCP, plugin, automation, runtime, profile, and external-service mutation paths locked."
  };
}

function buildAriaLabel(summary: Omit<Phase8RiskTraceabilitySummary, "ariaLabel">): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `${summary.readyCount} ready, ${summary.reviewCount} review, ` +
    `${summary.blockedCount} blocked, ${summary.waitingCount} waiting; ` +
    `${summary.linkedPmTaskCount} PM links, ${summary.auditDepthItemCount} audit-depth rows, ` +
    `${summary.exceptionCount} exceptions, ${summary.openExceptionCount} open exceptions, ` +
    `${summary.evidenceKeyCount} evidence keys, ${summary.disabledPathCount} disabled paths; ` +
    `${summary.traceabilityProof}; ${summary.traceabilityRowStateProof}; ` +
    `next action: ${summary.nextAction}`
  );
}

function buildTraceabilityProof(input: {
  state: Phase8RiskTraceabilityState;
  linkedGoalId: string;
  linkedPmTaskCount: number;
  missingPmTaskIds: readonly string[];
  auditDepthItemCount: number;
  exceptionCount: number;
  openExceptionCount: number;
  evidenceKeyCount: number;
  disabledPathCount: number;
  canTrustPermissionAudit: boolean;
}): string {
  return (
    `traceabilityProof=goal=${input.linkedGoalId} state=${input.state} ` +
    `pmLinks=${input.linkedPmTaskCount} missingPm=${input.missingPmTaskIds.length} ` +
    `auditDepth=${input.auditDepthItemCount} exceptions=${input.exceptionCount} ` +
    `openExceptions=${input.openExceptionCount} evidenceKeys=${input.evidenceKeyCount} ` +
    `disabledPaths=${input.disabledPathCount} trust=${input.canTrustPermissionAudit ? "ready" : "review"}`
  );
}

function buildTraceabilityRowStateProof(input: {
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  waitingCount: number;
  itemCount: number;
}): string {
  return (
    `traceabilityRowStateProof=rows=${input.itemCount} ready=${input.readyCount} ` +
    `review=${input.reviewCount} blocked=${input.blockedCount} waiting=${input.waitingCount}`
  );
}

export function buildPhase8RiskTraceabilitySummary({
  snapshot,
  goals = remainingGoalPlan
}: {
  snapshot: Phase8PermissionAuditDepthSnapshot;
  goals?: readonly RemainingGoalPlanItem[];
}): Phase8RiskTraceabilitySummary {
  const goal = phase8Goal(goals);
  const goalPmTaskIds = new Set(goal?.pmTaskIds ?? []);
  const missingPlanPmTaskIds = REQUIRED_PM_TASK_IDS.filter(
    (taskId) => !currentProjectManagementPhasePlanTaskIds.has(taskId)
  );
  const missingGoalPmTaskIds = REQUIRED_PM_TASK_IDS.filter((taskId) => !goalPmTaskIds.has(taskId));
  const missingPmTaskIds = Array.from(
    new Set([...missingPlanPmTaskIds, ...missingGoalPmTaskIds])
  );
  const evidenceKeyCount = new Set([
    ...snapshot.items.map((item) => item.evidenceKey),
    ...snapshot.exceptions.map((exception) => exception.evidenceKey)
  ]).size;
  const currentActiveGoalIds = findCurrentActiveRemainingGoals(goals).map((item) => item.id);
  const items = [
    activeGoalItem(goal, currentActiveGoalIds),
    pmCoverageItem(goal, missingPmTaskIds),
    auditDepthItem(snapshot),
    exceptionRegisterItem(snapshot),
    disabledPathLockItem(snapshot)
  ];
  const state = resolveState(items);
  const readiness = scoreItems(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const waitingCount = items.filter((item) => item.status === "waiting").length;
  const canTrustPermissionAudit =
    state === "ready" &&
    isCurrentActiveRemainingGoal(goal) &&
    currentActiveGoalIds.length === 1 &&
    missingPmTaskIds.length === 0 &&
    snapshot.openExceptionCount === 0 &&
    evidenceKeyCount === snapshot.items.length + snapshot.exceptions.length;
  const traceabilityProof = buildTraceabilityProof({
    state,
    linkedGoalId: goal?.id ?? PHASE8_GOAL_ID,
    linkedPmTaskCount: goal?.pmTaskIds.length ?? 0,
    missingPmTaskIds,
    auditDepthItemCount: snapshot.items.length,
    exceptionCount: snapshot.exceptions.length,
    openExceptionCount: snapshot.openExceptionCount,
    evidenceKeyCount,
    disabledPathCount: snapshot.disabledPathCount,
    canTrustPermissionAudit
  });
  const traceabilityRowStateProof = buildTraceabilityRowStateProof({
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    itemCount: items.length
  });
  const proofedItems = items.map((item) => ({
    ...item,
    detail: `${item.detail} ${traceabilityProof} ${traceabilityRowStateProof}`
  }));
  const draft = {
    id: TRACE_ID,
    label: TRACE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    canTrustPermissionAudit,
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    missingPmTaskIds,
    linkedGoalId: goal?.id ?? PHASE8_GOAL_ID,
    linkedPmTaskCount: goal?.pmTaskIds.length ?? 0,
    auditDepthItemCount: snapshot.items.length,
    exceptionCount: snapshot.exceptions.length,
    openExceptionCount: snapshot.openExceptionCount,
    evidenceKeyCount,
    disabledPathCount: snapshot.disabledPathCount,
    traceabilityProof,
    traceabilityRowStateProof,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items: proofedItems
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
