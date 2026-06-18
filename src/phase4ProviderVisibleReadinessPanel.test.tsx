import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProviderIntegrationReadinessPanel } from "./App";
import {
  buildCatalogRefreshOwnerValidation,
  type CatalogRefreshOwnerValidationResult,
  type CatalogRefreshOwnerValidationSurfaceResult,
  type CatalogSurface
} from "./catalogRefreshOwnerValidation";
import { buildPhase4ProviderCatalogDepth } from "./phase4ProviderCatalogDepth";
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

function validationFixture(): CatalogRefreshOwnerValidationResult {
  return {
    safety: "Catalog refresh validation is metadata/status-only.",
    pass: true,
    readiness: 100,
    state: "ready",
    surfaces: surfaces.map((surface) => surfaceFixture(surface))
  };
}

describe("phase 4 provider visible readiness panel", () => {
  it("renders catalog evidence, execution locks, totals, and next actions for owner review", () => {
    const readiness = buildProviderIntegrationReadiness(validationFixture());
    const catalogDepth = buildPhase4ProviderCatalogDepth(readiness);
    const html = renderToStaticMarkup(
      <ProviderIntegrationReadinessPanel catalogDepth={catalogDepth} readiness={readiness} />
    );

    expect(html).toContain("Phase 4 Provider Readiness");
    expect(html).toContain("Provider live");
    expect(html).toContain("2");
    expect(html).toContain("scope labels");
    expect(html).toContain("tool policy");
    expect(html).toContain("profile-mutation lock");
    expect(html).toContain("Keep provider execution locked");
    expect(html).toContain("approval, audit, rollback, and permission gates");
    expect(html).toContain("Source: Provider live");
  });

  it("renders setup-required fallback action text without live provider execution", () => {
    const readiness = buildProviderIntegrationReadiness(buildCatalogRefreshOwnerValidation());
    const catalogDepth = buildPhase4ProviderCatalogDepth(readiness);
    const html = renderToStaticMarkup(
      <ProviderIntegrationReadinessPanel catalogDepth={catalogDepth} readiness={readiness} />
    );

    expect(html).toContain("Setup required");
    expect(html).toContain("Fallback metadata");
    expect(html).toContain("Resolve setup-required or disconnected rows");
    expect(html).toContain("must not execute commands");
  });
});
