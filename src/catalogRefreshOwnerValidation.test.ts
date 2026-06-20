import { describe, expect, it } from "vitest";
import {
  buildCatalogRefreshOwnerValidation,
  CATALOG_REFRESH_OWNER_NO_EXECUTION_SAFETY,
  CATALOG_REFRESH_OWNER_SURFACE_ORDER
} from "./catalogRefreshOwnerValidation";

const orderedPayloads = {
  commandPayload: {
    source: "default-fallback",
    entries: [
      {
        command: "/alpha",
        label: "Alpha",
        detail: "A command for deterministic ordering checks.",
        state: "live",
        scopes: ["panel"]
      },
      {
        command: "/beta",
        label: "Beta",
        detail: "A second command for deterministic ordering checks.",
        state: "preview",
        scopes: ["global"]
      }
    ]
  },
  skillPayload: {
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
        source: "extension",
        trigger: "button",
        invocationLabel: "Beta",
        state: "preview"
      }
    ]
  },
  pluginPayload: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-plugin",
        label: "Alpha Plugin",
        detail: "First plugin payload.",
        state: "live"
      },
      {
        id: "beta-plugin",
        label: "Beta Plugin",
        detail: "Second plugin payload.",
        state: "preview"
      }
    ]
  },
  mcpPayload: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-mcp",
        label: "Alpha MCP",
        transport: "stdio",
        state: "live",
        toolPolicy: "read-only",
        detail: "First MCP payload."
      },
      {
        id: "beta-mcp",
        label: "Beta MCP",
        transport: "http",
        state: "preview",
        toolPolicy: "approval-required",
        detail: "Second MCP payload."
      }
    ]
  },
  automationPayload: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-auto",
        label: "Alpha Automation",
        lifecycle: "active",
        trigger: "manual",
        approvalPosture: "manual",
        state: "live"
      },
      {
        id: "beta-auto",
        label: "Beta Automation",
        lifecycle: "active",
        trigger: "event",
        approvalPosture: "approval-required",
        state: "preview"
      }
    ]
  },
  personalizationPayload: {
    source: "default-fallback",
    entries: [
      {
        id: "alpha-pers",
        label: "Alpha Personalization",
        layer: "ui",
        source: "builtin",
        privacyPosture: "device-only",
        state: "live"
      },
      {
        id: "beta-pers",
        label: "Beta Personalization",
        layer: "governance",
        source: "automation",
        privacyPosture: "local-process-only",
        state: "preview"
      }
    ]
  }
} as const;

describe("catalog refresh owner validation", () => {
  it("returns deterministic surface order and itemOrder for all six catalog surfaces", () => {
    const result = buildCatalogRefreshOwnerValidation(orderedPayloads);

    expect(result.surfaces.map((entry) => entry.surface)).toEqual(
      Array.from(CATALOG_REFRESH_OWNER_SURFACE_ORDER)
    );
    expect(result.surfaces).toHaveLength(6);

    expect(result.surfaces[0].itemOrder).toEqual(["/alpha", "/beta"]);
    expect(result.surfaces[1].itemOrder).toEqual(["alpha-skill", "beta-skill"]);
    expect(result.surfaces[2].itemOrder).toEqual(["alpha-plugin", "beta-plugin"]);
    expect(result.surfaces[3].itemOrder).toEqual(["alpha-mcp", "beta-mcp"]);
    expect(result.surfaces[4].itemOrder).toEqual(["alpha-auto", "beta-auto"]);
    expect(result.surfaces[5].itemOrder).toEqual(["alpha-pers", "beta-pers"]);
    expect(result.surfaces[2].metadataProof).toEqual([
      "alpha-plugin:connection=live:surface=metadata-only",
      "beta-plugin:connection=preview:surface=metadata-only"
    ]);
    expect(result.surfaces[3].metadataProof).toEqual([
      "alpha-mcp:transport=stdio:toolPolicy=read-only:state=live",
      "beta-mcp:transport=http:toolPolicy=approval-required:state=preview"
    ]);
    expect(result.surfaces.every((surface) => surface.pass)).toBe(true);
    expect(result.pass).toBe(true);
  });

  it("resolves malformed payloads to fallback/unavailable without throwing", () => {
    const result = buildCatalogRefreshOwnerValidation({
      commandPayload: "bad command payload",
      skillPayload: 42,
      pluginPayload: [],
      mcpPayload: true,
      automationPayload: { source: "provider-live" },
      personalizationPayload: null
    });

    expect(result.surfaces).toHaveLength(6);
    for (const surface of result.surfaces) {
      expect(
        ["provider-live", "provider-preview", "default-fallback", "empty-refresh", "unavailable"]
      ).toContain(surface.source);
      expect(surface.readiness).toBe(100);
      expect(surface.state).toBe("ready");
      expect(surface.summary).toBeTypeOf("object");
      expect(surface.total).toBeGreaterThan(0);
    }
    expect(result.pass).toBe(true);
  });

  it("shares an explicit no-execution safety detail at result and surface level", () => {
    const result = buildCatalogRefreshOwnerValidation(orderedPayloads);

    expect(result.safety).toBe(CATALOG_REFRESH_OWNER_NO_EXECUTION_SAFETY);
    expect(result.safety).toContain("must not execute commands");
    expect(result.safety).toContain("skills");
    expect(result.safety).toContain("plugins");
    expect(result.safety).toContain("MCP");
    expect(result.safety).toContain("automations");
    expect(result.safety).toContain("personalization/profile mutations");
    expect(result.safety).toContain("terminal actions");
    expect(result.safety).toContain("Git operations");
    expect(result.safety).toContain("external actions");

    for (const surface of result.surfaces) {
      expect(surface.safety).toBe(CATALOG_REFRESH_OWNER_NO_EXECUTION_SAFETY);
    }
  });

  it("passes explicit provider states when metadata/status-only summaries are consistent", () => {
    const result = buildCatalogRefreshOwnerValidation({
      commandPayload: {
        source: "provider-preview",
        canRunLive: false,
        canRunPreview: true,
        entries: [
          {
            command: "/preview-command",
            label: "Preview Command",
            detail: "Preview-only command.",
            state: "preview",
            scopes: ["app"]
          }
        ]
      },
      skillPayload: {
        source: "provider-preview",
        canRunLive: false,
        canRunPreview: true,
        entries: [
          {
            id: "preview-skill",
            label: "Preview Skill",
            source: "api",
            trigger: "menu",
            invocationLabel: "Preview",
            state: "preview"
          }
        ]
      },
      pluginPayload: {
        source: "provider-live",
        canRunLive: true,
        canRunPreview: true,
        entries: [
          {
            id: "preview-plugin",
            label: "Preview Plugin",
            detail: "Preview plugin payload.",
            state: "preview"
          }
        ]
      },
      mcpPayload: {
        source: "provider-preview",
        canRunLive: false,
        canRunPreview: true,
        entries: [
          {
            id: "preview-mcp",
            label: "Preview MCP",
            transport: "http",
            state: "preview",
            toolPolicy: "read-only"
          }
        ]
      },
      automationPayload: {
        source: "unavailable",
        entries: []
      },
      personalizationPayload: {
        source: "provider-live",
        entries: [
          {
            id: "preview-pers",
            label: "Preview Personalization",
            layer: "assist",
            source: "user-config",
            privacyPosture: "optional-sync",
            state: "preview"
          }
        ]
      }
    });

    const allowedSources = new Set([
      "provider-live",
      "provider-preview",
      "default-fallback",
      "empty-refresh",
      "unavailable"
    ]);
    for (const surface of result.surfaces) {
      expect(allowedSources.has(surface.source)).toBe(true);
    }
    expect(result.surfaces[0].source).toBe("provider-preview");
    expect(result.surfaces[1].source).toBe("provider-preview");
    expect(result.surfaces[2].source).toBe("provider-live");
    expect(result.surfaces[3].source).toBe("provider-preview");
    expect(result.surfaces[5].source).toBe("provider-live");
    expect(result.surfaces.every((surface) => surface.pass)).toBe(true);
    expect(result.pass).toBe(true);
  });
});
