import type { SessionSummary } from "./fixtures";
import type {
  CodexPanelEventPayload,
  CodexPanelTurnResultPayload,
  CodexSessionMessage,
  CodexSessionState
} from "./codexSession";
import {
  buildCommandExecutionDecision,
  defaultCommandCatalog,
  getCommandCatalogSuggestions,
  findCommandCatalogEntry,
  type CommandExecutionFeedback,
  type CommandCatalogEntry,
  type CommandCatalogState
} from "./commandCatalog";

export type PanelChatRole = "codex" | "user" | "tool" | "system";

export type PanelChatSectionKind = "reasoning" | "steps" | "commands" | "trace";

export interface PanelChatSection {
  id: string;
  kind: PanelChatSectionKind;
  title: string;
  summary: string;
  body: string;
}

export interface PanelChatMessage {
  id: string;
  role: PanelChatRole;
  label: string;
  body: string;
  meta: string;
  sections?: PanelChatSection[];
}

export type PanelSlashCommand = CommandCatalogEntry;

export type PanelSlashCommandRoute = "none" | "provider" | "local-preview" | "blocked";

export interface PanelSlashCommandDecision {
  command?: PanelSlashCommand;
  executable: boolean;
  reason: string;
  feedback: CommandExecutionFeedback;
  route: PanelSlashCommandRoute;
  state: CommandCatalogState | "unknown";
}

export type PanelLiveTurnEvidenceState = "ready" | "review" | "blocked";

export interface PanelLiveTurnEvidence {
  state: PanelLiveTurnEvidenceState;
  statusLabel: string;
  eventCount: number;
  agentDeltaCount: number;
  turnStatusCount: number;
  errorCount: number;
  unknownEventCount: number;
  knownEventKindCount: number;
  providerEventCoverageReady: boolean;
  canExtendStreamingEvidence: boolean;
  transcriptLength: number;
  completed: boolean;
  interrupted: boolean;
  failed: boolean;
  detail: string;
  nextAction: string;
}

export const PANEL_CHAT_STORAGE_KEY = "steerboard.panel.chat.v1";

export const panelSlashCommands: readonly PanelSlashCommand[] = defaultCommandCatalog;

function roleLabel(role: SessionSummary["role"]): string {
  switch (role) {
    case "orchestrator":
      return "Codex Orchestrator";
    case "implementer":
      return "Worker";
    case "validator":
      return "Validator";
    case "integration":
      return "Integrator";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPanelChatSection(value: unknown): value is PanelChatSection {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    (value.kind === "reasoning" || value.kind === "steps" || value.kind === "commands" || value.kind === "trace") &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    typeof value.body === "string"
  );
}

function isPanelChatMessage(value: unknown): value is PanelChatMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    (value.role === "codex" || value.role === "user" || value.role === "tool" || value.role === "system") &&
    typeof value.label === "string" &&
    typeof value.body === "string" &&
    typeof value.meta === "string" &&
    (value.sections === undefined || (Array.isArray(value.sections) && value.sections.every(isPanelChatSection)))
  );
}

function normalizePanelChatMessage(message: PanelChatMessage): PanelChatMessage {
  if (!message.sections || message.sections.length === 0) {
    return {
      id: message.id,
      role: message.role,
      label: message.label,
      body: message.body,
      meta: message.meta
    };
  }

  return {
    id: message.id,
    role: message.role,
    label: message.label,
    body: message.body,
    meta: message.meta,
    sections: message.sections
      .filter(isPanelChatSection)
      .filter((section) => section.body.trim().length > 0)
  };
}

function isStaleLivePendingMessage(message: PanelChatMessage): boolean {
  return (
    message.role === "system" &&
    message.label === "Steerboard" &&
    message.meta === "running" &&
    /live Codex|Codex turn is running|Starting Codex/i.test(message.body)
  );
}

function isLiveEvidenceMessage(message: PanelChatMessage): boolean {
  return (
    message.label === "Live evidence" ||
    message.meta.toLowerCase().startsWith("live evidence")
  );
}

function isLiveRecoveryMessage(message: PanelChatMessage): boolean {
  return (
    isStaleLivePendingMessage(message) ||
    message.meta.toLowerCase() === "live recovery"
  );
}

function eventType(event: CodexPanelEventPayload): string {
  return event.eventType || event.method || "unknown";
}

function countEvents(
  events: readonly CodexPanelEventPayload[],
  predicate: (event: CodexPanelEventPayload) => boolean
): number {
  return events.filter(predicate).length;
}

export function buildInitialPanelChat(session: SessionSummary): PanelChatMessage[] {
  const visibleTranscript = session.transcript.slice(0, 3);
  const transcriptMessages = visibleTranscript.map((line, index) => ({
    id: `${session.id}:transcript:${index}`,
    role: index === 0 ? "codex" as const : "tool" as const,
    label: index === 0 ? roleLabel(session.role) : "Activity",
    body: line,
    meta: index === 0 ? "session context" : `event ${index}`
  }));

  return [
    {
      id: `${session.id}:system`,
      role: "system",
      label: "Steerboard",
      body:
        "This lane is a local provider-ready chat surface. Messages are saved locally and can route through Codex once the connection is enabled.",
      meta: "local"
    },
    ...transcriptMessages,
    {
      id: `${session.id}:validation`,
      role: "codex",
      label: roleLabel(session.role),
      body: `Current validation: ${session.validation}`,
      meta: session.state
    }
  ];
}

export function getPanelSlashCommandSuggestions(
  value: string,
  catalog: readonly PanelSlashCommand[] = panelSlashCommands
): PanelSlashCommand[] {
  const panelScopedCatalog = catalog.filter((entry) => entry.scopes.includes("panel"));
  return getCommandCatalogSuggestions(value, panelScopedCatalog);
}

export function getPanelSlashCommandDecision(
  submittedMessage: string,
  liveTransportAvailable: boolean,
  catalog: readonly PanelSlashCommand[] = panelSlashCommands
): PanelSlashCommandDecision {
  const trimmed = submittedMessage.trim();

  if (!trimmed.startsWith("/")) {
    return {
      executable: true,
      reason: "Message is not a slash command.",
      feedback: {
        statusLabel: "Local message",
        severity: "info",
        nextAction: "Send without slash-command routing."
      },
      route: "none",
      state: "unknown"
    };
  }

  const entry = findCommandCatalogEntry(trimmed, catalog);
  if (entry && !entry.scopes.includes("panel")) {
    return {
      command: entry,
      executable: false,
      reason: `${entry.command} is not available in this panel context.`,
      feedback: {
        statusLabel: "Unsupported",
        severity: "error",
        nextAction: "Use a supported command that is enabled for this panel."
      },
      route: "blocked",
      state: "unsupported"
    };
  }

  const decision = buildCommandExecutionDecision(trimmed, liveTransportAvailable, catalog);
  if (!decision.executable) {
    return {
      command: decision.entry,
      executable: false,
      reason: decision.reason,
      feedback: decision.feedback,
      route: "blocked",
      state: decision.entry ? decision.state : "unknown"
    };
  }

  return {
    command: decision.entry,
    executable: true,
    reason: decision.reason,
    feedback: decision.feedback,
    route: decision.state === "preview" ? "local-preview" : "provider",
    state: decision.state
  };
}

export function createPanelReplyMessage(
  session: SessionSummary,
  sequence: number,
  submittedMessage = "",
  catalog: readonly PanelSlashCommand[] = panelSlashCommands,
  liveTransportAvailable = false
): PanelChatMessage {
  const decision = getPanelSlashCommandDecision(submittedMessage, liveTransportAvailable, catalog);

  if (decision.command && decision.route === "local-preview") {
    const statusLabel = decision.feedback.statusLabel.toLowerCase();
    return {
      id: `${session.id}:codex-reply:${sequence}`,
      role: "codex",
      label: roleLabel(session.role),
      body: `${decision.command.command} is in ${statusLabel}. ${decision.reason} ${decision.feedback.nextAction}`,
      meta: "slash command preview"
    };
  }

  if (decision.route === "provider") {
    return createPanelProviderSlashCommandStatusMessage(session, sequence, decision);
  }

  if (decision.route === "blocked") {
    return createPanelSlashCommandStatusMessage(session, sequence, decision);
  }

  return {
    id: `${session.id}:codex-reply:${sequence}`,
    role: "codex",
    label: roleLabel(session.role),
    body:
      "Captured locally. This panel is ready to route the message through the connected provider when live session transport is enabled.",
    meta: "local adapter pending"
  };
}

export function createPanelSlashCommandStatusMessage(
  session: SessionSummary,
  sequence: number,
  decision: PanelSlashCommandDecision
): PanelChatMessage {
  return {
    id: `${session.id}:slash-command:${sequence}`,
    role: "system",
    label: "Slash command",
    body: decision.command
      ? `${decision.feedback.statusLabel}: ${decision.command.command} ${decision.reason} ${decision.feedback.nextAction}`
      : `${decision.feedback.statusLabel}: ${decision.reason} ${decision.feedback.nextAction}`,
    meta: decision.route === "blocked" ? "slash command blocked" : "slash command"
  };
}

export function createPanelProviderSlashCommandStatusMessage(
  session: SessionSummary,
  sequence: number,
  decision: PanelSlashCommandDecision
): PanelChatMessage {
  return {
    id: `${session.id}:slash-command:${sequence}`,
    role: "system",
    label: "Slash command",
    body: `${decision.command?.command ?? "slash command"} routed through provider. ${
      decision.reason
    } ${decision.feedback.nextAction}`,
    meta: "slash command provider route"
  };
}

export function createPanelLiveStatusMessage(
  session: SessionSummary,
  sequence: number,
  body: string,
  meta = "live codex"
): PanelChatMessage {
  return {
    id: `${session.id}:live-status:${sequence}`,
    role: "system",
    label: "Steerboard",
    body,
    meta
  };
}

export function createPanelLiveErrorMessage(
  session: SessionSummary,
  sequence: number,
  body: string
): PanelChatMessage {
  return {
    id: `${session.id}:live-error:${sequence}`,
    role: "system",
    label: "Codex connection",
    body,
    meta: "live error"
  };
}

export function buildPanelLiveTurnEvidence(
  result: CodexPanelTurnResultPayload
): PanelLiveTurnEvidence {
  const events = result.events;
  const agentDeltaCount = countEvents(
    events,
    (event) => eventType(event) === "agent_delta" && Boolean(event.delta)
  );
  const turnStatusCount = countEvents(events, (event) => eventType(event) === "turn_status");
  const errorCount = countEvents(events, (event) => eventType(event) === "error");
  const unknownEventCount = countEvents(
    events,
    (event) => !["agent_delta", "turn_status", "error"].includes(eventType(event))
  );
  const knownEventKindCount = new Set(
    events
      .map(eventType)
      .filter((type) => ["agent_delta", "turn_status", "error"].includes(type))
  ).size;
  const transcriptLength = result.transcript.trim().length;
  const hasStreamSignal = agentDeltaCount > 0 || transcriptLength > 0;
  const hasTerminalSignal = turnStatusCount > 0 || result.completed || result.interrupted || result.failed;
  const providerEventCoverageReady =
    events.length > 0 &&
    agentDeltaCount > 0 &&
    turnStatusCount > 0 &&
    errorCount === 0 &&
    unknownEventCount === 0 &&
    result.completed &&
    !result.interrupted &&
    !result.failed;
  const canExtendStreamingEvidence = providerEventCoverageReady;
  const state: PanelLiveTurnEvidenceState = result.failed
    ? "blocked"
    : result.interrupted || !hasStreamSignal || !hasTerminalSignal
      ? "review"
      : "ready";
  const statusLabel = state === "ready" ? "Ready" : state === "blocked" ? "Blocked" : "Review";
  const detail =
    `streamProof events=${events.length} deltas=${agentDeltaCount} turnStatus=${turnStatusCount} ` +
    `errors=${errorCount} unknown=${unknownEventCount} knownKinds=${knownEventKindCount} ` +
    `providerCoverage=${providerEventCoverageReady ? "ready" : "held"} ` +
    `richerStreaming=${canExtendStreamingEvidence ? "ready" : "held"} ` +
    `transcriptChars=${transcriptLength} ` +
    `completed=${result.completed ? "yes" : "no"} interrupted=${result.interrupted ? "yes" : "no"} failed=${result.failed ? "yes" : "no"}.`;
  const nextAction = result.failed
    ? "Keep the failed turn evidence attached, retry only after checking provider/session state, and preserve the original prompt for recovery."
    : result.interrupted
      ? "Keep interruption evidence attached and retry or steer only after the owner confirms the next action."
      : state === "ready"
        ? canExtendStreamingEvidence
          ? "Keep live stream, provider event coverage, and completion evidence attached before extending richer streaming evidence."
          : "Keep live stream and completion evidence attached; richer streaming evidence remains held until provider event coverage is stable."
        : "Review stream and completion evidence before treating this panel turn as hardened.";

  return {
    state,
    statusLabel,
    eventCount: events.length,
    agentDeltaCount,
    turnStatusCount,
    errorCount,
    unknownEventCount,
    knownEventKindCount,
    providerEventCoverageReady,
    canExtendStreamingEvidence,
    transcriptLength,
    completed: result.completed,
    interrupted: result.interrupted,
    failed: result.failed,
    detail,
    nextAction
  };
}

export function createPanelLiveTurnEvidenceMessage(
  session: SessionSummary,
  sequence: number,
  evidence: PanelLiveTurnEvidence
): PanelChatMessage {
  return {
    id: `${session.id}:live-evidence:${sequence}`,
    role: "system",
    label: "Live evidence",
    body: `${evidence.statusLabel}: ${evidence.detail} ${evidence.nextAction}`,
    meta: `live evidence ${evidence.state}`
  };
}

export function createPanelLiveRecoveryMessage(
  session: SessionSummary,
  sequence: number,
  errorMessage: string,
  lastPrompt = ""
): PanelChatMessage {
  const promptStatus = lastPrompt.trim().length > 0 ? "original prompt preserved" : "original prompt missing";

  return {
    id: `${session.id}:live-recovery:${sequence}`,
    role: "system",
    label: "Recovery",
    body:
      `Recovery evidence: live turn failed with "${errorMessage}". ${promptStatus}; ` +
      "retry remains gated by session-control readiness and should preserve panel scope.",
    meta: "live recovery"
  };
}

function codexRoleToPanelRole(role: CodexSessionMessage["role"]): PanelChatRole {
  switch (role) {
    case "user":
      return "user";
    case "tool":
      return "tool";
    case "system":
      return "system";
    case "assistant":
      return "codex";
  }
}

function rawPanelEvent(value: unknown): CodexPanelEventPayload | undefined {
  if (!isRecord(value) || typeof value.method !== "string") {
    return undefined;
  }

  return value as unknown as CodexPanelEventPayload;
}

function compactLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function eventDisplayLine(event: CodexPanelEventPayload): string {
  const parts = [
    event.method,
    event.itemType ? `type=${event.itemType}` : "",
    event.itemStatus ? `status=${event.itemStatus}` : event.status ? `status=${event.status}` : "",
    event.itemTitle ? `title=${event.itemTitle}` : "",
    event.summary ? `summary=${event.summary}` : "",
    event.message ? `message=${event.message}` : ""
  ].filter(Boolean);

  return compactLine(parts.join(" | "));
}

function traceSection(
  turnId: string,
  kind: PanelChatSectionKind,
  title: string,
  lines: readonly string[]
): PanelChatSection | undefined {
  const body = lines.map(compactLine).filter(Boolean).join("\n");
  if (!body) {
    return undefined;
  }

  return {
    id: `${turnId}:${kind}`,
    kind,
    title,
    summary: `${lines.length} ${lines.length === 1 ? "entry" : "entries"}`,
    body
  };
}

function buildCodexTraceSections(
  state: CodexSessionState,
  turnId: string | undefined
): PanelChatSection[] {
  if (!turnId) {
    return [];
  }

  const providerEvents = state.unknownEvents
    .filter((event) => !event.turnId || event.turnId === turnId)
    .map((event) => rawPanelEvent(event.raw))
    .filter((event): event is CodexPanelEventPayload => Boolean(event));
  const turn = state.turns.find((item) => item.id === turnId);
  const toolMessages = state.messages.filter(
    (message) => message.turnId === turnId && message.role === "tool" && message.body.trim().length > 0
  );
  const reasoningLines = [
    turn?.prompt ? `Prompt accepted: ${turn.prompt}` : "",
    turn?.summary ? `Turn summary: ${turn.summary}` : "",
    turn?.error ? `Turn error: ${turn.error}` : "",
    ...providerEvents
      .filter((event) =>
        /reason|thinking|analysis|plan|status|tokenUsage|rateLimits/i.test(
          `${event.method} ${event.itemType ?? ""} ${event.itemTitle ?? ""} ${event.summary ?? ""}`
        )
      )
      .map(eventDisplayLine)
  ];
  const stepLines = [
    ...providerEvents
      .filter((event) => /thread|turn|item\/started|item\/completed|warning/i.test(event.method))
      .map(eventDisplayLine)
  ];
  const commandLines = [
    ...toolMessages.map((message) => compactLine(message.body)),
    ...providerEvents
      .filter((event) =>
        /tool|command|exec|shell|terminal|mcp|patch|script/i.test(
          `${event.method} ${event.itemType ?? ""} ${event.itemTitle ?? ""} ${event.summary ?? ""} ${event.message ?? ""}`
        )
      )
      .map(eventDisplayLine)
  ];
  const rawTraceLines = providerEvents.map(eventDisplayLine);

  return [
    traceSection(turnId, "reasoning", "Reasoning and Status", reasoningLines),
    traceSection(turnId, "steps", "Steps", stepLines),
    traceSection(turnId, "commands", "Commands, Scripts, and Tools", commandLines),
    traceSection(turnId, "trace", "Raw Event Trace", rawTraceLines)
  ].filter((section): section is PanelChatSection => Boolean(section));
}

export function codexSessionStateToPanelMessages(
  session: SessionSummary,
  state: CodexSessionState,
  sequenceStart = 0
): PanelChatMessage[] {
  return state.messages
    .filter((message) => message.body.trim().length > 0)
    .map((message, index) => ({
      id: `${session.id}:live:${message.id}:${sequenceStart + index}`,
      role: codexRoleToPanelRole(message.role),
      label: message.role === "assistant" ? "Codex Live" : message.role,
      body: message.body,
      meta: message.status,
      sections: message.role === "assistant" ? buildCodexTraceSections(state, message.turnId) : undefined
    }));
}

export function normalizePanelChatMessages(
  value: unknown,
  fallback: PanelChatMessage[]
): PanelChatMessage[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const messages = value
    .filter(isPanelChatMessage)
    .map(normalizePanelChatMessage)
    .filter((message) => !isLiveEvidenceMessage(message))
    .filter((message) => !isLiveRecoveryMessage(message));
  return messages.length > 0 ? messages : fallback;
}

export function parseStoredPanelChatThreads(
  serialized: string | null
): Record<string, PanelChatMessage[]> {
  if (!serialized) {
    return {};
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([sessionId, messages]) => [
        sessionId,
        normalizePanelChatMessages(messages, [])
      ]).filter(([, messages]) => messages.length > 0)
    );
  } catch {
    return {};
  }
}

export function loadPanelChatMessages(session: SessionSummary): PanelChatMessage[] {
  const fallback = buildInitialPanelChat(session);

  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = parseStoredPanelChatThreads(window.localStorage.getItem(PANEL_CHAT_STORAGE_KEY));
  return normalizePanelChatMessages(stored[session.id], fallback);
}

export function savePanelChatMessages(sessionId: string, messages: PanelChatMessage[]) {
  if (typeof window === "undefined") {
    return;
  }

  const stored = parseStoredPanelChatThreads(window.localStorage.getItem(PANEL_CHAT_STORAGE_KEY));
  window.localStorage.setItem(
    PANEL_CHAT_STORAGE_KEY,
    JSON.stringify({
      ...stored,
      [sessionId]: normalizePanelChatMessages(messages, [])
    })
  );
}
