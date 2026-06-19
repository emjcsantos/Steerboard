import type {
  MigrationHardeningReadiness,
  MigrationHardeningReadinessItem,
  MigrationHardeningReadinessState,
  MigrationReviewDepthItem
} from "./migrationHardeningReadiness";
import type {
  MigrationTraceabilityItem,
  MigrationTraceabilitySummary
} from "./migrationTraceability";

export type MigrationBlockerPriorityState = MigrationHardeningReadinessState;

export type MigrationBlockerPriorityKind =
  | "hardening"
  | "review-depth"
  | "traceability";

export type MigrationBlockerPrioritySeverity = "critical" | "high" | "medium";

export interface MigrationBlockerPriorityItem {
  readonly id: string;
  readonly sourceId: string;
  readonly label: string;
  readonly kind: MigrationBlockerPriorityKind;
  readonly status: MigrationBlockerPriorityState;
  readonly severity: MigrationBlockerPrioritySeverity;
  readonly priority: number;
  readonly canUseMetadataReview: boolean;
  readonly detail: string;
  readonly nextAction: string;
}

export interface MigrationBlockerPrioritySummary {
  readonly id: string;
  readonly label: string;
  readonly state: MigrationBlockerPriorityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly openBlockerCount: number;
  readonly metadataReviewAddressableCount: number;
  readonly topPriorityLabel: string;
  readonly topPriorityAction: string;
  readonly metadataReviewCanAddressTopBlocker: boolean;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly MigrationBlockerPriorityItem[];
}

export interface MigrationBlockerPriorityInput {
  readonly readiness: MigrationHardeningReadiness;
  readonly traceability: MigrationTraceabilitySummary;
}

const SNAPSHOT_ID = "phase-5-migration-blocker-priority";
const SNAPSHOT_LABEL = "Phase 5 migration blocker priority";
const METADATA_REVIEW_ACTION = "Review migration metadata";
const SAFETY =
  "Phase 5 migration blocker priority is evidence-only. It ranks existing migration hardening, review-depth, and traceability blockers but does not apply migrations, change the active profile, copy source data, run commands, invoke providers, mutate files, or unlock source-platform execution.";

const STATUS_LABELS: Record<MigrationBlockerPriorityState, string> = {
  ready: "Ready",
  review: "Review required",
  waiting: "Waiting",
  blocked: "Blocked"
};

function stateWeight(state: MigrationBlockerPriorityState): number {
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

function stateRank(state: MigrationBlockerPriorityState): number {
  switch (state) {
    case "blocked":
      return 0;
    case "waiting":
      return 1;
    case "review":
      return 2;
    case "ready":
    default:
      return 3;
  }
}

function kindRank(kind: MigrationBlockerPriorityKind): number {
  switch (kind) {
    case "review-depth":
      return 0;
    case "hardening":
      return 1;
    case "traceability":
    default:
      return 2;
  }
}

function sourceRank(item: MigrationBlockerPriorityItem): number {
  const normalized = item.sourceId.toLowerCase();

  if (item.status === "blocked" && normalized.includes("audit")) {
    return 0;
  }
  if (normalized.includes("apply-intent")) {
    return item.status === "blocked" ? 1 : 0;
  }
  if (normalized.includes("apply-review-staging")) {
    return item.status === "blocked" ? 1 : 1;
  }
  if (normalized.includes("audit")) {
    return 2;
  }
  if (normalized.includes("rollback")) {
    return 3;
  }
  if (normalized.includes("sensitive") || normalized.includes("exclusion")) {
    return 4;
  }
  if (normalized.includes("profile")) {
    return 5;
  }
  if (normalized.includes("pm") || normalized.includes("traceability")) {
    return 6;
  }
  return 7;
}

function severityForState(state: MigrationBlockerPriorityState): MigrationBlockerPrioritySeverity {
  if (state === "blocked") {
    return "critical";
  }
  if (state === "waiting") {
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

function canUseMetadataReview(
  kind: MigrationBlockerPriorityKind,
  status: MigrationBlockerPriorityState
): boolean {
  return status === "waiting" || status === "review" || kind === "review-depth";
}

function hardeningItems(
  readiness: MigrationHardeningReadiness
): readonly MigrationBlockerPriorityItem[] {
  return readiness.items
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromHardening(item));
}

function buildItemFromHardening(
  item: MigrationHardeningReadinessItem
): MigrationBlockerPriorityItem {
  const metadataReview = canUseMetadataReview("hardening", item.status);

  return {
    id: `${SNAPSHOT_ID}:hardening:${item.id}`,
    sourceId: item.id,
    label: item.label,
    kind: "hardening",
    status: item.status,
    severity: severityForState(item.status),
    priority: 0,
    canUseMetadataReview: metadataReview,
    detail: `${item.label} is ${STATUS_LABELS[item.status]}; ${item.detail}`,
    nextAction: metadataReview
      ? `${METADATA_REVIEW_ACTION} and update the local draft/review evidence before staging apply intent.`
      : publicText(item.detail, "Resolve this migration hardening blocker.")
  };
}

function reviewDepthItems(
  readiness: MigrationHardeningReadiness
): readonly MigrationBlockerPriorityItem[] {
  return readiness.reviewDepthItems
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromReviewDepth(item));
}

function buildItemFromReviewDepth(
  item: MigrationReviewDepthItem
): MigrationBlockerPriorityItem {
  const metadataReview = canUseMetadataReview("review-depth", item.status);

  return {
    id: `${SNAPSHOT_ID}:review-depth:${item.kind}`,
    sourceId: item.id,
    label: item.label,
    kind: "review-depth",
    status: item.status,
    severity: severityForState(item.status),
    priority: 0,
    canUseMetadataReview: metadataReview,
    detail: `${item.label} is ${STATUS_LABELS[item.status]}; ${item.detail} Evidence: ${item.evidence}`,
    nextAction: metadataReview
      ? `${METADATA_REVIEW_ACTION} for ${item.evidenceKey}; ${publicText(item.nextAction, "resolve the review-depth blocker.")}`
      : publicText(item.nextAction, "Resolve this migration review-depth blocker.")
  };
}

function traceabilityItems(
  traceability: MigrationTraceabilitySummary
): readonly MigrationBlockerPriorityItem[] {
  return traceability.items
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromTraceability(item));
}

function buildItemFromTraceability(
  item: MigrationTraceabilityItem
): MigrationBlockerPriorityItem {
  const metadataReview =
    item.kind === "review-depth" ||
    item.kind === "sensitive-boundary" ||
    item.kind === "profile-lock"
      ? canUseMetadataReview("traceability", item.status)
      : false;

  return {
    id: `${SNAPSHOT_ID}:traceability:${item.kind}`,
    sourceId: item.id,
    label: item.label,
    kind: "traceability",
    status: item.status,
    severity: severityForState(item.status),
    priority: 0,
    canUseMetadataReview: metadataReview,
    detail: `${item.label} trace is ${STATUS_LABELS[item.status]}; ${item.detail}`,
    nextAction: metadataReview
      ? `${METADATA_REVIEW_ACTION}, then re-check Phase 5 traceability.`
      : publicText(item.nextAction, "Resolve this migration traceability blocker.")
  };
}

function resolveState(
  items: readonly MigrationBlockerPriorityItem[],
  traceability: MigrationTraceabilitySummary
): MigrationBlockerPriorityState {
  if (items.length === 0 && traceability.canTrustMigrationReview) {
    return "ready";
  }
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "waiting")) {
    return "waiting";
  }
  if (items.some((item) => item.status === "review")) {
    return "review";
  }
  return traceability.state;
}

function readinessForItems(
  items: readonly MigrationBlockerPriorityItem[],
  traceability: MigrationTraceabilitySummary
): number {
  if (items.length === 0) {
    return traceability.canTrustMigrationReview ? 100 : traceability.readiness;
  }

  return Math.round(items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length);
}

function buildAriaLabel(
  summary: Omit<MigrationBlockerPrioritySummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.openBlockerCount} open blockers; ` +
    `${summary.metadataReviewAddressableCount} metadata-review addressable; top priority ${summary.topPriorityLabel}; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildMigrationBlockerPriority(
  input: MigrationBlockerPriorityInput
): MigrationBlockerPrioritySummary {
  const items = [
    ...reviewDepthItems(input.readiness),
    ...hardeningItems(input.readiness),
    ...traceabilityItems(input.traceability)
  ]
    .sort(
      (left, right) =>
        stateRank(left.status) - stateRank(right.status) ||
        kindRank(left.kind) - kindRank(right.kind) ||
        sourceRank(left) - sourceRank(right) ||
        left.label.localeCompare(right.label)
    )
    .map((item, index) => ({ ...item, priority: index + 1 }));
  const state = resolveState(items, input.traceability);
  const topItem = items[0];
  const metadataReviewAddressableCount = items.filter((item) => item.canUseMetadataReview).length;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForItems(items, input.traceability),
    openBlockerCount: items.length,
    metadataReviewAddressableCount,
    topPriorityLabel: topItem?.label ?? "No open Phase 5 migration blocker",
    topPriorityAction:
      topItem?.nextAction ??
      "Keep migration apply, active-profile changes, source mutation, commands, and provider execution locked.",
    metadataReviewCanAddressTopBlocker: topItem?.canUseMetadataReview === true,
    nextAction:
      topItem?.nextAction ??
      "No Phase 5 migration blockers remain; keep apply intent behind explicit owner review and mutation locks.",
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
