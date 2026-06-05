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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
