import { describe, expect, it, vi } from "vitest";
import {
  clearPhase11EvidenceRecordInput,
  createPhase11EvidenceRecordInput,
  loadPhase11EvidenceRecordInputs,
  parsePhase11EvidenceRecordInputs,
  PHASE11_EVIDENCE_RECORDS_STORAGE_KEY,
  savePhase11EvidenceRecordInputs
} from "./phase11EvidenceRecordStorage";

describe("phase 11 evidence record storage", () => {
  it("creates owner-local ready evidence metadata without executing release actions", () => {
    expect(createPhase11EvidenceRecordInput("build-test", "2026-06-18T00:00:00.000Z")).toEqual({
      gate: "build-test",
      state: "ready",
      source: "owner local evidence record",
      recordedAt: "2026-06-18T00:00:00.000Z",
      detail: "Owner attached build/test evidence metadata for Phase 11 release review."
    });
  });

  it("creates owner-local release-decision evidence metadata", () => {
    expect(
      createPhase11EvidenceRecordInput(
        "release-decision",
        "2026-06-18T00:00:00.000Z"
      )
    ).toEqual({
      gate: "release-decision",
      state: "ready",
      source: "owner local evidence record",
      recordedAt: "2026-06-18T00:00:00.000Z",
      detail:
        "Owner attached release-decision evidence metadata for Phase 11 release review."
    });
  });

  it("parses a single imported evidence record", () => {
    const inputs = parsePhase11EvidenceRecordInputs(
      JSON.stringify({
        gate: "clean-checkout",
        state: "ready",
        source: "owner",
        recordedAt: "2026-06-18T00:00:00.000Z",
        detail: "Clean checkout passed."
      })
    );

    expect(inputs["clean-checkout"]).toMatchObject({
      gate: "clean-checkout",
      state: "ready",
      detail: "Clean checkout passed."
    });
  });

  it("parses records from an imported evidence map and preserves malformed row metadata for review", () => {
    const inputs = parsePhase11EvidenceRecordInputs(
      JSON.stringify({
        records: {
          "fresh-checkout": {
            gate: "fresh-checkout",
            state: "ready",
            source: "owner",
            recordedAt: "2026-06-18T00:00:00.000Z",
            detail: "Fresh checkout passed."
          },
          "docs-known-limits": {
            gate: "build-test",
            state: "ready",
            source: "owner",
            recordedAt: "bad-date",
            detail: "Wrong gate and bad date."
          },
          "release-decision": {
            gate: "release-decision",
            state: "ready",
            source: "owner",
            recordedAt: "2026-06-18T00:01:00.000Z",
            detail: "Release decision recorded."
          }
        }
      })
    );

    expect(inputs["fresh-checkout"]?.gate).toBe("fresh-checkout");
    expect(inputs["docs-known-limits"]).toMatchObject({
      gate: "build-test",
      recordedAt: "bad-date"
    });
    expect(inputs["release-decision"]).toMatchObject({
      gate: "release-decision",
      detail: "Release decision recorded."
    });
  });

  it("saves, loads, and clears one evidence record from localStorage", () => {
    const storage = new Map<string, string>();
    const localStorageMock = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      })
    };
    vi.stubGlobal("window", { localStorage: localStorageMock });
    const saved = {
      "build-test": createPhase11EvidenceRecordInput(
        "build-test",
        "2026-06-18T00:00:00.000Z"
      )
    };

    savePhase11EvidenceRecordInputs(saved);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      PHASE11_EVIDENCE_RECORDS_STORAGE_KEY,
      expect.stringContaining("build-test")
    );
    expect(loadPhase11EvidenceRecordInputs()).toEqual(saved);
    expect(clearPhase11EvidenceRecordInput("build-test", saved)).toEqual({});

    vi.unstubAllGlobals();
  });
});
