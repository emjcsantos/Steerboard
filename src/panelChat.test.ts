import { describe, expect, it } from "vitest";
import {
  buildInitialPanelChat,
  codexSessionStateToPanelMessages,
  createPanelLiveErrorMessage,
  createPanelLiveStatusMessage,
  createPanelSlashCommandStatusMessage,
  createPanelReplyMessage,
  getPanelSlashCommandDecision,
  getPanelSlashCommandSuggestions,
  normalizePanelChatMessages,
  parseStoredPanelChatThreads,
  type PanelSlashCommand,
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
    expect(getPanelSlashCommandSuggestions("/")).toHaveLength(5);

    const refreshedCatalog: PanelSlashCommand[] = [
      {
        command: "/refresh",
        label: "Refresh",
        detail: "Provider refreshed suggestion.",
        state: "preview",
        scopes: ["panel"]
      }
    ];
    expect(getPanelSlashCommandSuggestions("/re", refreshedCatalog).map((item) => item.command)).toEqual([
      "/refresh"
    ]);
  });

  it("routes slash commands according to catalog capability and live transport", () => {
    expect(getPanelSlashCommandDecision("regular message", false)).toMatchObject({
      route: "none",
      executable: true,
      feedback: {
        statusLabel: "Local message",
        severity: "info"
      }
    });
    expect(getPanelSlashCommandDecision("/validate now", false)).toMatchObject({
      route: "local-preview",
      executable: true,
      state: "preview",
      feedback: {
        statusLabel: "Preview",
        severity: "info",
        nextAction: "Run locally and review staged result before provider execution."
      }
    });
    expect(getPanelSlashCommandDecision("/plan next", false)).toMatchObject({
      route: "blocked",
      executable: false,
      state: "unavailable",
      feedback: {
        statusLabel: "Blocked",
        severity: "warning",
        nextAction: "Enable live transport or retry once provider connectivity is active."
      }
    });
    expect(getPanelSlashCommandDecision("/plan next", true)).toMatchObject({
      route: "provider",
      executable: true,
      state: "live",
      feedback: {
        statusLabel: "Ready",
        severity: "success",
        nextAction: "Route this command through the connected provider."
      }
    });
    expect(getPanelSlashCommandDecision("/mcp list", true)).toMatchObject({
      route: "blocked",
      executable: false,
      state: "unsupported",
      command: { command: "/mcp" },
      reason: "/mcp is not available in this panel context.",
      feedback: {
        statusLabel: "Unsupported",
        severity: "error",
        nextAction: "Use a supported command that is enabled for this panel."
      }
    });
    expect(getPanelSlashCommandDecision("/status report", true)).toMatchObject({
      route: "blocked",
      executable: false,
      state: "unsupported",
      command: { command: "/status" },
      reason: "/status is not available in this panel context.",
      feedback: {
        statusLabel: "Unsupported",
        severity: "error",
        nextAction: "Use a supported command that is enabled for this panel."
      }
    });
    expect(getPanelSlashCommandDecision("/unknown", true)).toMatchObject({
      route: "blocked",
      executable: false,
      state: "unknown",
      feedback: {
        statusLabel: "Unknown",
        severity: "error",
        nextAction: "Use a supported slash command from the catalog."
      }
    });

    expect(
      getPanelSlashCommandDecision(
        "/global-preview candidate",
        false,
        [
          {
            command: "/global-preview",
            label: "Global Preview",
            detail: "Global-only preview command.",
            state: "preview",
            scopes: ["global"]
          }
        ]
      )
    ).toMatchObject({
      route: "blocked",
      executable: false,
      state: "unsupported",
      command: { command: "/global-preview" },
      reason: "/global-preview is not available in this panel context.",
      feedback: {
        statusLabel: "Unsupported",
        severity: "error",
        nextAction: "Use a supported command that is enabled for this panel."
      }
    });

    const refreshedCatalog: PanelSlashCommand[] = [
      {
        command: "/refresh",
        label: "Refresh",
        detail: "Provider live command.",
        state: "live",
        scopes: ["panel"]
      },
      {
        command: "/review-preview",
        label: "Review Preview",
        detail: "Provider preview command.",
        state: "preview",
        scopes: ["panel"]
      }
    ];

    expect(getPanelSlashCommandDecision("/refresh now", false, refreshedCatalog)).toMatchObject({
      route: "blocked",
      executable: false,
      state: "unavailable",
      feedback: {
        statusLabel: "Blocked",
        severity: "warning"
      }
    });
    expect(getPanelSlashCommandDecision("/review-preview now", false, refreshedCatalog)).toMatchObject({
      route: "local-preview",
      executable: true,
      state: "preview"
    });
  });

  it("creates a command-aware local reply", () => {
    expect(createPanelReplyMessage(session, 4, "/validate this").meta).toBe("slash command preview");
    expect(createPanelReplyMessage(session, 4, "/plan this").body).toMatch(/Blocked|Unable|Route/);
    expect(createPanelReplyMessage(session, 4, "/validate this").body).toMatch(/preview/);
    expect(createPanelReplyMessage(session, 4, "/plan this").meta).toBe("slash command blocked");
    expect(createPanelReplyMessage(session, 4, "/status now").body).toContain(
      "not available in this panel context"
    );
    expect(createPanelReplyMessage(session, 4, "regular message").meta).toBe("local adapter pending");
    expect(
      createPanelReplyMessage(session, 4, "/review-preview now", [
        {
          command: "/review-preview",
          label: "Review Preview",
          detail: "Provider preview command.",
          state: "preview",
          scopes: ["panel"]
        }
      ]).meta
    ).toBe("slash command preview");
  });

  it("renders a structured status message for blocked slash decisions", () => {
    const blockedDecision = getPanelSlashCommandDecision("/mcp list", true);
    const statusMessage = createPanelSlashCommandStatusMessage(session, 9, blockedDecision);

    expect(statusMessage.meta).toBe("slash command blocked");
    expect(statusMessage.body).toContain("Unsupported");
    expect(statusMessage.body).toContain("/mcp");
    expect(statusMessage.body).toContain("Use a supported command");
  });

  it("renders an explicit local-provider message for non-executable unknown commands", () => {
    const unknownDecision = getPanelSlashCommandDecision("/unknown", true);
    const statusMessage = createPanelSlashCommandStatusMessage(session, 10, unknownDecision);

    expect(statusMessage.body).toContain("Unknown");
    expect(statusMessage.body).toContain("Use a supported slash command");
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
