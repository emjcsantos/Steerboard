import type { SessionSummary } from "./fixtures";
import type { CodexSessionMessage, CodexSessionState } from "./codexSession";

export type PanelChatRole = "codex" | "user" | "tool" | "system";

export interface PanelChatMessage {
  id: string;
  role: PanelChatRole;
  label: string;
  body: string;
  meta: string;
}

export interface PanelSlashCommand {
  command: string;
  label: string;
  detail: string;
}

export const PANEL_CHAT_STORAGE_KEY = "steerboard.panel.chat.v1";

export const panelSlashCommands: PanelSlashCommand[] = [
  {
    command: "/plan",
    label: "Plan",
    detail: "Ask the focused panel to turn the current context into next steps."
  },
  {
    command: "/handoff",
    label: "Handoff",
    detail: "Draft a scoped worker handoff from this panel."
  },
  {
    command: "/validate",
    label: "Validate",
    detail: "Ask for validation checks and evidence for this panel."
  },
  {
    command: "/summarize",
    label: "Summarize",
    detail: "Condense this panel into a transition-ready summary."
  }
];

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

export function getPanelSlashCommandSuggestions(value: string): PanelSlashCommand[] {
  const trimmed = value.trimStart();

  if (!trimmed.startsWith("/")) {
    return [];
  }

  const query = trimmed.split(/\s+/)[0].toLowerCase();
  return panelSlashCommands.filter((item) => item.command.startsWith(query));
}

export function createPanelReplyMessage(
  session: SessionSummary,
  sequence: number,
  submittedMessage = ""
): PanelChatMessage {
  const command = panelSlashCommands.find((item) => submittedMessage.trim().startsWith(item.command));

  if (command) {
    return {
      id: `${session.id}:codex-reply:${sequence}`,
      role: "codex",
      label: roleLabel(session.role),
      body: `${command.label} command staged locally. It will route to the connected provider when live transport is enabled.`,
      meta: "slash command preview"
    };
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

  const messages = value.filter(isPanelChatMessage);
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
