import {
  snapshotFromTerminalPaneActionPayload,
  type TerminalPaneAction,
  type TerminalPaneActionResult
} from "./terminalWorkbench";
import { hasTauriRuntime } from "./tauriRuntime";

export interface TerminalPaneActionOptions {
  tabId?: string;
  input?: string;
  cols?: number;
  rows?: number;
  approvalState?: string;
}

async function invokeTerminalPaneAction(
  action: TerminalPaneAction,
  options: TerminalPaneActionOptions
): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return {
      source: "browser",
      checkedAt: "",
      action,
      executed: false,
      blocked: true,
      detail: "Terminal pane is unavailable in browser preview.",
      safety: "No shell process was started."
    };
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("terminal_pane_action", {
    action,
    tabId: options.tabId,
    input: options.input,
    cols: options.cols,
    rows: options.rows,
    approvalState: options.approvalState ?? "idle"
  });
}

export async function runTerminalPaneAction(
  action: TerminalPaneAction,
  options: TerminalPaneActionOptions,
  invokeAction = invokeTerminalPaneAction
): Promise<TerminalPaneActionResult> {
  try {
    return snapshotFromTerminalPaneActionPayload(await invokeAction(action, options));
  } catch {
    return {
      source: "desktop",
      checkedAt: "",
      action,
      executed: false,
      blocked: true,
      detail: "Terminal pane action failed before completion.",
      safety: "No success was assumed."
    };
  }
}

