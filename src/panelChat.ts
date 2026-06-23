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

export interface PanelChatMessage {
  id: string;
  role: PanelChatRole;
  label: string;
  body: string;
  meta: string;
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

function isPanelChatMessage(value: unknown): value is PanelChatMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    (value.role === "codex" || value.role === "user" || value.role === "tool" || value.role === "system") &&
    typeof value.label === "string" &&
    typeof value.body === "string" &&
    typeof value.meta === "string"
  );
}

function isStaleLivePendingMessage(message: PanelChatMessage): boolean {
  return (
    message.role === "system" &&
    message.label === "Steerboard" &&
    message.meta === "running" &&
    /live Codex|Codex turn is running|Starting Codex/i.test(message.body)
  );
}

function repairStaleLivePendingMessage(message: PanelChatMessage): PanelChatMessage {
  if (!isStaleLivePendingMessage(message)) {
    return message;
  }

  return {
    ...message,
    label: "Codex connection",
    body:
      "Previous live Codex turn did not finish before the panel was reloaded. Retry after refreshing the Codex connection.",
    meta: "live recovery"
  };
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
      meta: message.status
    }));
}

export function normalizePanelChatMessages(
  value: unknown,
  fallback: PanelChatMessage[]
): PanelChatMessage[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const messages = value.filter(isPanelChatMessage).map(repairStaleLivePendingMessage);
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
