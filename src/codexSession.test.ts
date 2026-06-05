import { describe, expect, it } from "vitest";
import {
  createInitialCodexSessionState,
  normalizeCodexPanelTurnResultEvents,
  normalizeCodexProviderEvent,
  reduceCodexSessionEvent,
  reduceCodexSessionEvents,
  type CodexPanelTurnResultPayload,
  type CodexSessionEvent
} from "./codexSession";

describe("codex session event reducer", () => {
  it("tracks thread start, connection status, and turn start as UI-ready state", () => {
    const state = reduceCodexSessionEvents([
      {
        id: "connection-1",
        kind: "connection_status",
        status: "connected"
      },
      {
        id: "thread-1",
        kind: "thread_started",
        threadId: "thread-a",
        title: "Worker Panel"
      },
      {
        id: "turn-1",
        kind: "turn_started",
        threadId: "thread-a",
        turnId: "turn-a",
        prompt: "Implement event model."
      }
    ]);

    expect(state.connection.status).toBe("connected");
    expect(state.threadId).toBe("thread-a");
    expect(state.title).toBe("Worker Panel");
    expect(state.activeTurnId).toBe("turn-a");
    expect(state.turns).toEqual([
      {
        id: "turn-a",
        threadId: "thread-a",
        status: "streaming",
        prompt: "Implement event model."
      }
    ]);
  });

  it("appends streamed assistant deltas into one message for the active turn", () => {
    const events: CodexSessionEvent[] = [
      {
        id: "turn-1",
        kind: "turn_started",
        turnId: "turn-a"
      },
      {
        id: "delta-1",
        kind: "agent_delta",
        turnId: "turn-a",
        itemId: "assistant-a",
        delta: "Hello"
      },
      {
        id: "delta-2",
        kind: "agent_delta",
        turnId: "turn-a",
        itemId: "assistant-a",
        delta: ", Master."
      }
    ];

    const state = reduceCodexSessionEvents(events);

    expect(state.messages).toEqual([
      {
        id: "assistant-a",
        turnId: "turn-a",
        itemId: "assistant-a",
        role: "assistant",
        body: "Hello, Master.",
        status: "streaming"
      }
    ]);
    expect(state.turns[0].status).toBe("streaming");
  });

  it("replaces a streamed draft with the completed assistant item", () => {
    const state = reduceCodexSessionEvents([
      {
        id: "delta-1",
        kind: "agent_delta",
        turnId: "turn-a",
        itemId: "assistant-a",
        delta: "Partial"
      },
      {
        id: "item-1",
        kind: "item_completed",
        turnId: "turn-a",
        itemId: "assistant-a",
        role: "assistant",
        content: "Final answer",
        status: "completed"
      },
      {
        id: "turn-1",
        kind: "turn_completed",
        turnId: "turn-a",
        status: "completed",
        summary: "Done"
      }
    ]);

    expect(state.activeTurnId).toBeUndefined();
    expect(state.turns[0]).toMatchObject({
      id: "turn-a",
      status: "completed",
      summary: "Done"
    });
    expect(state.messages).toEqual([
      {
        id: "assistant-a",
        turnId: "turn-a",
        itemId: "assistant-a",
        role: "assistant",
        body: "Final answer",
        status: "completed"
      }
    ]);
  });

  it("produces stable failed state from an error event", () => {
    const state = reduceCodexSessionEvents([
      {
        id: "turn-1",
        kind: "turn_started",
        turnId: "turn-a"
      },
      {
        id: "delta-1",
        kind: "agent_delta",
        turnId: "turn-a",
        delta: "Working"
      },
      {
        id: "error-1",
        kind: "error",
        turnId: "turn-a",
        message: "Provider exited unexpectedly.",
        code: "provider_exit",
        recoverable: false
      }
    ]);

    expect(state.connection).toEqual({
      status: "error",
      reason: "Provider exited unexpectedly."
    });
    expect(state.errors).toHaveLength(1);
    expect(state.turns[0]).toMatchObject({
      id: "turn-a",
      status: "failed",
      error: "Provider exited unexpectedly."
    });
    expect(state.messages[0]).toMatchObject({
      body: "Working",
      status: "failed"
    });
  });

  it("marks interrupted turns without losing streamed text", () => {
    const state = reduceCodexSessionEvents([
      {
        id: "delta-1",
        kind: "agent_delta",
        turnId: "turn-a",
        delta: "Keep this"
      },
      {
        id: "turn-1",
        kind: "turn_completed",
        turnId: "turn-a",
        status: "interrupted",
        summary: "User interrupted"
      }
    ]);

    expect(state.turns[0]).toMatchObject({
      id: "turn-a",
      status: "interrupted",
      summary: "User interrupted"
    });
    expect(state.messages[0]).toMatchObject({
      body: "Keep this",
      status: "interrupted"
    });
  });

  it("adds token usage globally and to the matching turn", () => {
    const state = reduceCodexSessionEvents([
      {
        id: "turn-1",
        kind: "turn_started",
        turnId: "turn-a"
      },
      {
        id: "usage-1",
        kind: "token_usage",
        turnId: "turn-a",
        usage: {
          inputTokens: 12,
          outputTokens: 8,
          totalTokens: 20
        }
      },
      {
        id: "usage-2",
        kind: "token_usage",
        usage: {
          inputTokens: 3,
          outputTokens: 2,
          totalTokens: 5
        }
      }
    ]);

    expect(state.usage).toEqual({
      inputTokens: 15,
      outputTokens: 10,
      totalTokens: 25
    });
    expect(state.turns[0].usage).toEqual({
      inputTokens: 12,
      outputTokens: 8,
      totalTokens: 20
    });
  });

  it("does not mutate the previous state while reducing", () => {
    const initial = createInitialCodexSessionState("connecting");
    const snapshot = JSON.parse(JSON.stringify(initial));

    const next = reduceCodexSessionEvent(initial, {
      id: "connection-1",
      kind: "connection_status",
      status: "connected"
    });

    expect(initial).toEqual(snapshot);
    expect(next).not.toBe(initial);
    expect(next.connection.status).toBe("connected");
  });

  it("normalizes backend panel turn results into UI-ready assistant messages", () => {
    const result: CodexPanelTurnResultPayload = {
      source: "desktop",
      sessionId: "session-a",
      threadId: "thread-a",
      turnId: "turn-a",
      completed: true,
      interrupted: false,
      failed: false,
      transcript: "Hello Master",
      detail: "Codex panel turn completed.",
      events: [
        {
          method: "item/agentMessage/delta",
          eventType: "agent_delta",
          turnId: "turn-a",
          status: null,
          delta: "Hello",
          message: null
        },
        {
          method: "item/agentMessage/delta",
          eventType: "agent_delta",
          turnId: "turn-a",
          status: null,
          delta: " Master",
          message: null
        },
        {
          method: "turn/completed",
          eventType: "turn_status",
          turnId: "turn-a",
          status: "completed",
          delta: null,
          message: null
        }
      ]
    };

    const state = reduceCodexSessionEvents(
      normalizeCodexPanelTurnResultEvents(result, "Say hello")
    );

    expect(state.threadId).toBe("thread-a");
    expect(state.turns[0]).toMatchObject({
      id: "turn-a",
      status: "completed",
      prompt: "Say hello"
    });
    expect(state.messages).toEqual([
      {
        id: "turn-a:assistant",
        turnId: "turn-a",
        itemId: undefined,
        role: "assistant",
        body: "Hello Master",
        status: "completed"
      }
    ]);
  });

  it("uses transcript fallback when no delta events are returned", () => {
    const state = reduceCodexSessionEvents(
      normalizeCodexPanelTurnResultEvents(
        {
          source: "desktop",
          sessionId: "session-a",
          threadId: "thread-a",
          turnId: "turn-a",
          completed: true,
          interrupted: false,
          failed: false,
          transcript: "Fallback text",
          detail: "Codex panel turn completed.",
          events: []
        },
        "Fallback prompt"
      )
    );

    expect(state.messages[0]).toMatchObject({
      role: "assistant",
      body: "Fallback text",
      status: "completed"
    });
  });
});

describe("codex provider event normalization", () => {
  it("normalizes Codex-shaped provider events into provider-neutral events", () => {
    expect(
      normalizeCodexProviderEvent({
        id: "raw-thread",
        type: "thread.started",
        data: {
          thread_id: "thread-a",
          title: "Panel"
        }
      })
    ).toMatchObject({
      id: "raw-thread",
      kind: "thread_started",
      threadId: "thread-a",
      title: "Panel"
    });

    expect(
      normalizeCodexProviderEvent({
        id: "raw-delta",
        type: "message.delta",
        turn_id: "turn-a",
        message_id: "assistant-a",
        text: "stream"
      })
    ).toMatchObject({
      id: "raw-delta",
      kind: "agent_delta",
      turnId: "turn-a",
      itemId: "assistant-a",
      delta: "stream"
    });

    expect(
      normalizeCodexProviderEvent({
        id: "raw-usage",
        type: "turn.usage",
        turnId: "turn-a",
        usage: {
          input_tokens: 4,
          output_tokens: 6
        }
      })
    ).toMatchObject({
      id: "raw-usage",
      kind: "token_usage",
      turnId: "turn-a",
      usage: {
        inputTokens: 4,
        outputTokens: 6,
        totalTokens: 10
      }
    });
  });

  it("defensively normalizes unknown or malformed provider events", () => {
    expect(normalizeCodexProviderEvent(null)).toMatchObject({
      kind: "provider_unknown",
      name: "non-record",
      summary: "Ignored malformed provider event."
    });

    const unknown = normalizeCodexProviderEvent({
      id: "raw-new",
      type: "provider.future_event",
      data: {
        value: 42
      }
    });
    const state = reduceCodexSessionEvents([unknown]);

    expect(unknown).toMatchObject({
      id: "raw-new",
      kind: "provider_unknown",
      name: "provider.future_event",
      summary: "Unsupported provider event: provider.future_event"
    });
    expect(state.unknownEvents).toEqual([unknown]);
  });
});
