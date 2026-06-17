import type {
  Phase126PublishHoldTraceabilityItem,
  Phase126PublishHoldTraceabilityState,
  Phase126PublishHoldTraceabilitySummary
} from "./phase126PublishHoldTraceability";
import type { PhasePriorityEvidenceItem, PhasePriorityEvidenceResult } from "./phasePriorityEvidence";

export type Phase126PublishHoldBlockerPriorityState = Phase126PublishHoldTraceabilityState;

export type Phase126PublishHoldBlockerPriorityKind = "priority-proof" | "traceability";

export type Phase126PublishHoldBlockerSeverity = "critical" | "high" | "medium";

export interface Phase126PublishHoldBlockerPriorityItem {
  readonly id: string;
  readonly sourceId: string;
  readonly label: string;
  readonly kind: Phase126PublishHoldBlockerPriorityKind;
  readonly status: Phase126PublishHoldBlockerPriorityState;
  readonly severity: Phase126PublishHoldBlockerSeverity;
  readonly priority: number;
  readonly ownerReviewAddressable: boolean;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase126PublishHoldBlockerPrioritySummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase126PublishHoldBlockerPriorityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly openBlockerCount: number;
  readonly ownerReviewAddressableCount: number;
  readonly topPriorityLabel: string;
  readonly topPriorityAction: string;
  readonly ownerReviewCanAddressTopBlocker: boolean;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase126PublishHoldBlockerPriorityItem[];
}

export interface Phase126PublishHoldBlockerPriorityInput {
  readonly phasePriorityEvidence: PhasePriorityEvidenceResult;
  readonly traceability: Phase126PublishHoldTraceabilitySummary;
}

const SNAPSHOT_ID = "phase-1-2-6-publish-hold-blocker-priority";
const SNAPSHOT_LABEL = "Phase 1/2/6 publish hold blocker priority";
const OWNER_REVIEW_ACTION = "Review Phase 1/2/6 publish-hold evidence";
const SAFETY =
  "Phase 1/2/6 publish hold blocker priority is evidence-only. It ranks the owner/remote publish hold, one-panel proof, two-panel isolation, PM board staging, and PM traceability blockers without running live prompts, mutating files, changing saved sessions, pushing branches, or publishing release artifacts.";

const STATUS_LABELS: Record<Phase126PublishHoldBlockerPriorityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase126PublishHoldBlockerPriorityState): number {
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

function stateRank(state: Phase126PublishHoldBlockerPriorityState): number {
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

function sourceRank(sourceId: string): number {
  const normalized = sourceId.toLowerCase();

  if (normalized.includes("publish-hold") || normalized.includes("publish-goal")) {
    return 0;
  }
  if (normalized.includes("phase-1-live") || normalized.includes("phase-1-proof")) {
    return 1;
  }
  if (normalized.includes("phase-2") || normalized.includes("isolation")) {
    return 2;
  }
  if (normalized.includes("phase-6") || normalized.includes("pm-board")) {
    return 3;
  }
  if (normalized.includes("pm-coverage") || normalized.includes("traceability")) {
    return 4;
  }
  return 5;
}

function severityForState(
  state: Phase126PublishHoldBlockerPriorityState
): Phase126PublishHoldBlockerSeverity {
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

function buildItem(
  sourceId: string,
  label: string,
  kind: Phase126PublishHoldBlockerPriorityKind,
  status: Phase126PublishHoldBlockerPriorityState,
  detail: string,
  nextAction: string
): Phase126PublishHoldBlockerPriorityItem {
  return {
    id: `${SNAPSHOT_ID}:${kind}:${sourceId}`,
    sourceId,
    label,
    kind,
    status,
    severity: severityForState(status),
    priority: 0,
    ownerReviewAddressable: status !== "ready",
    detail: publicText(detail, "Phase 1/2/6 publish-hold evidence is incomplete."),
    nextAction: `${OWNER_REVIEW_ACTION}; ${publicText(nextAction, "resolve this publish-hold blocker.")}`
  };
}

function priorityEvidenceItems(
  evidence: PhasePriorityEvidenceResult
): readonly Phase126PublishHoldBlockerPriorityItem[] {
  return evidence.items
    .filter((item) => item.state !== "ready")
    .map((item: PhasePriorityEvidenceItem) =>
      buildItem(item.id, item.label, "priority-proof", item.state, item.detail, item.nextAction)
    );
}

function traceabilityItems(
  traceability: Phase126PublishHoldTraceabilitySummary
): readonly Phase126PublishHoldBlockerPriorityItem[] {
  return traceability.items
    .filter((item) => item.status !== "ready")
    .map((item: Phase126PublishHoldTraceabilityItem) =>
      buildItem(item.id, item.label, "traceability", item.status, item.detail, item.nextAction)
    );
}

function resolveState(
  items: readonly Phase126PublishHoldBlockerPriorityItem[],
  traceability: Phase126PublishHoldTraceabilitySummary
): Phase126PublishHoldBlockerPriorityState {
  if (items.length === 0 && traceability.canTrustLocalHold) {
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
  items: readonly Phase126PublishHoldBlockerPriorityItem[],
  traceability: Phase126PublishHoldTraceabilitySummary
): number {
  if (items.length === 0) {
    return traceability.canTrustLocalHold ? 100 : traceability.readiness;
  }

  return Math.round(items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length);
}

function buildAriaLabel(
  summary: Omit<Phase126PublishHoldBlockerPrioritySummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.openBlockerCount} open blockers; ` +
    `${summary.ownerReviewAddressableCount} owner-review addressable; top priority ${summary.topPriorityLabel}; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase126PublishHoldBlockerPriority(
  input: Phase126PublishHoldBlockerPriorityInput
): Phase126PublishHoldBlockerPrioritySummary {
  const seenSources = new Set<string>();
  const items = [
    ...traceabilityItems(input.traceability),
    ...priorityEvidenceItems(input.phasePriorityEvidence)
  ]
    .filter((item) => {
      if (seenSources.has(item.sourceId)) {
        return false;
      }
      seenSources.add(item.sourceId);
      return true;
    })
    .sort(
      (left, right) =>
        stateRank(left.status) - stateRank(right.status) ||
        sourceRank(left.sourceId) - sourceRank(right.sourceId) ||
        left.kind.localeCompare(right.kind) ||
        left.label.localeCompare(right.label)
    )
    .map((item, index) => ({ ...item, priority: index + 1 }));
  const state = resolveState(items, input.traceability);
  const topItem = items[0];
  const ownerReviewAddressableCount = items.filter((item) => item.ownerReviewAddressable).length;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForItems(items, input.traceability),
    openBlockerCount: items.length,
    ownerReviewAddressableCount,
    topPriorityLabel: topItem?.label ?? "No open Phase 1/2/6 publish-hold blocker",
    topPriorityAction:
      topItem?.nextAction ??
      "Keep one-panel proof, two-panel isolation, PM staging, traceability, and owner publish approval aligned.",
    ownerReviewCanAddressTopBlocker: topItem?.ownerReviewAddressable === true,
    nextAction:
      topItem?.nextAction ??
      "No Phase 1/2/6 publish-hold blockers remain; keep publishing held until owner approval.",
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
