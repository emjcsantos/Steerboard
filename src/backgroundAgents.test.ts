import { describe, expect, it } from "vitest";
import {
  completeBackgroundAgentHandoff,
  createBackgroundAgentRecord,
  defaultAcpAgentDefinitions,
  failBackgroundAgent,
  repairBackgroundAgentRecords,
  routeBackgroundPermissionRequest,
  transitionBackgroundAgent
} from "./backgroundAgents";
import type { LiveActionPermissionRequest } from "./liveActionPermission";

function permission(): LiveActionPermissionRequest {
  return {
    id: "approval-1",
    provider: "git",
    actionLabel: "Run Git operation",
    state: "requested",
    requestedAt: "2026-06-24T00:00:00.000Z",
    risk: "high"
  };
}

describe("background agent lifecycle", () => {
  it("tracks queued, running, and protocol-backed progress", () => {
    const queued = createBackgroundAgentRecord({
      id: "bg-1",
      agentId: "reviewer",
      agentLabel: "Reviewer",
      sessionId: "session-1",
      panelId: "panel-1",
      now: "2026-06-24T00:00:00.000Z"
    });
    const running = transitionBackgroundAgent(
      queued,
      "running",
      "Reading files.",
      30,
      {
        id: "entry-1",
        turnId: "turn-1",
        kind: "reasoning",
        method: "agent/reasoning",
        status: "running",
        title: "Reading files",
        detail: "Inspecting context"
      }
    );

    expect(running.status).toBe("running");
    expect(running.progressPercent).toBe(30);
    expect(running.ledger).toHaveLength(1);
  });

  it("routes pending permission through the shared approval request shape", () => {
    const record = createBackgroundAgentRecord({
      id: "bg-1",
      agentId: "reviewer",
      agentLabel: "Reviewer",
      sessionId: "session-1",
      panelId: "panel-1"
    });
    const waiting = routeBackgroundPermissionRequest(record, permission());

    expect(waiting.status).toBe("waiting-permission");
    expect(waiting.pendingPermission?.provider).toBe("git");
  });

  it("creates reviewable completion handoff", () => {
    const record = transitionBackgroundAgent(
      createBackgroundAgentRecord({
        id: "bg-1",
        agentId: "reviewer",
        agentLabel: "Reviewer",
        sessionId: "session-1",
        panelId: "panel-1"
      }),
      "running",
      "Working.",
      50
    );
    const completed = completeBackgroundAgentHandoff(record, "main-panel", "Review complete.");

    expect(completed.status).toBe("completed");
    expect(completed.completion).toMatchObject({
      targetPanelId: "main-panel",
      reviewable: true
    });
  });

  it("records failed agents without completing handoff", () => {
    const failed = failBackgroundAgent(
      createBackgroundAgentRecord({
        id: "bg-1",
        agentId: "reviewer",
        agentLabel: "Reviewer",
        sessionId: "session-1",
        panelId: "panel-1"
      }),
      "tool unavailable"
    );

    expect(failed.status).toBe("failed");
    expect(failed.error).toBe("tool unavailable");
    expect(failed.completion).toBeUndefined();
  });
});

describe("ACP foundation", () => {
  it("represents ACP agents as disabled or setup-required runtime profiles", () => {
    expect(defaultAcpAgentDefinitions.every((definition) => definition.launchEnabled === false)).toBe(true);
    expect(defaultAcpAgentDefinitions.map((definition) => definition.setupState)).toEqual([
      "setup-required",
      "disabled"
    ]);
  });

  it("repairs malformed background records safely", () => {
    const repaired = repairBackgroundAgentRecords([
      { id: "bg-1", agentId: "agent", progressPercent: 900, status: "wat", ledger: "nope" },
      { id: "", agentId: "missing" }
    ]);

    expect(repaired[0].status).toBe("queued");
    expect(repaired[0].progressPercent).toBe(100);
    expect(repaired[0].ledger).toEqual([]);
  });
});
