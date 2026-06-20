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
  readonly scopedExecutionProof: string;
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
  readonly catalogDepthProof: string;
  readonly commandSkillProof: string;
  readonly pluginMcpProof: string;
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

function scopedExecutionProof(
  kind: Phase4ProviderCatalogDepthKind,
  metadataProof: readonly string[]
): string {
  const firstProof = metadataProof[0] ?? "missing";

  if (kind === "command") {
    const scopedProof = metadataProof.find((proof) => proof.includes("scopes=")) ?? firstProof;
    return `commandScopeProof=${scopedProof} execution=locked`;
  }

  if (kind === "skill") {
    const skillProof =
      metadataProof.find(
        (proof) =>
          proof.includes("source=") &&
          proof.includes("trigger=") &&
          proof.includes("invocation=")
      ) ?? firstProof;
    return `skillInvocationProof=${skillProof} execution=locked`;
  }

  if (kind === "plugin") {
    const pluginProof =
      metadataProof.find((proof) => proof.includes("surface=metadata-only")) ?? firstProof;
    return `pluginSurfaceProof=${pluginProof} surface=metadata-only execution=locked`;
  }

  if (kind === "mcp") {
    const mcpProof =
      metadataProof.find((proof) => proof.includes("transport=") && proof.includes("toolPolicy=")) ??
      firstProof;
    return `mcpToolPolicyProof=${mcpProof} transport=attached toolPolicy=attached execution=locked`;
  }

  return `metadataProof=${firstProof} execution=locked`;
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
    scopedExecutionProof: scopedExecutionProof(kind, surface.metadataProof),
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

function recordStatus(
  records: readonly Phase4ProviderCatalogDepthRecord[],
  kind: Phase4ProviderCatalogDepthKind
): ProviderIntegrationReadinessState | "missing" {
  return records.find((record) => record.kind === kind)?.status ?? "missing";
}

function buildCatalogDepthProof(input: {
  readonly records: readonly Phase4ProviderCatalogDepthRecord[];
  readonly readyCount: number;
  readonly previewCount: number;
  readonly setupRequiredCount: number;
  readonly heldCount: number;
  readonly executionLockCount: number;
}): string {
  const metadataProofCount = input.records.filter(
    (record) => record.metadataProof.length > 0
  ).length;
  const scopedExecutionProofCount = input.records.filter((record) =>
    record.scopedExecutionProof.trim()
  ).length;
  const ownerSafeProofCount = input.records.filter((record) =>
    record.ownerSafeProof.trim()
  ).length;
  const kindOrder = input.records.map((record) => record.kind).join("|");

  return (
    `records=${input.records.length}/6 ready=${input.readyCount} preview=${input.previewCount} ` +
    `setupRequired=${input.setupRequiredCount} held=${input.heldCount} ` +
    `kindOrder=${kindOrder} ` +
    `locks=${input.executionLockCount}/6 metadataProof=${metadataProofCount}/6 ` +
    `scopedExecution=${scopedExecutionProofCount}/6 ownerSafe=${ownerSafeProofCount}/6 ` +
    `command=${recordStatus(input.records, "command")} ` +
    `skill=${recordStatus(input.records, "skill")} ` +
    `plugin=${recordStatus(input.records, "plugin")} ` +
    `mcp=${recordStatus(input.records, "mcp")} ` +
    `automation=${recordStatus(input.records, "automation")} ` +
    `personalization=${recordStatus(input.records, "personalization")} ` +
    "metadataOnly=locked execution=locked"
  );
}

function buildCommandSkillProof(
  records: readonly Phase4ProviderCatalogDepthRecord[]
): string {
  const command = records.find((record) => record.kind === "command");
  const skill = records.find((record) => record.kind === "skill");
  const pairOrder = [command?.kind, skill?.kind].filter(Boolean).join("|") || "missing";

  return (
    `command=${command?.status ?? "missing"} skill=${skill?.status ?? "missing"} ` +
    `pairOrder=${pairOrder} ` +
    `commandItems=${command?.itemOrder.length ?? 0} skillItems=${skill?.itemOrder.length ?? 0} ` +
    `commandEvidence=${command?.evidenceKey ?? "missing"} skillEvidence=${skill?.evidenceKey ?? "missing"} ` +
    `commandItemOrder=${command && command.itemOrder.length > 0 ? "present" : "missing"} ` +
    `skillItemOrder=${skill && skill.itemOrder.length > 0 ? "present" : "missing"} ` +
    `commandMetadata=${command && command.metadataProof.length > 0 ? "present" : "missing"} ` +
    `skillMetadata=${skill && skill.metadataProof.length > 0 ? "present" : "missing"} ` +
    `commandSource=${command?.sourceLabel ? "present" : "missing"} ` +
    `skillSource=${skill?.sourceLabel ? "present" : "missing"} ` +
    `commandScopeProof=${command?.scopedExecutionProof.includes("commandScopeProof=") ? "present" : "missing"} ` +
    `skillInvocationProof=${skill?.scopedExecutionProof.includes("skillInvocationProof=") ? "present" : "missing"} ` +
    `commandLock=${command?.executionLocked ? "locked" : "review"} ` +
    `skillLock=${skill?.executionLocked ? "locked" : "review"} ` +
    "metadataOnly=locked execution=locked"
  );
}

function buildPluginMcpProof(
  records: readonly Phase4ProviderCatalogDepthRecord[]
): string {
  const plugin = records.find((record) => record.kind === "plugin");
  const mcp = records.find((record) => record.kind === "mcp");

  return (
    `plugin=${plugin?.status ?? "missing"} mcp=${mcp?.status ?? "missing"} ` +
    `pluginItems=${plugin?.itemOrder.length ?? 0} mcpItems=${mcp?.itemOrder.length ?? 0} ` +
    `pluginEvidence=${plugin?.evidenceKey ?? "missing"} mcpEvidence=${mcp?.evidenceKey ?? "missing"} ` +
    `pluginItemOrder=${plugin && plugin.itemOrder.length > 0 ? "present" : "missing"} ` +
    `mcpItemOrder=${mcp && mcp.itemOrder.length > 0 ? "present" : "missing"} ` +
    `pluginMetadata=${plugin && plugin.metadataProof.length > 0 ? "present" : "missing"} ` +
    `mcpMetadata=${mcp && mcp.metadataProof.length > 0 ? "present" : "missing"} ` +
    `pluginSource=${plugin?.sourceLabel ? "present" : "missing"} ` +
    `mcpSource=${mcp?.sourceLabel ? "present" : "missing"} ` +
    `pluginSurfaceProof=${plugin?.scopedExecutionProof.includes("pluginSurfaceProof=") ? "present" : "missing"} ` +
    `mcpToolPolicyProof=${mcp?.scopedExecutionProof.includes("mcpToolPolicyProof=") ? "present" : "missing"} ` +
    `metadataOnlySurface=${plugin?.scopedExecutionProof.includes("surface=metadata-only") ? "present" : "missing"} ` +
    `mcpTransport=${mcp?.scopedExecutionProof.includes("transport=") ? "present" : "missing"} ` +
    `mcpToolPolicy=${mcp?.scopedExecutionProof.includes("toolPolicy=") ? "present" : "missing"} ` +
    `pluginLock=${plugin?.executionLocked ? "locked" : "review"} ` +
    `mcpLock=${mcp?.executionLocked ? "locked" : "review"} ` +
    "metadataOnly=locked execution=locked"
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
  const readyCount = records.filter((record) => record.status === "ready").length;
  const previewCount = records.filter((record) => record.status === "preview").length;
  const setupRequiredCount = records.filter((record) => record.status === "setup-required").length;
  const heldCount = records.filter((record) => heldStatus(record.status)).length;
  const executionLockCount = records.filter((record) => record.executionLocked).length;
  const draft = {
    id: CATALOG_DEPTH_ID,
    label: CATALOG_DEPTH_LABEL,
    records,
    readyCount,
    previewCount,
    setupRequiredCount,
    heldCount,
    executionLockCount,
    nextAction: firstNextAction(records, readiness.nextAction),
    catalogDepthProof: buildCatalogDepthProof({
      records,
      readyCount,
      previewCount,
      setupRequiredCount,
      heldCount,
      executionLockCount
    }),
    commandSkillProof: buildCommandSkillProof(records),
    pluginMcpProof: buildPluginMcpProof(records)
  };

  return {
    ...draft,
    ariaLabel: buildAriaLabel(draft)
  };
}
