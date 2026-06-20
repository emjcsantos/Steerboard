import { describe, expect, it } from "vitest";
import { createDefaultProjectManagementPhasePlan } from "./projectManagementPhasePlan";

describe("project management phase plan", () => {
  it("keeps Phase 1/2/6 priority Epic and Parent progress aligned with proof depth", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const priorityProgressRows = [
      "phase-01-live-chat",
      "phase-01-parent-single-panel",
      "phase-01-parent-owner-check",
      "phase-02-multi-panel",
      "phase-02-parent-panel-identity",
      "phase-02-parent-session-persistence",
      "phase-06-planning-lane",
      "phase-06-parent-phase-board",
      "phase-06-parent-arena-staging"
    ];

    for (const rowId of priorityProgressRows) {
      expect(byId.get(rowId)?.completionPercent, rowId).toBeGreaterThanOrEqual(65);
    }
  });

  it("keeps Phase 8 audit parent progress aligned with proof depth", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const auditParent = byId.get("phase-08-parent-audit-log");
    const auditPersistenceChild = byId.get("phase-08-child-audit-persistence");

    expect(auditParent?.completionPercent).toBeGreaterThanOrEqual(
      auditPersistenceChild?.completionPercent ?? 0
    );
    expect(auditParent?.description).toContain("auditPersistenceProof");
  });
});
