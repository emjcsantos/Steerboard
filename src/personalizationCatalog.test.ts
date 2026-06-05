import { describe, expect, it } from "vitest";
import {
  buildPersonalizationCatalogSnapshot,
  defaultPersonalizationCatalog,
  type PersonalizationCatalogRefreshSource,
  normalizePersonalizationCatalog,
  summarizePersonalizationCatalog,
  type PersonalizationCatalogEntry,
  type PersonalizationCatalogState
} from "./personalizationCatalog";

describe("personalization catalog defaults", () => {
  it("defines safe provider-neutral defaults", () => {
    expect(defaultPersonalizationCatalog.length).toBeGreaterThan(0);

    for (const entry of defaultPersonalizationCatalog) {
      expect(entry.id).toMatch(/^[a-z0-9-]+$/);
      expect(entry.label).toMatch(/^[A-Za-z0-9 -]+$/);
      expect(entry.layer).toMatch(/^(ui|workflow|memory|assist|governance)$/);
      expect(entry.source).toMatch(/^(builtin|extension|user-config|api|automation)$/);
      expect(entry.privacyPosture).toMatch(
        /^(device-only|optional-sync|consent-based-sync|local-process-only)$/
      );
      expect(entry.state).toMatch(/^(live|preview|disconnected|setup-required|unsupported|unavailable)$/);

      if (entry.detail) {
        expect(entry.detail).not.toContain("/");
      }
    }
  });
});

describe("personalization catalog normalization", () => {
  it("repairs malformed rows and preserves first row by id", () => {
    const repaired = normalizePersonalizationCatalog(
      [
        {
          id: " Focus-Priority ",
          label: "",
          layer: "governance",
          source: "builtin",
          privacyPosture: "local-process-only",
          state: "preview",
          detail: "Used to boost priority in dashboards.",
          extra: "ignored"
        },
        {
          id: "BAD ID",
          label: "Bad",
          layer: "ui",
          source: "builtin",
          privacyPosture: "device-only",
          state: "live"
        },
        {
          id: "term-memory",
          label: "Term Memory",
          layer: "memory",
          source: "builtin",
          privacyPosture: "local-process-only",
          state: "not-a-state",
          detail: "Needs repaired state."
        },
        {
          detail: "Missing id entry",
          layer: "ui",
          source: "builtin",
          privacyPosture: "device-only",
          state: "live"
        },
        {
          id: "focus-priority",
          label: "Duplicate replacement",
          layer: "governance",
          source: "extension",
          privacyPosture: "device-only",
          state: "unavailable"
        }
      ] as unknown[],
      defaultPersonalizationCatalog
    );

    expect(repaired).toMatchObject([
      {
        id: "focus-priority",
        label: "Focus Priority",
        layer: "governance",
        source: "builtin",
        privacyPosture: "local-process-only",
        state: "preview"
      },
      {
        id: "term-memory",
        label: "Term Memory",
        layer: "memory",
        source: "builtin",
        privacyPosture: "local-process-only",
        state: "unavailable",
        detail: "Needs repaired state."
      }
    ]);
    expect(repaired).toHaveLength(2);
  });

  it("repairs unsupported layer/source/privacy values", () => {
    const repaired = normalizePersonalizationCatalog(
      [
        {
          id: "repair-layer",
          label: "Repair Layer",
          layer: "nonsense-layer",
          source: "nonsense-source",
          privacyPosture: "nonsense-privacy",
          state: "live"
        }
      ] as unknown[],
      defaultPersonalizationCatalog
    );

    expect(repaired[0]).toMatchObject({
      id: "repair-layer",
      layer: "ui",
      source: "builtin",
      privacyPosture: "device-only"
    });
  });

  it("falls back to the default catalog when input is unusable", () => {
    expect(normalizePersonalizationCatalog("not-a-catalog")).toEqual(defaultPersonalizationCatalog);
    expect(normalizePersonalizationCatalog(undefined, [] as PersonalizationCatalogEntry[])).toEqual(
      defaultPersonalizationCatalog
    );
  });

  it("dedupes canonicalized ids preserving first entry", () => {
    const repaired = normalizePersonalizationCatalog(
      [
        {
          id: "layout-Memory",
          label: "Keep This",
          layer: "memory",
          source: "extension",
          privacyPosture: "device-only",
          state: "live"
        },
        {
          id: "layout-memory",
          label: "Drop This",
          layer: "memory",
          source: "extension",
          privacyPosture: "device-only",
          state: "preview"
        }
      ] as unknown[],
      defaultPersonalizationCatalog
    );

    expect(repaired).toHaveLength(1);
    expect(repaired[0]).toMatchObject({ id: "layout-memory", label: "Keep This" });
  });
});

describe("personalization catalog summary", () => {
  it("counts states for UI summaries", () => {
    const catalog: PersonalizationCatalogEntry[] = [
      {
        id: "a",
        label: "A",
        layer: "ui",
        source: "builtin",
        privacyPosture: "device-only",
        state: "live"
      },
      {
        id: "b",
        label: "B",
        layer: "ui",
        source: "builtin",
        privacyPosture: "device-only",
        state: "live"
      },
      {
        id: "c",
        label: "C",
        layer: "ui",
        source: "builtin",
        privacyPosture: "device-only",
        state: "preview"
      },
      {
        id: "d",
        label: "D",
        layer: "ui",
        source: "builtin",
        privacyPosture: "device-only",
        state: "disconnected"
      },
      {
        id: "e",
        label: "E",
        layer: "ui",
        source: "builtin",
        privacyPosture: "device-only",
        state: "setup-required"
      },
      {
        id: "f",
        label: "F",
        layer: "ui",
        source: "builtin",
        privacyPosture: "device-only",
        state: "unsupported"
      },
      {
        id: "g",
        label: "G",
        layer: "ui",
        source: "builtin",
        privacyPosture: "device-only",
        state: "unavailable"
      }
    ];

    const summary = summarizePersonalizationCatalog(catalog);

    expect(summary).toEqual({
      total: 7,
      live: 2,
      preview: 1,
      disconnected: 1,
      setupRequired: 1,
      unsupported: 1,
      unavailable: 1,
      actionable: 7,
      availability: 0.43
    });
  });
});

describe("personalization catalog snapshot", () => {
  it("builds provider-refresh snapshots from safe rows", () => {
    const snapshot = buildPersonalizationCatalogSnapshot(
      [
        {
          id: "layout-memory",
          label: "Layout Memory",
          layer: "memory",
          source: "builtin",
          privacyPosture: "device-only",
          state: "preview"
        }
      ],
      "provider-live",
      defaultPersonalizationCatalog
    );

    expect(snapshot.source).toBe("provider-live");
    expect(snapshot.catalog).toEqual([
      {
        id: "layout-memory",
        label: "Layout Memory",
        layer: "memory",
        source: "builtin",
        privacyPosture: "device-only",
        state: "preview"
      }
    ]);
  });

  it("falls back on empty-refresh with the safe catalog", () => {
    const snapshot = buildPersonalizationCatalogSnapshot([], "provider-live", defaultPersonalizationCatalog);
    expect(snapshot.source).toBe("empty-refresh");
    expect(snapshot.catalog).toEqual(defaultPersonalizationCatalog);
  });
});

describe("state typing", () => {
  it("includes all expected states", () => {
    const states: PersonalizationCatalogState[] = [
      "live",
      "preview",
      "disconnected",
      "setup-required",
      "unsupported",
      "unavailable"
    ];
    expect(states).toHaveLength(6);
  });

  it("includes every refresh source", () => {
    const sources: PersonalizationCatalogRefreshSource[] = [
      "provider-live",
      "provider-preview",
      "default-fallback",
      "empty-refresh",
      "unavailable"
    ];
    expect(sources).toHaveLength(5);
  });
});
