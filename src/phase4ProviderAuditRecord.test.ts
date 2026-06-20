import { afterEach, describe, expect, it, vi } from "vitest";
import type { Phase4RefreshSafetyDepthSummary } from "./phase4RefreshSafetyDepth";
import {
  createPhase4ProviderApprovalRecord,
  derivePhase4ProviderApprovalRecordValidation
} from "./phase4ProviderApprovalRecord";
import {
  clearPhase4ProviderAuditRecord,
  createPhase4ProviderAuditRecord,
  derivePhase4ProviderAuditRecordValidation,
  loadPhase4ProviderAuditRecord,
  parseStoredPhase4ProviderAuditRecord,
  PHASE4_PROVIDER_AUDIT_RECORD_STORAGE_KEY,
  savePhase4ProviderAuditRecord
} from "./phase4ProviderAuditRecord";

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

const readyApprovalValidation = derivePhase4ProviderApprovalRecordValidation({
  record: approvalRecord,
  expectedCatalogFingerprint: "phase4-catalog-current",
  refreshSafety: readyRefreshSafety,
  options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
});
const auditEvidenceFingerprint = "phase4-provider-audit-current";

describe("phase 4 provider audit record", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a metadata-only provider audit record tied to approval", () => {
    const record = createPhase4ProviderAuditRecord({
      approvalRecord,
      auditEvidenceFingerprint,
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:10:00.000Z"
    });

    expect(record).toEqual({
      id: "phase4-provider-audit:2026-06-18T10:10:00.000Z",
      createdAt: "2026-06-18T10:10:00.000Z",
      state: "ready",
      catalogFingerprint: "phase4-catalog-current",
      approvalRecordId: "phase4-provider-approval:2026-06-18T10:00:00.000Z",
      auditEvidenceFingerprint,
      mutationLocked: true,
      detail:
        "Owner reviewed Phase 4 provider audit evidence while provider execution remains locked."
    });
  });

  it("validates only fresh records tied to current approval and catalog evidence", () => {
    const record = createPhase4ProviderAuditRecord({
      approvalRecord,
      auditEvidenceFingerprint,
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:10:00.000Z"
    });

    const validation = derivePhase4ProviderAuditRecordValidation({
      record,
      approvalRecord,
      approvalValidation: readyApprovalValidation,
      expectedAuditEvidenceFingerprint: auditEvidenceFingerprint,
      expectedCatalogFingerprint: "phase4-catalog-current",
      options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
    });

    expect(validation).toMatchObject({
      state: "ready",
      matchesCurrentCatalog: true,
      matchesCurrentApproval: true,
      matchesCurrentAuditEvidence: true,
      mutationLocked: true,
      auditChainProof: expect.stringContaining(
        "approvalMatch=matched catalogMatch=matched auditMatch=matched mutation=locked execution=locked"
      ),
      recordAgeMs: 300_000
    });
    expect(validation.auditChainProof).toContain("approvalValidation=ready approvalChain=present");
  });

  it("returns preview when no audit record is attached", () => {
    const validation = derivePhase4ProviderAuditRecordValidation({
      approvalRecord,
      approvalValidation: readyApprovalValidation,
      expectedAuditEvidenceFingerprint: auditEvidenceFingerprint,
      expectedCatalogFingerprint: "phase4-catalog-current",
      options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
    });

    expect(validation).toMatchObject({
      state: "preview",
      detail: expect.stringContaining("not attached"),
      matchesCurrentCatalog: false,
      matchesCurrentApproval: false,
      matchesCurrentAuditEvidence: false,
      mutationLocked: false,
      auditChainProof: expect.stringContaining("mutation=review execution=locked")
    });
    expect(validation.auditChainProof).toContain("approvalValidation=ready approvalChain=present");
  });

  it("reviews stale, future-dated, mismatched, and approval-held audit records", () => {
    const record = createPhase4ProviderAuditRecord({
      approvalRecord,
      auditEvidenceFingerprint,
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:10:00.000Z"
    });

    expect(
      derivePhase4ProviderAuditRecordValidation({
        record,
        approvalRecord,
        approvalValidation: readyApprovalValidation,
        expectedAuditEvidenceFingerprint: auditEvidenceFingerprint,
        expectedCatalogFingerprint: "phase4-catalog-other",
        options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("does not match the current six-surface catalog")
    });
    expect(
      derivePhase4ProviderAuditRecordValidation({
        record: { ...record, approvalRecordId: "old-approval" },
        approvalRecord,
        approvalValidation: readyApprovalValidation,
        expectedAuditEvidenceFingerprint: auditEvidenceFingerprint,
        expectedCatalogFingerprint: "phase4-catalog-current",
        options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("does not match the current provider approval")
    });
    expect(
      derivePhase4ProviderAuditRecordValidation({
        record,
        approvalRecord,
        approvalValidation: readyApprovalValidation,
        expectedAuditEvidenceFingerprint: "other-audit-fingerprint",
        expectedCatalogFingerprint: "phase4-catalog-current",
        options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("audit evidence fingerprint")
    });
    expect(
      derivePhase4ProviderAuditRecordValidation({
        record,
        approvalRecord,
        approvalValidation: readyApprovalValidation,
        expectedAuditEvidenceFingerprint: auditEvidenceFingerprint,
        expectedCatalogFingerprint: "phase4-catalog-current",
        options: {
          evaluatedAt: "2026-06-19T10:10:01.000Z",
          maxRecordAgeMs: 24 * 60 * 60 * 1000
        }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("stale")
    });
    expect(
      derivePhase4ProviderAuditRecordValidation({
        record,
        approvalRecord,
        approvalValidation: readyApprovalValidation,
        expectedAuditEvidenceFingerprint: auditEvidenceFingerprint,
        expectedCatalogFingerprint: "phase4-catalog-current",
        options: { evaluatedAt: "2026-06-18T10:09:00.000Z" }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("future-dated")
    });
    expect(
      derivePhase4ProviderAuditRecordValidation({
        record: { ...record, mutationLocked: false },
        approvalRecord,
        approvalValidation: readyApprovalValidation,
        expectedAuditEvidenceFingerprint: auditEvidenceFingerprint,
        expectedCatalogFingerprint: "phase4-catalog-current",
        options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("mutation lock"),
      mutationLocked: false,
      auditChainProof: expect.stringContaining("mutation=review execution=locked")
    });
    expect(
      derivePhase4ProviderAuditRecordValidation({
        record,
        approvalRecord,
        approvalValidation: {
          ...readyApprovalValidation,
          state: "review",
          nextAction: "Record approval again."
        },
        expectedAuditEvidenceFingerprint: auditEvidenceFingerprint,
        expectedCatalogFingerprint: "phase4-catalog-current",
        options: { evaluatedAt: "2026-06-18T10:15:00.000Z" }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("approval is ready"),
      nextAction: "Record approval again."
    });
  });

  it("parses public-safe records and rejects malformed storage", () => {
    const parsed = parseStoredPhase4ProviderAuditRecord(
      JSON.stringify({
        id: " phase4-audit ",
        createdAt: "2026-06-18T10:10:00.000Z",
        state: "READY",
        catalogFingerprint: "phase4-C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret",
        approvalRecordId: "approval-C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret",
        auditEvidenceFingerprint: "audit-C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret",
        mutationLocked: true,
        detail:
          "Open C:\\Users\\MJ\\Desktop\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      })
    );

    expect(parsed).toMatchObject({
      id: "phase4-audit",
      state: "ready",
      catalogFingerprint: "phase4-local path",
      approvalRecordId: "approval-local path",
      auditEvidenceFingerprint: "audit-local path",
      mutationLocked: true
    });
    expect(parsed?.detail).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(parsed?.detail).not.toContain("sk-ABCDEF1234567890");
    expect(parsed?.detail).not.toContain("<");
    expect(parseStoredPhase4ProviderAuditRecord("{")).toBeUndefined();
    expect(parseStoredPhase4ProviderAuditRecord(JSON.stringify([]))).toBeUndefined();
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
    const record = createPhase4ProviderAuditRecord({
      approvalRecord,
      auditEvidenceFingerprint,
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:10:00.000Z"
    });

    savePhase4ProviderAuditRecord(record);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      PHASE4_PROVIDER_AUDIT_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
    expect(loadPhase4ProviderAuditRecord()).toEqual(record);

    clearPhase4ProviderAuditRecord();
    expect(localStorage.removeItem).toHaveBeenCalledWith(
      PHASE4_PROVIDER_AUDIT_RECORD_STORAGE_KEY
    );
    expect(loadPhase4ProviderAuditRecord()).toBeUndefined();
  });
});
