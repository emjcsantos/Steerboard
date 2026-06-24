import type { CodexProtocolLedgerEntry } from "./codexSession";
import type { McpCatalogEntry, McpCatalogState, McpCatalogToolPolicy, McpCatalogTransport } from "./mcpCatalog";

export type McpManagerTransport = "stdio" | "sse" | "http";
export type McpManagerAuthState = "none" | "oauth-ready" | "oauth-required" | "token-present" | "missing" | "unsupported";
export type McpManagerProbeState = "not-run" | "ready" | "blocked" | "failed" | "unsupported";

export interface McpManagerServerDefinition {
  id: string;
  label: string;
  transport: McpManagerTransport;
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  oauth?: {
    enabled?: boolean;
    connected?: boolean;
  };
  tools?: string[];
  enabled?: boolean;
}

export interface McpManagerServerRow {
  id: string;
  label: string;
  transport: McpManagerTransport | "unsupported";
  status: McpCatalogState;
  setupState: "ready" | "missing-fields" | "disabled" | "unsupported";
  authState: McpManagerAuthState;
  probeState: McpManagerProbeState;
  toolCount: number;
  toolNames: string[];
  requiredFields: string[];
  detail: string;
}

export interface McpManagerState {
  projectId: string;
  servers: McpManagerServerRow[];
  catalogEntries: McpCatalogEntry[];
  updatedAt: string;
}

export interface McpManagerProbeResult {
  serverId: string;
  state: McpManagerProbeState;
  status: McpCatalogState;
  detail: string;
}

const SECRET_PATTERN = /(token|secret|api[-_]?key|authorization|bearer|password)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeId(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function safeText(value: unknown, fallback: string, maxLength = 160): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  const words = value.trim().split(/\s+/).map((word) => (SECRET_PATTERN.test(word) ? "[redacted]" : word));
  return words.join(" ").slice(0, maxLength);
}

function normalizeTransport(value: unknown): McpManagerTransport | "unsupported" {
  return value === "stdio" || value === "sse" || value === "http" ? value : "unsupported";
}

function normalizeArgs(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => safeText(item, "arg", 80))
    : [];
}

function normalizeTools(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => safeText(item, "tool", 80))))
    : [];
}

function hasTokenLikeValue(value: unknown): boolean {
  if (typeof value === "string") {
    return SECRET_PATTERN.test(value);
  }
  if (Array.isArray(value)) {
    return value.some(hasTokenLikeValue);
  }
  if (isRecord(value)) {
    return Object.entries(value).some(([key, item]) => SECRET_PATTERN.test(key) || hasTokenLikeValue(item));
  }
  return false;
}

function requiredFieldsForTransport(transport: McpManagerTransport | "unsupported"): string[] {
  switch (transport) {
    case "stdio":
      return ["command"];
    case "sse":
    case "http":
      return ["url"];
    default:
      return [];
  }
}

function missingFields(raw: Record<string, unknown>, transport: McpManagerTransport | "unsupported"): string[] {
  return requiredFieldsForTransport(transport).filter((field) => {
    const value = raw[field];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

function authState(raw: Record<string, unknown>, transport: McpManagerTransport | "unsupported"): McpManagerAuthState {
  if (transport === "unsupported") {
    return "unsupported";
  }
  const oauth = isRecord(raw.oauth) ? raw.oauth : {};
  if (oauth.enabled === true) {
    return oauth.connected === true ? "oauth-ready" : "oauth-required";
  }
  return hasTokenLikeValue(raw.headers) ? "token-present" : "none";
}

export function repairMcpServerDefinitions(value: unknown): McpManagerServerDefinition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  return value.flatMap<McpManagerServerDefinition>((raw, index) => {
    if (!isRecord(raw)) {
      return [];
    }
    const id = safeId(raw.id, `mcp-server-${index + 1}`);
    if (seen.has(id)) {
      return [];
    }
    seen.add(id);
    const transport = normalizeTransport(raw.transport);
    if (transport === "unsupported") {
      return [{
        id,
        label: safeText(raw.label, id),
        transport: "http",
        enabled: false,
        tools: normalizeTools(raw.tools)
      }];
    }

    return [{
      id,
      label: safeText(raw.label, id),
      transport,
      command: transport === "stdio" ? safeText(raw.command, "", 120) : undefined,
      args: normalizeArgs(raw.args),
      url: transport === "http" || transport === "sse" ? safeText(raw.url, "", 180) : undefined,
      oauth: isRecord(raw.oauth)
        ? {
            enabled: raw.oauth.enabled === true,
            connected: raw.oauth.connected === true
          }
        : undefined,
      tools: normalizeTools(raw.tools),
      enabled: raw.enabled !== false
    }];
  });
}

export function buildMcpManagerRows(definitions: unknown): McpManagerServerRow[] {
  const rawDefinitions = Array.isArray(definitions) ? definitions : [];
  const repaired = repairMcpServerDefinitions(rawDefinitions);
  const rawById = new Map(
    rawDefinitions.filter(isRecord).map((raw, index) => [safeId(raw.id, `mcp-server-${index + 1}`), raw])
  );

  return repaired.map((server) => {
    const raw = rawById.get(server.id) ?? {};
    const transport = normalizeTransport(raw.transport ?? server.transport);
    const missing = missingFields(raw, transport);
    const setupState =
      transport === "unsupported"
        ? "unsupported"
        : server.enabled === false
          ? "disabled"
          : missing.length > 0
            ? "missing-fields"
            : "ready";
    const status: McpCatalogState =
      setupState === "ready"
        ? "preview"
        : setupState === "missing-fields"
          ? "setup-required"
          : setupState === "disabled"
            ? "disconnected"
            : "unsupported";
    const tools = server.tools ?? [];
    const rowTransport = transport === "unsupported" ? "unsupported" : server.transport;

    return {
      id: server.id,
      label: server.label,
      transport: rowTransport,
      status,
      setupState,
      authState: authState(raw, transport),
      probeState: "not-run",
      toolCount: tools.length,
      toolNames: tools,
      requiredFields: missing,
      detail:
        setupState === "ready"
          ? `${server.label} is configured for ${rowTransport}.`
          : setupState === "missing-fields"
            ? `${server.label} is missing ${missing.join(", ")}.`
            : setupState === "disabled"
              ? `${server.label} is disabled.`
              : `${server.label} uses an unsupported transport.`
    };
  });
}

export function probeMcpManagerServer(row: McpManagerServerRow): McpManagerProbeResult {
  if (row.transport === "unsupported" || row.setupState === "unsupported") {
    return {
      serverId: row.id,
      state: "unsupported",
      status: "unsupported",
      detail: "Unsupported transport cannot be probed."
    };
  }
  if (row.setupState === "missing-fields") {
    return {
      serverId: row.id,
      state: "blocked",
      status: "setup-required",
      detail: `Probe blocked until ${row.requiredFields.join(", ")} is configured.`
    };
  }
  if (row.setupState === "disabled") {
    return {
      serverId: row.id,
      state: "blocked",
      status: "disconnected",
      detail: "Probe blocked because the server is disabled."
    };
  }
  return {
    serverId: row.id,
    state: "ready",
    status: "preview",
    detail: `Probe ready for ${row.label}; no MCP tool was invoked.`
  };
}

export function applyMcpManagerProbe(rows: readonly McpManagerServerRow[], serverId: string): McpManagerServerRow[] {
  return rows.map((row) => {
    if (row.id !== serverId) {
      return row;
    }
    const result = probeMcpManagerServer(row);
    return {
      ...row,
      probeState: result.state,
      status: result.status,
      detail: result.detail
    };
  });
}

export function buildMcpManagerState(
  projectId: string,
  definitions: unknown,
  now = new Date().toISOString()
): McpManagerState {
  const rows = buildMcpManagerRows(definitions);
  return {
    projectId,
    servers: rows,
    catalogEntries: rows.map((row): McpCatalogEntry => ({
      id: row.id,
      label: row.label,
      transport: row.transport === "unsupported" ? "unknown" : row.transport,
      state: row.status,
      toolPolicy: row.setupState === "ready" ? "approval-required" : ("disabled" as McpCatalogToolPolicy),
      detail: row.detail
    })),
    updatedAt: now
  };
}

export function linkMcpToolCallToServer(
  entry: CodexProtocolLedgerEntry,
  rows: readonly McpManagerServerRow[]
): McpManagerServerRow | undefined {
  if (entry.kind !== "mcp_call") {
    return undefined;
  }
  const haystack = `${entry.title ?? ""} ${entry.detail ?? ""} ${entry.itemType ?? ""}`.toLowerCase();
  return rows.find((row) => haystack.includes(row.id.toLowerCase()) || haystack.includes(row.label.toLowerCase()));
}
