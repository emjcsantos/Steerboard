import type {
  ProviderIntegrationReadiness,
  ProviderIntegrationReadinessState,
  ProviderIntegrationReadinessSurface
} from "./providerIntegrationReadiness";

export type Phase4ProviderCatalogDepthKind =
  | "command"
  | "skill"
  | "plugin"
  | "mcp"
  | "automation"
  | "personalization";

export interface Phase4ProviderCatalogDepthRecord {
  readonly id: string;
  readonly label: string;
  readonly kind: Phase4ProviderCatalogDepthKind;
  readonly status: ProviderIntegrationReadinessState;
  readonly statusLabel: string;
  readonly sourceLabel: string;
  readonly total: number;
  readonly itemOrder: readonly string[];
  readonly metadataProof: readonly string[];
  readonly evidenceKey: string;
  readonly readiness: number;
  readonly evidence: string;
  readonly ownerSafeProof: string;
  readonly nextAction: string;
  readonly safety: string;
  readonly executionLocked: boolean;
}

export interface Phase4ProviderCatalogDepthSummary {
  readonly id: string;
  readonly label: string;
  readonly records: readonly Phase4ProviderCatalogDepthRecord[];
  readonly readyCount: number;
  readonly previewCount: number;
  readonly setupRequiredCount: number;
  readonly heldCount: number;
  readonly executionLockCount: number;
  readonly nextAction: string;
  readonly ariaLabel: string;
}

const CATALOG_DEPTH_ID = "phase-4-provider-catalog-depth";
const CATALOG_DEPTH_LABEL = "Phase 4 provider catalog depth";

const EVIDENCE_BY_KIND: Record<Phase4ProviderCatalogDepthKind, string> = {
  command: "Command entries need scope labels, fallback guidance, and owner-safe readiness status.",
  skill: "Skill entries need source, trigger, invocation, and owner-safe readiness status.",
  plugin: "Plugin entries need connection state, allowed surface, and non-mutating readiness evidence.",
  mcp: "MCP entries need transport, tool policy, allowed surface, and non-mutating readiness evidence.",
  automation: "Automation entries need lifecycle, trigger, approval posture, and disabled mutation posture.",
  personalization:
    "Personalization entries need layer, source, privacy posture, and profile-mutation lock evidence."
};

const OWNER_SAFE_PROOF_BY_KIND: Record<Phase4ProviderCatalogDepthKind, string> = {
  command:
    "Command catalog proof includes scoped slash-command labels, fallback metadata source, readiness state, and execution lock.",
  skill:
    "Skill catalog proof includes source, trigger, invocation metadata, readiness state, and execution lock.",
  plugin:
    "Plugin catalog proof includes connection/source metadata, readiness state, and execution lock.",
  mcp:
    "MCP catalog proof includes transport/tool-policy metadata, readiness state, and execution lock.",
  automation:
    "Automation catalog proof includes lifecycle/trigger metadata, approval posture, readiness state, and execution lock.",
  personalization:
    "Personalization catalog proof includes layer/source metadata, privacy posture, readiness state, and execution lock."
};

function evidenceKey(kind: Phase4ProviderCatalogDepthKind): string {
  return `phase-04-provider-catalog:${kind}`;
}

function summarizeItemOrder(itemOrder: readonly string[]): string {
  if (itemOrder.length === 0) {
    return "No catalog item ids are attached.";
  }

  const visibleItems = itemOrder.slice(0, 4).join(", ");
  const suffix = itemOrder.length > 4 ? `, +${itemOrder.length - 4} more` : "";
  return `Catalog item order: ${visibleItems}${suffix}.`;
}

function summarizeMetadataProof(metadataProof: readonly string[]): string {
  if (metadataProof.length === 0) {
    return "No metadata proof entries are attached.";
  }

  const visibleItems = metadataProof.slice(0, 3).join("; ");
  const suffix = metadataProof.length > 3 ? `; +${metadataProof.length - 3} more` : "";
  return `Metadata proof: ${visibleItems}${suffix}.`;
}

function heldStatus(status: ProviderIntegrationReadinessState): boolean {
  return status === "blocked" || status === "unsupported" || status === "unavailable";
}

function buildRecord(
  surface: ProviderIntegrationReadinessSurface
): Phase4ProviderCatalogDepthRecord {
  const kind = surface.surface as Phase4ProviderCatalogDepthKind;

  return {
    id: `${CATALOG_DEPTH_ID}:${surface.surface}`,
    label: surface.label,
    kind,
    status: surface.state,
    statusLabel: surface.statusLabel,
    sourceLabel: surface.sourceLabel,
    total: surface.total,
    itemOrder: surface.itemOrder,
    metadataProof: surface.metadataProof,
    evidenceKey: evidenceKey(kind),
    readiness: surface.readiness,
    evidence: `${EVIDENCE_BY_KIND[kind]} ${surface.detail} ${summarizeItemOrder(surface.itemOrder)} ${summarizeMetadataProof(surface.metadataProof)} Safety: ${surface.safety}`,
    ownerSafeProof: OWNER_SAFE_PROOF_BY_KIND[kind],
    nextAction: surface.nextAction,
    safety: surface.safety,
    executionLocked: true
  };
}

function firstNextAction(
  records: readonly Phase4ProviderCatalogDepthRecord[],
  fallback: string
): string {
  return (
    records.find((record) => record.status === "blocked")?.nextAction ??
    records.find((record) => record.status === "setup-required")?.nextAction ??
    records.find((record) => record.status === "unavailable")?.nextAction ??
    records.find((record) => record.status === "unsupported")?.nextAction ??
    records.find((record) => record.status === "preview")?.nextAction ??
    fallback
  );
}

function buildAriaLabel(
  summary: Omit<Phase4ProviderCatalogDepthSummary, "ariaLabel">
): string {
  return (
    `${summary.label}: ${summary.readyCount} ready, ${summary.previewCount} preview, ` +
    `${summary.setupRequiredCount} setup required, ${summary.heldCount} held; ` +
    `${summary.executionLockCount} execution locks; next action: ${summary.nextAction}`
  );
}

export function buildPhase4ProviderCatalogDepth(
  readiness: ProviderIntegrationReadiness
): Phase4ProviderCatalogDepthSummary {
  const records = readiness.surfaces.map(buildRecord);
  const draft = {
    id: CATALOG_DEPTH_ID,
    label: CATALOG_DEPTH_LABEL,
    records,
    readyCount: records.filter((record) => record.status === "ready").length,
    previewCount: records.filter((record) => record.status === "preview").length,
    setupRequiredCount: records.filter((record) => record.status === "setup-required").length,
    heldCount: records.filter((record) => heldStatus(record.status)).length,
    executionLockCount: records.filter((record) => record.executionLocked).length,
    nextAction: firstNextAction(records, readiness.nextAction)
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
