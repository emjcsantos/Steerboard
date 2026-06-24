import { describe, expect, it } from "vitest";
import {
  canRunTerminalPaneAction,
  repairTerminalPaneState,
  snapshotFromTerminalPaneActionPayload,
  terminalPaneStateWithTab,
  terminalPaneStateWithoutTab,
  type TerminalPaneTab
} from "./terminalWorkbench";
import type { LiveActionPermissionRequest } from "./liveActionPermission";

function request(state: LiveActionPermissionRequest["state"]): LiveActionPermissionRequest {
  return {
    id: "terminal-request",
    provider: "terminal",
    actionLabel: "Run terminal command",
    state,
    requestedAt: "2026-06-24T00:00:00.000Z",
    timeoutMs: 60_000,
    expiresAt: "2999-01-01T00:00:00.000Z",
    risk: "high"
  };
}

function tab(status: TerminalPaneTab["status"] = "running"): TerminalPaneTab {
  return {
    id: "term-1",
    title: "Terminal 1",
    status,
    workspacePath: "C:/repo",
    cols: 100,
    rows: 30,
    output: "ready",
    updatedAt: "2026-06-24T00:00:00.000Z"
  };
}

describe("terminal pane state repair", () => {
  it("repairs reload state and preserves active tab when valid", () => {
    const state = repairTerminalPaneState({
      activeTabId: "term-2",
      tabs: [tab(), { ...tab(), id: "term-2", status: "exited", exitCode: 0 }]
    });

    expect(state.activeTabId).toBe("term-2");
    expect(state.tabs).toHaveLength(2);
    expect(state.tabs[1].status).toBe("exited");
  });

  it("falls back from missing active terminal IDs", () => {
    const state = repairTerminalPaneState({
      activeTabId: "missing",
      tabs: [tab()]
    });

    expect(state.activeTabId).toBe("term-1");
  });

  it("adds and removes tabs without leaving stale active IDs", () => {
    const withTab = terminalPaneStateWithTab({ tabs: [], notice: "" }, tab(), "created");
    const withoutTab = terminalPaneStateWithoutTab(withTab, "term-1", "destroyed");

    expect(withTab.activeTabId).toBe("term-1");
    expect(withoutTab.activeTabId).toBeUndefined();
    expect(withoutTab.tabs).toHaveLength(0);
  });
});

describe("terminal pane action payloads", () => {
  it("normalizes snapshots from the desktop bridge", () => {
    const result = snapshotFromTerminalPaneActionPayload({
      source: "desktop",
      checkedAt: "now",
      action: "snapshot",
      executed: true,
      blocked: false,
      tab: tab()
    });

    expect(result.executed).toBe(true);
    expect(result.tab?.output).toBe("ready");
  });
});

describe("terminal pane permission gating", () => {
  it("blocks create and write until terminal approval is active", () => {
    expect(canRunTerminalPaneAction("create", request("requested"))).toBe(false);
    expect(canRunTerminalPaneAction("write", request("idle"), tab())).toBe(false);
  });

  it("blocks writes to exited terminals", () => {
    expect(canRunTerminalPaneAction("write", request("approved"), tab("exited"))).toBe(false);
  });

  it("allows approved create, resize, snapshot, exit, and destroy paths", () => {
    expect(canRunTerminalPaneAction("create", request("approved"))).toBe(true);
    expect(canRunTerminalPaneAction("resize", request("approved"), tab())).toBe(true);
    expect(canRunTerminalPaneAction("snapshot", undefined, tab())).toBe(true);
    expect(canRunTerminalPaneAction("exit", request("approved"), tab())).toBe(true);
    expect(canRunTerminalPaneAction("destroy", request("approved"), tab("exited"))).toBe(true);
  });
});

