import { describe, expect, it } from "vitest";
import {
  loadProviderCommandCatalogSnapshot,
  snapshotFromProviderCommandCatalogPreview
} from "./providerCommandCatalog";
import type { CommandCatalogEntry } from "./commandCatalog";

const fallbackCatalog: CommandCatalogEntry[] = [
  {
    command: "/plan",
    label: "Plan",
    detail: "Plan current work.",
    state: "live",
    scopes: ["panel"]
  },
  {
    command: "/validate",
    label: "Validate",
    detail: "Validate current work.",
    state: "preview",
    scopes: ["panel"]
  }
];

describe("provider command catalog bridge", () => {
  it("uses browser fallback without invoking desktop APIs", async () => {
    const snapshot = await loadProviderCommandCatalogSnapshot(undefined, fallbackCatalog);

    expect(snapshot.source).toBe("default-fallback");
    expect(snapshot.catalog).toEqual(fallbackCatalog);
  });

  it("builds provider-live snapshot from safe capability entries", () => {
    const snapshot = snapshotFromProviderCommandCatalogPreview(
      {
        source: "provider-live",
        entries: [
          { command: "/plan", state: "live", detail: "ignored provider detail" },
          { command: "/validate", state: "preview" }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-live");
    expect(snapshot.catalog.find((entry) => entry.command === "/plan")).toMatchObject({
      detail: "Plan current work.",
      state: "live"
    });
  });

  it("downgrades live commands to preview when provider session is preview-only", () => {
    const snapshot = snapshotFromProviderCommandCatalogPreview(
      {
        source: "provider-preview",
        entries: [{ command: "/plan", state: "live" }]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-preview");
    expect(snapshot.catalog.find((entry) => entry.command === "/plan")?.state).toBe("preview");
  });

  it("keeps an honest unavailable source while retaining safe fallback rows", async () => {
    const snapshot = await loadProviderCommandCatalogSnapshot(
      async () => ({
        source: "unavailable",
        entries: []
      }),
      fallbackCatalog
    );

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.command === "/plan")?.state).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.command === "/validate")?.state).toBe("preview");
    expect(snapshot.summary.blocked).toBe(1);
  });

  it("returns unavailable snapshot when desktop refresh fails", async () => {
    const snapshot = await loadProviderCommandCatalogSnapshot(async () => {
      throw new Error("desktop command unavailable");
    }, fallbackCatalog);

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.command === "/plan")?.state).toBe("unavailable");
  });
});
