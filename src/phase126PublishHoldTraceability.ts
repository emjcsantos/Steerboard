import { currentProjectManagementPhasePlanTaskIds } from "./projectManagementPhasePlan";
import type {
  PhasePriorityEvidenceItem,
  PhasePriorityEvidenceResult,
  PhasePriorityEvidenceState
} from "./phasePriorityEvidence";
import { remainingGoalPlan, type RemainingGoalPlanItem } from "./remainingGoalPlan";

export type Phase126PublishHoldTraceabilityState = PhasePriorityEvidenceState;

export type Phase126PublishHoldTraceabilityKind =
  | "publish-goal"
  | "pm-coverage"
  | "phase-1-proof"
  | "phase-2-proof"
  | "phase-6-board"
  | "publish-hold";

export interface Phase126PublishHoldTraceabilityItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase126PublishHoldTraceabilityKind;
  readonly status: Phase126PublishHoldTraceabilityState;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase126PublishHoldTraceabilitySummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase126PublishHoldTraceabilityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canTrustLocalHold: boolean;
  readonly readyCount: number;
  readonly reviewCount: number;
  readonly blockedCount: number;
  readonly waitingCount: number;
  readonly missingPmTaskIds: readonly string[];
  readonly linkedGoalId: string;
  readonly linkedPhaseCount: number;
  readonly linkedPmTaskCount: number;
  readonly requiredPmTaskCount: number;
  readonly linkedRequiredPmTaskCount: number;
  readonly linkedRequiredPmTaskKindCounts: {
    readonly epic: number;
    readonly parent: number;
    readonly child: number;
  };
  readonly requiredPriorityEvidenceCount: number;
  readonly readyPriorityEvidenceCount: number;
  readonly publishHoldStatus: Phase126PublishHoldTraceabilityState;
  readonly localHoldEvidenceKey: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase126PublishHoldTraceabilityItem[];
}

export interface Phase126PublishHoldTraceabilityInput {
  readonly phasePriorityEvidence: PhasePriorityEvidenceResult;
  readonly goals?: readonly RemainingGoalPlanItem[];
}

const TRACE_ID = "phase-1-2-6-publish-hold-traceability";
const TRACE_LABEL = "Phase 1/2/6 publish hold traceability";
const PUBLISH_GOAL_ID = "goal-phase-1-2-6-publish";
const REQUIRED_PHASE_IDS = [
  "phase-01-live-chat",
  "phase-02-multi-panel",
  "phase-06-planning-lane"
];
const REQUIRED_PRIORITY_EVIDENCE_IDS = [
  "phase-1-live-panel",
  "phase-2-panel-isolation",
  "phase-6-pm-board"
] as const;
const REQUIRED_PM_TASK_IDS = [
  "phase-01-live-chat",
  "phase-01-parent-single-panel",
  "phase-01-child-live-start",
  "phase-01-child-stream-evidence",
  "phase-01-parent-owner-check",
  "phase-01-child-reload-proof",
  "phase-02-multi-panel",
  "phase-02-parent-panel-identity",
  "phase-02-child-two-panel-smoke",
  "phase-02-child-no-cross-talk",
  "phase-02-parent-session-persistence",
  "phase-02-child-restore-panels",
  "phase-06-planning-lane",
  "phase-06-parent-phase-board",
  "phase-06-child-current-phase-map",
  "phase-06-child-saved-state-upgrade",
  "phase-06-parent-arena-staging",
  "phase-06-child-run-context",
  "phase-06-child-publish-hold-traceability",
  "phase-06-child-publish-hold-blocker-priority"
];
const SAFETY =
  "Phase 1/2/6 publish hold traceability is evidence-only. It links local proof, Project Management rows, the remaining publish-hold goal, and the owner/remote push blocker without running live prompts, mutating files, changing saved sessions, pushing branches, or publishing release artifacts.";

const STATUS_LABELS: Record<Phase126PublishHoldTraceabilityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase126PublishHoldTraceabilityState): number {
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

function scoreItems(items: readonly Phase126PublishHoldTraceabilityItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function resolveState(
  items: readonly Phase126PublishHoldTraceabilityItem[]
): Phase126PublishHoldTraceabilityState {
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

function firstNextAction(items: readonly Phase126PublishHoldTraceabilityItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Keep Phase 1/2/6 proof attached locally until the owner explicitly approves publishing."
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

function publishGoal(goals: readonly RemainingGoalPlanItem[]): RemainingGoalPlanItem | undefined {
  return goals.find((goal) => goal.id === PUBLISH_GOAL_ID);
}

function goalItem(goal: RemainingGoalPlanItem | undefined): Phase126PublishHoldTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:publish-goal`,
      label: "Publish hold goal",
      kind: "publish-goal",
      status: "blocked",
      detail: `${PUBLISH_GOAL_ID} is missing from the remaining-goal plan.`,
      nextAction: "Restore the Phase 1/2/6 publish-hold goal before owner publishing can be reviewed."
    };
  }

  const missingPhaseIds = REQUIRED_PHASE_IDS.filter((phaseId) => !goal.phaseIds.includes(phaseId));
  if (missingPhaseIds.length > 0) {
    return {
      id: `${TRACE_ID}:publish-goal`,
      label: "Publish hold goal",
      kind: "publish-goal",
      status: "blocked",
      detail: `${goal.id} is missing phase links: ${missingPhaseIds.join(", ")}.`,
      nextAction: "Restore the Phase 1, Phase 2, and Phase 6 links on the publish-hold goal."
    };
  }

  return {
    id: `${TRACE_ID}:publish-goal`,
    label: "Publish hold goal",
    kind: "publish-goal",
    status: goal.status === "blocked" ? "blocked" : goal.status === "active" ? "review" : "ready",
    detail: `${goal.id} is ${goal.status} at ${goal.completionPercent}% with ${goal.pmTaskIds.length} PM task links.`,
    nextAction: publicText(goal.nextAction, "Review the Phase 1/2/6 publish-hold goal.")
  };
}

function pmCoverageItem(
  goal: RemainingGoalPlanItem | undefined,
  missingPmTaskIds: readonly string[]
): Phase126PublishHoldTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: "PM coverage cannot be checked without the publish-hold goal.",
      nextAction: "Restore the publish-hold goal and required PM task links."
    };
  }

  if (missingPmTaskIds.length > 0) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: `${missingPmTaskIds.length} required Phase 1/2/6 PM task link${missingPmTaskIds.length === 1 ? "" : "s"} are missing: ${missingPmTaskIds.join(", ")}.`,
      nextAction: "Add the missing Phase 1/2/6 PM child links before publishing can be reviewed."
    };
  }

  return {
    id: `${TRACE_ID}:pm-coverage`,
    label: "PM row coverage",
    kind: "pm-coverage",
    status: "ready",
    detail: `${goal.pmTaskIds.length} PM links cover one-panel proof, stream evidence, two-panel isolation, PM board staging, publish-hold traceability, and blocker priority.`,
    nextAction: "Keep the Phase 1/2/6 goal aligned with the Project Management Epic, Parent, and Child rows."
  };
}

function priorityItem(
  kind: "phase-1-proof" | "phase-2-proof" | "phase-6-board",
  evidenceItem: PhasePriorityEvidenceItem | undefined
): Phase126PublishHoldTraceabilityItem {
  if (!evidenceItem) {
    return {
      id: `${TRACE_ID}:${kind}`,
      label: kind === "phase-1-proof" ? "Phase 1 live proof" : kind === "phase-2-proof" ? "Phase 2 isolation proof" : "Phase 6 PM board",
      kind,
      status: "blocked",
      detail: "Priority evidence row is missing.",
      nextAction: "Restore the Phase 1/2/6 priority evidence row."
    };
  }

  return {
    id: `${TRACE_ID}:${kind}`,
    label: evidenceItem.label,
    kind,
    status: evidenceItem.state,
    detail: evidenceItem.detail,
    nextAction: evidenceItem.nextAction
  };
}

function publishHoldItem(goal: RemainingGoalPlanItem | undefined): Phase126PublishHoldTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:publish-hold`,
      label: "Publish hold",
      kind: "publish-hold",
      status: "blocked",
      detail: "The owner/remote publish hold cannot be evaluated without the publish goal.",
      nextAction: "Restore the publish-hold goal before publishing can be reviewed."
    };
  }

  return {
    id: `${TRACE_ID}:publish-hold`,
    label: "Publish hold",
    kind: "publish-hold",
    status: goal.status === "blocked" ? "blocked" : "ready",
    detail:
      goal.status === "blocked"
        ? "Publishing remains intentionally blocked by remote restoration and explicit owner push approval."
        : "Publishing hold is clear in the remaining-goal plan.",
    nextAction: publicText(goal.nextAction, "Keep publishing held until explicit owner approval.")
  };
}

function hasReadyPriorityEvidence(items: readonly PhasePriorityEvidenceItem[]): boolean {
  return REQUIRED_PRIORITY_EVIDENCE_IDS.every((id) =>
    items.some((item) => item.id === id && item.state === "ready")
  );
}

function countReadyPriorityEvidence(items: readonly PhasePriorityEvidenceItem[]): number {
  return REQUIRED_PRIORITY_EVIDENCE_IDS.filter((id) =>
    items.some((item) => item.id === id && item.state === "ready")
  ).length;
}

function pmTaskKind(taskId: string): "epic" | "parent" | "child" {
  if (taskId.includes("-parent-")) {
    return "parent";
  }

  if (taskId.includes("-child-")) {
    return "child";
  }

  return "epic";
}

function countLinkedRequiredPmKinds(
  linkedRequiredPmTaskIds: readonly string[]
): Phase126PublishHoldTraceabilitySummary["linkedRequiredPmTaskKindCounts"] {
  return linkedRequiredPmTaskIds.reduce(
    (counts, taskId) => ({
      ...counts,
      [pmTaskKind(taskId)]: counts[pmTaskKind(taskId)] + 1
    }),
    { epic: 0, parent: 0, child: 0 }
  );
}

function buildLocalHoldEvidenceKey(
  goal: RemainingGoalPlanItem | undefined,
  linkedPhaseCount: number,
  linkedPmTaskCount: number,
  linkedRequiredPmTaskCount: number,
  linkedRequiredPmTaskKindCounts: Phase126PublishHoldTraceabilitySummary["linkedRequiredPmTaskKindCounts"],
  readyPriorityEvidenceCount: number,
  publishHoldStatus: Phase126PublishHoldTraceabilityState
): string {
  const goalId = goal?.id ?? "missing-goal";
  return (
    `goal=${goalId} phases=${linkedPhaseCount}/${REQUIRED_PHASE_IDS.length} ` +
    `pm=${linkedPmTaskCount}/${REQUIRED_PM_TASK_IDS.length} ` +
    `trustedPm=${linkedRequiredPmTaskCount}/${REQUIRED_PM_TASK_IDS.length} ` +
    `epics=${linkedRequiredPmTaskKindCounts.epic} parents=${linkedRequiredPmTaskKindCounts.parent} ` +
    `children=${linkedRequiredPmTaskKindCounts.child} ` +
    `priority=${readyPriorityEvidenceCount}/${REQUIRED_PRIORITY_EVIDENCE_IDS.length} ` +
    `hold=${publishHoldStatus}`
  );
}

function buildAriaLabel(
  summary: Omit<Phase126PublishHoldTraceabilitySummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `${summary.linkedPhaseCount} phases; ${summary.linkedPmTaskCount} PM links; ` +
    `${summary.linkedRequiredPmTaskCount}/${summary.requiredPmTaskCount} trusted PM links; ` +
    `${summary.linkedRequiredPmTaskKindCounts.epic} Epics, ${summary.linkedRequiredPmTaskKindCounts.parent} Parents, ${summary.linkedRequiredPmTaskKindCounts.child} Children; ` +
    `${summary.readyPriorityEvidenceCount}/${summary.requiredPriorityEvidenceCount} priority proofs; ` +
    `${summary.blockedCount} blocked; ${summary.waitingCount} waiting; ` +
    `publish hold ${summary.publishHoldStatus}; local hold evidence ${summary.localHoldEvidenceKey}; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase126PublishHoldTraceability(
  input: Phase126PublishHoldTraceabilityInput
): Phase126PublishHoldTraceabilitySummary {
  const goals = input.goals ?? remainingGoalPlan;
  const goal = publishGoal(goals);
  const planTaskIds = new Set(currentProjectManagementPhasePlanTaskIds);
  const missingPmTaskIds = REQUIRED_PM_TASK_IDS.filter(
    (taskId) => !goal?.pmTaskIds.includes(taskId) || !planTaskIds.has(taskId)
  );
  const linkedRequiredPmTaskIds = REQUIRED_PM_TASK_IDS.filter(
    (taskId) => Boolean(goal?.pmTaskIds.includes(taskId)) && planTaskIds.has(taskId)
  );
  const phase1 = input.phasePriorityEvidence.items.find((item) => item.id === "phase-1-live-panel");
  const phase2 = input.phasePriorityEvidence.items.find((item) => item.id === "phase-2-panel-isolation");
  const phase6 = input.phasePriorityEvidence.items.find((item) => item.id === "phase-6-pm-board");
  const items = [
    goalItem(goal),
    pmCoverageItem(goal, missingPmTaskIds),
    priorityItem("phase-1-proof", phase1),
    priorityItem("phase-2-proof", phase2),
    priorityItem("phase-6-board", phase6),
    publishHoldItem(goal)
  ];
  const state = resolveState(items);
  const publishHoldStatus = items.find((item) => item.kind === "publish-hold")?.status ?? "blocked";
  const readyPriorityEvidenceCount = countReadyPriorityEvidence(input.phasePriorityEvidence.items);
  const linkedPhaseCount = goal?.phaseIds.length ?? 0;
  const linkedPmTaskCount = goal?.pmTaskIds.length ?? 0;
  const linkedRequiredPmTaskKindCounts = countLinkedRequiredPmKinds(linkedRequiredPmTaskIds);
  const draft = {
    id: TRACE_ID,
    label: TRACE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: scoreItems(items),
    canTrustLocalHold:
      Boolean(goal) &&
      missingPmTaskIds.length === 0 &&
      hasReadyPriorityEvidence(input.phasePriorityEvidence.items) &&
      publishHoldStatus === "blocked",
    readyCount: items.filter((item) => item.status === "ready").length,
    reviewCount: items.filter((item) => item.status === "review").length,
    blockedCount: items.filter((item) => item.status === "blocked").length,
    waitingCount: items.filter((item) => item.status === "waiting").length,
    missingPmTaskIds,
    linkedGoalId: goal?.id ?? "",
    linkedPhaseCount,
    linkedPmTaskCount,
    requiredPmTaskCount: REQUIRED_PM_TASK_IDS.length,
    linkedRequiredPmTaskCount: linkedRequiredPmTaskIds.length,
    linkedRequiredPmTaskKindCounts,
    requiredPriorityEvidenceCount: REQUIRED_PRIORITY_EVIDENCE_IDS.length,
    readyPriorityEvidenceCount,
    publishHoldStatus,
    localHoldEvidenceKey: buildLocalHoldEvidenceKey(
      goal,
      linkedPhaseCount,
      linkedPmTaskCount,
      linkedRequiredPmTaskIds.length,
      linkedRequiredPmTaskKindCounts,
      readyPriorityEvidenceCount,
      publishHoldStatus
    ),
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
