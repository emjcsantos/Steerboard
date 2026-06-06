import { describe, expect, it } from "vitest";
import {
  buildCatalogRefreshOwnerValidation,
  type CatalogRefreshOwnerValidationInput,
  type CatalogRefreshOwnerValidationResult
} from "./catalogRefreshOwnerValidation";
import {
  buildCatalogRefreshProviderSmoke,
  CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW,
  CATALOG_REFRESH_PROVIDER_SMOKE_SURFACE_ORDER
} from "./catalogRefreshProviderSmoke";

const safeCompletedDetail =
  "metadata/status refresh completed without executing commands, skills, plugins";

const snapshotPayloads = {
  commandCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        command: "/alpha",
        label: "Alpha Command",
        detail: "Primary command snapshot for deterministic ordering.",
        state: "live",
        scopes: ["panel"]
      },
      {
        command: "/beta",
        label: "Beta Command",
        detail: "Secondary command snapshot for deterministic ordering.",
        state: "preview",
        scopes: ["app"]
      }
    ]
  },
  skillCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-skill",
        label: "Alpha Skill",
        source: "builtin",
        trigger: "slash",
        invocationLabel: "Alpha",
        state: "live"
      },
      {
        id: "beta-skill",
        label: "Beta Skill",
        source: "builtin",
        trigger: "menu",
        invocationLabel: "Beta",
        state: "preview"
      }
    ]
  },
  pluginCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-plugin",
        label: "Alpha Plugin",
        detail: "Alpha plugin.",
        state: "live"
      },
      {
        id: "beta-plugin",
        label: "Beta Plugin",
        detail: "Beta plugin.",
        state: "preview"
      }
    ]
  },
  mcpCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-mcp",
        label: "Alpha MCP",
        transport: "stdio",
        state: "live",
        toolPolicy: "read-only"
      },
      {
        id: "beta-mcp",
        label: "Beta MCP",
        transport: "http",
        state: "preview",
        toolPolicy: "approval-required"
      }
    ]
  },
  automationCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-automation",
        label: "Alpha Automation",
        lifecycle: "active",
        trigger: "manual",
        approvalPosture: "manual",
        state: "live"
      },
      {
        id: "beta-automation",
        label: "Beta Automation",
        lifecycle: "active",
        trigger: "event",
        approvalPosture: "approval-required",
        state: "preview"
      }
    ]
  },
  personalizationCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-personalization",
        label: "Alpha Personalization",
        layer: "ui",
        source: "builtin",
        privacyPosture: "device-only",
        state: "live"
      },
      {
        id: "beta-personalization",
        label: "Beta Personalization",
        layer: "workflow",
        source: "automation",
        privacyPosture: "local-process-only",
        state: "preview"
      }
    ]
  }
} as const;

const ownerValidationPayload: CatalogRefreshOwnerValidationInput = {
  commandPayload: snapshotPayloads.commandCatalogSnapshot,
  skillPayload: snapshotPayloads.skillCatalogSnapshot,
  pluginPayload: snapshotPayloads.pluginCatalogSnapshot,
  mcpPayload: snapshotPayloads.mcpCatalogSnapshot,
  automationPayload: snapshotPayloads.automationCatalogSnapshot,
  personalizationPayload: snapshotPayloads.personalizationCatalogSnapshot
};

describe("catalog refresh provider smoke model", () => {
  it("returns deterministic six-surface proof for provider/model-agnostic snapshots", () => {
    const result = buildCatalogRefreshProviderSmoke(snapshotPayloads);

    expect(result.surfaces.map((surface) => surface.surface)).toEqual(
      Array.from(CATALOG_REFRESH_PROVIDER_SMOKE_SURFACE_ORDER)
    );
    expect(result.surfaces).toHaveLength(6);
    expect(result.executed).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.readiness).toBe(100);
    expect(result.state).toBe("ready");
    expect(result.detail.toLowerCase()).toContain(safeCompletedDetail);

    for (const surface of result.surfaces) {
      expect(surface.executed).toBe(true);
      expect(surface.pass).toBe(true);
      expect(surface.readiness).toBe(100);
      expect(surface.state).toBe("ready");
      expect(surface.source).toBe("default-fallback");
      expect(surface.detail.toLowerCase()).toContain(safeCompletedDetail);
      expect(surface.safety).toContain("must not execute");
      expect(surface.total).toBeGreaterThan(0);
    }
  });

  it("handles malformed snapshots safely and preserves deterministic surface order", () => {
    const malformed = buildCatalogRefreshProviderSmoke({
      commandCatalogSnapshot: "bad command payload",
      skillCatalogSnapshot: 101,
      pluginCatalogSnapshot: null,
      mcpCatalogSnapshot: { source: "provider-live" },
      automationCatalogSnapshot: true,
      personalizationCatalogSnapshot: []
    });

    expect(malformed.surfaces.map((surface) => surface.surface)).toEqual(
      Array.from(CATALOG_REFRESH_PROVIDER_SMOKE_SURFACE_ORDER)
    );
    expect(malformed.readiness).toBeGreaterThanOrEqual(0);
    expect(malformed.surfaces).toHaveLength(6);
    for (const surface of malformed.surfaces) {
      expect(["ready", "preview", "blocked"]).toContain(surface.state);
      expect(surface.safety).toContain("must not execute");
      expect(surface.total).toBeGreaterThanOrEqual(0);
    }
    expect(malformed.ok).toBe(true);
  });

  it("supports explicit blocked validation injection without throwing", () => {
    const valid = buildCatalogRefreshOwnerValidation(ownerValidationPayload);
    const blocked: CatalogRefreshOwnerValidationResult = {
      ...valid,
      pass: false,
      readiness: 0,
      state: "blocked",
      surfaces: valid.surfaces.map((surface) =>
        surface.surface === "mcp"
          ? {
              ...surface,
              pass: false,
              readiness: 0,
              state: "blocked" as const
            }
          : surface
      )
    };

    const result = buildCatalogRefreshProviderSmoke(snapshotPayloads, {
      validationOverride: blocked
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("blocked");
    expect(result.surfaces.find((surface) => surface.surface === "mcp")?.pass).toBe(false);
    expect(result.surfaces.find((surface) => surface.surface === "mcp")?.state).toBe("blocked");
    expect(result.surfaces.find((surface) => surface.surface === "mcp")?.readiness).toBe(0);
    expect(result.surfaces.find((surface) => surface.surface === "mcp")?.executed).toBe(true);
  });

  it("provides a not-run unavailable preview fallback proof", () => {
    const result = buildCatalogRefreshProviderSmoke({}, { notRunPreview: true });

    expect(result).toEqual(CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW);
    expect(result.state).toBe("preview");
    expect(result.executed).toBe(false);
    expect(result.ok).toBe(false);
    expect(result.readiness).toBe(0);
    for (const surface of result.surfaces) {
      expect(surface.state).toBe("preview");
      expect(surface.executed).toBe(false);
      expect(surface.pass).toBe(false);
      expect(surface.source).toBe("unavailable");
      expect(surface.detail).toContain("preview/unavailable");
    }
  });
});
