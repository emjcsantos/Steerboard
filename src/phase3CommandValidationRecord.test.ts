import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearPhase3CommandValidationRecord,
  createPhase3CommandValidationRecord,
  loadPhase3CommandValidationRecord,
  parseStoredPhase3CommandValidationRecord,
  PHASE3_COMMAND_VALIDATION_RECORD_STORAGE_KEY,
  savePhase3CommandValidationRecord
} from "./phase3CommandValidationRecord";

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
