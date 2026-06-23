import {
  buildAutomationCatalogSnapshot,
  defaultAutomationCatalog,
  normalizeAutomationCatalogEntries,
  normalizeAutomationCatalog,
  summarizeAutomationCatalog,
  type AutomationCatalogEntry,
  type AutomationCatalogRefreshSource,
  type AutomationCatalogSnapshot
} from "./automationCatalog";
import { hasTauriRuntime } from "./tauriRuntime";

const REFRESH_SOURCES: readonly AutomationCatalogRefreshSource[] = [
  "provider-live",
  "provider-preview",
  "default-fallback",
  "empty-refresh",
  "unavailable"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRefreshSource(value: unknown): AutomationCatalogRefreshSource {
  return typeof value === "string" && (REFRESH_SOURCES as readonly string[]).includes(value)
    ? (value as AutomationCatalogRefreshSource)
    : "unavailable";
}

function unavailableSnapshot(
  fallback: readonly AutomationCatalogEntry[]
): AutomationCatalogSnapshot {
  const catalog = normalizeAutomationCatalog([], fallback).map((entry) => ({
    ...entry,
    state: entry.state === "live" ? ("unavailable" as const) : entry.state
  }));

  return {
    source: "unavailable",
    catalog,
    summary: { ...summarizeAutomationCatalog(catalog), source: "unavailable" }
  };
}

function normalizeProviderAutomationCatalogEntries(
  entries: unknown,
  source: AutomationCatalogRefreshSource,
  fallback: readonly AutomationCatalogEntry[]
): AutomationCatalogEntry[] {
  const providerEntries = normalizeAutomationCatalogEntries(entries);
  const fallbackEntries = normalizeAutomationCatalog(fallback);
  const normalizedSource = normalizeRefreshSource(source);

  if (providerEntries.length === 0) {
    return [];
  }

  return providerEntries.map((entry) => {
    const fallbackMatch = fallbackEntries.find((item) => item.id === entry.id);
    const state =
      normalizedSource === "provider-preview" && entry.state === "live" ? "preview" : entry.state;

    return {
      ...(fallbackMatch ?? entry),
      state
    };
  });
}

async function invokeProviderAutomationCatalogPreview(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return {
      source: "default-fallback",
      entries: defaultAutomationCatalog
    };
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_automation_catalog_preview");
}

export function snapshotFromProviderAutomationCatalogPreview(
  value: unknown,
  fallback: readonly AutomationCatalogEntry[] = defaultAutomationCatalog
): AutomationCatalogSnapshot {
  if (!isRecord(value)) {
    return unavailableSnapshot(fallback);
  }

  const source = normalizeRefreshSource(value.source);
  if (source === "provider-live" || source === "provider-preview") {
    const catalog = normalizeProviderAutomationCatalogEntries(
      value.entries,
      source,
      fallback
    );
    if (catalog.length > 0) {
      return {
        source,
        catalog,
        summary: { ...summarizeAutomationCatalog(catalog), source }
      };
    }

    return buildAutomationCatalogSnapshot([], "empty-refresh", fallback);
  }

  if (source === "default-fallback" || source === "empty-refresh") {
    return buildAutomationCatalogSnapshot(value.entries, source, fallback);
  }

  if (source === "unavailable") {
    return unavailableSnapshot(fallback);
  }

  return buildAutomationCatalogSnapshot([], "unavailable", fallback);
}

export async function loadProviderAutomationCatalogSnapshot(
  invokePreview: () => Promise<unknown> = invokeProviderAutomationCatalogPreview,
  fallback: readonly AutomationCatalogEntry[] = defaultAutomationCatalog
): Promise<AutomationCatalogSnapshot> {
  try {
    if (!hasTauriRuntime() && invokePreview === invokeProviderAutomationCatalogPreview) {
      return buildAutomationCatalogSnapshot(fallback, "default-fallback", fallback);
    }

    return snapshotFromProviderAutomationCatalogPreview(await invokePreview(), fallback);
  } catch {
    return unavailableSnapshot(fallback);
  }
}
