import { describe, expect, it } from "vitest";
import { buildMigrationApplyDecisionGate } from "./migrationApplyDecisionGate";
import { buildMigrationBlockerPriority } from "./migrationBlockerPriority";
import { buildMigrationHardeningReadiness } from "./migrationHardeningReadiness";
import {
  buildMigrationOwnerApprovalHandoff,
  createMigrationOwnerApprovalRecord,
  parseStoredMigrationOwnerApprovalRecord
} from "./migrationOwnerApprovalHandoff";
import {
  appendMigrationProfileDraftHistory,
  buildDefaultMigrationPreview,
  createMigrationProfileDraft,
  toggleMigrationCategory
} from "./migrationModel";
import { buildMigrationTraceabilitySummary } from "./migrationTraceability";

function selectedPreview() {
  return toggleMigrationCategory(buildDefaultMigrationPreview("codex"), "projects", true);
}

function readyApplyDecisionGate() {
  const draft = createMigrationProfileDraft(selectedPreview(), {
    createdAt: "2026-06-18T08:15:00.000Z"
  });
  const readiness = buildMigrationHardeningReadiness({
    preview: selectedPreview(),
    draftHistory: appendMigrationProfileDraftHistory(
      [],
      draft,
      "apply-review-staged",
      8,
      "2026-06-18T08:16:00.000Z"
    ),
    excludedSecretsSummary: [
      "Credentials excluded",
      "Raw transcripts excluded",
      "Source mutation excluded"
    ]
  });
  const traceability = buildMigrationTraceabilitySummary({ readiness });
  const blockerPriority = buildMigrationBlockerPriority({
    readiness,
    traceability
  });

  return buildMigrationApplyDecisionGate({
    readiness,
    traceability,
    blockerPriority
  });
}

describe("migration owner approval handoff", () => {
  it("makes owner approval requestable without unlocking migration apply", () => {
    const handoff = buildMigrationOwnerApprovalHandoff({
      applyDecisionGate: readyApplyDecisionGate()
    });

    expect(handoff).toMatchObject({
      state: "waiting",
      readiness: 85,
      canRequestOwnerApproval: true,
      ownerApprovalRecorded: false,
      canApplyMigration: false,
      canActivateProfile: false,
      sourceMutationLocked: true,
      profileActivationLocked: true,
      approvalRequired: true
    });
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("requestable=yes");
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("recorded=no");
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("canApply=no");
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("profileActivation=locked");
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("sourceMutation=locked");
  });

  it("records owner approval evidence without adding an apply path", () => {
    const pending = buildMigrationOwnerApprovalHandoff({
      applyDecisionGate: readyApplyDecisionGate()
    });
    const record = createMigrationOwnerApprovalRecord({
      handoff: pending,
      createdAt: "2026-06-20T12:15:00.000Z"
    });
    const handoff = buildMigrationOwnerApprovalHandoff({
      applyDecisionGate: readyApplyDecisionGate(),
      ownerApprovalRecord: record
    });

    expect(handoff).toMatchObject({
      state: "ready",
      readiness: 100,
      canRequestOwnerApproval: false,
      ownerApprovalRecorded: true,
      canApplyMigration: false,
      canActivateProfile: false,
      approvalRequired: false,
      ownerApprovalRecordId: record.id
    });
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("recorded=yes");
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain("canApply=no");
    expect(handoff.migrationOwnerApprovalHandoffProof).toContain(`record=${record.id}`);
  });

  it("parses only valid local owner approval records", () => {
    const pending = buildMigrationOwnerApprovalHandoff({
      applyDecisionGate: readyApplyDecisionGate()
    });
    const record = createMigrationOwnerApprovalRecord({
      handoff: pending,
      createdAt: "2026-06-20T12:15:00.000Z"
    });

    expect(parseStoredMigrationOwnerApprovalRecord(JSON.stringify(record))).toEqual(record);
    expect(parseStoredMigrationOwnerApprovalRecord(null)).toBeUndefined();
    expect(parseStoredMigrationOwnerApprovalRecord(JSON.stringify({ ...record, state: "blocked" }))).toBeUndefined();
  });
});
