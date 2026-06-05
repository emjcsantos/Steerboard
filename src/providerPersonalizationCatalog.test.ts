import { describe, expect, it } from "vitest";
import {
  loadProviderPersonalizationCatalogSnapshot,
  snapshotFromProviderPersonalizationCatalogPreview
} from "./providerPersonalizationCatalog";
import type { PersonalizationCatalogEntry } from "./personalizationCatalog";

const fallbackCatalog: PersonalizationCatalogEntry[] = [
  {
    id: "layout-memory",
    label: "Layout Memory",
    layer: "memory",
    source: "builtin",
    privacyPosture: "device-only",
    state: "live",
    detail: "Fallback memory check."
  },
  {
    id: "assistant-routing",
    label: "Assistant Routing",
    layer: "assist",
    source: "automation",
    privacyPosture: "consent-based-sync",
    state: "preview"
  }
];

describe("provider personalization catalog bridge", () => {
  it("uses browser fallback without invoking desktop APIs", async () => {
    const snapshot = await loadProviderPersonalizationCatalogSnapshot(undefined, fallbackCatalog);

    expect(snapshot.source).toBe("default-fallback");
    expect(snapshot.catalog).toEqual(fallbackCatalog);
  });

  it("builds provider-live snapshot from safe payload rows", () => {
    const snapshot = snapshotFromProviderPersonalizationCatalogPreview(
      {
        source: "provider-live",
        entries: [
          {
            id: "layout-memory",
            state: "live",
            layer: "memory",
            source: "builtin",
            privacyPosture: "device-only",
            detail: "Live row from provider"
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-live");
    expect(snapshot.catalog).toEqual([
      {
        id: "layout-memory",
        label: "Layout Memory",
        layer: "memory",
        source: "builtin",
        privacyPosture: "device-only",
        state: "live",
        detail: "Fallback memory check."
      }
    ]);
  });

  it("downgrades provider-live rows to preview when source is preview-only", () => {
    const snapshot = snapshotFromProviderPersonalizationCatalogPreview(
      {
        source: "provider-preview",
        entries: [
          {
            id: "layout-memory",
            state: "live",
            layer: "memory",
            source: "builtin",
            privacyPosture: "device-only"
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-preview");
    expect(snapshot.catalog[0]?.state).toBe("preview");
  });

  it("repairs malformed payload rows and keeps provider-only rows", () => {
    const snapshot = snapshotFromProviderPersonalizationCatalogPreview(
      {
        source: "provider-live",
        entries: [
          {
            id: "layout-memory",
            state: "not-a-state",
            layer: "bad-layer",
            source: "bad-source",
            privacyPosture: "bad-privacy",
            detail: ""
          },
          {
            id: "provider-only-flow",
            label: "Provider Only Flow",
            state: "preview",
            detail: ""
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.catalog).toEqual([
      {
        id: "layout-memory",
        label: "Layout Memory",
        layer: "memory",
        source: "builtin",
        privacyPosture: "device-only",
        state: "unavailable",
        detail: "Fallback memory check."
      },
      {
        id: "provider-only-flow",
        label: "Provider Only Flow",
        layer: "ui",
        source: "builtin",
        privacyPosture: "device-only",
        state: "preview"
      }
    ]);
  });

  it("returns empty-refresh when provider sends no rows", async () => {
    const snapshot = await loadProviderPersonalizationCatalogSnapshot(
      async () => ({
        source: "empty-refresh",
        entries: []
      }),
      fallbackCatalog
    );

    expect(snapshot.source).toBe("empty-refresh");
    expect(snapshot.catalog).toEqual(fallbackCatalog);
  });

  it("returns unavailable snapshot when source is unavailable", async () => {
    const snapshot = await loadProviderPersonalizationCatalogSnapshot(
      async () => ({
        source: "unavailable",
        entries: []
      }),
      fallbackCatalog
    );

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "layout-memory")?.state).toBe("unavailable");
  });

  it("returns unavailable snapshot when desktop payload is malformed", async () => {
    const snapshot = await loadProviderPersonalizationCatalogSnapshot(
      async () => "not-a-payload",
      fallbackCatalog
    );

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "layout-memory")?.state).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "assistant-routing")?.state).toBe("preview");
  });
});
