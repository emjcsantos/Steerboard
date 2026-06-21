import { describe, expect, it } from "vitest";
import {
  decideCodexTransport,
  getFallbackCodexActiveTurnControlSmokeProof,
  getFallbackCodexActiveTurnSteerSmokeProof,
  getFallbackCodexLiveSmokeProof,
  getFallbackCodexLiveControlSmokeProof,
  getFallbackCodexTwoPanelSmokeProof,
  getFallbackCodexTransportProbe,
  loadCodexActiveTurnControlSmokeProof,
  loadCodexActiveTurnSteerSmokeProof,
  loadCodexLiveSmokeProof,
  loadCodexLiveControlSmokeProof,
  loadCodexTwoPanelSmokeProof,
  loadCodexTransportProbe,
  normalizeCodexActiveTurnControlSmokeProof,
  normalizeCodexActiveTurnSteerSmokeProof,
  normalizeCodexLiveSmokeProof,
  normalizeCodexLiveControlSmokeProof,
  normalizeCodexTwoPanelSmokeProof,
  normalizeCodexTransportProbe,
  type CodexActiveTurnControlSmokeProof,
  type CodexActiveTurnSteerSmokeProof,
  type CodexLiveSmokeProof,
  type CodexLiveControlSmokeProof,
  type CodexTwoPanelSmokeProof,
  type CodexTransportProbe
} from "./codexTransportSpike";

const readyProbe: CodexTransportProbe = {
  source: "desktop",
  checkedAt: "2026-06-05T12:00:00.000Z",
  cli: {
    available: true,
    version: "codex-cli 0.133.0"
  },
  codexHome: {
    present: true,
    configPresent: true,
    authPresent: true,
    skillsCount: 12,
    pluginsPresent: true
  },
  appServer: {
    available: true,
    stdioHandshake: true,
    daemonLifecycle: "unsupported",
    userAgent: "Codex Desktop/0.133.0",
    platformOs: "windows",
    protocol: {
      threadStart: true,
      turnStart: true,
      turnInterrupt: true,
      turnSteer: true,
      agentMessageDelta: true,
      pluginList: true,
      mcpStatus: true,
      skillsList: true
    }
  },
  execJson: {
    available: true,
    canStreamEvents: true,
    detail: "JSON events are available for non-interactive exec."
  },
  execution: {
    processExecutionAllowed: false,
    promptExecutionAllowed: false,
    detail: "Prompt execution is locked pending desktop approval."
  }
};

const liveProof: CodexLiveSmokeProof = {
  source: "desktop",
  checkedAt: "2026-06-05T13:31:00.000Z",
  executed: true,
  ok: true,
  detail: "Live smoke succeeded.",
  threadIdSeen: true,
  turnIdSeen: true,
  agentDeltaMethodSeen: true,
  turnCompletedSeen: true,
  failedSeen: false,
  expectedTokenSeen: true,
  methodCount: 19,
  uniqueMethods: ["item/agentMessage/delta", "turn/completed"]
};

const liveControlProof: CodexLiveControlSmokeProof = {
  source: "desktop",
  checkedAt: "1780667800000",
  executed: true,
  ok: true,
  unsupported: false,
  detail: "Control smoke succeeded.",
  sourceDetected: true,
  appServerReady: true,
  protocolReady: true,
  requiredMethods: [
    {
      method: "thread/start",
      supported: true,
      state: "supported",
      detail: "Thread creation protocol schema is present."
    },
    {
      method: "turn/interrupt",
      supported: true,
      state: "supported",
      detail: "Turn interrupt protocol schema is present."
    },
    {
      method: "turn/steer",
      supported: true,
      state: "supported",
      detail: "Turn steer protocol schema is present."
    }
  ],
  supportedMethodCount: 3,
  unsupportedMethodCount: 0,
  totalMethodCount: 3
};

const activeTurnControlProof: CodexActiveTurnControlSmokeProof = {
  source: "desktop",
  checkedAt: "2026-06-05T13:50:00.000Z",
  executed: true,
  ok: true,
  unsupported: false,
  detail: "Active-turn control smoke succeeded.",
  sessionStarted: true,
  turnIdSeen: true,
  interruptSent: true,
  interruptObserved: true,
  completed: true,
  failed: false,
  eventCount: 8,
  transcriptLength: 42,
  controls: [
    {
      control: "turn/start",
      attempted: true,
      sent: true,
      observed: true,
      supported: true,
      detail: "Turn-start control schema is present."
    },
    {
      control: "turn/interrupt",
      attempted: true,
      sent: true,
      observed: true,
      supported: true,
      detail: "Turn interrupt control schema is present."
    },
    {
      control: "turn/steer",
      attempted: true,
      sent: false,
      observed: false,
      supported: false,
      detail: "Turn steer control schema is unsupported."
    }
  ]
};

const activeTurnSteerProof: CodexActiveTurnSteerSmokeProof = {
  source: "desktop",
  checkedAt: "2026-06-05T14:12:00.000Z",
  executed: true,
  ok: true,
  unsupported: false,
  detail: "Active-turn steer smoke succeeded.",
  sessionStarted: true,
  turnIdSeen: true,
  steerSent: true,
  steerObserved: true,
  expectedTokenSeen: true,
  completed: true,
  failed: false,
  eventCount: 9,
  transcriptLength: 42,
  controls: [
    {
      control: "turn/start",
      attempted: true,
      sent: true,
      observed: true,
      supported: true,
      detail: "Turn-start control is supported."
    },
    {
      control: "turn/steer",
      attempted: true,
      sent: true,
      observed: true,
      supported: true,
      detail: "Turn-steer control is supported."
    }
  ]
};

const twoPanelProof: CodexTwoPanelSmokeProof = {
  source: "desktop",
  checkedAt: "2026-06-05T13:45:00.000Z",
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
      panelId: "smoke-panel-a",
      sessionId: "session-a",
      threadId: "thread-a",
      sessionIdSeen: true,
      threadIdSeen: true,
      completed: true,
      failed: false,
      expectedTokenSeen: true,
      foreignTokenSeen: false,
      eventCount: 4,
      transcriptLength: 24,
      detail: "Panel A completed."
    },
    {
      panelId: "smoke-panel-b",
      sessionId: "session-b",
      threadId: "thread-b",
      sessionIdSeen: true,
      threadIdSeen: true,
      completed: true,
      failed: false,
      expectedTokenSeen: true,
      foreignTokenSeen: false,
      eventCount: 4,
      transcriptLength: 24,
      detail: "Panel B completed."
    }
  ]
};

describe("codex transport spike", () => {
  it("returns a defensive browser fallback", () => {
    const first = getFallbackCodexTransportProbe();
    const second = getFallbackCodexTransportProbe();

    first.appServer.protocol.threadStart = true;
    first.codexHome.skillsCount = 99;

    expect(second.appServer.protocol.threadStart).toBe(false);
    expect(second.codexHome.skillsCount).toBe(0);
  });

  it("repairs malformed probe payloads to safe locked defaults", () => {
    const probe = normalizeCodexTransportProbe({
      source: "desktop",
      checkedAt: "not a date",
      cli: { available: true, version: "" },
      codexHome: { present: true, skillsCount: -1 },
      appServer: { daemonLifecycle: "maybe", protocol: { threadStart: true } },
      execJson: { detail: "" },
      execution: { processExecutionAllowed: true, promptExecutionAllowed: "yes" }
    });

    expect(probe).toMatchObject({
      source: "desktop",
      checkedAt: null,
      cli: { available: true, version: null },
      codexHome: { present: true, skillsCount: 0 },
      appServer: {
        stdioHandshake: false,
        daemonLifecycle: "unknown",
        protocol: {
          threadStart: true,
          turnStart: false
        }
      },
      execution: {
        processExecutionAllowed: true,
        promptExecutionAllowed: false
      }
    });
  });

  it("normalizes numeric checkedAt timestamps from goal metadata", () => {
    const secondsProbe = normalizeCodexTransportProbe({
      ...readyProbe,
      checkedAt: "1780664392"
    });
    const probe = normalizeCodexTransportProbe({
      ...readyProbe,
      checkedAt: "1780664392000"
    });

    expect(secondsProbe.checkedAt).toBe("2026-06-05T12:59:52.000Z");
    expect(probe.checkedAt).toBe("2026-06-05T12:59:52.000Z");
  });

  it("selects app-server stdio when handshake and panel protocol are proven", () => {
    const decision = decideCodexTransport(readyProbe);

    expect(decision).toMatchObject({
      state: "ready",
      preferredTransport: "app-server-stdio",
      canDetectRuntime: true,
      canStartSession: true,
      canSendPanelMessage: true,
      canStreamAgentDeltas: true,
      proof: "handshake"
    });
    expect(decision.summary).toContain("stdio");
    expect(decision.fallback).toContain("supervised stdio");
  });

  it("marks transport live only after prompt execution is explicitly unlocked", () => {
    const decision = decideCodexTransport({
      ...readyProbe,
      execution: {
        processExecutionAllowed: true,
        promptExecutionAllowed: true,
        detail: "Approved bridge."
      }
    });

    expect(decision).toMatchObject({
      state: "live",
      preferredTransport: "app-server-stdio",
      canSendPanelMessage: true,
      proof: "send-stream"
    });
  });

  it("marks transport live after an explicit send and stream smoke proof", () => {
    const decision = decideCodexTransport(readyProbe, liveProof);

    expect(decision).toMatchObject({
      state: "live",
      preferredTransport: "app-server-stdio",
      canSendPanelMessage: true,
      proof: "send-stream"
    });
    expect(decision.evidence.find((item) => item.id === "codex-send-stream")).toMatchObject({
      status: "live"
    });
  });

  it("keeps failed or malformed live smoke proofs locked", () => {
    const proof = normalizeCodexLiveSmokeProof({
      source: "desktop",
      checkedAt: "1780666260000",
      executed: true,
      ok: false,
      detail: "",
      uniqueMethods: ["turn/completed", 7]
    });
    const decision = decideCodexTransport(readyProbe, proof);

    expect(proof).toMatchObject({
      source: "desktop",
      checkedAt: "2026-06-05T13:31:00.000Z",
      executed: true,
      ok: false,
      uniqueMethods: ["turn/completed"]
    });
    expect(decision).toMatchObject({
      state: "ready",
      canSendPanelMessage: true,
      proof: "handshake"
    });
  });

  it("normalizes live-control smoke proofs into safe typed defaults", () => {
    const proof = normalizeCodexLiveControlSmokeProof({
      source: "desktop",
      checkedAt: "not a date",
      executed: true,
      ok: true,
      detail: "",
      unsupported: true,
      sourceDetected: true,
      appServerReady: false,
      protocolReady: "yes",
      supportedMethodCount: 99,
      unsupportedMethodCount: -4,
      totalMethodCount: 99,
      requiredMethods: [
        {
          method: "turn/start",
          supported: true,
          state: "maybe",
          detail: ""
        },
        {
          method: "turn/interrupt",
          supported: false,
          state: "supported",
          detail: "No interrupt schema."
        },
        { method: "", supported: true }
      ]
    });

    expect(proof).toMatchObject({
      source: "desktop",
      checkedAt: null,
      executed: true,
      ok: true,
      unsupported: true,
      detail: "Browser preview cannot launch a Codex live-control smoke test.",
      sourceDetected: true,
      appServerReady: false,
      protocolReady: false,
      supportedMethodCount: 1,
      unsupportedMethodCount: 1,
      totalMethodCount: 2,
      requiredMethods: [
        {
          method: "turn/start",
          supported: true,
          state: "supported",
          detail: "No control smoke method detail was returned."
        },
        {
          method: "turn/interrupt",
          supported: false,
          state: "unsupported",
          detail: "No interrupt schema."
        }
      ]
    });
  });

  it("normalizes active-turn control smoke proofs into safe typed defaults", () => {
    const proof = normalizeCodexActiveTurnControlSmokeProof({
      source: "desktop",
      checkedAt: "1780667800000",
      executed: true,
      ok: true,
      unsupported: false,
      detail: "",
      sessionStarted: true,
      turnIdSeen: "yes",
      interruptSent: true,
      interruptObserved: false,
      completed: true,
      failed: false,
      eventCount: 12,
      transcriptLength: -1,
      controls: [
        {
          control: "turn/start",
          attempted: true,
          sent: "yes",
          observed: true,
          supported: true,
          detail: "Turn start control is supported."
        },
        {
          control: "",
          attempted: true,
          sent: true,
          observed: false,
          supported: false
        },
        {
          control: "turn/interrupt",
          attempted: true,
          sent: true,
          observed: 1,
          supported: true,
          detail: ""
        }
      ]
    });

    expect(proof).toMatchObject({
      source: "desktop",
      checkedAt: "2026-06-05T13:56:40.000Z",
      executed: true,
      ok: true,
      unsupported: false,
      detail: "Browser preview cannot launch a Codex active-turn control smoke test.",
      sessionStarted: true,
      turnIdSeen: false,
      interruptSent: true,
      interruptObserved: false,
      completed: true,
      failed: false,
      eventCount: 12,
      transcriptLength: 0,
      controls: [
        {
          control: "turn/start",
          attempted: true,
          sent: false,
          observed: true,
          supported: true,
          detail: "Turn start control is supported."
        },
        {
          control: "turn/interrupt",
          attempted: true,
          sent: true,
          observed: false,
          supported: true,
          detail: "No control smoke detail was returned."
        }
      ]
    });
  });

  it("normalizes active-turn steer smoke proofs into safe typed defaults", () => {
    const proof = normalizeCodexActiveTurnSteerSmokeProof({
      source: "desktop",
      checkedAt: "1780668720000",
      executed: true,
      ok: true,
      unsupported: false,
      detail: "",
      sessionStarted: true,
      turnIdSeen: true,
      steerSent: true,
      steerObserved: false,
      expectedTokenSeen: true,
      completed: false,
      failed: false,
      eventCount: 7,
      transcriptLength: -5,
      controls: [
        {
          control: "turn/start",
          attempted: true,
          sent: true,
          observed: "yes",
          supported: true,
          detail: "Turn start control is supported."
        },
        {
          control: "turn/steer",
          attempted: true,
          sent: true,
          observed: true,
          supported: true,
          detail: ""
        },
        { control: "", attempted: true, sent: true }
      ]
    });

    expect(proof).toMatchObject({
      source: "desktop",
      checkedAt: "2026-06-05T14:12:00.000Z",
      executed: true,
      ok: true,
      unsupported: false,
      detail: "Browser preview cannot launch a Codex active-turn steer smoke test.",
      sessionStarted: true,
      turnIdSeen: true,
      steerSent: true,
      steerObserved: false,
      expectedTokenSeen: true,
      completed: false,
      failed: false,
      eventCount: 7,
      transcriptLength: 0,
      controls: [
        {
          control: "turn/start",
          attempted: true,
          sent: true,
          observed: false,
          supported: true,
          detail: "Turn start control is supported."
        },
        {
          control: "turn/steer",
          attempted: true,
          sent: true,
          observed: true,
          supported: true,
          detail: "No control smoke detail was returned."
        }
      ]
    });
  });

  it("falls back to exec-json for one-shot work when app-server handshake is absent", () => {
    const decision = decideCodexTransport({
      ...readyProbe,
      appServer: {
        ...readyProbe.appServer,
        stdioHandshake: false
      }
    });

    expect(decision).toMatchObject({
      state: "preview",
      preferredTransport: "exec-json",
      canStartSession: false,
      canSendPanelMessage: false
    });
    expect(decision.fallback).toContain("one-shot");
  });

  it("keeps browser preview unavailable when no local runtime is visible", () => {
    const decision = decideCodexTransport(getFallbackCodexTransportProbe());

    expect(decision).toMatchObject({
      state: "unavailable",
      preferredTransport: "none",
      canDetectRuntime: false,
      canStartSession: false,
      canSendPanelMessage: false,
      canStreamAgentDeltas: false,
      proof: "none"
    });
  });

  it("normalizes injected desktop probe loads and locks failed loads", async () => {
    await expect(loadCodexTransportProbe(async () => readyProbe)).resolves.toMatchObject({
      source: "desktop",
      cli: { available: true },
      appServer: { stdioHandshake: true }
    });

    await expect(
      loadCodexTransportProbe(async () => {
        throw new Error("probe failed");
      })
    ).resolves.toMatchObject({
      source: "desktop",
      execution: {
        processExecutionAllowed: false,
        promptExecutionAllowed: false
      }
    });
  });

  it("normalizes injected live smoke loads and falls back safely", async () => {
    await expect(loadCodexLiveSmokeProof(async () => liveProof)).resolves.toMatchObject({
      source: "desktop",
      ok: true,
      agentDeltaMethodSeen: true
    });

    await expect(
      loadCodexLiveSmokeProof(async () => {
        throw new Error("smoke failed");
      })
    ).resolves.toMatchObject({
      source: "desktop",
      ok: false,
      executed: false
    });

    expect(getFallbackCodexLiveSmokeProof()).toMatchObject({
      source: "browser",
      ok: false
    });
  });

  it("normalizes injected live-control smoke loads and falls back safely", async () => {
    await expect(loadCodexLiveControlSmokeProof(async () => liveControlProof)).resolves.toMatchObject({
      source: "desktop",
      ok: true,
      protocolReady: true,
      supportedMethodCount: 3
    });

    await expect(
      loadCodexLiveControlSmokeProof(async () => {
        throw new Error("control smoke failed");
      })
    ).resolves.toMatchObject({
      source: "desktop",
      ok: false,
      executed: false
    });

    expect(getFallbackCodexLiveControlSmokeProof()).toMatchObject({
      source: "browser",
      ok: false,
      executed: false,
      unsupported: true
    });
  });

  it("normalizes injected active-turn control smoke loads and falls back safely", async () => {
    await expect(loadCodexActiveTurnControlSmokeProof(async () => activeTurnControlProof)).resolves.toMatchObject({
      source: "desktop",
      ok: true,
      completed: true,
      controls: [
        { control: "turn/start" },
        { control: "turn/interrupt" },
        { control: "turn/steer" }
      ]
    });

    await expect(
      loadCodexActiveTurnControlSmokeProof(async () => {
        throw new Error("active-turn smoke failed");
      })
    ).resolves.toMatchObject({
      source: "desktop",
      ok: false,
      executed: false
    });

    expect(getFallbackCodexActiveTurnControlSmokeProof()).toMatchObject({
      source: "browser",
      ok: false,
      executed: false,
      unsupported: true
    });
  });

  it("normalizes injected active-turn steer smoke loads and falls back safely", async () => {
    await expect(loadCodexActiveTurnSteerSmokeProof(async () => activeTurnSteerProof)).resolves.toMatchObject({
      source: "desktop",
      ok: true,
      steerSent: true,
      steerObserved: true,
      expectedTokenSeen: true,
      controls: [{ control: "turn/start" }, { control: "turn/steer" }]
    });

    await expect(
      loadCodexActiveTurnSteerSmokeProof(async () => {
        throw new Error("active-turn steer smoke failed");
      })
    ).resolves.toMatchObject({
      source: "desktop",
      ok: false,
      executed: false,
      detail: "Codex active-turn steer smoke failed before a transport result was returned."
    });

    expect(getFallbackCodexActiveTurnSteerSmokeProof()).toMatchObject({
      source: "browser",
      ok: false,
      executed: false,
      unsupported: true
    });
  });

  it("normalizes two-panel smoke proof and keeps malformed panels safe", () => {
    const proof = normalizeCodexTwoPanelSmokeProof({
      ...twoPanelProof,
      checkedAt: "1780667100000",
      panels: [
        twoPanelProof.panels[0],
        { panelId: "", ok: true },
        {
          panelId: "smoke-panel-b",
          sessionId: "session-b",
          threadId: "thread-b",
          sessionIdSeen: true,
          threadIdSeen: true,
          completed: true,
          foreignTokenSeen: true,
          eventCount: -10,
          transcriptLength: 3
        }
      ]
    });

    expect(proof).toMatchObject({
      source: "desktop",
      checkedAt: "2026-06-05T13:45:00.000Z",
      ok: true,
      panelCount: 2,
      distinctSessionIds: true,
      distinctThreadIds: true,
      panels: [
        { panelId: "smoke-panel-a", expectedTokenSeen: true },
        {
          panelId: "smoke-panel-b",
          expectedTokenSeen: false,
          foreignTokenSeen: true,
          eventCount: 0
        }
      ]
    });
  });

  it("loads two-panel smoke proof and falls back safely", async () => {
    await expect(loadCodexTwoPanelSmokeProof(async () => twoPanelProof)).resolves.toMatchObject({
      source: "desktop",
      ok: true,
      distinctThreadIds: true,
      panels: [{ panelId: "smoke-panel-a" }, { panelId: "smoke-panel-b" }]
    });

    await expect(
      loadCodexTwoPanelSmokeProof(async () => {
        throw new Error("two panel smoke failed");
      })
    ).resolves.toMatchObject({
      source: "desktop",
      ok: false,
      detail: "Codex two-panel live smoke failed before a transport result was returned."
    });

    expect(getFallbackCodexTwoPanelSmokeProof()).toMatchObject({
      source: "browser",
      executed: false,
      ok: false,
      panelCount: 0
    });
  });
});
