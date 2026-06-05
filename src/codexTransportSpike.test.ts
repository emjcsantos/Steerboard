import { describe, expect, it } from "vitest";
import {
  decideCodexTransport,
  getFallbackCodexLiveSmokeProof,
  getFallbackCodexTransportProbe,
  loadCodexLiveSmokeProof,
  loadCodexTransportProbe,
  normalizeCodexLiveSmokeProof,
  normalizeCodexTransportProbe,
  type CodexLiveSmokeProof,
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
      canSendPanelMessage: false,
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
      canSendPanelMessage: false,
      proof: "handshake"
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
});
