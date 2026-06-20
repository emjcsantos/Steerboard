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
import { buildPhase4ProviderCatalogDepth } from "./phase4ProviderCatalogDepth";
import { buildPhase4ProviderSurfaceDepth } from "./phase4ProviderSurfaceDepth";
import { buildPhase4ProviderTraceabilitySummary } from "./phase4ProviderTraceability";
import { buildPhase4RefreshSafetyDepth } from "./phase4RefreshSafetyDepth";
import { currentProjectManagementPhasePlanTaskIds } from "./projectManagementPhasePlan";
import { buildProviderIntegrationReadiness } from "./providerIntegrationReadiness";
import { remainingGoalPlan } from "./remainingGoalPlan";

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

function traceability({
  validation = validationFixture(),
  refreshSafety = buildPhase4RefreshSafetyDepth(buildCatalogRefreshProviderSmoke(snapshotPayloads)),
  goals = remainingGoalPlan
}: {
  validation?: CatalogRefreshOwnerValidationResult;
  refreshSafety?: ReturnType<typeof buildPhase4RefreshSafetyDepth>;
  goals?: typeof remainingGoalPlan;
} = {}) {
  const readiness = buildProviderIntegrationReadiness(validation);

  return buildPhase4ProviderTraceabilitySummary({
    catalogDepth: buildPhase4ProviderCatalogDepth(readiness),
    refreshSafety,
    surfaceDepth: buildPhase4ProviderSurfaceDepth(readiness),
    goals
  });
}

function withCurrentNextPhase4Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-4-provider-surfaces"
      ? { ...goal, status: "next" as const, current: true }
      : goal
  );
}

function withDuplicateCurrentActivePhase4Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-3-proof-clearance"
      ? { ...goal, status: "active" as const, current: true }
      : goal
  );
}

describe("phase 4 provider traceability", () => {
  it("links the Phase 4 remaining goal, PM rows, depth records, refresh safety, and execution locks", () => {
    const summary = traceability();

    expect(summary.state).toBe("preview");
    expect(summary.canTrustProviderReview).toBe(false);
    expect(summary.linkedGoalId).toBe("goal-phase-4-provider-surfaces");
    expect(summary.missingPmTaskIds).toEqual([]);
    expect(summary.linkedPmTaskCount).toBe(16);
    expect(summary.catalogDepthRecordCount).toBe(6);
    expect(summary.refreshSafetyRecordCount).toBe(8);
    expect(summary.surfaceDepthItemCount).toBe(9);
    expect(summary.executionLockCount).toBe(6);
    expect(summary.traceabilityProof).toContain("items=7/7");
    expect(summary.traceabilityProof).toContain(
      "itemKinds=active-goal|pm-coverage|catalog-depth|refresh-safety|surface-depth|record-chain|execution-lock"
    );
    expect(summary.traceabilityProof).toContain("activeGoal=goal-phase-4-provider-surfaces");
    expect(summary.traceabilityProof).toContain("pmLinks=16/16 missingPm=0");
    expect(summary.traceabilityProof).toContain("catalogRecords=6/6 refreshRecords=8/8 surfaceItems=9/9");
    expect(summary.traceabilityProof).toContain("executionLocks=6/6 trust=review");
    expect(summary.traceabilityProof).toContain("metadataOnly=locked execution=locked");
    expect(summary.nextAction).toContain("single current active remaining goal");
    expect(summary.nextAction).toContain("goal-phase-8-permission-audit");
    expect(summary.items.map((item) => item.kind)).toEqual([
      "active-goal",
      "pm-coverage",
      "catalog-depth",
      "refresh-safety",
      "surface-depth",
      "record-chain",
      "execution-lock"
    ]);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "active-goal",
          status: "preview",
          detail: expect.stringContaining("1 current active goal")
        }),
        expect.objectContaining({ kind: "surface-depth", status: "preview" }),
        expect.objectContaining({
          kind: "record-chain",
          status: "preview",
          detail: expect.stringContaining("0/4 local approval, audit, rollback, and permission record gates are ready")
        }),
        expect.objectContaining({
          kind: "record-chain",
          detail: expect.stringContaining(
            "Record-chain proof: ownerBoundary=review approvalChain=review auditChain=review rollbackChain=review permissionChain=review metadataOnly=present execution=present"
          )
        }),
        expect.objectContaining({ kind: "execution-lock", status: "ready" })
      ])
    );
  });

  it("holds provider traceability in preview while refresh smoke has not run", () => {
    const summary = traceability({
      refreshSafety: buildPhase4RefreshSafetyDepth(CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW)
    });

    expect(summary.state).toBe("preview");
    expect(summary.canTrustProviderReview).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "refresh-safety", status: "preview" })
      ])
    );
  });

  it("does not trust provider review when Phase 4 is current but still next", () => {
    const summary = traceability({ goals: withCurrentNextPhase4Goal() });

    expect(summary.state).toBe("preview");
    expect(summary.canTrustProviderReview).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "active-goal", status: "preview" })
      ])
    );
  });

  it("does not trust provider review when Phase 4 duplicates the current active goal", () => {
    const summary = traceability({ goals: withDuplicateCurrentActivePhase4Goal() });

    expect(summary.state).toBe("preview");
    expect(summary.canTrustProviderReview).toBe(false);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "active-goal",
          status: "preview",
          detail: expect.stringContaining("2 current active goals"),
          nextAction: expect.stringContaining("exactly one current active remaining goal")
        })
      ])
    );
  });

  it("blocks when the Phase 4 goal misses the traceability PM child link", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-4-provider-surfaces"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter((taskId) => taskId !== "phase-04-child-traceability")
          }
        : goal
    );
    const summary = traceability({ goals });

    expect(summary.state).toBe("blocked");
    expect(summary.canTrustProviderReview).toBe(false);
    expect(summary.missingPmTaskIds).toEqual(["phase-04-child-traceability"]);
  });

  it("blocks when the Phase 4 goal misses the blocker-priority PM child link", () => {
    const goals = remainingGoalPlan.map((goal) =>
      goal.id === "goal-phase-4-provider-surfaces"
        ? {
            ...goal,
            pmTaskIds: goal.pmTaskIds.filter(
              (taskId) => taskId !== "phase-04-child-blocker-priority"
            )
          }
        : goal
    );
    const summary = traceability({ goals });

    expect(summary.state).toBe("blocked");
    expect(summary.canTrustProviderReview).toBe(false);
    expect(summary.missingPmTaskIds).toEqual(["phase-04-child-blocker-priority"]);
  });

  it("blocks when a required Phase 4 PM row is missing from the current board plan", () => {
    currentProjectManagementPhasePlanTaskIds.delete("phase-04-child-blocker-priority");

    try {
      const summary = traceability();

      expect(summary.state).toBe("blocked");
      expect(summary.canTrustProviderReview).toBe(false);
      expect(summary.missingPmTaskIds).toEqual(["phase-04-child-blocker-priority"]);
    } finally {
      currentProjectManagementPhasePlanTaskIds.add("phase-04-child-blocker-priority");
    }
  });

  it("keeps traceability text public-safe", () => {
    const summary = buildPhase4ProviderTraceabilitySummary({
      catalogDepth: buildPhase4ProviderCatalogDepth(
        buildProviderIntegrationReadiness(buildCatalogRefreshOwnerValidation())
      ),
      refreshSafety: buildPhase4RefreshSafetyDepth(CATALOG_REFRESH_PROVIDER_SMOKE_NOT_RUN_PREVIEW),
      surfaceDepth: buildPhase4ProviderSurfaceDepth(
        buildProviderIntegrationReadiness(buildCatalogRefreshOwnerValidation())
      )
    });
    const combinedText = [
      summary.label,
      summary.ariaLabel,
      summary.nextAction,
      summary.safety,
      ...summary.items.flatMap((item) => [
        item.label,
        item.kind,
        item.status,
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
