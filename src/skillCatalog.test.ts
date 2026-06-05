import { describe, expect, it } from "vitest";
import {
  defaultSkillCatalog,
  normalizeSkillCatalog,
  summarizeSkillCatalog,
  snapshotFromProviderSkillCatalogPayload,
  buildSkillCatalogSnapshotFromProviderCapabilities,
  type SkillCatalogEntry,
  type SkillCatalogState
} from "./skillCatalog";

describe("skill catalog defaults", () => {
  it("define provider-neutral, public-safe defaults", () => {
    expect(defaultSkillCatalog.length).toBeGreaterThan(0);

    for (const entry of defaultSkillCatalog) {
      expect(entry.id).toMatch(/^[a-z0-9-]+$/);
      expect(entry.label).toMatch(/^[A-Za-z0-9 -]+$/);
      expect(entry.invocationLabel).toMatch(/^[A-Za-z0-9 -]+$/);
      expect(entry.source).toMatch(/^(builtin|extension|automation|api|remote)$/);
      expect(entry.trigger).toMatch(/^(slash|command|button|menu|auto)$/);
      expect(entry.state).toMatch(/^(live|preview|disconnected|setup-required|unsupported|unavailable)$/);

      if (entry.detail) {
        expect(entry.detail).not.toContain("/");
        expect(entry.detail).toMatch(/^(?!.*:\/\/).+$/);
      }
    }
  });
});

describe("skill catalog normalization", () => {
  it("repairs malformed rows and dedupes by id", () => {
    const repaired = normalizeSkillCatalog(
      [
        {
          id: "  Plan-Tasks ",
          label: "",
          source: "builtin",
          trigger: "slash",
          invocationLabel: "Open plan",
          state: "preview",
          detail: "Local planner entry.",
          extra: "ignored"
        },
        {
          id: "bad id with spaces",
          label: "Invalid ID",
          source: "extension",
          trigger: "command",
          invocationLabel: "Skip",
          state: "live"
        },
        {
          id: "health-check",
          label: "Health",
          source: "automation",
          trigger: "menu",
          invocationLabel: "Check",
          state: "not-a-state",
          detail: "Needs fallback."
        },
        {
          label: "Missing id",
          source: "api",
          trigger: "auto",
          invocationLabel: "Run",
          state: "live"
        },
        {
          id: "plan-tasks",
          label: "Second plan",
          source: "remote",
          trigger: "button",
          invocationLabel: "Replace?",
          state: "unavailable"
        }
      ] as unknown[],
      defaultSkillCatalog
    );

    expect(repaired).toHaveLength(2);
    expect(repaired[0]).toMatchObject({
      id: "plan-tasks",
      label: "Plan Tasks",
      source: "builtin",
      trigger: "slash",
      invocationLabel: "Open plan",
      state: "preview",
      detail: "Local planner entry."
    });
    expect(repaired.find((item) => item.id === "bad-id-with-spaces")).toBeUndefined();
    expect(repaired.find((item) => item.id === "health-check")?.state).toBe("unavailable");
    expect(repaired.find((item) => item.id === "plan-tasks")?.invocationLabel).toBe("Open plan");
    expect(repaired[1].id).toBe("health-check");
  });

  it("dedupes by canonicalized id preserving first", () => {
    const repaired = normalizeSkillCatalog(
      [
        {
          id: "Health-Check",
          label: "Original",
          source: "automation",
          trigger: "button",
          invocationLabel: "Run",
          state: "live"
        },
        {
          id: "health-check",
          label: "Replacement",
          source: "automation",
          trigger: "button",
          invocationLabel: "Replace",
          state: "preview"
        }
      ] as unknown[],
      defaultSkillCatalog
    );

    expect(repaired).toHaveLength(1);
    expect(repaired[0]).toMatchObject({
      id: "health-check",
      label: "Original",
      state: "live"
    });
  });

  it("repairs bad source and trigger metadata", () => {
    const repaired = normalizeSkillCatalog(
      [
        {
          id: "repair-test",
          label: "Repair Test",
          source: "unknown-source",
          trigger: "weird-trigger",
          invocationLabel: "",
          state: "live"
        }
      ] as unknown[],
      defaultSkillCatalog
    );

    expect(repaired[0]).toMatchObject({
      id: "repair-test",
      source: "builtin",
      trigger: "command",
      invocationLabel: "Repair Test"
    });
  });

  it("returns default catalog when input unusable", () => {
    expect(normalizeSkillCatalog(undefined)).toEqual(defaultSkillCatalog);
    expect(normalizeSkillCatalog("invalid-input")).toEqual(defaultSkillCatalog);
  });

  it("returns default catalog if both provided and fallback catalogs are invalid", () => {
    const repaired = normalizeSkillCatalog(undefined, []);
    expect(repaired).toEqual([
      {
        id: "skill-fallback",
        label: "Fallback Skill",
        source: "builtin",
        trigger: "command",
        invocationLabel: "Run",
        state: "unavailable",
        detail: "No valid skill catalog is available."
      }
    ]);
  });
});

describe("skill catalog summary", () => {
  it("reports accurate state counts for UI", () => {
    const catalog: SkillCatalogEntry[] = [
      { id: "a", label: "A", source: "builtin", trigger: "slash", invocationLabel: "A", state: "live" },
      { id: "b", label: "B", source: "builtin", trigger: "button", invocationLabel: "B", state: "preview" },
      { id: "c", label: "C", source: "builtin", trigger: "menu", invocationLabel: "C", state: "disconnected" },
      {
        id: "d",
        label: "D",
        source: "builtin",
        trigger: "auto",
        invocationLabel: "D",
        state: "setup-required"
      },
      {
        id: "e",
        label: "E",
        source: "builtin",
        trigger: "command",
        invocationLabel: "E",
        state: "unsupported"
      },
      { id: "f", label: "F", source: "builtin", trigger: "command", invocationLabel: "F", state: "unavailable" }
    ];

    const summary = summarizeSkillCatalog(catalog);
    expect(summary).toEqual({
      total: 6,
      live: 1,
      preview: 1,
      disconnected: 1,
      setupRequired: 1,
      unsupported: 1,
      unavailable: 1,
      actionable: 6,
      availability: 0.33
    });
  });

  it("normalizes summary input before counting", () => {
    const summary = summarizeSkillCatalog("unusable");
    expect(summary.total).toBe(defaultSkillCatalog.length);
    expect(summary.preview).toBeGreaterThan(0);
  });
});

describe("state typing", () => {
  it("includes all expected states", () => {
    const states: SkillCatalogState[] = [
      "live",
      "preview",
      "disconnected",
      "setup-required",
      "unsupported",
      "unavailable"
    ];
    expect(states).toHaveLength(6);
  });
});

describe("skill catalog provider snapshots", () => {
  const providerFallbackCatalog: SkillCatalogEntry[] = [
    {
      id: "health-check",
      label: "Health Check",
      source: "automation",
      trigger: "menu",
      invocationLabel: "Check",
      state: "live",
      detail: "Fallback baseline should remain stable."
    },
    {
      id: "remote-lens",
      label: "Remote Lens",
      source: "remote",
      trigger: "button",
      invocationLabel: "Open Lens",
      state: "unavailable"
    }
  ];

  it("builds provider-live snapshot from sanitized provider capabilities", () => {
    const snapshot = snapshotFromProviderSkillCatalogPayload(
      {
        source: "provider-live",
        entries: [
          {
            id: "health-check",
            state: "live",
            detail: "/tmp/unsafe-detail",
            localPath: "/Users/hidden/secrets.json"
          }
        ]
      },
      providerFallbackCatalog
    );

    expect(snapshot.source).toBe("provider-live");
    expect(snapshot.catalog).toHaveLength(1);
    expect(snapshot.catalog[0]).toMatchObject({
      id: "health-check",
      state: "live",
      detail: "Fallback baseline should remain stable."
    });
  });

  it("includes safe provider-only skill entries after refresh", () => {
    const snapshot = snapshotFromProviderSkillCatalogPayload(
      {
        source: "provider-live",
        entries: [
          {
            id: "provider-local-skills",
            label: "Local Skills",
            source: "builtin",
            trigger: "command",
            invocationLabel: "Open Skills",
            state: "live",
            detail: "4 metadata-visible skill entries were detected."
          }
        ]
      },
      providerFallbackCatalog
    );

    expect(snapshot.source).toBe("provider-live");
    expect(snapshot.catalog).toHaveLength(1);
    expect(snapshot.catalog[0]).toMatchObject({
      id: "provider-local-skills",
      label: "Local Skills",
      state: "live",
      detail: "4 metadata-visible skill entries were detected."
    });
  });

  it("downgrades live skills to preview when live runtime is unavailable", () => {
    const snapshot = snapshotFromProviderSkillCatalogPayload(
      {
        source: "provider-preview",
        entries: [
          { id: "health-check", state: "live" },
          {
            id: "provider-local-skills",
            label: "Local Skills",
            source: "builtin",
            trigger: "command",
            invocationLabel: "Open Skills",
            state: "live",
            detail: "Safe metadata only."
          }
        ]
      },
      providerFallbackCatalog
    );

    expect(snapshot.source).toBe("provider-preview");
    expect(snapshot.catalog.find((entry) => entry.id === "health-check")?.state).toBe("preview");
    expect(snapshot.catalog.find((entry) => entry.id === "provider-local-skills")?.state).toBe("preview");
  });

  it("returns an empty-refresh result when provider sends no capabilities", () => {
    const snapshot = snapshotFromProviderSkillCatalogPayload(
      {
        source: "provider-live",
        entries: []
      },
      providerFallbackCatalog
    );

    expect(snapshot.source).toBe("empty-refresh");
    expect(snapshot.summary.source).toBe("empty-refresh");
    expect(snapshot.catalog).toEqual(providerFallbackCatalog);
  });

  it("handles unavailable or malformed provider inputs while preserving safe fallback", () => {
    expect(snapshotFromProviderSkillCatalogPayload("not-a-payload", providerFallbackCatalog).source).toBe(
      "unavailable"
    );
    expect(
      snapshotFromProviderSkillCatalogPayload("not-a-payload", providerFallbackCatalog).catalog[0]?.state
    ).toBe("unavailable");
    expect(
      snapshotFromProviderSkillCatalogPayload("not-a-payload", providerFallbackCatalog).catalog[0]?.id
    ).toBe("health-check");
  });

  it("preserves caller-provided fallback when capability payload is malformed", () => {
    const explicitFallback = buildSkillCatalogSnapshotFromProviderCapabilities(
      {
        source: "provider-live",
        canRunLive: true,
        canRunPreview: false,
        // malformed skill payload should be rejected and fallback should remain
        // the single string entry should sanitize to zero capability rows.
        skills: "malformed-rows" as unknown as unknown[]
      } as unknown,
      providerFallbackCatalog
    );

    expect(explicitFallback.source).toBe("default-fallback");
    expect(explicitFallback.catalog).toEqual(providerFallbackCatalog);
    expect(explicitFallback.catalog.find((entry) => entry.id === "health-check")?.state).toBe("live");
  });
});
