import { currentProjectManagementPhasePlanTaskIds } from "./projectManagementPhasePlan";
import type {
  MigrationHardeningReadiness,
  MigrationHardeningReadinessState,
  MigrationReviewDepthItem
} from "./migrationHardeningReadiness";
import {
  findCurrentActiveRemainingGoals,
  isCurrentActiveRemainingGoal,
  remainingGoalPlan,
  type RemainingGoalPlanItem
} from "./remainingGoalPlan";

export type MigrationTraceabilityState = MigrationHardeningReadinessState;

export type MigrationTraceabilityItemKind =
  | "active-goal"
  | "pm-coverage"
  | "review-depth"
  | "sensitive-boundary"
  | "profile-lock";

export interface MigrationTraceabilityItem {
  id: string;
  label: string;
  kind: MigrationTraceabilityItemKind;
  status: MigrationTraceabilityState;
  detail: string;
  nextAction: string;
}

export interface MigrationTraceabilitySummary {
  id: string;
  label: string;
  state: MigrationTraceabilityState;
  statusLabel: string;
  readiness: number;
  canTrustMigrationReview: boolean;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  waitingCount: number;
  missingPmTaskIds: string[];
  linkedGoalId: string;
  linkedPmTaskCount: number;
  reviewDepthCount: number;
  openReviewRecordCount: number;
  evidenceKeyCount: number;
  migrationTraceabilityProof: string;
  nextAction: string;
  safety: string;
  ariaLabel: string;
  items: MigrationTraceabilityItem[];
}

const TRACE_ID = "phase-05-migration-traceability";
const TRACE_LABEL = "Phase 5 migration traceability";
const PHASE5_GOAL_ID = "goal-phase-5-migration-hardening";
const PHASE5_PHASE_ID = "phase-05-migration-center";
const REQUIRED_PM_TASK_IDS = [
  "phase-05-migration-center",
  "phase-05-parent-draft-workflow",
  "phase-05-child-profile-drafts",
  "phase-05-child-preview-metadata",
  "phase-05-parent-rollback-audit",
  "phase-05-child-audit-summary",
  "phase-05-child-review-depth",
  "phase-05-child-traceability",
  "phase-05-child-blocker-priority",
  "phase-05-child-apply-decision-gate",
  "phase-05-child-owner-approval-handoff",
  "phase-05-child-apply-implementation-boundary",
  "phase-05-child-completion-gate"
];
const SAFETY =
  "Phase 5 migration traceability is evidence-only. It links the remaining goal, Project Management rows, migration review-depth evidence keys, sensitive exclusions, rollback/audit coverage, and profile activation lock without applying a migration, changing profiles, copying source data, running commands, or enabling provider execution.";

const STATUS_LABELS: Record<MigrationTraceabilityState, string> = {
  ready: "Ready",
  review: "Review required",
  waiting: "Waiting",
  blocked: "Blocked"
};

const STATUS_WEIGHTS: Record<MigrationTraceabilityState, number> = {
  ready: 100,
  review: 65,
  waiting: 35,
  blocked: 0
};

function scoreItems(items: readonly MigrationTraceabilityItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + STATUS_WEIGHTS[item.status], 0) / items.length
  );
}

function resolveState(items: readonly MigrationTraceabilityItem[]): MigrationTraceabilityState {
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "waiting")) {
    return "waiting";
  }
  if (items.some((item) => item.status === "review")) {
    return "review";
  }
  return "ready";
}

function firstNextAction(items: readonly MigrationTraceabilityItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    "Keep migration traceability attached while active profile changes and source mutations remain locked."
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

function migrationGoal(goals: readonly RemainingGoalPlanItem[]): RemainingGoalPlanItem | undefined {
  return goals.find((goal) => goal.id === PHASE5_GOAL_ID);
}

function activeGoalItem(
  goal: RemainingGoalPlanItem | undefined,
  currentActiveGoalIds: readonly string[]
): MigrationTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:active-goal`,
      label: "Remaining goal link",
      kind: "active-goal",
      status: "blocked",
      detail: "The Phase 5 remaining goal is missing.",
      nextAction: "Restore goal-phase-5-migration-hardening before migration review can be trusted."
    };
  }

  if (!goal.phaseIds.includes(PHASE5_PHASE_ID)) {
    return {
      id: `${TRACE_ID}:active-goal`,
      label: "Remaining goal link",
      kind: "active-goal",
      status: "blocked",
      detail: `${goal.id} does not link to ${PHASE5_PHASE_ID}.`,
      nextAction: "Restore the Phase 5 phase link on the migration hardening goal."
    };
  }

  const exactlyOneCurrentActiveGoal = currentActiveGoalIds.length === 1;
  const isTrustedPhase5Goal =
    isCurrentActiveRemainingGoal(goal) && exactlyOneCurrentActiveGoal;

  return {
    id: `${TRACE_ID}:active-goal`,
    label: "Remaining goal link",
    kind: "active-goal",
    status:
      goal.status === "blocked"
        ? "blocked"
        : isTrustedPhase5Goal
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
          "Make Phase 5 the current active goal before migration review can be trusted."
        )
      : `Keep exactly one current active remaining goal before Phase 5 migration review can be trusted: ${currentActiveGoalIds.join(", ") || "none"}.`
  };
}

function pmCoverageItem(
  goal: RemainingGoalPlanItem | undefined,
  missingPmTaskIds: readonly string[]
): MigrationTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: "PM coverage cannot be checked without the Phase 5 goal.",
      nextAction: "Restore the Phase 5 remaining goal and PM task links."
    };
  }

  if (missingPmTaskIds.length > 0) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: `${missingPmTaskIds.length} required Phase 5 PM task link${missingPmTaskIds.length === 1 ? "" : "s"} are missing: ${missingPmTaskIds.join(", ")}.`,
      nextAction: "Add the missing Phase 5 PM child links before migration review advances."
    };
  }

  return {
    id: `${TRACE_ID}:pm-coverage`,
    label: "PM row coverage",
    kind: "pm-coverage",
    status: "ready",
    detail: `${goal.pmTaskIds.length} Phase 5 PM task links cover draft workflow, preview metadata, rollback/audit review, review depth, traceability, blocker priority, apply decision, owner approval handoff, apply implementation boundary, and completion gate rows.`,
    nextAction: "Keep Phase 5 goal links aligned with the Project Management Epic, Parent, and Child rows."
  };
}

function depthStatus(readiness: MigrationHardeningReadiness): MigrationTraceabilityState {
  if (readiness.reviewDepthItems.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (readiness.reviewDepthItems.some((item) => item.status === "waiting")) {
    return "waiting";
  }
  if (readiness.reviewDepthItems.some((item) => item.status === "review")) {
    return "review";
  }
  return "ready";
}

function reviewDepthItem(readiness: MigrationHardeningReadiness): MigrationTraceabilityItem {
  const status = depthStatus(readiness);
  const evidenceKeys = new Set(readiness.reviewDepthItems.map((item) => item.evidenceKey));
  const hasUniqueEvidenceKeys = evidenceKeys.size === readiness.reviewDepthItems.length;

  if (!hasUniqueEvidenceKeys) {
    return {
      id: `${TRACE_ID}:review-depth`,
      label: "Review-depth evidence",
      kind: "review-depth",
      status: "blocked",
      detail: "Migration review-depth rows do not have unique evidence keys.",
      nextAction: "Restore unique evidence keys before migration review can be trusted."
    };
  }

  return {
    id: `${TRACE_ID}:review-depth`,
    label: "Review-depth evidence",
    kind: "review-depth",
    status,
    detail: `${readiness.reviewDepthItems.length} migration review-depth rows expose ${evidenceKeys.size} unique evidence keys; ${readiness.openReviewRecordCount} remain open.`,
    nextAction: publicText(readiness.nextAction, "Resolve migration review-depth rows before apply review.")
  };
}

function depthByKind(
  readiness: MigrationHardeningReadiness,
  kind: MigrationReviewDepthItem["kind"]
): MigrationReviewDepthItem | undefined {
  return readiness.reviewDepthItems.find((item) => item.kind === kind);
}

function sensitiveBoundaryItem(readiness: MigrationHardeningReadiness): MigrationTraceabilityItem {
  const sensitive = depthByKind(readiness, "exclusion");

  if (!sensitive) {
    return {
      id: `${TRACE_ID}:sensitive-boundary`,
      label: "Sensitive boundary",
      kind: "sensitive-boundary",
      status: "blocked",
      detail: "Sensitive exclusion review-depth evidence is missing.",
      nextAction: "Restore sensitive exclusion evidence before migration review advances."
    };
  }

  return {
    id: `${TRACE_ID}:sensitive-boundary`,
    label: "Sensitive boundary",
    kind: "sensitive-boundary",
    status: sensitive.status,
    detail: `${sensitive.label} is ${STATUS_LABELS[sensitive.status]} with evidence key ${sensitive.evidenceKey}.`,
    nextAction: publicText(sensitive.nextAction, "Confirm secrets, auth state, source mutation, and raw transcripts stay excluded.")
  };
}

function profileLockItem(readiness: MigrationHardeningReadiness): MigrationTraceabilityItem {
  const profileLock = depthByKind(readiness, "profile-lock");

  if (!profileLock) {
    return {
      id: `${TRACE_ID}:profile-lock`,
      label: "Profile activation lock",
      kind: "profile-lock",
      status: "blocked",
      detail: "Profile activation lock evidence is missing.",
      nextAction: "Restore profile activation lock evidence before migration review advances."
    };
  }

  if (readiness.canStageApplyIntent && profileLock.status !== "ready") {
    return {
      id: `${TRACE_ID}:profile-lock`,
      label: "Profile activation lock",
      kind: "profile-lock",
      status: "blocked",
      detail: "Apply review can be staged while profile activation lock evidence is not ready.",
      nextAction: "Restore the profile activation lock before staging apply review."
    };
  }

  return {
    id: `${TRACE_ID}:profile-lock`,
    label: "Profile activation lock",
    kind: "profile-lock",
    status: profileLock.status,
    detail: `${profileLock.label} is ${STATUS_LABELS[profileLock.status]}; apply review does not change the active profile or source data.`,
    nextAction: publicText(profileLock.nextAction, "Keep profile activation behind explicit owner approval.")
  };
}

function buildAriaLabel(summary: Omit<MigrationTraceabilitySummary, "ariaLabel">): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `${summary.readyCount} ready, ${summary.reviewCount} review, ` +
    `${summary.blockedCount} blocked, ${summary.waitingCount} waiting; ` +
    `${summary.linkedPmTaskCount} PM links, ${summary.reviewDepthCount} review-depth rows, ` +
    `${summary.openReviewRecordCount} open review records, ${summary.evidenceKeyCount} evidence keys; ` +
    `next action: ${summary.nextAction}`
  );
}

function buildMigrationTraceabilityProof(input: {
  readonly items: readonly MigrationTraceabilityItem[];
  readonly missingPmTaskIds: readonly string[];
  readonly linkedPmTaskCount: number;
  readonly reviewDepthCount: number;
  readonly openReviewRecordCount: number;
  readonly evidenceKeyCount: number;
  readonly canTrustMigrationReview: boolean;
}): string {
  const itemKinds = input.items.map((item) => item.kind).join("|");

  return (
    `items=${input.items.length}/5 ready=${input.items.filter((item) => item.status === "ready").length} ` +
    `review=${input.items.filter((item) => item.status === "review").length} ` +
    `blocked=${input.items.filter((item) => item.status === "blocked").length} ` +
    `waiting=${input.items.filter((item) => item.status === "waiting").length} ` +
    `itemKinds=${itemKinds} pmLinks=${input.linkedPmTaskCount}/13 missingPm=${input.missingPmTaskIds.length} ` +
    `reviewDepth=${input.reviewDepthCount}/6 openReview=${input.openReviewRecordCount} ` +
    `evidenceKeys=${input.evidenceKeyCount}/6 trust=${input.canTrustMigrationReview ? "ready" : "held"} ` +
    `sourceMutation=locked profileActivation=locked`
  );
}

export function buildMigrationTraceabilitySummary({
  readiness,
  goals = remainingGoalPlan
}: {
  readiness: MigrationHardeningReadiness;
  goals?: readonly RemainingGoalPlanItem[];
}): MigrationTraceabilitySummary {
  const goal = migrationGoal(goals);
  const goalPmTaskIds = new Set(goal?.pmTaskIds ?? []);
  const missingPlanPmTaskIds = REQUIRED_PM_TASK_IDS.filter(
    (taskId) => !currentProjectManagementPhasePlanTaskIds.has(taskId)
  );
  const missingGoalPmTaskIds = REQUIRED_PM_TASK_IDS.filter((taskId) => !goalPmTaskIds.has(taskId));
  const missingPmTaskIds = Array.from(
    new Set([...missingPlanPmTaskIds, ...missingGoalPmTaskIds])
  );
  const evidenceKeyCount = new Set(readiness.reviewDepthItems.map((item) => item.evidenceKey)).size;
  const currentActiveGoalIds = findCurrentActiveRemainingGoals(goals).map((item) => item.id);
  const items = [
    activeGoalItem(goal, currentActiveGoalIds),
    pmCoverageItem(goal, missingPmTaskIds),
    reviewDepthItem(readiness),
    sensitiveBoundaryItem(readiness),
    profileLockItem(readiness)
  ];
  const state = resolveState(items);
  const readinessScore = scoreItems(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const waitingCount = items.filter((item) => item.status === "waiting").length;
  const canTrustMigrationReview =
    state === "ready" &&
    isCurrentActiveRemainingGoal(goal) &&
    currentActiveGoalIds.length === 1 &&
    missingPmTaskIds.length === 0 &&
    readiness.openReviewRecordCount === 0 &&
    evidenceKeyCount === readiness.reviewDepthItems.length;
  const draft = {
    id: TRACE_ID,
    label: TRACE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessScore,
    canTrustMigrationReview,
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    missingPmTaskIds,
    linkedGoalId: goal?.id ?? PHASE5_GOAL_ID,
    linkedPmTaskCount: goal?.pmTaskIds.length ?? 0,
    reviewDepthCount: readiness.reviewDepthItems.length,
    openReviewRecordCount: readiness.openReviewRecordCount,
    evidenceKeyCount,
    migrationTraceabilityProof: buildMigrationTraceabilityProof({
      items,
      missingPmTaskIds,
      linkedPmTaskCount: goal?.pmTaskIds.length ?? 0,
      reviewDepthCount: readiness.reviewDepthItems.length,
      openReviewRecordCount: readiness.openReviewRecordCount,
      evidenceKeyCount,
      canTrustMigrationReview
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
