import type { LiveActionPermissionRequest } from "./liveActionPermission";
import { canExecuteLiveAction } from "./liveActionPermission";

export type GitWorkbenchFileGroup = "staged" | "unstaged" | "untracked";
export type GitWorkbenchAction =
  | "stage"
  | "unstage"
  | "stage-all"
  | "unstage-all"
  | "commit"
  | "push";

export interface GitWorkbenchFileChange {
  path: string;
  originalPath?: string;
  indexStatus: string;
  worktreeStatus: string;
  groups: GitWorkbenchFileGroup[];
}

export interface GitWorkbenchBranchState {
  branch: string;
  upstream: string;
  ahead: number;
  behind: number;
  detached: boolean;
}

export interface GitWorkbenchStatus {
  source: string;
  checkedAt: string;
  available: boolean;
  workspacePath: string;
  repositoryPath: string;
  branch: GitWorkbenchBranchState;
  files: GitWorkbenchFileChange[];
  staged: GitWorkbenchFileChange[];
  unstaged: GitWorkbenchFileChange[];
  untracked: GitWorkbenchFileChange[];
  detail: string;
  safety: string;
}

export interface GitWorkbenchDiff {
  source: string;
  checkedAt: string;
  available: boolean;
  staged: boolean;
  filePath: string;
  diff: string;
  detail: string;
  safety: string;
}

export interface GitWorkbenchActionResult {
  source: string;
  checkedAt: string;
  action: GitWorkbenchAction;
  executed: boolean;
  blocked: boolean;
  detail: string;
  safety: string;
}

const emptyBranch: GitWorkbenchBranchState = {
  branch: "unknown",
  upstream: "",
  ahead: 0,
  behind: 0,
  detached: false
};

export const fallbackGitWorkbenchStatus: GitWorkbenchStatus = {
  source: "browser",
  checkedAt: "",
  available: false,
  workspacePath: "",
  repositoryPath: "",
  branch: emptyBranch,
  files: [],
  staged: [],
  unstaged: [],
  untracked: [],
  detail: "Git workbench is unavailable in browser preview.",
  safety: "No Git process was started."
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function safeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function parseGroups(value: unknown): GitWorkbenchFileGroup[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((group): group is GitWorkbenchFileGroup =>
    group === "staged" || group === "unstaged" || group === "untracked"
  );
}

function normalizeFileChange(value: unknown): GitWorkbenchFileChange | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const path = safeString(value.path);
  if (!path) {
    return undefined;
  }

  return {
    path,
    originalPath: safeString(value.originalPath) || undefined,
    indexStatus: safeString(value.indexStatus, "."),
    worktreeStatus: safeString(value.worktreeStatus, "."),
    groups: parseGroups(value.groups)
  };
}

function normalizeBranch(value: unknown): GitWorkbenchBranchState {
  const branch = isRecord(value) ? value : {};

  return {
    branch: safeString(branch.branch, emptyBranch.branch),
    upstream: safeString(branch.upstream),
    ahead: safeNumber(branch.ahead),
    behind: safeNumber(branch.behind),
    detached: branch.detached === true
  };
}

export function snapshotFromGitWorkbenchStatusPayload(value: unknown): GitWorkbenchStatus {
  if (!isRecord(value)) {
    return fallbackGitWorkbenchStatus;
  }

  const files = Array.isArray(value.files)
    ? value.files.map(normalizeFileChange).filter((file): file is GitWorkbenchFileChange => Boolean(file))
    : [];

  return {
    source: safeString(value.source, "desktop"),
    checkedAt: safeString(value.checkedAt),
    available: value.available === true,
    workspacePath: safeString(value.workspacePath),
    repositoryPath: safeString(value.repositoryPath),
    branch: normalizeBranch(value.branch),
    files,
    staged: files.filter((file) => file.groups.includes("staged")),
    unstaged: files.filter((file) => file.groups.includes("unstaged")),
    untracked: files.filter((file) => file.groups.includes("untracked")),
    detail: safeString(value.detail, fallbackGitWorkbenchStatus.detail),
    safety: safeString(value.safety, fallbackGitWorkbenchStatus.safety)
  };
}

export function snapshotFromGitWorkbenchDiffPayload(value: unknown): GitWorkbenchDiff {
  if (!isRecord(value)) {
    return {
      source: "browser",
      checkedAt: "",
      available: false,
      staged: false,
      filePath: "",
      diff: "",
      detail: "Diff is unavailable.",
      safety: "No Git process was started."
    };
  }

  return {
    source: safeString(value.source, "desktop"),
    checkedAt: safeString(value.checkedAt),
    available: value.available === true,
    staged: value.staged === true,
    filePath: safeString(value.filePath),
    diff: typeof value.diff === "string" ? value.diff : "",
    detail: safeString(value.detail, "Diff loaded."),
    safety: safeString(value.safety, "Read-only Git diff.")
  };
}

export function parseGitPorcelainStatus(output: string): GitWorkbenchStatus {
  const branch = { ...emptyBranch };
  const files: GitWorkbenchFileChange[] = [];

  output.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) {
      return;
    }

    if (line.startsWith("# branch.head ")) {
      const head = line.slice("# branch.head ".length).trim();
      branch.branch = head === "(detached)" ? "detached" : head;
      branch.detached = head === "(detached)";
      return;
    }

    if (line.startsWith("# branch.upstream ")) {
      branch.upstream = line.slice("# branch.upstream ".length).trim();
      return;
    }

    if (line.startsWith("# branch.ab ")) {
      const match = line.match(/\+(\d+)\s+-(\d+)/);
      branch.ahead = match ? Number(match[1]) : 0;
      branch.behind = match ? Number(match[2]) : 0;
      return;
    }

    const parsed = parsePorcelainFileLine(line);
    if (parsed) {
      files.push(parsed);
    }
  });

  return {
    ...fallbackGitWorkbenchStatus,
    source: "parsed",
    available: true,
    branch,
    files,
    staged: files.filter((file) => file.groups.includes("staged")),
    unstaged: files.filter((file) => file.groups.includes("unstaged")),
    untracked: files.filter((file) => file.groups.includes("untracked")),
    detail: `${files.length} changed files parsed from Git status.`,
    safety: "Parsed Git status text only."
  };
}

function parsePorcelainFileLine(line: string): GitWorkbenchFileChange | undefined {
  if (line.startsWith("? ")) {
    const path = line.slice(2).trim();
    return {
      path,
      indexStatus: "?",
      worktreeStatus: "?",
      groups: ["untracked"]
    };
  }

  if (!line.startsWith("1 ") && !line.startsWith("2 ")) {
    return undefined;
  }

  const parts = line.split(" ");
  const status = parts[1] ?? "..";
  const path = line.startsWith("2 ") ? parts.slice(9).join(" ").split("\t").at(-1) ?? "" : parts.slice(8).join(" ");
  const originalPath = line.startsWith("2 ") ? parts.slice(9).join(" ").split("\t")[0] : undefined;
  const indexStatus = status[0] ?? ".";
  const worktreeStatus = status[1] ?? ".";
  const groups: GitWorkbenchFileGroup[] = [];

  if (indexStatus !== "." && indexStatus !== "?") {
    groups.push("staged");
  }
  if (worktreeStatus !== "." && worktreeStatus !== "?") {
    groups.push("unstaged");
  }

  return {
    path: path.trim(),
    originalPath: originalPath?.trim() || undefined,
    indexStatus,
    worktreeStatus,
    groups
  };
}

export function canRunGitWorkbenchAction(
  action: GitWorkbenchAction,
  request?: LiveActionPermissionRequest,
  now: string | Date = new Date()
): boolean {
  if (!request || !canExecuteLiveAction(request, now)) {
    return false;
  }

  return ["stage", "unstage", "stage-all", "unstage-all", "commit", "push"].includes(action);
}

export function requiresVisibleGitApproval(action: GitWorkbenchAction): boolean {
  return action === "push" || action === "commit" || action === "stage" || action === "unstage" ||
    action === "stage-all" || action === "unstage-all";
}

