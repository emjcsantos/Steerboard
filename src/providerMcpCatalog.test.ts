import { describe, expect, it } from "vitest";
import {
  loadProviderMcpCatalogSnapshot,
  snapshotFromProviderMcpCatalogPreview
} from "./providerMcpCatalog";
import type { McpCatalogEntry } from "./mcpCatalog";

const fallbackCatalog: McpCatalogEntry[] = [
  {
    id: "filesystem-bridge",
    label: "Filesystem Bridge",
    transport: "stdio",
    state: "live",
    toolPolicy: "read-only",
    detail: "Fallback MCP detail."
  },
  {
    id: "research-index",
    label: "Research Index",
    transport: "http",
    state: "preview",
    toolPolicy: "read-only"
  }
];

describe("provider MCP catalog bridge", () => {
  it("uses browser fallback without invoking desktop APIs", async () => {
    const snapshot = await loadProviderMcpCatalogSnapshot(undefined, fallbackCatalog);

    expect(snapshot.source).toBe("default-fallback");
    expect(snapshot.catalog).toEqual(fallbackCatalog);
  });

  it("builds provider-live snapshot from safe MCP preview rows", () => {
    const snapshot = snapshotFromProviderMcpCatalogPreview(
      {
        source: "provider-live",
        entries: [
          {
            id: "provider-local-mcp",
            label: "Local MCP",
            transport: "stdio",
            state: "live",
            toolPolicy: "approval-required",
            detail: "2 metadata-visible MCP servers were detected."
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-live");
    expect(snapshot.catalog).toHaveLength(1);
    expect(snapshot.catalog[0]).toMatchObject({
      id: "provider-local-mcp",
      state: "live",
      transport: "stdio",
      toolPolicy: "approval-required"
    });
  });

  it("downgrades provider-live rows to preview when provider source is preview-only", () => {
    const snapshot = snapshotFromProviderMcpCatalogPreview(
      {
        source: "provider-preview",
        entries: [
          {
            id: "provider-local-mcp",
            label: "Local MCP",
            transport: "stdio",
            state: "live",
            toolPolicy: "all"
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-preview");
    expect(snapshot.catalog[0]?.state).toBe("preview");
  });

  it("keeps provider-only rows and repairs safe MCP metadata", () => {
    const snapshot = snapshotFromProviderMcpCatalogPreview(
      {
        source: "provider-live",
        entries: [
          {
            id: "provider-only-mcp",
            label: "Provider Only MCP",
            transport: "not-real",
            state: "preview",
            toolPolicy: "not-real",
            detail: "Only reported by the provider."
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.catalog).toEqual([
      {
        id: "provider-only-mcp",
        label: "Provider Only MCP",
        transport: "unknown",
        state: "preview",
        toolPolicy: "approval-required",
        detail: "Only reported by the provider."
      }
    ]);
  });

  it("returns empty-refresh fallback when desktop refresh returns no rows", async () => {
    const snapshot = await loadProviderMcpCatalogSnapshot(
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
    const snapshot = await loadProviderMcpCatalogSnapshot(
      async () => ({
        source: "unavailable",
        entries: []
      }),
      fallbackCatalog
    );

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "filesystem-bridge")?.state).toBe(
      "unavailable"
    );
    expect(snapshot.catalog.find((entry) => entry.id === "research-index")?.state).toBe("preview");
  });

  it("returns unavailable snapshot when desktop refresh returns malformed payload", async () => {
    const snapshot = await loadProviderMcpCatalogSnapshot(async () => "not-a-payload", fallbackCatalog);

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "filesystem-bridge")?.state).toBe(
      "unavailable"
    );
  });

  it("returns unavailable snapshot when desktop refresh fails", async () => {
    const snapshot = await loadProviderMcpCatalogSnapshot(async () => {
      throw new Error("desktop MCP refresh unavailable");
    }, fallbackCatalog);

    expect(snapshot.source).toBe("unavailable");
    expect(snapshot.catalog.find((entry) => entry.id === "filesystem-bridge")?.state).toBe(
      "unavailable"
    );
  });
});
