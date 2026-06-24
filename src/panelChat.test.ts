import { describe, expect, it } from "vitest";
import {
  buildInitialPanelChat,
  buildCodexProtocolTraceSections,
  buildPanelLiveTurnEvidence,
  codexSessionStateToPanelMessages,
  createCodexApprovalRequestMessage,
  createPanelLiveErrorMessage,
  createPanelLiveActivityMessage,
  createPanelLiveRecoveryMessage,
  createPanelLiveStatusMessage,
  createPanelLiveTurnEvidenceMessage,
  createPanelSlashCommandStatusMessage,
  panelSlashCommands,
  createPanelProviderPrompt,
  createPanelReplyMessage,
  createPanelProviderSlashCommandStatusMessage,
  getPanelSlashCommandDecision,
  getPanelSlashCommandSuggestions,
  normalizePanelChatMessages,
  parseStoredPanelChatThreads,
  updateCodexApprovalMessageState,
  type PanelSlashCommand,
  type PanelChatMessage
} from "./panelChat";
import type { SessionSummary } from "./fixtures";
import type { CodexProtocolLedgerEntry } from "./codexSession";

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

  it("creates a visible provider-routed slash command status message", () => {
    const providerDecision = getPanelSlashCommandDecision("/plan now", true);
    const statusMessage = createPanelProviderSlashCommandStatusMessage(session, 11, providerDecision);

    expect(statusMessage.meta).toBe("slash command provider route");
    expect(statusMessage.body).toContain("/plan");
    expect(statusMessage.body).toContain(providerDecision.reason);
    expect(statusMessage.body).toContain(providerDecision.feedback.nextAction);
    expect(statusMessage.role).toBe("system");
  });

  it("creates a provider-routed slash command reply when caller opts into live transport", () => {
    const providerReply = createPanelReplyMessage(
      session,
      12,
      "/plan now",
      panelSlashCommands,
      true
    );

    expect(providerReply.meta).toBe("slash command provider route");
    expect(providerReply.body).toContain("/plan");
    expect(providerReply.body).toContain("provider");
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

  it("summarizes live turn stream evidence and recovery guidance", () => {
    const evidence = buildPanelLiveTurnEvidence({
      source: "desktop",
      panelId: "panel-1",
      sessionId: "session-1",
      threadId: "thread-1",
      turnId: "turn-1",
      completed: true,
      interrupted: false,
      failed: false,
      events: [
        {
          method: "codex.event",
          eventType: "agent_delta",
          turnId: "turn-1",
          status: null,
          delta: "hello",
          message: null
        },
        {
          method: "codex.event",
          eventType: "turn_status",
          turnId: "turn-1",
          status: "completed",
          delta: null,
          message: "done"
        }
      ],
      transcript: "hello",
      detail: "Completed."
    });

    expect(evidence).toMatchObject({
      state: "ready",
      eventCount: 2,
      agentDeltaCount: 1,
      turnStatusCount: 1,
      knownEventKindCount: 2,
      providerEventCoverageReady: true,
      canExtendStreamingEvidence: true,
      transcriptLength: 5,
      completed: true
    });
    expect(createPanelLiveTurnEvidenceMessage(session, 20, evidence)).toMatchObject({
      role: "system",
      label: "Live evidence",
      meta: "live evidence ready",
      body: expect.stringContaining("providerCoverage=ready")
    });
  });

  it("holds richer streaming evidence when provider event kinds are unknown", () => {
    const evidence = buildPanelLiveTurnEvidence({
      source: "desktop",
      panelId: "panel-1",
      sessionId: "session-1",
      threadId: "thread-1",
      turnId: "turn-1",
      completed: true,
      interrupted: false,
      failed: false,
      events: [
        {
          method: "codex.event",
          eventType: "agent_delta",
          turnId: "turn-1",
          status: null,
          delta: "hello",
          message: null
        },
        {
          method: "codex.event",
          eventType: "turn_status",
          turnId: "turn-1",
          status: "completed",
          delta: null,
          message: "done"
        },
        {
          method: "codex.event",
          eventType: "provider_metric",
          turnId: "turn-1",
          status: "completed",
          delta: null,
          message: "metric"
        }
      ],
      transcript: "hello",
      detail: "Completed."
    });

    expect(evidence.state).toBe("ready");
    expect(evidence.unknownEventCount).toBe(1);
    expect(evidence.providerEventCoverageReady).toBe(false);
    expect(evidence.canExtendStreamingEvidence).toBe(false);
    expect(evidence.detail).toContain("providerCoverage=held");
    expect(evidence.detail).toContain("richerStreaming=held");
    expect(evidence.nextAction).toContain("richer streaming evidence remains held");
  });

  it("marks failed live turns blocked and creates scoped recovery evidence", () => {
    const evidence = buildPanelLiveTurnEvidence({
      source: "desktop",
      panelId: "panel-1",
      sessionId: "session-1",
      threadId: "thread-1",
      turnId: "turn-1",
      completed: false,
      interrupted: false,
      failed: true,
      events: [
        {
          method: "codex.event",
          eventType: "error",
          turnId: "turn-1",
          status: "failed",
          delta: null,
          message: "network reset"
        }
      ],
      transcript: "",
      detail: "Failed."
    });

    expect(evidence).toMatchObject({
      state: "blocked",
      errorCount: 1,
      failed: true,
      nextAction: expect.stringContaining("retry")
    });
    expect(createPanelLiveRecoveryMessage(session, 21, "network reset", "retry me")).toMatchObject({
      role: "system",
      label: "Recovery",
      meta: "live recovery",
      body: expect.stringContaining("original prompt preserved")
    });
  });

  it("maps normalized Codex session messages into panel chat messages", () => {
    expect(
      codexSessionStateToPanelMessages(session, {
        connection: { status: "connected" },
        messages: [
          {
            id: "assistant-a",
            turnId: "turn-1",
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
        ledger: [],
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        errors: [],
        unknownEvents: [
          {
            id: "trace-1",
            kind: "provider_unknown",
            provider: "codex",
            turnId: "turn-1",
            name: "item/started",
            summary: "Started command",
            raw: {
              method: "item/started",
              eventType: "trace",
              turnId: "turn-1",
              status: null,
              delta: null,
              message: null,
              itemType: "command",
              itemStatus: "running",
              itemTitle: "Get-Location"
            }
          }
        ]
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

  it("builds protocol-backed progress cards without mixing final output", () => {
    const ledger: CodexProtocolLedgerEntry[] = [
      {
        id: "reasoning-a",
        kind: "reasoning",
        method: "item/reasoning/summaryTextDelta",
        turnId: "turn-a",
        delta: "Checking current files"
      },
      {
        id: "cmd-a",
        kind: "command_output_delta",
        method: "item/commandExecution/outputDelta",
        turnId: "turn-a",
        itemId: "cmd-a",
        title: "npm.cmd run test",
        status: "completed",
        delta: "21 passed"
      },
      {
        id: "file-a",
        kind: "file_change",
        method: "item/completed",
        turnId: "turn-a",
        itemId: "file-a",
        title: "src/App.tsx",
        status: "completed",
        detail: "diff --git a/src/App.tsx b/src/App.tsx"
      },
      {
        id: "tool-a",
        kind: "mcp_call",
        method: "mcp/toolCall",
        turnId: "turn-a",
        title: "mcp__server__tool",
        status: "completed"
      },
      {
        id: "web-a",
        kind: "web_search",
        method: "webSearch/completed",
        turnId: "turn-a",
        title: "Codex app-server docs",
        status: "completed"
      },
      {
        id: "image-a",
        kind: "image_view",
        method: "imageView/opened",
        turnId: "turn-a",
        title: "screenshot.png",
        status: "completed"
      },
      {
        id: "answer-a",
        kind: "agent_message",
        method: "item/agentMessage/delta",
        turnId: "turn-a",
        delta: "Final answer should stay in the assistant message"
      },
      {
        id: "status-a",
        kind: "turn_status",
        method: "turn/completed",
        turnId: "turn-a",
        status: "completed"
      }
    ];

    const sections = buildCodexProtocolTraceSections(ledger);

    expect(sections.map((section) => section.title)).toEqual([
      "Reasoning and plan",
      "Command executions",
      "File changes",
      "Tool and context calls",
      "Turn status and requests"
    ]);
    expect(sections.find((section) => section.id === "protocol-commands")).toMatchObject({
      kind: "commands",
      body: expect.stringContaining("npm.cmd run test")
    });
    expect(sections.find((section) => section.id === "protocol-files")?.body).toContain("src/App.tsx");
    expect(sections.find((section) => section.id === "protocol-tools")?.body).toContain("mcp__server__tool");
    expect(sections.map((section) => section.body).join("\n")).not.toContain(
      "Final answer should stay in the assistant message"
    );
  });

  it("renders honest partial, failed, and unknown protocol card states", () => {
    const sections = buildCodexProtocolTraceSections([
      {
        id: "cmd-active",
        kind: "command_execution",
        method: "item/started",
        title: "npm.cmd run build"
      },
      {
        id: "failed",
        kind: "error",
        method: "turn/failed",
        status: "failed",
        message: "Provider stopped"
      },
      {
        id: "unknown",
        kind: "unknown",
        method: "provider/future",
        summary: "Future event"
      }
    ]);

    expect(sections.find((section) => section.id === "protocol-commands")?.summary).toContain("active");
    expect(sections.find((section) => section.id === "protocol-status")?.summary).toContain("failed");
    expect(sections.find((section) => section.id === "protocol-status")?.body).toContain("provider/future");
  });

  it("creates actionable approval cards for supported Codex requests", () => {
    const message = createCodexApprovalRequestMessage(session, 12, {
      id: "approval-entry",
      kind: "approval_request",
      method: "item/commandExecution/requestApproval",
      requestId: "42",
      threadId: "thread-1",
      turnId: "turn-1",
      itemId: "item-1",
      title: "npm.cmd run test",
      detail: "npm.cmd run test"
    });

    expect(message).toMatchObject({
      role: "system",
      label: "Codex approval",
      meta: "approval waiting",
      body: expect.stringContaining("Choose an approval decision")
    });
    expect(message.actions?.map((action) => action.kind)).toEqual([
      "codex-approval-approve",
      "codex-approval-approve-session",
      "codex-approval-decline",
      "codex-approval-cancel"
    ]);
    expect(JSON.stringify(message)).not.toContain("sk-");

    const approved = updateCodexApprovalMessageState(message, "approved-session", "Sent.");
    expect(approved.meta).toBe("approval approved-session");
    expect(approved.actions?.every((action) => action.disabled)).toBe(true);
  });

  it("creates blocked approval cards for unsupported Codex requests", () => {
    const message = createCodexApprovalRequestMessage(session, 13, {
      id: "approval-entry",
      kind: "approval_request",
      method: "item/tool/requestUserInput",
      requestId: "43",
      threadId: "thread-1",
      turnId: "turn-1",
      itemId: "item-2",
      message: "Need unsupported input."
    });

    expect(message.meta).toBe("approval blocked");
    expect(message.actions).toBeUndefined();
    expect(message.body).toContain("Next action");
  });

  it("creates a live activity message with collapsible command sections", () => {
    const message = createPanelLiveActivityMessage(session, 7, "Working on the live turn.", [
      {
        id: "commands",
        kind: "commands",
        title: "Ran 2 commands",
        summary: "Show exact command text",
        body: "1. Get-Location\n2. npm.cmd run test"
      }
    ]);

    expect(message).toMatchObject({
      role: "system",
      label: "Codex Live",
      body: "Working on the live turn.",
      meta: "working",
      sections: [
        expect.objectContaining({
          kind: "commands",
          title: "Ran 2 commands",
          body: expect.stringContaining("npm.cmd run test")
        })
      ]
    });
  });

  it("expands /plan into Codex create-plan behavior for the provider", () => {
    const decision = getPanelSlashCommandDecision("/plan build a Lazada mapper", true);
    const prompt = createPanelProviderPrompt("/plan build a Lazada mapper", decision);

    expect(prompt).toContain("Use Codex /plan behavior");
    expect(prompt).toContain("build a Lazada mapper");
    expect(prompt).toContain("ask 1-3 concise clarification questions");
    expect(prompt).toContain("Stay read-only");
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
            {
              id: "ok",
              role: "user",
              label: "You",
              body: "Hello",
              meta: "draft",
              sections: [
                {
                  id: "trace",
                  kind: "steps",
                  title: "Steps",
                  summary: "1 entry",
                  body: "Read file"
                }
              ]
            },
            { id: "bad" }
          ]
        })
      )
    ).toEqual({
      "panel-1": [
        {
          id: "ok",
          role: "user",
          label: "You",
          body: "Hello",
          meta: "draft",
          sections: [
            {
              id: "trace",
              kind: "steps",
              title: "Steps",
              summary: "1 entry",
              body: "Read file"
            }
          ]
        }
      ]
    });
  });

  it("drops stale live Codex pending messages from visible persisted chat state", () => {
    const messages = normalizePanelChatMessages(
      [
        {
          id: "panel-1:live:assistant-a:0",
          role: "codex",
          label: "Codex Live",
          body: "Master, ready.",
          meta: "completed"
        },
        {
          id: "panel-1:live-status:5",
          role: "system",
          label: "Steerboard",
          body: "Sending to live Codex...",
          meta: "running"
        },
        {
          id: "panel-1:live-recovery:6",
          role: "system",
          label: "Recovery",
          body: "Recovery evidence: live turn failed",
          meta: "live recovery"
        }
      ],
      []
    );

    expect(messages).toEqual([
      {
        id: "panel-1:live:assistant-a:0",
        role: "codex",
        label: "Codex Live",
        body: "Master, ready.",
        meta: "completed"
      }
    ]);
  });

  it("drops saved live evidence cards from visible panel chat", () => {
    const messages = normalizePanelChatMessages(
      [
        {
          id: "panel-1:live:assistant-a:0",
          role: "codex",
          label: "Codex Live",
          body: "Master, ready.",
          meta: "completed"
        },
        {
          id: "panel-1:live-evidence:1",
          role: "system",
          label: "Live evidence",
          body: "Ready: streamProof events=49",
          meta: "live evidence ready"
        }
      ],
      []
    );

    expect(messages).toEqual([
      {
        id: "panel-1:live:assistant-a:0",
        role: "codex",
        label: "Codex Live",
        body: "Master, ready.",
        meta: "completed"
      }
    ]);
  });
});
