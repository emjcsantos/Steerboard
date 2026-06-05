import {
  buildPersonalizationCatalogSnapshot,
  defaultPersonalizationCatalog,
  normalizePersonalizationCatalog,
  normalizePersonalizationCatalogEntries,
  summarizePersonalizationCatalog,
  type PersonalizationCatalogEntry,
  type PersonalizationCatalogRefreshSource,
  type PersonalizationCatalogSnapshot
} from "./personalizationCatalog";

const REFRESH_SOURCES: readonly PersonalizationCatalogRefreshSource[] = [
  "provider-live",
  "provider-preview",
  "default-fallback",
  "empty-refresh",
  "unavailable"
];

interface ProviderPersonalizationCatalogPayload {
  source?: unknown;
  entries?: unknown;
}

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function isRecord(value: unknown): value is ProviderPersonalizationCatalogPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRefreshSource(value: unknown): PersonalizationCatalogRefreshSource {
  return typeof value === "string" && (REFRESH_SOURCES as readonly string[]).includes(value)
    ? (value as PersonalizationCatalogRefreshSource)
    : "unavailable";
}

function unavailableSnapshot(
  fallback: readonly PersonalizationCatalogEntry[]
): PersonalizationCatalogSnapshot {
  const catalog = normalizePersonalizationCatalog([], fallback).map((entry) => ({
    ...entry,
    state: entry.state === "live" ? ("unavailable" as const) : entry.state
  }));

  return {
    source: "unavailable",
    catalog,
    summary: { ...summarizePersonalizationCatalog(catalog), source: "unavailable" }
  };
}

function normalizeProviderPersonalizationCatalogEntries(
  entries: unknown,
  source: PersonalizationCatalogRefreshSource,
  fallback: readonly PersonalizationCatalogEntry[]
): PersonalizationCatalogEntry[] {
  const providerEntries = normalizePersonalizationCatalogEntries(entries);
  const fallbackEntries = normalizePersonalizationCatalog(fallback);
  const normalizedSource = normalizeRefreshSource(source);

  if (providerEntries.length === 0) {
    return [];
  }

  return providerEntries.map((entry) => {
    const fallbackEntry = fallbackEntries.find((item) => item.id === entry.id);
    const state = normalizedSource === "provider-preview" && entry.state === "live"
      ? "preview"
      : entry.state;

    return {
      ...(fallbackEntry ?? entry),
      state
    };
  });
}

async function invokeProviderPersonalizationCatalogPreview(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return {
      source: "default-fallback",
      entries: defaultPersonalizationCatalog
    };
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_personalization_catalog_preview");
}

export function snapshotFromProviderPersonalizationCatalogPreview(
  value: unknown,
  fallback: readonly PersonalizationCatalogEntry[] = defaultPersonalizationCatalog
): PersonalizationCatalogSnapshot {
  if (!isRecord(value)) {
    return unavailableSnapshot(fallback);
  }

  const source = normalizeRefreshSource(value.source);
  if (source === "provider-live" || source === "provider-preview") {
    const catalog = normalizeProviderPersonalizationCatalogEntries(
      value.entries,
      source,
      fallback
    );
    if (catalog.length > 0) {
      return {
        source,
        catalog,
        summary: { ...summarizePersonalizationCatalog(catalog), source }
      };
    }

    return buildPersonalizationCatalogSnapshot([], "empty-refresh", fallback);
  }

  if (source === "default-fallback" || source === "empty-refresh") {
    return buildPersonalizationCatalogSnapshot(value.entries, source, fallback);
  }

  if (source === "unavailable") {
    return unavailableSnapshot(fallback);
  }

  return buildPersonalizationCatalogSnapshot([], "unavailable", fallback);
}

export async function loadProviderPersonalizationCatalogSnapshot(
  invokePreview: () => Promise<unknown> = invokeProviderPersonalizationCatalogPreview,
  fallback: readonly PersonalizationCatalogEntry[] = defaultPersonalizationCatalog
): Promise<PersonalizationCatalogSnapshot> {
  try {
    if (!hasTauriRuntime() && invokePreview === invokeProviderPersonalizationCatalogPreview) {
      return buildPersonalizationCatalogSnapshot(fallback, "default-fallback", fallback);
    }

    return snapshotFromProviderPersonalizationCatalogPreview(await invokePreview(), fallback);
  } catch {
    return unavailableSnapshot(fallback);
  }
}
