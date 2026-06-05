import { describe, expect, it } from "vitest";
import {
  buildDefaultMigrationPreview,
  buildMigrationPreviewCounts,
  defaultMigrationCategories,
  defaultMigrationSources,
  defaultMigrationSource,
  migrationSourceIds,
  normalizeMigrationPreview,
  redactMigrationPreviewDetail,
  toggleMigrationCategory,
  type MigrationCategoryState
} from "./migrationModel";

describe("migration model", () => {
  it("defines required source and category defaults", () => {
    expect(migrationSourceIds).toEqual([
      "codex",
      "claude-code",
      "antigravity",
      "generic-mcp",
      "skill-folder",
      "manual-file"
    ]);

    expect(defaultMigrationSources.map((source) => source.id)).toEqual(migrationSourceIds);

    const categoryIds = defaultMigrationCategories.map((category) => category.id);
    expect(categoryIds).toEqual([
      "projects",
      "threads",
      "settings",
      "provider-preferences",
      "commands",
      "skills",
      "prompts",
      "agents",
      "plugins",
      "mcp",
      "tool-policy",
      "project-instructions",
      "automations",
      "personalization",
      "ui-preferences"
    ]);
  });

  it("returns safe default migration preview state for each category", () => {
    const preview = buildDefaultMigrationPreview("codex");

    expect(preview.source).toBe("codex");
    expect(preview.categories.every((category) => category.selected)).toBe(false);
    expect(preview.categories.filter((category) => category.state === "excluded")).toHaveLength(15);
  });

  it("toggles selected categories and recalculates category state", () => {
    const preview = buildDefaultMigrationPreview("codex");
    const enabledThreads = toggleMigrationCategory(preview, "threads");

    expect(enabledThreads.categories.find((category) => category.id === "threads")?.selected).toBe(
      true
    );
    expect(
      enabledThreads.categories.find((category) => category.id === "threads")?.state
    ).toBe("accepted");

    const disabledThreads = toggleMigrationCategory(enabledThreads, "threads", false);
    expect(disabledThreads.categories.find((category) => category.id === "threads")?.state).toBe(
      "excluded"
    );

    const genericPreview = normalizeMigrationPreview({
      source: "generic-mcp",
      categories: [{ id: "projects", selected: true }]
    });
    expect(genericPreview.categories.find((category) => category.id === "projects")?.state).toBe(
      "unsupported"
    );
  });

  it("builds migration preview counts by category state", () => {
    const normalized = normalizeMigrationPreview({
      source: "codex",
      categories: [
        { id: "projects", selected: true },
        { id: "threads", selected: true },
        { id: "commands", selected: true },
        { id: "settings", selected: false }
      ]
    });
    const counts = buildMigrationPreviewCounts(normalized);

    expect(counts.accepted).toBe(2);
    expect(counts.reviewRequired).toBe(1);
    expect(counts.unsupported).toBe(0);
    expect(counts.excluded).toBe(12);
  });

  it("normalizes malformed input safely", () => {
    const normalized = normalizeMigrationPreview({
      source: "not-a-source",
      categories: [
        { id: "projects", selected: "yes" },
        { id: "threads", selected: true, itemCount: -3, detail: "unsafe path /tmp/a.txt" },
        { id: 42 },
        "unsupported-entry"
      ]
    } as const);

    expect(normalized.source).toBe(defaultMigrationSource);
    expect(normalized.categories).toHaveLength(defaultMigrationCategories.length);
    expect(normalized.categories.map((item) => item.selected)).toContain(false);
    expect(normalized.categories.find((item) => item.id === "threads")?.itemCount).toBe(0);
    expect(normalized.categories.find((item) => item.id === "threads")?.state).toBe("accepted");
    expect(normalized.categories.find((item) => item.id === "threads")?.detail).toContain(
      "redacted path"
    );
    expect(normalized.categories.find((item) => item.id === "projects")?.selected).toBe(false);
  });

  it("redacts secrets, raw transcript markers, model names, source names, and paths", () => {
    const raw = "Codex exported /tmp/session.log from gpt-4 with bearer demo-token and raw transcript.";
    const redacted = redactMigrationPreviewDetail(raw);

    expect(redacted).not.toContain("Codex");
    expect(redacted).not.toContain("gpt-4");
    expect(redacted).not.toContain("bearer");
    expect(redacted).not.toContain("raw transcript");
    expect(redacted).not.toMatch(/\\|\//);
    expect(redacted).toContain("[redacted");

    expect(redactMigrationPreviewDetail("")).toBe("No preview detail available.");
    expect(redactMigrationPreviewDetail("   ")).toBe("No preview detail available.");
  });

  it("handles unsupported and excluded states together", () => {
    const unsupportedPreview = normalizeMigrationPreview({
      source: "generic-mcp",
      categories: [
        { id: "mcp", selected: true, itemCount: 2 },
        { id: "skills", selected: true, itemCount: 99 }
      ]
    });

    const mcpEntry = unsupportedPreview.categories.find((category) => category.id === "mcp");
    const skillsEntry = unsupportedPreview.categories.find((category) => category.id === "skills");

    expect(mcpEntry?.state).toBe("accepted");
    expect(mcpEntry?.itemCount).toBe(2);
    expect(skillsEntry?.state).toBe("unsupported");
    expect(skillsEntry?.selected).toBe(false);

    const counts = buildMigrationPreviewCounts(unsupportedPreview);
    expect(counts.unsupported).toBeGreaterThan(0);
    expect(counts.excluded + counts.accepted + counts.reviewRequired + counts.unsupported).toEqual(
      15
    );
  });
});
