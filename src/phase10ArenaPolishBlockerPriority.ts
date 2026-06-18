import type { Phase10ArenaPolishItem, Phase10ArenaPolishSnapshot, Phase10ArenaPolishState } from "./phase10ArenaPolish";
import type {
  Phase10ArenaPolishTraceabilityItem,
  Phase10ArenaPolishTraceabilitySummary
} from "./phase10ArenaPolishTraceability";

export type Phase10ArenaPolishBlockerPriorityState = Phase10ArenaPolishState;

export type Phase10ArenaPolishBlockerPriorityKind = "polish" | "traceability";

export type Phase10ArenaPolishBlockerPrioritySeverity = "critical" | "high" | "medium";

export interface Phase10ArenaPolishBlockerPriorityItem {
  readonly id: string;
  readonly sourceId: string;
  readonly label: string;
  readonly kind: Phase10ArenaPolishBlockerPriorityKind;
  readonly status: Phase10ArenaPolishBlockerPriorityState;
  readonly severity: Phase10ArenaPolishBlockerPrioritySeverity;
  readonly priority: number;
  readonly canUseArenaReview: boolean;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase10ArenaPolishBlockerPrioritySummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase10ArenaPolishBlockerPriorityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly openBlockerCount: number;
  readonly arenaReviewAddressableCount: number;
  readonly topPriorityLabel: string;
  readonly topPriorityAction: string;
  readonly arenaReviewCanAddressTopBlocker: boolean;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase10ArenaPolishBlockerPriorityItem[];
}

export interface Phase10ArenaPolishBlockerPriorityInput {
  readonly snapshot: Phase10ArenaPolishSnapshot;
  readonly traceability: Phase10ArenaPolishTraceabilitySummary;
}

const SNAPSHOT_ID = "phase-10-arena-polish-blocker-priority";
const SNAPSHOT_LABEL = "Phase 10 Arena polish blocker priority";
const ARENA_REVIEW_ACTION = "Review Phase 10 Arena polish evidence";
const SAFETY =
  "Phase 10 Arena polish blocker priority is evidence-only. It ranks existing layout, density, keyboard, focus, terminology, acceptance, PM coverage, and traceability blockers but does not launch runtime, mutate sources, change saved sessions, or resume packaging.";

const STATUS_LABELS: Record<Phase10ArenaPolishBlockerPriorityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase10ArenaPolishBlockerPriorityState): number {
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

function stateRank(state: Phase10ArenaPolishBlockerPriorityState): number {
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

  if (normalized.includes("layout-regression")) {
    return 0;
  }
  if (normalized.includes("density")) {
    return 1;
  }
  if (normalized.includes("keyboard")) {
    return 2;
  }
  if (normalized.includes("focus")) {
    return 3;
  }
  if (normalized.includes("terminology")) {
    return 4;
  }
  if (normalized.includes("acceptance")) {
    return 5;
  }
  if (normalized.includes("pm-coverage")) {
    return 6;
  }
  if (normalized.includes("traceability")) {
    return 7;
  }
  return 8;
}

function severityForState(
  state: Phase10ArenaPolishBlockerPriorityState
): Phase10ArenaPolishBlockerPrioritySeverity {
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

function canUseArenaReview(status: Phase10ArenaPolishBlockerPriorityState): boolean {
  return status !== "ready";
}

function canUseArenaReviewForTraceability(item: Phase10ArenaPolishTraceabilityItem): boolean {
  return (
    item.status !== "ready" &&
    (
      item.kind === "polish-readiness" ||
      item.kind === "layout-evidence" ||
      item.kind === "acceptance-gate"
    )
  );
}

function polishItems(
  snapshot: Phase10ArenaPolishSnapshot
): readonly Phase10ArenaPolishBlockerPriorityItem[] {
  return snapshot.items
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromPolish(item));
}

function buildItemFromPolish(
  item: Phase10ArenaPolishItem
): Phase10ArenaPolishBlockerPriorityItem {
  return {
    id: `${SNAPSHOT_ID}:polish:${item.kind}`,
    sourceId: item.id,
    label: item.label,
    kind: "polish",
    status: item.status,
    severity: severityForState(item.status),
    priority: 0,
    canUseArenaReview: canUseArenaReview(item.status),
    detail: `${item.label} is ${STATUS_LABELS[item.status]}; ${publicText(item.detail, "Phase 10 Arena polish evidence is incomplete.")}`,
    nextAction: `${ARENA_REVIEW_ACTION}; ${publicText(item.nextAction, "resolve this Arena polish blocker.")}`
  };
}

function traceabilityItems(
  traceability: Phase10ArenaPolishTraceabilitySummary
): readonly Phase10ArenaPolishBlockerPriorityItem[] {
  return traceability.items
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromTraceability(item));
}

function buildItemFromTraceability(
  item: Phase10ArenaPolishTraceabilityItem
): Phase10ArenaPolishBlockerPriorityItem {
  const arenaReviewAddressable = canUseArenaReviewForTraceability(item);

  return {
    id: `${SNAPSHOT_ID}:traceability:${item.kind}`,
    sourceId: item.id,
    label: item.label,
    kind: "traceability",
    status: item.status,
    severity: severityForState(item.status),
    priority: 0,
    canUseArenaReview: arenaReviewAddressable,
    detail: `${item.label} trace is ${STATUS_LABELS[item.status]}; ${publicText(item.detail, "Phase 10 Arena polish traceability is incomplete.")}`,
    nextAction: arenaReviewAddressable
      ? `${ARENA_REVIEW_ACTION}, then re-check Phase 10 Arena polish traceability.`
      : publicText(
          item.nextAction,
          "Repair Phase 10 remaining-goal or Project Management links before Arena polish can be trusted."
        )
  };
}

function resolveState(
  items: readonly Phase10ArenaPolishBlockerPriorityItem[],
  traceability: Phase10ArenaPolishTraceabilitySummary
): Phase10ArenaPolishBlockerPriorityState {
  if (items.length === 0 && traceability.canTrustArenaPolish) {
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
  items: readonly Phase10ArenaPolishBlockerPriorityItem[],
  traceability: Phase10ArenaPolishTraceabilitySummary
): number {
  if (items.length === 0) {
    return traceability.canTrustArenaPolish ? 100 : traceability.readiness;
  }

  return Math.round(items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length);
}

function buildAriaLabel(
  summary: Omit<Phase10ArenaPolishBlockerPrioritySummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.openBlockerCount} open blockers; ` +
    `${summary.arenaReviewAddressableCount} Arena-review addressable; top priority ${summary.topPriorityLabel}; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase10ArenaPolishBlockerPriority(
  input: Phase10ArenaPolishBlockerPriorityInput
): Phase10ArenaPolishBlockerPrioritySummary {
  const items = [
    ...polishItems(input.snapshot),
    ...traceabilityItems(input.traceability)
  ]
    .sort(
      (left, right) =>
        stateRank(left.status) - stateRank(right.status) ||
        (left.kind === "polish" ? 0 : 1) - (right.kind === "polish" ? 0 : 1) ||
        sourceRank(left.sourceId) - sourceRank(right.sourceId) ||
        left.label.localeCompare(right.label)
    )
    .map((item, index) => ({ ...item, priority: index + 1 }));
  const state = resolveState(items, input.traceability);
  const topItem = items[0];
  const arenaReviewAddressableCount = items.filter((item) => item.canUseArenaReview).length;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForItems(items, input.traceability),
    openBlockerCount: items.length,
    arenaReviewAddressableCount,
    topPriorityLabel: topItem?.label ?? "No open Phase 10 Arena polish blocker",
    topPriorityAction:
      topItem?.nextAction ??
      "Keep layout, density, keyboard, focus, terminology, acceptance, and traceability checks ready before packaging resumes.",
    arenaReviewCanAddressTopBlocker: topItem?.canUseArenaReview === true,
    nextAction:
      topItem?.nextAction ??
      "No Phase 10 Arena polish blockers remain; keep packaging held until owner release readiness clears.",
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
