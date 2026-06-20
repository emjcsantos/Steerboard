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

  it("keeps Phase 8 risk gate progress aligned with permission and blocker proof", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const riskGateParent = byId.get("phase-08-parent-risk-gates");
    const permissionLabelsChild = byId.get("phase-08-child-permission-labels");
    const riskBlockersChild = byId.get("phase-08-child-risk-blockers");
    const blockerPriorityChild = byId.get("phase-08-child-blocker-priority");

    expect(riskGateParent?.completionPercent).toBeGreaterThanOrEqual(
      permissionLabelsChild?.completionPercent ?? 0
    );
    expect(riskGateParent?.completionPercent).toBeGreaterThanOrEqual(
      riskBlockersChild?.completionPercent ?? 0
    );
    expect(permissionLabelsChild?.completionPercent).toBeGreaterThanOrEqual(
      blockerPriorityChild?.completionPercent ?? 0
    );
    expect(riskBlockersChild?.completionPercent).toBeGreaterThanOrEqual(
      blockerPriorityChild?.completionPercent ?? 0
    );
    expect(permissionLabelsChild?.description).toContain("permissionLabelProof");
    expect(permissionLabelsChild?.description).toContain("permissionLabelSummaryProof total");
    expect(riskBlockersChild?.description).toContain("riskBlockerProof");
    expect(riskBlockersChild?.description).toContain("topBlockerProof source/kind/status");
    expect(riskBlockersChild?.description).toContain("blockerQueueProof open/kind/status");
  });

  it("keeps Phase 8 traceability and blocker priority aligned with risk proof depth", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const riskGateParent = byId.get("phase-08-parent-risk-gates");
    const traceabilityChild = byId.get("phase-08-child-traceability");
    const blockerPriorityChild = byId.get("phase-08-child-blocker-priority");
    const riskExceptionsChild = byId.get("phase-08-child-risk-exceptions");

    expect(riskGateParent?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(riskGateParent?.completionPercent).toBeGreaterThanOrEqual(
      blockerPriorityChild?.completionPercent ?? 0
    );
    expect(traceabilityChild?.completionPercent).toBeGreaterThanOrEqual(
      riskExceptionsChild?.completionPercent ?? 0
    );
    expect(blockerPriorityChild?.completionPercent).toBeGreaterThanOrEqual(
      riskExceptionsChild?.completionPercent ?? 0
    );
    expect(traceabilityChild?.description).toContain("traceabilityProof goal/missing-PM/trust");
    expect(traceabilityChild?.description).toContain("traceabilityRowStateProof ready/review/blocked/waiting");
    expect(blockerPriorityChild?.description).toContain("topBlockerProof source/kind/status");
    expect(blockerPriorityChild?.description).toContain("blockerQueueProof open/kind/status");
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
    const phase7Epic = byId.get("phase-07-dispatch-loop");
    const rolePanelParent = byId.get("phase-07-parent-role-panels");
    const workerPreviewChild = byId.get("phase-07-child-worker-preview");
    const integrationOwnerChild = byId.get("phase-07-child-integration-owner");
    const integrationDepthChild = byId.get("phase-07-child-integration-ownership-depth");
    const traceabilityChild = byId.get("phase-07-child-traceability");
    const blockerPriorityChild = byId.get("phase-07-child-blocker-priority");

    expect(phase7Epic?.completionPercent).toBeGreaterThanOrEqual(
      rolePanelParent?.completionPercent ?? 0
    );
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
    expect(rolePanelParent?.description).toContain("PM coverage");
    expect(workerPreviewChild?.description).toContain("validation gate depth");
    expect(workerPreviewChild?.description).toContain("PM coverage");
    expect(integrationOwnerChild?.description).toContain("ownership-depth evidence");
    expect(integrationOwnerChild?.description).toContain("five-link traceability coverage");
    expect(integrationDepthChild?.description).toContain("five traceability links");
    expect(integrationDepthChild?.description).toContain("open-depth counts");
    expect(traceabilityChild?.completionPercent).toBeGreaterThanOrEqual(
      integrationDepthChild?.completionPercent ?? 0
    );
    expect(blockerPriorityChild?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(traceabilityChild?.description).toContain("PM coverage");
    expect(traceabilityChild?.description).toContain("five-link traceability");
    expect(blockerPriorityChild?.description).toContain("PM coverage");
  });

  it("keeps Phase 7 handoff trace progress aligned with dispatch packet proof", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const observedLoopParent = byId.get("phase-07-parent-observed-loop");
    const handoffTraceChild = byId.get("phase-07-child-handoff-trace");
    const reviewDepthChild = byId.get("phase-07-child-review-depth");
    const traceabilityChild = byId.get("phase-07-child-traceability");

    expect(observedLoopParent?.completionPercent).toBeGreaterThanOrEqual(
      reviewDepthChild?.completionPercent ?? 0
    );
    expect(handoffTraceChild?.completionPercent).toBeGreaterThanOrEqual(
      reviewDepthChild?.completionPercent ?? 0
    );
    expect(handoffTraceChild?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(observedLoopParent?.description).toContain("four per-role handoff packets");
    expect(observedLoopParent?.description).toContain("live-worker lock proof");
    expect(handoffTraceChild?.description).toContain("handoff task counts");
    expect(handoffTraceChild?.description).toContain("four per-role packet ownership");
    expect(handoffTraceChild?.description).toContain("dependency order");
    expect(handoffTraceChild?.description).toContain("local no-runtime boundaries");
  });

  it("keeps Phase 9 reversible action progress aligned with selected runner proof", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const runnerProbeParent = byId.get("phase-09-parent-runner-probe");
    const reversibleActionChild = byId.get("phase-09-child-reversible-action");
    const observabilityChild = byId.get("phase-09-child-runner-observability");
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
    expect(observabilityChild?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(observabilityChild?.description).toContain("validation output evidence key");
    expect(observabilityChild?.description).toContain("current runner evidence fingerprint");
    expect(observabilityChild?.description).toContain("mutation-lock count");
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

  it("keeps Phase 11 package validation aligned with release readiness lock proof", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const releaseParent = byId.get("phase-11-parent-release-packaging");
    const packageValidationChild = byId.get("phase-11-child-package-validation");
    const traceabilityChild = byId.get("phase-11-child-traceability");

    expect(releaseParent?.completionPercent).toBeGreaterThanOrEqual(
      packageValidationChild?.completionPercent ?? 0
    );
    expect(packageValidationChild?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(packageValidationChild?.description).toContain("packaging lock readiness");
    expect(packageValidationChild?.description).toContain("release-decision prerequisite detail");
    expect(packageValidationChild?.description).toContain("local storage repair");
    expect(packageValidationChild?.description).toContain("safety-disabled live actions");
    expect(packageValidationChild?.description).toContain("without executing packaging");
  });

  it("keeps Phase 11 owner checklist and fresh checkout aligned with owner command proof", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const ownerTestingParent = byId.get("phase-11-parent-owner-testing");
    const ownerChecklistChild = byId.get("phase-11-child-owner-checklist");
    const freshCheckoutChild = byId.get("phase-11-child-fresh-checkout");
    const proofFreshnessChild = byId.get("phase-11-child-proof-freshness-depth");

    expect(ownerTestingParent?.completionPercent).toBeGreaterThanOrEqual(
      ownerChecklistChild?.completionPercent ?? 0
    );
    expect(ownerTestingParent?.completionPercent).toBeGreaterThanOrEqual(
      freshCheckoutChild?.completionPercent ?? 0
    );
    expect(ownerChecklistChild?.completionPercent).toBeGreaterThanOrEqual(
      proofFreshnessChild?.completionPercent ?? 0
    );
    expect(freshCheckoutChild?.completionPercent).toBeGreaterThanOrEqual(
      proofFreshnessChild?.completionPercent ?? 0
    );
    expect(ownerChecklistChild?.description).toContain("ready/total owner checklist counts");
    expect(ownerChecklistChild?.description).toContain("priority goal traces");
    expect(freshCheckoutChild?.description).toContain("structured evidence record states");
    expect(freshCheckoutChild?.description).toContain("owner checkout source");
    expect(freshCheckoutChild?.description).toContain("held release-gate actions");
  });

  it("keeps Phase 5 migration review rows aligned with review-depth proof", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const draftParent = byId.get("phase-05-parent-draft-workflow");
    const profileDraftsChild = byId.get("phase-05-child-profile-drafts");
    const rollbackAuditParent = byId.get("phase-05-parent-rollback-audit");
    const previewMetadataChild = byId.get("phase-05-child-preview-metadata");
    const auditSummaryChild = byId.get("phase-05-child-audit-summary");
    const reviewDepthChild = byId.get("phase-05-child-review-depth");
    const traceabilityChild = byId.get("phase-05-child-traceability");
    const blockerPriorityChild = byId.get("phase-05-child-blocker-priority");

    expect(draftParent?.completionPercent).toBeGreaterThanOrEqual(
      profileDraftsChild?.completionPercent ?? 0
    );
    expect(draftParent?.completionPercent).toBeGreaterThanOrEqual(
      previewMetadataChild?.completionPercent ?? 0
    );
    expect(rollbackAuditParent?.completionPercent).toBeGreaterThanOrEqual(
      auditSummaryChild?.completionPercent ?? 0
    );
    expect(rollbackAuditParent?.completionPercent).toBeGreaterThanOrEqual(
      reviewDepthChild?.completionPercent ?? 0
    );
    expect(rollbackAuditParent?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(rollbackAuditParent?.completionPercent).toBeGreaterThanOrEqual(
      blockerPriorityChild?.completionPercent ?? 0
    );
    expect(previewMetadataChild?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(profileDraftsChild?.description).toContain("apply-review-staged audit actions");
    expect(profileDraftsChild?.description).toContain("without changing active profiles or source data");
    expect(rollbackAuditParent?.description).toContain("sensitive-boundary traceability");
    expect(auditSummaryChild?.description).toContain("draft/audit fingerprint match");
    expect(previewMetadataChild?.description).toContain("sensitive-exclusion evidence keys");
    expect(reviewDepthChild?.description).toContain("six separate owner-review records");
    expect(reviewDepthChild?.description).toContain("unique evidence keys");
    expect(traceabilityChild?.description).toContain("source-mutation locks");
    expect(blockerPriorityChild?.description).toContain("source-mutation locks");
  });
});
