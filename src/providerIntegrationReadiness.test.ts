import { describe, expect, it } from "vitest";
import {
  buildCatalogRefreshOwnerValidation,
  type CatalogRefreshOwnerValidationResult,
  type CatalogRefreshOwnerValidationSurfaceResult,
  type CatalogSurface
} from "./catalogRefreshOwnerValidation";
import { buildProviderIntegrationReadiness } from "./providerIntegrationReadiness";

const surfaces: readonly CatalogSurface[] = [
  "command",
  "skill",
  "plugin",
  "mcp",
  "automation",
  "personalization"
];

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
  const pass = surfaceResults.every((item) => item.pass);

  return {
    safety: "Catalog refresh validation is metadata/status-only.",
    pass,
    readiness: pass ? 100 : 0,
    state: pass ? "ready" : "blocked",
    surfaces: surfaceResults
  };
}

describe("provider integration readiness", () => {
  it("classifies the default fallback catalog posture as setup-required without execution", () => {
    const validation = buildCatalogRefreshOwnerValidation();
    const readiness = buildProviderIntegrationReadiness(validation);

    expect(readiness.state).toBe("setup-required");
    expect(readiness.statusLabel).toBe("Setup required");
    expect(readiness.counts.setupRequired).toBeGreaterThan(0);
    expect(readiness.safety).toContain("metadata/status-only");
    expect(readiness.nextAction).toContain("setup-required");
    expect(readiness.surfaces).toHaveLength(6);
  });

  it("reports ready when every provider surface is live and validation passes", () => {
    const readiness = buildProviderIntegrationReadiness(validationFixture());

    expect(readiness.state).toBe("ready");
    expect(readiness.readiness).toBe(100);
    expect(readiness.counts.ready).toBe(12);
    expect(readiness.counts.blocked).toBe(0);
  });

  it("promotes preview status when any validated provider surface is preview-only", () => {
    const readiness = buildProviderIntegrationReadiness(
      validationFixture({
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
      })
    );

    expect(readiness.state).toBe("preview");
    expect(readiness.statusLabel).toBe("Preview");
    expect(readiness.surfaces.find((surface) => surface.surface === "mcp")?.sourceLabel).toBe(
      "Provider preview"
    );
  });

  it("uses blocked only for validation failures", () => {
    const readiness = buildProviderIntegrationReadiness(
      validationFixture({
        command: {
          pass: false,
          readiness: 0,
          state: "blocked",
          summary: {
            total: 2,
            live: 1,
            preview: 1,
            unsupported: 0,
            unavailable: 0,
            executable: 2,
            blocked: 0,
            availability: 1
          }
        }
      })
    );

    expect(readiness.state).toBe("blocked");
    expect(readiness.counts.blocked).toBe(1);
    expect(readiness.surfaces[0].statusLabel).toBe("Blocked");
    expect(readiness.surfaces[0].nextAction).toContain("validation inconsistencies");
  });
});
