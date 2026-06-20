import { describe, expect, it } from "vitest";
import { buildDispatchPackage } from "./dispatch";
import { createDispatchRolePanelPlan } from "./dispatchRolePanelPlan";
import type { DispatchReviewRecord } from "./dispatchReviewRecord";
import {
  createDispatchReviewRecord,
  DISPATCH_REVIEW_MAIN_OWNERSHIP_NOTE
} from "./dispatchReviewRecord";
import { buildPhase7IntegrationOwnershipDepth } from "./phase7IntegrationOwnershipDepth";
import type { PlanningDraft } from "./planning";
import { createMockRunFromDispatchPackage } from "./run";

const project = {
  id: "phase-7-integration-project",
  name: "Phase 7 Integration Project"
};

const draft: PlanningDraft = {
  title: "Own final integration",
  objective: "Keep main integration ownership explicit before worker spawning.",
  targetProjectId: project.id,
  scope: ["Integration owner", "Final validation", "Commit and report owner"],
  fileAreas: ["src/phase7IntegrationOwnershipDepth.ts"],
  acceptanceCriteria: [
    "Main Codex owns final integration.",
    "Worker records remain local metadata."
  ],
  validationPlan: ["npm test -- phase7IntegrationOwnershipDepth"],
  risk: "medium",
  rollbackNote: "Remove local integration ownership rows.",
  deployMode: "staged"
};

function buildRecord(createdAt = "2026-06-13T00:00:00.000Z"): DispatchReviewRecord {
  const dispatchPackage = buildDispatchPackage(draft, project, {
    createdAt,
    idSeed: "phase-7-integration",
    status: "ready"
  });
  const run = createMockRunFromDispatchPackage(dispatchPackage, {
    createdAt,
    idSeed: "phase-7-integration-run",
    status: "queued"
  });
  const rolePanelPlan = createDispatchRolePanelPlan(dispatchPackage, run);

  return createDispatchReviewRecord(dispatchPackage, rolePanelPlan, run, {
    createdAt
  });
}

describe("phase 7 integration ownership depth", () => {
  it("returns ready when Main Codex owns final integration, validation, commit, push approval, reporting, and traceability", () => {
    const record = buildRecord();
    const snapshot = buildPhase7IntegrationOwnershipDepth(record);

    expect(snapshot.state).toBe("ready");
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.openDepthCount).toBe(0);
    expect(snapshot.integrationOwnershipProof).toContain("items=5/5");
    expect(snapshot.integrationOwnershipProof).toContain("integrationOwner=Main Codex");
    expect(snapshot.integrationOwnershipProof).toContain("traceabilityLinks=5/5");
    expect(snapshot.integrationOwnershipProof).toContain("execution=locked");
    expect(snapshot.items.every((item) => item.status === "ready")).toBe(true);
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "integration-owner",
          detail: expect.stringContaining("Main Codex")
        }),
        expect.objectContaining({
          kind: "commit-push-reporting",
          detail: expect.stringContaining("push approval")
        }),
        expect.objectContaining({
          kind: "traceability",
          detail: expect.stringContaining("5/5")
        })
      ])
    );
  });

  it("waits when integration owner or validation gates are missing", () => {
    const snapshot = buildPhase7IntegrationOwnershipDepth({
      ...buildRecord(),
      roleCounts: {
        orchestrator: 1,
        implementer: 1,
        validator: 1,
        integration: 0
      },
      integrationOwner: "",
      validationGateCount: 0
    });

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.waitingCount).toBe(2);
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "integration-owner", status: "waiting" }),
        expect.objectContaining({ kind: "final-validation", status: "waiting" })
      ])
    );
  });

  it("blocks when main ownership or traceability evidence is missing", () => {
    const snapshot = buildPhase7IntegrationOwnershipDepth({
      ...buildRecord(),
      commitPushReportingOwner: "Worker",
      mainIntegrationOwnershipNote: "Worker owns closure.",
      traceabilityLinkCount: 2
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.blockedCount).toBe(2);
    expect(snapshot.nextAction).toContain("Restore the main ownership note");
    expect(snapshot.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "commit-push-reporting", status: "blocked" }),
        expect.objectContaining({ kind: "traceability", status: "blocked" })
      ])
    );
  });

  it("keeps integration ownership text public-safe", () => {
    const snapshot = buildPhase7IntegrationOwnershipDepth(buildRecord());
    const combinedText = [
      snapshot.label,
      snapshot.nextAction,
      snapshot.ariaLabel,
      DISPATCH_REVIEW_MAIN_OWNERSHIP_NOTE,
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
