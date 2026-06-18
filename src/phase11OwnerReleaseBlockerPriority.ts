import type {
  Phase11OwnerReleaseTraceabilityItem,
  Phase11OwnerReleaseTraceabilitySummary,
  Phase11OwnerReleaseTraceabilityState
} from "./phase11OwnerReleaseTraceability";
import type { Phase11OwnerCommandCenterItem, Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import type { Phase11ProofFreshnessDepthItem, Phase11ProofFreshnessDepthSnapshot } from "./phase11ProofFreshnessDepth";
import type { Phase11EvidenceRecordSnapshot, Phase11EvidenceRecordsSnapshot } from "./phase11EvidenceRecords";
import type { Phase11ReleaseReadinessItem, Phase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";

export type Phase11OwnerReleaseBlockerPriorityState = Phase11OwnerReleaseTraceabilityState;

export type Phase11OwnerReleaseBlockerPriorityKind =
  | "owner-command"
  | "proof-freshness"
  | "evidence-record"
  | "release-readiness"
  | "traceability";

export type Phase11OwnerReleaseBlockerSeverity = "critical" | "high" | "medium";

export interface Phase11OwnerReleaseBlockerPriorityItem {
  readonly id: string;
  readonly sourceId: string;
  readonly label: string;
  readonly kind: Phase11OwnerReleaseBlockerPriorityKind;
  readonly status: Phase11OwnerReleaseBlockerPriorityState;
  readonly severity: Phase11OwnerReleaseBlockerSeverity;
  readonly priority: number;
  readonly ownerReviewAddressable: boolean;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase11OwnerReleaseBlockerPrioritySummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase11OwnerReleaseBlockerPriorityState;
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
  readonly items: readonly Phase11OwnerReleaseBlockerPriorityItem[];
}

export interface Phase11OwnerReleaseBlockerPriorityInput {
  readonly ownerCommandCenter: Phase11OwnerCommandCenterSnapshot;
  readonly proofFreshnessDepth: Phase11ProofFreshnessDepthSnapshot;
  readonly evidenceRecords: Phase11EvidenceRecordsSnapshot;
  readonly releaseReadiness: Phase11ReleaseReadinessSnapshot;
  readonly traceability: Phase11OwnerReleaseTraceabilitySummary;
}

const SNAPSHOT_ID = "phase-11-owner-release-blocker-priority";
const SNAPSHOT_LABEL = "Phase 11 owner release blocker priority";
const OWNER_REVIEW_ACTION = "Review Phase 11 Owner Testing and release evidence";
const SAFETY =
  "Phase 11 owner release blocker priority is evidence-only. It ranks existing Owner Testing, proof freshness, evidence-record, release-readiness, PM traceability, and packaging-hold blockers without installing dependencies, running tests, building packages, pushing branches, or resuming release actions.";

const STATUS_LABELS: Record<Phase11OwnerReleaseBlockerPriorityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase11OwnerReleaseBlockerPriorityState): number {
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

function stateRank(state: Phase11OwnerReleaseBlockerPriorityState): number {
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

  if (normalized.includes("phase3-trace")) {
    return 0;
  }
  if (normalized.includes("packaging") || normalized.includes("release-decision")) {
    return 1;
  }
  if (normalized.includes("phase3-clearance") || normalized.includes("phase3-smoke-proof")) {
    return 2;
  }
  if (normalized.includes("phase-priority-proof")) {
    return 3;
  }
  if (normalized.includes("owner-goal") || normalized.includes("phase-readiness")) {
    return 4;
  }
  if (normalized.includes("owner-command") || normalized.includes("checklist")) {
    return 5;
  }
  if (normalized.includes("proof")) {
    return 6;
  }
  if (normalized.includes("fresh-checkout")) {
    return 7;
  }
  if (normalized.includes("clean-checkout")) {
    return 8;
  }
  if (normalized.includes("build-test")) {
    return 9;
  }
  if (normalized.includes("docs-known-limits")) {
    return 10;
  }
  if (normalized.includes("pm-coverage") || normalized.includes("traceability")) {
    return 11;
  }
  return 12;
}

function severityForState(
  state: Phase11OwnerReleaseBlockerPriorityState
): Phase11OwnerReleaseBlockerSeverity {
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

function canOwnerReview(status: Phase11OwnerReleaseBlockerPriorityState): boolean {
  return status !== "ready";
}

function buildItem(
  sourceId: string,
  label: string,
  kind: Phase11OwnerReleaseBlockerPriorityKind,
  status: Phase11OwnerReleaseBlockerPriorityState,
  detail: string,
  nextAction: string
): Phase11OwnerReleaseBlockerPriorityItem {
  return {
    id: `${SNAPSHOT_ID}:${kind}:${sourceId}`,
    sourceId,
    label,
    kind,
    status,
    severity: severityForState(status),
    priority: 0,
    ownerReviewAddressable: canOwnerReview(status),
    detail: publicText(detail, "Phase 11 release evidence is incomplete."),
    nextAction: `${OWNER_REVIEW_ACTION}; ${publicText(nextAction, "resolve this Phase 11 blocker.")}`
  };
}

function ownerItems(
  snapshot: Phase11OwnerCommandCenterSnapshot
): readonly Phase11OwnerReleaseBlockerPriorityItem[] {
  return snapshot.items
    .filter((item) => item.status !== "ready")
    .map((item: Phase11OwnerCommandCenterItem) =>
      buildItem(item.id, item.label, "owner-command", item.status, item.detail, item.nextAction)
    );
}

function proofItems(
  snapshot: Phase11ProofFreshnessDepthSnapshot
): readonly Phase11OwnerReleaseBlockerPriorityItem[] {
  return snapshot.items
    .filter((item) => item.status !== "ready")
    .map((item: Phase11ProofFreshnessDepthItem) =>
      buildItem(item.id, item.label, "proof-freshness", item.status, item.detail, item.nextAction)
    );
}

function evidenceItems(
  snapshot: Phase11EvidenceRecordsSnapshot
): readonly Phase11OwnerReleaseBlockerPriorityItem[] {
  return Object.values(snapshot.records)
    .filter((record) => record.state !== "ready")
    .map((record: Phase11EvidenceRecordSnapshot) =>
      buildItem(
        `phase-11-evidence-records:${record.gate}`,
        record.label,
        "evidence-record",
        record.state,
        record.detail,
        record.nextAction
      )
    );
}

function releaseItems(
  snapshot: Phase11ReleaseReadinessSnapshot
): readonly Phase11OwnerReleaseBlockerPriorityItem[] {
  return snapshot.items
    .filter((item) => item.status !== "ready")
    .map((item: Phase11ReleaseReadinessItem) =>
      buildItem(item.id, item.label, "release-readiness", item.status, item.detail, item.nextAction)
    );
}

function traceabilityItems(
  traceability: Phase11OwnerReleaseTraceabilitySummary
): readonly Phase11OwnerReleaseBlockerPriorityItem[] {
  return traceability.items
    .filter((item) => item.status !== "ready")
    .map((item: Phase11OwnerReleaseTraceabilityItem) =>
      buildItem(item.id, item.label, "traceability", item.status, item.detail, item.nextAction)
    );
}

function resolveState(
  items: readonly Phase11OwnerReleaseBlockerPriorityItem[],
  traceability: Phase11OwnerReleaseTraceabilitySummary
): Phase11OwnerReleaseBlockerPriorityState {
  if (items.length === 0 && traceability.canTrustOwnerReleaseGate) {
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
  items: readonly Phase11OwnerReleaseBlockerPriorityItem[],
  traceability: Phase11OwnerReleaseTraceabilitySummary
): number {
  if (items.length === 0) {
    return traceability.canTrustOwnerReleaseGate ? 100 : traceability.readiness;
  }

  return Math.round(items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length);
}

function buildAriaLabel(
  summary: Omit<Phase11OwnerReleaseBlockerPrioritySummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.openBlockerCount} open blockers; ` +
    `${summary.ownerReviewAddressableCount} owner-review addressable; top priority ${summary.topPriorityLabel}; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase11OwnerReleaseBlockerPriority(
  input: Phase11OwnerReleaseBlockerPriorityInput
): Phase11OwnerReleaseBlockerPrioritySummary {
  const items = [
    ...ownerItems(input.ownerCommandCenter),
    ...proofItems(input.proofFreshnessDepth),
    ...evidenceItems(input.evidenceRecords),
    ...releaseItems(input.releaseReadiness),
    ...traceabilityItems(input.traceability)
  ]
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
    topPriorityLabel: topItem?.label ?? "No open Phase 11 owner release blocker",
    topPriorityAction:
      topItem?.nextAction ??
      "Keep Owner Testing, proof freshness, evidence records, release readiness, traceability, and packaging holds ready before release resumes.",
    ownerReviewCanAddressTopBlocker: topItem?.ownerReviewAddressable === true,
    nextAction:
      topItem?.nextAction ??
      "No Phase 11 owner release blockers remain; keep packaging held until owner release readiness clears.",
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
