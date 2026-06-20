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

  it("keeps Phase 4 catalog and refresh rows aligned with structured proof depth", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const catalogParent = byId.get("phase-04-parent-catalogs");
    const commandSkillChild = byId.get("phase-04-child-command-skill");
    const pluginMcpChild = byId.get("phase-04-child-plugin-mcp");
    const catalogDepthChild = byId.get("phase-04-child-catalog-depth");
    const refreshParent = byId.get("phase-04-parent-refresh-safety");
    const refreshSmokeChild = byId.get("phase-04-child-refresh-smoke");
    const refreshSafetyDepthChild = byId.get("phase-04-child-refresh-safety-depth");

    expect(catalogParent?.completionPercent).toBe(100);
    expect(commandSkillChild?.completionPercent).toBe(100);
    expect(pluginMcpChild?.completionPercent).toBe(100);
    expect(catalogDepthChild?.completionPercent).toBe(100);
    expect(refreshParent?.completionPercent).toBe(100);
    expect(refreshSmokeChild?.completionPercent).toBe(100);
    expect(refreshSafetyDepthChild?.completionPercent).toBe(100);
    expect(catalogParent?.completionPercent).toBeGreaterThanOrEqual(
      catalogDepthChild?.completionPercent ?? 0
    );
    expect(refreshParent?.completionPercent).toBeGreaterThanOrEqual(
      refreshSafetyDepthChild?.completionPercent ?? 0
    );
    expect(commandSkillChild?.description).toContain("commandScopeProof");
    expect(commandSkillChild?.description).toContain("skillInvocationProof");
    expect(pluginMcpChild?.description).toContain("pluginSurfaceProof");
    expect(pluginMcpChild?.description).toContain("mcpToolPolicyProof");
    expect(catalogDepthChild?.description).toContain("catalogDepthProof");
    expect(refreshSmokeChild?.description).toContain("refreshSmokeProof");
    expect(refreshSafetyDepthChild?.description).toContain("refreshSafetyDepthProof");
  });

  it("keeps Phase 4 surface and record-chain rows aligned with structured proof depth", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const catalogParent = byId.get("phase-04-parent-catalogs");
    const surfaceDepthChild = byId.get("phase-04-child-surface-depth");
    const approvalRecordChild = byId.get("phase-04-child-approval-record");
    const auditRecordChild = byId.get("phase-04-child-audit-record");
    const rollbackRecordChild = byId.get("phase-04-child-rollback-record");
    const permissionRecordChild = byId.get("phase-04-child-permission-record");
    const traceabilityChild = byId.get("phase-04-child-traceability");
    const blockerPriorityChild = byId.get("phase-04-child-blocker-priority");
    const completionStatusChild = byId.get("phase-04-child-completion-status");

    for (const row of [
      surfaceDepthChild,
      approvalRecordChild,
      auditRecordChild,
      rollbackRecordChild,
      permissionRecordChild,
      traceabilityChild,
      blockerPriorityChild,
      completionStatusChild
    ]) {
      expect(row?.completionPercent, row?.id).toBe(100);
      expect(catalogParent?.completionPercent).toBeGreaterThanOrEqual(row?.completionPercent ?? 0);
    }
    expect(surfaceDepthChild?.description).toContain("surfaceDepthProof");
    expect(surfaceDepthChild?.description).toContain("localRecordValidationProof");
    expect(approvalRecordChild?.description).toContain("approvalChainProof");
    expect(auditRecordChild?.description).toContain("auditChainProof");
    expect(rollbackRecordChild?.description).toContain("rollbackChainProof");
    expect(permissionRecordChild?.description).toContain("permissionChainProof");
    expect(traceabilityChild?.description).toContain("traceabilityProof");
    expect(blockerPriorityChild?.description).toContain("blockerPriorityProof");
    expect(completionStatusChild?.description).toContain("phase4ProviderCompletionStatusProof");
  });

  it("keeps Phase 8 audit parent progress aligned with proof depth", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const auditParent = byId.get("phase-08-parent-audit-log");
    const auditPersistenceChild = byId.get("phase-08-child-audit-persistence");
    const ownerReviewHandoffChild = byId.get("phase-08-child-owner-review-handoff");
    const completionGateChild = byId.get("phase-08-child-completion-gate");
    const closureAuditStatusChild = byId.get("phase-08-child-closure-audit-status");
    const ownerActionHandoffChild = byId.get("phase-08-child-owner-action-handoff");
    const auditReviewBlockerHandoffChild = byId.get(
      "phase-08-child-audit-review-blocker-handoff"
    );
    const ownerReviewClosureReadinessChild = byId.get(
      "phase-08-child-owner-review-closure-readiness"
    );
    const finalCompletionHandoffChild = byId.get(
      "phase-08-child-final-completion-handoff"
    );
    const closeoutStatusChild = byId.get("phase-08-child-closeout-status");

    expect(auditParent?.completionPercent).toBe(100);
    expect(auditPersistenceChild?.completionPercent).toBe(80);
    expect(ownerReviewHandoffChild?.completionPercent).toBe(84);
    expect(completionGateChild?.completionPercent).toBe(90);
    expect(closureAuditStatusChild?.completionPercent).toBe(92);
    expect(ownerActionHandoffChild?.completionPercent).toBe(94);
    expect(auditReviewBlockerHandoffChild?.completionPercent).toBe(96);
    expect(ownerReviewClosureReadinessChild?.completionPercent).toBe(100);
    expect(finalCompletionHandoffChild?.completionPercent).toBe(100);
    expect(closeoutStatusChild?.completionPercent).toBe(100);
    expect(auditParent?.completionPercent).toBeGreaterThanOrEqual(
      auditPersistenceChild?.completionPercent ?? 0
    );
    expect(auditParent?.completionPercent).toBeGreaterThanOrEqual(
      completionGateChild?.completionPercent ?? 0
    );
    expect(auditParent?.completionPercent).toBeGreaterThanOrEqual(
      ownerReviewHandoffChild?.completionPercent ?? 0
    );
    expect(auditParent?.completionPercent).toBeGreaterThanOrEqual(
      closureAuditStatusChild?.completionPercent ?? 0
    );
    expect(auditParent?.completionPercent).toBeGreaterThanOrEqual(
      ownerActionHandoffChild?.completionPercent ?? 0
    );
    expect(auditParent?.completionPercent).toBeGreaterThanOrEqual(
      auditReviewBlockerHandoffChild?.completionPercent ?? 0
    );
    expect(auditParent?.completionPercent).toBeGreaterThanOrEqual(
      ownerReviewClosureReadinessChild?.completionPercent ?? 0
    );
    expect(auditParent?.completionPercent).toBeGreaterThanOrEqual(
      finalCompletionHandoffChild?.completionPercent ?? 0
    );
    expect(auditParent?.completionPercent).toBeGreaterThanOrEqual(
      closeoutStatusChild?.completionPercent ?? 0
    );
    expect(auditParent?.description).toContain("auditPersistenceProof");
    expect(auditParent?.description).toContain("current-fingerprint proof");
    expect(auditParent?.description).toContain("reviewed-blocker proof");
    expect(auditParent?.description).toContain("phase8AuditReviewHandoffProof");
    expect(auditParent?.description).toContain("artifact-state/fingerprint-current/reviewed-blocker");
    expect(auditParent?.description).toContain("phase8PermissionAuditCompletionGate");
    expect(auditParent?.description).toContain("handoff-ready/fingerprint-current proof");
    expect(auditParent?.description).toContain("phase8ClosureAuditStatusProof");
    expect(auditParent?.description).toContain("phase8OwnerActionHandoffProof");
    expect(auditParent?.description).toContain("owner-action clearance");
    expect(auditParent?.description).toContain("phase8AuditReviewBlockerHandoffProof");
    expect(auditParent?.description).toContain("reviewable-blocker handoff");
    expect(auditParent?.description).toContain("phase8OwnerReviewClosureReadinessProof");
    expect(auditParent?.description).toContain("phase8FinalCompletionHandoffProof");
    expect(auditParent?.description).toContain("phase8CloseoutStatusProof");
    expect(auditParent?.description).toContain("Phase 9 handoff readiness");
    expect(auditParent?.description).toContain("closure gates");
    expect(auditParent?.description).toContain("state/readiness/record/open-exception counts");
    expect(auditPersistenceChild?.description).toContain("auditPersistenceProof");
    expect(auditPersistenceChild?.description).toContain(
      "state/readiness/record/open-exception/fingerprint-current counts"
    );
    expect(auditPersistenceChild?.description).toContain("current-fingerprint");
    expect(auditPersistenceChild?.description).toContain("reviewed-blocker");
    expect(completionGateChild?.description).toContain("phase8PermissionAuditCompletionGate");
    expect(completionGateChild?.description).toContain("phase8AuditReviewHandoffProof");
    expect(completionGateChild?.description).toContain("current fingerprint");
    expect(completionGateChild?.description).toContain("mutation paths locked");
    expect(closureAuditStatusChild?.description).toContain("phase8ClosureAuditStatusProof");
    expect(closureAuditStatusChild?.description).toContain("blocked-category counts");
    expect(ownerActionHandoffChild?.description).toContain("phase8OwnerActionHandoffProof");
    expect(ownerActionHandoffChild?.description).toContain("owner-action-clear proof");
    expect(auditReviewBlockerHandoffChild?.description).toContain(
      "phase8AuditReviewBlockerHandoffProof"
    );
    expect(auditReviewBlockerHandoffChild?.description).toContain("reviewable-blocker handoff");
    expect(ownerReviewClosureReadinessChild?.description).toContain(
      "phase8OwnerReviewClosureReadinessProof"
    );
    expect(ownerReviewClosureReadinessChild?.description).toContain("can-close counts");
    expect(ownerReviewClosureReadinessChild?.description).toContain("phase8CloseoutStatusProof");
    expect(finalCompletionHandoffChild?.description).toContain(
      "phase8FinalCompletionHandoffProof"
    );
    expect(finalCompletionHandoffChild?.description).toContain("phase8CloseoutStatusProof");
    expect(finalCompletionHandoffChild?.description).toContain("top-hold counts");
    expect(finalCompletionHandoffChild?.description).toContain("Phase 9");
    expect(closeoutStatusChild?.description).toContain("phase8CloseoutStatusProof");
    expect(closeoutStatusChild?.description).toContain("phase9-dependency");
    expect(closeoutStatusChild?.description).toContain("mutation paths stay locked");
    expect(ownerReviewHandoffChild?.description).toContain("phase8AuditReviewHandoffProof");
    expect(ownerReviewHandoffChild?.description).toContain("artifactState/fingerprintCurrent/reviewedBlocker");
    expect(ownerReviewHandoffChild?.description).toContain("current top blocker");
  });

  it("keeps Phase 8 risk gate progress aligned with permission and blocker proof", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const riskGateParent = byId.get("phase-08-parent-risk-gates");
    const permissionLabelsChild = byId.get("phase-08-child-permission-labels");
    const riskBlockersChild = byId.get("phase-08-child-risk-blockers");
    const blockerPriorityChild = byId.get("phase-08-child-blocker-priority");
    const riskClosureChild = byId.get("phase-08-child-risk-closure");

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
    expect(riskGateParent?.completionPercent).toBeGreaterThanOrEqual(
      riskClosureChild?.completionPercent ?? 0
    );
    expect(riskGateParent?.completionPercent).toBe(76);
    expect(permissionLabelsChild?.completionPercent).toBe(65);
    expect(riskBlockersChild?.completionPercent).toBe(65);
    expect(blockerPriorityChild?.completionPercent).toBe(65);
    expect(riskClosureChild?.completionPercent).toBe(76);
    expect(riskGateParent?.description).toContain("permissionLabelSummaryProof");
    expect(riskGateParent?.description).toContain("topBlockerProof");
    expect(riskGateParent?.description).toContain("blockerQueueProof");
    expect(riskGateParent?.description).toContain("phase8RiskClosureProof");
    expect(permissionLabelsChild?.description).toContain("permissionLabelProof");
    expect(permissionLabelsChild?.description).toContain("permissionLabelSummaryProof total");
    expect(riskBlockersChild?.description).toContain("riskBlockerProof");
    expect(riskBlockersChild?.description).toContain("topBlockerProof source/kind/status");
    expect(riskBlockersChild?.description).toContain("blockerQueueProof open/kind/status");
    expect(riskClosureChild?.description).toContain("phase8RiskClosureProof");
  });

  it("keeps Phase 3 clearance PM rows aligned with completion status proof", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const phase3Epic = byId.get("phase-03-controls-slash");
    const proofParent = byId.get("phase-03-parent-proof-clearance");
    const smokeRowsChild = byId.get("phase-03-child-smoke-rows");
    const exitGateChild = byId.get("phase-03-child-exit-gate");
    const commandPlanChild = byId.get("phase-03-child-command-plan");
    const blockerPriorityChild = byId.get("phase-03-child-blocker-priority");
    const traceabilityChild = byId.get("phase-03-child-traceability");
    const proofExportChild = byId.get("phase-03-child-proof-export-boundary");
    const handoffGateChild = byId.get("phase-03-child-handoff-gate");
    const completionStatusChild = byId.get("phase-03-child-clearance-completion-status");
    const slashParent = byId.get("phase-03-parent-slash-controls");
    const slashReadyChild = byId.get("phase-03-child-slash-ready");
    const controlReadyChild = byId.get("phase-03-child-control-ready");

    for (const row of [
      phase3Epic,
      proofParent,
      smokeRowsChild,
      exitGateChild,
      commandPlanChild,
      blockerPriorityChild,
      traceabilityChild,
      proofExportChild,
      handoffGateChild,
      completionStatusChild,
      slashParent,
      slashReadyChild,
      controlReadyChild
    ]) {
      expect(row?.completionPercent, row?.id).toBe(100);
      expect(row?.description, row?.id).toContain("phase3ClearanceCompletionStatusProof");
    }
    expect(completionStatusChild?.description).toContain("phase4");
    expect(completionStatusChild?.description).toContain("pmLinks");
    expect(completionStatusChild?.description).toContain("execution and pushing stay owner-held");
  });

  it("keeps Phase 8 traceability and blocker priority aligned with risk proof depth", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const riskGateParent = byId.get("phase-08-parent-risk-gates");
    const traceabilityChild = byId.get("phase-08-child-traceability");
    const blockerPriorityChild = byId.get("phase-08-child-blocker-priority");
    const riskClosureChild = byId.get("phase-08-child-risk-closure");
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
    expect(riskClosureChild?.completionPercent).toBeGreaterThanOrEqual(
      riskExceptionsChild?.completionPercent ?? 0
    );
    expect(traceabilityChild?.description).toContain("traceabilityProof goal/missing-PM/trust");
    expect(traceabilityChild?.description).toContain("traceabilityRowStateProof ready/review/blocked/waiting");
    expect(blockerPriorityChild?.description).toContain("topBlockerProof source/kind/status");
    expect(blockerPriorityChild?.description).toContain("blockerQueueProof open/kind/status");
    expect(riskExceptionsChild?.completionPercent).toBe(65);
    expect(traceabilityChild?.completionPercent).toBe(65);
    expect(blockerPriorityChild?.completionPercent).toBe(65);
    expect(riskClosureChild?.completionPercent).toBe(76);
    expect(riskExceptionsChild?.description).toContain("riskExceptionProof");
    expect(riskExceptionsChild?.description).toContain("riskExceptionSummaryProof severity/status/ready");
  });

  it("keeps Phase 11 release traceability progress aligned with owner-visible proof depth", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const phase11Epic = byId.get("phase-11-owner-packaging");
    const releaseParent = byId.get("phase-11-parent-release-packaging");
    const traceabilityChild = byId.get("phase-11-child-traceability");
    const blockerPriorityChild = byId.get("phase-11-child-blocker-priority");

    expect(phase11Epic?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(releaseParent?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(releaseParent?.completionPercent).toBeGreaterThanOrEqual(
      blockerPriorityChild?.completionPercent ?? 0
    );
    expect(phase11Epic?.completionPercent).toBe(74);
    expect(releaseParent?.completionPercent).toBe(74);
    expect(traceabilityChild?.completionPercent).toBe(74);
    expect(releaseParent?.description).toContain("owner release traceability status counts");
    expect(traceabilityChild?.description).toContain("linked goal and PM row coverage");
    expect(traceabilityChild?.description).toContain("release hold status");
    expect(blockerPriorityChild?.completionPercent).toBe(74);
    expect(blockerPriorityChild?.description).toContain("open blocker count");
    expect(blockerPriorityChild?.description).toContain("owner-review addressable count");
    expect(blockerPriorityChild?.description).toContain("top-priority action detail");
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
    expect(phase7Epic?.completionPercent).toBe(100);
    expect(rolePanelParent?.completionPercent).toBe(100);
    expect(workerPreviewChild?.completionPercent).toBe(100);
    expect(integrationOwnerChild?.completionPercent).toBe(100);
    expect(integrationDepthChild?.completionPercent).toBe(100);
    expect(phase7Epic?.description).toContain("offline dispatch-review artifact verification");
    expect(phase7Epic?.description).toContain("owner-visible live-worker launch-gate proof");
    expect(phase7Epic?.description).toContain("metadata closure-gate proof");
    expect(phase7Epic?.description).toContain("aggregate closeout proof");
    expect(phase7Epic?.description).toContain("owner handoff report proof");
    expect(phase7Epic?.description).toContain("phase7DispatchCompletionGate proof");
    expect(workerPreviewChild?.description).toContain("offline artifact verification");
    expect(workerPreviewChild?.description).toContain("launch-gate canSpawn=no proof");
    expect(workerPreviewChild?.description).toContain("closure-gate canClose metadata proof");
    expect(workerPreviewChild?.description).toContain("closeoutProof state");
    expect(workerPreviewChild?.description).toContain("ownerHandoffProof");
    expect(workerPreviewChild?.description).toContain("phase7DispatchCompletionGate proof");
    expect(integrationDepthChild?.description).toContain("artifact verification");
    expect(integrationDepthChild?.description).toContain("launch-gate lock ownership");
    expect(integrationDepthChild?.description).toContain("closure-gate readiness");
    expect(integrationDepthChild?.description).toContain("aggregate closeout readiness");
    expect(integrationDepthChild?.description).toContain("owner handoff readiness");
    expect(integrationDepthChild?.description).toContain("completion-gate readiness");
    expect(rolePanelParent?.description).toContain("handoff packet integrity");
    expect(rolePanelParent?.description).toContain("PM coverage");
    expect(rolePanelParent?.description).toContain("integrationOwnershipProof");
    expect(rolePanelParent?.description).toContain("live-worker launch-gate proof");
    expect(rolePanelParent?.description).toContain("metadata closure-gate proof");
    expect(rolePanelParent?.description).toContain("aggregate closeout proof");
    expect(rolePanelParent?.description).toContain("owner handoff report proof");
    expect(rolePanelParent?.description).toContain("phase7DispatchCompletionGate proof");
    expect(workerPreviewChild?.description).toContain("validation gate depth");
    expect(workerPreviewChild?.description).toContain("dispatchReviewDepthProof");
    expect(workerPreviewChild?.description).toContain("PM coverage");
    expect(integrationOwnerChild?.description).toContain("integrationOwnershipProof");
    expect(integrationOwnerChild?.description).toContain("five-link traceability coverage");
    expect(integrationDepthChild?.description).toContain("five traceability links");
    expect(integrationDepthChild?.description).toContain("open-depth counts");
    expect(integrationDepthChild?.description).toContain("integrationOwnershipProof");
    expect(traceabilityChild?.completionPercent).toBeGreaterThanOrEqual(
      integrationDepthChild?.completionPercent ?? 0
    );
    expect(blockerPriorityChild?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(traceabilityChild?.description).toContain("PM coverage");
    expect(traceabilityChild?.description).toContain("five-link traceability");
    expect(traceabilityChild?.description).toContain("dispatchTraceabilityProof");
    expect(blockerPriorityChild?.description).toContain("PM coverage");
    expect(blockerPriorityChild?.description).toContain("dispatchBlockerPriorityProof");
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
    expect(observedLoopParent?.description).toContain("artifact verification");
    expect(observedLoopParent?.description).toContain("live-worker launch-gate proof");
    expect(observedLoopParent?.description).toContain("metadata closure-gate proof");
    expect(observedLoopParent?.description).toContain("aggregate closeout proof");
    expect(observedLoopParent?.description).toContain("owner handoff report proof");
    expect(observedLoopParent?.description).toContain("phase7DispatchCompletionGate proof");
    expect(observedLoopParent?.description).toContain("live-worker lock proof");
    expect(handoffTraceChild?.description).toContain("handoff task counts");
    expect(handoffTraceChild?.description).toContain("four per-role packet ownership");
    expect(handoffTraceChild?.description).toContain("dependency order");
    expect(handoffTraceChild?.description).toContain("offline artifact verification");
    expect(handoffTraceChild?.description).toContain("launch-gate proof");
    expect(handoffTraceChild?.description).toContain("closure-gate proof");
    expect(handoffTraceChild?.description).toContain("closeoutProof state");
    expect(handoffTraceChild?.description).toContain("ownerHandoffProof");
    expect(handoffTraceChild?.description).toContain("phase7DispatchCompletionGate proof");
    expect(handoffTraceChild?.description).toContain("local no-runtime boundaries");
  });

  it("keeps Phase 9 reversible action progress aligned with selected runner proof", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const runnerProbeParent = byId.get("phase-09-parent-runner-probe");
    const reversibleActionChild = byId.get("phase-09-child-reversible-action");
    const observabilityChild = byId.get("phase-09-child-runner-observability");
    const traceabilityChild = byId.get("phase-09-child-traceability");
    const completionGateChild = byId.get("phase-09-child-completion-gate");

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
    expect(runnerProbeParent?.completionPercent).toBe(67);
    expect(reversibleActionChild?.completionPercent).toBe(67);
    expect(observabilityChild?.completionPercent).toBe(67);
    expect(traceabilityChild?.completionPercent).toBe(67);
    expect(completionGateChild?.completionPercent).toBe(67);
    expect(runnerProbeParent?.description).toContain("runner approval proof summary");
    expect(runnerProbeParent?.description).toContain("phase9RequestGateProof");
    expect(runnerProbeParent?.description).toContain("phase9RunnerCompletionGateProof");
    expect(observabilityChild?.description).toContain("validation output evidence key");
    expect(observabilityChild?.description).toContain("current runner evidence fingerprint");
    expect(observabilityChild?.description).toContain("phase9RequestGateProof");
    expect(observabilityChild?.description).toContain("phase9RunnerCompletionGateProof");
    expect(observabilityChild?.description).toContain("proof summaries");
    expect(observabilityChild?.description).toContain("mutation-lock count");
    expect(traceabilityChild?.description).toContain("phase9RequestGateProof");
    expect(traceabilityChild?.description).toContain("phase9RunnerCompletionGateProof");
    expect(traceabilityChild?.description).toContain("traceability proof summary");
    expect(completionGateChild?.description).toContain("phase9RunnerCompletionGateProof");
    expect(completionGateChild?.description).toContain("fixed terminal-readonly-probe");
    expect(completionGateChild?.description).toContain("broader runner actions stay locked");
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
    expect(ownerTestingParent?.completionPercent).toBe(72);
    expect(proofFreshnessChild?.completionPercent).toBe(72);
    expect(evidenceRecordsChild?.completionPercent).toBe(72);
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
    expect(releaseParent?.completionPercent).toBe(74);
    expect(packageValidationChild?.completionPercent).toBe(74);
    expect(traceabilityChild?.completionPercent).toBe(74);
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
    expect(ownerTestingParent?.completionPercent).toBe(72);
    expect(ownerChecklistChild?.completionPercent).toBe(72);
    expect(freshCheckoutChild?.completionPercent).toBe(72);
    expect(proofFreshnessChild?.completionPercent).toBe(72);
    expect(ownerChecklistChild?.description).toContain("ready/total owner checklist counts");
    expect(ownerChecklistChild?.description).toContain("priority goal traces");
    expect(freshCheckoutChild?.description).toContain("structured evidence record states");
    expect(freshCheckoutChild?.description).toContain("owner checkout source");
    expect(freshCheckoutChild?.description).toContain("held release-gate actions");
  });

  it("keeps Phase 10 Arena polish blocker rows aligned with evidence-only proof depth", () => {
    const tasks = createDefaultProjectManagementPhasePlan();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const phase10Epic = byId.get("phase-10-adaptive-arena");
    const layoutFoundationParent = byId.get("phase-10-parent-layout-foundation");
    const arenaIdentityParent = byId.get("phase-10-parent-arena-identity");
    const flexLayoutSpikeChild = byId.get("phase-10-child-flexlayout-spike");
    const traceabilityChild = byId.get("phase-10-child-traceability");
    const blockerPriorityChild = byId.get("phase-10-child-blocker-priority");

    expect(phase10Epic?.completionPercent).toBeGreaterThanOrEqual(
      blockerPriorityChild?.completionPercent ?? 0
    );
    expect(layoutFoundationParent?.completionPercent).toBeGreaterThanOrEqual(
      flexLayoutSpikeChild?.completionPercent ?? 0
    );
    expect(arenaIdentityParent?.completionPercent).toBeGreaterThanOrEqual(
      blockerPriorityChild?.completionPercent ?? 0
    );
    expect(traceabilityChild?.completionPercent).toBeGreaterThanOrEqual(
      blockerPriorityChild?.completionPercent ?? 0
    );
    expect(phase10Epic?.completionPercent).toBe(65);
    expect(phase10Epic?.description).toContain("npm.cmd run test:phase10:owner-visible");
    expect(phase10Epic?.description).toContain("traceabilityProof");
    expect(phase10Epic?.description).toContain("blockerPriorityProof");
    expect(flexLayoutSpikeChild?.completionPercent).toBe(65);
    expect(flexLayoutSpikeChild?.description).toContain("dependency-install status");
    expect(flexLayoutSpikeChild?.description).toContain("decisionProof");
    expect(flexLayoutSpikeChild?.description).toContain("traceabilityProof");
    expect(flexLayoutSpikeChild?.description).toContain("blockerPriorityProof");
    expect(flexLayoutSpikeChild?.description).toContain("custom adaptive-grid fallback");
    expect(traceabilityChild?.completionPercent).toBe(65);
    expect(traceabilityChild?.description).toContain("npm.cmd run test:phase10:owner-visible");
    expect(traceabilityChild?.description).toContain("traceabilityProof goal/missing-PM/trust");
    expect(blockerPriorityChild?.completionPercent).toBe(65);
    expect(blockerPriorityChild?.description).toContain("owner-visible proof");
    expect(blockerPriorityChild?.description).toContain("blockerPriorityProof open/kind/status");
    expect(blockerPriorityChild?.description).toContain("open blocker count");
    expect(blockerPriorityChild?.description).toContain("Arena-review addressable count");
    expect(blockerPriorityChild?.description).toContain("top-priority action detail");
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
    const applyDecisionChild = byId.get("phase-05-child-apply-decision-gate");
    const ownerApprovalHandoffChild = byId.get("phase-05-child-owner-approval-handoff");
    const applyImplementationBoundaryChild = byId.get(
      "phase-05-child-apply-implementation-boundary"
    );
    const completionGateChild = byId.get("phase-05-child-completion-gate");

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
    expect(rollbackAuditParent?.completionPercent).toBeGreaterThanOrEqual(
      applyDecisionChild?.completionPercent ?? 0
    );
    expect(rollbackAuditParent?.completionPercent).toBeGreaterThanOrEqual(
      ownerApprovalHandoffChild?.completionPercent ?? 0
    );
    expect(rollbackAuditParent?.completionPercent).toBeGreaterThanOrEqual(
      applyImplementationBoundaryChild?.completionPercent ?? 0
    );
    expect(rollbackAuditParent?.completionPercent).toBeGreaterThanOrEqual(
      completionGateChild?.completionPercent ?? 0
    );
    expect(previewMetadataChild?.completionPercent).toBeGreaterThanOrEqual(
      traceabilityChild?.completionPercent ?? 0
    );
    expect(draftParent?.completionPercent).toBe(100);
    expect(profileDraftsChild?.completionPercent).toBe(100);
    expect(rollbackAuditParent?.completionPercent).toBe(100);
    expect(previewMetadataChild?.completionPercent).toBe(100);
    expect(auditSummaryChild?.completionPercent).toBe(100);
    expect(reviewDepthChild?.completionPercent).toBe(100);
    expect(traceabilityChild?.completionPercent).toBe(100);
    expect(blockerPriorityChild?.completionPercent).toBe(100);
    expect(applyDecisionChild?.completionPercent).toBe(100);
    expect(ownerApprovalHandoffChild?.completionPercent).toBe(100);
    expect(applyImplementationBoundaryChild?.completionPercent).toBe(100);
    expect(completionGateChild?.completionPercent).toBe(100);
    expect(profileDraftsChild?.description).toContain("apply-review-staged audit actions");
    expect(profileDraftsChild?.description).toContain("migrationReviewDepthProof");
    expect(profileDraftsChild?.description).toContain("evidenceKeys=6/6");
    expect(profileDraftsChild?.description).toContain("without changing active profiles or source data");
    expect(profileDraftsChild?.description).toContain("migrationApplyDecisionProof");
    expect(profileDraftsChild?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(rollbackAuditParent?.description).toContain("sensitive-boundary traceability");
    expect(rollbackAuditParent?.description).toContain("migrationTraceabilityProof");
    expect(rollbackAuditParent?.description).toContain("openReview=0");
    expect(rollbackAuditParent?.description).toContain("migrationBlockerPriorityProof");
    expect(rollbackAuditParent?.description).toContain("open=0");
    expect(rollbackAuditParent?.description).toContain("migrationApplyDecisionProof");
    expect(rollbackAuditParent?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(auditSummaryChild?.description).toContain("draft/audit fingerprint match");
    expect(auditSummaryChild?.description).toContain("migrationReviewDepthProof");
    expect(auditSummaryChild?.description).toContain("records=6/6");
    expect(auditSummaryChild?.description).toContain("migrationApplyDecisionProof");
    expect(auditSummaryChild?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(previewMetadataChild?.description).toContain("sensitive-exclusion evidence keys");
    expect(previewMetadataChild?.description).toContain("migrationReviewDepthProof");
    expect(previewMetadataChild?.description).toContain("sourceMutation=locked");
    expect(previewMetadataChild?.description).toContain("migrationApplyDecisionProof");
    expect(previewMetadataChild?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(previewMetadataChild?.description).toContain("applyImplementationBoundaryProof");
    expect(reviewDepthChild?.description).toContain("six separate ready owner-review records");
    expect(reviewDepthChild?.description).toContain("unique evidence keys");
    expect(reviewDepthChild?.description).toContain("migrationReviewDepthProof");
    expect(reviewDepthChild?.description).toContain("ready owner-review records");
    expect(reviewDepthChild?.description).toContain("migrationApplyDecisionProof");
    expect(reviewDepthChild?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(traceabilityChild?.description).toContain("source-mutation locks");
    expect(traceabilityChild?.description).toContain("migrationTraceabilityProof");
    expect(traceabilityChild?.description).toContain("trust=ready");
    expect(traceabilityChild?.description).toContain("openReview=0");
    expect(traceabilityChild?.description).toContain("apply-decision gate");
    expect(traceabilityChild?.description).toContain("owner-approval handoff");
    expect(blockerPriorityChild?.description).toContain("source-mutation locks");
    expect(blockerPriorityChild?.description).toContain("migrationBlockerPriorityProof");
    expect(blockerPriorityChild?.description).toContain("open=0");
    expect(blockerPriorityChild?.description).toContain("migrationApplyDecisionProof");
    expect(blockerPriorityChild?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(blockerPriorityChild?.description).toContain("applyImplementationBoundaryProof");
    expect(applyDecisionChild?.description).toContain("migrationApplyDecisionProof");
    expect(applyDecisionChild?.description).toContain("canApply=no");
    expect(applyDecisionChild?.description).toContain("approval=required");
    expect(ownerApprovalHandoffChild?.description).toContain("migrationOwnerApprovalHandoffProof");
    expect(ownerApprovalHandoffChild?.description).toContain("recorded state");
    expect(ownerApprovalHandoffChild?.description).toContain("canApply=no");
    expect(applyImplementationBoundaryChild?.description).toContain("applyImplementationBoundaryProof");
    expect(applyImplementationBoundaryChild?.description).toContain("executor=missing");
    expect(applyImplementationBoundaryChild?.description).toContain("mutationPath=locked");
    expect(applyImplementationBoundaryChild?.description).toContain("canApply=no");
    expect(completionGateChild?.description).toContain("phase5MigrationCompletionGate");
    expect(completionGateChild?.description).toContain("phaseComplete=yes");
    expect(completionGateChild?.description).toContain("reviewOnly=complete");
    expect(completionGateChild?.description).toContain("canApply=no");
  });
});
