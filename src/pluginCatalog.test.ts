import { describe, expect, it } from "vitest";
import {
  defaultPluginCatalog,
  normalizePluginCatalog,
  summarizePluginCatalog,
  type PluginCatalogEntry,
  type PluginCatalogState
} from "./pluginCatalog";

describe("plugin catalog defaults", () => {
  it("contains safe provider-neutral defaults", () => {
    expect(defaultPluginCatalog.length).toBeGreaterThan(0);
    expect(defaultPluginCatalog.map((entry) => entry.id)).toEqual([
      "notes-sync",
      "task-automation",
      "context-insights",
      "telemetry-export",
      "legacy-adapter"
    ]);

    for (const entry of defaultPluginCatalog) {
      expect(entry.id).toMatch(/^[a-z0-9-]+$/);
      expect(entry.label).toMatch(/^[A-Za-z0-9 -]+$/);
      expect(entry.state).toMatch(
        /^(live|preview|disconnected|setup-required|unsupported|unavailable)$/
      );
      expect(entry.detail).not.toMatch(/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+/);
    }
  });
});
describe("plugin catalog normalization", () => {
  it("repairs malformed rows and keeps the first row for duplicate ids", () => {
    const repaired = normalizePluginCatalog(
      [
        {
          id: " notes-sync ",
          label: "",
          detail: "Local note store",
          state: "preview",
          extra: "ignored"
        },
        {
          id: "BAD ID",
          label: "Invalid identifier",
          detail: "Should be dropped.",
          state: "live"
        },
        {
          id: "telemetry-export",
          label: "Bridge",
          detail: "Fallback state only.",
          state: "not-a-state",
          active: true
        },
        {
          detail: "Missing id",
          label: "No id",
          state: "live"
        },
        {
          id: "notes-sync",
          label: "Duplicate",
          detail: "Second row ignored",
          state: "unavailable"
        },
        {
          id: "new-plugin",
          label: "Fresh plugin",
          detail: "Supported in preview.",
          state: "preview"
        }
      ] as unknown[],
      defaultPluginCatalog
    );

    expect(repaired).toMatchObject([
      {
        id: "notes-sync",
        label: "Notes Sync",
        detail: "Local note store",
        state: "preview"
      },
      {
        id: "telemetry-export",
        label: "Bridge",
        detail: "Fallback state only.",
        state: "unavailable"
      },
      {
        id: "new-plugin",
        label: "Fresh plugin",
        detail: "Supported in preview.",
        state: "preview"
      }
    ]);
  });

  it("coerces invalid states to unavailable", () => {
    const repaired = normalizePluginCatalog(
      [
        {
          id: "state-fail",
          label: "State Recovery",
          detail: "Unknown states are repaired.",
          state: "??"
        }
      ] as unknown[],
      defaultPluginCatalog
    );
    expect(repaired[0].state).toBe("unavailable");
  });

  it("dedupes by canonicalized id", () => {
    const repaired = normalizePluginCatalog(
      [
        {
          id: "Task-Automation",
          label: "Original",
          detail: "Lowercase later should drop.",
          state: "live"
        },
        {
          id: "task-automation",
          label: "Replacement",
          detail: "This row duplicates Task-Automation.",
          state: "preview"
        }
      ] as unknown[],
      defaultPluginCatalog
    );

    expect(repaired).toHaveLength(1);
    expect(repaired[0]).toMatchObject({
      id: "task-automation",
      label: "Original"
    });
  });

  it("falls back to the default catalog when unusable", () => {
    expect(normalizePluginCatalog("not-a-catalog")).toEqual(defaultPluginCatalog);
    expect(normalizePluginCatalog(undefined, [] as PluginCatalogEntry[])).toEqual(defaultPluginCatalog);
  });
});

describe("plugin catalog summary", () => {
  it("counts states for UI rendering", () => {
    const catalog: PluginCatalogEntry[] = [
      { id: "one", label: "One", detail: "Live", state: "live" },
      { id: "two", label: "Two", detail: "Live", state: "live" },
      { id: "three", label: "Three", detail: "Preview", state: "preview" },
      { id: "four", label: "Four", detail: "Disconnected", state: "disconnected" },
      { id: "five", label: "Five", detail: "Setup", state: "setup-required" },
      { id: "six", label: "Six", detail: "Blocked", state: "unsupported" },
      { id: "seven", label: "Seven", detail: "Missing transport", state: "unavailable" }
    ];

    const summary = summarizePluginCatalog(catalog);

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

describe("state helper types", () => {
  it("declares the expected supported states", () => {
    const states: PluginCatalogState[] = [
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
