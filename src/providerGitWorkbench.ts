import {
  fallbackGitWorkbenchStatus,
  snapshotFromGitWorkbenchDiffPayload,
  snapshotFromGitWorkbenchStatusPayload,
  type GitWorkbenchAction,
  type GitWorkbenchActionResult,
  type GitWorkbenchDiff,
  type GitWorkbenchStatus
} from "./gitWorkbench";
import { hasTauriRuntime } from "./tauriRuntime";

async function invokeGitWorkbenchStatus(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return fallbackGitWorkbenchStatus;
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("git_workbench_status");
}

async function invokeGitWorkbenchDiff(filePath: string, staged: boolean): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return {
      source: "browser",
      checkedAt: "",
      available: false,
      staged,
      filePath,
      diff: "",
      detail: "Diff is unavailable in browser preview.",
      safety: "No Git process was started."
    };
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("git_workbench_diff", { filePath, staged });
}

async function invokeGitWorkbenchAction(
  action: GitWorkbenchAction,
  options: { filePath?: string; message?: string; approvalState?: string }
): Promise<GitWorkbenchActionResult> {
  if (!hasTauriRuntime()) {
    return {
      source: "browser",
      checkedAt: "",
      action,
      executed: false,
      blocked: true,
      detail: "Git actions are unavailable in browser preview.",
      safety: "No Git process was started."
    };
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<GitWorkbenchActionResult>("git_workbench_action", {
    action,
    filePath: options.filePath,
    message: options.message,
    approvalState: options.approvalState ?? "idle"
  });
}

export async function loadGitWorkbenchStatus(
  invokeStatus: () => Promise<unknown> = invokeGitWorkbenchStatus
): Promise<GitWorkbenchStatus> {
  try {
    if (!hasTauriRuntime() && invokeStatus === invokeGitWorkbenchStatus) {
      return fallbackGitWorkbenchStatus;
    }

    return snapshotFromGitWorkbenchStatusPayload(await invokeStatus());
  } catch {
    return {
      ...fallbackGitWorkbenchStatus,
      source: "desktop",
      detail: "Git workbench status could not be loaded."
    };
  }
}

export async function loadGitWorkbenchDiff(
  filePath: string,
  staged: boolean,
  invokeDiff: (filePath: string, staged: boolean) => Promise<unknown> = invokeGitWorkbenchDiff
): Promise<GitWorkbenchDiff> {
  try {
    return snapshotFromGitWorkbenchDiffPayload(await invokeDiff(filePath, staged));
  } catch {
    return {
      source: "desktop",
      checkedAt: "",
      available: false,
      staged,
      filePath,
      diff: "",
      detail: "Git workbench diff could not be loaded.",
      safety: "Read-only Git diff failed."
    };
  }
}

export async function runGitWorkbenchAction(
  action: GitWorkbenchAction,
  options: { filePath?: string; message?: string; approvalState?: string },
  invokeAction = invokeGitWorkbenchAction
): Promise<GitWorkbenchActionResult> {
  try {
    return await invokeAction(action, options);
  } catch {
    return {
      source: "desktop",
      checkedAt: "",
      action,
      executed: false,
      blocked: true,
      detail: "Git action failed before completion.",
      safety: "Git action returned an error and no success was assumed."
    };
  }
}

