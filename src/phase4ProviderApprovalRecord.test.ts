import { afterEach, describe, expect, it, vi } from "vitest";
import type { Phase4RefreshSafetyDepthSummary } from "./phase4RefreshSafetyDepth";
import {
  clearPhase4ProviderApprovalRecord,
  createPhase4ProviderApprovalRecord,
  derivePhase4ProviderApprovalRecordValidation,
  loadPhase4ProviderApprovalRecord,
  parseStoredPhase4ProviderApprovalRecord,
  PHASE4_PROVIDER_APPROVAL_RECORD_STORAGE_KEY,
  savePhase4ProviderApprovalRecord
} from "./phase4ProviderApprovalRecord";

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

describe("phase 4 provider approval record", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a metadata-only provider approval record", () => {
    const record = createPhase4ProviderApprovalRecord({
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:00:00.000Z"
    });

    expect(record).toEqual({
      id: "phase4-provider-approval:2026-06-18T10:00:00.000Z",
      createdAt: "2026-06-18T10:00:00.000Z",
      state: "ready",
      catalogFingerprint: "phase4-catalog-current",
      detail:
        "Owner approved Phase 4 provider metadata review while provider execution remains locked."
    });
  });

  it("validates only fresh current-catalog records with ready refresh safety", () => {
    const record = createPhase4ProviderApprovalRecord({
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:00:00.000Z"
    });

    expect(
      derivePhase4ProviderApprovalRecordValidation({
        record,
        expectedCatalogFingerprint: "phase4-catalog-current",
        refreshSafety: readyRefreshSafety,
        options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
      })
    ).toMatchObject({
      state: "ready",
      matchesCurrentCatalog: true,
      recordAgeMs: 300_000
    });
  });

  it("returns preview when no approval record is attached", () => {
    expect(
      derivePhase4ProviderApprovalRecordValidation({
        expectedCatalogFingerprint: "phase4-catalog-current",
        refreshSafety: readyRefreshSafety,
        options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
      })
    ).toMatchObject({
      state: "preview",
      detail: expect.stringContaining("not attached"),
      matchesCurrentCatalog: false
    });
  });

  it("reviews stale, future-dated, mismatched, and refresh-held approvals", () => {
    const record = createPhase4ProviderApprovalRecord({
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:00:00.000Z"
    });

    expect(
      derivePhase4ProviderApprovalRecordValidation({
        record,
        expectedCatalogFingerprint: "phase4-catalog-other",
        refreshSafety: readyRefreshSafety,
        options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("does not match"),
      matchesCurrentCatalog: false
    });
    expect(
      derivePhase4ProviderApprovalRecordValidation({
        record,
        expectedCatalogFingerprint: "phase4-catalog-current",
        refreshSafety: readyRefreshSafety,
        options: {
          evaluatedAt: "2026-06-19T10:00:01.000Z",
          maxRecordAgeMs: 24 * 60 * 60 * 1000
        }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("stale")
    });
    expect(
      derivePhase4ProviderApprovalRecordValidation({
        record,
        expectedCatalogFingerprint: "phase4-catalog-current",
        refreshSafety: readyRefreshSafety,
        options: { evaluatedAt: "2026-06-18T09:59:00.000Z" }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("future-dated")
    });
    expect(
      derivePhase4ProviderApprovalRecordValidation({
        record,
        expectedCatalogFingerprint: "phase4-catalog-current",
        refreshSafety: {
          ...readyRefreshSafety,
          previewCount: 1,
          nextAction: "Rerun catalog smoke."
        },
        options: { evaluatedAt: "2026-06-18T10:05:00.000Z" }
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("refresh safety proof"),
      nextAction: "Rerun catalog smoke."
    });
  });

  it("parses public-safe records and rejects malformed storage", () => {
    const parsed = parseStoredPhase4ProviderApprovalRecord(
      JSON.stringify({
        id: " phase4-record ",
        createdAt: "2026-06-18T10:00:00.000Z",
        state: "READY",
        catalogFingerprint: "phase4-C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret",
        detail:
          "Open C:\\Users\\MJ\\Desktop\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      })
    );

    expect(parsed).toMatchObject({
      id: "phase4-record",
      state: "ready",
      catalogFingerprint: "phase4-local path"
    });
    expect(parsed?.detail).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(parsed?.detail).not.toContain("sk-ABCDEF1234567890");
    expect(parsed?.detail).not.toContain("<");
    expect(parseStoredPhase4ProviderApprovalRecord("{")).toBeUndefined();
    expect(parseStoredPhase4ProviderApprovalRecord(JSON.stringify([]))).toBeUndefined();
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
    const record = createPhase4ProviderApprovalRecord({
      catalogFingerprint: "phase4-catalog-current",
      createdAt: "2026-06-18T10:00:00.000Z"
    });

    savePhase4ProviderApprovalRecord(record);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      PHASE4_PROVIDER_APPROVAL_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
    expect(loadPhase4ProviderApprovalRecord()).toEqual(record);

    clearPhase4ProviderApprovalRecord();
    expect(localStorage.removeItem).toHaveBeenCalledWith(
      PHASE4_PROVIDER_APPROVAL_RECORD_STORAGE_KEY
    );
    expect(loadPhase4ProviderApprovalRecord()).toBeUndefined();
  });
});
