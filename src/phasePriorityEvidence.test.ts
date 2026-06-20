import { describe, expect, it } from "vitest";
import type {
  CodexLiveSmokeProof,
  CodexTwoPanelSmokeProof
} from "./codexTransportSpike";
import { createDefaultProjectManagementTasks } from "./projectManagementHierarchy";
import { buildPhasePriorityEvidence } from "./phasePriorityEvidence";
import {
  buildRuntimeStreamIsolationProof,
  createRuntimeStreamPanelRouterState,
  reduceRuntimeStreamPanelRouter
} from "./runtimeStream";

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
    expect(phase6?.detail).toContain("savedStateProof=");
    expect(phase6?.detail).toMatch(/currentPlanRows=\d+\/\d+/);
    expect(phase6?.detail).toContain("duplicateCurrentRows=0");
    expect(phase6?.detail).toContain("stagedCurrentRows=0");
    expect(phase6?.detail).toContain("collapsedCurrentRows=0");
    expect(phase6?.nextAction).toBe(
      "Use row-level Run buttons to stage Arena review packages while keeping execution locked."
    );
    const phase1 = result.items.find((item) => item.id === "phase-1-live-panel");
    expect(phase1?.detail).toContain("signalProof=7/7");
    expect(phase1?.detail).toContain("methodCount=4");
    expect(phase1?.detail).toContain("uniqueMethods=4");
    expect(phase1?.detail).toContain(
      "methods=item/agentMessage/delta|thread/start|turn/completed|turn/start"
    );
    expect(phase1?.detail).toContain(
      "reloadProof=source:desktop executed=true timestamped=true storageTrusted=true"
    );
    const phase2 = result.items.find((item) => item.id === "phase-2-panel-isolation");
    expect(phase2?.detail).toContain(
      "smokeProof=source:desktop executed=true timestamped=true ok=true distinctSessions=true distinctThreads=true bothCompleted=true crossTalk=false"
    );
    expect(phase2?.detail).toContain("panelProof=2/2");
    expect(phase2?.detail).toContain("sessionIdPanels=2/2");
    expect(phase2?.detail).toContain("threadIdPanels=2/2");
    expect(phase2?.detail).toContain("eventCount=16");
    expect(phase2?.detail).toContain("transcriptLength=4");
    expect(phase2?.detail).toContain("expectedTokenPanels=2");
    expect(phase2?.detail).toContain("foreignTokenPanels=0");
    expect(phase2?.detail).toContain("Restored 2/2 saved panel session labels");
    expect(phase2?.detail).toContain(
      "restoreProof=panels=2 fresh=2 stale=0 duplicateIdentities=0 restored=orchestrator|validator stalePanels=none"
    );
  });

  it("names Phase 6 saved-state proof counts for preserved staged and collapsed PM rows", () => {
    const projectManagementTasks = createDefaultProjectManagementTasks().map((task) => {
      if (task.id === "phase-06-planning-lane") {
        return { ...task, collapsed: true, runState: "staged" as const };
      }

      if (task.id === "phase-06-parent-phase-board") {
        return { ...task, collapsed: true };
      }

      if (task.id === "phase-06-child-current-phase-map") {
        return { ...task, runState: "staged" as const };
      }

      return task;
    });
    const result = buildPhasePriorityEvidence({
      liveSmokeProof: readyLiveSmoke,
      twoPanelSmokeProof: readyTwoPanelSmoke,
      projectManagementTasks
    });
    const phase6 = result.items.find((item) => item.id === "phase-6-pm-board");

    expect(result.state).toBe("ready");
    expect(phase6?.detail).toContain("duplicateCurrentRows=0");
    expect(phase6?.detail).toContain("stagedCurrentRows=2");
    expect(phase6?.detail).toContain("collapsedCurrentRows=2");
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

  it("names exact missing Phase 1 stream signals after an incomplete desktop proof", () => {
    const result = buildPhasePriorityEvidence({
      liveSmokeProof: {
        ...readyLiveSmoke,
        ok: false,
        agentDeltaMethodSeen: false,
        expectedTokenSeen: false
      },
      twoPanelSmokeProof: readyTwoPanelSmoke,
      projectManagementTasks: createDefaultProjectManagementTasks()
    });
    const phase1 = result.items.find((item) => item.id === "phase-1-live-panel");

    expect(result.state).toBe("review");
    expect(phase1).toMatchObject({
      state: "review"
    });
    expect(phase1?.detail).toContain("desktop smoke result");
    expect(phase1?.detail).toContain("agent delta");
    expect(phase1?.detail).toContain("expected token");
    expect(phase1?.detail).toContain("signalProof=4/7");
    expect(phase1?.detail).toContain("methodCount=4");
    expect(phase1?.detail).toContain(
      "methods=item/agentMessage/delta|thread/start|turn/completed|turn/start"
    );
  });

  it("keeps Phase 1 proof in review when reload timestamp is missing", () => {
    const result = buildPhasePriorityEvidence({
      liveSmokeProof: {
        ...readyLiveSmoke,
        checkedAt: null
      },
      twoPanelSmokeProof: readyTwoPanelSmoke,
      projectManagementTasks: createDefaultProjectManagementTasks()
    });
    const phase1 = result.items.find((item) => item.id === "phase-1-live-panel");

    expect(result.state).toBe("review");
    expect(phase1).toMatchObject({
      state: "review"
    });
    expect(phase1?.detail).toContain("reload timestamp");
    expect(phase1?.detail).toContain(
      "reloadProof=source:desktop executed=true timestamped=false storageTrusted=false"
    );
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

  it("keeps Phase 2 in review when saved panel labels do not restore", () => {
    const result = buildPhasePriorityEvidence({
      liveSmokeProof: readyLiveSmoke,
      twoPanelSmokeProof: readyTwoPanelSmoke,
      panelSessionState: {},
      projectManagementTasks: createDefaultProjectManagementTasks()
    });
    const phase2 = result.items.find((item) => item.id === "phase-2-panel-isolation");

    expect(result.state).toBe("review");
    expect(phase2).toMatchObject({
      state: "review",
      nextAction:
        "Reload the app and confirm at least two fresh saved panel session labels restore before trusting Phase 2 persistence."
    });
    expect(phase2?.detail).toContain("No saved panel session labels restored after reload.");
    expect(phase2?.detail).toContain(
      "restoreProof=panels=0 fresh=0 stale=0 duplicateIdentities=0 restored=none stalePanels=none"
    );
  });

  it("names compact Phase 2 panel proof counts when smoke proof is incomplete", () => {
    const result = buildPhasePriorityEvidence({
      liveSmokeProof: readyLiveSmoke,
      twoPanelSmokeProof: {
        ...readyTwoPanelSmoke,
        ok: false,
        bothCompleted: false,
        panels: [
          readyTwoPanelSmoke.panels[0],
          {
            ...readyTwoPanelSmoke.panels[1],
            sessionIdSeen: false,
            threadIdSeen: false,
            completed: false,
            expectedTokenSeen: false,
            foreignTokenSeen: true
          }
        ]
      },
      projectManagementTasks: createDefaultProjectManagementTasks()
    });
    const phase2 = result.items.find((item) => item.id === "phase-2-panel-isolation");

    expect(result.state).toBe("review");
    expect(phase2).toMatchObject({
      state: "review"
    });
    expect(phase2?.detail).toContain(
      "smokeProof=source:desktop executed=true timestamped=true ok=false distinctSessions=true distinctThreads=true bothCompleted=false crossTalk=false"
    );
    expect(phase2?.detail).toContain("panelProof=1/2");
    expect(phase2?.detail).toContain("sessionIdPanels=1/2");
    expect(phase2?.detail).toContain("threadIdPanels=1/2");
    expect(phase2?.detail).toContain("eventCount=16");
    expect(phase2?.detail).toContain("transcriptLength=4");
    expect(phase2?.detail).toContain("expectedTokenPanels=1");
    expect(phase2?.detail).toContain("foreignTokenPanels=1");
  });

  it("blocks Phase 2 when route isolation proof reports quarantined stream events", () => {
    const routed = reduceRuntimeStreamPanelRouter(
      createRuntimeStreamPanelRouterState([
        { panelId: "orchestrator", provider: "codex", sessionId: "session-a" },
        { panelId: "validator", provider: "codex", sessionId: "session-b" }
      ]),
      [
        {
          panelId: "validator",
          provider: "codex",
          sessionId: "session-a",
          turnId: "turn-1",
          turnSequence: 1,
          events: [
            {
              id: "foreign-token",
              sourceEventId: "foreign-token:source",
              eventKind: "run",
              label: "Foreign token",
              detail: "Wrong session reached the validator panel.",
              adapterStatus: "blocked",
              reason: "session/provider mismatch",
              sequence: 1
            }
          ]
        }
      ]
    );

    const result = buildPhasePriorityEvidence({
      liveSmokeProof: readyLiveSmoke,
      twoPanelSmokeProof: readyTwoPanelSmoke,
      runtimeStreamIsolationProof: buildRuntimeStreamIsolationProof(routed),
      projectManagementTasks: createDefaultProjectManagementTasks()
    });
    const phase2 = result.items.find((item) => item.id === "phase-2-panel-isolation");

    expect(result.state).toBe("blocked");
    expect(phase2).toMatchObject({
      state: "blocked",
      nextAction: "Repair panel-keyed stream routing before trusting two-panel isolation proof."
    });
    expect(phase2?.detail).toContain("session/provider");
  });
});
