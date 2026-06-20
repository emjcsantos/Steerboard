import {
  buildCommandCatalogSnapshot,
  defaultCommandCatalog,
  type CommandCatalogRefreshSource,
  type CommandCatalogSnapshot
} from "./commandCatalog";
import {
  buildSkillCatalogSnapshot,
  defaultSkillCatalog,
  type SkillCatalogRefreshSource,
  type SkillCatalogSnapshot
} from "./skillCatalog";
import {
  buildPluginCatalogSnapshot,
  defaultPluginCatalog,
  type PluginCatalogRefreshSource,
  type PluginCatalogSnapshot
} from "./pluginCatalog";
import {
  buildMcpCatalogSnapshot,
  defaultMcpCatalog,
  type McpCatalogRefreshSource,
  type McpCatalogSnapshot
} from "./mcpCatalog";
import {
  buildAutomationCatalogSnapshot,
  defaultAutomationCatalog,
  type AutomationCatalogRefreshSource,
  type AutomationCatalogSnapshot
} from "./automationCatalog";
import {
  buildPersonalizationCatalogSnapshot,
  defaultPersonalizationCatalog,
  type PersonalizationCatalogRefreshSource,
  type PersonalizationCatalogSnapshot
} from "./personalizationCatalog";

type OwnerValidationState = "ready" | "blocked";

type SnapshotSource =
  | CommandCatalogRefreshSource
  | SkillCatalogRefreshSource
  | PluginCatalogRefreshSource
  | McpCatalogRefreshSource
  | AutomationCatalogRefreshSource
  | PersonalizationCatalogRefreshSource;

const ALLOWED_REFRESH_SOURCES: readonly SnapshotSource[] = [
  "provider-live",
  "provider-preview",
  "default-fallback",
  "empty-refresh",
  "unavailable"
];

type SnapshotPayloadRecord = {
  readonly source?: unknown;
  readonly entries?: unknown;
};

function isRecord(value: unknown): value is SnapshotPayloadRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const CATALOG_REFRESH_OWNER_SURFACE_ORDER = [
  "command",
  "skill",
  "plugin",
  "mcp",
  "automation",
  "personalization"
] as const;

export const CATALOG_REFRESH_OWNER_NO_EXECUTION_SAFETY =
  "Catalog refresh validation is metadata/status-only and must not execute commands, skills, plugins, MCP tools, automations, personalization/profile mutations, terminal actions, Git operations, or external actions.";

export interface CatalogRefreshOwnerValidationInput {
  readonly commandPayload?: unknown;
  readonly skillPayload?: unknown;
  readonly pluginPayload?: unknown;
  readonly mcpPayload?: unknown;
  readonly automationPayload?: unknown;
  readonly personalizationPayload?: unknown;
}

export type CatalogSurface = (typeof CATALOG_REFRESH_OWNER_SURFACE_ORDER)[number];

export interface CatalogRefreshOwnerValidationSurfaceResult {
  readonly surface: CatalogSurface;
  readonly source: SnapshotSource;
  readonly total: number;
  readonly readiness: number;
  readonly state: OwnerValidationState;
  readonly pass: boolean;
  readonly itemOrder: readonly string[];
  readonly metadataProof: readonly string[];
  readonly safety: string;
  readonly summary: Readonly<Record<string, number>>;
}

export interface CatalogRefreshOwnerValidationResult {
  readonly safety: string;
  readonly pass: boolean;
  readonly readiness: number;
  readonly state: OwnerValidationState;
  readonly surfaces: readonly CatalogRefreshOwnerValidationSurfaceResult[];
}

function isAllowedSource(value: string): value is SnapshotSource {
  return (ALLOWED_REFRESH_SOURCES as readonly string[]).includes(value);
}

function commandSummaryConsistent(snapshot: CommandCatalogSnapshot): boolean {
  const s = snapshot.summary;
  const statusTotal = s.live + s.preview + s.unsupported + s.unavailable;
  const expectedAvailability = s.total > 0
    ? Number(((s.live + s.preview) / s.total).toFixed(2))
    : 0;

  return (
    isAllowedSource(snapshot.source) &&
    snapshot.catalog.length === s.total &&
    s.total === statusTotal &&
    s.executable + s.blocked === s.total &&
    s.availability === expectedAvailability
  );
}

function skillSummaryConsistent(snapshot: SkillCatalogSnapshot): boolean {
  const s = snapshot.summary;
  const statusTotal =
    s.live + s.preview + s.disconnected + s.setupRequired + s.unsupported + s.unavailable;
  const expectedAvailability = s.total > 0
    ? Number(((s.live + s.preview) / s.total).toFixed(2))
    : 0;

  return (
    isAllowedSource(snapshot.source) &&
    snapshot.catalog.length === s.total &&
    s.total === statusTotal &&
    s.actionable === statusTotal &&
    s.availability === expectedAvailability
  );
}

function pluginSummaryConsistent(snapshot: PluginCatalogSnapshot): boolean {
  const s = snapshot.summary;
  const statusTotal =
    s.live + s.preview + s.disconnected + s.setupRequired + s.unsupported + s.unavailable;
  const expectedAvailability = s.total > 0
    ? Number(((s.live + s.preview) / s.total).toFixed(2))
    : 0;

  return (
    isAllowedSource(snapshot.source) &&
    snapshot.catalog.length === s.total &&
    s.total === statusTotal &&
    s.actionable === statusTotal &&
    s.availability === expectedAvailability
  );
}

function mcpSummaryConsistent(snapshot: McpCatalogSnapshot): boolean {
  const s = snapshot.summary;
  const statusTotal =
    s.live + s.preview + s.disconnected + s.setupRequired + s.unsupported + s.unavailable;
  const expectedAvailability = s.total > 0
    ? Number(((s.live + s.preview) / s.total).toFixed(2))
    : 0;

  return (
    isAllowedSource(snapshot.source) &&
    snapshot.catalog.length === s.total &&
    s.total === statusTotal &&
    s.actionable === statusTotal &&
    s.availability === expectedAvailability
  );
}

function automationSummaryConsistent(snapshot: AutomationCatalogSnapshot): boolean {
  const s = snapshot.summary;
  const statusTotal =
    s.live + s.preview + s.disconnected + s.setupRequired + s.unsupported + s.unavailable;
  const expectedAvailability = s.total > 0
    ? Number(((s.live + s.preview) / s.total).toFixed(2))
    : 0;
  const expectedActionable = s.live + s.preview + s.disconnected + s.setupRequired;
  const expectedNeedsAttention =
    s.disconnected + s.setupRequired + s.unsupported + s.unavailable;

  return (
    isAllowedSource(snapshot.source) &&
    snapshot.catalog.length === s.total &&
    s.total === statusTotal &&
    s.actionable === expectedActionable &&
    s.needsAttention === expectedNeedsAttention &&
    s.availability === expectedAvailability
  );
}

function personalizationSummaryConsistent(snapshot: PersonalizationCatalogSnapshot): boolean {
  const s = snapshot.summary;
  const statusTotal =
    s.live + s.preview + s.disconnected + s.setupRequired + s.unsupported + s.unavailable;
  const expectedAvailability = s.total > 0
    ? Number(((s.live + s.preview) / s.total).toFixed(2))
    : 0;

  return (
    isAllowedSource(snapshot.source) &&
    snapshot.catalog.length === s.total &&
    s.total === statusTotal &&
    s.actionable === statusTotal &&
    s.availability === expectedAvailability
  );
}

function normalizePayload(payload: unknown, fallbackCatalog: readonly unknown[]): {
  source: SnapshotSource;
  entries: unknown;
} {
  if (payload === undefined) {
    return {
      source: "default-fallback",
      entries: fallbackCatalog
    };
  }

  if (!isRecord(payload)) {
    return {
      source: "unavailable",
      entries: []
    };
  }

  const source = isAllowedSource(String(payload.source)) ? (payload.source as SnapshotSource) : "unavailable";
  const hasEntries = Object.prototype.hasOwnProperty.call(payload, "entries");

  if (!hasEntries) {
    return {
      source,
      entries: undefined
    };
  }

  return {
    source,
    entries: Array.isArray(payload.entries) ? payload.entries : []
  };
}

function safeCommandSnapshot(payload: unknown): CommandCatalogSnapshot {
  try {
    const { source, entries } = normalizePayload(payload, defaultCommandCatalog);
    return buildCommandCatalogSnapshot(
      entries,
      source,
      defaultCommandCatalog
    );
  } catch {
    return buildCommandCatalogSnapshot([], "unavailable", defaultCommandCatalog);
  }
}

function safeSkillSnapshot(payload: unknown): SkillCatalogSnapshot {
  try {
    const { source, entries } = normalizePayload(payload, defaultSkillCatalog);
    return buildSkillCatalogSnapshot(
      entries,
      source,
      defaultSkillCatalog
    );
  } catch {
    return buildSkillCatalogSnapshot([], "unavailable", defaultSkillCatalog);
  }
}

function safePluginSnapshot(payload: unknown): PluginCatalogSnapshot {
  try {
    const { source, entries } = normalizePayload(payload, defaultPluginCatalog);
    return buildPluginCatalogSnapshot(
      entries,
      source,
      defaultPluginCatalog
    );
  } catch {
    return buildPluginCatalogSnapshot([], "unavailable", defaultPluginCatalog);
  }
}

function safeMcpSnapshot(payload: unknown): McpCatalogSnapshot {
  try {
    const { source, entries } = normalizePayload(payload, defaultMcpCatalog);
    return buildMcpCatalogSnapshot(
      entries,
      source,
      defaultMcpCatalog
    );
  } catch {
    return buildMcpCatalogSnapshot([], "unavailable", defaultMcpCatalog);
  }
}

function safeAutomationSnapshot(payload: unknown): AutomationCatalogSnapshot {
  try {
    const { source, entries } = normalizePayload(payload, defaultAutomationCatalog);
    return buildAutomationCatalogSnapshot(
      entries,
      source,
      defaultAutomationCatalog
    );
  } catch {
    return buildAutomationCatalogSnapshot([], "unavailable", defaultAutomationCatalog);
  }
}

function safePersonalizationSnapshot(payload: unknown): PersonalizationCatalogSnapshot {
  try {
    const { source, entries } = normalizePayload(payload, defaultPersonalizationCatalog);
    return buildPersonalizationCatalogSnapshot(
      entries,
      source,
      defaultPersonalizationCatalog
    );
  } catch {
    return buildPersonalizationCatalogSnapshot(
      [],
      "unavailable",
      defaultPersonalizationCatalog
    );
  }
}

function buildSurfaceResult(
  surface: CatalogSurface,
  source: SnapshotSource,
  total: number,
  summary: Readonly<Record<string, number>>,
  isConsistent: boolean,
  itemOrder: readonly string[],
  metadataProof: readonly string[]
): CatalogRefreshOwnerValidationSurfaceResult {
  return {
    surface,
    source,
    total,
    readiness: isConsistent ? 100 : 0,
    state: isConsistent ? "ready" : "blocked",
    pass: isConsistent,
    itemOrder,
    metadataProof,
    safety: CATALOG_REFRESH_OWNER_NO_EXECUTION_SAFETY,
    summary
  };
}

function commandMetadataProof(snapshot: CommandCatalogSnapshot): readonly string[] {
  return snapshot.catalog.map(
    (entry) => `${entry.command}:scopes=${entry.scopes.join("+")}:state=${entry.state}`
  );
}

function skillMetadataProof(snapshot: SkillCatalogSnapshot): readonly string[] {
  return snapshot.catalog.map(
    (entry) =>
      `${entry.id}:source=${entry.source}:trigger=${entry.trigger}:invocation=${entry.invocationLabel}:state=${entry.state}`
  );
}

function pluginMetadataProof(snapshot: PluginCatalogSnapshot): readonly string[] {
  return snapshot.catalog.map(
    (entry) => `${entry.id}:connection=${entry.state}:surface=metadata-only`
  );
}

function mcpMetadataProof(snapshot: McpCatalogSnapshot): readonly string[] {
  return snapshot.catalog.map(
    (entry) => `${entry.id}:transport=${entry.transport}:toolPolicy=${entry.toolPolicy}:state=${entry.state}`
  );
}

function automationMetadataProof(snapshot: AutomationCatalogSnapshot): readonly string[] {
  return snapshot.catalog.map(
    (entry) =>
      `${entry.id}:lifecycle=${entry.lifecycle}:trigger=${entry.trigger}:approval=${entry.approvalPosture}:state=${entry.state}`
  );
}

function personalizationMetadataProof(snapshot: PersonalizationCatalogSnapshot): readonly string[] {
  return snapshot.catalog.map(
    (entry) =>
      `${entry.id}:layer=${entry.layer}:source=${entry.source}:privacy=${entry.privacyPosture}:state=${entry.state}`
  );
}

function commandSummaryRecord(snapshot: CommandCatalogSnapshot): Readonly<Record<string, number>> {
  return {
    total: snapshot.summary.total,
    live: snapshot.summary.live,
    preview: snapshot.summary.preview,
    unsupported: snapshot.summary.unsupported,
    unavailable: snapshot.summary.unavailable,
    executable: snapshot.summary.executable,
    blocked: snapshot.summary.blocked,
    availability: snapshot.summary.availability
  };
}

function genericSummaryRecord(
  snapshot:
    | SkillCatalogSnapshot
    | PluginCatalogSnapshot
    | McpCatalogSnapshot
    | PersonalizationCatalogSnapshot
): Readonly<Record<string, number>> {
  return {
    total: snapshot.summary.total,
    live: snapshot.summary.live,
    preview: snapshot.summary.preview,
    disconnected: snapshot.summary.disconnected,
    setupRequired: snapshot.summary.setupRequired,
    unsupported: snapshot.summary.unsupported,
    unavailable: snapshot.summary.unavailable,
    actionable: snapshot.summary.actionable,
    availability: snapshot.summary.availability
  };
}

function automationSummaryRecord(
  snapshot: AutomationCatalogSnapshot
): Readonly<Record<string, number>> {
  return {
    total: snapshot.summary.total,
    live: snapshot.summary.live,
    preview: snapshot.summary.preview,
    disconnected: snapshot.summary.disconnected,
    setupRequired: snapshot.summary.setupRequired,
    unsupported: snapshot.summary.unsupported,
    unavailable: snapshot.summary.unavailable,
    actionable: snapshot.summary.actionable,
    needsAttention: snapshot.summary.needsAttention,
    availability: snapshot.summary.availability
  };
}

export function buildCatalogRefreshOwnerValidation(
  payload: CatalogRefreshOwnerValidationInput = {}
): CatalogRefreshOwnerValidationResult {
  const commandSnapshot = safeCommandSnapshot(payload.commandPayload);
  const skillSnapshot = safeSkillSnapshot(payload.skillPayload);
  const pluginSnapshot = safePluginSnapshot(payload.pluginPayload);
  const mcpSnapshot = safeMcpSnapshot(payload.mcpPayload);
  const automationSnapshot = safeAutomationSnapshot(payload.automationPayload);
  const personalizationSnapshot = safePersonalizationSnapshot(payload.personalizationPayload);

  const surfaces: CatalogRefreshOwnerValidationSurfaceResult[] = [
    buildSurfaceResult(
      "command",
      commandSnapshot.source,
      commandSnapshot.summary.total,
      commandSummaryRecord(commandSnapshot),
      commandSummaryConsistent(commandSnapshot),
      commandSnapshot.catalog.map((entry) => entry.command),
      commandMetadataProof(commandSnapshot)
    ),
    buildSurfaceResult(
      "skill",
      skillSnapshot.source,
      skillSnapshot.summary.total,
      genericSummaryRecord(skillSnapshot),
      skillSummaryConsistent(skillSnapshot),
      skillSnapshot.catalog.map((entry) => entry.id),
      skillMetadataProof(skillSnapshot)
    ),
    buildSurfaceResult(
      "plugin",
      pluginSnapshot.source,
      pluginSnapshot.summary.total,
      genericSummaryRecord(pluginSnapshot),
      pluginSummaryConsistent(pluginSnapshot),
      pluginSnapshot.catalog.map((entry) => entry.id),
      pluginMetadataProof(pluginSnapshot)
    ),
    buildSurfaceResult(
      "mcp",
      mcpSnapshot.source,
      mcpSnapshot.summary.total,
      genericSummaryRecord(mcpSnapshot),
      mcpSummaryConsistent(mcpSnapshot),
      mcpSnapshot.catalog.map((entry) => entry.id),
      mcpMetadataProof(mcpSnapshot)
    ),
    buildSurfaceResult(
      "automation",
      automationSnapshot.source,
      automationSnapshot.summary.total,
      automationSummaryRecord(automationSnapshot),
      automationSummaryConsistent(automationSnapshot),
      automationSnapshot.catalog.map((entry) => entry.id),
      automationMetadataProof(automationSnapshot)
    ),
    buildSurfaceResult(
      "personalization",
      personalizationSnapshot.source,
      personalizationSnapshot.summary.total,
      genericSummaryRecord(personalizationSnapshot),
      personalizationSummaryConsistent(personalizationSnapshot),
      personalizationSnapshot.catalog.map((entry) => entry.id),
      personalizationMetadataProof(personalizationSnapshot)
    )
  ];

  const pass = surfaces.every((surface) => surface.pass);

  return {
    safety: CATALOG_REFRESH_OWNER_NO_EXECUTION_SAFETY,
    pass,
    readiness: pass ? 100 : 0,
    state: pass ? "ready" : "blocked",
    surfaces
  };
}
