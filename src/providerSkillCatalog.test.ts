import { describe, expect, it } from "vitest";
import {
  loadProviderSkillCatalogSnapshot,
  snapshotFromProviderSkillCatalogPreview
} from "./providerSkillCatalog";
import type { SkillCatalogEntry } from "./skillCatalog";

const fallbackCatalog: SkillCatalogEntry[] = [
  {
    id: "health-check",
    label: "Health Check",
    source: "automation",
    trigger: "menu",
    invocationLabel: "Check",
    state: "live",
    detail: "Fallback skill detail."
  },
  {
    id: "review-brief",
    label: "Review Brief",
    source: "extension",
    trigger: "command",
    invocationLabel: "Review",
    state: "preview"
  }
];

describe("provider skill catalog bridge", () => {
  it("uses browser fallback without invoking desktop APIs", async () => {
    const snapshot = await loadProviderSkillCatalogSnapshot(undefined, fallbackCatalog);

    expect(snapshot.source).toBe("default-fallback");
    expect(snapshot.catalog).toEqual(fallbackCatalog);
  });

  it("builds provider-live snapshot from safe skill preview rows", () => {
    const snapshot = snapshotFromProviderSkillCatalogPreview(
      {
        source: "provider-live",
        entries: [
          {
            id: "provider-local-skills",
            label: "Local Skills",
            source: "builtin",
            trigger: "command",
            invocationLabel: "Open Skills",
            state: "live",
            detail: "4 metadata-visible skill entries were detected."
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-live");
    expect(snapshot.catalog).toHaveLength(1);
    expect(snapshot.catalog[0]).toMatchObject({
      id: "provider-local-skills",
      state: "live"
    });
  });

  it("downgrades provider-live rows to preview when provider source is preview-only", () => {
    const snapshot = snapshotFromProviderSkillCatalogPreview(
      {
        source: "provider-preview",
        entries: [
          {
            id: "provider-local-skills",
            label: "Local Skills",
            source: "builtin",
            trigger: "command",
            invocationLabel: "Open Skills",
            state: "live"
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-preview");
    expect(snapshot.catalog[0]?.state).toBe("preview");
  });

  it("returns unavailable snapshot when desktop refresh reports unavailable", async () => {
    const snapshot = await loadProviderSkillCatalogSnapshot(
      async () => ({
        source: "unavailable",
        entries: []
      }),
      fallbackCatalog
    );

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "health-check")?.state).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "review-brief")?.state).toBe("preview");
  });

  it("returns unavailable snapshot when desktop refresh fails", async () => {
    const snapshot = await loadProviderSkillCatalogSnapshot(async () => {
      throw new Error("desktop skill refresh unavailable");
    }, fallbackCatalog);

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "health-check")?.state).toBe("unavailable");
  });
});
