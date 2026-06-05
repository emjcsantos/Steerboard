import { describe, expect, it } from "vitest";
import {
  createReleasePrivacyReadiness,
  type ReleasePrivacyEvidence
} from "./releasePrivacyReadiness";
import type {
  SecurityPrivacyThreatModel,
  SecurityPrivacyThreatModelCheck
} from "./securityPrivacyThreatModel";

const checksTemplate: SecurityPrivacyThreatModelCheck[] = [
  { label: "Data boundary", value: "ready", tone: "ok" },
  { label: "Permission gates", value: "ready", tone: "ok" },
  { label: "Execution lock", value: "ready", tone: "ok" },
  { label: "Audit trail", value: "ready", tone: "ok" }
];

const baseThreatModel: SecurityPrivacyThreatModel = {
  label: "Security privacy model ready",
  detail: "All threat checks are satisfied.",
  tone: "ready",
  checkLabel: "4/4 checks",
  checks: checksTemplate,
  ariaLabel: "ready"
};

const baseEvidence: ReleasePrivacyEvidence = {
  localFirstDefaultsReady: true,
  dependencyReviewReady: true,
  publicFixtureReady: true,
  realProjectDataReady: true,
  runtimeAdapterEdgeCasesReady: true,
  auditExportReviewReady: true
};

function cloneThreatModel(
  model: SecurityPrivacyThreatModel
): SecurityPrivacyThreatModel {
  return JSON.parse(JSON.stringify(model)) as SecurityPrivacyThreatModel;
}

function cloneEvidence(evidence: ReleasePrivacyEvidence): ReleasePrivacyEvidence {
  return JSON.parse(JSON.stringify(evidence)) as ReleasePrivacyEvidence;
}

describe("createReleasePrivacyReadiness", () => {
  it("returns ready for all-ready inputs", () => {
    const snapshot = createReleasePrivacyReadiness(baseThreatModel, baseEvidence);

    expect(snapshot.state).toBe("ready");
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.statusLabel).toBe("Ready");
    expect(snapshot.canRecommendRelease).toBe(true);
    expect(snapshot.items.map((item) => item.status)).toEqual([
      "ready",
      "ready",
      "ready",
      "ready",
      "ready"
    ]);
  });

  it("returns blocked when data boundary is blocked", () => {
    const blockedModel = cloneThreatModel(baseThreatModel);
    blockedModel.checks[0] = {
      ...blockedModel.checks[0],
      tone: "blocked",
      value: "local leak risk"
    };

    const snapshot = createReleasePrivacyReadiness(blockedModel, baseEvidence);

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.items[1].label).toBe("Sensitive data boundary");
    expect(snapshot.items[1].status).toBe("blocked");
    expect(snapshot.readiness).toBe(80);
  });

  it("returns review when threat model is present but edge evidence is missing", () => {
    const missingEdgeEvidence = {
      localFirstDefaultsReady: true,
      dependencyReviewReady: true,
      publicFixtureReady: true,
      realProjectDataReady: undefined,
      runtimeAdapterEdgeCasesReady: true,
      auditExportReviewReady: true
    };

    const snapshot = createReleasePrivacyReadiness(
      baseThreatModel,
      missingEdgeEvidence
    );

    expect(snapshot.state).toBe("review");
    expect(snapshot.items[1].status).toBe("review");
    expect(snapshot.items[1].detail).toContain("real project data");
    expect(snapshot.canRecommendRelease).toBe(false);
  });

  it("returns waiting when all inputs are missing", () => {
    const snapshot = createReleasePrivacyReadiness();

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.readiness).toBe(0);
    expect(snapshot.canRecommendRelease).toBe(false);
    expect(snapshot.items).toHaveLength(5);
    expect(snapshot.items.map((item) => item.status)).toEqual([
      "waiting",
      "waiting",
      "waiting",
      "waiting",
      "waiting"
    ]);
  });

  it("marks dependency and fixture safety review and blocked", () => {
    const reviewSnapshot = createReleasePrivacyReadiness(baseThreatModel, {
      localFirstDefaultsReady: true,
      dependencyReviewReady: true,
      publicFixtureReady: "review"
    });

    expect(reviewSnapshot.state).toBe("review");
    expect(reviewSnapshot.items[3].status).toBe("review");

    const blockedSnapshot = createReleasePrivacyReadiness(baseThreatModel, {
      localFirstDefaultsReady: true,
      dependencyReviewReady: false,
      publicFixtureReady: true
    });

    expect(blockedSnapshot.state).toBe("blocked");
    expect(blockedSnapshot.items[3].status).toBe("blocked");
  });

  it("returns blocked when runtime adapter edge case evidence is blocked", () => {
    const runtimeEdgeBlockedSnapshot = createReleasePrivacyReadiness(
      baseThreatModel,
      {
        ...baseEvidence,
        runtimeAdapterEdgeCasesReady: false
      }
    );

    expect(runtimeEdgeBlockedSnapshot.state).toBe("blocked");
    expect(runtimeEdgeBlockedSnapshot.items[2].label).toBe("Permission and execution lock");
    expect(runtimeEdgeBlockedSnapshot.items[2].status).toBe("blocked");
    expect(runtimeEdgeBlockedSnapshot.items[2].detail).toContain("runtime adapter edge cases");
  });

  it("returns blocked when real project data readiness is blocked", () => {
    const realDataBlockedSnapshot = createReleasePrivacyReadiness(baseThreatModel, {
      ...baseEvidence,
      realProjectDataReady: "blocked"
    });

    expect(realDataBlockedSnapshot.state).toBe("blocked");
    expect(realDataBlockedSnapshot.items[1].label).toBe("Sensitive data boundary");
    expect(realDataBlockedSnapshot.items[1].status).toBe("blocked");
    expect(realDataBlockedSnapshot.items[1].detail).toContain("real project data");
  });

  it("maps audit check into audit and export trail review state", () => {
    const auditReviewModel = cloneThreatModel(baseThreatModel);
    auditReviewModel.checks[3] = {
      ...auditReviewModel.checks[3],
      tone: "review",
      value: "incomplete export trail"
    };

    const snapshot = createReleasePrivacyReadiness(auditReviewModel, baseEvidence);

    expect(snapshot.state).toBe("review");
    expect(snapshot.items[4].label).toBe("Audit and export trail");
    expect(snapshot.items[4].status).toBe("review");
  });

  it("maps audit/export review readiness missing and review states", () => {
    const missingAuditExportReview = createReleasePrivacyReadiness(baseThreatModel, {
      ...baseEvidence,
      auditExportReviewReady: undefined
    });

    expect(missingAuditExportReview.state).toBe("review");
    expect(missingAuditExportReview.items[4].status).toBe("review");

    const reviewAuditExport = createReleasePrivacyReadiness(baseThreatModel, {
      ...baseEvidence,
      auditExportReviewReady: "review"
    });

    expect(reviewAuditExport.state).toBe("review");
    expect(reviewAuditExport.items[4].status).toBe("review");
  });

  it("preserves exact item order", () => {
    const snapshot = createReleasePrivacyReadiness(baseThreatModel, baseEvidence);

    expect(snapshot.items.map((item) => item.label)).toEqual([
      "Local-first defaults",
      "Sensitive data boundary",
      "Permission and execution lock",
      "Dependency and fixture safety",
      "Audit and export trail"
    ]);
  });

  it("includes item statuses in aria label", () => {
    const snapshot = createReleasePrivacyReadiness(baseThreatModel, baseEvidence);

    expect(snapshot.ariaLabel).toContain("Local-first defaults ready");
    expect(snapshot.ariaLabel).toContain("Sensitive data boundary ready");
    expect(snapshot.ariaLabel).toContain("Permission and execution lock ready");
    expect(snapshot.ariaLabel).toContain("Dependency and fixture safety ready");
    expect(snapshot.ariaLabel).toContain("Audit and export trail ready");
  });

  it("does not mutate threat model or evidence inputs", () => {
    const threatModel = cloneThreatModel(baseThreatModel);
    const evidence = cloneEvidence(baseEvidence);

    createReleasePrivacyReadiness(threatModel, evidence);

    expect(threatModel).toEqual(baseThreatModel);
    expect(evidence).toEqual(baseEvidence);
  });
});
