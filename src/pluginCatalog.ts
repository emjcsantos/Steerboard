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

export type PluginCatalogRefreshSource =
  | "provider-live"
  | "provider-preview"
  | "default-fallback"
  | "empty-refresh"
  | "unavailable";

export type PluginCatalogProviderCapabilityState = PluginCatalogState;

export interface PluginCatalogSnapshotSummary extends Omit<PluginCatalogSummary, "availability"> {
  source: PluginCatalogRefreshSource;
  availability: number;
}

export interface PluginCatalogSnapshot {
  source: PluginCatalogRefreshSource;
  catalog: readonly PluginCatalogEntry[];
  summary: PluginCatalogSnapshotSummary;
}

export interface PluginCatalogProviderCapabilityPlugin {
  id: string;
  state: PluginCatalogProviderCapabilityState;
}

export interface PluginCatalogProviderCapabilityInput {
  canRunLive: boolean;
  canRunPreview: boolean;
  plugins: unknown[];
  source: PluginCatalogRefreshSource;
}

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

const REFRESH_SOURCES: readonly PluginCatalogRefreshSource[] = [
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

function summarizePluginCatalogWithSource(
  catalog: unknown,
  source: PluginCatalogRefreshSource
): PluginCatalogSnapshotSummary {
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
    availability,
    source
  };
}

function normalizeRefreshSource(value: unknown): PluginCatalogRefreshSource {
  return typeof value === "string" && (REFRESH_SOURCES as readonly string[]).includes(value)
    ? (value as PluginCatalogRefreshSource)
    : "unavailable";
}

function isPluginCatalogProviderCapabilityState(
  value: unknown
): value is PluginCatalogProviderCapabilityState {
  return isPluginCatalogState(value);
}

function isPluginCatalogProviderCapabilityInput(
  value: unknown
): value is PluginCatalogProviderCapabilityInput {
  return (
    isProviderRecord(value) &&
    typeof value.canRunLive === "boolean" &&
    typeof value.canRunPreview === "boolean" &&
    Array.isArray(value.plugins)
  );
}

function coerceProviderCapabilityPlugin(
  value: unknown
): PluginCatalogProviderCapabilityPlugin | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = normalizePluginId(value.id);
  if (!id) {
    return undefined;
  }

  if (!isPluginCatalogProviderCapabilityState(value.state)) {
    return undefined;
  }

  return { id, state: value.state };
}

function normalizePluginCatalogProviderCapabilityInput(
  value: unknown
): {
  source: PluginCatalogRefreshSource;
  plugins: PluginCatalogProviderCapabilityPlugin[];
  pluginCount: number;
  canRunLive: boolean;
} {
  const raw = isPluginCatalogProviderCapabilityInput(value) ? value : undefined;

  if (!raw) {
    return {
      source: "default-fallback",
      plugins: [],
      pluginCount: -1,
      canRunLive: false
    };
  }

  return {
    source: raw.canRunLive
      ? "provider-live"
      : raw.canRunPreview
        ? "provider-preview"
        : "default-fallback",
    plugins: raw.plugins
      .map(coerceProviderCapabilityPlugin)
      .filter((item): item is PluginCatalogProviderCapabilityPlugin => item !== undefined),
    pluginCount: raw.plugins.length,
    canRunLive: raw.canRunLive
  };
}

function normalizePluginCatalogWithProviderCapabilities(
  catalog: unknown,
  providerCapabilities: {
    canRunLive: boolean;
    plugins: PluginCatalogProviderCapabilityPlugin[];
  }
): PluginCatalogEntry[] {
  const fallbackCatalog = normalizePluginCatalog(catalog);
  const byPlugin = new Map<string, PluginCatalogProviderCapabilityState>(
    providerCapabilities.plugins.map((item) => [item.id, item.state])
  );

  return fallbackCatalog.map((entry) => {
    const override = byPlugin.get(entry.id);
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

function normalizePluginCatalogWithProviderEntries(
  entries: unknown,
  source: PluginCatalogRefreshSource,
  fallback: readonly PluginCatalogEntry[]
): PluginCatalogEntry[] {
  const providerEntries = normalizePluginCatalogInternal(entries);
  const fallbackEntries = normalizePluginCatalogInternal(fallback);

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
  fallback: readonly PluginCatalogEntry[]
): PluginCatalogSnapshot {
  const catalog = normalizePluginCatalog([], fallback).map((entry) => ({
    ...entry,
    state: entry.state === "live" ? ("unavailable" as const) : entry.state
  }));

  return {
    source: "unavailable",
    catalog,
    summary: summarizePluginCatalogWithSource(catalog, "unavailable")
  };
}

export function buildPluginCatalogSnapshot(
  catalog: unknown,
  source: PluginCatalogRefreshSource = "default-fallback",
  fallback: readonly PluginCatalogEntry[] = defaultPluginCatalog
): PluginCatalogSnapshot {
  const providedIsArray = Array.isArray(catalog);
  const normalizedCatalog = providedIsArray ? normalizePluginCatalogInternal(catalog) : [];
  const normalizedFallback = normalizePluginCatalogInternal(fallback);

  if (normalizedCatalog.length > 0) {
    const resolvedSource =
      source === "provider-live" || source === "provider-preview" ? source : "default-fallback";
    return {
      source: resolvedSource,
      catalog: normalizedCatalog,
      summary: summarizePluginCatalogWithSource(normalizedCatalog, resolvedSource)
    };
  }

  let resolvedSource: PluginCatalogRefreshSource;
  if (providedIsArray) {
    resolvedSource = catalog.length === 0 ? "empty-refresh" : "default-fallback";
  } else if (normalizedFallback.length === 0) {
    resolvedSource = "unavailable";
  } else {
    resolvedSource = "default-fallback";
  }

  const safeCatalog = normalizePluginCatalog(catalog, fallback);
  return {
    source: resolvedSource,
    catalog: safeCatalog,
    summary: summarizePluginCatalogWithSource(safeCatalog, resolvedSource)
  };
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

export function buildPluginCatalogSnapshotFromProviderCapabilities(
  providerCapabilities: unknown,
  fallback: readonly PluginCatalogEntry[] = defaultPluginCatalog
): PluginCatalogSnapshot {
  const normalizedFallback = normalizePluginCatalogInternal(fallback);
  const normalizedFallbackCatalog = normalizePluginCatalog([], fallback);
  const { source, plugins, pluginCount, canRunLive } =
    normalizePluginCatalogProviderCapabilityInput(providerCapabilities);

  if (pluginCount < 0) {
    return normalizedFallback.length === 0
      ? unavailableSnapshot(fallback)
      : {
          source: "default-fallback",
          catalog: normalizedFallbackCatalog,
          summary: summarizePluginCatalogWithSource(normalizedFallbackCatalog, "default-fallback")
        };
  }

  if (pluginCount === 0) {
    return buildPluginCatalogSnapshot([], "empty-refresh", fallback);
  }

  const providerCatalog = normalizePluginCatalogWithProviderCapabilities(fallback, {
    canRunLive,
    plugins
  });

  const providerSource = plugins.length > 0 ? source : normalizeRefreshSource("default-fallback");
  const safeSource = normalizeRefreshSource(providerSource);

  return {
    source: safeSource,
    catalog: plugins.length > 0 ? providerCatalog : normalizedFallbackCatalog,
    summary: summarizePluginCatalogWithSource(
      plugins.length > 0 ? providerCatalog : normalizedFallbackCatalog,
      safeSource
    )
  };
}

export function snapshotFromProviderPluginCatalogPayload(
  value: unknown,
  fallback: readonly PluginCatalogEntry[] = defaultPluginCatalog
): PluginCatalogSnapshot {
  if (!isProviderRecord(value)) {
    return unavailableSnapshot(fallback);
  }

  const source = normalizeRefreshSource(value.source);
  if (source === "provider-live" || source === "provider-preview") {
    const providerEntries = normalizePluginCatalogWithProviderEntries(
      value.entries,
      source,
      fallback
    );
    if (providerEntries.length > 0) {
      return {
        source,
        catalog: providerEntries,
        summary: summarizePluginCatalogWithSource(providerEntries, source)
      };
    }

    return buildPluginCatalogSnapshotFromProviderCapabilities(
      {
        canRunLive: source === "provider-live",
        canRunPreview: true,
        source,
        plugins: isRecord(value) ? value.entries : []
      },
      fallback
    );
  }

  if (source === "default-fallback" || source === "empty-refresh") {
    return buildPluginCatalogSnapshot(value.entries, source, fallback);
  }

  if (source === "unavailable") {
    return unavailableSnapshot(fallback);
  }

  return buildPluginCatalogSnapshot([], "unavailable", fallback);
}
