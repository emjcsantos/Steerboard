import type { Phase8PermissionAuditDepthSnapshot } from "./phase8PermissionAuditDepth";
import type {
  Phase9RunnerApprovalItem,
  Phase9RunnerApprovalSnapshot,
  Phase9RunnerApprovalState
} from "./phase9RunnerApproval";
import type {
  Phase9RunnerApprovalDepthRecord,
  Phase9RunnerApprovalDepthSummary
} from "./phase9RunnerApprovalDepth";
import type {
  Phase9RunnerTraceabilityItem,
  Phase9RunnerTraceabilitySummary
} from "./phase9RunnerTraceability";

export type Phase9RunnerBlockerPriorityState = Phase9RunnerApprovalState;

export type Phase9RunnerBlockerPriorityKind =
  | "phase8-gate"
  | "approval"
  | "approval-depth"
  | "traceability";

export type Phase9RunnerBlockerPrioritySeverity = "critical" | "high" | "medium";

export interface Phase9RunnerBlockerPriorityItem {
  readonly id: string;
  readonly sourceId: string;
  readonly label: string;
  readonly kind: Phase9RunnerBlockerPriorityKind;
  readonly status: Phase9RunnerBlockerPriorityState;
  readonly severity: Phase9RunnerBlockerPrioritySeverity;
  readonly priority: number;
  readonly canUseRunnerReview: boolean;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase9RunnerBlockerPrioritySummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase9RunnerBlockerPriorityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly openBlockerCount: number;
  readonly runnerReviewAddressableCount: number;
  readonly topPriorityLabel: string;
  readonly topPriorityAction: string;
  readonly topPrioritySourceId: string;
  readonly topPriorityKind: Phase9RunnerBlockerPriorityKind | "none";
  readonly topPriorityStatus: Phase9RunnerBlockerPriorityState | "ready";
  readonly runnerReviewCanAddressTopBlocker: boolean;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase9RunnerBlockerPriorityItem[];
}

export interface Phase9RunnerBlockerPriorityInput {
  readonly approval: Phase9RunnerApprovalSnapshot;
  readonly depth: Phase9RunnerApprovalDepthSummary;
  readonly phase8: Phase8PermissionAuditDepthSnapshot;
  readonly traceability: Phase9RunnerTraceabilitySummary;
}

const SNAPSHOT_ID = "phase-09-runner-blocker-priority";
const SNAPSHOT_LABEL = "Phase 9 runner blocker priority";
const RUNNER_REVIEW_ACTION = "Review Phase 9 runner evidence";
const SAFETY =
  "Phase 9 runner blocker priority is evidence-only. It ranks existing Phase 8 gate, runner approval, approval-depth, traceability, and mutation-lock blockers but does not request permission, run the desktop probe, mutate files, export audit records, or unlock broader desktop execution.";

const STATUS_LABELS: Record<Phase9RunnerBlockerPriorityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase9RunnerBlockerPriorityState): number {
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

function stateRank(state: Phase9RunnerBlockerPriorityState): number {
  switch (state) {
    case "blocked":
      return 0;
    case "review":
      return 1;
    case "waiting":
      return 2;
    case "ready":
    default:
      return 3;
  }
}

function kindRank(kind: Phase9RunnerBlockerPriorityKind): number {
  switch (kind) {
    case "phase8-gate":
      return 0;
    case "approval":
      return 1;
    case "approval-depth":
      return 2;
    case "traceability":
    default:
      return 3;
  }
}

function sourceRank(sourceId: string): number {
  const normalized = sourceId.toLowerCase();

  if (normalized.includes("phase8-gate")) {
    return 0;
  }
  if (normalized.includes("owner-review") || normalized.includes("runner-review")) {
    return 1;
  }
  if (normalized.includes("permission") || normalized.includes("owner-approval")) {
    return 2;
  }
  if (normalized.includes("approval")) {
    return 3;
  }
  if (normalized.includes("preview")) {
    return 4;
  }
  if (normalized.includes("validation")) {
    return 5;
  }
  if (normalized.includes("audit")) {
    return 6;
  }
  if (normalized.includes("rollback")) {
    return 7;
  }
  if (normalized.includes("lock") || normalized.includes("mutation")) {
    return 8;
  }
  if (normalized.includes("pm") || normalized.includes("traceability")) {
    return 9;
  }
  return 10;
}

function severityForState(state: Phase9RunnerBlockerPriorityState): Phase9RunnerBlockerPrioritySeverity {
  if (state === "blocked") {
    return "critical";
  }
  if (state === "review") {
    return "high";
  }
  return "medium";
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

function canUseRunnerReview(status: Phase9RunnerBlockerPriorityState): boolean {
  return status !== "ready";
}

function canUseRunnerReviewForTraceability(item: Phase9RunnerTraceabilityItem): boolean {
  return item.kind === "runner-review-record" && item.status !== "ready";
}

function phase8GateItems(
  phase8: Phase8PermissionAuditDepthSnapshot,
  traceability: Phase9RunnerTraceabilitySummary
): readonly Phase9RunnerBlockerPriorityItem[] {
  const phase8Trace = traceability.items.find((item) => item.kind === "phase8-gate");

  if (!phase8Trace || phase8Trace.status === "ready") {
    return [];
  }

  return [
    {
      id: `${SNAPSHOT_ID}:phase8-gate`,
      sourceId: phase8Trace.id,
      label: phase8Trace.label,
      kind: "phase8-gate",
      status: phase8Trace.status,
      severity: severityForState(phase8Trace.status),
      priority: 0,
      canUseRunnerReview: true,
      detail:
        `${phase8Trace.label} is ${STATUS_LABELS[phase8Trace.status]}; ` +
        `${phase8Trace.detail} Phase 8 open exceptions: ${phase8.openExceptionCount}.`,
      nextAction: publicText(
        phase8Trace.nextAction,
        "Resolve Phase 8 permission/audit blockers before Phase 9 runner approval advances."
      )
    }
  ];
}

function approvalItems(
  approval: Phase9RunnerApprovalSnapshot
): readonly Phase9RunnerBlockerPriorityItem[] {
  return approval.items
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromApproval(item));
}

function buildItemFromApproval(
  item: Phase9RunnerApprovalItem
): Phase9RunnerBlockerPriorityItem {
  return {
    id: `${SNAPSHOT_ID}:approval:${item.kind}`,
    sourceId: item.id,
    label: item.label,
    kind: "approval",
    status: item.status,
    severity: severityForState(item.status),
    priority: 0,
    canUseRunnerReview: canUseRunnerReview(item.status),
    detail: `${item.label} is ${STATUS_LABELS[item.status]}; ${item.detail}`,
    nextAction: `${RUNNER_REVIEW_ACTION}; ${publicText(item.nextAction, "resolve this Phase 9 approval blocker.")}`
  };
}

function depthItems(
  depth: Phase9RunnerApprovalDepthSummary
): readonly Phase9RunnerBlockerPriorityItem[] {
  return depth.records
    .filter((record) => record.status !== "ready")
    .map((record) => buildItemFromDepth(record));
}

function buildItemFromDepth(
  record: Phase9RunnerApprovalDepthRecord
): Phase9RunnerBlockerPriorityItem {
  return {
    id: `${SNAPSHOT_ID}:depth:${record.kind}`,
    sourceId: record.id,
    label: record.label,
    kind: "approval-depth",
    status: record.status,
    severity: severityForState(record.status),
    priority: 0,
    canUseRunnerReview: canUseRunnerReview(record.status),
    detail: `${record.label} is ${record.statusLabel}; ${record.evidence}`,
    nextAction: `${RUNNER_REVIEW_ACTION} for ${record.evidenceKey}; ${publicText(record.nextAction, "resolve this Phase 9 depth blocker.")}`
  };
}

function traceabilityItems(
  traceability: Phase9RunnerTraceabilitySummary
): readonly Phase9RunnerBlockerPriorityItem[] {
  return traceability.items
    .filter((item) => item.status !== "ready" && item.kind !== "phase8-gate")
    .map((item) => buildItemFromTraceability(item));
}

function buildItemFromTraceability(
  item: Phase9RunnerTraceabilityItem
): Phase9RunnerBlockerPriorityItem {
  const canUseReview = canUseRunnerReviewForTraceability(item);

  return {
    id: `${SNAPSHOT_ID}:traceability:${item.kind}`,
    sourceId: item.id,
    label: item.label,
    kind: "traceability",
    status: item.status,
    severity: severityForState(item.status),
    priority: 0,
    canUseRunnerReview: canUseReview,
    detail: `${item.label} trace is ${STATUS_LABELS[item.status]}; ${item.detail}`,
    nextAction: canUseReview
      ? `${RUNNER_REVIEW_ACTION}, then re-check Phase 9 runner traceability.`
      : item.nextAction
  };
}

function resolveState(
  items: readonly Phase9RunnerBlockerPriorityItem[],
  traceability: Phase9RunnerTraceabilitySummary
): Phase9RunnerBlockerPriorityState {
  if (items.length === 0 && traceability.canTrustRunnerApproval) {
    return "ready";
  }
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "review")) {
    return "review";
  }
  if (items.some((item) => item.status === "waiting")) {
    return "waiting";
  }
  return traceability.state;
}

function readinessForItems(
  items: readonly Phase9RunnerBlockerPriorityItem[],
  traceability: Phase9RunnerTraceabilitySummary
): number {
  if (items.length === 0) {
    return traceability.canTrustRunnerApproval ? 100 : traceability.readiness;
  }

  return Math.round(items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length);
}

function buildAriaLabel(
  summary: Omit<Phase9RunnerBlockerPrioritySummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.openBlockerCount} open blockers; ` +
    `${summary.runnerReviewAddressableCount} runner-review addressable; top priority ${summary.topPriorityLabel}; ` +
    `source ${summary.topPrioritySourceId}; kind ${summary.topPriorityKind}; status ${summary.topPriorityStatus}; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase9RunnerBlockerPriority(
  input: Phase9RunnerBlockerPriorityInput
): Phase9RunnerBlockerPrioritySummary {
  const items = [
    ...phase8GateItems(input.phase8, input.traceability),
    ...approvalItems(input.approval),
    ...depthItems(input.depth),
    ...traceabilityItems(input.traceability)
  ]
    .sort(
      (left, right) =>
        stateRank(left.status) - stateRank(right.status) ||
        kindRank(left.kind) - kindRank(right.kind) ||
        sourceRank(left.sourceId) - sourceRank(right.sourceId) ||
        left.label.localeCompare(right.label)
    )
    .map((item, index) => ({ ...item, priority: index + 1 }));
  const state = resolveState(items, input.traceability);
  const topItem = items[0];
  const runnerReviewAddressableCount = items.filter((item) => item.canUseRunnerReview).length;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForItems(items, input.traceability),
    openBlockerCount: items.length,
    runnerReviewAddressableCount,
    topPriorityLabel: topItem?.label ?? "No open Phase 9 runner blocker",
    topPriorityAction:
      topItem?.nextAction ??
      "Keep the fixed terminal-readonly-probe scoped, approved, audited, rollback-safe, and locked away from broad desktop execution.",
    topPrioritySourceId: topItem?.sourceId ?? "phase9.runner-blocker.none",
    topPriorityKind: topItem?.kind ?? "none",
    topPriorityStatus: topItem?.status ?? "ready",
    runnerReviewCanAddressTopBlocker: topItem?.canUseRunnerReview === true,
    nextAction:
      topItem?.nextAction ??
      "No Phase 9 runner blockers remain; keep mutation locks attached before expanding desktop runner actions.",
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
