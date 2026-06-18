import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearPhase3CommandValidationRecord,
  createPhase3CommandValidationRecord,
  DEFAULT_PHASE3_COMMAND_VALIDATION_RECORD_MAX_AGE_MS,
  derivePhase3CommandValidationRecordValidation,
  loadPhase3CommandValidationRecord,
  parseStoredPhase3CommandValidationRecord,
  PHASE3_COMMAND_VALIDATION_RECORD_STORAGE_KEY,
  savePhase3CommandValidationRecord
} from "./phase3CommandValidationRecord";
import { PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE } from "./phase3SmokeProofStorage";

const smokeBundle = {
  source: PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE,
  runId: "phase3-smoke-record:2026-06-18T07:57:30.551Z",
  artifactPath: "local_private/phase3-smoke-proof-bundle.json",
  rowFingerprints: {
    liveControlSmoke: "phase3-smoke-proof-live",
    activeTurnInterruptSmoke: "phase3-smoke-proof-interrupt",
    activeTurnSteerSmoke: "phase3-smoke-proof-steer"
  }
};

describe("phase 3 command validation record", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a passed CLI smoke validation record without marking UI proof complete", () => {
    const record = createPhase3CommandValidationRecord(
      "npm.cmd run smoke:phase3",
      "2026-06-18T00:00:00.000Z"
    );

    expect(record).toEqual({
      id: "phase3-command-validation:2026-06-18T00:00:00.000Z",
      createdAt: "2026-06-18T00:00:00.000Z",
      command: "npm.cmd run smoke:phase3",
      status: "passed",
      passedTestCount: 3,
      failedTestCount: 0,
      detail:
        "Phase 3 CLI smoke validation passed locally; desktop UI proof rows still require persisted desktop evidence."
    });
  });

  it("parses a stored record with sanitized detail and normalized counts", () => {
    const parsed = parseStoredPhase3CommandValidationRecord(
      JSON.stringify({
        id: " phase3-command-validation:1 ",
        createdAt: " 2026-06-18T00:00:00.000Z ",
        command: " npm.cmd run smoke:phase3 ",
        status: "PASSED",
        passedTestCount: 3.8,
        failedTestCount: -1,
        detail:
          "Ran from C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md with token sk-ABCDEF1234567890 <unsafe>"
      })
    );

    expect(parsed).toMatchObject({
      id: "phase3-command-validation:1",
      createdAt: "2026-06-18T00:00:00.000Z",
      command: "npm.cmd run smoke:phase3",
      status: "passed",
      passedTestCount: 3,
      failedTestCount: 0
    });
    expect(parsed?.detail).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(parsed?.detail).not.toContain("sk-ABCDEF1234567890");
    expect(parsed?.detail).not.toContain("<");
    expect(parsed?.detail).not.toContain(">");
  });

  it("parses the local phase 3 smoke artifact schema", () => {
    const parsed = parseStoredPhase3CommandValidationRecord(
      JSON.stringify({
        id: "phase3-command-validation:2026-06-18T07:30:00.000Z",
        createdAt: "2026-06-18T07:30:00.000Z",
        command: "npm.cmd run smoke:phase3",
        status: "passed",
        passedTestCount: 3,
        failedTestCount: 0,
        smokeBundle,
        detail:
          "Phase 3 CLI smoke validation passed locally via npm.cmd run smoke:phase3; desktop UI proof rows still require persisted desktop evidence."
      })
    );

    expect(parsed).toMatchObject({
      id: "phase3-command-validation:2026-06-18T07:30:00.000Z",
      command: "npm.cmd run smoke:phase3",
      status: "passed",
      passedTestCount: 3,
      failedTestCount: 0,
      smokeBundle
    });
    expect(
      derivePhase3CommandValidationRecordValidation(parsed, {
        evaluatedAt: "2026-06-18T07:31:00.000Z",
        expectedCommand: "npm.cmd run smoke:phase3"
      })
    ).toMatchObject({
      state: "ready",
      isFresh: true,
      hasSmokeBundleProvenance: true,
      smokeBundleProvenance: {
        source: PHASE3_SMOKE_PROOF_BUNDLE_PROVENANCE_SOURCE,
        command: "npm.cmd run smoke:phase3",
        runId: smokeBundle.runId,
        artifactPath: "local_private/phase3-smoke-proof-bundle.json",
        rowFingerprintCount: 3
      },
      detail: expect.stringContaining("Smoke bundle provenance is attached"),
      nextAction: expect.stringContaining("without using it to unlock handoff")
    });
  });

  it("rejects records with malformed attached smoke bundle provenance", () => {
    expect(
      parseStoredPhase3CommandValidationRecord(
        JSON.stringify({
          id: "phase3-command-validation:2026-06-18T07:30:00.000Z",
          createdAt: "2026-06-18T07:30:00.000Z",
          command: "npm.cmd run smoke:phase3",
          status: "passed",
          passedTestCount: 3,
          failedTestCount: 0,
          smokeBundle: {
            ...smokeBundle,
            rowFingerprints: {
              liveControlSmoke: "phase3-smoke-proof-live"
            }
          }
        })
      )
    ).toBeUndefined();
  });

  it("classifies fresh passed CLI smoke validation as ready without unlocking UI proof", () => {
    const record = createPhase3CommandValidationRecord(
      "npm.cmd run smoke:phase3",
      "2026-06-18T00:00:00.000Z"
    );

    expect(
      derivePhase3CommandValidationRecordValidation(record, {
        evaluatedAt: "2026-06-18T00:30:00.000Z",
        expectedCommand: "npm.cmd run smoke:phase3"
      })
    ).toMatchObject({
      state: "ready",
      statusLabel: "Ready",
      isFresh: true,
      hasSmokeBundleProvenance: false,
      nextAction: expect.stringContaining("without using it to unlock handoff")
    });
  });

  it("reviews passed CLI smoke validation when freshness cannot be evaluated", () => {
    const record = createPhase3CommandValidationRecord(
      "npm.cmd run smoke:phase3",
      "2026-06-18T00:00:00.000Z"
    );

    expect(
      derivePhase3CommandValidationRecordValidation(record, {
        expectedCommand: "npm.cmd run smoke:phase3"
      })
    ).toMatchObject({
      state: "review",
      statusLabel: "Review",
      detail: expect.stringContaining("cannot be freshness-checked"),
      isFresh: false
    });
  });

  it("classifies stale or malformed passed CLI smoke validation as review", () => {
    const record = createPhase3CommandValidationRecord(
      "npm.cmd run smoke:phase3",
      "2026-06-18T00:00:00.000Z"
    );

    expect(
      derivePhase3CommandValidationRecordValidation(record, {
        evaluatedAt: "2026-06-19T00:01:00.000Z",
        expectedCommand: "npm.cmd run smoke:phase3",
        maxRecordAgeMs: DEFAULT_PHASE3_COMMAND_VALIDATION_RECORD_MAX_AGE_MS
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("stale"),
      isFresh: false
    });
    expect(
      derivePhase3CommandValidationRecordValidation(
        { ...record, createdAt: "not-a-date" },
        {
          evaluatedAt: "2026-06-18T00:01:00.000Z",
          expectedCommand: "npm.cmd run smoke:phase3"
        }
      )
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("stale"),
      isFresh: false
    });
  });

  it("reviews passed CLI smoke validation dated after the current evaluation", () => {
    const record = createPhase3CommandValidationRecord(
      "npm.cmd run smoke:phase3",
      "2026-06-18T01:00:00.000Z"
    );

    expect(
      derivePhase3CommandValidationRecordValidation(record, {
        evaluatedAt: "2026-06-18T00:30:00.000Z",
        expectedCommand: "npm.cmd run smoke:phase3",
        maxRecordAgeMs: DEFAULT_PHASE3_COMMAND_VALIDATION_RECORD_MAX_AGE_MS
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("stale"),
      isFresh: false
    });
  });

  it("classifies failed or mismatched CLI smoke validation as blocked or review", () => {
    const failed = parseStoredPhase3CommandValidationRecord(
      JSON.stringify({
        id: "phase3-command-validation:failed",
        createdAt: "2026-06-18T00:00:00.000Z",
        command: "npm.cmd run smoke:phase3",
        status: "failed",
        passedTestCount: 1,
        failedTestCount: 2,
        detail: "CLI smoke failed."
      })
    );
    const passed = createPhase3CommandValidationRecord(
      "npm.cmd run smoke:phase3",
      "2026-06-18T00:00:00.000Z"
    );

    expect(
      derivePhase3CommandValidationRecordValidation(failed, {
        evaluatedAt: "2026-06-18T00:01:00.000Z",
        expectedCommand: "npm.cmd run smoke:phase3"
      })
    ).toMatchObject({
      state: "blocked",
      detail: "CLI smoke failed.",
      isFresh: false
    });
    expect(
      derivePhase3CommandValidationRecordValidation(passed, {
        evaluatedAt: "2026-06-18T00:01:00.000Z",
        expectedCommand: "npm.cmd run smoke:phase3 --other"
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("different command"),
      isFresh: false
    });
  });

  it("rejects malformed stored records", () => {
    expect(parseStoredPhase3CommandValidationRecord(null)).toBeUndefined();
    expect(parseStoredPhase3CommandValidationRecord("{")).toBeUndefined();
    expect(parseStoredPhase3CommandValidationRecord("[]")).toBeUndefined();
    expect(
      parseStoredPhase3CommandValidationRecord(
        JSON.stringify({
          id: "record",
          createdAt: "",
          command: "npm.cmd run smoke:phase3",
          status: "passed"
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

    const record = createPhase3CommandValidationRecord(
      "npm.cmd run smoke:phase3",
      "2026-06-18T00:00:00.000Z"
    );

    savePhase3CommandValidationRecord(record);
    expect(setItem).toHaveBeenCalledWith(
      PHASE3_COMMAND_VALIDATION_RECORD_STORAGE_KEY,
      JSON.stringify(record)
    );
    expect(loadPhase3CommandValidationRecord()).toEqual(record);

    clearPhase3CommandValidationRecord();
    expect(removeItem).toHaveBeenCalledWith(
      PHASE3_COMMAND_VALIDATION_RECORD_STORAGE_KEY
    );
    expect(loadPhase3CommandValidationRecord()).toBeUndefined();
  });

  it("saves and loads command validation smoke bundle metadata", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store.set(key, value);
        }),
        removeItem: vi.fn()
      }
    });
    const record = parseStoredPhase3CommandValidationRecord(
      JSON.stringify({
        id: "phase3-command-validation:2026-06-18T07:30:00.000Z",
        createdAt: "2026-06-18T07:30:00.000Z",
        command: "npm.cmd run smoke:phase3",
        status: "passed",
        passedTestCount: 3,
        failedTestCount: 0,
        smokeBundle,
        detail: "Passed with bundle metadata."
      })
    );

    expect(record).toBeDefined();
    savePhase3CommandValidationRecord(record!);

    expect(loadPhase3CommandValidationRecord()?.smokeBundle).toEqual(smokeBundle);
  });

  it("handles missing or failing localStorage without throwing", () => {
    vi.stubGlobal("window", undefined);
    expect(loadPhase3CommandValidationRecord()).toBeUndefined();
    expect(() =>
      savePhase3CommandValidationRecord(
        createPhase3CommandValidationRecord("npm.cmd run smoke:phase3", "2026-06-18T00:00:00.000Z")
      )
    ).not.toThrow();
    expect(() => clearPhase3CommandValidationRecord()).not.toThrow();

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

    expect(loadPhase3CommandValidationRecord()).toBeUndefined();
    expect(() =>
      savePhase3CommandValidationRecord(
        createPhase3CommandValidationRecord("npm.cmd run smoke:phase3", "2026-06-18T00:00:00.000Z")
      )
    ).not.toThrow();
    expect(() => clearPhase3CommandValidationRecord()).not.toThrow();
  });
});
