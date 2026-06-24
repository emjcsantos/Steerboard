import { describe, expect, it } from "vitest";
import {
  canRunGitWorkbenchAction,
  parseGitPorcelainStatus,
  requiresVisibleGitApproval,
  snapshotFromGitWorkbenchDiffPayload,
  snapshotFromGitWorkbenchStatusPayload
} from "./gitWorkbench";
import type { LiveActionPermissionRequest } from "./liveActionPermission";

function gitRequest(state: LiveActionPermissionRequest["state"]): LiveActionPermissionRequest {
  return {
    id: "git-request",
    provider: "git",
    actionLabel: "Run Git operation",
    state,
    requestedAt: "2026-06-24T00:00:00.000Z",
    timeoutMs: 60_000,
    expiresAt: "2026-06-24T00:01:00.000Z",
    risk: "high"
  };
}

describe("parseGitPorcelainStatus", () => {
  it("parses branch, upstream, ahead behind, and changed groups", () => {
    const status = parseGitPorcelainStatus(
      [
        "# branch.oid abc",
        "# branch.head codex/work",
        "# branch.upstream origin/codex/work",
        "# branch.ab +2 -1",
        "1 M. N... 100644 100644 100644 abc abc src/staged.ts",
        "1 .M N... 100644 100644 100644 abc abc src/unstaged.ts",
        "? src/new.ts"
      ].join("\n")
    );

    expect(status.branch).toMatchObject({
      branch: "codex/work",
      upstream: "origin/codex/work",
      ahead: 2,
      behind: 1
    });
    expect(status.staged.map((file) => file.path)).toEqual(["src/staged.ts"]);
    expect(status.unstaged.map((file) => file.path)).toEqual(["src/unstaged.ts"]);
    expect(status.untracked.map((file) => file.path)).toEqual(["src/new.ts"]);
  });

  it("parses detached branch state", () => {
    const status = parseGitPorcelainStatus("# branch.head (detached)");

    expect(status.branch.detached).toBe(true);
    expect(status.branch.branch).toBe("detached");
  });
});

describe("snapshotFromGitWorkbenchStatusPayload", () => {
  it("repairs malformed payloads without exposing actions", () => {
    const snapshot = snapshotFromGitWorkbenchStatusPayload({
      source: "desktop",
      available: true,
      branch: { branch: "main", ahead: -4 },
      files: [{ path: "src/App.tsx", groups: ["staged", "invalid"], indexStatus: "M" }]
    });

    expect(snapshot.available).toBe(true);
    expect(snapshot.branch.ahead).toBe(0);
    expect(snapshot.staged).toHaveLength(1);
    expect(snapshot.unstaged).toHaveLength(0);
  });
});

describe("snapshotFromGitWorkbenchDiffPayload", () => {
  it("normalizes staged and unstaged diff payloads", () => {
    const diff = snapshotFromGitWorkbenchDiffPayload({
      source: "desktop",
      available: true,
      staged: true,
      filePath: "src/App.tsx",
      diff: "diff --git a/src/App.tsx b/src/App.tsx"
    });

    expect(diff.available).toBe(true);
    expect(diff.staged).toBe(true);
    expect(diff.diff).toContain("diff --git");
  });
});

describe("Git workbench approval gating", () => {
  it("blocks stage, commit, and push without approved Git posture", () => {
    expect(canRunGitWorkbenchAction("stage", gitRequest("requested"), "2026-06-24T00:00:30.000Z")).toBe(false);
    expect(canRunGitWorkbenchAction("commit", gitRequest("idle"), "2026-06-24T00:00:30.000Z")).toBe(false);
    expect(canRunGitWorkbenchAction("push", gitRequest("denied"), "2026-06-24T00:00:30.000Z")).toBe(false);
  });

  it("allows mutation actions only while Git approval is active", () => {
    expect(canRunGitWorkbenchAction("stage", gitRequest("approved"), "2026-06-24T00:00:30.000Z")).toBe(true);
    expect(canRunGitWorkbenchAction("push", gitRequest("approved"), "2026-06-24T00:00:30.000Z")).toBe(true);
    expect(canRunGitWorkbenchAction("push", gitRequest("approved"), "2026-06-24T00:02:00.000Z")).toBe(false);
  });

  it("marks all write actions as requiring visible approval", () => {
    expect(requiresVisibleGitApproval("stage")).toBe(true);
    expect(requiresVisibleGitApproval("push")).toBe(true);
  });
});

