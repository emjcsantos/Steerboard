import { describe, expect, it } from "vitest";
import {
  buildPhase11EvidenceRecords,
  evaluatePhase11EvidenceRecord
} from "./phase11EvidenceRecords";

const NOW = "2026-06-17T12:00:00.000Z";

describe("phase 11 evidence records", () => {
  it("marks missing evidence as waiting with a gate-specific next action", () => {
    const record = evaluatePhase11EvidenceRecord("fresh-checkout", undefined, NOW);

    expect(record).toMatchObject({
      gate: "fresh-checkout",
      label: "Fresh checkout",
      state: "waiting",
      freshness: "missing",
      source: "missing",
      recordedAt: "missing"
    });
    expect(record.nextAction).toContain("Record fresh-checkout");
    expect(record.safety).toContain("metadata-only");
  });

  it("keeps fresh ready evidence ready with source, detail, and age", () => {
    const record = evaluatePhase11EvidenceRecord(
      "build-test",
      {
        gate: "build-test",
        state: "ready",
        source: "local owner run",
        recordedAt: "2026-06-17T11:00:00.000Z",
        detail: "Vitest and Vite build passed."
      },
      NOW
    );

    expect(record).toMatchObject({
      state: "ready",
      freshness: "fresh",
      source: "local owner run",
      recordedAt: "2026-06-17T11:00:00.000Z",
      detail: "Vitest and Vite build passed.",
      ageHours: 1
    });
    expect(record.nextAction).toContain("Keep the final test and build output");
  });

  it("moves stale evidence into review", () => {
    const record = evaluatePhase11EvidenceRecord(
      "clean-checkout",
      {
        gate: "clean-checkout",
        state: "ready",
        source: "local owner run",
        recordedAt: "2026-06-12T11:00:00.000Z",
        detail: "Clean checkout passed."
      },
      NOW
    );

    expect(record.state).toBe("review");
    expect(record.freshness).toBe("stale");
    expect(record.ageHours).toBe(121);
    expect(record.nextAction).toContain("Refresh or re-review clean checkout evidence");
  });

  it("blocks malformed evidence metadata", () => {
    const record = evaluatePhase11EvidenceRecord(
      "docs-known-limits",
      {
        gate: "docs-known-limits",
        state: "ready",
        source: "owner note",
        recordedAt: "not-a-date",
        detail: "Docs reviewed."
      },
      NOW
    );

    expect(record.state).toBe("blocked");
    expect(record.freshness).toBe("malformed");
    expect(record.nextAction).toContain("Repair docs and known limits evidence metadata");
  });

  it("blocks evidence recorded for a different gate", () => {
    const record = evaluatePhase11EvidenceRecord(
      "clean-checkout",
      {
        gate: "build-test",
        state: "ready",
        source: "owner run",
        recordedAt: "2026-06-17T11:00:00.000Z",
        detail: "Build and test passed."
      },
      NOW
    );

    expect(record).toMatchObject({
      gate: "clean-checkout",
      label: "Clean checkout",
      state: "blocked",
      freshness: "malformed"
    });
    expect(record.detail).toContain("recorded for Build and test");
    expect(record.nextAction).toContain("Repair clean checkout evidence metadata");
  });

  it("blocks future-dated evidence records", () => {
    const record = evaluatePhase11EvidenceRecord(
      "build-test",
      {
        gate: "build-test",
        state: "ready",
        source: "owner run",
        recordedAt: "2026-06-17T12:05:00.000Z",
        detail: "Build and test passed."
      },
      NOW
    );

    expect(record.state).toBe("blocked");
    expect(record.freshness).toBe("malformed");
    expect(record.detail).toContain("future-dated");
    expect(record.nextAction).toContain("Repair build and test evidence timestamp");
  });

  it("summarizes all release evidence records", () => {
    const summary = buildPhase11EvidenceRecords(
      {
        "fresh-checkout": {
          gate: "fresh-checkout",
          state: "ready",
          source: "owner",
          recordedAt: "2026-06-17T10:00:00.000Z",
          detail: "Fresh checkout passed."
        },
        "build-test": {
          gate: "build-test",
          state: "review",
          source: "owner",
          recordedAt: "2026-06-17T10:30:00.000Z",
          detail: "Build passed, tests need review."
        },
        "docs-known-limits": {
          gate: "docs-known-limits",
          state: "ready",
          source: "owner",
          recordedAt: "bad-date",
          detail: "Docs reviewed."
        }
      },
      NOW
    );

    expect(summary.readyCount).toBe(1);
    expect(summary.reviewCount).toBe(1);
    expect(summary.blockedCount).toBe(1);
    expect(summary.waitingCount).toBe(1);
    expect(summary.missingCount).toBe(1);
    expect(summary.malformedCount).toBe(1);
  });

  it("keeps evidence text public-safe", () => {
    const record = evaluatePhase11EvidenceRecord(
      "fresh-checkout",
      {
        gate: "fresh-checkout",
        state: "ready",
        source: "C:\\Users\\MJ\\Projects\\ProjectAtlas\\secret.md",
        recordedAt: "2026-06-17T11:00:00.000Z",
        detail: "Open C:\\Users\\MJ\\Desktop\\secret.md token sk-ABCDEF1234567890 <unsafe>"
      },
      NOW
    );
    const combined = [record.source, record.detail, record.nextAction].join(" ");

    expect(combined).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combined).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combined).not.toContain("sk-ABCDEF1234567890");
    expect(combined).not.toContain("<");
    expect(combined).not.toContain(">");
  });
});
