import type {
  Phase4ProviderCatalogDepthRecord,
  Phase4ProviderCatalogDepthSummary
} from "./phase4ProviderCatalogDepth";
import type {
  Phase4ProviderSurfaceDepthItem,
  Phase4ProviderSurfaceDepthSnapshot,
  Phase4ProviderSurfaceDepthState
} from "./phase4ProviderSurfaceDepth";
import type {
  Phase4ProviderTraceabilityItem,
  Phase4ProviderTraceabilitySummary
} from "./phase4ProviderTraceability";
import type {
  Phase4RefreshSafetyDepthRecord,
  Phase4RefreshSafetyDepthSummary
} from "./phase4RefreshSafetyDepth";

export type Phase4ProviderBlockerPriorityState = Phase4ProviderSurfaceDepthState;

export type Phase4ProviderBlockerPriorityKind =
  | "provider-catalog"
  | "refresh-safety"
  | "surface-depth"
  | "traceability";

export type Phase4ProviderBlockerPrioritySeverity =
  | "critical"
  | "high"
  | "medium";

export interface Phase4ProviderBlockerPriorityItem {
  readonly id: string;
  readonly sourceId: string;
  readonly label: string;
  readonly kind: Phase4ProviderBlockerPriorityKind;
  readonly status: Phase4ProviderBlockerPriorityState;
  readonly severity: Phase4ProviderBlockerPrioritySeverity;
  readonly priority: number;
  readonly canUseCatalogSmoke: boolean;
  readonly detail: string;
  readonly nextAction: string;
}

export interface Phase4ProviderBlockerPrioritySummary {
  readonly id: string;
  readonly label: string;
  readonly state: Phase4ProviderBlockerPriorityState;
  readonly statusLabel: string;
  readonly readiness: number;
  readonly openBlockerCount: number;
  readonly catalogSmokeAddressableCount: number;
  readonly topPriorityLabel: string;
  readonly topPriorityAction: string;
  readonly catalogSmokeCanAddressTopBlocker: boolean;
  readonly nextAction: string;
  readonly safety: string;
  readonly ariaLabel: string;
  readonly items: readonly Phase4ProviderBlockerPriorityItem[];
}

export interface Phase4ProviderBlockerPriorityInput {
  readonly catalogDepth: Phase4ProviderCatalogDepthSummary;
  readonly refreshSafety: Phase4RefreshSafetyDepthSummary;
  readonly surfaceDepth: Phase4ProviderSurfaceDepthSnapshot;
  readonly traceability: Phase4ProviderTraceabilitySummary;
}

const SNAPSHOT_ID = "phase-4-provider-blocker-priority";
const SNAPSHOT_LABEL = "Phase 4 provider blocker priority";
const CATALOG_SMOKE_ACTION = "Run catalog smoke";
const SAFETY =
  "Phase 4 provider blocker priority is evidence-only. It ranks existing provider catalog, refresh-safety, surface-depth, and traceability blockers but does not refresh catalogs, run commands, invoke skills, start MCP tools, schedule automations, mutate personalization, use terminal, perform Git actions, or unlock provider execution.";

const STATUS_LABELS: Record<Phase4ProviderBlockerPriorityState, string> = {
  ready: "Ready",
  preview: "Preview",
  "setup-required": "Setup required",
  blocked: "Blocked",
  unsupported: "Unsupported",
  unavailable: "Unavailable"
};

function stateWeight(state: Phase4ProviderBlockerPriorityState): number {
  switch (state) {
    case "ready":
      return 100;
    case "preview":
      return 70;
    case "setup-required":
      return 40;
    case "unsupported":
    case "unavailable":
      return 25;
    case "blocked":
    default:
      return 0;
  }
}

function stateRank(state: Phase4ProviderBlockerPriorityState): number {
  switch (state) {
    case "blocked":
      return 0;
    case "setup-required":
      return 1;
    case "unavailable":
      return 2;
    case "unsupported":
      return 3;
    case "preview":
      return 4;
    case "ready":
    default:
      return 5;
  }
}

function kindRank(kind: Phase4ProviderBlockerPriorityKind): number {
  switch (kind) {
    case "provider-catalog":
      return 0;
    case "surface-depth":
      return 1;
    case "refresh-safety":
      return 2;
    case "traceability":
    default:
      return 3;
  }
}

function sourceRank(item: Phase4ProviderBlockerPriorityItem): number {
  const sourceId = item.sourceId.toLowerCase();

  if (sourceId.includes("command")) {
    return 0;
  }
  if (sourceId.includes("skill")) {
    return 1;
  }
  if (sourceId.includes("plugin")) {
    return 2;
  }
  if (sourceId.includes("mcp")) {
    return 3;
  }
  if (sourceId.includes("automation")) {
    return 4;
  }
  if (sourceId.includes("personalization")) {
    return 5;
  }
  return 6;
}

function severityForState(
  state: Phase4ProviderBlockerPriorityState
): Phase4ProviderBlockerPrioritySeverity {
  if (state === "blocked" || state === "setup-required") {
    return "critical";
  }
  if (state === "unavailable" || state === "unsupported") {
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

function canUseCatalogSmoke(
  kind: Phase4ProviderBlockerPriorityKind,
  status: Phase4ProviderBlockerPriorityState
): boolean {
  return (
    status === "preview" ||
    kind === "refresh-safety" ||
    (kind === "provider-catalog" && status === "unavailable")
  );
}

function normalizeRefreshStatus(
  status: Phase4RefreshSafetyDepthRecord["status"]
): Phase4ProviderBlockerPriorityState {
  return status === "blocked" ? "blocked" : status === "preview" ? "preview" : "ready";
}

function catalogItems(
  catalogDepth: Phase4ProviderCatalogDepthSummary
): readonly Phase4ProviderBlockerPriorityItem[] {
  return catalogDepth.records
    .filter((record) => record.status !== "ready")
    .map((record) => buildItemFromCatalogRecord(record));
}

function buildItemFromCatalogRecord(
  record: Phase4ProviderCatalogDepthRecord
): Phase4ProviderBlockerPriorityItem {
  const smokeAddressable = canUseCatalogSmoke("provider-catalog", record.status);

  return {
    id: `${SNAPSHOT_ID}:catalog:${record.kind}`,
    sourceId: record.id,
    label: record.label,
    kind: "provider-catalog",
    status: record.status,
    severity: severityForState(record.status),
    priority: 0,
    canUseCatalogSmoke: smokeAddressable,
    detail: `${record.label} catalog is ${record.statusLabel}; ${record.total} rows are visible from ${record.sourceLabel}.`,
    nextAction: smokeAddressable
      ? `${CATALOG_SMOKE_ACTION} from the explicit owner action to refresh metadata/status proof.`
      : publicText(record.nextAction, "Resolve this provider catalog blocker.")
  };
}

function refreshSafetyItems(
  refreshSafety: Phase4RefreshSafetyDepthSummary
): readonly Phase4ProviderBlockerPriorityItem[] {
  return refreshSafety.records
    .filter((record) => record.status !== "ready")
    .map((record) => {
      const status = normalizeRefreshStatus(record.status);
      const smokeAddressable = canUseCatalogSmoke("refresh-safety", status);

      return {
        id: `${SNAPSHOT_ID}:refresh:${record.kind}`,
        sourceId: record.id,
        label: record.label,
        kind: "refresh-safety",
        status,
        severity: severityForState(status),
        priority: 0,
        canUseCatalogSmoke: smokeAddressable,
        detail: `${record.label} is ${record.statusLabel}; ${record.evidence}`,
        nextAction: smokeAddressable
          ? `${CATALOG_SMOKE_ACTION} from the explicit owner action to refresh all six metadata/status surfaces.`
          : publicText(record.nextAction, "Resolve this refresh-safety blocker.")
      };
    });
}

function surfaceDepthItems(
  surfaceDepth: Phase4ProviderSurfaceDepthSnapshot
): readonly Phase4ProviderBlockerPriorityItem[] {
  return surfaceDepth.items
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromSurfaceDepth(item));
}

function buildItemFromSurfaceDepth(
  item: Phase4ProviderSurfaceDepthItem
): Phase4ProviderBlockerPriorityItem {
  const smokeAddressable = canUseCatalogSmoke("surface-depth", item.status);

  return {
    id: `${SNAPSHOT_ID}:surface:${item.kind}`,
    sourceId: item.id,
    label: item.label,
    kind: "surface-depth",
    status: item.status,
    severity: severityForState(item.status),
    priority: 0,
    canUseCatalogSmoke: smokeAddressable,
    detail: `${item.label} is ${STATUS_LABELS[item.status]}; ${item.detail}`,
    nextAction: smokeAddressable
      ? `${CATALOG_SMOKE_ACTION} from the explicit owner action after reviewing provider metadata.`
      : publicText(item.nextAction, "Resolve this provider surface blocker.")
  };
}

function traceabilityItems(
  traceability: Phase4ProviderTraceabilitySummary
): readonly Phase4ProviderBlockerPriorityItem[] {
  return traceability.items
    .filter((item) => item.status !== "ready")
    .map((item) => buildItemFromTraceability(item));
}

function buildItemFromTraceability(
  item: Phase4ProviderTraceabilityItem
): Phase4ProviderBlockerPriorityItem {
  const smokeAddressable = canUseCatalogSmoke("traceability", item.status);

  return {
    id: `${SNAPSHOT_ID}:trace:${item.kind}`,
    sourceId: item.id,
    label: item.label,
    kind: "traceability",
    status: item.status,
    severity: severityForState(item.status),
    priority: 0,
    canUseCatalogSmoke: smokeAddressable,
    detail: `${item.label} trace is ${STATUS_LABELS[item.status]}; ${item.detail}`,
    nextAction: smokeAddressable
      ? `${CATALOG_SMOKE_ACTION} from the explicit owner action, then review provider traceability again.`
      : publicText(item.nextAction, "Resolve this Phase 4 traceability blocker.")
  };
}

function resolveState(
  items: readonly Phase4ProviderBlockerPriorityItem[],
  traceability: Phase4ProviderTraceabilitySummary
): Phase4ProviderBlockerPriorityState {
  if (items.length === 0 && traceability.canTrustProviderReview) {
    return "ready";
  }
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (items.some((item) => item.status === "setup-required")) {
    return "setup-required";
  }
  if (items.some((item) => item.status === "unavailable")) {
    return "unavailable";
  }
  if (items.some((item) => item.status === "unsupported")) {
    return "unsupported";
  }
  if (items.some((item) => item.status === "preview")) {
    return "preview";
  }
  return traceability.state;
}

function readinessForItems(
  items: readonly Phase4ProviderBlockerPriorityItem[],
  traceability: Phase4ProviderTraceabilitySummary
): number {
  if (items.length === 0) {
    return traceability.canTrustProviderReview ? 100 : traceability.readiness;
  }

  return Math.round(items.reduce((sum, item) => sum + stateWeight(item.status), 0) / items.length);
}

function buildAriaLabel(
  snapshot: Omit<Phase4ProviderBlockerPrioritySummary, "ariaLabel">
): string {
  return (
    `${snapshot.label}: ${snapshot.statusLabel}; ${snapshot.openBlockerCount} open blockers; ` +
    `${snapshot.catalogSmokeAddressableCount} catalog-smoke addressable; top priority ${snapshot.topPriorityLabel}; ` +
    `next action: ${snapshot.nextAction}`
  );
}

export function buildPhase4ProviderBlockerPriority(
  input: Phase4ProviderBlockerPriorityInput
): Phase4ProviderBlockerPrioritySummary {
  const items = [
    ...catalogItems(input.catalogDepth),
    ...refreshSafetyItems(input.refreshSafety),
    ...surfaceDepthItems(input.surfaceDepth),
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
  const catalogSmokeAddressableCount = items.filter((item) => item.canUseCatalogSmoke).length;
  const draft = {
    id: SNAPSHOT_ID,
    label: SNAPSHOT_LABEL,
    state,
    statusLabel: STATUS_LABELS[state],
    readiness: readinessForItems(items, input.traceability),
    openBlockerCount: items.length,
    catalogSmokeAddressableCount,
    topPriorityLabel: topItem?.label ?? "No open Phase 4 provider blocker",
    topPriorityAction:
      topItem?.nextAction ??
      "Keep provider execution locked until explicit approval, audit, rollback, and permission gates are implemented.",
    catalogSmokeCanAddressTopBlocker: topItem?.canUseCatalogSmoke === true,
    nextAction:
      topItem?.nextAction ??
      "No Phase 4 provider blockers remain; keep execution locked until owner approval and audit gates exist.",
    safety: SAFETY,
    items
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
