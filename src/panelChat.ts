import type { SessionSummary } from "./fixtures";
import type {
  CodexPanelEventPayload,
  CodexPanelTurnResultPayload,
  CodexProtocolLedgerEntry,
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

export type PanelChatSectionKind = "feedback" | "steps" | "commands" | "trace";

export type PanelChatActionKind =
  | "codex-approval-approve"
  | "codex-approval-approve-session"
  | "codex-approval-decline"
  | "codex-approval-cancel";

export interface PanelChatAction {
  id: string;
  kind: PanelChatActionKind;
  label: string;
  title: string;
  disabled?: boolean;
  payload?: {
    requestId: string;
    method: string;
    threadId?: string;
    turnId?: string;
    itemId?: string;
  };
}

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
  actions?: PanelChatAction[];
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

const supportedApprovalMethods = new Set([
  "item/commandExecution/requestApproval",
  "item/fileChange/requestApproval"
]);

function compactTraceValue(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function entryLabel(entry: CodexProtocolLedgerEntry): string {
  return compactTraceValue(entry.title ?? entry.detail ?? entry.itemType ?? entry.method) || entry.kind;
}

function entryStatus(entry: CodexProtocolLedgerEntry): string {
  return compactTraceValue(entry.status ?? entry.summary ?? entry.message) || "observed";
}

function formatTraceLine(entry: CodexProtocolLedgerEntry): string {
  const subject = entryLabel(entry);
  const status = entryStatus(entry);
  const parts = [
    subject,
    status ? `status=${status}` : "",
    entry.itemId ? `item=${entry.itemId}` : "",
    entry.turnId ? `turn=${entry.turnId}` : "",
    entry.delta ? `output=${entry.delta.trim()}` : "",
    entry.message && entry.message !== status ? `message=${entry.message}` : "",
    entry.summary && entry.summary !== status ? `summary=${entry.summary}` : "",
    entry.detail && entry.detail !== subject ? `detail=${entry.detail}` : ""
  ].filter(Boolean);
  return parts.join(" | ");
}

function sectionFromEntries(
  id: string,
  kind: PanelChatSectionKind,
  title: string,
  entries: readonly CodexProtocolLedgerEntry[],
  emptySummary: string
): PanelChatSection | undefined {
  if (entries.length === 0) {
    return undefined;
  }

  const failed = entries.filter((entry) => entry.status === "failed" || entry.kind === "error").length;
  const partial = entries.filter((entry) => !entry.status || entry.status === "inProgress" || entry.status === "running").length;
  const summary = failed > 0
    ? `${failed} failed / ${entries.length} total`
    : partial > 0
      ? `${partial} active / ${entries.length} total`
      : emptySummary;

  return {
    id,
    kind,
    title,
    summary,
    body: entries.map((entry, index) => `${index + 1}. ${formatTraceLine(entry)}`).join("\n")
  };
}

function isSupportedApprovalEntry(entry: CodexProtocolLedgerEntry): boolean {
  return entry.kind === "approval_request" &&
    typeof entry.requestId === "string" &&
    entry.requestId.trim().length > 0 &&
    supportedApprovalMethods.has(entry.method);
}

export function createCodexApprovalRequestMessage(
  session: SessionSummary,
  index: number,
  entry: CodexProtocolLedgerEntry
): PanelChatMessage {
  const supported = isSupportedApprovalEntry(entry);
  const state = supported ? "waiting" : "blocked";
  const subject = entryLabel(entry);
  const reason = compactTraceValue(entry.message ?? entry.summary ?? entry.detail) ||
    (supported
      ? "Codex is waiting for an approval decision."
      : "This approval request method is not supported by Steerboard yet.");
  const body = [
    `${subject} approval is ${state}.`,
    reason,
    entry.threadId ? `Thread: ${entry.threadId}` : undefined,
    entry.turnId ? `Turn: ${entry.turnId}` : undefined,
    entry.itemId ? `Item: ${entry.itemId}` : undefined,
    supported
      ? "Choose an approval decision to continue the active Codex turn."
      : "Next action: retry with a supported approval request or continue in Codex Desktop."
  ].filter(Boolean).join("\n");

  const payload = supported
    ? {
        requestId: entry.requestId as string,
        method: entry.method,
        threadId: entry.threadId,
        turnId: entry.turnId,
        itemId: entry.itemId
      }
    : undefined;

  return {
    id: `${session.id}:approval:${entry.requestId ?? entry.itemId ?? index}`,
    role: "system",
    label: "Codex approval",
    body,
    meta: `approval ${state}`,
    actions: supported
      ? [
          {
            id: `${session.id}:approval:${entry.requestId}:accept`,
            kind: "codex-approval-approve",
            label: "Approve",
            title: "Approve this Codex request once.",
            payload
          },
          {
            id: `${session.id}:approval:${entry.requestId}:accept-session`,
            kind: "codex-approval-approve-session",
            label: "Approve session",
            title: "Approve this request for the current Codex session when supported.",
            payload
          },
          {
            id: `${session.id}:approval:${entry.requestId}:decline`,
            kind: "codex-approval-decline",
            label: "Decline",
            title: "Decline this Codex request.",
            payload
          },
          {
            id: `${session.id}:approval:${entry.requestId}:cancel`,
            kind: "codex-approval-cancel",
            label: "Cancel",
            title: "Cancel this Codex request.",
            payload
          }
        ]
      : undefined
  };
}

export function updateCodexApprovalMessageState(
  message: PanelChatMessage,
  state: "approved" | "approved-session" | "declined" | "canceled" | "failed" | "stale",
  detail: string
): PanelChatMessage {
  const disabledActions = message.actions?.map((action) => ({ ...action, disabled: true }));
  return {
    ...message,
    body: `${message.body}\n\nDecision: ${state}. ${detail}`.trim(),
    meta: `approval ${state}`,
    actions: disabledActions
  };
}

export function buildCodexProtocolTraceSections(
  ledger: readonly CodexProtocolLedgerEntry[]
): PanelChatSection[] {
  const useful = ledger.filter((entry) =>
    !(
      entry.kind === "agent_message" &&
      entry.method === "item/agentMessage/delta"
    )
  );
  const reasoning = useful.filter((entry) => entry.kind === "reasoning");
  const plans = useful.filter((entry) => entry.kind === "plan_update");
  const commands = useful.filter((entry) =>
    entry.kind === "command_execution" || entry.kind === "command_output_delta"
  );
  const files = useful.filter((entry) => entry.kind === "file_change");
  const tools = useful.filter((entry) =>
    entry.kind === "mcp_call" || entry.kind === "web_search" || entry.kind === "image_view"
  );
  const statuses = useful.filter((entry) =>
    entry.kind === "turn_status" ||
    entry.kind === "error" ||
    entry.kind === "approval_request" ||
    entry.kind === "unknown"
  );

  return [
    sectionFromEntries("protocol-reasoning", "steps", "Reasoning and plan", reasoning, `${reasoning.length} update${reasoning.length === 1 ? "" : "s"}`),
    sectionFromEntries("protocol-plan", "steps", "Plan updates", plans, `${plans.length} update${plans.length === 1 ? "" : "s"}`),
    sectionFromEntries("protocol-commands", "commands", "Command executions", commands, `${commands.length} event${commands.length === 1 ? "" : "s"}`),
    sectionFromEntries("protocol-files", "trace", "File changes", files, `${files.length} change${files.length === 1 ? "" : "s"}`),
    sectionFromEntries("protocol-tools", "trace", "Tool and context calls", tools, `${tools.length} call${tools.length === 1 ? "" : "s"}`),
    sectionFromEntries("protocol-status", "trace", "Turn status and requests", statuses, `${statuses.length} event${statuses.length === 1 ? "" : "s"}`)
  ].filter((section): section is PanelChatSection => section !== undefined);
}

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
    (value.kind === "feedback" || value.kind === "steps" || value.kind === "commands" || value.kind === "trace") &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    typeof value.body === "string"
  );
}

function isPanelChatAction(value: unknown): value is PanelChatAction {
  if (!isRecord(value)) {
    return false;
  }
  const payload = value.payload;
  const payloadValid = payload === undefined || (
    isRecord(payload) &&
    typeof payload.requestId === "string" &&
    typeof payload.method === "string" &&
    (payload.threadId === undefined || typeof payload.threadId === "string") &&
    (payload.turnId === undefined || typeof payload.turnId === "string") &&
    (payload.itemId === undefined || typeof payload.itemId === "string")
  );

  return (
    typeof value.id === "string" &&
    (
      value.kind === "codex-approval-approve" ||
      value.kind === "codex-approval-approve-session" ||
      value.kind === "codex-approval-decline" ||
      value.kind === "codex-approval-cancel"
    ) &&
    typeof value.label === "string" &&
    typeof value.title === "string" &&
    (value.disabled === undefined || typeof value.disabled === "boolean") &&
    payloadValid
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
    (value.sections === undefined || (Array.isArray(value.sections) && value.sections.every(isPanelChatSection))) &&
    (value.actions === undefined || (Array.isArray(value.actions) && value.actions.every(isPanelChatAction)))
  );
}

function normalizePanelChatMessage(message: PanelChatMessage): PanelChatMessage {
  const actions = message.actions
    ?.filter(isPanelChatAction)
    .filter((action) => action.label.trim().length > 0);
  const sections = message.sections
    ?.filter(isPanelChatSection)
    .filter((section) => section.body.trim().length > 0);

  if ((!sections || sections.length === 0) && (!actions || actions.length === 0)) {
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
    sections,
    actions
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

export function createPanelProviderPrompt(
  submittedMessage: string,
  decision?: PanelSlashCommandDecision
): string {
  if (decision?.command?.command !== "/plan") {
    return submittedMessage;
  }

  const request = submittedMessage.replace(/^\/plan\b/i, "").trim();
  return [
    "Use Codex /plan behavior for this request.",
    "",
    "Original planning request:",
    request || "(No additional request text was provided.)",
    "",
    "Follow these rules:",
    "- Stay read-only and do not modify files.",
    "- First ask 1-3 concise clarification questions if the target, scope, success criteria, or constraints are missing or risky.",
    "- If the request is clear enough, produce only a concise plan.",
    "- Format the plan with # Plan, ## Scope, ## Action items, and ## Open questions.",
    "- Keep action items ordered from discovery to changes to validation and rollout."
  ].join("\n");
}

export function createPanelPlanCollaborationPrompt(submittedMessage: string): string {
  const request = submittedMessage.replace(/^\/plan\b/i, "").trim();
  return request || "Make a plan for the current task. Ask one to three concise clarification questions first if needed.";
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

export function createPanelLiveActivityMessage(
  session: SessionSummary,
  sequence: number,
  body: string,
  sections: PanelChatSection[] = []
): PanelChatMessage {
  return {
    id: `${session.id}:live-activity:${sequence}`,
    role: "system",
    label: "Codex Live",
    body,
    meta: "working",
    sections
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
