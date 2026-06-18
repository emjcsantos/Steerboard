import { afterEach, describe, expect, it, vi } from "vitest";
import type { Phase3ClearancePackage } from "./phase3ClearancePackage";
import {
  buildPhase3HandoffEvidenceFingerprint,
  clearPhase3OwnerHandoffRecord,
  createPhase3OwnerHandoffRecord,
  derivePhase3HandoffRecordValidation,
  derivePhase3HandoffRecordState,
  DEFAULT_PHASE3_HANDOFF_RECORD_MAX_AGE_MS,
  loadPhase3OwnerHandoffRecord,
  parseStoredPhase3OwnerHandoffRecord,
  PHASE3_HANDOFF_RECORD_STORAGE_KEY,
  savePhase3OwnerHandoffRecord
} from "./phase3HandoffRecord";

function clearancePackage(
  overrides: Partial<Phase3ClearancePackage> = {}
): Phase3ClearancePackage {
  return {
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canExit: true,
    detail: "Phase 3 has complete evidence.",
    nextAction: "Record Phase 3 handoff.",
    readyCount: 5,
    openCount: 0,
    blockerCount: 0,
    reviewCount: 0,
    waitingCount: 0,
    blockers: [],
    safety: "Evidence only.",
    ...overrides
  };
}

describe("phase 3 handoff record", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a ready owner handoff record from exit-ready clearance", () => {
    const record = createPhase3OwnerHandoffRecord(
      clearancePackage(),
      "2026-06-11T00:00:00.000Z"
    );

    expect(record).toEqual({
      id: "phase3-owner-handoff:2026-06-11T00:00:00.000Z",
      createdAt: "2026-06-11T00:00:00.000Z",
      state: "ready",
      clearanceReadiness: 100,
      exactBlockerCount: 0,
      canExit: true,
      detail: "Owner-reviewed Phase 3 handoff is recorded from exit-ready clearance evidence."
    });
    expect(derivePhase3HandoffRecordState(record, clearancePackage())).toBe("review");
  });

  it("does not derive ready when clearance later regresses", () => {
    const record = createPhase3OwnerHandoffRecord(
      clearancePackage(),
      "2026-06-11T00:00:00.000Z"
    );

    expect(
      derivePhase3HandoffRecordState(
        record,
        clearancePackage({
          state: "blocked",
          canExit: false,
          openCount: 1,
          blockerCount: 1
        })
      )
    ).toBe("blocked");
  });

  it("waits when clearance is exit-ready but no owner record exists", () => {
    expect(derivePhase3HandoffRecordState(undefined, clearancePackage())).toBe("waiting");
  });

  it("reviews stored handoff when the current evidence fingerprint differs", () => {
    const currentClearance = clearancePackage();
    const originalFingerprint = buildPhase3HandoffEvidenceFingerprint({
      clearancePackage: currentClearance,
      commandPlanId: "phase-3-clearance-command-plan"
    });
    const changedFingerprint = buildPhase3HandoffEvidenceFingerprint({
      clearancePackage: clearancePackage({ readyCount: 4, reviewCount: 1 }),
      commandPlanId: "phase-3-clearance-command-plan"
    });
    const record = createPhase3OwnerHandoffRecord(
      currentClearance,
      "2026-06-11T00:00:00.000Z",
      originalFingerprint
    );

    expect(originalFingerprint).toMatch(/^phase3-handoff-[a-f0-9]{8}$/);
    expect(changedFingerprint).toMatch(/^phase3-handoff-[a-f0-9]{8}$/);
    expect(originalFingerprint).not.toBe(changedFingerprint);
    expect(originalFingerprint).not.toContain("phase3-exit-gate");
    expect(
      derivePhase3HandoffRecordValidation(
        record,
        currentClearance,
        originalFingerprint
      )
    ).toMatchObject({
      state: "ready",
      matchesCurrentEvidence: true
    });
    expect(
      derivePhase3HandoffRecordValidation(
        record,
        currentClearance,
        changedFingerprint
      )
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("no longer matches"),
      matchesCurrentEvidence: false
    });
  });

  it("reviews stored handoff when no current evidence fingerprint is supplied", () => {
    const currentClearance = clearancePackage();
    const record = createPhase3OwnerHandoffRecord(
      currentClearance,
      "2026-06-11T00:00:00.000Z",
      "phase3-handoff-existing"
    );

    expect(
      derivePhase3HandoffRecordValidation(record, currentClearance)
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("current Phase 3 evidence fingerprint is missing"),
      nextAction: expect.stringContaining("current Phase 3 evidence fingerprint"),
      recordFingerprint: "phase3-handoff-existing",
      matchesCurrentEvidence: false
    });
  });

  it("reviews legacy ready handoff records when current evidence has a fingerprint", () => {
    const currentClearance = clearancePackage();
    const expectedFingerprint = buildPhase3HandoffEvidenceFingerprint({
      clearancePackage: currentClearance
    });
    const record = createPhase3OwnerHandoffRecord(
      currentClearance,
      "2026-06-11T00:00:00.000Z"
    );

    expect(
      derivePhase3HandoffRecordValidation(
        record,
        currentClearance,
        expectedFingerprint
      )
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("predates"),
      matchesCurrentEvidence: false
    });
  });

  it("reviews current-matching handoff records when the owner review is stale", () => {
    const currentClearance = clearancePackage();
    const expectedFingerprint = buildPhase3HandoffEvidenceFingerprint({
      clearancePackage: currentClearance
    });
    const record = createPhase3OwnerHandoffRecord(
      currentClearance,
      "2026-06-11T00:00:00.000Z",
      expectedFingerprint
    );

    expect(
      derivePhase3HandoffRecordValidation(
        record,
        currentClearance,
        expectedFingerprint,
        {
          evaluatedAt: "2026-06-11T23:59:00.000Z",
          maxRecordAgeMs: DEFAULT_PHASE3_HANDOFF_RECORD_MAX_AGE_MS
        }
      )
    ).toMatchObject({
      state: "ready",
      matchesCurrentEvidence: true
    });
    expect(
      derivePhase3HandoffRecordValidation(
        record,
        currentClearance,
        expectedFingerprint,
        {
          evaluatedAt: "2026-06-12T00:01:00.000Z",
          maxRecordAgeMs: DEFAULT_PHASE3_HANDOFF_RECORD_MAX_AGE_MS
        }
      )
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("stale"),
      nextAction: expect.stringContaining("fresh exit-ready evidence"),
      matchesCurrentEvidence: true
    });
  });

  it("reviews current-matching handoff records with malformed review timestamps", () => {
    const currentClearance = clearancePackage();
    const expectedFingerprint = buildPhase3HandoffEvidenceFingerprint({
      clearancePackage: currentClearance
    });
    const record = {
      ...createPhase3OwnerHandoffRecord(
        currentClearance,
        "2026-06-11T00:00:00.000Z",
        expectedFingerprint
      ),
      createdAt: "not-a-date"
    };

    expect(
      derivePhase3HandoffRecordValidation(
        record,
        currentClearance,
        expectedFingerprint,
        {
          evaluatedAt: "2026-06-11T00:01:00.000Z",
          maxRecordAgeMs: DEFAULT_PHASE3_HANDOFF_RECORD_MAX_AGE_MS
        }
      )
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("stale"),
      matchesCurrentEvidence: true
    });
  });

  it("parses a stored record with clamped counts and sanitized detail", () => {
    const parsed = parseStoredPhase3OwnerHandoffRecord(
      JSON.stringify({
        id: " phase3-owner-handoff:1 ",
        createdAt: " 2026-06-11T00:00:00.000Z ",
        state: "READY",
        clearanceReadiness: 104.6,
        exactBlockerCount: 2.9,
        canExit: true,
        evidenceFingerprint:
          " phase3-handoff-C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret ",
        detail:
          "Open C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      })
    );

    expect(parsed).toMatchObject({
      id: "phase3-owner-handoff:1",
      createdAt: "2026-06-11T00:00:00.000Z",
      state: "ready",
      clearanceReadiness: 100,
      exactBlockerCount: 2,
      canExit: true,
      evidenceFingerprint: "phase3-handoff-local path"
    });
    expect(parsed?.evidenceFingerprint).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(parsed?.detail).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(parsed?.detail).not.toContain("sk-ABCDEF1234567890");
    expect(parsed?.detail).not.toContain("<");
    expect(parsed?.detail).not.toContain(">");
  });

  it("rejects malformed stored records", () => {
    expect(parseStoredPhase3OwnerHandoffRecord(null)).toBeUndefined();
    expect(parseStoredPhase3OwnerHandoffRecord("{")).toBeUndefined();
    expect(parseStoredPhase3OwnerHandoffRecord("[]")).toBeUndefined();
    expect(
      parseStoredPhase3OwnerHandoffRecord(
        JSON.stringify({
          id: "record",
          createdAt: "",
          state: "ready",
          clearanceReadiness: 100,
          exactBlockerCount: 0,
          canExit: true,
          detail: "Ready"
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

    const record = createPhase3OwnerHandoffRecord(
      clearancePackage(),
      "2026-06-11T00:00:00.000Z"
    );

    savePhase3OwnerHandoffRecord(record);
    expect(setItem).toHaveBeenCalledWith(
      PHASE3_HANDOFF_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
    expect(loadPhase3OwnerHandoffRecord()).toEqual(record);
    expect(getItem).toHaveBeenCalledWith(PHASE3_HANDOFF_RECORD_STORAGE_KEY);

    clearPhase3OwnerHandoffRecord();
    expect(removeItem).toHaveBeenCalledWith(PHASE3_HANDOFF_RECORD_STORAGE_KEY);
    expect(loadPhase3OwnerHandoffRecord()).toBeUndefined();
  });

  it("handles missing or failing localStorage without throwing", () => {
    vi.stubGlobal("window", undefined);
    expect(loadPhase3OwnerHandoffRecord()).toBeUndefined();
    expect(() =>
      savePhase3OwnerHandoffRecord(
        createPhase3OwnerHandoffRecord(clearancePackage(), "2026-06-11T00:00:00.000Z")
      )
    ).not.toThrow();
    expect(() => clearPhase3OwnerHandoffRecord()).not.toThrow();

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

    expect(loadPhase3OwnerHandoffRecord()).toBeUndefined();
    expect(() =>
      savePhase3OwnerHandoffRecord(
        createPhase3OwnerHandoffRecord(clearancePackage(), "2026-06-11T00:00:00.000Z")
      )
    ).not.toThrow();
    expect(() => clearPhase3OwnerHandoffRecord()).not.toThrow();
  });
});
