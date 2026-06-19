import type {
  Phase8PermissionAuditDepthItem,
  Phase8PermissionAuditDepthSnapshot,
  Phase8PermissionAuditDepthState,
  Phase8PermissionAuditException
} from "./phase8PermissionAuditDepth";
import type {
  Phase8RiskTraceabilityItem,
  Phase8RiskTraceabilitySummary
} from "./phase8RiskTraceability";

export type Phase8RiskBlockerPriorityState = Phase8PermissionAuditDepthState;

export type Phase8RiskBlockerPriorityKind =
  | "audit-depth"
  | "risk-exception"
  | "traceability";

export type Phase8RiskBlockerPrioritySeverity = "critical" | "high" | "medium";

export interface Phase8RiskBlockerPriorityItem {
  readonly id: string;
  readonly sourceId: string;
  readonly label: string;
  readonly kind: Phase8RiskBlockerPriorityKind;
  readonly status: Phase8RiskBlockerPriorityState;
  readonly severity: Phase8RiskBlockerPrioritySeverity;
  readonly priority: number;
  readonly canUseAuditReview: boolean;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase8RiskBlockerPrioritySummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase8RiskBlockerPriorityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly openBlockerCount: number;
  readonly auditReviewAddressableCount: number;
  readonly topPriorityLabel: string;
  readonly topPriorityAction: string;
  readonly topPrioritySourceId: string;
  readonly topPriorityKind: Phase8RiskBlockerPriorityKind | "none";
  readonly topPriorityStatus: Phase8RiskBlockerPriorityState | "ready";
  readonly auditReviewCanAddressTopBlocker: boolean;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase8RiskBlockerPriorityItem[];
}

export interface Phase8RiskBlockerPriorityInput {
  readonly snapshot: Phase8PermissionAuditDepthSnapshot;
  readonly traceability: Phase8RiskTraceabilitySummary;
}

const SNAPSHOT_ID = "phase-08-risk-blocker-priority";
const SNAPSHOT_LABEL = "Phase 8 risk blocker priority";
const AUDIT_REVIEW_ACTION = "Review Phase 8 audit evidence";
const SAFETY =
  "Phase 8 risk blocker priority is evidence-only. It ranks existing permission, approval, audit, rollback, exception, disabled-path, and traceability blockers but does not request approval, grant access, run commands, mutate files, export audit records, or unlock desktop/provider execution.";

const STATUS_LABELS: Record<Phase8RiskBlockerPriorityState, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
  waiting: "Waiting"
};

function stateWeight(state: Phase8RiskBlockerPriorityState): number {
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

function stateRank(state: Phase8RiskBlockerPriorityState): number {
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

function kindRank(kind: Phase8RiskBlockerPriorityKind): number {
  switch (kind) {
    case "audit-depth":
      return 0;
    case "risk-exception":
      return 1;
    case "traceability":
    default:
      return 2;
  }
}

function sourceRank(sourceId: string): number {
  const normalized = sourceId.toLowerCase();

  if (normalized.includes("phase8-live-action")) {
    if (normalized.includes("terminal")) {
      return 0;
    }
    if (normalized.includes("git")) {
      return 1;
    }
    if (normalized.includes("plugin")) {
      return 2;
    }
    return 0;
  }
  if (normalized.includes("runtime-launch")) {
    return 3;
  }
  if (normalized.includes("profile")) {
    return 4;
  }
  if (normalized.includes("audit-persistence")) {
    return 5;
  }
  if (normalized.includes("rollback")) {
    return 6;
  }
  if (normalized.includes("disabled")) {
    return 7;
  }
  if (normalized.includes("traceability") || normalized.includes("pm")) {
    return 8;
  }
  if (normalized.includes("approval")) {
    return 9;
  }
  if (normalized.includes("permission")) {
    return 10;
  }
  if (normalized.includes("audit") || normalized.includes("evidence")) {
    return 11;
  }
  return 12;
}

function severityForState(state: Phase8RiskBlockerPriorityState): Phase8RiskBlockerPrioritySeverity {
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

function canUseAuditReview(
  kind: Phase8RiskBlockerPriorityKind,
  status: Phase8RiskBlockerPriorityState
): boolean {
  return status !== "ready" || kind === "risk-exception";
}

function auditDepthItems(
  snapshot: Phase8PermissionAuditDepthSnapshot
): readonly Phase8RiskBlockerPriorityItem[] {
  return snapshot.items
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromAuditDepth(item));
}

function buildItemFromAuditDepth(
  item: Phase8PermissionAuditDepthItem
): Phase8RiskBlockerPriorityItem {
  const auditReview = canUseAuditReview("audit-depth", item.status);

  return {
    id: `${SNAPSHOT_ID}:audit-depth:${item.id}`,
    sourceId: item.id,
    label: item.label,
    kind: "audit-depth",
    status: item.status,
    severity: severityForState(item.status),
    priority: 0,
    canUseAuditReview: auditReview,
    detail: `${item.label} is ${STATUS_LABELS[item.status]}; ${item.detail}`,
    nextAction: auditReview
      ? `${AUDIT_REVIEW_ACTION} for ${item.evidenceKey}; ${publicText(item.nextAction, "resolve this Phase 8 audit-depth blocker.")}`
      : publicText(item.nextAction, "Resolve this Phase 8 audit-depth blocker.")
  };
}

function exceptionItems(
  snapshot: Phase8PermissionAuditDepthSnapshot
): readonly Phase8RiskBlockerPriorityItem[] {
  return snapshot.exceptions
    .filter((exception) => exception.status !== "ready")
    .map((exception) => buildItemFromException(exception));
}

function buildItemFromException(
  exception: Phase8PermissionAuditException
): Phase8RiskBlockerPriorityItem {
  const auditReview = canUseAuditReview("risk-exception", exception.status);

  return {
    id: `${SNAPSHOT_ID}:exception:${exception.id}`,
    sourceId: exception.id,
    label: exception.label,
    kind: "risk-exception",
    status: exception.status,
    severity: exception.severity === "critical" ? "critical" : severityForState(exception.status),
    priority: 0,
    canUseAuditReview: auditReview,
    detail:
      `${exception.label} exception is ${STATUS_LABELS[exception.status]}; ` +
      `${exception.disabledPath} Evidence required: ${exception.evidenceRequired} Rollback: ${exception.rollbackExpectation}`,
    nextAction: auditReview
      ? `${AUDIT_REVIEW_ACTION} for ${exception.evidenceKey}; keep ${exception.auditSource} attached before mutation paths grow.`
      : "Keep this exception attached while permission and audit evidence remain ready."
  };
}

function traceabilityItems(
  traceability: Phase8RiskTraceabilitySummary
): readonly Phase8RiskBlockerPriorityItem[] {
  return traceability.items
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromTraceability(item));
}

function buildItemFromTraceability(
  item: Phase8RiskTraceabilityItem
): Phase8RiskBlockerPriorityItem {
  const auditReview =
    item.kind === "audit-depth" ||
    item.kind === "exception-register" ||
    item.kind === "disabled-path-lock"
      ? canUseAuditReview("traceability", item.status)
      : false;

  return {
    id: `${SNAPSHOT_ID}:traceability:${item.kind}`,
    sourceId: item.id,
    label: item.label,
    kind: "traceability",
    status: item.status,
    severity: severityForState(item.status),
    priority: 0,
    canUseAuditReview: auditReview,
    detail: `${item.label} trace is ${STATUS_LABELS[item.status]}; ${item.detail}`,
    nextAction: auditReview
      ? `${AUDIT_REVIEW_ACTION}, then re-check Phase 8 risk traceability.`
      : publicText(item.nextAction, "Resolve this Phase 8 traceability blocker.")
  };
}

function resolveState(
  items: readonly Phase8RiskBlockerPriorityItem[],
  traceability: Phase8RiskTraceabilitySummary
): Phase8RiskBlockerPriorityState {
  if (items.length === 0 && traceability.canTrustPermissionAudit) {
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
  items: readonly Phase8RiskBlockerPriorityItem[],
  traceability: Phase8RiskTraceabilitySummary
): number {
  if (items.length === 0) {
    return traceability.canTrustPermissionAudit ? 100 : traceability.readiness;
  }

  return Math.round(items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length);
}

function buildAriaLabel(
  summary: Omit<Phase8RiskBlockerPrioritySummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.statusLabel}; ${summary.openBlockerCount} open blockers; ` +
    `${summary.auditReviewAddressableCount} audit-review addressable; top priority ${summary.topPriorityLabel}; ` +
    `source ${summary.topPrioritySourceId}; kind ${summary.topPriorityKind}; status ${summary.topPriorityStatus}; ` +
    `next action: ${summary.nextAction}`
  );
}

export function buildPhase8RiskBlockerPriority(
  input: Phase8RiskBlockerPriorityInput
): Phase8RiskBlockerPrioritySummary {
  const items = [
    ...auditDepthItems(input.snapshot),
    ...exceptionItems(input.snapshot),
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
  const auditReviewAddressableCount = items.filter((item) => item.canUseAuditReview).length;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForItems(items, input.traceability),
    openBlockerCount: items.length,
    auditReviewAddressableCount,
    topPriorityLabel: topItem?.label ?? "No open Phase 8 risk blocker",
    topPriorityAction:
      topItem?.nextAction ??
      "Keep desktop, terminal, Git, MCP, plugin, automation, runtime, profile, and external-service mutations locked.",
    topPrioritySourceId: topItem?.sourceId ?? "phase8.risk-blocker.none",
    topPriorityKind: topItem?.kind ?? "none",
    topPriorityStatus: topItem?.status ?? "ready",
    auditReviewCanAddressTopBlocker: topItem?.canUseAuditReview === true,
    nextAction:
      topItem?.nextAction ??
      "No Phase 8 risk blockers remain; keep permission, approval, audit, rollback, and disabled-path locks attached.",
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
