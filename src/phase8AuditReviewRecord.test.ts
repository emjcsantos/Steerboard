import { afterEach, describe, expect, it, vi } from "vitest";
import type { Phase8PermissionAuditDepthSnapshot } from "./phase8PermissionAuditDepth";
import type { Phase8RiskBlockerPrioritySummary } from "./phase8RiskBlockerPriority";
import {
  buildPhase8AuditEvidenceFingerprint,
  clearPhase8AuditReviewRecord,
  createPhase8AuditReviewRecord,
  loadPhase8AuditReviewRecord,
  parseStoredPhase8AuditReviewRecord,
  PHASE8_AUDIT_REVIEW_RECORD_STORAGE_KEY,
  savePhase8AuditReviewRecord
} from "./phase8AuditReviewRecord";

function auditDepthSnapshot(
  overrides: Partial<Phase8PermissionAuditDepthSnapshot> = {}
): Phase8PermissionAuditDepthSnapshot {
  return {
    id: "phase-08-permission-audit-depth",
    label: "Phase 8 permission and audit depth",
    state: "review",
    statusLabel: "Review",
    readiness: 65,
    riskyActionCount: 3,
    auditRecordCount: 2,
    disabledPathCount: 8,
    openExceptionCount: 4,
    readyCount: 4,
    reviewCount: 2,
    blockedCount: 0,
    waitingCount: 2,
    nextAction: "Review Phase 8 audit evidence.",
    safety: "Phase 8 review only.",
    ariaLabel: "Phase 8 audit depth review.",
    items: [],
    exceptions: [],
    ...overrides
  };
}

function blockerPriority(): Phase8RiskBlockerPrioritySummary {
  return {
    id: "phase-08-risk-blocker-priority",
    label: "Phase 8 risk blocker priority",
    state: "waiting",
    statusLabel: "Waiting",
    readiness: 35,
    openBlockerCount: 1,
    auditReviewAddressableCount: 1,
    topPriorityLabel: "terminal action",
    topPriorityAction: "Review terminal action before mutation paths grow.",
    topPrioritySourceId: "phase8-live-action-terminal:permission",
    topPriorityKind: "audit-depth",
    topPriorityStatus: "waiting",
    auditReviewCanAddressTopBlocker: true,
    nextAction: "Review terminal action before mutation paths grow.",
    safety: "Evidence only.",
    ariaLabel: "Phase 8 risk blocker priority.",
    items: []
  };
}

describe("phase 8 audit review record", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a local owner review record without unlocking mutation paths", () => {
    const record = createPhase8AuditReviewRecord(
      auditDepthSnapshot(),
      "2026-06-18T00:00:00.000Z"
    );

    expect(record).toEqual({
      id: "phase8-audit-review:2026-06-18T00:00:00.000Z",
      createdAt: "2026-06-18T00:00:00.000Z",
      state: "review",
      readiness: 65,
      auditRecordCount: 2,
      openExceptionCount: 4,
      disabledPathCount: 8,
      mutationLocked: true,
      auditEvidenceFingerprint: buildPhase8AuditEvidenceFingerprint(auditDepthSnapshot()),
      rollbackEvidence:
        "Runtime, profile, terminal, Git, MCP, plugin, automation, and external-service mutation paths remain locked; rollback evidence is required before future executed or failed mutation records can advance.",
      detail:
        "Owner-reviewed Phase 8 audit depth recorded locally at 65% readiness with 4 open exceptions; mutation paths remain locked."
    });
  });

  it("stores reviewed top-blocker metadata when a blocker priority summary is attached", () => {
    const record = createPhase8AuditReviewRecord(
      auditDepthSnapshot(),
      "2026-06-18T00:00:00.000Z",
      blockerPriority()
    );

    expect(record).toMatchObject({
      topBlockerLabel: "terminal action",
      topBlockerSourceId: "phase8-live-action-terminal:permission",
      topBlockerKind: "audit-depth",
      topBlockerStatus: "waiting",
      topBlockerAction: "Review terminal action before mutation paths grow."
    });
  });

  it("parses a stored review record with clamped counts and sanitized detail", () => {
    const parsed = parseStoredPhase8AuditReviewRecord(
      JSON.stringify({
        id: " phase8-audit-review:1 ",
        createdAt: " 2026-06-18T00:00:00.000Z ",
        state: "READY",
        readiness: 104.6,
        auditRecordCount: 3.7,
        openExceptionCount: -2,
        disabledPathCount: 9.4,
        mutationLocked: true,
        rollbackEvidence:
          "Rollback C:\\Users\\MJ\\Projects\\ProjectAtlas\\rollback.md with token sk-ABCDEF1234567890 <unsafe>",
        detail:
          "Review C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      })
    );

    expect(parsed).toMatchObject({
      id: "phase8-audit-review:1",
      createdAt: "2026-06-18T00:00:00.000Z",
      state: "ready",
      readiness: 100,
      auditRecordCount: 3,
      openExceptionCount: 0,
      disabledPathCount: 9
    });
    expect(parsed?.auditEvidenceFingerprint).toBe("");
    expect(parsed?.detail).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(parsed?.rollbackEvidence).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(parsed?.detail).not.toContain("sk-ABCDEF1234567890");
    expect(parsed?.rollbackEvidence).not.toContain("sk-ABCDEF1234567890");
    expect(parsed?.detail).not.toContain("<");
    expect(parsed?.detail).not.toContain(">");
  });

  it("rejects malformed stored records", () => {
    expect(parseStoredPhase8AuditReviewRecord(null)).toBeUndefined();
    expect(parseStoredPhase8AuditReviewRecord("{")).toBeUndefined();
    expect(parseStoredPhase8AuditReviewRecord("[]")).toBeUndefined();
    expect(
      parseStoredPhase8AuditReviewRecord(
        JSON.stringify({
          id: "record",
          createdAt: "",
          state: "ready",
          readiness: 100,
          auditRecordCount: 1,
          openExceptionCount: 0,
          disabledPathCount: 5,
          mutationLocked: true,
          rollbackEvidence: "Rollback evidence remains required."
        })
      )
    ).toBeUndefined();
    expect(
      parseStoredPhase8AuditReviewRecord(
        JSON.stringify({
          id: "record",
          createdAt: "2026-06-18T00:00:00.000Z",
          state: "ready",
          readiness: 100,
          auditRecordCount: 1,
          openExceptionCount: 0,
          disabledPathCount: 5,
          mutationLocked: true,
          rollbackEvidence: ""
        })
      )
    ).toBeUndefined();
  });

  it("saves, loads, and clears through localStorage", () => {
    const store = new Map<string, string>();
    const setItem = vi.fn((key: string, value: string) => {
      store.set(key, value);
    });
    const getItem = vi.fn((key: string) => store.get(key) ?? null);
    const removeItem = vi.fn((key: string) => {
      store.delete(key);
    });

    vi.stubGlobal("window", {
      localStorage: {
        getItem,
        setItem,
        removeItem
      }
    });

    const record = createPhase8AuditReviewRecord(
      auditDepthSnapshot(),
      "2026-06-18T00:00:00.000Z"
    );

    savePhase8AuditReviewRecord(record);
    expect(setItem).toHaveBeenCalledWith(
      PHASE8_AUDIT_REVIEW_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
    expect(loadPhase8AuditReviewRecord()).toEqual(record);

    clearPhase8AuditReviewRecord();
    expect(removeItem).toHaveBeenCalledWith(PHASE8_AUDIT_REVIEW_RECORD_STORAGE_KEY);
    expect(loadPhase8AuditReviewRecord()).toBeUndefined();
  });

  it("handles missing or failing localStorage without throwing", () => {
    vi.stubGlobal("window", undefined);
    expect(loadPhase8AuditReviewRecord()).toBeUndefined();
    expect(() =>
      savePhase8AuditReviewRecord(
        createPhase8AuditReviewRecord(auditDepthSnapshot(), "2026-06-18T00:00:00.000Z")
      )
    ).not.toThrow();
    expect(() => clearPhase8AuditReviewRecord()).not.toThrow();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => {
          throw new Error("read failed");
        }),
        setItem: vi.fn(() => {
          throw new Error("write failed");
        }),
        removeItem: vi.fn(() => {
          throw new Error("remove failed");
        })
      }
    });

    expect(loadPhase8AuditReviewRecord()).toBeUndefined();
    expect(() =>
      savePhase8AuditReviewRecord(
        createPhase8AuditReviewRecord(auditDepthSnapshot(), "2026-06-18T00:00:00.000Z")
      )
    ).not.toThrow();
    expect(() => clearPhase8AuditReviewRecord()).not.toThrow();
  });
});
