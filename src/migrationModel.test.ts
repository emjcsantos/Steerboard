import { describe, expect, it, vi } from "vitest";
import {
  buildDefaultMigrationPreview,
  type CreateMigrationProfileDraftOptions,
  createMigrationProfileDraft,
  createMigrationProfileDraftAuditRecord,
  defaultMigrationCategories,
  type MigrationProfileDraftHistoryRecord,
  MIGRATION_DRAFT_HISTORY_STORAGE_KEY,
  saveMigrationProfileDraftHistory,
  rollbackMigrationProfileDraftHistory,
  summarizeMigrationProfileDrafts,
  parseStoredMigrationProfileDraftHistory,
  loadMigrationProfileDraftHistory,
  appendMigrationProfileDraftHistory,
  buildMigrationPreviewCounts,
  defaultMigrationSources,
  defaultMigrationSource,
  migrationSourceIds,
  normalizeMigrationPreview,
  redactMigrationPreviewDetail,
  toggleMigrationCategory,
  type MigrationProfileDraftImportState
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

describe("migration draft persistence and rollback model", () => {
  it("creates deterministic drafts with redacted selected category details", () => {
    const rawPreview = normalizeMigrationPreview({
      source: "codex",
      categories: [
        {
          id: "projects",
          selected: true,
          detail: "Imported from /tmp/project/export.json"
        },
        {
          id: "commands",
          selected: true,
          detail: "raw transcript bearer abc123token and api_key=sekrit-credential-12345678901234567890"
        }
      ]
    });

    const options: CreateMigrationProfileDraftOptions = {
      createdAt: "2026-01-01T00:00:00.000Z",
      safetyNote: "Raw transcript path /tmp/token.txt and sk-ABCDEF1234567890123456 not imported."
    };
    const firstDraft = createMigrationProfileDraft(rawPreview, options);
    const secondDraft = createMigrationProfileDraft(rawPreview, options);

    expect(firstDraft.id).toBe(
      "migration-profile-draft:codex:2026-01-01T00:00:00.000Z:projects,commands"
    );
    expect(firstDraft).toEqual(secondDraft);
    expect(firstDraft.importState).toBe("review");
    expect(firstDraft.selectedCategoryIds).toEqual(["projects", "commands"]);
    expect(firstDraft.evidenceFingerprint).toMatch(/^phase5-migration:/);
    expect(firstDraft.evidenceFingerprint).toBe(secondDraft.evidenceFingerprint);
    expect(firstDraft.selectedCategories.map((item) => item.id)).toEqual(["projects", "commands"]);
    expect(firstDraft.safetyNote).not.toContain("/tmp");
    expect(firstDraft.safetyNote).not.toContain("sk-ABCDEF");
    expect(firstDraft.selectedCategories.find((item) => item.id === "commands")?.detail).not.toContain("raw transcript");
    expect(firstDraft.selectedCategories.find((item) => item.id === "commands")?.detail).not.toContain("api_key");
  });

  it("keeps empty selections from reaching ready/import-ready states", () => {
    const emptyDraft = createMigrationProfileDraft(buildDefaultMigrationPreview("codex"), {
      createdAt: "2026-01-02T00:00:00.000Z"
    });
    expect(emptyDraft.importState).toBe("waiting");

    const unsupportedHistory = parseStoredMigrationProfileDraftHistory(
      JSON.stringify([
        {
          draft: {
            id: "repair-unsupported",
            sourceId: "codex",
            sourceLabel: "Codex",
            createdAt: "2026-01-03T00:00:00.000Z",
            selectedCategories: [
              {
                id: "skills",
                label: "Skills",
                state: "unsupported",
                itemCount: 4,
                detail: "/tmp/token.txt with sk-ABCDEF"
              }
            ],
            selectedCategoryIds: ["skills"],
            counts: { accepted: 0, reviewRequired: 0, unsupported: 1, excluded: 14 },
            importState: "ready",
            readiness: 0,
            summary: "imported",
            safetyNote: "safe"
          },
          audit: {
            id: "repair-unsupported:created:2026-01-03T00:00:00.000Z",
            action: "created",
            createdAt: "2026-01-03T00:00:00.000Z",
            sourceId: "codex",
            importState: "ready",
            selectedCategoryCount: 1,
            reviewRequiredCategoryCount: 0,
            unsupportedCategoryCount: 1,
            detail: "unsafe raw transcript"
          }
        }
      ])
    );

    expect(unsupportedHistory).toHaveLength(1);
    expect(unsupportedHistory[0]?.draft.importState).toBe("blocked");
    expect(unsupportedHistory[0]?.draft.selectedCategories[0]?.detail).not.toContain("raw transcript");
  });

  it("adds drafts to history, rolls back the latest draft, and preserves immutability", () => {
    const first = createMigrationProfileDraft(
      buildDefaultMigrationPreview("codex"),
      { createdAt: "2026-01-01T00:00:00.000Z" }
    );
    const firstHistory = appendMigrationProfileDraftHistory(
      [],
      first,
      "created",
      8,
      "2026-01-01T00:00:00.000Z"
    );
    const firstHistorySnapshot = [...firstHistory];

    const second = createMigrationProfileDraft(
      {
        ...buildDefaultMigrationPreview("claude-code"),
        categories: buildDefaultMigrationPreview("claude-code").categories.map((category) =>
          category.id === "projects" || category.id === "commands"
            ? { ...category, selected: true }
            : category
        )
      },
      { createdAt: "2026-01-01T00:00:01.000Z" }
    );
    const secondHistory = appendMigrationProfileDraftHistory(
      firstHistory,
      second,
      "created",
      8,
      "2026-01-01T00:00:01.000Z"
    );
    const secondHistorySnapshot = [...secondHistory];

    expect(firstHistory).toEqual(firstHistorySnapshot);

    expect(firstHistory).toHaveLength(1);
    expect(firstHistory[0].draft).toEqual(first);
    expect(firstHistory[0].audit.evidenceFingerprint).toBe(first.evidenceFingerprint);
    expect(firstHistory[0].audit.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(secondHistory).toHaveLength(2);
    expect(secondHistory[0].draft).toEqual(second);
    expect(secondHistory[1].draft).toEqual(first);

    const rollback = rollbackMigrationProfileDraftHistory(secondHistory, "2026-01-01T00:00:02.000Z");
    expect(secondHistory).toEqual(secondHistorySnapshot);
    expect(rollback.rolledBackDraft).toEqual(second);
    expect(rollback.previousDraft).toEqual(first);
    expect(rollback.rollbackAudit?.action).toBe("rolled-back");
    expect(rollback.history).toHaveLength(1);
    expect(rollback.history[0].draft).toEqual(first);
  });

  it("persists metadata-only apply review staging as an audit action", () => {
    const draft = createMigrationProfileDraft(
      {
        ...buildDefaultMigrationPreview("codex"),
        categories: buildDefaultMigrationPreview("codex").categories.map((category) =>
          category.id === "projects"
            ? { ...category, selected: true, itemCount: 2 }
            : category
        )
      },
      { createdAt: "2026-01-04T00:00:00.000Z" }
    );
    const createdHistory = appendMigrationProfileDraftHistory(
      [],
      draft,
      "created",
      8,
      "2026-01-04T00:00:00.000Z"
    );
    const stagedHistory = appendMigrationProfileDraftHistory(
      createdHistory,
      draft,
      "apply-review-staged",
      8,
      "2026-01-04T00:00:01.000Z"
    );
    const roundTrip = parseStoredMigrationProfileDraftHistory(JSON.stringify(stagedHistory));

    expect(stagedHistory).toHaveLength(1);
    expect(stagedHistory[0].draft.importState).toBe("ready");
    expect(stagedHistory[0].audit).toMatchObject({
      action: "apply-review-staged",
      draftId: draft.id,
      importState: "ready",
      evidenceFingerprint: draft.evidenceFingerprint
    });
    expect(roundTrip[0].audit.action).toBe("apply-review-staged");
    expect(roundTrip[0].draft.importState).toBe("ready");
  });

  it("summarizes migration draft history by import state", () => {
    const readyDraft = createMigrationProfileDraft(
      {
        ...buildDefaultMigrationPreview("codex"),
        categories: buildDefaultMigrationPreview("codex").categories.map((category) =>
          category.id === "projects"
            ? { ...category, selected: true, itemCount: 2 }
            : category
        )
      },
      { createdAt: "2026-01-01T00:00:00.000Z" }
    );
    const reviewDraft = createMigrationProfileDraft({
      ...buildDefaultMigrationPreview("codex"),
      categories: buildDefaultMigrationPreview("codex").categories.map((category) =>
        category.id === "commands"
          ? { ...category, selected: true, itemCount: 1 }
          : category
      )
    });
    const blockedDraft = parseStoredMigrationProfileDraftHistory(
      JSON.stringify([
        {
          draft: {
            id: "repair-blocked",
            sourceId: "codex",
            sourceLabel: "Codex",
            createdAt: "2026-01-03T00:00:00.000Z",
            selectedCategories: [
              {
                id: "skills",
                label: "Skills",
                state: "unsupported",
                itemCount: 4,
                detail: "blocked category"
              }
            ],
            selectedCategoryIds: ["skills"],
            counts: { accepted: 0, reviewRequired: 0, unsupported: 1, excluded: 14 },
            importState: "ready",
            readiness: 0,
            summary: "imported",
            safetyNote: "safe"
          },
          audit: {
            id: "repair-blocked:created:2026-01-03T00:00:00.000Z",
            action: "created",
            createdAt: "2026-01-03T00:00:00.000Z",
            sourceId: "codex",
            importState: "ready",
            selectedCategoryCount: 1,
            reviewRequiredCategoryCount: 0,
            unsupportedCategoryCount: 1,
            detail: "unsafe raw"
          }
        }
      ])
    )[0].draft;

    const history = [
      {
        draft: readyDraft,
        audit: createMigrationProfileDraftAuditRecord(
          readyDraft,
          "created"
        )
      },
      {
        draft: reviewDraft,
        audit: createMigrationProfileDraftAuditRecord(
          reviewDraft,
          "created"
        )
      },
      {
        draft: { ...blockedDraft, importState: "blocked" as MigrationProfileDraftImportState },
        audit: createMigrationProfileDraftAuditRecord(
          { ...blockedDraft, importState: "blocked" as MigrationProfileDraftImportState },
          "created"
        )
      }
    ];

    const summary = summarizeMigrationProfileDrafts(history);

    expect(summary.ready).toBe(1);
    expect(summary.review).toBe(1);
    expect(summary.blocked).toBe(1);
    expect(summary.total).toBe(3);
    expect(summary.latestDraftId).toBe(history[0].draft.id);
  });

  it("repairs malformed persisted history safely and redacts draft audit detail", () => {
    const malformedEntry = {
      draft: {
        id: "bad-id",
        sourceId: "codex",
        sourceLabel: "Codex Source",
        createdAt: "not-a-date",
        selectedCategories: [
          {
            id: "projects",
            label: "Projects",
            state: "accepted",
            itemCount: "99",
            detail: "/tmp/session.log and bearer sk-ABCDEF1234567890 from raw transcript."
          }
        ],
        selectedCategoryIds: ["projects"],
        counts: {
          accepted: "1",
          reviewRequired: 0,
          unsupported: 0,
          excluded: 14
        },
        importState: "ready",
        readiness: "100",
        summary: "Raw token=supersecret-abc"
      },
      audit: {
        detail: "Raw transcript token sk-ABCDEF1234567890",
        action: "created",
        selectedCategoryCount: "1",
        reviewRequiredCategoryCount: 0,
        unsupportedCategoryCount: 0
      }
    };

    const recovered = parseStoredMigrationProfileDraftHistory(JSON.stringify([malformedEntry]), []);
    const repairedDraft = recovered[0].draft;
    const repairedAudit = recovered[0].audit;

    expect(recovered).toHaveLength(1);
    expect(repairedDraft.createdAt).toBe("1970-01-01T00:00:00.000Z");
    expect(repairedDraft.selectedCategories[0].itemCount).toBe(99);
    expect(repairedDraft.selectedCategories[0].detail).not.toContain("/tmp");
    expect(repairedDraft.selectedCategories[0].detail).not.toContain("sk-ABCDEF");
    expect(repairedAudit.detail).not.toContain("raw transcript");
    expect(repairedAudit.detail).not.toContain("sk-ABCDEF");
  });

  it("roundtrips migration draft history with mocked local storage", () => {
    const seedStorage: MigrationProfileDraftHistoryRecord[] = [];
    const storage = { value: "" };
    const memoryStorage = {
      getItem: vi.fn(() => (storage.value.length ? storage.value : null)),
      setItem: vi.fn((_key: string, next: string) => {
        storage.value = next;
      })
    };

    const draft = createMigrationProfileDraft(buildDefaultMigrationPreview("codex"), {
      createdAt: "2026-01-01T00:00:00.000Z"
    });
    const history = appendMigrationProfileDraftHistory(seedStorage, draft);

    vi.stubGlobal("window", { localStorage: memoryStorage });
    loadMigrationProfileDraftHistory([], 8);
    parseStoredMigrationProfileDraftHistory(null);
    loadMigrationProfileDraftHistory([], 8);

    const write = parseStoredMigrationProfileDraftHistory(
      JSON.stringify(history),
      [],
      8
    );

    expect(write).toEqual(history);
    expect(memoryStorage.getItem).toHaveBeenCalledWith(MIGRATION_DRAFT_HISTORY_STORAGE_KEY);
    saveMigrationProfileDraftHistory(history);
    const loaded = loadMigrationProfileDraftHistory([], 8);
    expect(loaded).toEqual(history);
    expect(memoryStorage.setItem).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
