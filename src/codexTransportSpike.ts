import { hasTauriRuntime } from "./tauriRuntime";

export type CodexProbeSource = "browser" | "desktop";
export type CodexTransportState = "unavailable" | "preview" | "ready" | "live" | "blocked";
export type CodexTransportId = "app-server-stdio" | "app-server-daemon" | "exec-json" | "none";
export type CodexDaemonLifecycle = "available" | "unsupported" | "unknown";
export type CodexSendStreamProof = "none" | "schema" | "handshake" | "send-stream";
export type CodexAuthMode = "chatgpt" | "api-key" | "present-unknown" | "missing";
export type CodexAuthBilling =
  | "chatgpt-entitlement"
  | "api-billing"
  | "unknown"
  | "not-connected";

export interface CodexCliProbe {
  available: boolean;
  version: string | null;
}

export interface CodexHomeProbe {
  present: boolean;
  configPresent: boolean;
  authPresent: boolean;
  authMode: CodexAuthMode;
  authBilling: CodexAuthBilling;
  authDetail: string;
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

export interface CodexLiveSmokeProof {
  source: CodexProbeSource;
  checkedAt: string | null;
  executed: boolean;
  ok: boolean;
  detail: string;
  threadIdSeen: boolean;
  turnIdSeen: boolean;
  agentDeltaMethodSeen: boolean;
  turnCompletedSeen: boolean;
  failedSeen: boolean;
  expectedTokenSeen: boolean;
  methodCount: number;
  uniqueMethods: string[];
}

export interface CodexLiveControlSmokeProof {
  source: CodexProbeSource;
  checkedAt: string | null;
  executed: boolean;
  ok: boolean;
  unsupported: boolean;
  detail: string;
  sourceDetected: boolean;
  appServerReady: boolean;
  protocolReady: boolean;
  requiredMethods: CodexLiveControlSmokeMethodProof[];
  supportedMethodCount: number;
  unsupportedMethodCount: number;
  totalMethodCount: number;
}

export interface CodexLiveControlSmokeMethodProof {
  method: string;
  supported: boolean;
  state: string;
  detail: string;
}

export interface CodexActiveTurnControlSmokeMethodProof {
  control: string;
  attempted: boolean;
  sent: boolean;
  observed: boolean;
  supported: boolean;
  detail: string;
}

export interface CodexActiveTurnControlSmokeProof {
  source: CodexProbeSource;
  checkedAt: string | null;
  executed: boolean;
  ok: boolean;
  unsupported: boolean;
  detail: string;
  sessionStarted: boolean;
  turnIdSeen: boolean;
  interruptSent: boolean;
  interruptObserved: boolean;
  completed: boolean;
  failed: boolean;
  eventCount: number;
  transcriptLength: number;
  controls: CodexActiveTurnControlSmokeMethodProof[];
}

export interface CodexActiveTurnSteerSmokeProof {
  source: CodexProbeSource;
  checkedAt: string | null;
  executed: boolean;
  ok: boolean;
  unsupported: boolean;
  detail: string;
  sessionStarted: boolean;
  turnIdSeen: boolean;
  steerSent: boolean;
  steerObserved: boolean;
  expectedTokenSeen: boolean;
  completed: boolean;
  failed: boolean;
  eventCount: number;
  transcriptLength: number;
  controls: CodexActiveTurnControlSmokeMethodProof[];
}

export interface CodexTwoPanelSmokePanelProof {
  panelId: string;
  sessionId: string | null;
  threadId: string | null;
  sessionIdSeen: boolean;
  threadIdSeen: boolean;
  completed: boolean;
  failed: boolean;
  expectedTokenSeen: boolean;
  foreignTokenSeen: boolean;
  eventCount: number;
  transcriptLength: number;
  detail: string;
}

export interface CodexTwoPanelSmokeProof {
  source: CodexProbeSource;
  checkedAt: string | null;
  executed: boolean;
  ok: boolean;
  detail: string;
  panelCount: number;
  distinctSessionIds: boolean;
  distinctThreadIds: boolean;
  bothCompleted: boolean;
  crossTalkDetected: boolean;
  panels: CodexTwoPanelSmokePanelProof[];
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
    authMode: "missing",
    authBilling: "not-connected",
    authDetail: "No Codex account is available in browser preview.",
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

const fallbackLiveSmokeProof: CodexLiveSmokeProof = {
  source: "browser",
  checkedAt: null,
  executed: false,
  ok: false,
  detail: "Browser preview cannot launch a Codex live smoke test.",
  threadIdSeen: false,
  turnIdSeen: false,
  agentDeltaMethodSeen: false,
  turnCompletedSeen: false,
  failedSeen: false,
  expectedTokenSeen: false,
  methodCount: 0,
  uniqueMethods: []
};

const fallbackLiveControlSmokeProof: CodexLiveControlSmokeProof = {
  source: "browser",
  checkedAt: null,
  executed: false,
  ok: false,
  unsupported: true,
  detail: "Browser preview cannot launch a Codex live-control smoke test.",
  sourceDetected: false,
  appServerReady: false,
  protocolReady: false,
  requiredMethods: [],
  supportedMethodCount: 0,
  unsupportedMethodCount: 0,
  totalMethodCount: 0
};

const fallbackActiveTurnControlSmokeProof: CodexActiveTurnControlSmokeProof = {
  source: "browser",
  checkedAt: null,
  executed: false,
  ok: false,
  unsupported: true,
  detail: "Browser preview cannot launch a Codex active-turn control smoke test.",
  sessionStarted: false,
  turnIdSeen: false,
  interruptSent: false,
  interruptObserved: false,
  completed: false,
  failed: false,
  eventCount: 0,
  transcriptLength: 0,
  controls: []
};

const fallbackActiveTurnSteerSmokeProof: CodexActiveTurnSteerSmokeProof = {
  source: "browser",
  checkedAt: null,
  executed: false,
  ok: false,
  unsupported: true,
  detail: "Browser preview cannot launch a Codex active-turn steer smoke test.",
  sessionStarted: false,
  turnIdSeen: false,
  steerSent: false,
  steerObserved: false,
  expectedTokenSeen: false,
  completed: false,
  failed: false,
  eventCount: 0,
  transcriptLength: 0,
  controls: []
};

const fallbackTwoPanelSmokeProof: CodexTwoPanelSmokeProof = {
  source: "browser",
  checkedAt: null,
  executed: false,
  ok: false,
  detail: "Browser preview cannot launch a Codex two-panel live smoke test.",
  panelCount: 0,
  distinctSessionIds: false,
  distinctThreadIds: false,
  bothCompleted: false,
  crossTalkDetected: false,
  panels: []
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function daemonLifecycle(value: unknown): CodexDaemonLifecycle {
  return value === "available" || value === "unsupported" || value === "unknown"
    ? value
    : "unknown";
}

function authMode(value: unknown, authPresent: boolean): CodexAuthMode {
  if (
    value === "chatgpt" ||
    value === "api-key" ||
    value === "present-unknown" ||
    value === "missing"
  ) {
    return value;
  }

  return authPresent ? "present-unknown" : "missing";
}

function authBilling(value: unknown, mode: CodexAuthMode): CodexAuthBilling {
  if (
    value === "chatgpt-entitlement" ||
    value === "api-billing" ||
    value === "unknown" ||
    value === "not-connected"
  ) {
    return value;
  }

  if (mode === "chatgpt") return "chatgpt-entitlement";
  if (mode === "api-key") return "api-billing";
  if (mode === "missing") return "not-connected";
  return "unknown";
}

function defaultAuthDetail(mode: CodexAuthMode): string {
  if (mode === "chatgpt") {
    return "ChatGPT/Codex sign-in detected; usage should follow that entitlement.";
  }

  if (mode === "api-key") {
    return "API key sign-in detected; API billing may apply.";
  }

  if (mode === "present-unknown") {
    return "Codex auth is present; sign-in type could not be classified safely.";
  }

  return "No Codex sign-in was detected. Sign in with Codex, then refresh.";
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
  const codexHomeAuthPresent = bool(codexHome.authPresent);
  const codexHomeAuthMode = authMode(codexHome.authMode, codexHomeAuthPresent);
  const codexHomeAuthBilling = authBilling(codexHome.authBilling, codexHomeAuthMode);

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
      authPresent: codexHomeAuthPresent,
      authMode: codexHomeAuthMode,
      authBilling: codexHomeAuthBilling,
      authDetail: optionalString(codexHome.authDetail) ?? defaultAuthDetail(codexHomeAuthMode),
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

export function getFallbackCodexLiveSmokeProof(): CodexLiveSmokeProof {
  return {
    ...fallbackLiveSmokeProof,
    uniqueMethods: [...fallbackLiveSmokeProof.uniqueMethods]
  };
}

export function getFallbackCodexLiveControlSmokeProof(): CodexLiveControlSmokeProof {
  return {
    ...fallbackLiveControlSmokeProof,
    requiredMethods: fallbackLiveControlSmokeProof.requiredMethods.map((method) => ({ ...method }))
  };
}

export function normalizeCodexLiveSmokeProof(value: unknown): CodexLiveSmokeProof {
  if (!isRecord(value)) {
    return getFallbackCodexLiveSmokeProof();
  }

  const fallback = getFallbackCodexLiveSmokeProof();

  return {
    source: value.source === "desktop" ? "desktop" : "browser",
    checkedAt: optionalDate(value.checkedAt),
    executed: bool(value.executed),
    ok: bool(value.ok),
    detail: optionalString(value.detail) ?? fallback.detail,
    threadIdSeen: bool(value.threadIdSeen),
    turnIdSeen: bool(value.turnIdSeen),
    agentDeltaMethodSeen: bool(value.agentDeltaMethodSeen),
    turnCompletedSeen: bool(value.turnCompletedSeen),
    failedSeen: bool(value.failedSeen),
    expectedTokenSeen: bool(value.expectedTokenSeen),
    methodCount: nonNegativeInteger(value.methodCount),
    uniqueMethods: stringArray(value.uniqueMethods)
  };
}

export function normalizeCodexLiveControlSmokeProof(
  value: unknown
): CodexLiveControlSmokeProof {
  if (!isRecord(value)) {
    return getFallbackCodexLiveControlSmokeProof();
  }

  const fallback = getFallbackCodexLiveControlSmokeProof();
  const requiredMethods = Array.isArray(value.requiredMethods)
    ? value.requiredMethods
        .map(normalizeCodexLiveControlSmokeMethodProof)
        .filter((method): method is CodexLiveControlSmokeMethodProof => Boolean(method))
    : [];
  const supportedMethodCount = requiredMethods.length > 0
    ? requiredMethods.filter((method) => method.supported).length
    : nonNegativeInteger(value.supportedMethodCount);
  const totalMethodCount = requiredMethods.length > 0
    ? requiredMethods.length
    : nonNegativeInteger(value.totalMethodCount);
  const unsupportedMethodCount = requiredMethods.length > 0
    ? totalMethodCount - supportedMethodCount
    : nonNegativeInteger(value.unsupportedMethodCount);

  return {
    source: value.source === "desktop" ? "desktop" : "browser",
    checkedAt: optionalDate(value.checkedAt),
    executed: bool(value.executed),
    ok: bool(value.ok),
    unsupported: bool(value.unsupported),
    detail: optionalString(value.detail) ?? fallback.detail,
    sourceDetected: bool(value.sourceDetected),
    appServerReady: bool(value.appServerReady),
    protocolReady: bool(value.protocolReady),
    requiredMethods,
    supportedMethodCount,
    unsupportedMethodCount,
    totalMethodCount
  };
}

function normalizeCodexLiveControlSmokeMethodProof(
  value: unknown
): CodexLiveControlSmokeMethodProof | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const method = optionalString(value.method);
  if (!method) {
    return undefined;
  }

  const supported = bool(value.supported);
  return {
    method,
    supported,
    state: supported ? "supported" : "unsupported",
    detail: optionalString(value.detail) ?? "No control smoke method detail was returned."
  };
}

function normalizeCodexActiveTurnControlSmokeMethodProof(
  value: unknown
): CodexActiveTurnControlSmokeMethodProof | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const control = optionalString(value.control);
  if (!control) {
    return undefined;
  }

  return {
    control,
    attempted: bool(value.attempted),
    sent: bool(value.sent),
    observed: bool(value.observed),
    supported: bool(value.supported),
    detail: optionalString(value.detail) ?? "No control smoke detail was returned."
  };
}

function normalizeTwoPanelSmokePanelProof(value: unknown): CodexTwoPanelSmokePanelProof | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const panelId = optionalString(value.panelId);
  if (!panelId) {
    return undefined;
  }

  return {
    panelId,
    sessionId: optionalString(value.sessionId),
    threadId: optionalString(value.threadId),
    sessionIdSeen: bool(value.sessionIdSeen),
    threadIdSeen: bool(value.threadIdSeen),
    completed: bool(value.completed),
    failed: bool(value.failed),
    expectedTokenSeen: bool(value.expectedTokenSeen),
    foreignTokenSeen: bool(value.foreignTokenSeen),
    eventCount: nonNegativeInteger(value.eventCount),
    transcriptLength: nonNegativeInteger(value.transcriptLength),
    detail: optionalString(value.detail) ?? "No panel smoke detail was returned."
  };
}

export function getFallbackCodexTwoPanelSmokeProof(): CodexTwoPanelSmokeProof {
  return {
    ...fallbackTwoPanelSmokeProof,
    panels: fallbackTwoPanelSmokeProof.panels.map((panel) => ({ ...panel }))
  };
}

export function getFallbackCodexActiveTurnControlSmokeProof(): CodexActiveTurnControlSmokeProof {
  return {
    ...fallbackActiveTurnControlSmokeProof,
    controls: fallbackActiveTurnControlSmokeProof.controls.map((control) => ({ ...control }))
  };
}

export function getFallbackCodexActiveTurnSteerSmokeProof(): CodexActiveTurnSteerSmokeProof {
  return {
    ...fallbackActiveTurnSteerSmokeProof,
    controls: fallbackActiveTurnSteerSmokeProof.controls.map((control) => ({ ...control }))
  };
}

export function normalizeCodexTwoPanelSmokeProof(value: unknown): CodexTwoPanelSmokeProof {
  if (!isRecord(value)) {
    return getFallbackCodexTwoPanelSmokeProof();
  }

  const fallback = getFallbackCodexTwoPanelSmokeProof();
  const panels = Array.isArray(value.panels)
    ? value.panels
        .map(normalizeTwoPanelSmokePanelProof)
        .filter((panel): panel is CodexTwoPanelSmokePanelProof => Boolean(panel))
    : [];

  return {
    source: value.source === "desktop" ? "desktop" : "browser",
    checkedAt: optionalDate(value.checkedAt),
    executed: bool(value.executed),
    ok: bool(value.ok),
    detail: optionalString(value.detail) ?? fallback.detail,
    panelCount: nonNegativeInteger(value.panelCount),
    distinctSessionIds: bool(value.distinctSessionIds),
    distinctThreadIds: bool(value.distinctThreadIds),
    bothCompleted: bool(value.bothCompleted),
    crossTalkDetected: bool(value.crossTalkDetected),
    panels
  };
}

export function normalizeCodexActiveTurnControlSmokeProof(
  value: unknown
): CodexActiveTurnControlSmokeProof {
  if (!isRecord(value)) {
    return getFallbackCodexActiveTurnControlSmokeProof();
  }

  const fallback = getFallbackCodexActiveTurnControlSmokeProof();
  const controls = Array.isArray(value.controls)
    ? value.controls
        .map(normalizeCodexActiveTurnControlSmokeMethodProof)
        .filter((control): control is CodexActiveTurnControlSmokeMethodProof => Boolean(control))
    : [];

  return {
    source: value.source === "desktop" ? "desktop" : "browser",
    checkedAt: optionalDate(value.checkedAt),
    executed: bool(value.executed),
    ok: bool(value.ok),
    unsupported: bool(value.unsupported),
    detail: optionalString(value.detail) ?? fallback.detail,
    sessionStarted: bool(value.sessionStarted),
    turnIdSeen: bool(value.turnIdSeen),
    interruptSent: bool(value.interruptSent),
    interruptObserved: bool(value.interruptObserved),
    completed: bool(value.completed),
    failed: bool(value.failed),
    eventCount: nonNegativeInteger(value.eventCount),
    transcriptLength: nonNegativeInteger(value.transcriptLength),
    controls
  };
}

export function normalizeCodexActiveTurnSteerSmokeProof(
  value: unknown
): CodexActiveTurnSteerSmokeProof {
  if (!isRecord(value)) {
    return getFallbackCodexActiveTurnSteerSmokeProof();
  }

  const fallback = getFallbackCodexActiveTurnSteerSmokeProof();
  const controls = Array.isArray(value.controls)
    ? value.controls
        .map(normalizeCodexActiveTurnControlSmokeMethodProof)
        .filter((control): control is CodexActiveTurnControlSmokeMethodProof => Boolean(control))
    : [];

  return {
    source: value.source === "desktop" ? "desktop" : "browser",
    checkedAt: optionalDate(value.checkedAt),
    executed: bool(value.executed),
    ok: bool(value.ok),
    unsupported: bool(value.unsupported),
    detail: optionalString(value.detail) ?? fallback.detail,
    sessionStarted: bool(value.sessionStarted),
    turnIdSeen: bool(value.turnIdSeen),
    steerSent: bool(value.steerSent),
    steerObserved: bool(value.steerObserved),
    expectedTokenSeen: bool(value.expectedTokenSeen),
    completed: bool(value.completed),
    failed: bool(value.failed),
    eventCount: nonNegativeInteger(value.eventCount),
    transcriptLength: nonNegativeInteger(value.transcriptLength),
    controls
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

export function decideCodexTransport(
  probeInput: unknown,
  liveProofInput?: unknown
): CodexTransportDecision {
  const probe = normalizeCodexTransportProbe(probeInput);
  const liveProof = liveProofInput ? normalizeCodexLiveSmokeProof(liveProofInput) : undefined;
  const liveProofOk = liveProof?.ok === true;
  const protocolReady = hasPanelProtocol(probe);
  const appServerReady = probe.appServer.available && probe.appServer.stdioHandshake && protocolReady;
  const cliOnlyFallback = probe.cli.available && probe.execJson.available;
  const sendStreamProven = appServerReady && (probe.execution.promptExecutionAllowed || liveProofOk);
  const canSendPanelMessage = appServerReady;
  const proof: CodexSendStreamProof = sendStreamProven
    ? "send-stream"
    : appServerReady
      ? "handshake"
      : protocolReady
        ? "schema"
        : "none";
  const state: CodexTransportState = sendStreamProven
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
        id: "codex-account",
        label: "Codex account",
        detail: probe.codexHome.authDetail,
        status:
          probe.codexHome.authMode === "chatgpt" || probe.codexHome.authMode === "api-key"
            ? "ready"
            : probe.codexHome.authMode === "present-unknown"
              ? "preview"
              : "unavailable"
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
        label: "Live test",
        detail: canSendPanelMessage
          ? sendStreamProven && liveProofOk
            ? "Live smoke returned the expected token via agent message delta."
            : sendStreamProven
              ? "Prompt send and stream path is explicitly unlocked."
              : "Panel session commands can start and send live Codex turns; send/stream proof is pending."
          : "Prompt send remains locked until the app-server panel protocol is ready.",
        status: sendStreamProven ? "live" : canSendPanelMessage ? "ready" : "preview"
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
    return "Codex app-server is live: Steerboard can start a session, send a turn, and stream normalized events.";
  }

  if (preferredTransport === "app-server-stdio" && proof === "handshake") {
    return "Codex app-server stdio is ready: local detection, no-prompt handshake, and panel protocol are proven; live send/stream proof is pending.";
  }

  if (preferredTransport === "exec-json") {
    return "Codex CLI JSON exec is available as a one-shot fallback, but it is not a live multi-panel app-server session.";
  }

  if (probe.cli.available) {
    return "Codex CLI is detected, but Steerboard has not proven a stable app-server connection yet.";
  }

  return "Codex is not reachable from this Steerboard surface.";
}

function buildFallback(probe: CodexTransportProbe, preferredTransport: CodexTransportId): string {
  if (preferredTransport === "app-server-stdio") {
    return probe.appServer.daemonLifecycle === "unsupported"
      ? "Use the supervised local app-server stdio path; managed daemon lifecycle is not available on this platform."
      : "Use the supervised local app-server stdio path before daemon mode unless daemon health checks are available.";
  }

  if (preferredTransport === "exec-json") {
    return "Use codex exec --json only for deliberate one-shot tasks; it cannot resume panel chat state or provide full Arena session control.";
  }

  return "Keep panel chat in local preview mode and show setup guidance until Codex CLI, account, and app-server readiness are detected.";
}

async function invokeCodexTransportProbe(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return getFallbackCodexTransportProbe();
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_transport_probe");
}

async function invokeCodexLiveSmokeProof(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return getFallbackCodexLiveSmokeProof();
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_transport_live_smoke");
}

async function invokeCodexLiveControlSmokeProof(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return getFallbackCodexLiveControlSmokeProof();
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_transport_live_control_smoke");
}

async function invokeCodexTwoPanelSmokeProof(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return getFallbackCodexTwoPanelSmokeProof();
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_transport_two_panel_smoke");
}

async function invokeCodexActiveTurnSteerSmokeProof(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return getFallbackCodexActiveTurnSteerSmokeProof();
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_transport_active_turn_steer_smoke");
}

async function invokeCodexActiveTurnControlSmokeProof(): Promise<unknown> {
  if (!hasTauriRuntime()) {
    return getFallbackCodexActiveTurnControlSmokeProof();
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("codex_transport_active_turn_control_smoke");
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
          detail: "Codex app-server probe failed; execution remains locked."
        }
      };
  }
}

export async function loadCodexLiveSmokeProof(
  invokeProof: () => Promise<unknown> = invokeCodexLiveSmokeProof
): Promise<CodexLiveSmokeProof> {
  try {
    if (!hasTauriRuntime() && invokeProof === invokeCodexLiveSmokeProof) {
      return getFallbackCodexLiveSmokeProof();
    }

    return normalizeCodexLiveSmokeProof(await invokeProof());
  } catch {
    return {
      ...getFallbackCodexLiveSmokeProof(),
      source: "desktop",
      detail: "Codex live smoke failed before a transport result was returned."
    };
  }
}

export async function loadCodexLiveControlSmokeProof(
  invokeProof: () => Promise<unknown> = invokeCodexLiveControlSmokeProof
): Promise<CodexLiveControlSmokeProof> {
  try {
    if (!hasTauriRuntime() && invokeProof === invokeCodexLiveControlSmokeProof) {
      return getFallbackCodexLiveControlSmokeProof();
    }

    return normalizeCodexLiveControlSmokeProof(await invokeProof());
  } catch {
    return {
      ...getFallbackCodexLiveControlSmokeProof(),
      source: "desktop",
      detail: "Codex live-control smoke failed before a transport result was returned."
    };
  }
}

export async function loadCodexTwoPanelSmokeProof(
  invokeProof: () => Promise<unknown> = invokeCodexTwoPanelSmokeProof
): Promise<CodexTwoPanelSmokeProof> {
  try {
    if (!hasTauriRuntime() && invokeProof === invokeCodexTwoPanelSmokeProof) {
      return getFallbackCodexTwoPanelSmokeProof();
    }

    return normalizeCodexTwoPanelSmokeProof(await invokeProof());
  } catch {
    return {
      ...getFallbackCodexTwoPanelSmokeProof(),
      source: "desktop",
      detail: "Codex two-panel live smoke failed before a transport result was returned."
    };
  }
}

export async function loadCodexActiveTurnControlSmokeProof(
  invokeProof: () => Promise<unknown> = invokeCodexActiveTurnControlSmokeProof
): Promise<CodexActiveTurnControlSmokeProof> {
  try {
    if (!hasTauriRuntime() && invokeProof === invokeCodexActiveTurnControlSmokeProof) {
      return getFallbackCodexActiveTurnControlSmokeProof();
    }

    return normalizeCodexActiveTurnControlSmokeProof(await invokeProof());
  } catch {
    return {
      ...getFallbackCodexActiveTurnControlSmokeProof(),
      source: "desktop",
      detail: "Codex active-turn control smoke failed before a transport result was returned."
    };
  }
}

export async function loadCodexActiveTurnSteerSmokeProof(
  invokeProof: () => Promise<unknown> = invokeCodexActiveTurnSteerSmokeProof
): Promise<CodexActiveTurnSteerSmokeProof> {
  try {
    if (!hasTauriRuntime() && invokeProof === invokeCodexActiveTurnSteerSmokeProof) {
      return getFallbackCodexActiveTurnSteerSmokeProof();
    }

    return normalizeCodexActiveTurnSteerSmokeProof(await invokeProof());
  } catch {
    return {
      ...getFallbackCodexActiveTurnSteerSmokeProof(),
      source: "desktop",
      detail: "Codex active-turn steer smoke failed before a transport result was returned."
    };
  }
}
