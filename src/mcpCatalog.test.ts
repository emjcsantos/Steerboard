import { describe, expect, it } from "vitest";
import {
  buildMcpCatalogSnapshot,
  defaultMcpCatalog,
  normalizeMcpCatalog,
  snapshotFromProviderMcpCatalogPayload,
  summarizeMcpCatalog,
  type McpCatalogEntry,
  type McpCatalogState
} from "./mcpCatalog";

describe("MCP catalog defaults", () => {
  it("defines safe provider-neutral defaults", () => {
    expect(defaultMcpCatalog.length).toBeGreaterThan(0);

    for (const entry of defaultMcpCatalog) {
      expect(entry.id).toMatch(/^[a-z0-9-]+$/);
      expect(entry.label).toMatch(/^[A-Za-z0-9 -]+$/);
      expect(entry.transport).toMatch(/^(stdio|sse|websocket|http|local-process|remote-endpoint|mock|unknown)$/);
      expect(entry.toolPolicy).toMatch(/^(all|read-only|approval-required|restricted|disabled|unknown)$/);
      expect(entry.state).toMatch(/^(live|preview|disconnected|setup-required|unsupported|unavailable)$/);

      if (entry.detail) {
        expect(entry.detail).not.toContain("\\");
        expect(entry.detail).not.toMatch(/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+/);
      }
    }
  });
});

describe("MCP catalog normalization", () => {
  it("repairs malformed rows, drops invalid entries, and dedupes by id", () => {
    const repaired = normalizeMcpCatalog(
      [
        {
          id: "  task-tracker ",
          label: "",
          transport: "remote-endpoint",
          toolPolicy: "all",
          state: "preview",
          detail: "Preview workflow."
        },
        {
          id: "bad id",
          label: "Invalid Identifier",
          transport: "http",
          toolPolicy: "read-only",
          state: "live",
          detail: "Should be dropped."
        },
        {
          id: "research-index",
          transport: "bad-transport",
          toolPolicy: "bad-policy",
          state: "not-a-state",
          detail: "Should repair metadata."
        },
        {
          label: "Missing ID",
          transport: "websocket",
          toolPolicy: "all",
          state: "live"
        },
        {
          id: "task-tracker",
          label: "Duplicate should win first",
          transport: "http",
          toolPolicy: "restricted",
          state: "live"
        },
        {
          id: "new-entry",
          label: "New Entry",
          transport: "sse",
          toolPolicy: "approval-required",
          state: "setup-required"
        }
      ] as unknown[],
      defaultMcpCatalog
    );

    expect(repaired).toMatchObject([
      {
        id: "task-tracker",
        label: "Task Tracker",
        transport: "remote-endpoint",
        toolPolicy: "all",
        state: "preview",
        detail: "Preview workflow."
      },
      {
        id: "research-index",
        label: "Research Index",
        transport: "unknown",
        toolPolicy: "approval-required",
        state: "unavailable",
        detail: "Should repair metadata."
      },
      {
        id: "new-entry",
        label: "New Entry",
        transport: "sse",
        toolPolicy: "approval-required",
        state: "setup-required"
      }
    ]);
  });

  it("repairs transport and tool policy to safe defaults", () => {
    const repaired = normalizeMcpCatalog([
      {
        id: "repair-test",
        label: "Repair test",
        transport: "not-real",
        toolPolicy: "unknown-policy",
        state: "live"
      }
    ] as unknown[]);

    expect(repaired).toEqual([
      {
        id: "repair-test",
        label: "Repair test",
        transport: "unknown",
        state: "live",
        toolPolicy: "approval-required"
      }
    ]);
  });

  it("falls back to default catalog when input is unusable", () => {
    expect(normalizeMcpCatalog("not-a-catalog")).toEqual(defaultMcpCatalog);
    expect(normalizeMcpCatalog(undefined, [] as McpCatalogEntry[])).toEqual(defaultMcpCatalog);
  });
});

describe("MCP catalog summary", () => {
  it("counts states for UI-friendly summary", () => {
    const catalog: McpCatalogEntry[] = [
      { id: "a", label: "A", transport: "stdio", state: "live", toolPolicy: "all" },
      { id: "b", label: "B", transport: "sse", state: "preview", toolPolicy: "read-only" },
      { id: "c", label: "C", transport: "http", state: "disconnected", toolPolicy: "approval-required" },
      { id: "d", label: "D", transport: "http", state: "setup-required", toolPolicy: "restricted" },
      { id: "e", label: "E", transport: "mock", state: "unsupported", toolPolicy: "disabled" },
      { id: "f", label: "F", transport: "unknown", state: "unavailable", toolPolicy: "unknown" }
    ];

    expect(summarizeMcpCatalog(catalog)).toEqual({
      total: 6,
      live: 1,
      preview: 1,
      disconnected: 1,
      setupRequired: 1,
      unsupported: 1,
      unavailable: 1,
      actionable: 6,
      availability: 0.33
    });
  });

  it("normalizes summary input before counting", () => {
    expect(summarizeMcpCatalog("bad-input").total).toBe(defaultMcpCatalog.length);
  });
});

describe("MCP catalog snapshots", () => {
  const fallbackCatalog: McpCatalogEntry[] = [
    {
      id: "filesystem-bridge",
      label: "Filesystem Bridge",
      transport: "stdio",
      state: "live",
      toolPolicy: "read-only",
      detail: "Fallback filesystem bridge."
    },
    {
      id: "research-index",
      label: "Research Index",
      transport: "http",
      state: "preview",
      toolPolicy: "read-only"
    }
  ];

  it("builds a default fallback snapshot from safe defaults", () => {
    const snapshot = buildMcpCatalogSnapshot(undefined, "default-fallback", fallbackCatalog);

    expect(snapshot.source).toBe("default-fallback");
    expect(snapshot.catalog).toEqual(fallbackCatalog);
    expect(snapshot.summary.source).toBe("default-fallback");
    expect(snapshot.summary.availability).toBe(1);
  });

  it("builds provider-live snapshot from normalized provider rows", () => {
    const snapshot = snapshotFromProviderMcpCatalogPayload(
      {
        source: "provider-live",
        entries: [
          {
            id: "provider-mcp-status",
            label: "Provider MCP Status",
            transport: "stdio",
            state: "live",
            toolPolicy: "approval-required",
            detail: "Provider app-server exposes MCP status capability metadata."
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-live");
    expect(snapshot.catalog).toEqual([
      {
        id: "provider-mcp-status",
        label: "Provider MCP Status",
        transport: "stdio",
        state: "live",
        toolPolicy: "approval-required",
        detail: "Provider app-server exposes MCP status capability metadata."
      }
    ]);
  });

  it("downgrades provider-live rows to preview for preview-only provider payloads", () => {
    const snapshot = snapshotFromProviderMcpCatalogPayload(
      {
        source: "provider-preview",
        entries: [
          {
            id: "provider-mcp-status",
            label: "Provider MCP Status",
            transport: "stdio",
            state: "live",
            toolPolicy: "approval-required"
          }
        ]
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("provider-preview");
    expect(snapshot.catalog[0]?.state).toBe("preview");
  });

  it("returns empty-refresh source for empty refresh payloads", () => {
    const snapshot = snapshotFromProviderMcpCatalogPayload(
      {
        source: "empty-refresh",
        entries: []
      },
      fallbackCatalog
    );

    expect(snapshot.source).toBe("empty-refresh");
    expect(snapshot.catalog).toEqual(fallbackCatalog);
  });

  it("returns unavailable snapshot for malformed or unavailable payloads", () => {
    const malformed = snapshotFromProviderMcpCatalogPayload("not-a-payload", fallbackCatalog);
    const unavailable = snapshotFromProviderMcpCatalogPayload(
      {
        source: "unavailable",
        entries: []
      },
      fallbackCatalog
    );

    expect(malformed.source).toBe("unavailable");
    expect(unavailable.source).toBe("unavailable");
    expect(malformed.catalog.find((entry) => entry.id === "filesystem-bridge")?.state).toBe(
      "unavailable"
    );
    expect(unavailable.catalog.find((entry) => entry.id === "research-index")?.state).toBe(
      "preview"
    );
  });
});

describe("MCP catalog state typing", () => {
  it("declares all expected states", () => {
    const states: McpCatalogState[] = [
      "live",
      "preview",
      "disconnected",
      "setup-required",
      "unsupported",
      "unavailable"
    ];
    expect(states).toHaveLength(6);
  });
});
