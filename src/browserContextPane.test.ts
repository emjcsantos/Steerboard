import { describe, expect, it } from "vitest";
import {
  browserContextPaneWithTab,
  createBrowserContextTab,
  normalizeBrowserContextTarget,
  redactBrowserUrl,
  removeBrowserContextTab,
  repairBrowserContextPaneState,
  updateBrowserContextTabState
} from "./browserContextPane";

describe("normalizeBrowserContextTarget", () => {
  it("normalizes bare domains to HTTPS URLs", () => {
    expect(normalizeBrowserContextTarget("example.com/path")).toMatchObject({
      url: "https://example.com/path",
      title: "example.com"
    });
  });

  it("falls back to search for free text", () => {
    const target = normalizeBrowserContextTarget("codex desktop parity");

    expect(target.url).toBe("https://www.google.com/search?q=codex%20desktop%20parity");
    expect(target.query).toBe("codex desktop parity");
  });
});

describe("browser context tab repair", () => {
  it("repairs saved tabs and active IDs", () => {
    const state = repairBrowserContextPaneState({
      activeTabId: "tab-2",
      tabs: [
        { id: "tab-1", url: "https://example.com", title: "Example", state: "ready" },
        { id: "tab-2", url: "https://openai.com", title: "OpenAI", state: "loading" }
      ]
    });

    expect(state.activeTabId).toBe("tab-2");
    expect(state.tabs).toHaveLength(2);
  });

  it("drops malformed or secret-only tabs safely", () => {
    const state = repairBrowserContextPaneState({
      activeTabId: "missing",
      tabs: [{ id: "bad", url: "javascript:alert(1)" }, { id: "ok", url: "https://example.com?token=abc" }]
    });

    expect(state.activeTabId).toBe("ok");
    expect(state.tabs[0].url).toContain("token=%5Bredacted%5D");
  });
});

describe("browser context state transitions", () => {
  it("adds, fails, and removes tabs", () => {
    const tab = createBrowserContextTab("https://example.com", "2026-06-24T00:00:00.000Z");
    const opened = browserContextPaneWithTab({ tabs: [], input: "", notice: "" }, tab);
    const failed = updateBrowserContextTabState(opened, tab.id, "failed", "Load failed.");
    const removed = removeBrowserContextTab(failed, tab.id);

    expect(opened.activeTabId).toBe(tab.id);
    expect(failed.tabs[0].state).toBe("failed");
    expect(removed.tabs).toHaveLength(0);
  });

  it("redacts credentials and secret query values", () => {
    expect(redactBrowserUrl("https://user:pass@example.com/path?api_key=secret&ok=1")).toBe(
      "https://example.com/path?api_key=%5Bredacted%5D&ok=1"
    );
  });
});

