import { describe, expect, it } from "vitest";
import { buildDispatchPackage } from "./dispatch";
import { createDispatchRolePanelPlan } from "./dispatchRolePanelPlan";
import type { DispatchReviewRecord } from "./dispatchReviewRecord";
import {
  buildCurrentDispatchReviewEvidenceFingerprint,
  createDispatchReviewRecord,
  DISPATCH_REVIEW_NO_RUNTIME_NOTE
} from "./dispatchReviewRecord";
import type { PlanningDraft } from "./planning";
import {
  buildPhase7DispatchReviewDepth
} from "./phase7DispatchReviewDepth";
import { createMockRunFromDispatchPackage, type MockOrchestratorRun } from "./run";

const project = {
  id: "phase-7-project",
  name: "Phase 7 Project"
};

const draft: PlanningDraft = {
  title: "Review dispatch depth",
  objective: "Create explicit review depth before worker spawning.",
  targetProjectId: project.id,
  scope: ["Role counts", "Attempt limits", "Handoff depth", "Validation depth"],
  fileAreas: ["src/phase7DispatchReviewDepth.ts"],
  acceptanceCriteria: [
    "Dispatch depth explains each launch blocker.",
    "Live worker execution remains locked."
  ],
  validationPlan: ["npm test -- phase7DispatchReviewDepth"],
  risk: "medium",
  rollbackNote: "Remove the local dispatch review depth record.",
  deployMode: "staged"
};

function buildRecord(
  createdAt = "2026-06-12T00:00:00.000Z"
): DispatchReviewRecord {
  return buildRecordBundle(createdAt).record;
}

function buildRecordBundle(
  createdAt = "2026-06-12T00:00:00.000Z"
): { record: DispatchReviewRecord; run: MockOrchestratorRun } {
  const dispatchPackage = buildDispatchPackage(draft, project, {
    createdAt,
    idSeed: "phase-7-depth",
    status: "ready"
  });
  const run = createMockRunFromDispatchPackage(dispatchPackage, {
    createdAt,
    idSeed: "phase-7-depth-run",
    status: "queued"
  });
  const rolePanelPlan = createDispatchRolePanelPlan(dispatchPackage, run);

  return {
    record: createDispatchReviewRecord(dispatchPackage, rolePanelPlan, run, {
      createdAt
    }),
    run
  };
}

function currentFingerprint(record: DispatchReviewRecord, run: MockOrchestratorRun): string {
  return buildCurrentDispatchReviewEvidenceFingerprint(record, run);
}

describe("phase 7 dispatch review depth", () => {
  it("waits when no dispatch review record exists", () => {
    const snapshot = buildPhase7DispatchReviewDepth({ records: [] });

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.reviewRecordCount).toBe(0);
    expect(snapshot.openDepthCount).toBe(7);
    expect(snapshot.nextAction).toContain("Stage a PM row");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Live worker lock",
          status: "waiting"
        })
      ])
    );
  });

  it("returns ready when role coverage, attempts, handoff, validation, and lock are present", () => {
    const { record, run } = buildRecordBundle();
    const snapshot = buildPhase7DispatchReviewDepth({
      records: [record],
      currentEvidenceFingerprint: currentFingerprint(record, run)
    });

    expect(snapshot.state).toBe("ready");
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.roleCoverageCount).toBe(4);
    expect(snapshot.maxAttemptLimit).toBe(3);
    expect(snapshot.handoffTaskCount).toBeGreaterThan(0);
    expect(snapshot.validationGateCount).toBe(1);
    expect(snapshot.openDepthCount).toBe(0);
    expect(snapshot.items.every((item) => item.status === "ready")).toBe(true);
    expect(snapshot.safety).toContain("does not spawn workers");
  });

  it("reviews oversized attempt limits while keeping the execution lock ready", () => {
    const { record: baseRecord, run } = buildRecordBundle();
    const record = {
      ...baseRecord,
      maxAttemptLimit: 5
    };
    const snapshot = buildPhase7DispatchReviewDepth({
      records: [record],
      currentEvidenceFingerprint: currentFingerprint(baseRecord, run)
    });

    expect(snapshot.state).toBe("review");
    expect(snapshot.openDepthCount).toBe(1);
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Attempt limits",
          status: "review",
          nextAction: expect.stringContaining("Review retry limits")
        }),
        expect.objectContaining({
          label: "Live worker lock",
          status: "ready"
        })
      ])
    );
  });

  it("blocks when role coverage or the no-runtime execution note is missing", () => {
    const record = {
      ...buildRecord(),
      panelCount: 0,
      roleCounts: {
        orchestrator: 0,
        implementer: 0,
        validator: 0,
        integration: 0
      },
      noRuntimeExecutionNote: "Worker sessions can launch now."
    };
    const snapshot = buildPhase7DispatchReviewDepth({ records: [record] });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Role coverage",
          status: "blocked"
        }),
        expect.objectContaining({
          label: "Live worker lock",
          status: "blocked",
          nextAction: expect.stringContaining("Restore the local metadata-only")
        })
      ])
    );
  });

  it("prefers the selected record over the latest record", () => {
    const latest = buildRecord("2026-06-12T00:01:00.000Z");
    const { record: selectedBase, run } = buildRecordBundle("2026-06-12T00:02:00.000Z");
    const selected = {
      ...selectedBase,
      validationGateCount: 0
    };
    const snapshot = buildPhase7DispatchReviewDepth({
      records: [latest, selected],
      selectedRecord: selected,
      currentEvidenceFingerprint: currentFingerprint(selectedBase, run)
    });

    expect(snapshot.latestRecordId).toBe(selected.id);
    expect(snapshot.state).toBe("waiting");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Validation gates",
          status: "waiting"
        })
      ])
    );
  });

  it("reviews legacy records without persisted handoff packet summaries", () => {
    const { record, run } = buildRecordBundle();
    const legacyRecord = {
      ...record,
      handoffPackets: []
    };
    const snapshot = buildPhase7DispatchReviewDepth({
      records: [legacyRecord],
      currentEvidenceFingerprint: currentFingerprint(record, run)
    });

    expect(snapshot.state).toBe("review");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "handoff-packet",
          status: "review",
          nextAction: expect.stringContaining("Restage")
        })
      ])
    );
  });

  it("repairs older in-memory records with missing handoff packet arrays without throwing", () => {
    const { record, run } = buildRecordBundle();
    const legacyRecord = { ...record } as Partial<DispatchReviewRecord> as DispatchReviewRecord;
    delete (legacyRecord as Partial<DispatchReviewRecord>).handoffPackets;

    const snapshot = buildPhase7DispatchReviewDepth({
      records: [legacyRecord],
      currentEvidenceFingerprint: currentFingerprint(record, run)
    });

    expect(snapshot.state).toBe("review");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "handoff-packet",
          status: "review"
        })
      ])
    );
  });

  it("reviews stale dispatch review records when saved evidence no longer matches the current run", () => {
    const { record, run } = buildRecordBundle();
    const staleRun = {
      ...run,
      status: "complete" as const,
      tasks: run.tasks.map((task) => ({ ...task, status: "accepted" as const }))
    };
    const snapshot = buildPhase7DispatchReviewDepth({
      records: [record],
      currentEvidenceFingerprint: currentFingerprint(record, staleRun)
    });

    expect(snapshot.state).toBe("review");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "evidence-freshness",
          status: "review",
          nextAction: expect.stringContaining("restage")
        })
      ])
    );
  });

  it("keeps dispatch review depth text public-safe", () => {
    const record = buildRecord();
    const snapshot = buildPhase7DispatchReviewDepth({ records: [record] });
    const combinedText = [
      snapshot.label,
      snapshot.nextAction,
      snapshot.safety,
      snapshot.ariaLabel,
      DISPATCH_REVIEW_NO_RUNTIME_NOTE,
      ...snapshot.items.flatMap((item) => [
        item.label,
        item.detail,
        item.nextAction
      ])
    ].join(" ");

    expect(combinedText).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(combinedText).not.toMatch(/[\\/](Users|Projects|Documents|Desktop)[\\/]/i);
    expect(combinedText).not.toContain("<");
    expect(combinedText).not.toContain(">");
  });
});
