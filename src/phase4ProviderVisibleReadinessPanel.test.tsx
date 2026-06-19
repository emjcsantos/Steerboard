import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Phase4ProviderBlockerPriorityPanel,
  Phase4ProviderSurfaceDepthPanel,
  Phase4ProviderTraceabilityPanel,
  ProviderIntegrationReadinessPanel
} from "./App";
import {
  buildCatalogRefreshOwnerValidation,
  type CatalogRefreshOwnerValidationResult,
  type CatalogRefreshOwnerValidationSurfaceResult,
  type CatalogSurface
} from "./catalogRefreshOwnerValidation";
import {
  createPhase4ProviderApprovalRecord,
  derivePhase4ProviderApprovalRecordValidation
} from "./phase4ProviderApprovalRecord";
import {
  createPhase4ProviderAuditRecord,
  derivePhase4ProviderAuditRecordValidation
} from "./phase4ProviderAuditRecord";
import {
  createPhase4ProviderRollbackRecord,
  derivePhase4ProviderRollbackRecordValidation
} from "./phase4ProviderRollbackRecord";
import {
  createPhase4ProviderPermissionRecord,
  derivePhase4ProviderPermissionRecordValidation,
  EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES
} from "./phase4ProviderPermissionRecord";
import { buildPhase4ProviderCatalogDepth } from "./phase4ProviderCatalogDepth";
import { buildPhase4ProviderBlockerPriority } from "./phase4ProviderBlockerPriority";
import {
  buildPhase4ProviderReviewArtifact,
  verifyPhase4ProviderReviewArtifact
} from "./phase4ProviderReviewArtifact";
import { buildPhase4ProviderSurfaceDepth } from "./phase4ProviderSurfaceDepth";
import { buildPhase4ProviderTraceabilitySummary } from "./phase4ProviderTraceability";
import type { Phase4RefreshSafetyDepthSummary } from "./phase4RefreshSafetyDepth";
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

const readyRefreshSafety: Phase4RefreshSafetyDepthSummary = {
  id: "phase-4-refresh-safety-depth",
  label: "Phase 4 refresh safety depth",
  records: [],
  readyCount: 7,
  previewCount: 0,
  blockedCount: 0,
  nextAction: "Keep refresh safety attached.",
  ariaLabel: "Refresh safety ready."
};

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

  it("renders approval record actions and evidence keys without provider execution", () => {
    const readiness = buildProviderIntegrationReadiness(validationFixture());
    const record = createPhase4ProviderApprovalRecord({
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:00:00.000Z"
    });
    const approvalValidation = derivePhase4ProviderApprovalRecordValidation({
      record,
      expectedCatalogFingerprint: "phase4-catalog-current",
      refreshSafety: readyRefreshSafety,
      options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
    });
    const auditRecord = createPhase4ProviderAuditRecord({
      approvalRecord: record,
      auditEvidenceFingerprint: "phase4-provider-audit-current",
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:10:00.000Z"
    });
    const auditValidation = derivePhase4ProviderAuditRecordValidation({
      record: auditRecord,
      approvalRecord: record,
      approvalValidation,
      expectedAuditEvidenceFingerprint: "phase4-provider-audit-current",
      expectedCatalogFingerprint: "phase4-catalog-current",
      options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
    });
    const rollbackRecord = createPhase4ProviderRollbackRecord({
      approvalRecord: record,
      auditRecord,
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:20:00.000Z",
      surfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current"
    });
    const rollbackValidation = derivePhase4ProviderRollbackRecordValidation({
      record: rollbackRecord,
      approvalRecord: record,
      auditRecord,
      auditValidation,
      expectedCatalogFingerprint: "phase4-catalog-current",
      expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
      options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
    });
    const permissionRecord = createPhase4ProviderPermissionRecord({
      approvalRecord: record,
      auditRecord,
      rollbackRecord,
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:30:00.000Z",
      surfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
      permissionEvidenceFingerprint: "phase4-provider-permission-current",
      providerSurfaceScopes: EXPECTED_PHASE4_PROVIDER_PERMISSION_SURFACES
    });
    const permissionValidation = derivePhase4ProviderPermissionRecordValidation({
      record: permissionRecord,
      approvalRecord: record,
      auditRecord,
      rollbackRecord,
      rollbackValidation,
      expectedCatalogFingerprint: "phase4-catalog-current",
      expectedSurfaceDepthEvidenceFingerprint: "phase4-provider-rollback-current",
      expectedPermissionEvidenceFingerprint: "phase4-provider-permission-current",
      options: { evaluatedAt: "2026-06-18T10:35:00.000Z" }
    });
    const surfaceDepth = buildPhase4ProviderSurfaceDepth(
      readiness,
      approvalValidation,
      auditValidation,
      rollbackValidation,
      permissionValidation
    );
    const catalogDepth = buildPhase4ProviderCatalogDepth(readiness);
    const traceability = buildPhase4ProviderTraceabilitySummary({
      catalogDepth,
      refreshSafety: readyRefreshSafety,
      surfaceDepth
    });
    const blockerPriority = buildPhase4ProviderBlockerPriority({
      catalogDepth,
      refreshSafety: readyRefreshSafety,
      surfaceDepth,
      traceability
    });
    const reviewArtifactVerification = verifyPhase4ProviderReviewArtifact(
      buildPhase4ProviderReviewArtifact({
        exportedAt: "2026-06-18T10:35:00.000Z",
        evaluatedAt: "2026-06-18T10:35:00.000Z",
        currentCatalogFingerprint: "phase4-catalog-current",
        catalogDepth,
        refreshSafety: readyRefreshSafety,
        surfaceDepth,
        traceability,
        blockerPriority,
        approvalRecord: record,
        approvalValidation,
        auditRecord,
        auditValidation,
        rollbackRecord,
        rollbackValidation,
        permissionRecord,
        permissionValidation
      }),
      {
        verifiedAt: "2026-06-18T10:35:00.000Z",
        expectedCatalogFingerprint: "phase4-catalog-current"
      }
    );
    const html = renderToStaticMarkup(
      <>
        <Phase4ProviderSurfaceDepthPanel
          approvalValidation={approvalValidation}
          auditRecord={auditRecord}
          auditValidation={auditValidation}
          importedReviewArtifactVerification={{
            ...reviewArtifactVerification,
            detail: "Imported Phase 4 provider review artifact is held for owner review."
          }}
          onClearApproval={() => undefined}
          onClearAudit={() => undefined}
          onClearPermission={() => undefined}
          onClearRollback={() => undefined}
          onExportReviewArtifact={() => undefined}
          onRecordApproval={() => undefined}
          onRecordAudit={() => undefined}
          onRecordPermission={() => undefined}
          onRecordRollback={() => undefined}
          onVerifyImportedReviewArtifact={() => undefined}
          permissionRecord={permissionRecord}
          permissionValidation={permissionValidation}
          record={record}
          reviewArtifactVerification={reviewArtifactVerification}
          rollbackRecord={rollbackRecord}
          rollbackValidation={rollbackValidation}
          snapshot={surfaceDepth}
        />
        <Phase4ProviderTraceabilityPanel summary={traceability} />
        <Phase4ProviderBlockerPriorityPanel summary={blockerPriority} />
      </>
    );

    expect(html).toContain("Phase 4 Surface Depth");
    expect(html).toContain("Phase 4 Traceability");
    expect(html).toContain("Phase 4 Blocker Priority");
    expect(html).toContain("Approval record");
    expect(html).toContain("Audit record");
    expect(html).toContain("Rollback record");
    expect(html).toContain("Permission record");
    expect(html).toContain("Provider review artifact");
    expect(html).toContain("Imported provider review");
    expect(html).toContain("Catalog fingerprint");
    expect(html).toContain("phase4-catalog-current");
    expect(html).toContain("matched");
    expect(html).toContain("Phase 4 provider review artifact is missing refresh-safety records");
    expect(html).toContain("Attach metadata-only refresh-safety proof before exporting");
    expect(html).toContain("Export review");
    expect(html).toContain("Import review");
    expect(html).toContain("Record approval");
    expect(html).toContain("Clear approval");
    expect(html).toContain("Record audit");
    expect(html).toContain("Clear audit");
    expect(html).toContain("Record rollback");
    expect(html).toContain("Clear rollback");
    expect(html).toContain("Record permission");
    expect(html).toContain("Clear permission");
    expect(html).toContain("phase-04-surface-depth:approval-gate");
    expect(html).toContain("phase-04-surface-depth:audit-gate");
    expect(html).toContain("phase-04-surface-depth:rollback-gate");
    expect(html).toContain("phase-04-surface-depth:permission-gate");
    expect(html).toContain("phase-04-traceability:active-goal");
    expect(html).toContain("Phase 4 provider blocker priority");
    expect(html).toContain("Remaining goal link");
    expect(html).toContain("phase4-provider-permission-current");
    expect(html).toContain("PM Links");
    expect(html).toContain("Smoke");
    expect(html).toContain("Permission gate");
    expect(html).toContain("Execution lock");
    expect(html).toContain("does not execute commands");
    expect(html).toContain("without running provider actions");
    expect(html).toContain("metadata-only");
    expect(traceability.canTrustProviderReview).toBe(false);
    expect(traceability.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "active-goal", status: "preview" })
      ])
    );
    expect(blockerPriority.state).toBe("preview");
    expect(reviewArtifactVerification).toMatchObject({
      state: "review",
      executionLocked: true
    });
  });
});
