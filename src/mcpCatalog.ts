export type McpCatalogState =
  | "live"
  | "preview"
  | "disconnected"
  | "setup-required"
  | "unsupported"
  | "unavailable";

export type McpCatalogTransport =
  | "stdio"
  | "sse"
  | "websocket"
  | "http"
  | "local-process"
  | "remote-endpoint"
  | "mock"
  | "unknown";

export type McpCatalogToolPolicy = "all" | "read-only" | "approval-required" | "restricted" | "disabled" | "unknown";

export type McpCatalogEntry = {
  id: string;
  label: string;
  transport: McpCatalogTransport;
  state: McpCatalogState;
  toolPolicy: McpCatalogToolPolicy;
  detail?: string;
};

export type McpCatalogSummary = {
  total: number;
  live: number;
  preview: number;
  disconnected: number;
  setupRequired: number;
  unsupported: number;
  unavailable: number;
  actionable: number;
  availability: number;
};

export type McpCatalogRefreshSource =
  | "provider-live"
  | "provider-preview"
  | "default-fallback"
  | "empty-refresh"
  | "unavailable";

export type McpCatalogProviderCapabilityState = McpCatalogState;

export interface McpCatalogSnapshotSummary extends Omit<McpCatalogSummary, "availability"> {
  source: McpCatalogRefreshSource;
  availability: number;
}

export interface McpCatalogSnapshot {
  source: McpCatalogRefreshSource;
  catalog: readonly McpCatalogEntry[];
  summary: McpCatalogSnapshotSummary;
}

export interface McpCatalogProviderCapabilityServer {
  id: string;
  state: McpCatalogProviderCapabilityState;
}

export interface McpCatalogProviderCapabilityInput {
  canRunLive: boolean;
  canRunPreview: boolean;
  servers: unknown[];
  source: McpCatalogRefreshSource;
}

export const defaultMcpCatalog: readonly McpCatalogEntry[] = [
  {
    id: "filesystem-bridge",
    label: "Filesystem Bridge",
    transport: "stdio",
    state: "setup-required",
    toolPolicy: "read-only",
    detail: "Expose controlled workspace file operations through policy-gated tools."
  },
  {
    id: "task-tracker",
    label: "Task Tracker",
    transport: "remote-endpoint",
    state: "setup-required",
    toolPolicy: "all",
    detail: "Synchronize lightweight task items and status updates."
  },
  {
    id: "research-index",
    label: "Research Index",
    transport: "http",
    state: "preview",
    toolPolicy: "read-only",
    detail: "Search and retrieve public references in preview mode."
  },
  {
    id: "event-stream",
    label: "Event Stream",
    transport: "sse",
    state: "disconnected",
    toolPolicy: "approval-required",
    detail: "Enable endpoint credentials and reconnect this stream before use."
  },
  {
    id: "legacy-bridge",
    label: "Legacy Bridge",
    transport: "mock",
    state: "unsupported",
    toolPolicy: "disabled",
    detail: "Legacy provider adapter is kept for archive history only."
  },
  {
    id: "setup-required-proxy",
    label: "Setup Required Proxy",
    transport: "remote-endpoint",
    state: "setup-required",
    toolPolicy: "restricted"
  },
  {
    id: "offline-fallback",
    label: "Offline Fallback",
    transport: "unknown",
    state: "unavailable",
    toolPolicy: "unknown",
    detail: "No transport is available yet for this integration."
  }
];

const DEFAULT_FALLBACK_ENTRY_ID_PREFIX = "mcp-";
const FALLBACK_TOOL_POLICY: McpCatalogToolPolicy = "approval-required";
const FALLBACK_TRANSPORT: McpCatalogTransport = "unknown";
const DEFAULT_FALLBACK_DETAIL = "No valid MCP catalog is available.";
const REFRESH_SOURCES: readonly McpCatalogRefreshSource[] = [
  "provider-live",
  "provider-preview",
  "default-fallback",
  "empty-refresh",
  "unavailable"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProviderRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

function normalizeMcpId(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return undefined;
  }

  return normalized;
}

function normalizeMcpLabel(value: unknown, fallbackId: string): string {
  if (typeof value !== "string" || !value.trim()) {
    return fallbackId
      .split("-")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  return value.trim();
}

function normalizeMcpTransport(value: unknown): McpCatalogTransport {
  return value === "stdio" ||
    value === "sse" ||
    value === "websocket" ||
    value === "http" ||
    value === "local-process" ||
    value === "remote-endpoint" ||
    value === "mock" ||
    value === "unknown"
    ? value
    : FALLBACK_TRANSPORT;
}

function normalizeMcpToolPolicy(value: unknown): McpCatalogToolPolicy {
  return value === "all" ||
    value === "read-only" ||
    value === "approval-required" ||
    value === "restricted" ||
    value === "disabled" ||
    value === "unknown"
    ? value
    : FALLBACK_TOOL_POLICY;
}

function normalizeMcpCatalogState(value: unknown): McpCatalogState {
  return value === "live" ||
    value === "preview" ||
    value === "disconnected" ||
    value === "setup-required" ||
    value === "unsupported" ||
    value === "unavailable"
    ? value
    : "unavailable";
}

function normalizeMcpDetail(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const detail = value.trim();
  return detail.length > 0 ? detail : undefined;
}

function coerceMcpCatalogEntry(raw: unknown): McpCatalogEntry | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const id = normalizeMcpId(raw.id);
  if (!id) {
    return undefined;
  }

  const label = normalizeMcpLabel(raw.label, id);
  const transport = normalizeMcpTransport(raw.transport);
  const state = normalizeMcpCatalogState(raw.state);
  const toolPolicy = normalizeMcpToolPolicy(raw.toolPolicy);
  const detail = normalizeMcpDetail(raw.detail);

  return {
    id,
    label,
    transport,
    state,
    toolPolicy,
    ...(detail !== undefined ? { detail } : {})
  };
}

function normalizeMcpCatalogInternal(value: unknown): McpCatalogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries = value
    .map(coerceMcpCatalogEntry)
    .filter((entry): entry is McpCatalogEntry => entry !== undefined);

  const deduped: McpCatalogEntry[] = [];
  for (const entry of entries) {
    const duplicate = deduped.some((candidate) => candidate.id === entry.id);
    if (!duplicate) {
      deduped.push(entry);
    }
  }

  return deduped;
}

function summarizeMcpCatalogWithSource(
  catalog: unknown,
  source: McpCatalogRefreshSource
): McpCatalogSnapshotSummary {
  const summary = summarizeMcpCatalog(catalog);

  return {
    ...summary,
    source
  };
}

function normalizeRefreshSource(value: unknown): McpCatalogRefreshSource {
  return typeof value === "string" && (REFRESH_SOURCES as readonly string[]).includes(value)
    ? (value as McpCatalogRefreshSource)
    : "unavailable";
}

function isMcpCatalogProviderCapabilityState(
  value: unknown
): value is McpCatalogProviderCapabilityState {
  return value === "live" ||
    value === "preview" ||
    value === "disconnected" ||
    value === "setup-required" ||
    value === "unsupported" ||
    value === "unavailable";
}

function isMcpCatalogProviderCapabilityInput(
  value: unknown
): value is McpCatalogProviderCapabilityInput {
  return (
    isProviderRecord(value) &&
    typeof value.canRunLive === "boolean" &&
    typeof value.canRunPreview === "boolean" &&
    Array.isArray(value.servers)
  );
}

function coerceProviderCapabilityServer(
  value: unknown
): McpCatalogProviderCapabilityServer | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = normalizeMcpId(value.id);
  if (!id) {
    return undefined;
  }

  if (!isMcpCatalogProviderCapabilityState(value.state)) {
    return undefined;
  }

  return { id, state: value.state };
}

function normalizeMcpCatalogProviderCapabilityInput(
  value: unknown
): {
  source: McpCatalogRefreshSource;
  servers: McpCatalogProviderCapabilityServer[];
  serverCount: number;
  canRunLive: boolean;
} {
  const raw = isMcpCatalogProviderCapabilityInput(value) ? value : undefined;

  if (!raw) {
    return {
      source: "default-fallback",
      servers: [],
      serverCount: -1,
      canRunLive: false
    };
  }

  return {
    source: raw.canRunLive
      ? "provider-live"
      : raw.canRunPreview
        ? "provider-preview"
        : "default-fallback",
    servers: raw.servers
      .map(coerceProviderCapabilityServer)
      .filter((item): item is McpCatalogProviderCapabilityServer => item !== undefined),
    serverCount: raw.servers.length,
    canRunLive: raw.canRunLive
  };
}

function normalizeMcpCatalogWithProviderCapabilities(
  catalog: unknown,
  providerCapabilities: {
    canRunLive: boolean;
    servers: McpCatalogProviderCapabilityServer[];
  }
): McpCatalogEntry[] {
  const fallbackCatalog = normalizeMcpCatalog(catalog);
  const byServer = new Map<string, McpCatalogProviderCapabilityState>(
    providerCapabilities.servers.map((item) => [item.id, item.state])
  );

  return fallbackCatalog.map((entry) => {
    const override = byServer.get(entry.id);
    if (!override) {
      return entry;
    }

    const resolvedState = providerCapabilities.canRunLive
      ? override
      : override === "live"
        ? "preview"
        : override;

    return {
      ...entry,
      state: resolvedState
    };
  });
}

function normalizeMcpCatalogWithProviderEntries(
  entries: unknown,
  source: McpCatalogRefreshSource,
  fallback: readonly McpCatalogEntry[]
): McpCatalogEntry[] {
  const providerEntries = normalizeMcpCatalogInternal(entries);
  const fallbackEntries = normalizeMcpCatalogInternal(fallback);

  if (providerEntries.length === 0) {
    return [];
  }

  return providerEntries.map((entry) => {
    const fallbackEntry = fallbackEntries.find((item) => item.id === entry.id);
    const state = source === "provider-preview" && entry.state === "live" ? "preview" : entry.state;

    return {
      ...(fallbackEntry ?? entry),
      state
    };
  });
}

function unavailableSnapshot(
  fallback: readonly McpCatalogEntry[]
): McpCatalogSnapshot {
  const catalog = normalizeMcpCatalog([], fallback).map((entry) => ({
    ...entry,
    state: entry.state === "live" ? ("unavailable" as const) : entry.state
  }));

  return {
    source: "unavailable",
    catalog,
    summary: summarizeMcpCatalogWithSource(catalog, "unavailable")
  };
}

export function normalizeMcpCatalog(
  value: unknown,
  fallback: readonly McpCatalogEntry[] = defaultMcpCatalog
): McpCatalogEntry[] {
  const normalized = normalizeMcpCatalogInternal(value);
  if (normalized.length > 0) {
    return normalized;
  }

  const normalizedFallback = normalizeMcpCatalogInternal(fallback);
  if (normalizedFallback.length > 0) {
    return normalizedFallback;
  }

  const normalizedDefault = normalizeMcpCatalogInternal(defaultMcpCatalog);
  if (normalizedDefault.length > 0) {
    return normalizedDefault;
  }

  return [
    {
      id: `${DEFAULT_FALLBACK_ENTRY_ID_PREFIX}fallback`,
      label: "Fallback MCP",
      transport: FALLBACK_TRANSPORT,
      state: "unavailable",
      toolPolicy: FALLBACK_TOOL_POLICY,
      detail: DEFAULT_FALLBACK_DETAIL
    }
  ];
}

export function summarizeMcpCatalog(
  catalog: unknown = defaultMcpCatalog
): McpCatalogSummary {
  const safeCatalog = normalizeMcpCatalog(catalog);

  const summary = {
    total: safeCatalog.length,
    live: 0,
    preview: 0,
    disconnected: 0,
    setupRequired: 0,
    unsupported: 0,
    unavailable: 0
  };

  for (const entry of safeCatalog) {
    switch (entry.state) {
      case "live":
        summary.live += 1;
        break;
      case "preview":
        summary.preview += 1;
        break;
      case "disconnected":
        summary.disconnected += 1;
        break;
      case "setup-required":
        summary.setupRequired += 1;
        break;
      case "unsupported":
        summary.unsupported += 1;
        break;
      case "unavailable":
      default:
        summary.unavailable += 1;
        break;
    }
  }

  const actionable =
    summary.live +
    summary.preview +
    summary.disconnected +
    summary.setupRequired +
    summary.unsupported +
    summary.unavailable;
  const availability = summary.total > 0 ? Number(((summary.live + summary.preview) / summary.total).toFixed(2)) : 0;

  return {
    ...summary,
    actionable,
    availability
  };
}

export function buildMcpCatalogSnapshot(
  catalog: unknown,
  source: McpCatalogRefreshSource = "default-fallback",
  fallback: readonly McpCatalogEntry[] = defaultMcpCatalog
): McpCatalogSnapshot {
  const providedIsArray = Array.isArray(catalog);
  const normalizedCatalog = providedIsArray ? normalizeMcpCatalogInternal(catalog) : [];
  const normalizedFallback = normalizeMcpCatalogInternal(fallback);

  if (normalizedCatalog.length > 0) {
    const resolvedSource =
      source === "provider-live" || source === "provider-preview" ? source : "default-fallback";
    return {
      source: resolvedSource,
      catalog: normalizedCatalog,
      summary: summarizeMcpCatalogWithSource(normalizedCatalog, resolvedSource)
    };
  }

  let resolvedSource: McpCatalogRefreshSource;
  if (providedIsArray) {
    resolvedSource = catalog.length === 0 ? "empty-refresh" : "default-fallback";
  } else if (normalizedFallback.length === 0) {
    resolvedSource = "unavailable";
  } else {
    resolvedSource = "default-fallback";
  }

  const safeCatalog = normalizeMcpCatalog(catalog, fallback);
  return {
    source: resolvedSource,
    catalog: safeCatalog,
    summary: summarizeMcpCatalogWithSource(safeCatalog, resolvedSource)
  };
}

export function buildMcpCatalogSnapshotFromProviderCapabilities(
  providerCapabilities: unknown,
  fallback: readonly McpCatalogEntry[] = defaultMcpCatalog
): McpCatalogSnapshot {
  const normalizedFallback = normalizeMcpCatalogInternal(fallback);
  const normalizedFallbackCatalog = normalizeMcpCatalog([], fallback);
  const { source, servers, serverCount, canRunLive } =
    normalizeMcpCatalogProviderCapabilityInput(providerCapabilities);

  if (serverCount < 0) {
    return normalizedFallback.length === 0
      ? unavailableSnapshot(fallback)
      : {
          source: "default-fallback",
          catalog: normalizedFallbackCatalog,
          summary: summarizeMcpCatalogWithSource(normalizedFallbackCatalog, "default-fallback")
        };
  }

  if (serverCount === 0) {
    return buildMcpCatalogSnapshot([], "empty-refresh", fallback);
  }

  const providerCatalog = normalizeMcpCatalogWithProviderCapabilities(fallback, {
    canRunLive,
    servers
  });

  const providerSource = servers.length > 0 ? source : normalizeRefreshSource("default-fallback");
  const safeSource = normalizeRefreshSource(providerSource);

  return {
    source: safeSource,
    catalog: servers.length > 0 ? providerCatalog : normalizedFallbackCatalog,
    summary: summarizeMcpCatalogWithSource(
      servers.length > 0 ? providerCatalog : normalizedFallbackCatalog,
      safeSource
    )
  };
}

export function snapshotFromProviderMcpCatalogPayload(
  value: unknown,
  fallback: readonly McpCatalogEntry[] = defaultMcpCatalog
): McpCatalogSnapshot {
  if (!isProviderRecord(value)) {
    return unavailableSnapshot(fallback);
  }

  const source = normalizeRefreshSource(value.source);
  if (source === "provider-live" || source === "provider-preview") {
    const providerEntries = normalizeMcpCatalogWithProviderEntries(value.entries, source, fallback);
    if (providerEntries.length > 0) {
      return {
        source,
        catalog: providerEntries,
        summary: summarizeMcpCatalogWithSource(providerEntries, source)
      };
    }

    return buildMcpCatalogSnapshotFromProviderCapabilities(
      {
        canRunLive: source === "provider-live",
        canRunPreview: true,
        source,
        servers: isRecord(value) ? value.entries : []
      },
      fallback
    );
  }

  if (source === "default-fallback" || source === "empty-refresh") {
    return buildMcpCatalogSnapshot(value.entries, source, fallback);
  }

  if (source === "unavailable") {
    return unavailableSnapshot(fallback);
  }

  return buildMcpCatalogSnapshot([], "unavailable", fallback);
}
