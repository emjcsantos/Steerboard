import { describe, expect, it } from "vitest";
import {
  buildCommandExecutionDecision,
  defaultCommandCatalog,
  findCommandCatalogEntry,
  getCommandCatalogSuggestions,
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
