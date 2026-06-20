import { describe, expect, it } from "vitest";
import type {
  CodexLiveSmokeProof,
  CodexTwoPanelSmokeProof
} from "./codexTransportSpike";
import { createDefaultProjectManagementTasks } from "./projectManagementHierarchy";
import { buildPhasePriorityEvidence } from "./phasePriorityEvidence";

const readyLiveSmoke: CodexLiveSmokeProof = {
  source: "desktop",
  checkedAt: "2026-06-10T00:00:00.000Z",
  executed: true,
  ok: true,
  detail: "Live smoke passed.",
  threadIdSeen: true,
  turnIdSeen: true,
  agentDeltaMethodSeen: true,
  turnCompletedSeen: true,
  failedSeen: false,
  expectedTokenSeen: true,
  methodCount: 4,
  uniqueMethods: ["thread/start", "turn/start", "item/agentMessage/delta", "turn/completed"]
};

const readyTwoPanelSmoke: CodexTwoPanelSmokeProof = {
  source: "desktop",
  checkedAt: "2026-06-10T00:00:00.000Z",
  executed: true,
  ok: true,
  detail: "Two-panel live smoke passed.",
  panelCount: 2,
  distinctSessionIds: true,
  distinctThreadIds: true,
  bothCompleted: true,
  crossTalkDetected: false,
  panels: [
    {
      panelId: "orchestrator",
      sessionId: "session-a",
      threadId: "thread-a",
      sessionIdSeen: true,
      threadIdSeen: true,
      completed: true,
      failed: false,
      expectedTokenSeen: true,
      foreignTokenSeen: false,
      eventCount: 8,
      transcriptLength: 2,
      detail: "Panel A complete."
    },
    {
      panelId: "validator",
      sessionId: "session-b",
      threadId: "thread-b",
      sessionIdSeen: true,
      threadIdSeen: true,
      completed: true,
      failed: false,
      expectedTokenSeen: true,
      foreignTokenSeen: false,
      eventCount: 8,
      transcriptLength: 2,
      detail: "Panel B complete."
    }
  ]
};

describe("phase priority evidence", () => {
  it("marks the Phase 1/2/6 slice ready when live, isolation, and PM staging evidence is complete", () => {
    const result = buildPhasePriorityEvidence({
      liveSmokeProof: readyLiveSmoke,
      twoPanelSmokeProof: readyTwoPanelSmoke,
      panelSessionState: {
        orchestrator: {
          panelId: "orchestrator",
          provider: "codex",
          sessionId: "session-a",
          threadId: "thread-a",
          status: "active",
          checkedAt: "2026-06-10T00:00:00.000Z",
          updatedAt: "2026-06-10T00:00:00.000Z",
          stale: false,
          detail: "Panel A active."
        },
        validator: {
          panelId: "validator",
          provider: "codex",
          sessionId: "session-b",
          threadId: "thread-b",
          status: "active",
          checkedAt: "2026-06-10T00:00:00.000Z",
          updatedAt: "2026-06-10T00:00:00.000Z",
          stale: false,
          detail: "Panel B active."
        }
      },
      projectManagementTasks: createDefaultProjectManagementTasks(),
      project: { id: "steerboard", name: "Steerboard" }
    });

    expect(result).toMatchObject({
      state: "ready",
      readiness: 100,
      counts: {
        ready: 3,
        review: 0,
        blocked: 0,
        waiting: 0
      }
    });
    const phase6 = result.items.find((item) => item.id === "phase-6-pm-board");

    expect(phase6?.detail).toContain("12 Epics");
    expect(phase6?.detail).toContain("staged Epic/Parent/Child package coverage");
    expect(phase6?.detail).toContain("phaseRange=0-11");
    expect(phase6?.detail).toContain("staged=epic|parent|child");
    expect(phase6?.nextAction).toBe(
      "Use row-level Run buttons to stage Arena review packages while keeping execution locked."
    );
  });

  it("keeps Phase 6 PM board evidence in review when acceptance child rows are missing", () => {
    const result = buildPhasePriorityEvidence({
      liveSmokeProof: readyLiveSmoke,
      twoPanelSmokeProof: readyTwoPanelSmoke,
      panelSessionState: {
        orchestrator: {
          panelId: "orchestrator",
          provider: "codex",
          sessionId: "session-a",
          threadId: "thread-a",
          status: "active",
          checkedAt: "2026-06-10T00:00:00.000Z",
          updatedAt: "2026-06-10T00:00:00.000Z",
          stale: false,
          detail: "Panel A active."
        },
        validator: {
          panelId: "validator",
          provider: "codex",
          sessionId: "session-b",
          threadId: "thread-b",
          status: "active",
          checkedAt: "2026-06-10T00:00:00.000Z",
          updatedAt: "2026-06-10T00:00:00.000Z",
          stale: false,
          detail: "Panel B active."
        }
      },
      projectManagementTasks: createDefaultProjectManagementTasks().filter(
        (task) => task.id !== "phase-06-child-publish-hold-blocker-priority"
      ),
      project: { id: "steerboard", name: "Steerboard" }
    });
    const phase6 = result.items.find((item) => item.id === "phase-6-pm-board");

    expect(result.state).toBe("review");
    expect(phase6).toMatchObject({
      state: "review",
      nextAction:
        "Restore Phase 6 publish-hold traceability and blocker-priority child rows before trusting PM board evidence."
    });
    expect(phase6?.detail).toContain("phase-06-child-publish-hold-blocker-priority");
  });

  it("keeps live and isolation proof waiting in browser-only state while PM staging is ready", () => {
    const result = buildPhasePriorityEvidence({
      projectManagementTasks: createDefaultProjectManagementTasks()
    });

    expect(result.state).toBe("waiting");
    expect(result.statusLabel).toBe("Waiting");
    expect(result.readiness).toBe(57);
    expect(result.counts).toMatchObject({
      ready: 1,
      waiting: 2
    });
  });

  it("blocks Phase 2 when live panel identities are duplicated", () => {
    const result = buildPhasePriorityEvidence({
      liveSmokeProof: readyLiveSmoke,
      twoPanelSmokeProof: readyTwoPanelSmoke,
      panelSessionState: {
        left: {
          panelId: "left",
          provider: "codex",
          sessionId: "same-session",
          threadId: "thread-a",
          status: "active",
          checkedAt: "2026-06-10T00:00:00.000Z",
          updatedAt: "2026-06-10T00:00:00.000Z",
          stale: false,
          detail: "Left active."
        },
        right: {
          panelId: "right",
          provider: "codex",
          sessionId: "same-session",
          threadId: "thread-b",
          status: "active",
          checkedAt: "2026-06-10T00:00:00.000Z",
          updatedAt: "2026-06-10T00:00:00.000Z",
          stale: false,
          detail: "Right active."
        }
      },
      projectManagementTasks: createDefaultProjectManagementTasks()
    });

    const phase2 = result.items.find((item) => item.id === "phase-2-panel-isolation");

    expect(result.state).toBe("blocked");
    expect(result.statusLabel).toBe("Blocked");
    expect(result.readiness).toBe(72);
    expect(result.counts).toMatchObject({
      ready: 2,
      blocked: 1
    });
    expect(phase2).toMatchObject({
      state: "blocked"
    });
    expect(phase2?.detail).toContain("same-session");
  });
});
