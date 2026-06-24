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
  | "protocol_item"
  | "turn_completed"
  | "error"
  | "token_usage"
  | "connection_status"
  | "provider_unknown";

export type CodexProtocolLedgerKind =
  | "reasoning"
  | "command_execution"
  | "command_output_delta"
  | "file_change"
  | "mcp_call"
  | "web_search"
  | "image_view"
  | "plan_update"
  | "approval_request"
  | "agent_message"
  | "turn_status"
  | "error"
  | "usage"
  | "unknown";

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

export interface CodexProtocolLedgerEntry {
  id: string;
  kind: CodexProtocolLedgerKind;
  method: string;
  requestId?: string;
  threadId?: string;
  turnId?: string;
  itemId?: string;
  itemType?: string;
  status?: string;
  title?: string;
  detail?: string;
  delta?: string;
  message?: string;
  summary?: string;
  usage?: CodexTokenUsage;
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

export interface CodexProtocolItemEvent extends CodexSessionEventBase {
  kind: "protocol_item";
  ledgerKind: CodexProtocolLedgerKind;
  method: string;
  requestId?: string;
  threadId?: string;
  turnId?: string;
  itemId?: string;
  itemType?: string;
  status?: string;
  title?: string;
  detail?: string;
  delta?: string;
  message?: string;
  summary?: string;
  usage?: CodexTokenUsage;
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
  | CodexProtocolItemEvent
  | CodexTurnCompletedEvent
  | CodexSessionErrorEvent
  | CodexTokenUsageEvent
  | CodexConnectionStatusEvent
  | CodexProviderUnknownEvent;

export interface CodexPanelEventPayload {
  method: string;
  eventType: string;
  requestId?: string | null;
  threadId?: string | null;
  turnId: string | null;
  itemId?: string | null;
  status: string | null;
  delta: string | null;
  message: string | null;
  summary?: string | null;
  itemType?: string | null;
  itemStatus?: string | null;
  itemTitle?: string | null;
  itemDetail?: string | null;
  providerTimestamp?: string | null;
  usageInputTokens?: number | null;
  usageOutputTokens?: number | null;
  usageTotalTokens?: number | null;
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
  ledger: CodexProtocolLedgerEntry[];
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

const CODEX_PROTOCOL_LEDGER_STORAGE_KEY = "steerboard.codexProtocolLedger.v1";

export function createInitialCodexSessionState(
  connectionStatus: CodexSessionConnectionStatus = "disconnected"
): CodexSessionState {
  return {
    connection: {
      status: connectionStatus
    },
    ledger: [],
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

function shouldRedactKey(key: string): boolean {
  return /token|secret|password|api[-_]?key|authorization|credential|cookie/i.test(key);
}

function redactProviderRaw(value: unknown, depth = 0): unknown {
  if (depth > 6) {
    return "[truncated]";
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redactProviderRaw(item, depth + 1));
  }
  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      shouldRedactKey(key) ? "[redacted]" : redactProviderRaw(item, depth + 1)
    ])
  );
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

function normalizeLedgerKind(value: unknown): CodexProtocolLedgerKind {
  switch (value) {
    case "reasoning":
    case "command_execution":
    case "command_output_delta":
    case "file_change":
    case "mcp_call":
    case "web_search":
    case "image_view":
    case "plan_update":
    case "approval_request":
    case "agent_message":
    case "turn_status":
    case "error":
    case "usage":
      return value;
    default:
      return "unknown";
  }
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function normalizeCodexProtocolLedgerEntry(value: unknown): CodexProtocolLedgerEntry | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = optionalString(value.id);
  const method = optionalString(value.method);
  if (!id || !method) {
    return null;
  }

  const usage = isRecord(value.usage) ? normalizeUsage(value.usage) : undefined;
  return {
    id,
    kind: normalizeLedgerKind(value.kind),
    method,
    requestId: optionalString(value.requestId),
    threadId: optionalString(value.threadId),
    turnId: optionalString(value.turnId),
    itemId: optionalString(value.itemId),
    itemType: optionalString(value.itemType),
    status: optionalString(value.status),
    title: optionalString(value.title),
    detail: optionalString(value.detail),
    delta: optionalString(value.delta),
    message: optionalString(value.message),
    summary: optionalString(value.summary),
    usage: usage && (usage.totalTokens > 0 || usage.inputTokens > 0 || usage.outputTokens > 0)
      ? usage
      : undefined,
    receivedAt: optionalString(value.receivedAt),
    raw: redactProviderRaw(value.raw)
  };
}

export function normalizeCodexProtocolLedger(value: unknown): CodexProtocolLedgerEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeCodexProtocolLedgerEntry)
    .filter((entry): entry is CodexProtocolLedgerEntry => entry !== null);
}

export function parseStoredCodexProtocolLedgers(
  serialized: string | null
): Record<string, CodexProtocolLedgerEntry[]> {
  if (!serialized) {
    return {};
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!isRecord(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([panelId, ledger]) => [panelId, normalizeCodexProtocolLedger(ledger)] as const)
        .filter(([, ledger]) => ledger.length > 0)
    );
  } catch {
    return {};
  }
}

export function loadCodexProtocolLedger(panelId: string): CodexProtocolLedgerEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = parseStoredCodexProtocolLedgers(
    window.localStorage.getItem(CODEX_PROTOCOL_LEDGER_STORAGE_KEY)
  );
  return stored[panelId] ?? [];
}

export function saveCodexProtocolLedger(
  panelId: string,
  ledger: readonly CodexProtocolLedgerEntry[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const stored = parseStoredCodexProtocolLedgers(
    window.localStorage.getItem(CODEX_PROTOCOL_LEDGER_STORAGE_KEY)
  );
  const normalized = normalizeCodexProtocolLedger(ledger);
  window.localStorage.setItem(
    CODEX_PROTOCOL_LEDGER_STORAGE_KEY,
    JSON.stringify({
      ...stored,
      [panelId]: normalized
    })
  );
}

function normalizeMethodKind(method: string, itemType?: string | null): CodexProtocolLedgerKind {
  const haystack = `${method} ${itemType ?? ""}`.toLowerCase();
  if (haystack.includes("approval")) {
    return "approval_request";
  }
  if (haystack.includes("reasoning")) {
    return "reasoning";
  }
  if (haystack.includes("commandexecution/outputdelta")) {
    return "command_output_delta";
  }
  if (haystack.includes("commandexecution") || /\b(exec|command|shell|terminal|bash)\b/.test(haystack)) {
    return "command_execution";
  }
  if (haystack.includes("filechange") || haystack.includes("file_change") || haystack.includes("diff")) {
    return "file_change";
  }
  if (haystack.includes("mcptoolcall") || haystack.includes("mcp")) {
    return "mcp_call";
  }
  if (haystack.includes("websearch") || haystack.includes("web_search") || haystack.includes("search")) {
    return "web_search";
  }
  if (haystack.includes("imageview") || haystack.includes("image_view") || haystack.includes("localimage")) {
    return "image_view";
  }
  if (haystack.includes("plan")) {
    return "plan_update";
  }
  if (haystack.includes("agentmessage")) {
    return "agent_message";
  }
  if (haystack.includes("error") || haystack.includes("failed")) {
    return "error";
  }
  if (haystack.includes("usage")) {
    return "usage";
  }
  if (haystack.includes("turn/") || haystack.includes("turn.")) {
    return "turn_status";
  }
  return "unknown";
}

function panelEventUsage(event: CodexPanelEventPayload): CodexTokenUsage | undefined {
  const usage = normalizeUsage({
    inputTokens: event.usageInputTokens,
    outputTokens: event.usageOutputTokens,
    totalTokens: event.usageTotalTokens
  });
  return usage.totalTokens > 0 || usage.inputTokens > 0 || usage.outputTokens > 0
    ? usage
    : undefined;
}

function protocolEventFromPanelEvent(
  result: CodexPanelTurnResultPayload,
  event: CodexPanelEventPayload,
  index: number,
  fallbackTurnId: string
): CodexProtocolItemEvent {
  const eventTurnId = event.turnId ?? fallbackTurnId;
  const ledgerKind = normalizeMethodKind(event.method, event.itemType);
  return {
    id: `${result.sessionId}:${eventTurnId}:protocol:${index}`,
    kind: "protocol_item",
    ledgerKind,
    provider: "codex",
    method: event.method,
    requestId: event.requestId ?? undefined,
    threadId: event.threadId ?? result.threadId,
    turnId: eventTurnId,
    itemId: event.itemId ?? undefined,
    itemType: event.itemType ?? undefined,
    status: event.itemStatus ?? event.status ?? undefined,
    title: event.itemTitle ?? undefined,
    detail: event.itemDetail ?? undefined,
    delta: event.delta ?? undefined,
    message: event.message ?? undefined,
    summary: event.summary ?? undefined,
    usage: panelEventUsage(event),
    receivedAt: event.providerTimestamp ?? undefined,
    raw: redactProviderRaw(event)
  };
}

function ledgerEntryFromEvent(event: CodexSessionEvent): CodexProtocolLedgerEntry {
  switch (event.kind) {
    case "thread_started":
      return {
        id: event.id,
        kind: "turn_status",
        method: "thread/started",
        threadId: event.threadId,
        status: "started",
        title: event.title,
        receivedAt: event.receivedAt,
        raw: event.raw
      };
    case "turn_started":
      return {
        id: event.id,
        kind: "turn_status",
        method: "turn/started",
        threadId: event.threadId,
        turnId: event.turnId,
        status: "started",
        detail: event.prompt,
        receivedAt: event.receivedAt,
        raw: event.raw
      };
    case "agent_delta":
      return {
        id: event.id,
        kind: "agent_message",
        method: "item/agentMessage/delta",
        turnId: event.turnId,
        itemId: event.itemId,
        delta: event.delta,
        receivedAt: event.receivedAt,
        raw: event.raw
      };
    case "item_completed":
      return {
        id: event.id,
        kind: event.role === "assistant" ? "agent_message" : "unknown",
        method: "item/completed",
        turnId: event.turnId,
        itemId: event.itemId,
        status: event.status,
        delta: event.content,
        receivedAt: event.receivedAt,
        raw: event.raw
      };
    case "protocol_item":
      return {
        id: event.id,
        kind: event.ledgerKind,
        method: event.method,
        requestId: event.requestId,
        threadId: event.threadId,
        turnId: event.turnId,
        itemId: event.itemId,
        itemType: event.itemType,
        status: event.status,
        title: event.title,
        detail: event.detail,
        delta: event.delta,
        message: event.message,
        summary: event.summary,
        usage: event.usage,
        receivedAt: event.receivedAt,
        raw: event.raw
      };
    case "turn_completed":
      return {
        id: event.id,
        kind: "turn_status",
        method: "turn/completed",
        turnId: event.turnId,
        status: event.status,
        summary: event.summary,
        receivedAt: event.receivedAt,
        raw: event.raw
      };
    case "error":
      return {
        id: event.id,
        kind: "error",
        method: "error",
        turnId: event.turnId,
        status: "failed",
        message: event.message,
        detail: event.code,
        receivedAt: event.receivedAt,
        raw: event.raw
      };
    case "token_usage":
      return {
        id: event.id,
        kind: "usage",
        method: "turn/usage",
        turnId: event.turnId,
        usage: event.usage,
        receivedAt: event.receivedAt,
        raw: event.raw
      };
    case "connection_status":
      return {
        id: event.id,
        kind: "turn_status",
        method: "connection/status",
        status: event.status,
        message: event.reason,
        receivedAt: event.receivedAt,
        raw: event.raw
      };
    case "provider_unknown":
      return {
        id: event.id,
        kind: "unknown",
        method: event.name,
        turnId: event.turnId,
        summary: event.summary,
        receivedAt: event.receivedAt,
        raw: event.raw
      };
  }
}

function appendLedgerEvent(
  state: CodexSessionState,
  event: CodexSessionEvent
): CodexSessionState {
  return {
    ...state,
    ledger: [...state.ledger, ledgerEntryFromEvent(event)]
  };
}

export function normalizeCodexProviderEvent(raw: unknown): CodexSessionEvent {
  const safeRaw = redactProviderRaw(raw);
  if (!isRecord(raw)) {
    return {
      id: "provider_unknown:non-record",
      kind: "provider_unknown",
      provider: "codex",
      name: "non-record",
      summary: "Ignored malformed provider event.",
      raw: safeRaw
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
        raw: safeRaw
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
        raw: safeRaw
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
        raw: safeRaw
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
        raw: safeRaw
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
        raw: safeRaw
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
        raw: safeRaw
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
        raw: safeRaw
      };
    }
    case "item/reasoning/summaryTextDelta":
    case "item/reasoning/textDelta":
    case "item/commandExecution/outputDelta":
    case "item/fileChange/outputDelta":
    case "turn/plan/updated":
    case "item/plan/delta":
    case "item/started":
    case "item/completed":
    case "item/updated":
    case "approval_request":
    case "codex:approval_request":
    case "mcp/toolCall":
    case "webSearch/completed":
    case "imageView/opened": {
      const item = nestedRecord(payload, "item");
      const usage = nestedRecord(payload, "usage");
      const itemType = firstString(item.type, payload.itemType, payload.item_type);
      return {
        id: eventId(raw, "protocol_item"),
        kind: "protocol_item",
        ledgerKind: normalizeMethodKind(type, itemType),
        provider: "codex",
        method: type,
        threadId: firstString(payload.threadId, payload.thread_id),
        turnId: firstString(payload.turnId, payload.turn_id),
        itemId: firstString(payload.itemId, payload.item_id, item.id),
        itemType,
        status: firstString(payload.status, item.status),
        title: firstString(payload.title, payload.name, item.title, item.name, item.command),
        detail: firstString(payload.detail, payload.command, payload.text, item.command, item.text),
        delta: firstString(payload.delta, payload.text, payload.content),
        message: firstString(payload.message, payload.error),
        summary: firstString(payload.summary, item.summary),
        usage: Object.keys(usage).length > 0 ? normalizeUsage(usage) : undefined,
        receivedAt: firstString(payload.timestamp, payload.createdAt, payload.created_at),
        raw: safeRaw
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
        raw: safeRaw
      };
    default:
      return {
        id: eventId(raw, "provider_unknown"),
        kind: "provider_unknown",
        provider: "codex",
        name: type,
        summary: `Unsupported provider event: ${type}`,
        raw: safeRaw
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
      raw: redactProviderRaw(result)
    },
    {
      id: `${result.sessionId}:${turnId}:turn-started`,
      kind: "turn_started",
      provider: "codex",
      threadId: result.threadId,
      turnId,
      prompt,
      raw: redactProviderRaw(result)
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
        raw: redactProviderRaw(event)
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
        raw: redactProviderRaw(event)
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
        raw: redactProviderRaw(event)
      });
      return;
    }

    const protocolEvent = protocolEventFromPanelEvent(result, event, index, turnId);
    events.push(protocolEvent);
    if (protocolEvent.ledgerKind === "unknown") {
      events.push({
        id: `${result.sessionId}:${eventTurnId}:unknown:${index}`,
        kind: "provider_unknown",
        provider: "codex",
        turnId: eventTurnId,
        name: event.method,
        summary: event.summary ?? event.message ?? event.itemTitle ?? `Provider event: ${event.method}`,
        raw: redactProviderRaw(event)
      });
    }
  });

  if (!events.some((event) => event.kind === "agent_delta") && result.transcript) {
    events.push({
      id: `${result.sessionId}:${turnId}:transcript`,
      kind: "agent_delta",
      provider: "codex",
      turnId,
      delta: result.transcript,
      raw: redactProviderRaw(result)
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
      raw: redactProviderRaw(result)
    });
  }

  return events;
}

export function normalizeCodexPanelEventsToProtocolLedger({
  sessionId,
  threadId,
  turnId,
  events
}: {
  sessionId: string;
  threadId: string;
  turnId: string | null;
  events: readonly CodexPanelEventPayload[];
}): CodexProtocolLedgerEntry[] {
  const fallbackTurnId = turnId ?? "turn:unknown";
  const result: CodexPanelTurnResultPayload = {
    source: "desktop",
    sessionId,
    threadId,
    turnId,
    completed: false,
    interrupted: false,
    failed: false,
    events: [],
    transcript: "",
    detail: "Codex panel stream event."
  };

  return events.flatMap((event, index) => {
    const eventTurnId = event.turnId ?? fallbackTurnId;
    if (event.eventType === "agent_delta" && event.delta) {
      return [
        ledgerEntryFromEvent({
          id: `${sessionId}:${eventTurnId}:stream-delta:${index}`,
          kind: "agent_delta",
          provider: "codex",
          turnId: eventTurnId,
          itemId: event.itemId ?? undefined,
          delta: event.delta,
          receivedAt: event.providerTimestamp ?? undefined,
          raw: redactProviderRaw(event)
        })
      ];
    }

    if (event.eventType === "turn_status") {
      return [
        ledgerEntryFromEvent({
          id: `${sessionId}:${eventTurnId}:stream-status:${index}`,
          kind: "turn_completed",
          provider: "codex",
          turnId: eventTurnId,
          status: normalizeTurnStatus(event.status),
          summary: event.message ?? event.summary ?? "Codex turn status updated.",
          receivedAt: event.providerTimestamp ?? undefined,
          raw: redactProviderRaw(event)
        })
      ];
    }

    if (event.eventType === "error") {
      return [
        ledgerEntryFromEvent({
          id: `${sessionId}:${eventTurnId}:stream-error:${index}`,
          kind: "error",
          provider: "codex",
          turnId: eventTurnId,
          message: event.message ?? event.summary ?? "Codex reported an error.",
          recoverable: false,
          receivedAt: event.providerTimestamp ?? undefined,
          raw: redactProviderRaw(event)
        })
      ];
    }

    return [ledgerEntryFromEvent(protocolEventFromPanelEvent(result, event, index, fallbackTurnId))];
  });
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
  const stateWithLedger = appendLedgerEvent(state, event);

  switch (event.kind) {
    case "thread_started":
      return {
        ...stateWithLedger,
        threadId: event.threadId,
        title: event.title ?? stateWithLedger.title
      };
    case "turn_started":
      return {
        ...stateWithLedger,
        threadId: event.threadId ?? stateWithLedger.threadId,
        activeTurnId: event.turnId,
        turns: upsertTurn(stateWithLedger.turns, {
          id: event.turnId,
          threadId: event.threadId ?? stateWithLedger.threadId,
          status: "streaming",
          prompt: event.prompt
        })
      };
    case "agent_delta":
      return {
        ...stateWithLedger,
        activeTurnId: event.turnId,
        turns: updateTurn(stateWithLedger.turns, event.turnId, { status: "streaming" }),
        messages: appendAssistantDelta(stateWithLedger.messages, event)
      };
    case "item_completed":
      return {
        ...stateWithLedger,
        turns: event.turnId
          ? updateTurn(stateWithLedger.turns, event.turnId, { status: event.status ?? "completed" })
          : stateWithLedger.turns,
        messages: upsertCompletedItem(stateWithLedger.messages, event)
      };
    case "protocol_item":
      return {
        ...stateWithLedger,
        activeTurnId: event.turnId ?? stateWithLedger.activeTurnId,
        turns: event.turnId
          ? updateTurn(stateWithLedger.turns, event.turnId, {
              status:
                event.status === "completed" ||
                event.status === "failed" ||
                event.status === "interrupted"
                  ? normalizeSessionTurnStatus(event.status)
                  : "streaming"
            })
          : stateWithLedger.turns
      };
    case "turn_completed": {
      const messages = applyTurnStatusToMessages(stateWithLedger.messages, event.turnId, event.status);
      return {
        ...stateWithLedger,
        activeTurnId: stateWithLedger.activeTurnId === event.turnId ? undefined : stateWithLedger.activeTurnId,
        turns: updateTurn(stateWithLedger.turns, event.turnId, {
          status: event.status,
          summary: event.summary
        }),
        messages
      };
    }
    case "error": {
      const turnId = event.turnId ?? stateWithLedger.activeTurnId;
      return {
        ...stateWithLedger,
        connection: {
          status: event.recoverable ? stateWithLedger.connection.status : "error",
          reason: event.message
        },
        errors: [...stateWithLedger.errors, event],
        turns: turnId
          ? updateTurn(stateWithLedger.turns, turnId, { status: "failed", error: event.message })
          : stateWithLedger.turns,
        messages: turnId
          ? applyTurnStatusToMessages(stateWithLedger.messages, turnId, "failed")
          : stateWithLedger.messages
      };
    }
    case "token_usage": {
      const usage = {
        inputTokens: stateWithLedger.usage.inputTokens + event.usage.inputTokens,
        outputTokens: stateWithLedger.usage.outputTokens + event.usage.outputTokens,
        totalTokens: stateWithLedger.usage.totalTokens + event.usage.totalTokens
      };
      return {
        ...stateWithLedger,
        usage,
        turns: event.turnId
          ? updateTurn(stateWithLedger.turns, event.turnId, { usage: event.usage })
          : stateWithLedger.turns
      };
    }
    case "connection_status":
      return {
        ...stateWithLedger,
        connection: {
          status: event.status,
          reason: event.reason
        }
      };
    case "provider_unknown":
      return {
        ...stateWithLedger,
        unknownEvents: [...stateWithLedger.unknownEvents, event]
      };
  }
}

export function reduceCodexSessionEvents(
  events: readonly CodexSessionEvent[],
  initialState = createInitialCodexSessionState()
): CodexSessionState {
  return events.reduce(reduceCodexSessionEvent, initialState);
}
