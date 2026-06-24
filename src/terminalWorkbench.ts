import type { LiveActionPermissionRequest } from "./liveActionPermission";
import { canExecuteLiveAction } from "./liveActionPermission";

export type TerminalPaneStatus = "idle" | "running" | "exited" | "destroyed" | "blocked" | "missing";
export type TerminalPaneAction = "create" | "write" | "resize" | "snapshot" | "exit" | "destroy";

export interface TerminalPaneTab {
  id: string;
  title: string;
  status: TerminalPaneStatus;
  workspacePath: string;
  cols: number;
  rows: number;
  output: string;
  exitCode?: number;
  updatedAt: string;
}

export interface TerminalPaneActionResult {
  source: string;
  checkedAt: string;
  action: TerminalPaneAction;
  tab?: TerminalPaneTab;
  executed: boolean;
  blocked: boolean;
  detail: string;
  safety: string;
}

export interface TerminalPaneState {
  activeTabId?: string;
  tabs: TerminalPaneTab[];
  notice: string;
}

export const fallbackTerminalPaneState: TerminalPaneState = {
  activeTabId: undefined,
  tabs: [],
  notice: "No terminal tabs yet."
};

const STORAGE_KEY = "steerboard.terminalPane.tabs.v1";
const MAX_OUTPUT_LENGTH = 30_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function safeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

function normalizeStatus(value: unknown): TerminalPaneStatus {
  if (
    value === "idle" ||
    value === "running" ||
    value === "exited" ||
    value === "destroyed" ||
    value === "blocked" ||
    value === "missing"
  ) {
    return value;
  }

  return "idle";
}

export function repairTerminalPaneTab(value: unknown): TerminalPaneTab | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = safeString(value.id);
  if (!id) {
    return undefined;
  }

  return {
    id,
    title: safeString(value.title, "Terminal"),
    status: normalizeStatus(value.status),
    workspacePath: safeString(value.workspacePath),
    cols: safeNumber(value.cols, 100),
    rows: safeNumber(value.rows, 30),
    output: typeof value.output === "string" ? value.output.slice(-MAX_OUTPUT_LENGTH) : "",
    exitCode: typeof value.exitCode === "number" && Number.isFinite(value.exitCode)
      ? Math.trunc(value.exitCode)
      : undefined,
    updatedAt: safeString(value.updatedAt, new Date().toISOString())
  };
}

export function repairTerminalPaneState(value: unknown): TerminalPaneState {
  const record = isRecord(value) ? value : {};
  const tabs = Array.isArray(record.tabs)
    ? record.tabs.map(repairTerminalPaneTab).filter((tab): tab is TerminalPaneTab => Boolean(tab))
    : [];
  const activeTabId = safeString(record.activeTabId);
  const repairedActiveTabId = tabs.some((tab) => tab.id === activeTabId)
    ? activeTabId
    : tabs[0]?.id;

  return {
    activeTabId: repairedActiveTabId,
    tabs,
    notice: safeString(record.notice, fallbackTerminalPaneState.notice)
  };
}

export function terminalPaneStateWithTab(
  state: TerminalPaneState,
  tab: TerminalPaneTab,
  notice: string
): TerminalPaneState {
  const tabs = state.tabs.some((item) => item.id === tab.id)
    ? state.tabs.map((item) => (item.id === tab.id ? tab : item))
    : [...state.tabs, tab];

  return {
    activeTabId: tab.id,
    tabs,
    notice
  };
}

export function terminalPaneStateWithoutTab(
  state: TerminalPaneState,
  tabId: string,
  notice: string
): TerminalPaneState {
  const tabs = state.tabs.filter((tab) => tab.id !== tabId);
  return {
    activeTabId: state.activeTabId === tabId ? tabs[0]?.id : state.activeTabId,
    tabs,
    notice
  };
}

export function snapshotFromTerminalPaneActionPayload(value: unknown): TerminalPaneActionResult {
  if (!isRecord(value)) {
    return {
      source: "browser",
      checkedAt: "",
      action: "snapshot",
      executed: false,
      blocked: true,
      detail: "Terminal action is unavailable.",
      safety: "No shell process was started."
    };
  }

  return {
    source: safeString(value.source, "desktop"),
    checkedAt: safeString(value.checkedAt),
    action: normalizeAction(value.action),
    tab: repairTerminalPaneTab(value.tab),
    executed: value.executed === true,
    blocked: value.blocked === true,
    detail: safeString(value.detail, "Terminal action completed."),
    safety: safeString(value.safety, "Terminal action returned no safety detail.")
  };
}

function normalizeAction(value: unknown): TerminalPaneAction {
  if (
    value === "create" ||
    value === "write" ||
    value === "resize" ||
    value === "snapshot" ||
    value === "exit" ||
    value === "destroy"
  ) {
    return value;
  }

  return "snapshot";
}

export function canRunTerminalPaneAction(
  action: TerminalPaneAction,
  request?: LiveActionPermissionRequest,
  tab?: TerminalPaneTab
): boolean {
  if (action === "snapshot") {
    return Boolean(tab);
  }

  if (!request || !canExecuteLiveAction(request)) {
    return false;
  }

  if (action === "write" || action === "resize" || action === "exit") {
    return tab?.status === "running";
  }

  return action === "create" || action === "destroy";
}

export function loadTerminalPaneState(): TerminalPaneState {
  if (typeof window === "undefined") {
    return fallbackTerminalPaneState;
  }

  try {
    return repairTerminalPaneState(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"));
  } catch {
    return fallbackTerminalPaneState;
  }
}

export function saveTerminalPaneState(state: TerminalPaneState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

