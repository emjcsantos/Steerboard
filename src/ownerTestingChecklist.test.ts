import { describe, expect, it } from "vitest";
import {
  buildOwnerTestingChecklist,
  resolveOwnerTestingChecklistState,
  summarizeOwnerTestingChecklistItems,
  OWNER_TESTING_CHECKLIST_ORDER,
  OWNER_TESTING_CATALOG_REFRESH_ORDER,
  OWNER_TESTING_CHECKLIST_ID,
  OWNER_TESTING_CHECKLIST_LABEL
} from "./ownerTestingChecklist";

const checklistBase = buildOwnerTestingChecklist();

describe("owner testing checklist model", () => {
  it("contains all required phase 9 checklist items in deterministic order", () => {
    const itemIds = checklistBase.items.map((item) => item.id);
    const itemNames = checklistBase.items.map((item) => item.name);
    const slashItem = checklistBase.items.find((item) => item.id === "slash-commands");

    expect(itemIds).toEqual(Array.from(OWNER_TESTING_CHECKLIST_ORDER));
    expect(itemNames).toEqual([
      "Launch",
      "Connect",
      "Chat",
      "Multi-Panel",
      "Controls",
      "Slash Commands",
      "Catalog Refreshes",
      "Command Refresh",
      "Skill Refresh",
      "Plugin Refresh",
      "MCP Refresh",
      "Automation Refresh",
      "Personalization Refresh",
      "Migration",
      "Planning",
      "Dispatch",
      "Permissions",
      "Reload",
      "Recovery"
    ]);
    expect(slashItem).toBeDefined();
    expect(slashItem?.focus).toBe(
      "Validate owner slash-command routing for panel-scoped suggestions, and confirm app/global-only commands are blocked when used outside permitted scope."
    );
    expect(slashItem?.checks).toBe(
      "Capture transcript evidence showing provider-route mapping for suggestions and explicit app/global-only command blocking, while keeping this check provider/model-agnostic."
    );
    expect(slashItem?.focus).toContain("panel-scoped");
    expect(slashItem?.checks).toContain("provider-route");
    expect(slashItem?.checks).toContain("transcript");
    expect(slashItem?.checks).toContain("app/global");
    expect(slashItem?.checks).not.toContain("execution");
    expect(slashItem?.checks).toMatch(/provider\/model-agnostic/i);
    expect(checklistBase.id).toBe(OWNER_TESTING_CHECKLIST_ID);
    expect(checklistBase.label).toBe(OWNER_TESTING_CHECKLIST_LABEL);
  });

  it("defaults all checklist items to waiting and reports full waiting summary", () => {
    expect(checklistBase.summary).toEqual({
      total: 19,
      ready: 0,
      review: 0,
      blocked: 0,
      waiting: 19,
      readiness: 25,
      state: "waiting",
      statusLabel: "Waiting",
      catalogRefresh: {
        total: 6,
        ready: 0,
        review: 0,
        blocked: 0,
        waiting: 6,
        readiness: 25,
        state: "waiting",
        statusLabel: "Waiting",
        evidenceSafetyLabel: "Metadata-Only Safety Check",
        evidenceSafetyDetail:
          "Catalog refresh validation is metadata/status-only and only checks deterministic ordering, coverage, and fallback states. It must not execute commands, skills, plugins, MCP tools, automations, personalization/profile mutations, terminal actions, Git operations, or external actions.",
        itemCoverage: [
          { id: "catalog-command-refresh", name: "Command Refresh", state: "waiting" },
          { id: "catalog-skill-refresh", name: "Skill Refresh", state: "waiting" },
          { id: "catalog-plugin-refresh", name: "Plugin Refresh", state: "waiting" },
          { id: "catalog-mcp-refresh", name: "MCP Refresh", state: "waiting" },
          {
            id: "catalog-automation-refresh",
            name: "Automation Refresh",
            state: "waiting"
          },
          {
            id: "catalog-personalization-refresh",
            name: "Personalization Refresh",
            state: "waiting"
          }
        ]
      }
    });
  });

  it("supports overrides and computes ready/review/blocked states and readiness", () => {
    const custom = buildOwnerTestingChecklist({
      launch: "ready",
      connect: "ready",
      chat: "ready",
      "multi-panel": "review",
      controls: "ready",
      "slash-commands": "ready",
      catalogs: "ready",
      "catalog-command-refresh": "ready",
      "catalog-skill-refresh": "ready",
      "catalog-plugin-refresh": "ready",
      "catalog-mcp-refresh": "ready",
      "catalog-automation-refresh": "ready",
      "catalog-personalization-refresh": "ready",
      migration: "ready",
      planning: "ready",
      dispatch: "ready",
      permissions: "ready",
      reload: "ready",
      recovery: "ready"
    });

    const summary = custom.summary;

    expect(summary.total).toBe(19);
    expect(summary.ready).toBe(18);
    expect(summary.review).toBe(1);
    expect(summary.blocked).toBe(0);
    expect(summary.waiting).toBe(0);
    expect(summary.state).toBe("review");
    expect(summary.statusLabel).toBe("Review");
    expect(summary.readiness).toBe(98);
    expect(summary.catalogRefresh).toEqual({
      total: 6,
      ready: 6,
      review: 0,
      blocked: 0,
      waiting: 0,
      readiness: 100,
      state: "ready",
      statusLabel: "Ready",
      evidenceSafetyLabel: "Metadata-Only Safety Check",
      evidenceSafetyDetail:
        "Catalog refresh validation is metadata/status-only and only checks deterministic ordering, coverage, and fallback states. It must not execute commands, skills, plugins, MCP tools, automations, personalization/profile mutations, terminal actions, Git operations, or external actions.",
      itemCoverage: [
        { id: "catalog-command-refresh", name: "Command Refresh", state: "ready" },
        { id: "catalog-skill-refresh", name: "Skill Refresh", state: "ready" },
        { id: "catalog-plugin-refresh", name: "Plugin Refresh", state: "ready" },
        { id: "catalog-mcp-refresh", name: "MCP Refresh", state: "ready" },
        { id: "catalog-automation-refresh", name: "Automation Refresh", state: "ready" },
        {
          id: "catalog-personalization-refresh",
          name: "Personalization Refresh",
          state: "ready"
        }
      ]
    });
  });

  it("returns blocked summary state when any item is blocked", () => {
    const blocked = buildOwnerTestingChecklist({
      connect: "blocked",
      "catalog-plugin-refresh": "blocked",
      launch: "ready",
      chat: "ready",
      "multi-panel": "ready",
      controls: "ready",
      "slash-commands": "ready",
      catalogs: "ready",
      "catalog-command-refresh": "ready",
      "catalog-skill-refresh": "ready",
      "catalog-automation-refresh": "ready",
      "catalog-personalization-refresh": "ready",
      migration: "ready",
      planning: "ready",
      dispatch: "review",
      permissions: "ready",
      reload: "ready",
      recovery: "ready"
    });
    const summary = blocked.summary;

    expect(summary.blocked).toBe(2);
    expect(summary.review).toBe(1);
    expect(summary.state).toBe("blocked");
    expect(summary.statusLabel).toBe("Blocked");
    expect(summary.catalogRefresh.blocked).toBe(1);
    expect(summary.catalogRefresh.state).toBe("blocked");
    expect(summary.catalogRefresh.readiness).toBe(71);
  });

  it("computes counts via summary helper and keeps deterministic key order", () => {
    const items = [
      { state: "ready" },
      { state: "review" },
      { state: "blocked" },
      { state: "waiting" },
      { state: "ready" }
    ] as const;

    expect(summarizeOwnerTestingChecklistItems(items)).toEqual({
      total: 5,
      ready: 2,
      review: 1,
      blocked: 1,
      waiting: 1,
      readiness: 57,
      state: "blocked",
      statusLabel: "Blocked",
      catalogRefresh: {
        total: 0,
        ready: 0,
        review: 0,
        blocked: 0,
        waiting: 0,
        readiness: 0,
        state: "ready",
        statusLabel: "Ready",
        evidenceSafetyLabel: "Metadata-Only Safety Check",
        evidenceSafetyDetail:
          "Catalog refresh validation is metadata/status-only and only checks deterministic ordering, coverage, and fallback states. It must not execute commands, skills, plugins, MCP tools, automations, personalization/profile mutations, terminal actions, Git operations, or external actions.",
        itemCoverage: []
      }
    });
    expect(resolveOwnerTestingChecklistState({ blocked: 0, review: 0, waiting: 2 })).toBe(
      "waiting"
    );
    expect(resolveOwnerTestingChecklistState({ blocked: 0, review: 1, waiting: 2 })).toBe(
      "review"
    );
    expect(resolveOwnerTestingChecklistState({ blocked: 2, review: 0, waiting: 0 })).toBe(
      "blocked"
    );
  });

  it("exposes catalog-refresh-specific summary counts and ordering", () => {
    expect(OWNER_TESTING_CATALOG_REFRESH_ORDER).toEqual([
      "catalog-command-refresh",
      "catalog-skill-refresh",
      "catalog-plugin-refresh",
      "catalog-mcp-refresh",
      "catalog-automation-refresh",
      "catalog-personalization-refresh"
    ]);

    const custom = buildOwnerTestingChecklist({
      "catalog-command-refresh": "ready",
      "catalog-skill-refresh": "review",
      "catalog-plugin-refresh": "review",
      "catalog-mcp-refresh": "blocked",
      "catalog-automation-refresh": "ready",
      "catalog-personalization-refresh": "waiting"
    });

    expect(custom.summary.catalogRefresh).toEqual({
      total: 6,
      ready: 2,
      review: 2,
      blocked: 1,
      waiting: 1,
      readiness: 58,
      state: "blocked",
      statusLabel: "Blocked",
      evidenceSafetyLabel: "Metadata-Only Safety Check",
      evidenceSafetyDetail:
        "Catalog refresh validation is metadata/status-only and only checks deterministic ordering, coverage, and fallback states. It must not execute commands, skills, plugins, MCP tools, automations, personalization/profile mutations, terminal actions, Git operations, or external actions.",
      itemCoverage: [
        { id: "catalog-command-refresh", name: "Command Refresh", state: "ready" },
        { id: "catalog-skill-refresh", name: "Skill Refresh", state: "review" },
        { id: "catalog-plugin-refresh", name: "Plugin Refresh", state: "review" },
        { id: "catalog-mcp-refresh", name: "MCP Refresh", state: "blocked" },
        { id: "catalog-automation-refresh", name: "Automation Refresh", state: "ready" },
        {
          id: "catalog-personalization-refresh",
          name: "Personalization Refresh",
          state: "waiting"
        }
      ]
    });
  });

  it("adds metadata/status-only safety evidence with explicit no-execution boundaries", () => {
    const summary = checklistBase.summary.catalogRefresh;

    expect(summary.evidenceSafetyLabel).toBe("Metadata-Only Safety Check");
    expect(summary.evidenceSafetyDetail).toBe(
      "Catalog refresh validation is metadata/status-only and only checks deterministic ordering, coverage, and fallback states. It must not execute commands, skills, plugins, MCP tools, automations, personalization/profile mutations, terminal actions, Git operations, or external actions."
    );
    expect(summary.evidenceSafetyDetail).toContain("metadata/status-only");
    expect(summary.evidenceSafetyDetail).toContain("commands");
    expect(summary.evidenceSafetyDetail).toContain("skills");
    expect(summary.evidenceSafetyDetail).toContain("plugins");
    expect(summary.evidenceSafetyDetail).toContain("MCP tools");
    expect(summary.evidenceSafetyDetail).toContain("automations");
    expect(summary.evidenceSafetyDetail).toContain("personalization/profile mutations");
    expect(summary.evidenceSafetyDetail).toContain("terminal actions");
    expect(summary.evidenceSafetyDetail).toContain("Git operations");
    expect(summary.evidenceSafetyDetail).toContain("external actions");
  });

  it("reports deterministic catalog-refresh item coverage and order", () => {
    const summary = checklistBase.summary.catalogRefresh;

    expect(summary.itemCoverage).toEqual([
      { id: "catalog-command-refresh", name: "Command Refresh", state: "waiting" },
      { id: "catalog-skill-refresh", name: "Skill Refresh", state: "waiting" },
      { id: "catalog-plugin-refresh", name: "Plugin Refresh", state: "waiting" },
      { id: "catalog-mcp-refresh", name: "MCP Refresh", state: "waiting" },
      { id: "catalog-automation-refresh", name: "Automation Refresh", state: "waiting" },
      {
        id: "catalog-personalization-refresh",
        name: "Personalization Refresh",
        state: "waiting"
      }
    ]);
    expect(summary.itemCoverage.map((entry) => entry.id)).toEqual(OWNER_TESTING_CATALOG_REFRESH_ORDER);
  });

  it("keeps helper inputs immutable", () => {
    const overrides = {
      launch: "ready",
      connect: "ready",
      chat: "ready",
      recovery: "ready"
    } as const;
    const overridesSnapshot = { ...overrides };

    buildOwnerTestingChecklist(overrides);
    expect(overrides).toEqual(overridesSnapshot);
  });

  it("preserves provided item status overrides exactly per domain", () => {
    const custom = buildOwnerTestingChecklist({
      launch: "ready",
      connect: "review",
      recovery: "blocked"
    });
    const statusById = new Map(custom.items.map((item) => [item.id, item.state]));

    expect(statusById.get("launch")).toBe("ready");
    expect(statusById.get("connect")).toBe("review");
    expect(statusById.get("recovery")).toBe("blocked");
    expect(custom.summary.blocked).toBe(1);
    expect(custom.summary.state).toBe("blocked");
  });
});
