import { useState, type CSSProperties, type FormEvent } from "react";

export const ORCHESTRATOR_CHAT_RECIPIENT = "orchestrator" as const;
export const ORCHESTRATOR_CHAT_STORAGE_KEY = "steerboard.orchestratorChat.v1";

export type OrchestratorChatAuthor = "user" | "orchestrator";
export type OrchestratorContextKind = "task" | "job" | "validation" | "evidence";

export interface OrchestratorChatContextLink {
  kind: OrchestratorContextKind;
  id: string;
  label: string;
}

export interface OrchestratorChatMessage {
  id: string;
  author: OrchestratorChatAuthor;
  body: string;
  contextLinks?: OrchestratorChatContextLink[];
}

export interface OrchestratorWatchingContext {
  kind: "worker" | "validator";
  id: string;
  label: string;
}

export interface OrchestratorChatState {
  messages: OrchestratorChatMessage[];
  width: number;
  collapsed: boolean;
  watchingContext?: OrchestratorWatchingContext;
}

export interface OrchestratorRunContextCounts {
  active: number;
  waiting: number;
  validating: number;
  blocked: number;
}

const DEFAULT_CHAT_WIDTH = 384;

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function safeText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/[<>\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 2000) : undefined;
}

function normalizeContextLinks(value: unknown): OrchestratorChatContextLink[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const links = value.flatMap((candidate): OrchestratorChatContextLink[] => {
    const item = record(candidate);
    const kind = item?.kind;
    const id = safeText(item?.id);
    const label = safeText(item?.label);
    if ((kind !== "task" && kind !== "job" && kind !== "validation" && kind !== "evidence") || !id || !label) {
      return [];
    }
    return [{ kind, id, label }];
  });
  return links.length ? links.slice(0, 8) : undefined;
}

export function normalizeOrchestratorChatState(value: unknown): OrchestratorChatState {
  const source = record(value) ?? {};
  const messages = Array.isArray(source.messages)
    ? source.messages.flatMap((candidate, index): OrchestratorChatMessage[] => {
        const item = record(candidate);
        const author = item?.author;
        const id = safeText(item?.id) ?? `orchestrator-chat-${index + 1}`;
        const body = safeText(item?.body);
        if ((author !== "user" && author !== "orchestrator") || !body) return [];
        const contextLinks = normalizeContextLinks(item?.contextLinks);
        return [{ id, author, body, ...(contextLinks ? { contextLinks } : {}) }];
      }).slice(-80)
    : [];
  const requestedWidth = Number(source.width);
  const width = typeof source.width === "number" && Number.isFinite(requestedWidth)
    ? Math.min(520, Math.max(300, Math.round(requestedWidth)))
    : DEFAULT_CHAT_WIDTH;
  const watching = record(source.watchingContext);
  const watchingKind = watching?.kind === "worker" || watching?.kind === "validator"
    ? watching.kind
    : undefined;
  const watchingId = safeText(watching?.id);
  const watchingLabel = safeText(watching?.label);
  const watchingContext: OrchestratorWatchingContext | undefined =
    watchingKind &&
    watchingId &&
    watchingLabel
      ? {
          kind: watchingKind,
          id: watchingId,
          label: watchingLabel
        }
      : undefined;
  return {
    messages,
    width,
    collapsed: typeof source.collapsed === "boolean" ? source.collapsed : false,
    ...(watchingContext ? { watchingContext } : {})
  };
}

export function parseStoredOrchestratorChatState(serialized: string | null): OrchestratorChatState {
  if (!serialized) return normalizeOrchestratorChatState(undefined);
  try {
    return normalizeOrchestratorChatState(JSON.parse(serialized));
  } catch {
    return normalizeOrchestratorChatState(undefined);
  }
}

export function loadOrchestratorChatState(): OrchestratorChatState {
  return typeof window === "undefined"
    ? normalizeOrchestratorChatState(undefined)
    : parseStoredOrchestratorChatState(window.localStorage.getItem(ORCHESTRATOR_CHAT_STORAGE_KEY));
}

export function saveOrchestratorChatState(state: OrchestratorChatState): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ORCHESTRATOR_CHAT_STORAGE_KEY, JSON.stringify(normalizeOrchestratorChatState(state)));
  }
}

export function selectOrchestratorWatchingContext(
  state: OrchestratorChatState,
  watchingContext: OrchestratorWatchingContext | undefined
): OrchestratorChatState {
  return { ...state, watchingContext };
}

export function OrchestratorChat({
  compact = false,
  draft = "",
  onCollapsedChange,
  onSendMessage,
  onStateChange,
  runCounts,
  state
}: {
  compact?: boolean;
  draft?: string;
  onCollapsedChange: (collapsed: boolean) => void;
  onSendMessage: (message: string) => void;
  onStateChange?: (state: OrchestratorChatState) => void;
  runCounts: OrchestratorRunContextCounts;
  state: OrchestratorChatState;
}) {
  const [messageDraft, setMessageDraft] = useState(draft);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = messageDraft.trim();
    if (!body) return;
    onSendMessage(body);
    setMessageDraft("");
  }

  return (
    <aside
      aria-label="Orchestrator Chat"
      className="orchestrator-chat"
      data-chat-recipient={ORCHESTRATOR_CHAT_RECIPIENT}
      data-collapsed={state.collapsed}
      data-overlay="false"
      data-panel-layout={compact ? "compact-non-overlay" : "beside-canvas"}
      style={{ "--orchestrator-chat-width": `${state.width}px` } as CSSProperties}
    >
      <header>
        <div>
          <strong>Orchestrator Chat</strong>
          <span>To: Orchestrator</span>
        </div>
        <button
          aria-controls="orchestrator-chat-panel"
          aria-expanded={!state.collapsed}
          aria-label={`${state.collapsed ? "Expand" : "Collapse"} Orchestrator Chat`}
          data-focus-return-target="true"
          onClick={() => onCollapsedChange(!state.collapsed)}
          type="button"
        >
          {state.collapsed ? "Expand" : "Collapse"}
        </button>
      </header>
      {!state.collapsed ? (
        <div id="orchestrator-chat-panel">
          <label className="orchestrator-chat-width">
            Panel width
            <input
              aria-label="Orchestrator Chat panel width"
              max="520"
              min="300"
              onChange={(event) => onStateChange?.({ ...state, width: Number(event.currentTarget.value) })}
              type="range"
              value={state.width}
            />
          </label>
          <dl aria-label="Run context counts" data-read-only="true">
            <div aria-label={`Active ${runCounts.active}`}><dt>Active</dt><dd>{runCounts.active}</dd></div>
            <div aria-label={`Waiting ${runCounts.waiting}`}><dt>Waiting</dt><dd>{runCounts.waiting}</dd></div>
            <div aria-label={`Validating ${runCounts.validating}`}><dt>Validating</dt><dd>{runCounts.validating}</dd></div>
            <div aria-label={`Blocked ${runCounts.blocked}`}><dt>Blocked</dt><dd>{runCounts.blocked}</dd></div>
          </dl>
          {state.watchingContext ? (
            <p data-watching-context={state.watchingContext.id}>
              Watching {state.watchingContext.label} <span>(read-only)</span>
            </p>
          ) : (
            <p>No worker or validator selected for watching.</p>
          )}
          <div aria-label="Orchestrator chat transcript" className="orchestrator-chat-transcript">
            {state.messages.map((message) => (
              <article data-chat-author={message.author} key={message.id}>
                <strong>{message.author === "user" ? "You" : "Orchestrator"}</strong>
                <p>{message.body}</p>
                {message.contextLinks?.length ? (
                  <nav aria-label="Durable message context">
                    {message.contextLinks.map((link) => (
                      <a href={`#orchestrator-${link.kind}-${encodeURIComponent(link.id)}`} key={`${link.kind}:${link.id}`}>
                        {link.label}
                      </a>
                    ))}
                  </nav>
                ) : null}
              </article>
            ))}
          </div>
          <form aria-label="Message the orchestrator" onSubmit={submit}>
            <label>
              Message Orchestrator
              <input
                name="orchestrator-message"
                onChange={(event) => setMessageDraft(event.currentTarget.value)}
                value={messageDraft}
              />
            </label>
            <button disabled={!messageDraft.trim()} type="submit">Send</button>
          </form>
        </div>
      ) : null}
    </aside>
  );
}
