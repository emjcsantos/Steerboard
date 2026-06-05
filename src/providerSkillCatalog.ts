import {
  buildSkillCatalogSnapshot,
  defaultSkillCatalog,
  snapshotFromProviderSkillCatalogPayload,
  type SkillCatalogEntry,
  type SkillCatalogSnapshot
} from "./skillCatalog";

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invokeProviderSkillCatalogPreview(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return {
      source: "default-fallback",
      entries: defaultSkillCatalog
    };
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_skill_catalog_preview");
}

export function snapshotFromProviderSkillCatalogPreview(
  value: unknown,
  fallback: readonly SkillCatalogEntry[] = defaultSkillCatalog
): SkillCatalogSnapshot {
  return snapshotFromProviderSkillCatalogPayload(value, fallback);
}

export async function loadProviderSkillCatalogSnapshot(
  invokePreview: () => Promise<unknown> = invokeProviderSkillCatalogPreview,
  fallback: readonly SkillCatalogEntry[] = defaultSkillCatalog
): Promise<SkillCatalogSnapshot> {
  try {
    if (!hasTauriRuntime() && invokePreview === invokeProviderSkillCatalogPreview) {
      return buildSkillCatalogSnapshot(fallback, "default-fallback", fallback);
    }

    return snapshotFromProviderSkillCatalogPreview(await invokePreview(), fallback);
  } catch {
    return snapshotFromProviderSkillCatalogPayload(
      {
        source: "unavailable",
        entries: []
      },
      fallback
    );
  }
}
