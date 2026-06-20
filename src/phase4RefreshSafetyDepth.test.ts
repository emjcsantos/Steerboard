import { describe, expect, it } from "vitest";
import {
  buildCatalogRefreshProviderFingerprint,
  buildCatalogRefreshProviderSmoke,
  CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW
} from "./catalogRefreshProviderSmoke";
import { buildPhase4RefreshSafetyDepth } from "./phase4RefreshSafetyDepth";

const snapshotPayloads = {
  commandCatalogSnapshot: {
    source: "default-fallback",
    entries: [
      {
        command: "/alpha",
        label: "Alpha Command",
        detail: "Primary command snapshot.",
        state: "live",
        scopes: ["panel"]
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
      }
    ]
  }
} as const;

describe("phase 4 refresh safety depth", () => {
  it("keeps not-run catalog smoke as preview while preserving safety locks", () => {
    const depth = buildPhase4RefreshSafetyDepth(CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW);

    expect(depth.previewCount).toBeGreaterThan(0);
    expect(depth.blockedCount).toBe(0);
    expect(depth.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "run-state",
          status: "preview"
        }),
        expect.objectContaining({
          kind: "metadata-only-contract",
          status: "ready"
        }),
        expect.objectContaining({
          kind: "execution-lock",
          status: "ready"
        })
      ])
    );
    expect(depth.refreshSmokeProof).toContain("surfaces=6/6 executed=0/6");
    expect(depth.refreshSmokeProof).toContain("metadataOnly=locked execution=locked");
    expect(depth.nextAction).toContain("explicit owner action");
  });

  it("marks refresh safety ready after six metadata-only surfaces validate", () => {
    const depth = buildPhase4RefreshSafetyDepth(
      buildCatalogRefreshProviderSmoke(snapshotPayloads, {
        checkedAt: "2026-06-18T00:00:00.000Z"
      }),
      {
        evaluatedAt: "2026-06-18T12:00:00.000Z",
        expectedCatalogFingerprint: buildCatalogRefreshProviderFingerprint(snapshotPayloads)
      }
    );

    expect(depth.readyCount).toBe(8);
    expect(depth.previewCount).toBe(0);
    expect(depth.blockedCount).toBe(0);
    expect(depth.records.every((record) => record.status === "ready")).toBe(true);
    expect(depth.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "surface-order",
          evidence: expect.stringContaining("6/6 catalog surfaces")
        }),
        expect.objectContaining({
          kind: "validation-result",
          evidence: expect.stringContaining("without executing")
        }),
        expect.objectContaining({
          kind: "proof-freshness",
          status: "ready",
          evidence: expect.stringContaining("2026-06-18T00:00:00.000Z")
        }),
        expect.objectContaining({
          kind: "catalog-fingerprint",
          status: "ready",
          evidence: expect.stringContaining("matches")
        }),
        expect.objectContaining({
          kind: "reload-safe-proof",
          status: "ready",
          evidence: expect.stringContaining("six-surface metadata-only chain")
        })
      ])
    );
    expect(depth.refreshSmokeProof).toContain("surfaces=6/6 executed=6/6");
    expect(depth.refreshSmokeProof).toContain("checkedAt=2026-06-18T00:00:00.000Z");
    expect(depth.refreshSmokeProof).toContain(
      `catalog=${buildCatalogRefreshProviderFingerprint(snapshotPayloads)}`
    );
    expect(depth.refreshSmokeProof).toContain("metadataOnly=locked execution=locked");
  });

  it("marks catalog smoke proof as preview when the fingerprint no longer matches", () => {
    const depth = buildPhase4RefreshSafetyDepth(
      buildCatalogRefreshProviderSmoke(snapshotPayloads, {
        checkedAt: "2026-06-18T00:00:00.000Z"
      }),
      {
        evaluatedAt: "2026-06-18T12:00:00.000Z",
        expectedCatalogFingerprint: "phase4-catalog:different"
      }
    );

    expect(depth.previewCount).toBe(2);
    expect(depth.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "catalog-fingerprint",
          status: "preview",
          evidence: expect.stringContaining("does not match"),
          nextAction: expect.stringContaining("Rerun catalog smoke")
        }),
        expect.objectContaining({
          kind: "reload-safe-proof",
          status: "preview",
          evidence: expect.stringContaining("does not match")
        })
      ])
    );
  });

  it("marks executed catalog smoke proof as preview when stale", () => {
    const depth = buildPhase4RefreshSafetyDepth(
      buildCatalogRefreshProviderSmoke(snapshotPayloads, {
        checkedAt: "2026-06-10T00:00:00.000Z"
      }),
      {
        evaluatedAt: "2026-06-18T00:00:00.000Z",
        maxProofAgeMs: 24 * 60 * 60 * 1000
      }
    );

    expect(depth.previewCount).toBe(1);
    expect(depth.blockedCount).toBe(0);
    expect(depth.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "proof-freshness",
          status: "preview",
          evidence: expect.stringContaining("stale"),
          nextAction: expect.stringContaining("Rerun catalog smoke")
        })
      ])
    );
  });

  it("marks executed legacy catalog smoke proof as preview when timestamp is missing", () => {
    const depth = buildPhase4RefreshSafetyDepth(
      buildCatalogRefreshProviderSmoke(snapshotPayloads),
      {
        evaluatedAt: "2026-06-18T00:00:00.000Z"
      }
    );

    expect(depth.previewCount).toBe(2);
    expect(depth.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "proof-freshness",
          status: "preview",
          evidence: expect.stringContaining("no valid checkedAt")
        }),
        expect.objectContaining({
          kind: "reload-safe-proof",
          status: "preview",
          evidence: expect.stringContaining("checkedAt timestamp")
        })
      ])
    );
  });

  it("blocks refresh safety when validation fails but keeps execution lock ready", () => {
    const smoke = buildCatalogRefreshProviderSmoke(snapshotPayloads, {
      validationOverride: {
        safety: "Catalog refresh validation is metadata/status-only and must not execute commands, skills, plugins, MCP tools, automations, personalization/profile mutations, terminal actions, Git operations, or external actions.",
        pass: false,
        readiness: 0,
        state: "blocked",
        surfaces: buildCatalogRefreshProviderSmoke(snapshotPayloads).surfaces.map((surface) => ({
          surface: surface.surface,
          source: surface.source,
          total: surface.total,
          readiness: surface.surface === "mcp" ? 0 : 100,
          state: surface.surface === "mcp" ? "blocked" : "ready",
          pass: surface.surface !== "mcp",
          itemOrder: [],
          metadataProof: [],
          safety: surface.safety,
          summary: {
            total: surface.total,
            live: surface.total,
            preview: 0,
            disconnected: 0,
            setupRequired: 0,
            unsupported: 0,
            unavailable: 0,
            actionable: surface.total,
            availability: 1
          }
        }))
      }
    });
    const depth = buildPhase4RefreshSafetyDepth(smoke);

    expect(depth.blockedCount).toBe(3);
    expect(depth.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "validation-result",
          status: "blocked"
        }),
        expect.objectContaining({
          kind: "execution-lock",
          status: "ready"
        }),
        expect.objectContaining({
          kind: "reload-safe-proof",
          status: "blocked"
        })
      ])
    );
  });

  it("keeps refresh safety text public-safe", () => {
    const depth = buildPhase4RefreshSafetyDepth(
      buildCatalogRefreshProviderSmoke(snapshotPayloads)
    );
    const combinedText = [
      depth.label,
      depth.ariaLabel,
      depth.nextAction,
      ...depth.records.flatMap((record) => [
        record.label,
        record.kind,
        record.statusLabel,
        record.evidence,
        record.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
