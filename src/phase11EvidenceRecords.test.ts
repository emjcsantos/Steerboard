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
        detail: "Vitest test output and Vite build output passed."
      },
      NOW
    );

    expect(record).toMatchObject({
      state: "ready",
      freshness: "fresh",
      source: "local owner run",
      recordedAt: "2026-06-17T11:00:00.000Z",
      detail: "Vitest test output and Vite build output passed.",
      ageHours: 1
    });
    expect(record.nextAction).toContain("Keep the final test and build output");
  });

  it.each([
    ["clean-checkout", "Clean checkout install passed."],
    ["build-test", "Vitest test and Vite build passed."],
    ["docs-known-limits", "Docs and known limits reviewed."],
    ["signed-audit-export", "Signed audit export and rollback references recorded."],
    ["release-decision", "Owner approved release decision while packaging locked and Phase 3 proof stayed attached."]
  ] as const)(
    "moves incomplete %s ready evidence into review",
    (gate, detail) => {
      const record = evaluatePhase11EvidenceRecord(
        gate,
        {
          gate,
          state: "ready",
          source: "owner release evidence",
          recordedAt: "2026-06-17T11:00:00.000Z",
          detail
        },
        NOW
      );

      expect(record.state).toBe("review");
      expect(record.freshness).toBe("fresh");
      expect(record.detail).toContain("missing checklist coverage");
      if (gate === "release-decision") {
        expect(record.detail).toContain("proof-export");
        expect(record.detail).toContain("security closure");
      }
      if (gate === "signed-audit-export") {
        expect(record.detail).toContain("signature");
        expect(record.detail).toContain("release privacy");
      }
      expect(record.nextAction).toContain("evidence metadata covering");
    }
  );

  it.each([
    [
      "clean-checkout",
      "Clean checkout install, dependency verification, and startup proof passed."
    ],
    ["build-test", "Final test, build, and output evidence passed."],
    [
      "docs-known-limits",
      "Release docs, owner checklist, packaging limits, and known limits reviewed."
    ],
    [
      "signed-audit-export",
      "Signed audit export, signature verification, rollback references, no-mutation export scope, and release privacy readiness reviewed."
    ],
    [
      "release-decision",
      "Owner release decision recorded with packaging locked, Phase 3 handoff proof attached, proof-export evidence attached, and security closure proof ready."
    ]
  ] as const)("keeps complete %s ready evidence ready", (gate, detail) => {
    const record = evaluatePhase11EvidenceRecord(
      gate,
      {
        gate,
        state: "ready",
        source: "owner release evidence",
        recordedAt: "2026-06-17T11:00:00.000Z",
        detail
      },
      NOW
    );

    expect(record.state).toBe("ready");
    expect(record.freshness).toBe("fresh");
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

  it("moves incomplete fresh-checkout evidence into review even when fresh", () => {
    const record = evaluatePhase11EvidenceRecord(
      "fresh-checkout",
      {
        gate: "fresh-checkout",
        state: "ready",
        source: "owner fresh checkout",
        recordedAt: "2026-06-17T11:00:00.000Z",
        detail: "Fresh checkout install and test passed."
      },
      NOW
    );

    expect(record).toMatchObject({
      state: "review",
      freshness: "fresh",
      ageHours: 1
    });
    expect(record.detail).toContain("missing checklist coverage");
    expect(record.detail).toContain("build");
    expect(record.detail).toContain("desktop");
    expect(record.detail).toContain("proof-panel");
    expect(record.nextAction).toContain("install, test, build, desktop run, and proof-panel");
  });

  it("keeps complete fresh-checkout evidence ready", () => {
    const record = evaluatePhase11EvidenceRecord(
      "fresh-checkout",
      {
        gate: "fresh-checkout",
        state: "ready",
        source: "owner fresh checkout",
        recordedAt: "2026-06-17T11:00:00.000Z",
        detail: "Fresh checkout install, test, build, desktop run, and proof-panel evidence passed."
      },
      NOW
    );

    expect(record.state).toBe("ready");
    expect(record.nextAction).toContain("Keep fresh-checkout evidence attached");
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

  it("treats release-decision as structured owner evidence", () => {
    const record = evaluatePhase11EvidenceRecord(
      "release-decision",
      {
        gate: "release-decision",
        state: "ready",
        source: "owner release review",
        recordedAt: "2026-06-17T11:30:00.000Z",
        detail:
          "Owner approved the release decision while packaging locked, Phase 3 handoff proof and proof-export evidence stayed attached, and security closure proof was ready."
      },
      NOW
    );

    expect(record).toMatchObject({
      gate: "release-decision",
      label: "Release decision evidence",
      state: "ready",
      freshness: "fresh",
      source: "owner release review",
      ageHours: 0.5
    });
    expect(record.nextAction).toContain("completed Phase 3 clearance PM traceability");
    expect(record.nextAction).toContain(
      "current non-ready proof freshness row actions for handoff/proof-export review"
    );
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
        },
        "signed-audit-export": {
          gate: "signed-audit-export",
          state: "ready",
          source: "owner",
          recordedAt: "2026-06-17T11:15:00.000Z",
          detail:
            "Signed audit export, signature verification, rollback references, no-mutation export scope, and release privacy readiness reviewed."
        },
        "release-decision": {
          gate: "release-decision",
          state: "ready",
          source: "owner",
          recordedAt: "2026-06-17T11:00:00.000Z",
          detail:
            "Owner release decision recorded while packaging locked, Phase 3 handoff proof and proof-export evidence stayed attached, and security closure proof was ready."
        }
      },
      NOW
    );

    expect(summary.state).toBe("blocked");
    expect(summary.statusLabel).toBe("Blocked");
    expect(summary.readiness).toBe(61);
    expect(summary.totalGateCount).toBe(6);
    expect(summary.openGateCount).toBe(4);
    expect(summary.readyCount).toBe(2);
    expect(summary.reviewCount).toBe(2);
    expect(summary.blockedCount).toBe(1);
    expect(summary.waitingCount).toBe(1);
    expect(summary.missingCount).toBe(1);
    expect(summary.malformedCount).toBe(1);
    expect(summary.nextAction).toContain("Repair docs and known limits evidence metadata");
    expect(summary.ariaLabel).toContain("4 open evidence gates");
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
