import { describe, expect, it } from "vitest";
import {
  buildCommandExecutionDecision,
  defaultCommandCatalog,
  findCommandCatalogEntry,
  getCommandCatalogSuggestions,
  buildCommandCatalogSnapshot,
  buildCommandCatalogSnapshotFromProviderCapabilities,
  summarizeCommandCatalog,
  normalizeCommandCatalog,
  type CommandCatalogEntry
} from "./commandCatalog";

describe("command catalog suggestions", () => {
  it("returns empty suggestions unless draft begins with slash", () => {
    expect(getCommandCatalogSuggestions("plan")).toEqual([]);
    expect(getCommandCatalogSuggestions("  plan")).toEqual([]);
  });

  it("filters catalog entries from slash draft text", () => {
    expect(getCommandCatalogSuggestions("  /st")).toMatchObject([
      {
        command: "/status",
        label: "Status"
      }
    ]);

    expect(getCommandCatalogSuggestions("/pl")).toMatchObject([
      {
        command: "/plan",
        label: "Plan"
      }
    ]);
  });

  it("does not return unknown commands in suggestions", () => {
    expect(getCommandCatalogSuggestions("/unknown")).toEqual([]);
  });
});

describe("command lookup and decisions", () => {
  it("finds entries case-insensitively from submitted text", () => {
    expect(findCommandCatalogEntry("/HANDOFF now")?.command).toBe("/handoff");
  });

  it("returns unsupported for unknown command submission", () => {
    const decision = buildCommandExecutionDecision("/not-a-real-command", true);
    expect(decision).toMatchObject({
      state: "unsupported",
      executable: false,
      reason: "Unknown slash command /not-a-real-command.",
      feedback: {
        statusLabel: "Unknown",
        severity: "error",
        nextAction: "Use a supported slash command from the catalog."
      }
    });
  });

  it("returns non-executable decisions for unsupported and unavailable entries", () => {
    const catalog: CommandCatalogEntry[] = [
      {
        command: "/blocked",
        label: "Blocked",
        detail: "Temporarily unsupported command.",
        state: "unsupported",
        scopes: ["panel"]
      },
      {
        command: "/frozen",
        label: "Frozen",
        detail: "Environment lock.",
        state: "unavailable",
        scopes: ["app"]
      },
      {
        command: "/offline",
        label: "Offline",
        detail: "Needs transport.",
        state: "live",
        scopes: ["app"]
      }
    ];

    const unsupported = buildCommandExecutionDecision("/blocked", true, catalog);
    const unavailable = buildCommandExecutionDecision("/frozen", true, catalog);
    const transportUnavailable = buildCommandExecutionDecision("/offline", false, catalog);

    expect(unsupported).toMatchObject({
      state: "unsupported",
      executable: false,
      reason: "/blocked is unsupported in this catalog context.",
      feedback: {
        statusLabel: "Unsupported",
        severity: "error",
        nextAction: "Use a supported command that is enabled for this panel."
      }
    });

    expect(unavailable).toMatchObject({
      state: "unavailable",
      executable: false,
      reason: "/frozen is unavailable in this environment.",
      feedback: {
        statusLabel: "Unavailable",
        severity: "warning",
        nextAction: "Retry when this command is enabled in this environment."
      }
    });

    expect(transportUnavailable).toMatchObject({
      state: "unavailable",
      executable: false,
      reason: "Live transport is not available for /offline.",
      feedback: {
        statusLabel: "Blocked",
        severity: "warning",
        nextAction: "Enable live transport or retry once provider connectivity is active."
      }
    });
  });

  it("returns structured feedback for executable live and preview decisions", () => {
    expect(buildCommandExecutionDecision("/plan now", true)).toMatchObject({
      state: "live",
      executable: true,
      feedback: {
        statusLabel: "Ready",
        severity: "success",
        nextAction: "Route this command through the connected provider."
      }
    });

    expect(buildCommandExecutionDecision("/validate now", false)).toMatchObject({
      state: "preview",
      executable: true,
      feedback: {
        statusLabel: "Preview",
        severity: "info",
        nextAction: "Run locally and review staged result before provider execution."
      }
    });
  });
});

describe("catalog normalization", () => {
  it("repairs malformed input by filtering invalid rows and filling fallback", () => {
    const repaired = normalizeCommandCatalog(
      [
        {
          command: "/CUSTOM",
          label: "Custom Command",
          detail: "Local utility command.",
          state: "preview",
          scopes: ["panel", "panel", "global", 10]
        },
        {
          command: "/bad state",
          label: "Bad State",
          detail: "No state.",
          state: "unknown",
          scopes: []
        },
        {
          label: "Missing command",
          detail: "No command.",
          state: "live",
          scopes: ["app"]
        },
        {
          command: "/custom",
          label: 123,
          detail: "Duplicate normalized command.",
          state: "live",
          scopes: ["global"]
        }
      ] as unknown[],
      defaultCommandCatalog
    );

    expect(repaired[0]).toMatchObject({
      command: "/custom",
      label: "Custom Command",
      detail: "Local utility command.",
      state: "preview"
    });
    expect(repaired[0].scopes).toEqual(["panel", "global"]);
    expect(repaired.find((item) => item.command === "/bad state")).toBeUndefined();
    expect(repaired.find((item) => item.command === "/missing")).toBeUndefined();
    expect(repaired.length).toBe(1);
  });

  it("falls back to default catalog when provided value is unusable", () => {
    expect(normalizeCommandCatalog("not-a-catalog")).toEqual(defaultCommandCatalog);
  });
});

describe("command catalog refresh snapshots", () => {
  it("builds a provider-live snapshot from provider-supplied catalog", () => {
    const snapshot = buildCommandCatalogSnapshot(
      [
        {
          command: "/refresh",
          label: "Refresh",
          detail: "Refresh active context from provider cache.",
          state: "live",
          scopes: ["panel", "app"]
        },
        {
          command: "/preview-only",
          label: "Preview Only",
          detail: "Local-only review command.",
          state: "preview",
          scopes: ["panel"]
        }
      ],
      "provider-live",
      defaultCommandCatalog
    );

    expect(snapshot.source).toBe("provider-live");
    expect(snapshot.summary).toMatchObject({
      source: "provider-live",
      total: 2,
      live: 1,
      preview: 1,
      executable: 2,
      blocked: 0,
      availability: 1
    });
    expect(snapshot.catalog[0]).toMatchObject({
      command: "/refresh",
      label: "Refresh"
    });
  });

  it("falls back to default catalog when provider payload is not repairable", () => {
    const fallback: CommandCatalogEntry[] = [
      {
        command: "/provider-fallback",
        label: "Fallback",
        detail: "Provider repair fallback command.",
        state: "preview",
        scopes: ["panel"]
      }
    ];

    const snapshot = buildCommandCatalogSnapshot(
      [{ command: "bad command" }],
      "provider-live",
      fallback
    );

    expect(snapshot.source).toBe("default-fallback");
    expect(snapshot.catalog).toEqual(fallback);
  });

  it("represents empty and unavailable refresh outcomes", () => {
    const emptySnapshot = buildCommandCatalogSnapshot([], "provider-preview", []);
    const unavailableSnapshot = buildCommandCatalogSnapshot(null as unknown, "provider-live", []);

    expect(emptySnapshot.source).toBe("empty-refresh");
    expect(unavailableSnapshot.source).toBe("unavailable");
  });

  it("summarizes fallback and provider catalog source state safely", () => {
    const providerSummary = summarizeCommandCatalog(
      [
        {
          command: "/preview",
          label: "Preview",
          detail: "Provider preview command.",
          state: "preview",
          scopes: ["panel"]
        },
        {
          command: "/block",
          label: "Block",
          detail: "Disabled command.",
          state: "unsupported",
          scopes: ["panel"]
        },
        {
          command: "/live",
          label: "Live",
          detail: "Live command.",
          state: "live",
          scopes: ["app"]
        }
      ],
      "provider-preview"
    );

    const fallbackSummary = summarizeCommandCatalog("bad-payload", "default-fallback");

    expect(providerSummary).toMatchObject({
      source: "provider-preview",
      total: 3,
      live: 1,
      preview: 1,
      unsupported: 1,
      executable: 2,
      blocked: 1
    });
    expect(fallbackSummary).toMatchObject({
      source: "default-fallback",
      total: defaultCommandCatalog.length,
      preview: defaultCommandCatalog.filter((item) => item.state === "preview").length
    });
  });
});

describe("provider capability snapshots", () => {
  it("builds a provider-backed snapshot from safe live capability flags", () => {
    const snapshot = buildCommandCatalogSnapshotFromProviderCapabilities({
      canRunLive: true,
      canRunPreview: true,
      commands: [
        { command: "/plan", state: "live" },
        { command: "/handoff", state: "preview" },
        { command: "/review", state: "unsupported" }
      ]
    });

    expect(snapshot.source).toBe("provider-live");
    expect(snapshot.summary).toMatchObject({
      source: "provider-live",
      total: defaultCommandCatalog.length,
      live: 2,
      preview: 3,
      unsupported: 2
    });
    expect(snapshot.catalog.find((entry) => entry.command === "/handoff")?.state).toBe("preview");
    expect(snapshot.catalog.find((entry) => entry.command === "/review")?.state).toBe("unsupported");
  });

  it("falls back to provider-preview when live capability is unavailable and downgrades live states to preview", () => {
    const snapshot = buildCommandCatalogSnapshotFromProviderCapabilities({
      canRunLive: false,
      canRunPreview: true,
      commands: [
        { command: "/plan", state: "live" },
        { command: "/review", state: "preview" }
      ]
    });

    expect(snapshot.source).toBe("provider-preview");
    expect(snapshot.catalog.find((entry) => entry.command === "/plan")?.state).toBe("preview");
    expect(snapshot.catalog.find((entry) => entry.command === "/status")?.state).toBe("preview");
  });

  it("represents empty and unavailable fallback behavior for provider capability refresh", () => {
    const emptySnapshot = buildCommandCatalogSnapshotFromProviderCapabilities({
      canRunLive: false,
      canRunPreview: true,
      commands: []
    });

    const unavailableSnapshot = buildCommandCatalogSnapshotFromProviderCapabilities(
      null as unknown,
      []
    );

    expect(emptySnapshot.source).toBe("empty-refresh");
    expect(unavailableSnapshot.source).toBe("unavailable");
  });

  it("handles malformed capability flags by returning default fallback safely", () => {
    const malformedSnapshot = buildCommandCatalogSnapshotFromProviderCapabilities({
      canRunLive: "yes",
      canRunPreview: true,
      commands: [{ command: "/plan", state: "live" }]
    } as unknown);

    expect(malformedSnapshot.source).toBe("default-fallback");
    expect(malformedSnapshot.catalog).toEqual(defaultCommandCatalog);
  });
});
