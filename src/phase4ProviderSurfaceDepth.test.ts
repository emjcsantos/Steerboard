import { describe, expect, it } from "vitest";
import {
  buildCatalogRefreshOwnerValidation,
  type CatalogRefreshOwnerValidationResult,
  type CatalogRefreshOwnerValidationSurfaceResult,
  type CatalogSurface
} from "./catalogRefreshOwnerValidation";
import { buildPhase4ProviderSurfaceDepth } from "./phase4ProviderSurfaceDepth";
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
  const pass = surfaceResults.every((surface) => surface.pass);

  return {
    safety: "Catalog refresh validation is metadata/status-only.",
    pass,
    readiness: pass ? 100 : 0,
    state: pass ? "ready" : "blocked",
    surfaces: surfaceResults
  };
}

function depthFromValidation(validation: CatalogRefreshOwnerValidationResult) {
  return buildPhase4ProviderSurfaceDepth(buildProviderIntegrationReadiness(validation));
}

describe("phase 4 provider surface depth", () => {
  it("keeps default fallback catalogs in setup-required review with execution locked", () => {
    const depth = depthFromValidation(buildCatalogRefreshOwnerValidation());

    expect(depth.state).toBe("setup-required");
    expect(depth.canEnableExecution).toBe(false);
    expect(depth.attentionCount).toBeGreaterThan(0);
    expect(depth.nextAction).toContain("setup-required");
    expect(depth.safety).toContain("metadata-only");
    expect(depth.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Setup blockers", status: "setup-required" }),
        expect.objectContaining({ label: "Execution lock", status: "preview" })
      ])
    );
  });

  it("reports metadata-ready depth as execution-held while provider execution is locked", () => {
    const depth = depthFromValidation(validationFixture());

    expect(depth.state).toBe("preview");
    expect(depth.readiness).toBe(94);
    expect(depth.canEnableExecution).toBe(false);
    expect(depth.attentionCount).toBe(1);
    expect(depth.previewCount).toBe(1);
    expect(depth.nextSurfaceLabel).toBe("Execution lock");
    expect(depth.nextAction).toContain("metadata review separate from execution readiness");
    expect(depth.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Execution lock", status: "preview" })
      ])
    );
  });

  it("surfaces preview rows as a separate owner-review hold", () => {
    const depth = depthFromValidation(
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

    expect(depth.state).toBe("preview");
    expect(depth.previewCount).toBe(2);
    expect(depth.nextSurfaceLabel).toBe("MCP");
    expect(depth.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Preview review", status: "preview" })
      ])
    );
  });

  it("blocks depth when provider validation has inconsistencies", () => {
    const depth = depthFromValidation(
      validationFixture({
        command: {
          pass: false,
          readiness: 0,
          state: "blocked",
          summary: {
            total: 2,
            live: 1,
            preview: 1,
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

    expect(depth.state).toBe("blocked");
    expect(depth.heldCount).toBe(1);
    expect(depth.canEnableExecution).toBe(false);
    expect(depth.nextAction).toContain("validation inconsistencies");
  });
});
