import {
  buildCommandCatalogSnapshot,
  buildCommandCatalogSnapshotFromProviderCapabilities,
  defaultCommandCatalog,
  normalizeCommandCatalog,
  summarizeCommandCatalog,
  type CommandCatalogEntry,
  type CommandCatalogRefreshSource,
  type CommandCatalogSnapshot
} from "./commandCatalog";
import { hasTauriRuntime } from "./tauriRuntime";

interface ProviderCommandCatalogPreviewPayload {
  source?: unknown;
  entries?: unknown;
}

const REFRESH_SOURCES: readonly CommandCatalogRefreshSource[] = [
  "provider-live",
  "provider-preview",
  "default-fallback",
  "empty-refresh",
  "unavailable"
];

function isRecord(value: unknown): value is ProviderCommandCatalogPreviewPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRefreshSource(value: unknown): CommandCatalogRefreshSource {
  return typeof value === "string" &&
    (REFRESH_SOURCES as readonly string[]).includes(value)
    ? (value as CommandCatalogRefreshSource)
    : "unavailable";
}

function unavailableSnapshot(
  fallback: readonly CommandCatalogEntry[]
): CommandCatalogSnapshot {
  const catalog = normalizeCommandCatalog([], fallback).map((entry) => ({
    ...entry,
    state: entry.state === "live" ? "unavailable" as const : entry.state
  }));
  return {
    source: "unavailable",
    catalog,
    summary: summarizeCommandCatalog(catalog, "unavailable")
  };
}

async function invokeProviderCommandCatalogPreview(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return {
      source: "default-fallback",
      entries: defaultCommandCatalog
    };
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_command_catalog_preview");
}

export function snapshotFromProviderCommandCatalogPreview(
  value: unknown,
  fallback: readonly CommandCatalogEntry[] = defaultCommandCatalog
): CommandCatalogSnapshot {
  if (!isRecord(value)) {
    return unavailableSnapshot(fallback);
  }

  const source = normalizeRefreshSource(value.source);
  if (source === "provider-live" || source === "provider-preview") {
    return buildCommandCatalogSnapshotFromProviderCapabilities(
      {
        canRunLive: source === "provider-live",
        canRunPreview: true,
        commands: value.entries
      },
      fallback
    );
  }

  if (source === "unavailable") {
    return unavailableSnapshot(fallback);
  }

  return buildCommandCatalogSnapshot(
    value.entries,
    source,
    fallback
  );
}

export async function loadProviderCommandCatalogSnapshot(
  invokePreview: () => Promise<unknown> = invokeProviderCommandCatalogPreview,
  fallback: readonly CommandCatalogEntry[] = defaultCommandCatalog
): Promise<CommandCatalogSnapshot> {
  try {
    if (!hasTauriRuntime() && invokePreview === invokeProviderCommandCatalogPreview) {
      return buildCommandCatalogSnapshot(fallback, "default-fallback", fallback);
    }

    return snapshotFromProviderCommandCatalogPreview(await invokePreview(), fallback);
  } catch {
    return unavailableSnapshot(fallback);
  }
}
