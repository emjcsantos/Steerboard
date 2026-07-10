import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  ORCHESTRATOR_CHAT_RECIPIENT,
  loadOrchestratorChatState,
  OrchestratorChat,
  normalizeOrchestratorChatState,
  parseStoredOrchestratorChatState,
  saveOrchestratorChatState,
  selectOrchestratorWatchingContext,
  type OrchestratorChatState
} from "./orchestratorChat";

const initialState: OrchestratorChatState = {
  messages: [
    { id: "message-user", author: "user", body: "What is blocked?" },
    {
      id: "message-orchestrator",
      author: "orchestrator",
      body: "Worker 2 is waiting on validation.",
      contextLinks: [
        { kind: "job", id: "job-2", label: "Job 2" },
        { kind: "validation", id: "validation-2", label: "Validation 2" },
        { kind: "evidence", id: "evidence-2", label: "Evidence 2" }
      ]
    }
  ],
  width: 384,
  collapsed: false,
  watchingContext: {
    kind: "worker",
    id: "worker-2",
    label: "Worker 2"
  }
};

const runCounts = {
  active: 2,
  waiting: 1,
  validating: 1,
  blocked: 0
};

describe("orchestrator chat state", () => {
  it("has one immutable recipient and repairs persisted content to user/orchestrator messages only", () => {
    expect(ORCHESTRATOR_CHAT_RECIPIENT).toBe("orchestrator");

    const repaired = normalizeOrchestratorChatState({
      messages: [
        { id: "user", author: "user", body: "Status?" },
        { id: "main", author: "orchestrator", body: "Working." },
        { id: "worker", author: "worker", body: "Direct worker reply" },
        { id: "broadcast", author: "all-workers", body: "Broadcast" },
        null
      ],
      width: 99_999,
      collapsed: "yes",
      watchingContext: { kind: "worker", id: "worker-3", label: "Worker 3" }
    });

    expect(repaired.messages).toEqual([
      { id: "user", author: "user", body: "Status?" },
      { id: "main", author: "orchestrator", body: "Working." }
    ]);
    expect(repaired.width).toBeLessThan(99_999);
    expect(repaired.collapsed).toBe(false);
    expect(repaired.watchingContext).toEqual({
      kind: "worker",
      id: "worker-3",
      label: "Worker 3"
    });
  });

  it("returns safe defaults for malformed JSON and malformed persisted fields", () => {
    expect(parseStoredOrchestratorChatState("{")).toEqual({
      messages: [],
      width: 384,
      collapsed: false
    });

    expect(
      parseStoredOrchestratorChatState(
        JSON.stringify({
          messages: "private transcript",
          width: "wide",
          collapsed: 1,
          watchingContext: { kind: "shell", id: "secret", label: "Secret" }
        })
      )
    ).toEqual({
      messages: [],
      width: 384,
      collapsed: false
    });
  });

  it("changes only read-only watching context and never the chat recipient", () => {
    const selected = selectOrchestratorWatchingContext(initialState, {
      kind: "validator",
      id: "validator-1",
      label: "Validator 1"
    });

    expect(selected.watchingContext).toEqual({
      kind: "validator",
      id: "validator-1",
      label: "Validator 1"
    });
    expect(selected.messages).toBe(initialState.messages);
    expect(ORCHESTRATOR_CHAT_RECIPIENT).toBe("orchestrator");
    expect(selected).not.toHaveProperty("recipient");
  });

  it("persists messages, width, collapse, and watching context together", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value)
      }
    });
    saveOrchestratorChatState(initialState);

    expect(loadOrchestratorChatState()).toEqual(initialState);
    vi.unstubAllGlobals();
  });
});

describe("OrchestratorChat", () => {
  it("renders a fixed orchestrator composer, truthful read-only counts, and durable context links", () => {
    const html = renderToStaticMarkup(
      <OrchestratorChat
        onCollapsedChange={() => undefined}
        onSendMessage={() => undefined}
        runCounts={runCounts}
        state={initialState}
      />
    );

    expect(html).toContain("Orchestrator Chat");
    expect(html).toContain("To: Orchestrator");
    expect(html).toContain('data-chat-recipient="orchestrator"');
    expect(html.match(/data-chat-author=/g)).toHaveLength(2);
    expect(html).toContain('data-chat-author="user"');
    expect(html).toContain('data-chat-author="orchestrator"');
    expect(html).not.toMatch(/worker chat|validator chat|all workers|broadcast/i);

    expect(html).toContain('aria-label="Run context counts"');
    expect(html).toContain("Active 2");
    expect(html).toContain("Waiting 1");
    expect(html).toContain("Validating 1");
    expect(html).toContain("Blocked 0");
    expect(html).toContain('data-read-only="true"');

    expect(html).toContain("Watching Worker 2");
    expect(html).toContain('data-watching-context="worker-2"');
    expect(html).toContain("Job 2");
    expect(html).toContain("Validation 2");
    expect(html).toContain("Evidence 2");
  });

  it("renders composer text for the fixed orchestrator route without exposing recipient selection", () => {
    const onSendMessage = vi.fn();
    const html = renderToStaticMarkup(
      <OrchestratorChat
        draft="Please summarize the run"
        onCollapsedChange={() => undefined}
        onSendMessage={onSendMessage}
        runCounts={runCounts}
        state={initialState}
      />
    );

    expect(html).toContain('<form aria-label="Message the orchestrator"');
    expect(html).toContain('name="orchestrator-message"');
    expect(html).toContain("Please summarize the run");
    expect(html).not.toContain("<select");
    expect(html).not.toContain('name="recipient"');
  });

  it("keeps collapse keyboard-accessible with the toggle as the stable focus return target", () => {
    const expandedHtml = renderToStaticMarkup(
      <OrchestratorChat
        onCollapsedChange={() => undefined}
        onSendMessage={() => undefined}
        runCounts={runCounts}
        state={initialState}
      />
    );
    const collapsedHtml = renderToStaticMarkup(
      <OrchestratorChat
        onCollapsedChange={() => undefined}
        onSendMessage={() => undefined}
        runCounts={runCounts}
        state={{ ...initialState, collapsed: true }}
      />
    );

    expect(expandedHtml).toContain('aria-expanded="true"');
    expect(collapsedHtml).toContain('aria-expanded="false"');
    expect(expandedHtml).toContain('aria-controls="orchestrator-chat-panel"');
    expect(collapsedHtml).toContain('data-focus-return-target="true"');
    expect(collapsedHtml).toContain('aria-label="Expand Orchestrator Chat"');
    expect(collapsedHtml).not.toContain('role="dialog"');
    expect(collapsedHtml).not.toContain('aria-modal="true"');
  });

  it("uses a beside-canvas layout and an explicit non-overlay compact fallback", () => {
    const besideHtml = renderToStaticMarkup(
      <OrchestratorChat
        compact={false}
        onCollapsedChange={() => undefined}
        onSendMessage={() => undefined}
        runCounts={runCounts}
        state={initialState}
      />
    );
    const compactHtml = renderToStaticMarkup(
      <OrchestratorChat
        compact
        onCollapsedChange={() => undefined}
        onSendMessage={() => undefined}
        runCounts={runCounts}
        state={initialState}
      />
    );

    expect(besideHtml).toContain('data-panel-layout="beside-canvas"');
    expect(compactHtml).toContain('data-panel-layout="compact-non-overlay"');
    expect(compactHtml).toContain('data-overlay="false"');
    expect(compactHtml).not.toContain('role="dialog"');
  });
});
