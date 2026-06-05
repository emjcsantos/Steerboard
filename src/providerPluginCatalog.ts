import {
  buildPluginCatalogSnapshot,
  defaultPluginCatalog,
  snapshotFromProviderPluginCatalogPayload,
  type PluginCatalogEntry,
  type PluginCatalogSnapshot
} from "./pluginCatalog";

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invokeProviderPluginCatalogPreview(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return {
      source: "default-fallback",
      entries: defaultPluginCatalog
    };
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_plugin_catalog_preview");
}

export function snapshotFromProviderPluginCatalogPreview(
  value: unknown,
  fallback: readonly PluginCatalogEntry[] = defaultPluginCatalog
): PluginCatalogSnapshot {
  return snapshotFromProviderPluginCatalogPayload(value, fallback);
}

export async function loadProviderPluginCatalogSnapshot(
  invokePreview: () => Promise<unknown> = invokeProviderPluginCatalogPreview,
  fallback: readonly PluginCatalogEntry[] = defaultPluginCatalog
): Promise<PluginCatalogSnapshot> {
  try {
    if (!hasTauriRuntime() && invokePreview === invokeProviderPluginCatalogPreview) {
      return buildPluginCatalogSnapshot(fallback, "default-fallback", fallback);
    }

    return snapshotFromProviderPluginCatalogPreview(await invokePreview(), fallback);
  } catch {
    return snapshotFromProviderPluginCatalogPayload(
      {
        source: "unavailable",
        entries: []
      },
      fallback
    );
  }
}
