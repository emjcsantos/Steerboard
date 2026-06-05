import {
  buildMcpCatalogSnapshot,
  defaultMcpCatalog,
  snapshotFromProviderMcpCatalogPayload,
  type McpCatalogEntry,
  type McpCatalogSnapshot
} from "./mcpCatalog";

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invokeProviderMcpCatalogPreview(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return {
      source: "default-fallback",
      entries: defaultMcpCatalog
    };
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_mcp_catalog_preview");
}

export function snapshotFromProviderMcpCatalogPreview(
  value: unknown,
  fallback: readonly McpCatalogEntry[] = defaultMcpCatalog
): McpCatalogSnapshot {
  return snapshotFromProviderMcpCatalogPayload(value, fallback);
}

export async function loadProviderMcpCatalogSnapshot(
  invokePreview: () => Promise<unknown> = invokeProviderMcpCatalogPreview,
  fallback: readonly McpCatalogEntry[] = defaultMcpCatalog
): Promise<McpCatalogSnapshot> {
  try {
    if (!hasTauriRuntime() && invokePreview === invokeProviderMcpCatalogPreview) {
      return buildMcpCatalogSnapshot(fallback, "default-fallback", fallback);
    }

    return snapshotFromProviderMcpCatalogPreview(await invokePreview(), fallback);
  } catch {
    return snapshotFromProviderMcpCatalogPayload(
      {
        source: "unavailable",
        entries: []
      },
      fallback
    );
  }
}
