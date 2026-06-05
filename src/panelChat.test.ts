import { describe, expect, it } from "vitest";
import {
  buildInitialPanelChat,
  createPanelReplyMessage,
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
    expect(getPanelSlashCommandSuggestions("/")).toHaveLength(4);
  });

  it("creates a command-aware local reply", () => {
    expect(createPanelReplyMessage(session, 4, "/validate this").meta).toBe("slash command preview");
    expect(createPanelReplyMessage(session, 4, "regular message").meta).toBe("local adapter pending");
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
