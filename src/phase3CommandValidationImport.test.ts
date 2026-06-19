import { afterEach, describe, expect, it, vi } from "vitest";
import { createPhase3CommandValidationRecord, loadPhase3CommandValidationRecord } from "./phase3CommandValidationRecord";
import { runPhase3CommandValidationImportAction } from "./phase3CommandValidationImport";

function createStore() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      })
    }
  });

  return store;
}

function effects() {
  return {
    setRecord: vi.fn(),
    setProofEvaluationTime: vi.fn(),
    setAppNotice: vi.fn()
  };
}

describe("phase 3 command validation import action", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects malformed command-validation artifacts without changing state", () => {
    createStore();
    const actionEffects = effects();

    const result = runPhase3CommandValidationImportAction("{", actionEffects);

    expect(result).toEqual({
      imported: false,
      notice: "Phase 3 CLI smoke validation artifact could not be imported"
    });
    expect(actionEffects.setRecord).not.toHaveBeenCalled();
    expect(actionEffects.setProofEvaluationTime).not.toHaveBeenCalled();
    expect(actionEffects.setAppNotice).toHaveBeenCalledWith(
      "Phase 3 CLI smoke validation artifact could not be imported"
    );
    expect(loadPhase3CommandValidationRecord()).toBeUndefined();
  });

  it("imports and persists passed command-validation artifacts", () => {
    createStore();
    const actionEffects = effects();
    const record = createPhase3CommandValidationRecord(
      "npm.cmd run smoke:phase3",
      "2026-06-18T07:57:30.551Z"
    );

    const result = runPhase3CommandValidationImportAction(
      JSON.stringify(record),
      actionEffects,
      "2026-06-18T07:58:00.000Z"
    );

    expect(result.imported).toBe(true);
    expect(result.notice).toBe("Phase 3 CLI smoke validation artifact imported");
    expect(result.record).toEqual(record);
    expect(result.evaluatedAt).toBe("2026-06-18T07:58:00.000Z");
    expect(actionEffects.setRecord).toHaveBeenCalledWith(record);
    expect(actionEffects.setProofEvaluationTime).toHaveBeenCalledWith(
      "2026-06-18T07:58:00.000Z"
    );
    expect(actionEffects.setAppNotice).toHaveBeenCalledWith(
      "Phase 3 CLI smoke validation artifact imported"
    );
    expect(loadPhase3CommandValidationRecord()).toEqual(record);
  });
});
