import { describe, expect, it } from "vitest";
import {
  buildInitialPanelChat,
  codexSessionStateToPanelMessages,
  createPanelLiveErrorMessage,
  createPanelLiveStatusMessage,
  createPanelReplyMessage,
  getPanelSlashCommandDecision,
  getPanelSlashCommandSuggestions,
  normalizePanelChatMessages,
  parseStoredPanelChatThreads,
  type PanelChatMessage
} from "./panelChat";
import type { SessionSummary } from "./fixtures";

const session: SessionSummary = {
  attempt: 1,
  branch: "work/layout",
  files: ["src/App.tsx"],
  id: "panel-1",
  projectId: "website-refresh",
  role: "orchestrator",
  runtime: "Local Runtime A",
  state: "planning",
  title: "Refresh Launch Plan",
  tools: ["Read", "Edit"],
  transcript: ["Drafting the plan.", "Reading files."],
  validation: "Pending"
};

describe("panel chat helpers", () => {
  it("builds a provider-ready initial local transcript", () => {
    const messages = buildInitialPanelChat(session);

    expect(messages[0]).toMatchObject({
      role: "system",
      label: "Steerboard",
      meta: "local"
    });
    expect(messages.some((message) => message.body.includes("Current validation"))).toBe(true);
  });

  it("suggests slash commands only when the draft starts with slash input", () => {
    expect(getPanelSlashCommandSuggestions("hello")).toEqual([]);
    expect(getPanelSlashCommandSuggestions("/val").map((item) => item.command)).toEqual(["/validate"]);
    expect(getPanelSlashCommandSuggestions("/")).toHaveLength(7);
  });

  it("routes slash commands according to catalog capability and live transport", () => {
    expect(getPanelSlashCommandDecision("regular message", false)).toMatchObject({
      route: "none",
      executable: true
    });
    expect(getPanelSlashCommandDecision("/validate now", false)).toMatchObject({
      route: "local-preview",
      executable: true,
      state: "preview"
    });
    expect(getPanelSlashCommandDecision("/plan next", false)).toMatchObject({
      route: "blocked",
      executable: false,
      state: "unavailable"
    });
    expect(getPanelSlashCommandDecision("/plan next", true)).toMatchObject({
      route: "provider",
      executable: true,
      state: "live"
    });
    expect(getPanelSlashCommandDecision("/mcp list", true)).toMatchObject({
      route: "blocked",
      executable: false,
      state: "unsupported"
    });
    expect(getPanelSlashCommandDecision("/unknown", true)).toMatchObject({
      route: "blocked",
      executable: false,
      state: "unknown"
    });
  });

  it("creates a command-aware local reply", () => {
    expect(createPanelReplyMessage(session, 4, "/validate this").meta).toBe("slash command preview");
    expect(createPanelReplyMessage(session, 4, "/plan this").meta).toBe("slash command blocked");
    expect(createPanelReplyMessage(session, 4, "regular message").meta).toBe("local adapter pending");
  });

  it("creates live status and error messages for Codex panel activity", () => {
    expect(createPanelLiveStatusMessage(session, 2, "Starting live session")).toMatchObject({
      role: "system",
      label: "Steerboard",
      body: "Starting live session",
      meta: "live codex"
    });
    expect(createPanelLiveErrorMessage(session, 3, "Transport failed")).toMatchObject({
      role: "system",
      label: "Codex connection",
      body: "Transport failed",
      meta: "live error"
    });
  });

  it("maps normalized Codex session messages into panel chat messages", () => {
    expect(
      codexSessionStateToPanelMessages(session, {
        connection: { status: "connected" },
        messages: [
          {
            id: "assistant-a",
            role: "assistant",
            body: "Live answer",
            status: "completed"
          },
          {
            id: "empty",
            role: "assistant",
            body: " ",
            status: "completed"
          }
        ],
        turns: [],
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        errors: [],
        unknownEvents: []
      })
    ).toEqual([
      {
        id: "panel-1:live:assistant-a:0",
        role: "codex",
        label: "Codex Live",
        body: "Live answer",
        meta: "completed"
      }
    ]);
  });

  it("repairs malformed stored thread payloads", () => {
    const fallback: PanelChatMessage[] = [
      { id: "fallback", role: "system", label: "Fallback", body: "Safe", meta: "local" }
    ];

    expect(normalizePanelChatMessages(null, fallback)).toEqual(fallback);
    expect(normalizePanelChatMessages([{ id: "bad" }], fallback)).toEqual(fallback);
    expect(parseStoredPanelChatThreads("{")).toEqual({});
    expect(
      parseStoredPanelChatThreads(
        JSON.stringify({
          "panel-1": [
            { id: "ok", role: "user", label: "You", body: "Hello", meta: "draft" },
            { id: "bad" }
          ]
        })
      )
    ).toEqual({
      "panel-1": [{ id: "ok", role: "user", label: "You", body: "Hello", meta: "draft" }]
    });
  });
});
