import { describe, expect, it } from "vitest";
import {
  buildCatalogRefreshOwnerValidation,
  type CatalogRefreshOwnerValidationResult,
  type CatalogRefreshOwnerValidationSurfaceResult,
  type CatalogSurface
} from "./catalogRefreshOwnerValidation";
import {
  buildCatalogRefreshProviderSmoke,
  CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW
} from "./catalogRefreshProviderSmoke";
import { buildPhase4ProviderBlockerPriority } from "./phase4ProviderBlockerPriority";
import { buildPhase4ProviderCatalogDepth } from "./phase4ProviderCatalogDepth";
import { buildPhase4ProviderSurfaceDepth } from "./phase4ProviderSurfaceDepth";
import { buildPhase4ProviderTraceabilitySummary } from "./phase4ProviderTraceability";
import { buildPhase4RefreshSafetyDepth } from "./phase4RefreshSafetyDepth";
import { buildProviderIntegrationReadiness } from "./providerIntegrationReadiness";

const surfaces: readonly CatalogSurface[] = [
  "command",
  "skill",
  "plugin",
  "mcp",
  "automation",
  "personalization"
];

const snapshotPayloads = {
  commandCatalogSnapshot: {
    source: "provider-live",
    entries: [{ command: "/alpha", label: "Alpha", detail: "Alpha.", state: "live", scopes: ["panel"] }]
  },
  skillCatalogSnapshot: {
    source: "provider-live",
    entries: [{ id: "alpha-skill", label: "Alpha Skill", source: "builtin", trigger: "slash", invocationLabel: "Alpha", state: "live" }]
  },
  pluginCatalogSnapshot: {
    source: "provider-live",
    entries: [{ id: "alpha-plugin", label: "Alpha Plugin", detail: "Alpha.", state: "live" }]
  },
  mcpCatalogSnapshot: {
    source: "provider-live",
    entries: [{ id: "alpha-mcp", label: "Alpha MCP", transport: "stdio", state: "live", toolPolicy: "read-only" }]
  },
  automationCatalogSnapshot: {
    source: "provider-live",
    entries: [{ id: "alpha-automation", label: "Alpha Automation", lifecycle: "active", trigger: "manual", approvalPosture: "manual", state: "live" }]
  },
  personalizationCatalogSnapshot: {
    source: "provider-live",
    entries: [{ id: "alpha-personalization", label: "Alpha Personalization", layer: "ui", source: "builtin", privacyPosture: "device-only", state: "live" }]
  }
} as const;

function surfaceFixture(
  surface: CatalogSurface,
  overrides: Partial<CatalogRefreshOwnerValidationSurfaceResult> = {}
): CatalogRefreshOwnerValidationSurfaceResult {
  return {
    surface,
    source: "provider-live",
    total: 2,
    readiness: 100,
    state: "ready",
    pass: true,
    itemOrder: [`${surface}-one`, `${surface}-two`],
    safety: "metadata/status-only",
    summary: {
      total: 2,
      live: 2,
      preview: 0,
      disconnected: 0,
      setupRequired: 0,
      unsupported: 0,
      unavailable: 0,
      actionable: 2,
      availability: 1
    },
    ...overrides
  };
}

function validationFixture(
  surfaceOverrides: Partial<Record<CatalogSurface, Partial<CatalogRefreshOwnerValidationSurfaceResult>>> = {}
): CatalogRefreshOwnerValidationResult {
  const surfaceResults = surfaces.map((surface) => surfaceFixture(surface, surfaceOverrides[surface]));
  const pass = surfaceResults.every((surface) => surface.pass);

  return {
    safety: "Catalog refresh validation is metadata/status-only.",
    pass,
    readiness: pass ? 100 : 0,
    state: pass ? "ready" : "blocked",
    surfaces: surfaceResults
  };
}

function priority({
  validation = buildCatalogRefreshOwnerValidation(),
  smoke = CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW
}: {
  validation?: CatalogRefreshOwnerValidationResult;
  smoke?: ReturnType<typeof buildCatalogRefreshProviderSmoke>;
} = {}) {
  const readiness = buildProviderIntegrationReadiness(validation);
  const catalogDepth = buildPhase4ProviderCatalogDepth(readiness);
  const refreshSafety = buildPhase4RefreshSafetyDepth(smoke);
  const surfaceDepth = buildPhase4ProviderSurfaceDepth(readiness);
  const traceability = buildPhase4ProviderTraceabilitySummary({
    catalogDepth,
    refreshSafety,
    surfaceDepth
  });

  return buildPhase4ProviderBlockerPriority({
    catalogDepth,
    refreshSafety,
    surfaceDepth,
    traceability
  });
}

describe("phase 4 provider blocker priority", () => {
  it("ranks setup-required catalog and surface blockers ahead of preview refresh proof", () => {
    const snapshot = priority();

    expect(snapshot.state).toBe("setup-required");
    expect(snapshot.openBlockerCount).toBeGreaterThan(0);
    expect(snapshot.topPriorityLabel).toBe("Skills");
    expect(snapshot.catalogSmokeCanAddressTopBlocker).toBe(false);
    expect(snapshot.items[0]).toMatchObject({
      kind: "provider-catalog",
      status: "setup-required",
      severity: "critical",
      priority: 1
    });
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "refresh-safety", status: "preview", canUseCatalogSmoke: true }),
        expect.objectContaining({ kind: "surface-depth", status: "setup-required" }),
        expect.objectContaining({ kind: "traceability", status: "setup-required" })
      ])
    );
  });

  it("marks a preview-only provider blocker as catalog-smoke addressable", () => {
    const snapshot = priority({
      validation: validationFixture({
        mcp: {
          source: "provider-preview",
          summary: {
            total: 2,
            live: 0,
            preview: 2,
            disconnected: 0,
            setupRequired: 0,
            unsupported: 0,
            unavailable: 0,
            actionable: 2,
            availability: 1
          }
        }
      }),
      smoke: buildCatalogRefreshProviderSmoke(snapshotPayloads)
    });

    expect(snapshot.state).toBe("preview");
    expect(snapshot.topPriorityLabel).toBe("MCP");
    expect(snapshot.catalogSmokeCanAddressTopBlocker).toBe(true);
    expect(snapshot.nextAction).toContain("catalog smoke");
  });

  it("reports ready when provider review and traceability are fully ready", () => {
    const snapshot = priority({
      validation: validationFixture(),
      smoke: buildCatalogRefreshProviderSmoke(snapshotPayloads)
    });

    expect(snapshot.state).toBe("ready");
    expect(snapshot.openBlockerCount).toBe(0);
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.topPriorityLabel).toBe("No open Phase 4 provider blocker");
  });

  it("keeps blocker-priority text public-safe", () => {
    const snapshot = priority();
    const combinedText = [
      snapshot.label,
      snapshot.ariaLabel,
      snapshot.nextAction,
      snapshot.safety,
      ...snapshot.items.flatMap((item) => [
        item.label,
        item.kind,
        item.status,
        item.severity,
        item.detail,
        item.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
