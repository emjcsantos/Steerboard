export type PluginCatalogState =
  | "live"
  | "preview"
  | "disconnected"
  | "setup-required"
  | "unsupported"
  | "unavailable";

export type PluginCatalogEntry = {
  id: string;
  label: string;
  detail: string;
  state: PluginCatalogState;
};

export type PluginCatalogSummary = {
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

export const defaultPluginCatalog: readonly PluginCatalogEntry[] = [
  {
    id: "notes-sync",
    label: "Notes Sync",
    detail: "Store and retrieve concise team notes for active workflows.",
    state: "preview"
  },
  {
    id: "task-automation",
    label: "Task Automation",
    detail: "Run lightweight automations with local approval controls.",
    state: "setup-required"
  },
  {
    id: "context-insights",
    label: "Context Insights",
    detail: "Surface optional context summaries for quicker handoffs.",
    state: "preview"
  },
  {
    id: "telemetry-export",
    label: "Telemetry Export",
    detail: "Export run metadata for manual review and sharing.",
    state: "setup-required"
  },
  {
    id: "legacy-adapter",
    label: "Legacy Adapter",
    detail: "Compatibility bridge not currently supported.",
    state: "unsupported"
  }
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPluginCatalogState(value: unknown): value is PluginCatalogState {
  return (
    value === "live" ||
    value === "preview" ||
    value === "disconnected" ||
    value === "setup-required" ||
    value === "unsupported" ||
    value === "unavailable"
  );
}

function normalizePluginId(value: unknown): string | undefined {
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

function normalizePluginLabel(value: unknown, fallbackId: string): string {
  if (typeof value !== "string" || !value.trim()) {
    return fallbackId
      .split("-")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallbackId;
}

function normalizePluginDetail(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizePluginCatalogState(value: unknown): PluginCatalogState {
  return isPluginCatalogState(value) ? value : "unavailable";
}

function normalizePluginCatalogEntry(raw: unknown): PluginCatalogEntry | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }

  const id = normalizePluginId(raw.id);
  if (!id) {
    return undefined;
  }

  const state = normalizePluginCatalogState(raw.state);
  const detail = normalizePluginDetail(raw.detail);
  const label = normalizePluginLabel(raw.label, id);

  return {
    id,
    label,
    detail,
    state
  };
}

function normalizePluginCatalogInternal(value: unknown): PluginCatalogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries = value.map(normalizePluginCatalogEntry).filter((entry): entry is PluginCatalogEntry => {
    return entry !== undefined;
  });

  const deduped: PluginCatalogEntry[] = [];
  for (const entry of entries) {
    const isDuplicate = deduped.some((item) => item.id === entry.id);
    if (!isDuplicate) {
      deduped.push(entry);
    }
  }

  return deduped;
}

export function normalizePluginCatalog(
  value: unknown,
  fallback: readonly PluginCatalogEntry[] = defaultPluginCatalog
): PluginCatalogEntry[] {
  const normalized = normalizePluginCatalogInternal(value);
  if (normalized.length > 0) {
    return normalized;
  }

  const fallbackCatalog = normalizePluginCatalogInternal(fallback);
  if (fallbackCatalog.length > 0) {
    return fallbackCatalog;
  }

  return [...defaultPluginCatalog];
}

export function summarizePluginCatalog(
  catalog: unknown = defaultPluginCatalog
): PluginCatalogSummary {
  const safeCatalog = normalizePluginCatalog(catalog);

  const summary = {
    total: safeCatalog.length,
    live: 0,
    preview: 0,
    disconnected: 0,
    setupRequired: 0,
    unsupported: 0,
    unavailable: 0
  };

  for (const plugin of safeCatalog) {
    switch (plugin.state) {
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
  const availability =
    summary.total > 0
      ? Number(((summary.live + summary.preview) / summary.total).toFixed(2))
      : 0;

  return {
    ...summary,
    actionable,
    availability
  };
}
