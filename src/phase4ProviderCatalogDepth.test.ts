import { describe, expect, it } from "vitest";
import {
  buildCatalogRefreshOwnerValidation,
  type CatalogRefreshOwnerValidationResult,
  type CatalogRefreshOwnerValidationSurfaceResult,
  type CatalogSurface
} from "./catalogRefreshOwnerValidation";
import { buildProviderIntegrationReadiness } from "./providerIntegrationReadiness";
import { buildPhase4ProviderCatalogDepth } from "./phase4ProviderCatalogDepth";

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
    metadataProof: [`${surface}:metadata-proof-one`, `${surface}:metadata-proof-two`],
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
  return buildPhase4ProviderCatalogDepth(buildProviderIntegrationReadiness(validation));
}

describe("phase 4 provider catalog depth", () => {
  it("builds one metadata-only depth record for each provider catalog surface", () => {
    const depth = depthFromValidation(buildCatalogRefreshOwnerValidation());

    expect(depth.records.map((record) => record.kind)).toEqual([
      "command",
      "skill",
      "plugin",
      "mcp",
      "automation",
      "personalization"
    ]);
    expect(depth.executionLockCount).toBe(6);
    expect(depth.catalogDepthProof).toContain("records=6/6");
    expect(depth.catalogDepthProof).toContain("locks=6/6");
    expect(depth.catalogDepthProof).toContain("metadataProof=6/6");
    expect(depth.catalogDepthProof).toContain("scopedExecution=6/6");
    expect(depth.catalogDepthProof).toContain("ownerSafe=6/6");
    expect(depth.catalogDepthProof).toContain(
      "kindOrder=command|skill|plugin|mcp|automation|personalization"
    );
    expect(depth.catalogDepthProof).toContain("metadataOnly=locked execution=locked");
    expect(depth.commandSkillProof).toContain("commandEvidence=phase-04-provider-catalog:command");
    expect(depth.commandSkillProof).toContain("skillEvidence=phase-04-provider-catalog:skill");
    expect(depth.commandSkillProof).toContain("commandItemOrder=present");
    expect(depth.commandSkillProof).toContain("skillItemOrder=present");
    expect(depth.commandSkillProof).toContain("commandMetadata=present skillMetadata=present");
    expect(depth.commandSkillProof).toContain("commandSource=present skillSource=present");
    expect(depth.commandSkillProof).toContain("commandScopeProof=present");
    expect(depth.commandSkillProof).toContain("skillInvocationProof=present");
    expect(depth.commandSkillProof).toContain("commandLock=locked skillLock=locked");
    expect(depth.pluginMcpProof).toContain("pluginEvidence=phase-04-provider-catalog:plugin");
    expect(depth.pluginMcpProof).toContain("mcpEvidence=phase-04-provider-catalog:mcp");
    expect(depth.pluginMcpProof).toContain("pluginItemOrder=present");
    expect(depth.pluginMcpProof).toContain("mcpItemOrder=present");
    expect(depth.pluginMcpProof).toContain("pluginMetadata=present mcpMetadata=present");
    expect(depth.pluginMcpProof).toContain("pluginSource=present mcpSource=present");
    expect(depth.pluginMcpProof).toContain("pluginSurfaceProof=present");
    expect(depth.pluginMcpProof).toContain("mcpToolPolicyProof=present");
    expect(depth.pluginMcpProof).toContain("metadataOnlySurface=present");
    expect(depth.pluginMcpProof).toContain("mcpTransport=present mcpToolPolicy=present");
    expect(depth.pluginMcpProof).toContain("pluginLock=locked mcpLock=locked");
    expect(depth.records.every((record) => record.executionLocked)).toBe(true);
    expect(depth.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "command",
          evidenceKey: "phase-04-provider-catalog:command",
          evidence: expect.stringMatching(/scope labels.*Catalog item order/),
          scopedExecutionProof: expect.stringMatching(/commandScopeProof=.*scopes=.*execution=locked/),
          ownerSafeProof: expect.stringContaining("scoped slash-command labels")
        }),
        expect.objectContaining({
          kind: "skill",
          evidenceKey: "phase-04-provider-catalog:skill",
          scopedExecutionProof: expect.stringMatching(/skillInvocationProof=.*source=.*trigger=.*invocation=.*execution=locked/),
          ownerSafeProof: expect.stringContaining("source, trigger, invocation metadata")
        }),
        expect.objectContaining({
          kind: "plugin",
          evidence: expect.stringContaining("non-mutating readiness evidence"),
          metadataProof: expect.arrayContaining([
            expect.stringContaining("surface=metadata-only")
          ]),
          scopedExecutionProof: expect.stringMatching(
            /pluginSurfaceProof=.*surface=metadata-only.*execution=locked/
          ),
          ownerSafeProof: expect.stringContaining("connection/source metadata"),
          safety: expect.stringContaining("metadata/status-only")
        }),
        expect.objectContaining({
          kind: "mcp",
          evidence: expect.stringContaining("tool policy"),
          metadataProof: expect.arrayContaining([
            expect.stringContaining("transport="),
            expect.stringContaining("toolPolicy=")
          ]),
          scopedExecutionProof: expect.stringMatching(
            /mcpToolPolicyProof=.*transport=.*toolPolicy=.*execution=locked/
          ),
          ownerSafeProof: expect.stringContaining("transport/tool-policy metadata"),
          safety: expect.stringContaining("must not execute")
        }),
        expect.objectContaining({
          kind: "personalization",
          evidence: expect.stringContaining("profile-mutation lock")
        })
      ])
    );
  });

  it("reports ready catalog depth while keeping execution locked", () => {
    const depth = depthFromValidation(validationFixture());

    expect(depth.readyCount).toBe(6);
    expect(depth.previewCount).toBe(0);
    expect(depth.setupRequiredCount).toBe(0);
    expect(depth.heldCount).toBe(0);
    expect(depth.nextAction).toContain("execution locked");
    expect(depth.records.every((record) => record.status === "ready")).toBe(true);
    expect(depth.records.every((record) => record.itemOrder.length === 2)).toBe(true);
    expect(depth.records.every((record) => record.metadataProof.length === 2)).toBe(true);
    expect(depth.catalogDepthProof).toContain(
      "command=ready skill=ready plugin=ready mcp=ready automation=ready personalization=ready"
    );
    expect(depth.commandSkillProof).toContain("command=ready skill=ready");
    expect(depth.pluginMcpProof).toContain("plugin=ready mcp=ready");
  });

  it("keeps preview, setup, and held provider states visible per catalog", () => {
    const depth = depthFromValidation(
      validationFixture({
        skill: {
          summary: {
            total: 2,
            live: 1,
            preview: 0,
            disconnected: 1,
            setupRequired: 0,
            unsupported: 0,
            unavailable: 0,
            actionable: 2,
            availability: 0.5
          }
        },
        plugin: {
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
        },
        automation: {
          source: "unavailable",
          total: 0,
          summary: {
            total: 0,
            live: 0,
            preview: 0,
            disconnected: 0,
            setupRequired: 0,
            unsupported: 0,
            unavailable: 0,
            actionable: 0,
            needsAttention: 0,
            availability: 0
          }
        }
      })
    );

    expect(depth.previewCount).toBe(1);
    expect(depth.setupRequiredCount).toBe(1);
    expect(depth.heldCount).toBe(1);
    expect(depth.catalogDepthProof).toContain("skill=setup-required");
    expect(depth.catalogDepthProof).toContain("plugin=preview");
    expect(depth.catalogDepthProof).toContain("automation=unavailable");
    expect(depth.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "skill", status: "setup-required" }),
        expect.objectContaining({ kind: "plugin", status: "preview" }),
        expect.objectContaining({ kind: "automation", status: "unavailable" })
      ])
    );
  });

  it("keeps catalog depth text public-safe", () => {
    const depth = depthFromValidation(validationFixture());
    const combinedText = [
      depth.label,
      depth.ariaLabel,
      depth.catalogDepthProof,
      depth.commandSkillProof,
      depth.pluginMcpProof,
      depth.nextAction,
      ...depth.records.flatMap((record) => [
        record.label,
        record.kind,
        record.statusLabel,
        record.sourceLabel,
        record.evidenceKey,
        record.metadataProof.join(" "),
        record.scopedExecutionProof,
        record.evidence,
        record.ownerSafeProof,
        record.safety,
        record.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
