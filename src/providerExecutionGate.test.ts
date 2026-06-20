import { describe, expect, it } from "vitest";
import {
  buildCatalogRefreshOwnerValidation,
  type CatalogRefreshOwnerValidationResult,
  type CatalogRefreshOwnerValidationSurfaceResult,
  type CatalogSurface
} from "./catalogRefreshOwnerValidation";
import { buildProviderExecutionGate } from "./providerExecutionGate";
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
    metadataProof: [`${surface}:metadata-one`, `${surface}:metadata-two`],
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
  overrides: Partial<Record<CatalogSurface, Partial<CatalogRefreshOwnerValidationSurfaceResult>>> = {}
): CatalogRefreshOwnerValidationResult {
  const results = surfaces.map((surface) => surfaceFixture(surface, overrides[surface]));

  return {
    safety: "Catalog refresh validation is metadata/status-only.",
    pass: results.every((item) => item.pass),
    readiness: 100,
    state: "ready",
    surfaces: results
  };
}

describe("provider execution gate", () => {
  it("keeps fallback provider execution blocked without running actions", () => {
    const gate = buildProviderExecutionGate(
      buildProviderIntegrationReadiness(buildCatalogRefreshOwnerValidation())
    );

    expect(gate).toMatchObject({
      state: "blocked",
      canRequestExecution: false,
      providerSupportedCount: 0,
      approvalRecordedCount: 0,
      requiredSurfaceCount: 4
    });
    expect(gate.safety).toContain("does not invoke");
    expect(gate.executionGateProof).toContain("canRequest=no");
    expect(gate.executionGateProof).toContain("support=0/4");
    expect(gate.executionGateProof).toContain("approval=0/4");
  });

  it("requires explicit approval after provider-live support is proven", () => {
    const gate = buildProviderExecutionGate(
      buildProviderIntegrationReadiness(validationFixture())
    );

    expect(gate).toMatchObject({
      state: "review",
      canRequestExecution: false,
      providerSupportedCount: 4,
      approvalRecordedCount: 0,
      reviewCount: 4
    });
    expect(gate.nextAction).toContain("Record explicit owner approval");
    expect(gate.executionGateProof).toContain("support=4/4");
    expect(gate.executionGateProof).toContain("approval=0/4");
  });

  it("marks execution request readiness only when support and approval are explicit", () => {
    const gate = buildProviderExecutionGate(
      buildProviderIntegrationReadiness(validationFixture()),
      {
        skill: true,
        plugin: true,
        mcp: true,
        automation: true
      }
    );

    expect(gate).toMatchObject({
      state: "ready",
      readiness: 100,
      canRequestExecution: true,
      providerSupportedCount: 4,
      approvalRecordedCount: 4,
      readyCount: 4
    });
    expect(gate.executionGateProof).toContain("canRequest=yes");
    expect(gate.executionGateProof).toContain("skill:ready:support=yes:approval=yes");
    expect(gate.executionGateProof).toContain("automation:ready:support=yes:approval=yes");
  });

  it("blocks contradicted provider support even when approval evidence is present", () => {
    const gate = buildProviderExecutionGate(
      buildProviderIntegrationReadiness(
        validationFixture({
          mcp: {
            pass: false,
            state: "blocked",
            readiness: 0,
            summary: {
              total: 1,
              live: 0,
              preview: 0,
              disconnected: 0,
              setupRequired: 0,
              unsupported: 0,
              unavailable: 0,
              actionable: 0,
              availability: 0
            }
          }
        })
      ),
      {
        skill: true,
        plugin: true,
        mcp: true,
        automation: true
      }
    );

    expect(gate).toMatchObject({
      state: "blocked",
      canRequestExecution: false,
      providerSupportedCount: 3,
      approvalRecordedCount: 4
    });
    expect(gate.items.find((item) => item.surface === "mcp")).toMatchObject({
      state: "blocked",
      providerSupported: false,
      approvalRecorded: true
    });
  });
});
