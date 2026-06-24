import { describe, expect, it } from "vitest";
import {
  applyMcpManagerProbe,
  buildMcpManagerRows,
  buildMcpManagerState,
  linkMcpToolCallToServer,
  probeMcpManagerServer,
  repairMcpServerDefinitions
} from "./mcpManager";
import type { CodexProtocolLedgerEntry } from "./codexSession";

const definitions = [
  {
    id: "local-files",
    label: "Local Files",
    transport: "stdio",
    command: "node",
    args: ["server.js"],
    tools: ["read_file", "list_files"]
  },
  {
    id: "docs-search",
    label: "Docs Search",
    transport: "http",
    url: "https://example.test/mcp",
    headers: {
      Authorization: "Bearer sk-secret-token"
    },
    tools: ["search"],
    oauth: { enabled: true, connected: false }
  },
  {
    id: "events",
    label: "Events",
    transport: "sse",
    url: "https://example.test/events",
    oauth: { enabled: true, connected: true }
  },
  {
    id: "broken-http",
    label: "Broken HTTP",
    transport: "http",
    tools: []
  },
  {
    id: "old-ws",
    label: "Old WS",
    transport: "websocket"
  }
];

describe("MCP manager", () => {
  it("repairs malformed project-scoped server definitions", () => {
    const repaired = repairMcpServerDefinitions([
      ...definitions,
      { id: "local-files", label: "Duplicate", transport: "stdio", command: "ignored" },
      "bad"
    ]);

    expect(repaired.map((server) => server.id)).toEqual([
      "local-files",
      "docs-search",
      "events",
      "broken-http",
      "old-ws"
    ]);
    expect(repaired.find((server) => server.id === "old-ws")).toMatchObject({
      enabled: false,
      transport: "http"
    });
  });

  it("builds rows for stdio, HTTP, SSE, OAuth, and unsupported transport states", () => {
    const rows = buildMcpManagerRows(definitions);

    expect(rows.find((row) => row.id === "local-files")).toMatchObject({
      transport: "stdio",
      setupState: "ready",
      authState: "none",
      toolCount: 2
    });
    expect(rows.find((row) => row.id === "docs-search")).toMatchObject({
      transport: "http",
      setupState: "ready",
      authState: "oauth-required",
      toolCount: 1
    });
    expect(rows.find((row) => row.id === "events")).toMatchObject({
      transport: "sse",
      setupState: "ready",
      authState: "oauth-ready"
    });
    expect(rows.find((row) => row.id === "broken-http")).toMatchObject({
      status: "setup-required",
      setupState: "missing-fields",
      requiredFields: ["url"]
    });
    expect(rows.find((row) => row.id === "old-ws")).toMatchObject({
      status: "unsupported",
      setupState: "unsupported",
      authState: "unsupported"
    });
  });

  it("does not expose token values in manager state", () => {
    const state = buildMcpManagerState("project-a", definitions, "2026-06-25T00:00:00.000Z");
    const serialized = JSON.stringify(state);

    expect(state.projectId).toBe("project-a");
    expect(state.catalogEntries.find((entry) => entry.id === "docs-search")?.toolPolicy).toBe(
      "approval-required"
    );
    expect(serialized).not.toContain("sk-secret-token");
    expect(serialized).not.toContain("Authorization");
  });

  it("returns safe probe outcomes without invoking MCP tools", () => {
    const rows = buildMcpManagerRows(definitions);

    expect(probeMcpManagerServer(rows[0])).toMatchObject({
      serverId: "local-files",
      state: "ready",
      status: "preview",
      detail: expect.stringContaining("no MCP tool was invoked")
    });
    expect(probeMcpManagerServer(rows.find((row) => row.id === "broken-http")!)).toMatchObject({
      state: "blocked",
      status: "setup-required"
    });
    expect(probeMcpManagerServer(rows.find((row) => row.id === "old-ws")!)).toMatchObject({
      state: "unsupported",
      status: "unsupported"
    });
    expect(applyMcpManagerProbe(rows, "local-files").find((row) => row.id === "local-files")).toMatchObject({
      probeState: "ready",
      status: "preview"
    });
  });

  it("links Codex MCP tool calls to matching manager rows", () => {
    const rows = buildMcpManagerRows(definitions);
    const entry: CodexProtocolLedgerEntry = {
      id: "ledger-1",
      kind: "mcp_call",
      method: "mcp/toolCall",
      title: "local-files.read_file",
      detail: "read_file",
      receivedAt: "2026-06-25T00:00:00.000Z"
    };

    expect(linkMcpToolCallToServer(entry, rows)?.id).toBe("local-files");
    expect(linkMcpToolCallToServer({ ...entry, kind: "command_execution" }, rows)).toBeUndefined();
  });
});
