export type BrowserContextTabState = "ready" | "loading" | "failed" | "unsupported" | "unavailable";

export interface BrowserContextTab {
  id: string;
  title: string;
  url: string;
  query: string;
  state: BrowserContextTabState;
  updatedAt: string;
}

export interface BrowserContextPaneState {
  activeTabId?: string;
  tabs: BrowserContextTab[];
  input: string;
  notice: string;
}

const STORAGE_KEY = "steerboard.browserContextPane.v1";
const DEFAULT_SEARCH_URL = "https://www.google.com/search?q=";

export const fallbackBrowserContextPaneState: BrowserContextPaneState = {
  activeTabId: undefined,
  tabs: [],
  input: "",
  notice: "No browser context tabs yet."
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeTabState(value: unknown): BrowserContextTabState {
  if (
    value === "ready" ||
    value === "loading" ||
    value === "failed" ||
    value === "unsupported" ||
    value === "unavailable"
  ) {
    return value;
  }

  return "unavailable";
}

export function normalizeBrowserContextTarget(raw: string): { url: string; query: string; title: string } {
  const value = raw.trim();
  if (!value) {
    return {
      url: "",
      query: "",
      title: "Blank"
    };
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return {
        url: redactBrowserUrl(parsed.toString()),
        query: "",
        title: parsed.hostname
      };
    }
  } catch {
    // Fall back to search below.
  }

  return {
    url: `${DEFAULT_SEARCH_URL}${encodeURIComponent(value)}`,
    query: value,
    title: value.slice(0, 80)
  };
}

export function redactBrowserUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (/token|secret|password|key|auth|code/i.test(key)) {
        parsed.searchParams.set(key, "[redacted]");
      }
    }
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

export function createBrowserContextTab(raw: string, now = new Date().toISOString()): BrowserContextTab {
  const target = normalizeBrowserContextTarget(raw);
  return {
    id: `browser-${Date.parse(now) || Date.now()}`,
    title: target.title,
    url: target.url,
    query: target.query,
    state: target.url ? "loading" : "failed",
    updatedAt: now
  };
}

export function repairBrowserContextTab(value: unknown): BrowserContextTab | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = safeString(value.id);
  const url = redactBrowserUrl(safeString(value.url));
  if (!id || !url) {
    return undefined;
  }

  return {
    id,
    title: safeString(value.title, new URL(url).hostname),
    url,
    query: safeString(value.query),
    state: normalizeTabState(value.state),
    updatedAt: safeString(value.updatedAt, new Date().toISOString())
  };
}

export function repairBrowserContextPaneState(value: unknown): BrowserContextPaneState {
  const record = isRecord(value) ? value : {};
  const tabs = Array.isArray(record.tabs)
    ? record.tabs.map(repairBrowserContextTab).filter((tab): tab is BrowserContextTab => Boolean(tab))
    : [];
  const activeTabId = safeString(record.activeTabId);

  return {
    activeTabId: tabs.some((tab) => tab.id === activeTabId) ? activeTabId : tabs[0]?.id,
    tabs,
    input: safeString(record.input),
    notice: safeString(record.notice, fallbackBrowserContextPaneState.notice)
  };
}

export function browserContextPaneWithTab(
  state: BrowserContextPaneState,
  tab: BrowserContextTab,
  notice = "Browser context tab opened."
): BrowserContextPaneState {
  return {
    activeTabId: tab.id,
    tabs: [...state.tabs.filter((item) => item.id !== tab.id), tab],
    input: state.input,
    notice
  };
}

export function updateBrowserContextTabState(
  state: BrowserContextPaneState,
  tabId: string,
  tabState: BrowserContextTabState,
  notice: string
): BrowserContextPaneState {
  return {
    ...state,
    tabs: state.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, state: tabState, updatedAt: new Date().toISOString() } : tab
    ),
    notice
  };
}

export function removeBrowserContextTab(state: BrowserContextPaneState, tabId: string): BrowserContextPaneState {
  const tabs = state.tabs.filter((tab) => tab.id !== tabId);
  return {
    ...state,
    activeTabId: state.activeTabId === tabId ? tabs[0]?.id : state.activeTabId,
    tabs,
    notice: "Browser context tab closed."
  };
}

export function loadBrowserContextPaneState(): BrowserContextPaneState {
  if (typeof window === "undefined") {
    return fallbackBrowserContextPaneState;
  }

  try {
    return repairBrowserContextPaneState(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"));
  } catch {
    return fallbackBrowserContextPaneState;
  }
}

export function saveBrowserContextPaneState(state: BrowserContextPaneState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
