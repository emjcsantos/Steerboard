import type { FailureStateFixtureSummary } from "./failureStateFixtures";
import type { OwnerTestingChecklist, OwnerTestingReadinessState } from "./ownerTestingChecklist";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import type { Phase3SmokeProofReadinessResult } from "./phase3SmokeProofReadiness";
import type { Phase11EvidenceRecordSnapshot } from "./phase11EvidenceRecords";
import type { PhasePriorityEvidenceResult } from "./phasePriorityEvidence";
import type {
  RemainingGoalPlanSummary,
  RemainingGoalPlanTrace
} from "./remainingGoalPlan";

export type Phase11OwnerCommandCenterState = "ready" | "review" | "blocked" | "waiting";

export type Phase11OwnerCommandCenterItemKind =
  | "checklist"
  | "proof-freshness"
  | "blockers"
  | "phase-readiness"
  | "next-action"
  | "fresh-checkout";

export interface Phase11OwnerCommandCenterItem {
  id: string;
  label: string;
  kind: Phase11OwnerCommandCenterItemKind;
  status: Phase11OwnerCommandCenterState;
  detail: string;
  nextAction: string;
}

export interface Phase11OwnerCommandCenterGoalTrace {
  goalId: string;
  target: string;
  status: RemainingGoalPlanTrace["status"];
  priority: RemainingGoalPlanTrace["priority"];
  completionPercent: number;
  phaseIds: string[];
  pmTaskIds: string[];
  nextAction: string;
  current: boolean;
}

export interface Phase11OwnerCommandCenterSnapshot {
  id: string;
  label: string;
  state: Phase11OwnerCommandCenterState;
  statusLabel: string;
  readiness: number;
  canRelease: boolean;
  checklistReadiness: number;
  phaseReadiness: number;
  blockerCount: number;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  waitingCount: number;
  nextAction: string;
  safety: string;
  ariaLabel: string;
  items: Phase11OwnerCommandCenterItem[];
  priorityGoalTraceCount: number;
  priorityGoalTraces: Phase11OwnerCommandCenterGoalTrace[];
}

export interface Phase11OwnerCommandCenterInput {
  checklist: OwnerTestingChecklist;
  phasePriorityEvidence: PhasePriorityEvidenceResult;
  phase3ClearancePackage: Phase3ClearancePackage;
  phase3SmokeProofReadiness: Phase3SmokeProofReadinessResult;
  failureSummary: FailureStateFixtureSummary;
  remainingGoalSummary: RemainingGoalPlanSummary;
  freshCheckoutEvidence?: Phase11EvidenceRecordSnapshot;
  freshCheckoutState?: Phase11OwnerCommandCenterState;
}

const SNAPSHOT_ID = "phase-11-owner-command-center";
const SNAPSHOT_LABEL = "Phase 11 Owner Testing command center";
const SAFETY =
  "Phase 11 command center is evidence-only. It does not install dependencies, build packages, run desktop smoke, mutate files, push branches, call networks, or resume release actions.";

const STATUS_LABELS: Record<Phase11OwnerCommandCenterState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase11OwnerCommandCenterState): number {
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

function mapOwnerTestingState(state: OwnerTestingReadinessState): Phase11OwnerCommandCenterState {
  return state;
}

function scoreItems(items: readonly Phase11OwnerCommandCenterItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length
  );
}

function resolveState(items: readonly Phase11OwnerCommandCenterItem[]): Phase11OwnerCommandCenterState {
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

function firstNextAction(items: readonly Phase11OwnerCommandCenterItem[]): string {
  return (
    items.find((item) => item.status === "blocked")?.nextAction ??
    items.find((item) => item.status === "review")?.nextAction ??
    items.find((item) => item.status === "waiting")?.nextAction ??
    "Keep Owner Testing as the single pass/fail gate until release readiness is explicitly resumed."
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

function publicIdList(values: readonly string[]): string[] {
  return values.map((value) => publicText(value, "unknown-id"));
}

function publicGoalTrace(trace: RemainingGoalPlanTrace): Phase11OwnerCommandCenterGoalTrace {
  return {
    goalId: publicText(trace.goalId, "unknown-goal"),
    target: publicText(trace.target, "Untitled goal"),
    status: trace.status,
    priority: trace.priority,
    completionPercent: trace.completionPercent,
    phaseIds: publicIdList(trace.phaseIds),
    pmTaskIds: publicIdList(trace.pmTaskIds),
    nextAction: publicText(trace.nextAction, "No next action recorded."),
    current: trace.current
  };
}

function goalTraceDetail(summary: RemainingGoalPlanSummary): string {
  const topTrace = summary.priorityGoalTraces[0];

  if (!topTrace) {
    return "No prioritized remaining-goal trace is attached.";
  }

  return (
    `Top priority: ${publicText(topTrace.target, "Untitled goal")} ` +
    `(${publicText(topTrace.goalId, "unknown-goal")}); ` +
    `${topTrace.phaseIds.length} phase link${topTrace.phaseIds.length === 1 ? "" : "s"}, ` +
    `${topTrace.pmTaskIds.length} PM task link${topTrace.pmTaskIds.length === 1 ? "" : "s"}.`
  );
}

function checklistItem(checklist: OwnerTestingChecklist): Phase11OwnerCommandCenterItem {
  const status = mapOwnerTestingState(checklist.summary.state);

  return {
    id: `${SNAPSHOT_ID}:checklist`,
    label: "Owner checklist",
    kind: "checklist",
    status,
    detail: `${checklist.summary.ready}/${checklist.summary.total} owner checklist items are ready.`,
    nextAction:
      status === "ready"
        ? "Keep the full owner checklist green across reload and desktop proof runs."
        : "Resolve waiting, review, or blocked owner checklist rows before release readiness."
  };
}

function proofFreshnessItem(input: Phase11OwnerCommandCenterInput): Phase11OwnerCommandCenterItem {
  const blocked =
    input.phasePriorityEvidence.counts.blocked +
    input.phase3ClearancePackage.blockerCount +
    input.phase3SmokeProofReadiness.counts.blocked;
  const waiting =
    input.phasePriorityEvidence.counts.waiting +
    input.phase3ClearancePackage.waitingCount +
    input.phase3SmokeProofReadiness.counts.waiting;
  const review =
    input.phasePriorityEvidence.counts.review +
    input.phase3ClearancePackage.reviewCount +
    input.phase3SmokeProofReadiness.counts.review;

  if (blocked > 0) {
    return {
      id: `${SNAPSHOT_ID}:proof-freshness`,
      label: "Proof freshness",
      kind: "proof-freshness",
      status: "blocked",
      detail: `${blocked} proof row${blocked === 1 ? "" : "s"} are blocked.`,
      nextAction: "Clear blocked Phase 1/2/6 or Phase 3 proof rows before Owner Testing can pass."
    };
  }

  if (waiting > 0) {
    return {
      id: `${SNAPSHOT_ID}:proof-freshness`,
      label: "Proof freshness",
      kind: "proof-freshness",
      status: "waiting",
      detail: `${waiting} proof row${waiting === 1 ? "" : "s"} are waiting for desktop evidence.`,
      nextAction: "Run the explicit owner smoke actions and reload checks before release readiness."
    };
  }

  if (review > 0) {
    return {
      id: `${SNAPSHOT_ID}:proof-freshness`,
      label: "Proof freshness",
      kind: "proof-freshness",
      status: "review",
      detail: `${review} proof row${review === 1 ? "" : "s"} need owner review.`,
      nextAction: "Review incomplete proof rows and rerun desktop smoke only after choosing the action."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:proof-freshness`,
    label: "Proof freshness",
    kind: "proof-freshness",
    status: "ready",
    detail: "Phase 1/2/6 priority proof and Phase 3 proof rows are current.",
    nextAction: "Keep proof rows fresh across reload and while the app remains open before packaging resumes."
  };
}

function blockersItem(input: Phase11OwnerCommandCenterInput): Phase11OwnerCommandCenterItem {
  const blockerCount =
    input.remainingGoalSummary.blocked +
    input.checklist.summary.blocked +
    input.failureSummary.blocked;

  if (blockerCount > 0) {
    return {
      id: `${SNAPSHOT_ID}:blockers`,
      label: "Blocker triage",
      kind: "blockers",
      status: "blocked",
      detail: `${blockerCount} owner-visible blocker${blockerCount === 1 ? "" : "s"} remain across goals, checklist, and failure fixtures.`,
      nextAction: publicText(
        input.remainingGoalSummary.ownerHoldNextAction,
        "Resolve the top owner-visible blocker before treating Owner Testing as pass/fail ready."
      )
    };
  }

  if (input.failureSummary.review > 0 || input.checklist.summary.review > 0) {
    return {
      id: `${SNAPSHOT_ID}:blockers`,
      label: "Blocker triage",
      kind: "blockers",
      status: "review",
      detail: "No blockers remain, but review items still need owner attention.",
      nextAction: publicText(
        input.failureSummary.nextAction.label,
        "Review owner-testing failure fixtures before release readiness."
      )
    };
  }

  return {
    id: `${SNAPSHOT_ID}:blockers`,
    label: "Blocker triage",
    kind: "blockers",
    status: "ready",
    detail: "Goal, checklist, and failure-fixture blockers are clear.",
    nextAction: "Keep blockers at zero before promoting release readiness."
  };
}

function phaseReadinessItem(summary: RemainingGoalPlanSummary): Phase11OwnerCommandCenterItem {
  if (summary.blocked > 0) {
    return {
      id: `${SNAPSHOT_ID}:phase-readiness`,
      label: "Phase readiness",
      kind: "phase-readiness",
      status: "blocked",
      detail: `${summary.blocked} remaining goal${summary.blocked === 1 ? "" : "s"} are blocked; owner hold: ${publicText(summary.ownerHoldTarget, "No owner hold")}; average completion is ${summary.averageCompletionPercent}%. ${goalTraceDetail(summary)}`,
      nextAction: publicText(
        summary.ownerHoldNextAction,
        "Clear blocked remaining goals before release readiness."
      )
    };
  }

  if (summary.planned > 0 || summary.paused > 0) {
    return {
      id: `${SNAPSHOT_ID}:phase-readiness`,
      label: "Phase readiness",
      kind: "phase-readiness",
      status: "review",
      detail: `${summary.planned} planned and ${summary.paused} paused goal${summary.planned + summary.paused === 1 ? "" : "s"} remain; average completion is ${summary.averageCompletionPercent}%. ${goalTraceDetail(summary)}`,
      nextAction: "Review remaining planned and paused goals before using Owner Testing as the release gate."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:phase-readiness`,
    label: "Phase readiness",
    kind: "phase-readiness",
    status: "ready",
    detail: `All ${summary.coveredPhaseCount} covered phases have an active or completed path. ${goalTraceDetail(summary)}`,
    nextAction: "Keep phase readiness current as goals close."
  };
}

function nextActionItem(summary: RemainingGoalPlanSummary): Phase11OwnerCommandCenterItem {
  const nextAction = publicText(
    summary.currentNextAction,
    "No current owner action is available."
  );

  if (nextAction === "No current owner action is available.") {
    return {
      id: `${SNAPSHOT_ID}:next-action`,
      label: "Next action",
      kind: "next-action",
      status: "blocked",
      detail: "The command center cannot identify the next owner action.",
      nextAction: "Restore remaining-goal next action metadata."
    };
  }

  return {
    id: `${SNAPSHOT_ID}:next-action`,
    label: "Next action",
    kind: "next-action",
    status: "ready",
    detail: `Current owner target: ${publicText(summary.currentTarget, "Current owner target")}.`,
    nextAction
  };
}

function freshCheckoutItem(
  evidence: Phase11EvidenceRecordSnapshot | undefined,
  state: Phase11OwnerCommandCenterState | undefined
): Phase11OwnerCommandCenterItem {
  const status = evidence?.state ?? state ?? "waiting";

  return {
    id: `${SNAPSHOT_ID}:fresh-checkout`,
    label: "Fresh checkout",
    kind: "fresh-checkout",
    status,
    detail: evidence
      ? `${evidence.detail} Source: ${evidence.source}; recorded: ${evidence.recordedAt}; freshness: ${evidence.freshness}.`
      : status === "ready"
        ? "Fresh checkout install, test, build, desktop run, and proof panel checks are recorded."
        : "Fresh checkout install, test, build, desktop run, and proof panel checks still need owner evidence.",
    nextAction: evidence?.nextAction ?? (
      status === "ready"
        ? "Keep fresh-checkout evidence attached to the release gate."
        : "Run the fresh-checkout checklist once live workflow blockers are cleared."
    )
  };
}

function buildAriaLabel(snapshot: Omit<Phase11OwnerCommandCenterSnapshot, "ariaLabel">): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.readiness}% ready; ` +
    `${snapshot.readyCount} ready, ${snapshot.reviewCount} review, ` +
    `${snapshot.blockedCount} blocked, ${snapshot.waitingCount} waiting; ` +
    `${snapshot.blockerCount} blockers; ${snapshot.priorityGoalTraceCount} priority goal traces; ` +
    `next action: ${snapshot.nextAction}`
  );
}

export function buildPhase11OwnerCommandCenterSnapshot(
  input: Phase11OwnerCommandCenterInput
): Phase11OwnerCommandCenterSnapshot {
  const items = [
    checklistItem(input.checklist),
    proofFreshnessItem(input),
    blockersItem(input),
    phaseReadinessItem(input.remainingGoalSummary),
    nextActionItem(input.remainingGoalSummary),
    freshCheckoutItem(input.freshCheckoutEvidence, input.freshCheckoutState)
  ];
  const state = resolveState(items);
  const readiness = scoreItems(items);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const waitingCount = items.filter((item) => item.status === "waiting").length;
  const blockerCount =
    input.remainingGoalSummary.blocked +
    input.checklist.summary.blocked +
    input.failureSummary.blocked;
  const priorityGoalTraces =
    input.remainingGoalSummary.priorityGoalTraces.map(publicGoalTrace);
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness,
    canRelease: state === "ready" && blockerCount === 0,
    checklistReadiness: input.checklist.summary.readiness,
    phaseReadiness: input.remainingGoalSummary.averageCompletionPercent,
    blockerCount,
    readyCount,
    reviewCount,
    blockedCount,
    waitingCount,
    nextAction: firstNextAction(items),
    safety: SAFETY,
    items,
    priorityGoalTraceCount: priorityGoalTraces.length,
    priorityGoalTraces
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
