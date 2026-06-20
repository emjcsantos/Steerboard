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

  it("keeps Phase 11 release traceability progress aligned with owner-visible proof depth", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const phase11Epic = byId.get("phase-11-owner-packaging");
    const releaseParent = byId.get("phase-11-parent-release-packaging");
    const traceabilityChild = byId.get("phase-11-child-traceability");

    expect(phase11Epic?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(releaseParent?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(releaseParent?.description).toContain("owner release traceability status counts");
    expect(traceabilityChild?.description).toContain("linked goal and PM row coverage");
    expect(traceabilityChild?.description).toContain("release hold status");
  });

  it("keeps Phase 7 role-panel progress aligned with dispatch review proof depth", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const rolePanelParent = byId.get("phase-07-parent-role-panels");
    const workerPreviewChild = byId.get("phase-07-child-worker-preview");
    const integrationOwnerChild = byId.get("phase-07-child-integration-owner");
    const integrationDepthChild = byId.get("phase-07-child-integration-ownership-depth");

    expect(rolePanelParent?.completionPercent).toBeGreaterThanOrEqual(
      integrationDepthChild?.completionPercent ?? 0
    );
    expect(workerPreviewChild?.completionPercent).toBeGreaterThanOrEqual(
      integrationDepthChild?.completionPercent ?? 0
    );
    expect(integrationOwnerChild?.completionPercent).toBeGreaterThanOrEqual(
      integrationDepthChild?.completionPercent ?? 0
    );
    expect(rolePanelParent?.description).toContain("handoff packet integrity");
    expect(workerPreviewChild?.description).toContain("validation gate depth");
    expect(integrationOwnerChild?.description).toContain("ownership-depth evidence");
  });

  it("keeps Phase 9 reversible action progress aligned with selected runner proof", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const runnerProbeParent = byId.get("phase-09-parent-runner-probe");
    const reversibleActionChild = byId.get("phase-09-child-reversible-action");
    const traceabilityChild = byId.get("phase-09-child-traceability");

    expect(runnerProbeParent?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(reversibleActionChild?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(runnerProbeParent?.description).toContain("selected-action readiness");
    expect(reversibleActionChild?.description).toContain("no workspace write");
    expect(reversibleActionChild?.description).toContain("no Git operation");
    expect(reversibleActionChild?.description).toContain("no external call");
    expect(reversibleActionChild?.description).toContain("no profile mutation");
  });

  it("keeps Phase 11 proof freshness progress aligned with owner proof depth", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const ownerTestingParent = byId.get("phase-11-parent-owner-testing");
    const proofFreshnessChild = byId.get("phase-11-child-proof-freshness-depth");
    const evidenceRecordsChild = byId.get("phase-11-child-evidence-records");

    expect(ownerTestingParent?.completionPercent).toBeGreaterThanOrEqual(
      proofFreshnessChild?.completionPercent ?? 0
    );
    expect(proofFreshnessChild?.completionPercent).toBeGreaterThanOrEqual(
      evidenceRecordsChild?.completionPercent ?? 0
    );
    expect(proofFreshnessChild?.description).toContain("seven-row readiness");
    expect(proofFreshnessChild?.description).toContain("open-proof counts");
    expect(proofFreshnessChild?.description).toContain("owner-visible safety");
    expect(proofFreshnessChild?.description).toContain("npm.cmd run test:phase3:owner-visible");
  });
});
