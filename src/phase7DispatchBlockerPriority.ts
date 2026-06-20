import type {
  Phase7DispatchReviewDepthItem,
  Phase7DispatchReviewDepthSnapshot,
  Phase7DispatchReviewDepthState
} from "./phase7DispatchReviewDepth";
import type {
  Phase7DispatchTraceabilityItem,
  Phase7DispatchTraceabilitySummary
} from "./phase7DispatchTraceability";
import type {
  Phase7IntegrationOwnershipDepthItem,
  Phase7IntegrationOwnershipDepthSnapshot
} from "./phase7IntegrationOwnershipDepth";

export type Phase7DispatchBlockerPriorityState = Phase7DispatchReviewDepthState;

export type Phase7DispatchBlockerPriorityKind =
  | "review-depth"
  | "integration-ownership"
  | "traceability";

export type Phase7DispatchBlockerPrioritySeverity = "critical" | "high" | "medium";

export interface Phase7DispatchBlockerPriorityItem {
  readonly id: string;
  readonly sourceId: string;
  readonly label: string;
  readonly kind: Phase7DispatchBlockerPriorityKind;
  readonly status: Phase7DispatchBlockerPriorityState;
  readonly severity: Phase7DispatchBlockerPrioritySeverity;
  readonly priority: number;
  readonly canUseDispatchReview: boolean;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase7DispatchBlockerPrioritySummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase7DispatchBlockerPriorityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly openBlockerCount: number;
  readonly dispatchReviewAddressableCount: number;
  readonly topPriorityLabel: string;
  readonly topPriorityAction: string;
  readonly dispatchReviewCanAddressTopBlocker: boolean;
  readonly dispatchBlockerPriorityProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase7DispatchBlockerPriorityItem[];
}

export interface Phase7DispatchBlockerPriorityInput {
  readonly depth: Phase7DispatchReviewDepthSnapshot;
  readonly ownership: Phase7IntegrationOwnershipDepthSnapshot;
  readonly traceability: Phase7DispatchTraceabilitySummary;
}

const SNAPSHOT_ID = "phase-07-dispatch-blocker-priority";
const SNAPSHOT_LABEL = "Phase 7 dispatch blocker priority";
const DISPATCH_REVIEW_ACTION = "Review Phase 7 dispatch evidence";
const SAFETY =
  "Phase 7 dispatch blocker priority is evidence-only. It ranks existing dispatch review depth, integration ownership, traceability, and live-worker lock blockers but does not spawn workers, launch runtime sessions, run tools, mutate files, or push branches.";

const STATUS_LABELS: Record<Phase7DispatchBlockerPriorityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function statusWeight(status: Phase7DispatchBlockerPriorityState): number {
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

function statusRank(status: Phase7DispatchBlockerPriorityState): number {
  switch (status) {
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

function kindRank(kind: Phase7DispatchBlockerPriorityKind): number {
  switch (kind) {
    case "review-depth":
      return 0;
    case "integration-ownership":
      return 1;
    case "traceability":
    default:
      return 2;
  }
}

function sourceRank(sourceId: string): number {
  const normalized = sourceId.toLowerCase();

  if (normalized.includes("role-coverage")) {
    return 0;
  }
  if (normalized.includes("attempt-limit")) {
    return 1;
  }
  if (normalized.includes("handoff-task")) {
    return 2;
  }
  if (normalized.includes("handoff-packet")) {
    return 3;
  }
  if (normalized.includes("validation-gate")) {
    return 4;
  }
  if (normalized.includes("evidence-freshness")) {
    return 5;
  }
  if (normalized.includes("execution-lock") || normalized.includes("live-worker-lock")) {
    return 6;
  }
  if (normalized.includes("integration-owner")) {
    return 7;
  }
  if (normalized.includes("final-validation")) {
    return 8;
  }
  if (normalized.includes("commit-push-reporting")) {
    return 9;
  }
  if (normalized.includes("traceability") || normalized.includes("pm-coverage")) {
    return 10;
  }
  if (normalized.includes("closure-boundary")) {
    return 11;
  }
  return 10;
}

function severityForStatus(
  status: Phase7DispatchBlockerPriorityState
): Phase7DispatchBlockerPrioritySeverity {
  if (status === "blocked") {
    return "critical";
  }
  if (status === "review") {
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

function canUseDispatchReview(status: Phase7DispatchBlockerPriorityState): boolean {
  return status !== "ready";
}

function canUseDispatchReviewForTraceability(item: Phase7DispatchTraceabilityItem): boolean {
  if (item.status === "ready") {
    return false;
  }

  return (
    item.kind === "review-depth" ||
    item.kind === "integration-ownership" ||
    item.kind === "live-worker-lock"
  );
}

function depthItems(
  depth: Phase7DispatchReviewDepthSnapshot
): readonly Phase7DispatchBlockerPriorityItem[] {
  return depth.items
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromDepth(item));
}

function buildItemFromDepth(
  item: Phase7DispatchReviewDepthItem
): Phase7DispatchBlockerPriorityItem {
  return {
    id: `${SNAPSHOT_ID}:depth:${item.kind}`,
    sourceId: item.id,
    label: item.label,
    kind: "review-depth",
    status: item.status,
    severity: severityForStatus(item.status),
    priority: 0,
    canUseDispatchReview: canUseDispatchReview(item.status),
    detail: `${item.label} is ${STATUS_LABELS[item.status]}; ${publicText(item.detail, "Phase 7 dispatch review evidence is incomplete.")}`,
    nextAction: `${DISPATCH_REVIEW_ACTION}; ${publicText(item.nextAction, "resolve this dispatch review blocker.")}`
  };
}

function ownershipItems(
  ownership: Phase7IntegrationOwnershipDepthSnapshot
): readonly Phase7DispatchBlockerPriorityItem[] {
  return ownership.items
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromOwnership(item));
}

function buildItemFromOwnership(
  item: Phase7IntegrationOwnershipDepthItem
): Phase7DispatchBlockerPriorityItem {
  return {
    id: `${SNAPSHOT_ID}:ownership:${item.kind}`,
    sourceId: item.id,
    label: item.label,
    kind: "integration-ownership",
    status: item.status,
    severity: severityForStatus(item.status),
    priority: 0,
    canUseDispatchReview: canUseDispatchReview(item.status),
    detail: `${item.label} is ${item.statusLabel}; ${publicText(item.detail, "Phase 7 integration ownership evidence is incomplete.")}`,
    nextAction: `${DISPATCH_REVIEW_ACTION}; ${publicText(item.nextAction, "resolve this integration ownership blocker.")}`
  };
}

function traceabilityItems(
  traceability: Phase7DispatchTraceabilitySummary
): readonly Phase7DispatchBlockerPriorityItem[] {
  return traceability.items
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromTraceability(item));
}

function buildItemFromTraceability(
  item: Phase7DispatchTraceabilityItem
): Phase7DispatchBlockerPriorityItem {
  return {
    id: `${SNAPSHOT_ID}:traceability:${item.kind}`,
    sourceId: item.id,
    label: item.label,
    kind: "traceability",
    status: item.status,
    severity: severityForStatus(item.status),
    priority: 0,
    canUseDispatchReview: canUseDispatchReviewForTraceability(item),
    detail: `${item.label} trace is ${STATUS_LABELS[item.status]}; ${publicText(item.detail, "Phase 7 traceability evidence is incomplete.")}`,
    nextAction: `${DISPATCH_REVIEW_ACTION}, then re-check Phase 7 dispatch traceability.`
  };
}

function resolveState(
  items: readonly Phase7DispatchBlockerPriorityItem[],
  traceability: Phase7DispatchTraceabilitySummary
): Phase7DispatchBlockerPriorityState {
  if (items.length === 0 && traceability.canTrustDispatchReview) {
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
  items: readonly Phase7DispatchBlockerPriorityItem[],
  traceability: Phase7DispatchTraceabilitySummary
): number {
  if (items.length === 0) {
    return traceability.canTrustDispatchReview ? 100 : traceability.readiness;
  }

  return Math.round(items.reduce((sum, item) => sum + statusWeight(item.status), 0) / items.length);
}

function buildAriaLabel(
  summary: Omit<Phase7DispatchBlockerPrioritySummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.openBlockerCount} open blockers; ` +
    `${summary.dispatchReviewAddressableCount} dispatch-review addressable; top priority ${summary.topPriorityLabel}; ` +
    `next action: ${summary.nextAction}`
  );
}

function buildDispatchBlockerPriorityProof(
  summary: Omit<Phase7DispatchBlockerPrioritySummary, "ariaLabel" | "dispatchBlockerPriorityProof">,
  traceability: Phase7DispatchTraceabilitySummary
): string {
  return (
    `open=${summary.openBlockerCount} dispatchReviewAddressable=${summary.dispatchReviewAddressableCount} ` +
    `top=${summary.topPriorityLabel} topActionable=${summary.dispatchReviewCanAddressTopBlocker ? "yes" : "no"} ` +
    `traceability=${traceability.canTrustDispatchReview ? "ready" : traceability.state} ` +
    `pmLinks=${traceability.linkedPmTaskCount}/16 liveWorkerLocks=${traceability.liveWorkerLockCount}/2 execution=locked`
  );
}

export function buildPhase7DispatchBlockerPriority(
  input: Phase7DispatchBlockerPriorityInput
): Phase7DispatchBlockerPrioritySummary {
  const items = [
    ...depthItems(input.depth),
    ...ownershipItems(input.ownership),
    ...traceabilityItems(input.traceability)
  ]
    .sort(
      (left, right) =>
        statusRank(left.status) - statusRank(right.status) ||
        kindRank(left.kind) - kindRank(right.kind) ||
        sourceRank(left.sourceId) - sourceRank(right.sourceId) ||
        left.label.localeCompare(right.label)
    )
    .map((item, index) => ({ ...item, priority: index + 1 }));
  const state = resolveState(items, input.traceability);
  const topItem = items[0];
  const dispatchReviewAddressableCount = items.filter((item) => item.canUseDispatchReview).length;
  const draftWithoutProof = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForItems(items, input.traceability),
    openBlockerCount: items.length,
    dispatchReviewAddressableCount,
    topPriorityLabel: topItem?.label ?? "No open Phase 7 dispatch blocker",
    topPriorityAction:
      topItem?.nextAction ??
      "Keep role coverage, integration ownership, traceability, and live-worker locks attached before dispatch expands.",
    dispatchReviewCanAddressTopBlocker: topItem?.canUseDispatchReview === true,
    nextAction:
      topItem?.nextAction ??
      "No Phase 7 dispatch blockers remain; keep live worker spawning locked before expanding dispatch.",
    safety: SAFETY,
    items
  };

  const draft = {
    ...draftWithoutProof,
    dispatchBlockerPriorityProof: buildDispatchBlockerPriorityProof(draftWithoutProof, input.traceability)
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
