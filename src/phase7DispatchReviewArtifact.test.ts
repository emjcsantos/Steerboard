import { describe, expect, it } from "vitest";
import { buildDispatchPackage } from "./dispatch";
import { createDispatchRolePanelPlan } from "./dispatchRolePanelPlan";
import {
  buildCurrentDispatchReviewEvidenceFingerprint,
  createDispatchReviewRecord,
  type DispatchReviewRecord
} from "./dispatchReviewRecord";
import {
  buildPhase7DispatchBlockerPriority,
  type Phase7DispatchBlockerPrioritySummary
} from "./phase7DispatchBlockerPriority";
import { buildPhase7DispatchReviewDepth } from "./phase7DispatchReviewDepth";
import {
  buildPhase7DispatchReviewArtifact,
  parsePhase7DispatchReviewArtifact,
  serializePhase7DispatchReviewArtifact,
  verifyPhase7DispatchReviewArtifact,
  verifyRecordedPhase7DispatchReviewArtifact,
  verifySerializedPhase7DispatchReviewArtifact,
  type Phase7DispatchReviewArtifact
} from "./phase7DispatchReviewArtifact";
import { buildPhase7DispatchTraceability } from "./phase7DispatchTraceability";
import { buildPhase7IntegrationOwnershipDepth } from "./phase7IntegrationOwnershipDepth";
import type { PlanningDraft } from "./planning";
import { remainingGoalPlan } from "./remainingGoalPlan";
import { createMockRunFromDispatchPackage, type MockOrchestratorRun } from "./run";

const project = {
  id: "phase-7-artifact-project",
  name: "Phase 7 Artifact Project"
};

const draft: PlanningDraft = {
  title: "Export dispatch review artifact",
  objective: "Verify dispatch review evidence offline before worker spawning.",
  targetProjectId: project.id,
  scope: ["Review artifact", "Offline verification", "Live worker lock"],
  fileAreas: ["src/phase7DispatchReviewArtifact.ts"],
  acceptanceCriteria: [
    "Dispatch review artifact verifies handoff packets.",
    "Live worker execution remains locked."
  ],
  validationPlan: ["npm test -- phase7DispatchReviewArtifact"],
  risk: "medium",
  rollbackNote: "Remove the local dispatch artifact verifier.",
  deployMode: "staged"
};

function buildRecordBundle(
  createdAt = "2026-06-20T08:00:00.000Z"
): { record: DispatchReviewRecord; run: MockOrchestratorRun } {
  const dispatchPackage = buildDispatchPackage(draft, project, {
    createdAt,
    idSeed: "phase-7-artifact",
    status: "ready"
  });
  const run = createMockRunFromDispatchPackage(dispatchPackage, {
    createdAt,
    idSeed: "phase-7-artifact-run",
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

function withCurrentPhase7Goal() {
  return remainingGoalPlan.map((goal) =>
    goal.id === "goal-phase-7-dispatch-loop"
      ? { ...goal, status: "active" as const, current: true }
      : goal.current
        ? { ...goal, current: false }
        : goal
  );
}

function artifact(
  overrides: Partial<{
    record: DispatchReviewRecord;
    run: MockOrchestratorRun;
    createdAt: string;
  }> = {}
): Phase7DispatchReviewArtifact {
  const bundle = buildRecordBundle(overrides.createdAt);
  const record = overrides.record ?? bundle.record;
  const run = overrides.run ?? bundle.run;
  const currentEvidenceFingerprint = buildCurrentDispatchReviewEvidenceFingerprint(record, run);
  const depth = buildPhase7DispatchReviewDepth({
    records: [record],
    selectedRecord: record,
    currentEvidenceFingerprint
  });
  const ownership = buildPhase7IntegrationOwnershipDepth(record);
  const traceability = buildPhase7DispatchTraceability({
    record,
    depth,
    ownership,
    goals: withCurrentPhase7Goal()
  });
  const blockerPriority = buildPhase7DispatchBlockerPriority({
    depth,
    ownership,
    traceability
  });

  return buildPhase7DispatchReviewArtifact({
    exportedAt: record.createdAt,
    evaluatedAt: record.createdAt,
    record,
    depth,
    ownership,
    traceability,
    blockerPriority
  });
}

describe("phase 7 dispatch review artifact", () => {
  it("exports and verifies current dispatch review evidence offline", () => {
    const currentArtifact = artifact();
    const verification = verifyPhase7DispatchReviewArtifact(currentArtifact, {
      verifiedAt: "2026-06-20T08:05:00.000Z",
      expectedEvidenceFingerprint: currentArtifact.record.reviewEvidenceFingerprint
    });

    expect(verification).toMatchObject({
      state: "ready",
      readiness: 100,
      canVerifyOffline: true,
      latestRecordId: currentArtifact.record.id,
      reviewRecordCount: 1,
      openDepthCount: 0,
      openOwnershipCount: 0,
      openBlockerCount: 0,
      linkedPmTaskCount: 10,
      liveWorkerLockCount: 2,
      recordEvidenceFingerprint: currentArtifact.record.reviewEvidenceFingerprint,
      currentEvidenceFingerprint: currentArtifact.record.reviewEvidenceFingerprint,
      expectedEvidenceFingerprint: currentArtifact.record.reviewEvidenceFingerprint,
      matchesExpectedEvidence: true,
      executionLocked: true,
      handoffPacketCount: 4
    });
    expect(verification.detail).toContain("handoff packet");
    expect(verification.nextAction).toContain("live worker spawning remains locked");
  });

  it("round-trips serialized artifacts and rejects malformed payloads", () => {
    const currentArtifact = artifact();
    const serialized = serializePhase7DispatchReviewArtifact(currentArtifact);

    expect(parsePhase7DispatchReviewArtifact(serialized)).toEqual(currentArtifact);
    expect(
      verifySerializedPhase7DispatchReviewArtifact(serialized, {
        verifiedAt: "2026-06-20T08:05:00.000Z"
      }).state
    ).toBe("ready");
    expect(parsePhase7DispatchReviewArtifact("{")).toBeUndefined();
    expect(
      verifySerializedPhase7DispatchReviewArtifact("{}", {
        verifiedAt: "2026-06-20T08:05:00.000Z"
      })
    ).toMatchObject({
      state: "waiting",
      detail: expect.stringContaining("missing or malformed")
    });
  });

  it("reviews stale artifacts and evidence fingerprint mismatches", () => {
    const currentArtifact = artifact();

    expect(
      verifyPhase7DispatchReviewArtifact(currentArtifact, {
        verifiedAt: "2026-06-21T08:00:01.000Z",
        maxArtifactAgeMs: 24 * 60 * 60 * 1000
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("stale")
    });
    expect(
      verifyPhase7DispatchReviewArtifact(currentArtifact, {
        verifiedAt: "2026-06-20T08:05:00.000Z",
        expectedEvidenceFingerprint: "phase7-dispatch-other"
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("does not match"),
      matchesExpectedEvidence: false
    });
  });

  it("blocks artifacts that lose the live-worker execution lock", () => {
    const currentArtifact = artifact();
    const unlockedArtifact: Phase7DispatchReviewArtifact = {
      ...currentArtifact,
      record: {
        ...currentArtifact.record,
        noRuntimeExecutionNote: "Live worker sessions may launch now."
      }
    };

    expect(
      verifyPhase7DispatchReviewArtifact(unlockedArtifact, {
        verifiedAt: "2026-06-20T08:05:00.000Z"
      })
    ).toMatchObject({
      state: "blocked",
      detail: expect.stringContaining("live-worker execution is not locked"),
      executionLocked: false
    });
  });

  it("reviews artifacts with open blockers or incomplete handoff packet evidence", () => {
    const currentArtifact = artifact();
    const openBlockerArtifact: Phase7DispatchReviewArtifact = {
      ...currentArtifact,
      blockerPriority: {
        ...currentArtifact.blockerPriority,
        openBlockerCount: 1,
        topPriorityAction: "Review handoff packet evidence."
      } as Phase7DispatchBlockerPrioritySummary
    };
    const legacyPacketArtifact: Phase7DispatchReviewArtifact = {
      ...currentArtifact,
      record: {
        ...currentArtifact.record,
        handoffPackets: []
      }
    };

    expect(
      verifyPhase7DispatchReviewArtifact(openBlockerArtifact, {
        verifiedAt: "2026-06-20T08:05:00.000Z"
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("1 open blocker"),
      nextAction: "Review handoff packet evidence."
    });
    expect(
      verifyPhase7DispatchReviewArtifact(legacyPacketArtifact, {
        verifiedAt: "2026-06-20T08:05:00.000Z"
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("per-role handoff packet evidence"),
      handoffPacketCount: 0
    });
  });

  it("reviews artifacts with incomplete aggregate proof terms", () => {
    const currentArtifact = artifact();
    const incompleteProofArtifact: Phase7DispatchReviewArtifact = {
      ...currentArtifact,
      traceability: {
        ...currentArtifact.traceability,
        dispatchTraceabilityProof: currentArtifact.traceability.dispatchTraceabilityProof.replace(
          "liveWorkerLocks=2/2 ",
          ""
        )
      }
    };

    expect(
      verifyPhase7DispatchReviewArtifact(incompleteProofArtifact, {
        verifiedAt: "2026-06-20T08:05:00.000Z"
      })
    ).toMatchObject({
      state: "review",
      detail: expect.stringContaining("dispatch traceability aggregate proof"),
      nextAction: expect.stringContaining("traceability")
    });
  });

  it("verifies recorded artifacts against their own evidence fingerprint", () => {
    const currentArtifact = artifact();
    const verification = verifyRecordedPhase7DispatchReviewArtifact(
      serializePhase7DispatchReviewArtifact(currentArtifact),
      { verifiedAt: "2026-06-20T08:05:00.000Z" }
    );

    expect(verification).toMatchObject({
      state: "ready",
      expectedEvidenceFingerprint: currentArtifact.record.reviewEvidenceFingerprint,
      recordEvidenceFingerprint: currentArtifact.record.reviewEvidenceFingerprint,
      matchesExpectedEvidence: true
    });
  });
});
