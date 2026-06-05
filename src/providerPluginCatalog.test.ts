import { describe, expect, it } from "vitest";
import {
  loadProviderPluginCatalogSnapshot,
  snapshotFromProviderPluginCatalogPreview
} from "./providerPluginCatalog";
import type { PluginCatalogEntry } from "./pluginCatalog";

const fallbackCatalog: PluginCatalogEntry[] = [
  {
    id: "notes-sync",
    label: "Notes Sync",
    detail: "Fallback plugin detail.",
    state: "live"
  },
  {
    id: "context-insights",
    label: "Context Insights",
    detail: "Preview fallback.",
    state: "preview"
  }
];

describe("provider plugin catalog bridge", () => {
  it("uses browser fallback without invoking desktop APIs", async () => {
    const snapshot = await loadProviderPluginCatalogSnapshot(undefined, fallbackCatalog);

    expect(snapshot.source).toBe("default-fallback");
    expect(snapshot.catalog).toEqual(fallbackCatalog);
  });

  it("builds provider-live snapshot from safe plugin preview rows", () => {
    const snapshot = snapshotFromProviderPluginCatalogPreview(
      {
        source: "provider-live",
        entries: [
          {
            id: "provider-local-plugins",
            label: "Local Plugins",
            detail: "4 metadata-visible plugin entries were detected.",
            state: "live"
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-live");
    expect(snapshot.catalog).toHaveLength(1);
    expect(snapshot.catalog[0]).toMatchObject({
      id: "provider-local-plugins",
      state: "live"
    });
  });

  it("downgrades provider-live rows to preview when provider source is preview-only", () => {
    const snapshot = snapshotFromProviderPluginCatalogPreview(
      {
        source: "provider-preview",
        entries: [
          {
            id: "provider-local-plugins",
            label: "Local Plugins",
            detail: "Detected from metadata.",
            state: "live"
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-preview");
    expect(snapshot.catalog[0]?.state).toBe("preview");
  });

  it("returns empty-refresh fallback when desktop refresh returns no rows", async () => {
    const snapshot = await loadProviderPluginCatalogSnapshot(
      async () => ({
        source: "empty-refresh",
        entries: []
      }),
      fallbackCatalog
    );

    expect(snapshot.source).toBe("empty-refresh");
    expect(snapshot.catalog).toEqual(fallbackCatalog);
  });

  it("returns unavailable snapshot when desktop refresh reports unavailable", async () => {
    const snapshot = await loadProviderPluginCatalogSnapshot(
      async () => ({
        source: "unavailable",
        entries: []
      }),
      fallbackCatalog
    );

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "notes-sync")?.state).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "context-insights")?.state).toBe(
      "preview"
    );
  });

  it("returns unavailable snapshot when desktop refresh returns malformed payload", async () => {
    const snapshot = await loadProviderPluginCatalogSnapshot(async () => "not-a-payload", fallbackCatalog);

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "notes-sync")?.state).toBe("unavailable");
  });

  it("keeps provider-only rows from live provider payloads", () => {
    const snapshot = snapshotFromProviderPluginCatalogPreview(
      {
        source: "provider-live",
        entries: [
          {
            id: "provider-only-plugin",
            label: "Provider Only Plugin",
            detail: "Only reported by the provider.",
            state: "preview"
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.catalog).toEqual([
      {
        id: "provider-only-plugin",
        label: "Provider Only Plugin",
        detail: "Only reported by the provider.",
        state: "preview"
      }
    ]);
  });

  it("returns unavailable snapshot when desktop refresh fails", async () => {
    const snapshot = await loadProviderPluginCatalogSnapshot(async () => {
      throw new Error("desktop plugin refresh unavailable");
    }, fallbackCatalog);

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "notes-sync")?.state).toBe("unavailable");
  });
});
