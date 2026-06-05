export type CodexProbeSource = "browser" | "desktop";
export type CodexTransportState = "unavailable" | "preview" | "ready" | "live" | "blocked";
export type CodexTransportId = "app-server-stdio" | "app-server-daemon" | "exec-json" | "none";
export type CodexDaemonLifecycle = "available" | "unsupported" | "unknown";
export type CodexSendStreamProof = "none" | "schema" | "handshake" | "send-stream";

export interface CodexCliProbe {
  available: boolean;
  version: string | null;
}

export interface CodexHomeProbe {
  present: boolean;
  configPresent: boolean;
  authPresent: boolean;
  skillsCount: number;
  pluginsPresent: boolean;
}

export interface CodexAppServerProtocolProbe {
  threadStart: boolean;
  turnStart: boolean;
  turnInterrupt: boolean;
  turnSteer: boolean;
  agentMessageDelta: boolean;
  pluginList: boolean;
  mcpStatus: boolean;
  skillsList: boolean;
}

export interface CodexAppServerProbe {
  available: boolean;
  stdioHandshake: boolean;
  daemonLifecycle: CodexDaemonLifecycle;
  userAgent: string | null;
  platformOs: string | null;
  protocol: CodexAppServerProtocolProbe;
}

export interface CodexExecJsonProbe {
  available: boolean;
  canStreamEvents: boolean;
  detail: string;
}

export interface CodexExecutionProbe {
  processExecutionAllowed: boolean;
  promptExecutionAllowed: boolean;
  detail: string;
}

export interface CodexTransportProbe {
  source: CodexProbeSource;
  checkedAt: string | null;
  cli: CodexCliProbe;
  codexHome: CodexHomeProbe;
  appServer: CodexAppServerProbe;
  execJson: CodexExecJsonProbe;
  execution: CodexExecutionProbe;
}

export interface CodexTransportEvidenceItem {
  id: string;
  label: string;
  detail: string;
  status: CodexTransportState;
}

export interface CodexTransportDecision {
  state: CodexTransportState;
  preferredTransport: CodexTransportId;
  canDetectRuntime: boolean;
  canStartSession: boolean;
  canSendPanelMessage: boolean;
  canStreamAgentDeltas: boolean;
  proof: CodexSendStreamProof;
  summary: string;
  fallback: string;
  evidence: CodexTransportEvidenceItem[];
}

type UnknownRecord = Record<string, unknown>;

const emptyProtocol: CodexAppServerProtocolProbe = {
  threadStart: false,
  turnStart: false,
  turnInterrupt: false,
  turnSteer: false,
  agentMessageDelta: false,
  pluginList: false,
  mcpStatus: false,
  skillsList: false
};

const fallbackProbe: CodexTransportProbe = {
  source: "browser",
  checkedAt: null,
  cli: {
    available: false,
    version: null
  },
  codexHome: {
    present: false,
    configPresent: false,
    authPresent: false,
    skillsCount: 0,
    pluginsPresent: false
  },
  appServer: {
    available: false,
    stdioHandshake: false,
    daemonLifecycle: "unknown",
    userAgent: null,
    platformOs: null,
    protocol: emptyProtocol
  },
  execJson: {
    available: false,
    canStreamEvents: false,
    detail: "Codex CLI is unavailable in browser preview."
  },
  execution: {
    processExecutionAllowed: false,
    promptExecutionAllowed: false,
    detail: "Browser preview cannot launch local Codex processes."
  }
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function optionalDate(value: unknown): string | null {
  const text = optionalString(value);
  if (!text) return null;

  const numericTimestamp = Number(text);
  if (Number.isFinite(numericTimestamp) && numericTimestamp > 0) {
    const milliseconds = numericTimestamp < 100_000_000_000 ? numericTimestamp * 1000 : numericTimestamp;
    return new Date(milliseconds).toISOString();
  }

  return !Number.isNaN(Date.parse(text)) ? text : null;
}

function bool(value: unknown): boolean {
  return value === true;
}

function nonNegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

function daemonLifecycle(value: unknown): CodexDaemonLifecycle {
  return value === "available" || value === "unsupported" || value === "unknown"
    ? value
    : "unknown";
}

function normalizeProtocol(value: unknown): CodexAppServerProtocolProbe {
  const protocol = isRecord(value) ? value : {};
  return {
    threadStart: bool(protocol.threadStart),
    turnStart: bool(protocol.turnStart),
    turnInterrupt: bool(protocol.turnInterrupt),
    turnSteer: bool(protocol.turnSteer),
    agentMessageDelta: bool(protocol.agentMessageDelta),
    pluginList: bool(protocol.pluginList),
    mcpStatus: bool(protocol.mcpStatus),
    skillsList: bool(protocol.skillsList)
  };
}

export function getFallbackCodexTransportProbe(): CodexTransportProbe {
  return {
    ...fallbackProbe,
    cli: { ...fallbackProbe.cli },
    codexHome: { ...fallbackProbe.codexHome },
    appServer: {
      ...fallbackProbe.appServer,
      protocol: { ...fallbackProbe.appServer.protocol }
    },
    execJson: { ...fallbackProbe.execJson },
    execution: { ...fallbackProbe.execution }
  };
}

export function normalizeCodexTransportProbe(value: unknown): CodexTransportProbe {
  if (!isRecord(value)) {
    return getFallbackCodexTransportProbe();
  }

  const cli = isRecord(value.cli) ? value.cli : {};
  const codexHome = isRecord(value.codexHome) ? value.codexHome : {};
  const appServer = isRecord(value.appServer) ? value.appServer : {};
  const execJson = isRecord(value.execJson) ? value.execJson : {};
  const execution = isRecord(value.execution) ? value.execution : {};
  const fallback = getFallbackCodexTransportProbe();

  return {
    source: value.source === "desktop" ? "desktop" : "browser",
    checkedAt: optionalDate(value.checkedAt),
    cli: {
      available: bool(cli.available),
      version: optionalString(cli.version)
    },
    codexHome: {
      present: bool(codexHome.present),
      configPresent: bool(codexHome.configPresent),
      authPresent: bool(codexHome.authPresent),
      skillsCount: nonNegativeInteger(codexHome.skillsCount),
      pluginsPresent: bool(codexHome.pluginsPresent)
    },
    appServer: {
      available: bool(appServer.available),
      stdioHandshake: bool(appServer.stdioHandshake),
      daemonLifecycle: daemonLifecycle(appServer.daemonLifecycle),
      userAgent: optionalString(appServer.userAgent),
      platformOs: optionalString(appServer.platformOs),
      protocol: normalizeProtocol(appServer.protocol)
    },
    execJson: {
      available: bool(execJson.available),
      canStreamEvents: bool(execJson.canStreamEvents),
      detail: optionalString(execJson.detail) ?? fallback.execJson.detail
    },
    execution: {
      processExecutionAllowed: bool(execution.processExecutionAllowed),
      promptExecutionAllowed: bool(execution.promptExecutionAllowed),
      detail: optionalString(execution.detail) ?? fallback.execution.detail
    }
  };
}

function hasPanelProtocol(probe: CodexTransportProbe): boolean {
  return (
    probe.appServer.protocol.threadStart &&
    probe.appServer.protocol.turnStart &&
    probe.appServer.protocol.agentMessageDelta
  );
}

function evidenceStatus(value: boolean, readyState: CodexTransportState = "ready"): CodexTransportState {
  return value ? readyState : "blocked";
}

export function decideCodexTransport(probeInput: unknown): CodexTransportDecision {
  const probe = normalizeCodexTransportProbe(probeInput);
  const protocolReady = hasPanelProtocol(probe);
  const appServerReady = probe.appServer.available && probe.appServer.stdioHandshake && protocolReady;
  const cliOnlyFallback = probe.cli.available && probe.execJson.available;
  const canSendPanelMessage = appServerReady && probe.execution.promptExecutionAllowed;
  const proof: CodexSendStreamProof = canSendPanelMessage
    ? "send-stream"
    : appServerReady
      ? "handshake"
      : protocolReady
        ? "schema"
        : "none";
  const state: CodexTransportState = canSendPanelMessage
    ? "live"
    : appServerReady
      ? "ready"
      : cliOnlyFallback
        ? "preview"
        : probe.cli.available
          ? "preview"
          : "unavailable";
  const preferredTransport: CodexTransportId = appServerReady
    ? "app-server-stdio"
    : cliOnlyFallback
      ? "exec-json"
      : probe.appServer.daemonLifecycle === "available"
        ? "app-server-daemon"
        : "none";

  return {
    state,
    preferredTransport,
    canDetectRuntime: probe.cli.available,
    canStartSession: appServerReady,
    canSendPanelMessage,
    canStreamAgentDeltas: appServerReady,
    proof,
    summary: buildSummary(probe, state, preferredTransport, proof),
    fallback: buildFallback(probe, preferredTransport),
    evidence: [
      {
        id: "codex-cli",
        label: "Codex CLI",
        detail: probe.cli.version ? `Detected ${probe.cli.version}` : "Codex CLI was not detected.",
        status: evidenceStatus(probe.cli.available)
      },
      {
        id: "codex-home",
        label: "Local profile",
        detail: probe.codexHome.present
          ? `Config ${probe.codexHome.configPresent ? "present" : "missing"}, auth ${probe.codexHome.authPresent ? "present" : "not copied"}, skills ${probe.codexHome.skillsCount}`
          : "Codex profile directory was not detected.",
        status: evidenceStatus(probe.codexHome.present, "preview")
      },
      {
        id: "codex-app-server",
        label: "App-server stdio",
        detail: probe.appServer.stdioHandshake
          ? "No-prompt initialize handshake succeeded."
          : "No app-server handshake has been proven.",
        status: evidenceStatus(probe.appServer.stdioHandshake)
      },
      {
        id: "codex-panel-protocol",
        label: "Panel protocol",
        detail: protocolReady
          ? "thread/start, turn/start, and agent message deltas are present."
          : "Panel session methods are incomplete or unavailable.",
        status: evidenceStatus(protocolReady)
      },
      {
        id: "codex-send-stream",
        label: "Send/stream proof",
        detail: canSendPanelMessage
          ? "Prompt send and stream path is unlocked."
          : "Prompt send remains locked until an explicit execution approval bridge exists.",
        status: canSendPanelMessage ? "live" : "preview"
      }
    ]
  };
}

function buildSummary(
  probe: CodexTransportProbe,
  state: CodexTransportState,
  preferredTransport: CodexTransportId,
  proof: CodexSendStreamProof
): string {
  if (state === "live") {
    return "Codex panel transport is live: Steerboard can start a session, send a turn, and stream normalized events.";
  }

  if (preferredTransport === "app-server-stdio" && proof === "handshake") {
    return "Codex app-server stdio is the safest available transport: local detection and no-prompt handshake are proven, while prompt execution remains locked.";
  }

  if (preferredTransport === "exec-json") {
    return "Codex CLI JSON exec is available as a one-shot fallback, but it is not a live multi-panel session transport.";
  }

  if (probe.cli.available) {
    return "Codex CLI is detected, but Steerboard has not proven a stable panel session transport yet.";
  }

  return "Codex is not reachable from this Steerboard surface.";
}

function buildFallback(probe: CodexTransportProbe, preferredTransport: CodexTransportId): string {
  if (preferredTransport === "app-server-stdio") {
    return probe.appServer.daemonLifecycle === "unsupported"
      ? "Managed app-server daemon lifecycle is unavailable on this platform, so Steerboard should launch a supervised stdio app-server only after explicit desktop approval."
      : "Use supervised app-server stdio before daemon mode unless daemon health checks are available.";
  }

  if (preferredTransport === "exec-json") {
    return "Use codex exec --json only for deliberate one-shot tasks; it cannot resume panel chat state or provide full cockpit session control.";
  }

  return "Keep panel chat in local preview mode and show setup guidance until Codex CLI and app-server protocol readiness are detected.";
}

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invokeCodexTransportProbe(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return getFallbackCodexTransportProbe();
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_transport_probe");
}

export async function loadCodexTransportProbe(
  invokeProbe: () => Promise<unknown> = invokeCodexTransportProbe
): Promise<CodexTransportProbe> {
  try {
    if (!hasTauriRuntime() && invokeProbe === invokeCodexTransportProbe) {
      return getFallbackCodexTransportProbe();
    }

    return normalizeCodexTransportProbe(await invokeProbe());
  } catch {
    return {
      ...getFallbackCodexTransportProbe(),
      source: "desktop",
      execution: {
        processExecutionAllowed: false,
        promptExecutionAllowed: false,
        detail: "Codex transport probe failed; execution remains locked."
      }
    };
  }
}
