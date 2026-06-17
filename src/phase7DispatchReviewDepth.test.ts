import { describe, expect, it } from "vitest";
import { buildDispatchPackage } from "./dispatch";
import { createDispatchRolePanelPlan } from "./dispatchRolePanelPlan";
import type { DispatchReviewRecord } from "./dispatchReviewRecord";
import { createDispatchReviewRecord, DISPATCH_REVIEW_NO_RUNTIME_NOTE } from "./dispatchReviewRecord";
import type { PlanningDraft } from "./planning";
import {
  buildPhase7DispatchReviewDepth
} from "./phase7DispatchReviewDepth";
import { createMockRunFromDispatchPackage } from "./run";

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

  return createDispatchReviewRecord(dispatchPackage, rolePanelPlan, run, {
    createdAt
  });
}

describe("phase 7 dispatch review depth", () => {
  it("waits when no dispatch review record exists", () => {
    const snapshot = buildPhase7DispatchReviewDepth({ records: [] });

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.reviewRecordCount).toBe(0);
    expect(snapshot.openDepthCount).toBe(5);
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
    const record = buildRecord();
    const snapshot = buildPhase7DispatchReviewDepth({ records: [record] });

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
    const record = {
      ...buildRecord(),
      maxAttemptLimit: 5
    };
    const snapshot = buildPhase7DispatchReviewDepth({ records: [record] });

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
    const selected = {
      ...buildRecord("2026-06-12T00:02:00.000Z"),
      validationGateCount: 0
    };
    const snapshot = buildPhase7DispatchReviewDepth({
      records: [latest, selected],
      selectedRecord: selected
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
