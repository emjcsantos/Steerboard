import { currentProjectManagementPhasePlanTaskIds } from "./projectManagementPhasePlan";
import { REQUIRED_PHASE3_CLEARANCE_CHILD_PM_TASK_IDS } from "./phase3ClearanceTraceability";
import type { Phase11EvidenceRecordsSnapshot } from "./phase11EvidenceRecords";
import type { Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import type { Phase11ProofFreshnessDepthSnapshot } from "./phase11ProofFreshnessDepth";
import type { Phase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";
import { remainingGoalPlan, type RemainingGoalPlanItem } from "./remainingGoalPlan";

export type Phase11OwnerReleaseTraceabilityState = "ready" | "review" | "blocked" | "waiting";

export type Phase11OwnerReleaseTraceabilityKind =
  | "owner-goal"
  | "release-goal"
  | "pm-coverage"
  | "owner-command"
  | "phase3-trace"
  | "proof-freshness"
  | "evidence-records"
  | "release-readiness"
  | "packaging-hold";

export interface Phase11OwnerReleaseTraceabilityItem {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase11OwnerReleaseTraceabilityKind;
  readonly status: Phase11OwnerReleaseTraceabilityState;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase11OwnerReleaseTraceabilitySummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase11OwnerReleaseTraceabilityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly canTrustOwnerReleaseGate: boolean;
  readonly readyCount: number;
  readonly reviewCount: number;
  readonly blockedCount: number;
  readonly waitingCount: number;
  readonly missingPmTaskIds: readonly string[];
  readonly linkedGoalIds: readonly string[];
  readonly linkedPmTaskCount: number;
  readonly releaseHoldStatus: Phase11OwnerReleaseTraceabilityState;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase11OwnerReleaseTraceabilityItem[];
}

export interface Phase11OwnerReleaseTraceabilityInput {
  readonly ownerCommandCenter: Phase11OwnerCommandCenterSnapshot;
  readonly proofFreshnessDepth: Phase11ProofFreshnessDepthSnapshot;
  readonly evidenceRecords: Phase11EvidenceRecordsSnapshot;
  readonly releaseReadiness: Phase11ReleaseReadinessSnapshot;
  readonly goals?: readonly RemainingGoalPlanItem[];
}

const TRACE_ID = "phase-11-owner-release-traceability";
const TRACE_LABEL = "Phase 11 owner release traceability";
const OWNER_GOAL_ID = "goal-phase-11-owner-command-center";
const RELEASE_GOAL_ID = "goal-phase-11-release-readiness";
const PHASE3_CLEARANCE_GOAL_ID = "goal-phase-3-proof-clearance";
const PHASE11_PHASE_ID = "phase-11-owner-packaging";
const REQUIRED_PHASE3_RELEASE_TRACE_PM_TASK_IDS = REQUIRED_PHASE3_CLEARANCE_CHILD_PM_TASK_IDS;
const REQUIRED_PM_TASK_IDS = [
  "phase-11-owner-packaging",
  "phase-11-parent-owner-testing",
  "phase-11-child-owner-checklist",
  "phase-11-child-proof-freshness-depth",
  "phase-11-child-evidence-records",
  "phase-11-child-fresh-checkout",
  "phase-11-parent-release-packaging",
  "phase-11-child-package-validation",
  "phase-11-child-traceability",
  "phase-11-child-blocker-priority"
];
const SAFETY =
  "Phase 11 owner release traceability is evidence-only. It links Owner Testing, proof freshness, evidence records, release readiness, Project Management rows, and packaging holds without installing dependencies, running tests, building packages, pushing branches, or resuming release actions.";

const STATUS_LABELS: Record<Phase11OwnerReleaseTraceabilityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase11OwnerReleaseTraceabilityState): number {
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

function scoreItems(items: readonly Phase11OwnerReleaseTraceabilityItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function resolveState(
  items: readonly Phase11OwnerReleaseTraceabilityItem[]
): Phase11OwnerReleaseTraceabilityState {
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

function firstNextAction(items: readonly Phase11OwnerReleaseTraceabilityItem[]): string {
  const prioritizedItem = (state: Phase11OwnerReleaseTraceabilityState) =>
    items.find((item) => item.kind === "packaging-hold" && item.status === state) ??
    items.find((item) => item.kind === "phase3-trace" && item.status === state) ??
    items.find((item) => item.status === state);

  return (
    prioritizedItem("blocked")?.nextAction ??
    prioritizedItem("review")?.nextAction ??
    prioritizedItem("waiting")?.nextAction ??
    "Keep Phase 11 owner release traceability attached until the owner explicitly resumes release actions."
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

function phase11Goal(
  goals: readonly RemainingGoalPlanItem[],
  id: string
): RemainingGoalPlanItem | undefined {
  return goals.find((goal) => goal.id === id);
}

function goalStatus(
  goal: RemainingGoalPlanItem | undefined
): Phase11OwnerReleaseTraceabilityItem["status"] {
  if (!goal) {
    return "blocked";
  }
  if (!goal.phaseIds.includes(PHASE11_PHASE_ID)) {
    return "blocked";
  }
  if (goal.status === "blocked") {
    return "blocked";
  }
  if (goal.status === "paused" || goal.status === "planned") {
    return "waiting";
  }
  if (goal.status === "active" || goal.status === "next") {
    return "review";
  }
  if (!goal.nextAction.trim()) {
    return "blocked";
  }
  return "ready";
}

function goalItem(
  goal: RemainingGoalPlanItem | undefined,
  id: typeof OWNER_GOAL_ID | typeof RELEASE_GOAL_ID,
  label: string,
  kind: "owner-goal" | "release-goal"
): Phase11OwnerReleaseTraceabilityItem {
  if (!goal) {
    return {
      id: `${TRACE_ID}:${kind}`,
      label,
      kind,
      status: "blocked",
      detail: `${id} is missing from the remaining-goal plan.`,
      nextAction: `Restore ${id} before Phase 11 release review can be trusted.`
    };
  }

  if (!goal.phaseIds.includes(PHASE11_PHASE_ID)) {
    return {
      id: `${TRACE_ID}:${kind}`,
      label,
      kind,
      status: "blocked",
      detail: `${goal.id} does not link to ${PHASE11_PHASE_ID}.`,
      nextAction: `Restore the Phase 11 phase link on ${goal.id}.`
    };
  }

  return {
    id: `${TRACE_ID}:${kind}`,
    label,
    kind,
    status: goalStatus(goal),
    detail: `${goal.id} is ${goal.status} at ${goal.completionPercent}% with ${goal.pmTaskIds.length} PM task links.`,
    nextAction: publicText(goal.nextAction, "Review the Phase 11 owner release goal.")
  };
}

function pmCoverageItem(
  ownerGoal: RemainingGoalPlanItem | undefined,
  releaseGoal: RemainingGoalPlanItem | undefined,
  missingPmTaskIds: readonly string[]
): Phase11OwnerReleaseTraceabilityItem {
  if (!ownerGoal || !releaseGoal) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: "PM coverage cannot be checked until both Phase 11 goals exist.",
      nextAction: "Restore the Owner Testing and release-readiness goals with PM child links."
    };
  }

  if (missingPmTaskIds.length > 0) {
    return {
      id: `${TRACE_ID}:pm-coverage`,
      label: "PM row coverage",
      kind: "pm-coverage",
      status: "blocked",
      detail: `${missingPmTaskIds.length} Phase 11 PM task link${missingPmTaskIds.length === 1 ? "" : "s"} are missing: ${missingPmTaskIds.join(", ")}.`,
      nextAction: "Add the missing Phase 11 PM child links before Owner Testing can close release review."
    };
  }

  return {
    id: `${TRACE_ID}:pm-coverage`,
    label: "PM row coverage",
    kind: "pm-coverage",
    status: "ready",
    detail: `${new Set([...ownerGoal.pmTaskIds, ...releaseGoal.pmTaskIds]).size} Phase 11 PM links cover Owner Testing, evidence records, fresh checkout, release packaging, traceability, and blocker priority rows.`,
    nextAction: "Keep Phase 11 goals aligned with the Project Management Epic, Parent, and Child rows."
  };
}

function ownerCommandItem(
  snapshot: Phase11OwnerCommandCenterSnapshot
): Phase11OwnerReleaseTraceabilityItem {
  const topOwnerCommandItem =
    snapshot.items.find((item) => item.status === "blocked") ??
    snapshot.items.find((item) => item.status === "review") ??
    snapshot.items.find((item) => item.status === "waiting");
  const topOwnerCommandDetail = topOwnerCommandItem
    ? ` Top owner row: ${publicText(topOwnerCommandItem.label, "Owner command row")} is ${topOwnerCommandItem.status}; ${publicText(topOwnerCommandItem.detail, topOwnerCommandItem.nextAction)}`
    : "";

  return {
    id: `${TRACE_ID}:owner-command`,
    label: "Owner command gate",
    kind: "owner-command",
    status: snapshot.state,
    detail: `${snapshot.readyCount} ready, ${snapshot.reviewCount} review, ${snapshot.blockedCount} blocked, and ${snapshot.waitingCount} waiting Owner Testing rows.${topOwnerCommandDetail}`,
    nextAction: publicText(snapshot.nextAction, "Resolve Owner Testing command-center blockers.")
  };
}

function phase3TraceItem(
  snapshot: Phase11OwnerCommandCenterSnapshot,
  proofFreshnessDepth: Phase11ProofFreshnessDepthSnapshot
): Phase11OwnerReleaseTraceabilityItem {
  const phase3Trace = snapshot.priorityGoalTraces.find(
    (trace) => trace.goalId === PHASE3_CLEARANCE_GOAL_ID
  );
  const missingPmTaskIds = REQUIRED_PHASE3_RELEASE_TRACE_PM_TASK_IDS.filter(
    (taskId) => !phase3Trace?.pmTaskIds.includes(taskId)
  );
  const handoffProofReady = proofFreshnessDepth.items.some(
    (item) => item.kind === "handoff-proof" && item.status === "ready"
  );
  const proofFreshnessTrusted = proofFreshnessDepth.canTrustOwnerProof;
  const traceIsCurrent = phase3Trace?.current === true;
  const traceIsActive = phase3Trace?.status === "active";
  const status: Phase11OwnerReleaseTraceabilityState =
    !phase3Trace ||
    !traceIsCurrent ||
    !traceIsActive ||
    !proofFreshnessTrusted ||
    !handoffProofReady ||
    missingPmTaskIds.length > 0
      ? "review"
      : "ready";

  return {
    id: `${TRACE_ID}:phase3-trace`,
    label: "Current Phase 3 trace",
    kind: "phase3-trace",
    status,
    detail: phase3Trace
      ? `${phase3Trace.goalId} is ${phase3Trace.status}, current ${phase3Trace.current ? "yes" : "no"}, with ${phase3Trace.pmTaskIds.length} PM task links; proof freshness ${proofFreshnessTrusted ? "trusted" : "not trusted"}; handoff proof ${handoffProofReady ? "ready" : "not ready"}.`
      : "Current Phase 3 goal/PM traceability is not visible in Owner Testing priority traces.",
    nextAction:
      status === "ready"
        ? "Keep current active Phase 3 clearance PM traceability and ready handoff proof visible before release readiness is trusted."
        : `Restore current active Phase 3 clearance PM traceability and trusted handoff proof before Phase 11 owner release review can be trusted: ${missingPmTaskIds.join(", ") || (!traceIsCurrent || !traceIsActive ? PHASE3_CLEARANCE_GOAL_ID : !proofFreshnessTrusted ? "phase-11-proof-freshness-depth" : "phase-11-proof-freshness-depth:handoff-proof")}.`
  };
}

function proofFreshnessItem(
  snapshot: Phase11ProofFreshnessDepthSnapshot
): Phase11OwnerReleaseTraceabilityItem {
  return {
    id: `${TRACE_ID}:proof-freshness`,
    label: "Proof freshness depth",
    kind: "proof-freshness",
    status: snapshot.state,
    detail: `${snapshot.readyCount} ready proof rows and ${snapshot.openProofCount} open proof rows are visible.`,
    nextAction: publicText(snapshot.nextAction, "Resolve Phase 11 proof freshness blockers.")
  };
}

function evidenceRecordsItem(
  snapshot: Phase11EvidenceRecordsSnapshot
): Phase11OwnerReleaseTraceabilityItem {
  const status =
    snapshot.blockedCount > 0
      ? "blocked"
      : snapshot.reviewCount > 0 || snapshot.staleCount > 0
        ? "review"
        : snapshot.waitingCount > 0 || snapshot.missingCount > 0
          ? "waiting"
          : "ready";

  return {
    id: `${TRACE_ID}:evidence-records`,
    label: "Evidence records",
    kind: "evidence-records",
    status,
    detail: `${snapshot.readyCount} ready, ${snapshot.reviewCount} review, ${snapshot.blockedCount} blocked, ${snapshot.waitingCount} waiting, ${snapshot.staleCount} stale, and ${snapshot.malformedCount} malformed evidence records.`,
    nextAction:
      status === "ready"
        ? "Keep structured Phase 11 evidence records attached to the release gate."
        : "Repair, refresh, or record Phase 11 evidence records before release readiness."
  };
}

function releaseReadinessItem(
  snapshot: Phase11ReleaseReadinessSnapshot
): Phase11OwnerReleaseTraceabilityItem {
  return {
    id: `${TRACE_ID}:release-readiness`,
    label: "Release readiness gate",
    kind: "release-readiness",
    status: snapshot.state,
    detail: `${snapshot.releaseHoldCount} release hold${snapshot.releaseHoldCount === 1 ? "" : "s"} remain; owner ${snapshot.ownerReadiness}%, security ${snapshot.securityReadiness}%, packaging ${snapshot.packagingReadiness}%.`,
    nextAction: publicText(snapshot.nextAction, "Resolve Phase 11 release-readiness blockers.")
  };
}

function packagingHoldItem(
  snapshot: Phase11ReleaseReadinessSnapshot
): Phase11OwnerReleaseTraceabilityItem {
  const packagingItem = snapshot.items.find((item) => item.kind === "packaging-lock");
  const decisionItem = snapshot.items.find((item) => item.kind === "release-decision");
  const status =
    packagingItem?.status === "blocked" || decisionItem?.status === "blocked"
      ? "blocked"
      : packagingItem?.status === "review" || decisionItem?.status === "review"
        ? "review"
        : packagingItem?.status === "waiting" || decisionItem?.status === "waiting"
          ? "waiting"
          : "ready";

  return {
    id: `${TRACE_ID}:packaging-hold`,
    label: "Packaging hold",
    kind: "packaging-hold",
    status,
    detail: packagingItem?.detail ?? "Packaging hold evidence is missing from release readiness.",
    nextAction: publicText(
      packagingItem?.nextAction ?? decisionItem?.nextAction,
      "Keep packaging locked until the owner explicitly resumes release actions."
    )
  };
}

function buildAriaLabel(
  summary: Omit<Phase11OwnerReleaseTraceabilitySummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.readiness}% ready; ` +
    `${summary.linkedGoalIds.length} goals; ${summary.linkedPmTaskCount} PM links; ` +
    `${summary.blockedCount} blocked; ${summary.waitingCount} waiting; ` +
    `release hold ${summary.releaseHoldStatus}; next action: ${summary.nextAction}`
  );
}

export function buildPhase11OwnerReleaseTraceability(
  input: Phase11OwnerReleaseTraceabilityInput
): Phase11OwnerReleaseTraceabilitySummary {
  const goals = input.goals ?? remainingGoalPlan;
  const ownerGoal = phase11Goal(goals, OWNER_GOAL_ID);
  const releaseGoal = phase11Goal(goals, RELEASE_GOAL_ID);
  const planTaskIds = new Set(currentProjectManagementPhasePlanTaskIds);
  const linkedPmTaskIds = new Set([
    ...(ownerGoal?.pmTaskIds ?? []),
    ...(releaseGoal?.pmTaskIds ?? [])
  ]);
  const missingPmTaskIds = REQUIRED_PM_TASK_IDS.filter(
    (taskId) => !linkedPmTaskIds.has(taskId) || !planTaskIds.has(taskId)
  );
  const items = [
    goalItem(ownerGoal, OWNER_GOAL_ID, "Owner command goal", "owner-goal"),
    goalItem(releaseGoal, RELEASE_GOAL_ID, "Release readiness goal", "release-goal"),
    pmCoverageItem(ownerGoal, releaseGoal, missingPmTaskIds),
    ownerCommandItem(input.ownerCommandCenter),
    phase3TraceItem(input.ownerCommandCenter, input.proofFreshnessDepth),
    proofFreshnessItem(input.proofFreshnessDepth),
    evidenceRecordsItem(input.evidenceRecords),
    releaseReadinessItem(input.releaseReadiness),
    packagingHoldItem(input.releaseReadiness)
  ];
  const state = resolveState(items);
  const releaseHoldStatus =
    items.find((item) => item.kind === "packaging-hold")?.status ?? "waiting";
  const linkedGoalIds = [ownerGoal?.id, releaseGoal?.id].filter(Boolean) as string[];
  const draft = {
    id: TRACE_ID,
    label: TRACE_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: scoreItems(items),
    canTrustOwnerReleaseGate:
      state === "ready" &&
      input.ownerCommandCenter.canRelease &&
      input.proofFreshnessDepth.canTrustOwnerProof &&
      input.releaseReadiness.canRecommendRelease &&
      missingPmTaskIds.length === 0,
    readyCount: items.filter((item) => item.status === "ready").length,
    reviewCount: items.filter((item) => item.status === "review").length,
    blockedCount: items.filter((item) => item.status === "blocked").length,
    waitingCount: items.filter((item) => item.status === "waiting").length,
    missingPmTaskIds,
    linkedGoalIds,
    linkedPmTaskCount: linkedPmTaskIds.size,
    releaseHoldStatus,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
