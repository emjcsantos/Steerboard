import { afterEach, describe, expect, it, vi } from "vitest";
import type { Phase4RefreshSafetyDepthSummary } from "./phase4RefreshSafetyDepth";
import {
  createPhase4ProviderApprovalRecord,
  derivePhase4ProviderApprovalRecordValidation
} from "./phase4ProviderApprovalRecord";
import {
  createPhase4ProviderAuditRecord,
  derivePhase4ProviderAuditRecordValidation
} from "./phase4ProviderAuditRecord";
import {
  clearPhase4ProviderRollbackRecord,
  createPhase4ProviderRollbackRecord,
  derivePhase4ProviderRollbackRecordValidation,
  loadPhase4ProviderRollbackRecord,
  parseStoredPhase4ProviderRollbackRecord,
  PHASE4_PROVIDER_ROLLBACK_RECORD_STORAGE_KEY,
  savePhase4ProviderRollbackRecord
} from "./phase4ProviderRollbackRecord";

const readyRefreshSafety: Phase4RefreshSafetyDepthSummary = {
  id: "phase-4-refresh-safety-depth",
  label: "Phase 4 refresh safety depth",
  records: [],
  readyCount: 7,
  previewCount: 0,
  blockedCount: 0,
  refreshSmokeProof:
    "surfaces=6/6 executed=6/6 ready=6 preview=0 blocked=0 checkedAt=2026-06-18T00:00:00.000Z catalog=phase4-catalog-current expectedCatalog=phase4-catalog-current metadataOnly=locked execution=locked",
  refreshSafetyDepthProof:
    "records=8/8 ready=7 preview=0 blocked=0 refreshSmoke=present reloadSafe=ready checkedAt=present fingerprint=present command=ready skill=ready plugin=ready mcp=ready automation=ready personalization=ready metadataOnly=locked execution=locked",
  nextAction: "Keep refresh safety attached.",
  ariaLabel: "Refresh safety ready."
};

const approvalRecord = createPhase4ProviderApprovalRecord({
  catalogFingerprint: "phase4-catalog-current",
  createdAt: "2026-06-18T10:00:00.000Z"
});
const approvalValidation = derivePhase4ProviderApprovalRecordValidation({
  record: approvalRecord,
  expectedCatalogFingerprint: "phase4-catalog-current",
  refreshSafety: readyRefreshSafety,
  options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
});
const auditRecord = createPhase4ProviderAuditRecord({
  approvalRecord,
  auditEvidenceFingerprint: "phase4-provider-audit-current",
  catalogFingerprint: "phase4-catalog-current",
  createdAt: "2026-06-18T10:10:00.000Z"
});
const auditValidation = derivePhase4ProviderAuditRecordValidation({
  record: auditRecord,
  approvalRecord,
  approvalValidation,
  expectedAuditEvidenceFingerprint: "phase4-provider-audit-current",
  expectedCatalogFingerprint: "phase4-catalog-current",
  options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
});
const surfaceDepthEvidenceFingerprint = "phase4-provider-rollback-current";

function rollbackRecord() {
  return createPhase4ProviderRollbackRecord({
    approvalRecord,
    auditRecord,
    catalogFingerprint: "phase4-catalog-current",
    createdAt: "2026-06-18T10:20:00.000Z",
    surfaceDepthEvidenceFingerprint
  });
}

describe("phase 4 provider rollback record", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a metadata-only rollback record tied to approval and audit", () => {
    expect(rollbackRecord()).toEqual({
      id: "phase4-provider-rollback:2026-06-18T10:20:00.000Z",
      createdAt: "2026-06-18T10:20:00.000Z",
      state: "ready",
      catalogFingerprint: "phase4-catalog-current",
      approvalRecordId: "phase4-provider-approval:2026-06-18T10:00:00.000Z",
      auditRecordId: "phase4-provider-audit:2026-06-18T10:10:00.000Z",
      auditEvidenceFingerprint: "phase4-provider-audit-current",
      surfaceDepthEvidenceFingerprint,
      rollbackOwner: "Owner",
      rollbackAction:
        "Keep provider execution locked and review rollback evidence before any provider action can run.",
      mutationLocked: true,
      detail:
        "Owner reviewed Phase 4 provider rollback evidence while provider execution remains locked."
    });
  });

  it("validates only fresh records tied to current approval, audit, catalog, and surface evidence", () => {
    expect(
      derivePhase4ProviderRollbackRecordValidation({
        record: rollbackRecord(),
        approvalRecord,
        auditRecord,
        auditValidation,
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
        options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
      })
    ).toMatchObject({
      state: "ready",
      matchesCurrentCatalog: true,
      matchesCurrentApproval: true,
      matchesCurrentAudit: true,
      matchesCurrentAuditEvidence: true,
      matchesCurrentSurfaceDepthEvidence: true,
      mutationLocked: true,
      rollbackChainProof: expect.stringContaining(
        "approvalMatch=matched auditMatch=matched auditEvidenceMatch=matched surfaceMatch=matched owner=present action=present mutation=locked execution=locked"
      ),
      recordAgeMs: 300_000
    });
  });

  it("returns preview when no rollback record is attached", () => {
    expect(
      derivePhase4ProviderRollbackRecordValidation({
        approvalRecord,
        auditRecord,
        auditValidation,
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
        options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
      })
    ).toMatchObject({
      state: "preview",
      detail: expect.stringContaining("not attached"),
      matchesCurrentCatalog: false,
      matchesCurrentApproval: false,
      matchesCurrentAudit: false,
      matchesCurrentAuditEvidence: false,
      matchesCurrentSurfaceDepthEvidence: false,
      mutationLocked: false,
      rollbackChainProof: expect.stringContaining("mutation=review execution=locked")
    });
  });

  it("reviews stale, future-dated, mismatched, and mutation-unlocked rollback records", () => {
    const record = rollbackRecord();

    expect(
      derivePhase4ProviderRollbackRecordValidation({
        record: { ...record, catalogFingerprint: "phase4-catalog-other" },
        approvalRecord,
        auditRecord,
        auditValidation,
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
        options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
      })
    ).toMatchObject({ state: "review", detail: expect.stringContaining("catalog") });
    expect(
      derivePhase4ProviderRollbackRecordValidation({
        record: { ...record, approvalRecordId: "old-approval" },
        approvalRecord,
        auditRecord,
        auditValidation,
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
        options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
      })
    ).toMatchObject({ state: "review", detail: expect.stringContaining("approval") });
    expect(
      derivePhase4ProviderRollbackRecordValidation({
        record: { ...record, auditRecordId: "old-audit" },
        approvalRecord,
        auditRecord,
        auditValidation,
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
        options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
      })
    ).toMatchObject({ state: "review", detail: expect.stringContaining("audit record") });
    expect(
      derivePhase4ProviderRollbackRecordValidation({
        record: { ...record, auditEvidenceFingerprint: "old-audit-evidence" },
        approvalRecord,
        auditRecord,
        auditValidation,
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
        options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
      })
    ).toMatchObject({ state: "review", detail: expect.stringContaining("audit evidence") });
    expect(
      derivePhase4ProviderRollbackRecordValidation({
        record: { ...record, surfaceDepthEvidenceFingerprint: "old-surface" },
        approvalRecord,
        auditRecord,
        auditValidation,
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
        options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
      })
    ).toMatchObject({ state: "review", detail: expect.stringContaining("surface-depth") });
    expect(
      derivePhase4ProviderRollbackRecordValidation({
        record,
        approvalRecord,
        auditRecord,
        auditValidation,
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
        options: {
          evaluatedAt: "2026-06-19T10:20:01.000Z",
          maxRecordAgeMs: 24 * 60 * 60 * 1000
        }
      })
    ).toMatchObject({ state: "review", detail: expect.stringContaining("stale") });
    expect(
      derivePhase4ProviderRollbackRecordValidation({
        record,
        approvalRecord,
        auditRecord,
        auditValidation,
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
        options: { evaluatedAt: "2026-06-18T10:19:00.000Z" }
      })
    ).toMatchObject({ state: "review", detail: expect.stringContaining("future-dated") });
    expect(
      derivePhase4ProviderRollbackRecordValidation({
        record: { ...record, mutationLocked: false },
        approvalRecord,
        auditRecord,
        auditValidation,
        expectedCatalogFingerprint: "phase4-catalog-current",
        expectedSurfaceDepthEvidenceFingerprint: surfaceDepthEvidenceFingerprint,
        options: { evaluatedAt: "2026-06-18T10:25:00.000Z" }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("mutation lock"),
      mutationLocked: false,
      rollbackChainProof: expect.stringContaining("mutation=review execution=locked")
    });
  });

  it("parses public-safe records and rejects malformed storage", () => {
    const parsed = parseStoredPhase4ProviderRollbackRecord(
      JSON.stringify({
        id: " phase4-rollback ",
        createdAt: "2026-06-18T10:20:00.000Z",
        state: "READY",
        catalogFingerprint: "phase4-C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret",
        approvalRecordId: "approval-C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret",
        auditRecordId: "audit-C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret",
        auditEvidenceFingerprint: "audit-evidence-C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret",
        surfaceDepthEvidenceFingerprint: "surface-C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret",
        rollbackOwner: "Owner <unsafe>",
        rollbackAction: "Open C:\\Users\\MJ\\Desktop\\secret.md with token sk-ABCDEF1234567890",
        mutationLocked: true,
        detail: "Rollback C:\\Users\\MJ\\Desktop\\secret.md <unsafe>"
      })
    );

    expect(parsed).toMatchObject({
      id: "phase4-rollback",
      state: "ready",
      catalogFingerprint: "phase4-local path",
      approvalRecordId: "approval-local path",
      auditRecordId: "audit-local path",
      auditEvidenceFingerprint: "audit-evidence-local path",
      surfaceDepthEvidenceFingerprint: "surface-local path",
      rollbackOwner: "Owner unsafe",
      mutationLocked: true
    });
    expect(parsed?.detail).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(parsed?.rollbackAction).not.toContain("sk-ABCDEF1234567890");
    expect(parsed?.rollbackOwner).not.toContain("<");
    expect(parseStoredPhase4ProviderRollbackRecord("{")).toBeUndefined();
    expect(parseStoredPhase4ProviderRollbackRecord(JSON.stringify([]))).toBeUndefined();
  });

  it("saves, loads, and clears through localStorage", () => {
    const store = new Map<string, string>();
    const localStorage = {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      })
    };
    vi.stubGlobal("window", { localStorage });
    const record = rollbackRecord();

    savePhase4ProviderRollbackRecord(record);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      PHASE4_PROVIDER_ROLLBACK_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
    expect(loadPhase4ProviderRollbackRecord()).toEqual(record);

    clearPhase4ProviderRollbackRecord();
    expect(localStorage.removeItem).toHaveBeenCalledWith(
      PHASE4_PROVIDER_ROLLBACK_RECORD_STORAGE_KEY
    );
    expect(loadPhase4ProviderRollbackRecord()).toBeUndefined();
  });
});
