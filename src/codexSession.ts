export type CodexSessionConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export type CodexSessionTurnStatus =
  | "pending"
  | "streaming"
  | "completed"
  | "failed"
  | "interrupted";

export type CodexSessionMessageRole = "assistant" | "user" | "tool" | "system";

export type CodexSessionEventKind =
  | "thread_started"
  | "turn_started"
  | "agent_delta"
  | "item_completed"
  | "turn_completed"
  | "error"
  | "token_usage"
  | "connection_status"
  | "provider_unknown";

export interface CodexTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CodexSessionEventBase {
  id: string;
  kind: CodexSessionEventKind;
  provider?: string;
  receivedAt?: string;
  raw?: unknown;
}

export interface CodexThreadStartedEvent extends CodexSessionEventBase {
  kind: "thread_started";
  threadId: string;
  title?: string;
}

export interface CodexTurnStartedEvent extends CodexSessionEventBase {
  kind: "turn_started";
  turnId: string;
  threadId?: string;
  prompt?: string;
}

export interface CodexAgentDeltaEvent extends CodexSessionEventBase {
  kind: "agent_delta";
  turnId: string;
  itemId?: string;
  delta: string;
}

export interface CodexItemCompletedEvent extends CodexSessionEventBase {
  kind: "item_completed";
  turnId?: string;
  itemId: string;
  role: CodexSessionMessageRole;
  content: string;
  status?: "completed" | "failed" | "interrupted";
}

export interface CodexTurnCompletedEvent extends CodexSessionEventBase {
  kind: "turn_completed";
  turnId: string;
  status: "completed" | "failed" | "interrupted";
  summary?: string;
}

export interface CodexSessionErrorEvent extends CodexSessionEventBase {
  kind: "error";
  turnId?: string;
  message: string;
  code?: string;
  recoverable: boolean;
}

export interface CodexTokenUsageEvent extends CodexSessionEventBase {
  kind: "token_usage";
  turnId?: string;
  usage: CodexTokenUsage;
}

export interface CodexConnectionStatusEvent extends CodexSessionEventBase {
  kind: "connection_status";
  status: CodexSessionConnectionStatus;
  reason?: string;
}

export interface CodexProviderUnknownEvent extends CodexSessionEventBase {
  kind: "provider_unknown";
  turnId?: string;
  name: string;
  summary: string;
}

export type CodexSessionEvent =
  | CodexThreadStartedEvent
  | CodexTurnStartedEvent
  | CodexAgentDeltaEvent
  | CodexItemCompletedEvent
  | CodexTurnCompletedEvent
  | CodexSessionErrorEvent
  | CodexTokenUsageEvent
  | CodexConnectionStatusEvent
  | CodexProviderUnknownEvent;

export interface CodexPanelEventPayload {
  method: string;
  eventType: string;
  turnId: string | null;
  status: string | null;
  delta: string | null;
  message: string | null;
  summary?: string | null;
  itemType?: string | null;
  itemStatus?: string | null;
  itemTitle?: string | null;
}

export interface CodexPanelTurnResultPayload {
  source: string;
  panelId?: string;
  sessionId: string;
  threadId: string;
  turnId: string | null;
  completed: boolean;
  interrupted: boolean;
  failed: boolean;
  events: CodexPanelEventPayload[];
  transcript: string;
  detail: string;
}

export interface CodexSessionMessage {
  id: string;
  turnId?: string;
  itemId?: string;
  role: CodexSessionMessageRole;
  body: string;
  status: CodexSessionTurnStatus;
}

export interface CodexSessionTurn {
  id: string;
  threadId?: string;
  status: CodexSessionTurnStatus;
  prompt?: string;
  error?: string;
  summary?: string;
  usage?: CodexTokenUsage;
}

export interface CodexSessionConnection {
  status: CodexSessionConnectionStatus;
  reason?: string;
}

export interface CodexSessionState {
  threadId?: string;
  title?: string;
  activeTurnId?: string;
  connection: CodexSessionConnection;
  turns: CodexSessionTurn[];
  messages: CodexSessionMessage[];
  usage: CodexTokenUsage;
  errors: CodexSessionErrorEvent[];
  unknownEvents: CodexProviderUnknownEvent[];
}

const EMPTY_USAGE: CodexTokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0
};

export function createInitialCodexSessionState(
  connectionStatus: CodexSessionConnectionStatus = "disconnected"
): CodexSessionState {
  return {
    connection: {
      status: connectionStatus
    },
    turns: [],
    messages: [],
    usage: { ...EMPTY_USAGE },
    errors: [],
    unknownEvents: []
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function safeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function safeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function eventId(raw: Record<string, unknown>, kind: CodexSessionEventKind): string {
  return safeString(raw.id, `${kind}:${safeString(raw.type, "provider-event")}`);
}

function nestedRecord(raw: Record<string, unknown>, key: string): Record<string, unknown> {
  return isRecord(raw[key]) ? raw[key] : {};
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.length > 0);
}

function normalizeConnectionStatus(value: unknown): CodexSessionConnectionStatus {
  switch (value) {
    case "connecting":
    case "connected":
    case "reconnecting":
    case "error":
      return value;
    default:
      return "disconnected";
  }
}

function normalizeRole(value: unknown): CodexSessionMessageRole {
  switch (value) {
    case "user":
    case "tool":
    case "system":
      return value;
    default:
      return "assistant";
  }
}

function normalizeTurnStatus(value: unknown): "completed" | "failed" | "interrupted" {
  switch (value) {
    case "failed":
    case "error":
      return "failed";
    case "interrupted":
    case "cancelled":
    case "canceled":
      return "interrupted";
    default:
      return "completed";
  }
}

function normalizeSessionTurnStatus(value: unknown): CodexSessionTurnStatus {
  switch (value) {
    case "failed":
    case "error":
      return "failed";
    case "interrupted":
    case "cancelled":
    case "canceled":
      return "interrupted";
    case "completed":
      return "completed";
    case "streaming":
      return "streaming";
    default:
      return "pending";
  }
}

function normalizeUsage(rawUsage: Record<string, unknown>): CodexTokenUsage {
  const inputTokens = safeNumber(
    rawUsage.inputTokens ?? rawUsage.input_tokens ?? rawUsage.prompt_tokens
  );
  const outputTokens = safeNumber(
    rawUsage.outputTokens ?? rawUsage.output_tokens ?? rawUsage.completion_tokens
  );
  const suppliedTotal = safeNumber(rawUsage.totalTokens ?? rawUsage.total_tokens);

  return {
    inputTokens,
    outputTokens,
    totalTokens: suppliedTotal || inputTokens + outputTokens
  };
}

export function normalizeCodexProviderEvent(raw: unknown): CodexSessionEvent {
  if (!isRecord(raw)) {
    return {
      id: "provider_unknown:non-record",
      kind: "provider_unknown",
      provider: "codex",
      name: "non-record",
      summary: "Ignored malformed provider event.",
      raw
    };
  }

  const type = safeString(raw.type ?? raw.kind, "unknown");
  const data = nestedRecord(raw, "data");
  const payload = Object.keys(data).length > 0 ? data : raw;

  switch (type) {
    case "thread.started":
    case "thread_started":
      return {
        id: eventId(raw, "thread_started"),
        kind: "thread_started",
        provider: "codex",
        threadId: safeString(payload.threadId ?? payload.thread_id, "thread:unknown"),
        title: firstString(payload.title),
        raw
      };
    case "turn.started":
    case "turn_started":
      return {
        id: eventId(raw, "turn_started"),
        kind: "turn_started",
        provider: "codex",
        turnId: safeString(payload.turnId ?? payload.turn_id, "turn:unknown"),
        threadId: firstString(payload.threadId, payload.thread_id),
        prompt: firstString(payload.prompt, payload.input),
        raw
      };
    case "agent.delta":
    case "agent_delta":
    case "message.delta":
      return {
        id: eventId(raw, "agent_delta"),
        kind: "agent_delta",
        provider: "codex",
        turnId: safeString(payload.turnId ?? payload.turn_id, "turn:unknown"),
        itemId: firstString(payload.itemId, payload.item_id, payload.messageId, payload.message_id),
        delta: safeString(payload.delta ?? payload.text ?? payload.content),
        raw
      };
    case "item.completed":
    case "item_completed":
    case "message.completed":
      return {
        id: eventId(raw, "item_completed"),
        kind: "item_completed",
        provider: "codex",
        turnId: firstString(payload.turnId, payload.turn_id),
        itemId: safeString(payload.itemId ?? payload.item_id ?? payload.messageId ?? payload.message_id, "item:unknown"),
        role: normalizeRole(payload.role),
        content: safeString(payload.content ?? payload.text),
        status: normalizeTurnStatus(payload.status),
        raw
      };
    case "turn.completed":
    case "turn_completed":
    case "turn.failed":
    case "turn.interrupted":
      return {
        id: eventId(raw, "turn_completed"),
        kind: "turn_completed",
        provider: "codex",
        turnId: safeString(payload.turnId ?? payload.turn_id, "turn:unknown"),
        status: normalizeTurnStatus(payload.status ?? type.split(".").at(-1)),
        summary: firstString(payload.summary),
        raw
      };
    case "error":
    case "session.error":
      return {
        id: eventId(raw, "error"),
        kind: "error",
        provider: "codex",
        turnId: firstString(payload.turnId, payload.turn_id),
        message: safeString(payload.message ?? payload.error, "Unknown provider error."),
        code: firstString(payload.code),
        recoverable: safeBoolean(payload.recoverable, false),
        raw
      };
    case "token_usage":
    case "usage":
    case "turn.usage": {
      const usage = nestedRecord(payload, "usage");
      return {
        id: eventId(raw, "token_usage"),
        kind: "token_usage",
        provider: "codex",
        turnId: firstString(payload.turnId, payload.turn_id),
        usage: normalizeUsage(Object.keys(usage).length > 0 ? usage : payload),
        raw
      };
    }
    case "connection.status":
    case "connection_status":
      return {
        id: eventId(raw, "connection_status"),
        kind: "connection_status",
        provider: "codex",
        status: normalizeConnectionStatus(payload.status),
        reason: firstString(payload.reason, payload.message),
        raw
      };
    default:
      return {
        id: eventId(raw, "provider_unknown"),
        kind: "provider_unknown",
        provider: "codex",
        name: type,
        summary: `Unsupported provider event: ${type}`,
        raw
      };
  }
}

export function normalizeCodexPanelTurnResultEvents(
  result: CodexPanelTurnResultPayload,
  prompt: string
): CodexSessionEvent[] {
  const turnId = result.turnId ?? "turn:unknown";
  const events: CodexSessionEvent[] = [
    {
      id: `${result.sessionId}:thread-started`,
      kind: "thread_started",
      provider: "codex",
      threadId: result.threadId,
      raw: result
    },
    {
      id: `${result.sessionId}:${turnId}:turn-started`,
      kind: "turn_started",
      provider: "codex",
      threadId: result.threadId,
      turnId,
      prompt,
      raw: result
    }
  ];

  result.events.forEach((event, index) => {
    const eventTurnId = event.turnId ?? turnId;
    if (event.eventType === "agent_delta" && event.delta) {
      events.push({
        id: `${result.sessionId}:${eventTurnId}:delta:${index}`,
        kind: "agent_delta",
        provider: "codex",
        turnId: eventTurnId,
        delta: event.delta,
        raw: event
      });
      return;
    }

    if (event.eventType === "turn_status") {
      events.push({
        id: `${result.sessionId}:${eventTurnId}:status:${index}`,
        kind: "turn_completed",
        provider: "codex",
        turnId: eventTurnId,
        status: normalizeTurnStatus(event.status),
        summary: event.message ?? result.detail,
        raw: event
      });
      return;
    }

    if (event.eventType === "error") {
      events.push({
        id: `${result.sessionId}:${eventTurnId}:error:${index}`,
        kind: "error",
        provider: "codex",
        turnId: eventTurnId,
        message: event.message ?? result.detail,
        recoverable: false,
        raw: event
      });
      return;
    }

    events.push({
      id: `${result.sessionId}:${eventTurnId}:unknown:${index}`,
      kind: "provider_unknown",
      provider: "codex",
      turnId: eventTurnId,
      name: event.method,
      summary: event.summary ?? event.message ?? event.itemTitle ?? `Provider event: ${event.method}`,
      raw: event
    });
  });

  if (!events.some((event) => event.kind === "agent_delta") && result.transcript) {
    events.push({
      id: `${result.sessionId}:${turnId}:transcript`,
      kind: "agent_delta",
      provider: "codex",
      turnId,
      delta: result.transcript,
      raw: result
    });
  }

  if (!events.some((event) => event.kind === "turn_completed")) {
    events.push({
      id: `${result.sessionId}:${turnId}:final-status`,
      kind: "turn_completed",
      provider: "codex",
      turnId,
      status: result.failed
        ? "failed"
        : result.interrupted
          ? "interrupted"
          : result.completed
            ? "completed"
            : normalizeTurnStatus("failed"),
      summary: result.detail,
      raw: result
    });
  }

  return events;
}

function upsertTurn(
  turns: readonly CodexSessionTurn[],
  turn: CodexSessionTurn
): CodexSessionTurn[] {
  const existingIndex = turns.findIndex((item) => item.id === turn.id);
  if (existingIndex === -1) {
    return [...turns, turn];
  }

  return turns.map((item, index) => index === existingIndex ? { ...item, ...turn } : item);
}

function updateTurn(
  turns: readonly CodexSessionTurn[],
  turnId: string,
  patch: Partial<CodexSessionTurn>
): CodexSessionTurn[] {
  const existing = turns.find((turn) => turn.id === turnId);
  if (!existing) {
    return [...turns, { id: turnId, status: "pending", ...patch }];
  }

  return turns.map((turn) => turn.id === turnId ? { ...turn, ...patch } : turn);
}

function appendAssistantDelta(
  messages: readonly CodexSessionMessage[],
  event: CodexAgentDeltaEvent
): CodexSessionMessage[] {
  const messageId = event.itemId ?? `${event.turnId}:assistant`;
  const existing = messages.find(
    (message) =>
      message.turnId === event.turnId &&
      message.role === "assistant" &&
      (message.itemId === event.itemId || message.id === messageId)
  );

  if (!existing) {
    return [
      ...messages,
      {
        id: messageId,
        turnId: event.turnId,
        itemId: event.itemId,
        role: "assistant",
        body: event.delta,
        status: "streaming"
      }
    ];
  }

  return messages.map((message) =>
    message.id === existing.id
      ? { ...message, body: `${message.body}${event.delta}`, status: "streaming" }
      : message
  );
}

function upsertCompletedItem(
  messages: readonly CodexSessionMessage[],
  event: CodexItemCompletedEvent
): CodexSessionMessage[] {
  const messageId = event.itemId;
  const status = event.status ?? "completed";
  const existing = messages.find((message) => message.id === messageId);

  if (!existing) {
    return [
      ...messages,
      {
        id: messageId,
        turnId: event.turnId,
        itemId: event.itemId,
        role: event.role,
        body: event.content,
        status
      }
    ];
  }

  return messages.map((message) =>
    message.id === messageId
      ? { ...message, body: event.content || message.body, role: event.role, status }
      : message
  );
}

function applyTurnStatusToMessages(
  messages: readonly CodexSessionMessage[],
  turnId: string,
  status: CodexSessionTurnStatus
): CodexSessionMessage[] {
  return messages.map((message) =>
    message.turnId === turnId && message.status !== "completed"
      ? { ...message, status: normalizeSessionTurnStatus(status) }
      : message
  );
}

export function reduceCodexSessionEvent(
  state: CodexSessionState,
  event: CodexSessionEvent
): CodexSessionState {
  switch (event.kind) {
    case "thread_started":
      return {
        ...state,
        threadId: event.threadId,
        title: event.title ?? state.title
      };
    case "turn_started":
      return {
        ...state,
        threadId: event.threadId ?? state.threadId,
        activeTurnId: event.turnId,
        turns: upsertTurn(state.turns, {
          id: event.turnId,
          threadId: event.threadId ?? state.threadId,
          status: "streaming",
          prompt: event.prompt
        })
      };
    case "agent_delta":
      return {
        ...state,
        activeTurnId: event.turnId,
        turns: updateTurn(state.turns, event.turnId, { status: "streaming" }),
        messages: appendAssistantDelta(state.messages, event)
      };
    case "item_completed":
      return {
        ...state,
        turns: event.turnId
          ? updateTurn(state.turns, event.turnId, { status: event.status ?? "completed" })
          : state.turns,
        messages: upsertCompletedItem(state.messages, event)
      };
    case "turn_completed": {
      const messages = applyTurnStatusToMessages(state.messages, event.turnId, event.status);
      return {
        ...state,
        activeTurnId: state.activeTurnId === event.turnId ? undefined : state.activeTurnId,
        turns: updateTurn(state.turns, event.turnId, {
          status: event.status,
          summary: event.summary
        }),
        messages
      };
    }
    case "error": {
      const turnId = event.turnId ?? state.activeTurnId;
      return {
        ...state,
        connection: {
          status: event.recoverable ? state.connection.status : "error",
          reason: event.message
        },
        errors: [...state.errors, event],
        turns: turnId
          ? updateTurn(state.turns, turnId, { status: "failed", error: event.message })
          : state.turns,
        messages: turnId
          ? applyTurnStatusToMessages(state.messages, turnId, "failed")
          : state.messages
      };
    }
    case "token_usage": {
      const usage = {
        inputTokens: state.usage.inputTokens + event.usage.inputTokens,
        outputTokens: state.usage.outputTokens + event.usage.outputTokens,
        totalTokens: state.usage.totalTokens + event.usage.totalTokens
      };
      return {
        ...state,
        usage,
        turns: event.turnId
          ? updateTurn(state.turns, event.turnId, { usage: event.usage })
          : state.turns
      };
    }
    case "connection_status":
      return {
        ...state,
        connection: {
          status: event.status,
          reason: event.reason
        }
      };
    case "provider_unknown":
      return {
        ...state,
        unknownEvents: [...state.unknownEvents, event]
      };
  }
}

export function reduceCodexSessionEvents(
  events: readonly CodexSessionEvent[],
  initialState = createInitialCodexSessionState()
): CodexSessionState {
  return events.reduce(reduceCodexSessionEvent, initialState);
}
