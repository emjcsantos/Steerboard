import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Phase11EvidenceRecordsPanel,
  Phase11OwnerCommandCenterPanel,
  Phase11ProofFreshnessDepthPanel,
  Phase11ReleaseReadinessPanel
} from "./App";
import type { Phase11EvidenceRecordsSnapshot } from "./phase11EvidenceRecords";
import type { Phase11OwnerCommandCenterSnapshot } from "./phase11OwnerCommandCenter";
import type { Phase11ProofFreshnessDepthSnapshot } from "./phase11ProofFreshnessDepth";
import type { Phase11ReleaseReadinessSnapshot } from "./phase11ReleaseReadiness";
import { createDefaultProjectManagementPhasePlan } from "./projectManagementPhasePlan";
import { buildRemainingGoalPriorityTraces } from "./remainingGoalPlan";

function ownerCommandSnapshot(
  overrides: Partial<Phase11OwnerCommandCenterSnapshot> = {}
): Phase11OwnerCommandCenterSnapshot {
  const priorityGoalTraces = buildRemainingGoalPriorityTraces();

  return {
    id: "phase-11-owner-command-center",
    label: "Phase 11 Owner Testing command center",
    state: "review",
    statusLabel: "Review",
    readiness: 82,
    canRelease: false,
    checklistReadiness: 92,
    phaseReadiness: 63,
    blockerCount: 3,
    readyCount: 4,
    reviewCount: 3,
    blockedCount: 0,
    waitingCount: 1,
    nextAction:
      "Clear the current Phase 3 proof blocker, refresh evidence records, and keep packaging paused.",
    safety:
      "Phase 11 command center is evidence-only. It does not install dependencies, build packages, run desktop smoke, mutate files, push branches, call networks, or resume release actions.",
    ariaLabel: "Phase 11 Owner Testing command center review.",
    priorityGoalTraceCount: priorityGoalTraces.length,
    priorityGoalTraces,
    items: [
      {
        id: "phase-11-owner-command-center:checklist",
        label: "Owner checklist",
        kind: "checklist",
        status: "ready",
        detail: "Owner checklist rows are visible for review.",
        nextAction: "Keep checklist coverage attached."
      },
      {
        id: "phase-11-owner-command-center:proof-freshness",
        label: "Proof freshness depth",
        kind: "proof-freshness",
        status: "review",
        detail: "Desktop smoke storage proof needs owner review.",
        nextAction:
          "Import or rerun desktop smoke proof rows until each required row is storage-proof attested."
      },
      {
        id: "phase-11-owner-command-center:phase-readiness",
        label: "Phase readiness",
        kind: "phase-readiness",
        status: "review",
        detail: "Remaining active and next goals hold release readiness.",
        nextAction: "Clear the current Phase 3 proof blocker before release readiness."
      },
      {
        id: "phase-11-owner-command-center:fresh-checkout",
        label: "Fresh checkout",
        kind: "fresh-checkout",
        status: "waiting",
        detail: "Fresh checkout evidence has not been recorded.",
        nextAction: "Record fresh-checkout evidence metadata before release readiness."
      }
    ],
    ...overrides
  };
}

function proofFreshnessSnapshot(
  overrides: Partial<Phase11ProofFreshnessDepthSnapshot> = {}
): Phase11ProofFreshnessDepthSnapshot {
  return {
    id: "phase-11-proof-freshness-depth",
    label: "Phase 11 proof freshness depth",
    state: "review",
    statusLabel: "Review",
    readiness: 84,
    canTrustOwnerProof: false,
    readyCount: 4,
    reviewCount: 2,
    blockedCount: 0,
    waitingCount: 0,
    openProofCount: 2,
    nextAction:
      "Import or rerun desktop smoke proof rows until each required row is storage-proof attested.",
    safety:
      "Phase 11 proof freshness depth is evidence-only. It does not run smoke commands, mutate runtime state, record handoff, install dependencies, build packages, push branches, or resume release actions.",
    ariaLabel: "Phase 11 proof freshness depth review.",
    items: [
      {
        id: "phase-11-proof-freshness-depth:phase-priority",
        label: "Phase 1/2/6 priority proof",
        kind: "priority-proof",
        status: "ready",
        detail: "Priority proof is attached.",
        nextAction: "Keep priority proof attached while the owner push hold remains."
      },
      {
        id: "phase-11-proof-freshness-depth:phase3-clearance",
        label: "Phase 3 clearance",
        kind: "phase3-clearance",
        status: "ready",
        detail: "Phase 3 clearance package is ready.",
        nextAction: "Keep Phase 3 clearance attached."
      },
      {
        id: "phase-11-proof-freshness-depth:desktop-smoke",
        label: "Desktop smoke proof",
        kind: "desktop-smoke",
        status: "review",
        detail:
          "2/3 desktop smoke rows are ready; 1 review, 0 blocked, and 0 waiting; 2/3 storage-proof attested, 1 storage review; freshness evaluated at 2026-06-11T00:10:00.000Z.",
        nextAction:
          "Import or rerun desktop smoke proof rows until each required row is storage-proof attested."
      },
      {
        id: "phase-11-proof-freshness-depth:command-plan",
        label: "Desktop smoke command plan",
        kind: "command-plan",
        status: "ready",
        detail: "Command plan is visible.",
        nextAction: "Keep npm.cmd run smoke:phase3 held until it matches the top blocker."
      },
      {
        id: "phase-11-proof-freshness-depth:command-validation",
        label: "CLI smoke validation record",
        kind: "command-validation",
        status: "ready",
        detail: "CLI validation is fresh and includes smoke bundle provenance.",
        nextAction: "Keep CLI validation attached without treating it as desktop proof."
      },
      {
        id: "phase-11-proof-freshness-depth:handoff-proof",
        label: "Owner handoff proof",
        kind: "handoff-proof",
        status: "review",
        detail:
          "Owner handoff proof needs current active Phase 3 clearance PM traceability with handoff proof.",
        nextAction:
          "Record ready Phase 3 handoff proof before release review."
      }
    ],
    ...overrides
  };
}

function evidenceRecordsSnapshot(
  overrides: Partial<Phase11EvidenceRecordsSnapshot> = {}
): Phase11EvidenceRecordsSnapshot {
  return {
    id: "phase-11-evidence-records",
    label: "Phase 11 evidence records",
    readyCount: 1,
    reviewCount: 1,
    blockedCount: 1,
    waitingCount: 2,
    staleCount: 1,
    missingCount: 2,
    malformedCount: 1,
    records: {
      "fresh-checkout": {
        gate: "fresh-checkout",
        label: "Fresh checkout",
        state: "waiting",
        freshness: "missing",
        source: "missing",
        recordedAt: "missing",
        detail: "Fresh checkout evidence has not been recorded.",
        nextAction:
          "Record fresh-checkout install, test, build, desktop run, and proof-panel evidence after live workflow blockers clear.",
        safety:
          "Phase 11 evidence records are metadata-only. They do not run tests, install dependencies, build packages, execute smoke flows, write files, push branches, call networks, or resume release actions."
      },
      "clean-checkout": {
        gate: "clean-checkout",
        label: "Clean checkout",
        state: "review",
        freshness: "stale",
        source: "owner checkout",
        recordedAt: "2026-06-12T11:00:00.000Z",
        detail: "Clean checkout evidence is stale and needs owner review.",
        nextAction: "Refresh or re-review clean checkout evidence before release readiness.",
        ageHours: 121,
        safety:
          "Phase 11 evidence records are metadata-only. They do not run tests, install dependencies, build packages, execute smoke flows, write files, push branches, call networks, or resume release actions."
      },
      "build-test": {
        gate: "build-test",
        label: "Build and test",
        state: "ready",
        freshness: "fresh",
        source: "owner build",
        recordedAt: "2026-06-17T10:00:00.000Z",
        detail: "Vitest and Vite build passed.",
        nextAction: "Keep the final test and build output attached to the release record.",
        ageHours: 2,
        safety:
          "Phase 11 evidence records are metadata-only. They do not run tests, install dependencies, build packages, execute smoke flows, write files, push branches, call networks, or resume release actions."
      },
      "docs-known-limits": {
        gate: "docs-known-limits",
        label: "Docs and known limits",
        state: "blocked",
        freshness: "malformed",
        source: "owner docs",
        recordedAt: "malformed",
        detail: "Docs and known limits evidence is malformed.",
        nextAction: "Repair docs and known limits evidence metadata before release readiness.",
        safety:
          "Phase 11 evidence records are metadata-only. They do not run tests, install dependencies, build packages, execute smoke flows, write files, push branches, call networks, or resume release actions."
      },
      "release-decision": {
        gate: "release-decision",
        label: "Release decision evidence",
        state: "waiting",
        freshness: "missing",
        source: "missing",
        recordedAt: "missing",
        detail: "Release decision evidence has not been recorded.",
        nextAction:
          "Record release-decision evidence metadata before release readiness can recommend release.",
        safety:
          "Phase 11 evidence records are metadata-only. They do not run tests, install dependencies, build packages, execute smoke flows, write files, push branches, call networks, or resume release actions."
      }
    },
    ...overrides
  };
}

function releaseReadinessSnapshot(
  overrides: Partial<Phase11ReleaseReadinessSnapshot> = {}
): Phase11ReleaseReadinessSnapshot {
  return {
    id: "phase-11-release-readiness",
    label: "Phase 11 Release readiness gate",
    state: "review",
    statusLabel: "Review",
    readiness: 75,
    canRecommendRelease: false,
    releaseHoldCount: 5,
    readyCount: 4,
    reviewCount: 5,
    blockedCount: 0,
    waitingCount: 0,
    ownerReadiness: 82,
    securityReadiness: 100,
    packagingReadiness: 80,
    nextAction:
      "Resolve Phase 11 proof freshness depth, evidence records, and current active Phase 3 clearance PM traceability before release readiness.",
    safety:
      "Phase 11 release readiness is evidence-only. It does not install dependencies, run tests, build packages, execute smoke flows, sign artifacts, push branches, call networks, or resume packaging.",
    ariaLabel: "Phase 11 release readiness review.",
    items: [
      {
        id: "phase-11-release-readiness:fresh-checkout",
        label: "Fresh checkout",
        kind: "fresh-checkout",
        status: "review",
        detail:
          "Fresh-checkout install, test, build, desktop run, and proof-panel evidence need a structured evidence record.",
        nextAction: "Attach fresh-checkout evidence metadata before release readiness can proceed."
      },
      {
        id: "phase-11-release-readiness:clean-checkout",
        label: "Clean checkout",
        kind: "clean-checkout",
        status: "review",
        detail: "Clean checkout evidence needs owner review.",
        nextAction: "Refresh or re-review clean checkout evidence before release readiness."
      },
      {
        id: "phase-11-release-readiness:build-test",
        label: "Build and test",
        kind: "build-test",
        status: "ready",
        detail: "Build/test evidence is attached.",
        nextAction: "Keep build/test evidence attached."
      },
      {
        id: "phase-11-release-readiness:owner-smoke-proof",
        label: "Owner smoke proof",
        kind: "smoke-proof",
        status: "review",
        detail: "Desktop smoke proof has a storage review row.",
        nextAction: "Import or rerun desktop smoke proof rows."
      },
      {
        id: "phase-11-release-readiness:packaging-lock",
        label: "Packaging lock",
        kind: "packaging-lock",
        status: "ready",
        detail:
          "Packaging, resume, local storage repair, and safety-disabled live-action release paths remain locked while readiness evidence is reviewed.",
        nextAction: "Keep packaging paused until owner release decision."
      },
      {
        id: "phase-11-release-readiness:docs-known-limits",
        label: "Docs and known limits",
        kind: "docs-known-limits",
        status: "review",
        detail: "Docs-known-limits evidence needs repair.",
        nextAction: "Repair docs and known limits evidence metadata."
      },
      {
        id: "phase-11-release-readiness:security-closure",
        label: "Security closure",
        kind: "security-closure",
        status: "ready",
        detail: "Security closure capability is available.",
        nextAction: "Keep security closure evidence attached."
      },
      {
        id: "phase-11-release-readiness:phase3-trace",
        label: "Current Phase 3 trace",
        kind: "phase3-trace",
        status: "review",
        detail:
          "Current active Phase 3 clearance PM traceability with handoff proof needs owner review.",
        nextAction:
          "Attach current active Phase 3 clearance PM traceability with handoff proof before release readiness."
      },
      {
        id: "phase-11-release-readiness:release-decision",
        label: "Release decision",
        kind: "release-decision",
        status: "review",
        detail:
          "Release decision is held until all prerequisite evidence rows are ready. Top prerequisite row: Fresh checkout is review; Fresh-checkout install, test, build, desktop run, and proof-panel evidence need a structured evidence record.",
        nextAction:
          "Owner can decide whether to resume release only after all evidence is ready."
      }
    ],
    ...overrides
  };
}

function renderPhase11Proof(options: {
  owner?: Phase11OwnerCommandCenterSnapshot;
  proof?: Phase11ProofFreshnessDepthSnapshot;
  evidence?: Phase11EvidenceRecordsSnapshot;
  release?: Phase11ReleaseReadinessSnapshot;
} = {}) {
  const owner = options.owner ?? ownerCommandSnapshot();
  const proof = options.proof ?? proofFreshnessSnapshot();
  const evidence = options.evidence ?? evidenceRecordsSnapshot();
  const release = options.release ?? releaseReadinessSnapshot();

  return renderToStaticMarkup(
    <>
      <Phase11OwnerCommandCenterPanel
        evidenceRecords={evidence}
        proofFreshnessDepth={proof}
        projectManagementTasks={createDefaultProjectManagementPhasePlan()}
        releaseReadiness={release}
        snapshot={owner}
      />
      <Phase11ProofFreshnessDepthPanel snapshot={proof} />
      <Phase11EvidenceRecordsPanel
        onClearRecord={() => undefined}
        onImportRecords={() => undefined}
        onRecord={() => undefined}
        snapshot={evidence}
      />
      <Phase11ReleaseReadinessPanel snapshot={release} />
    </>
  );
}

describe("phase 11 owner-visible proof", () => {
  it("renders owner command, proof freshness, evidence records, release readiness, traceability, blockers, and release holds", () => {
    const html = renderPhase11Proof();

    expect(html).toContain("Phase 11 Owner Command");
    expect(html).toContain("Phase 11 Owner Testing command center");
    expect(html).toContain("Release");
    expect(html).toContain("Checklist");
    expect(html).toContain("Phases");
    expect(html).toContain("Blockers");
    expect(html).toContain("Owner checklist");
    expect(html).toContain("Proof freshness depth");
    expect(html).toContain("Phase readiness");
    expect(html).toContain("Prioritized remaining goal traces");
    expect(html).toContain("Phase 11 owner release traceability");
    expect(html).toContain("Phase 11 owner release blocker priority");
    expect(html).toContain("Current Phase 3 trace");
    expect(html).toContain("Packaging lock");
    expect(html).toContain("Phase 11 Proof Freshness");
    expect(html).toContain("Phase 1/2/6 priority proof");
    expect(html).toContain("Phase 3 clearance");
    expect(html).toContain("Desktop smoke proof");
    expect(html).toContain("Desktop smoke command plan");
    expect(html).toContain("CLI smoke validation record");
    expect(html).toContain("Owner handoff proof");
    expect(html).toContain("Phase 11 Evidence Records");
    expect(html).toContain("Fresh checkout");
    expect(html).toContain("Clean checkout");
    expect(html).toContain("Build and test");
    expect(html).toContain("Docs and known limits");
    expect(html).toContain("Release decision evidence");
    expect(html).toContain(
      "Record release-decision evidence metadata before release readiness can recommend release"
    );
    expect(html).toContain("Import JSON");
    expect(html).toContain("Record");
    expect(html).toContain("Clear");
    expect(html).toContain("Phase 11 Release Readiness");
    expect(html).toContain("Decision");
    expect(html).toContain("<dt>Decision</dt><dd>Held</dd>");
    expect(html).toContain("Owner");
    expect(html).toContain("<dt>Owner</dt><dd>82%</dd>");
    expect(html).toContain("Security");
    expect(html).toContain("<dt>Security</dt><dd>100%</dd>");
    expect(html).toContain("Package");
    expect(html).toContain("<dt>Package</dt><dd>80%</dd>");
    expect(html).toContain("Holds");
    expect(html).toContain("<dt>Holds</dt><dd>5</dd>");
    expect(html).toContain("Owner smoke proof");
    expect(html).toContain("Security closure");
    expect(html).toContain("Security closure capability is available.");
    expect(html).toContain("Keep security closure evidence attached.");
    expect(html).toContain("Release decision");
    expect(html).toContain("storage-proof attested");
    expect(html).toContain("current active Phase 3 clearance PM traceability");
    expect(html).toContain("Top prerequisite row: Fresh checkout is review");
    expect(html).toContain(
      "Fresh-checkout install, test, build, desktop run, and proof-panel evidence need a structured evidence record"
    );
    expect(html).toContain("packaging paused");
    expect(html).toContain("local storage repair");
    expect(html).toContain("safety-disabled live-action");
    expect(html).toContain("does not install dependencies");
    expect(html).toContain("does not run smoke commands");
    expect(html).toContain("running tests");
  });

  it("keeps missing, stale, and malformed release evidence visible without running release actions", () => {
    const html = renderPhase11Proof({
      evidence: evidenceRecordsSnapshot()
    });

    expect(html).toContain("missing");
    expect(html).toContain("stale");
    expect(html).toContain("malformed");
    expect(html).toContain("Record fresh-checkout");
    expect(html).toContain("Refresh or re-review clean checkout evidence");
    expect(html).toContain("Repair docs and known limits evidence metadata");
    expect(html).toContain("Phase 11 evidence records are metadata-only");
    expect(html).toContain("write files");
    expect(html).toContain("push branches");
    expect(html).toContain("resume release actions");
  });

  it("shows a ready owner/release path while still keeping packaging and release action boundaries visible", () => {
    const owner = ownerCommandSnapshot({
      state: "ready",
      statusLabel: "Ready",
      readiness: 100,
      canRelease: true,
      phaseReadiness: 100,
      blockerCount: 0,
      readyCount: 6,
      reviewCount: 0,
      waitingCount: 0,
      nextAction: "Keep owner proof attached.",
      items: [
        {
          id: "phase-11-owner-command-center:release-ready",
          label: "Release gate ready",
          kind: "next-action",
          status: "ready",
          detail: "Owner command center is ready.",
          nextAction: "Owner can decide whether to resume release."
        }
      ]
    });
    const proof = proofFreshnessSnapshot({
      state: "ready",
      statusLabel: "Ready",
      readiness: 100,
      canTrustOwnerProof: true,
      readyCount: 6,
      reviewCount: 0,
      openProofCount: 0,
      nextAction: "Keep owner proof attached.",
      items: proofFreshnessSnapshot().items.map((item) => ({
        ...item,
        status: "ready" as const,
        nextAction: "Keep owner proof attached."
      }))
    });
    const evidence = evidenceRecordsSnapshot({
      readyCount: 5,
      reviewCount: 0,
      blockedCount: 0,
      waitingCount: 0,
      staleCount: 0,
      missingCount: 0,
      malformedCount: 0,
      records: Object.fromEntries(
        Object.entries(evidenceRecordsSnapshot().records).map(([gate, record]) => [
          gate,
          {
            ...record,
            state: "ready",
            freshness: "fresh",
            source: "owner release review",
            recordedAt: "2026-06-17T10:00:00.000Z",
            detail: `${record.label} evidence is ready.`,
            nextAction: `Keep ${record.label.toLowerCase()} evidence attached.`
          }
        ])
      ) as Phase11EvidenceRecordsSnapshot["records"]
    });
    const release = releaseReadinessSnapshot({
      state: "ready",
      statusLabel: "Ready",
      readiness: 100,
      canRecommendRelease: true,
      releaseHoldCount: 0,
      readyCount: 9,
      reviewCount: 0,
      nextAction: "Release readiness is recorded.",
      items: releaseReadinessSnapshot().items.map((item) => ({
        ...item,
        status: "ready" as const,
        detail:
          item.kind === "phase3-trace"
            ? "goal-phase-3-proof-clearance is active, current yes, with 11 PM task links including phase-03-child-smoke-rows, phase-03-child-exit-gate, phase-03-child-command-plan, phase-03-child-blocker-priority, phase-03-child-traceability, phase-03-child-handoff-gate; proof freshness trusted; handoff proof ready."
            : item.detail,
        nextAction:
          item.label === "Packaging lock"
            ? "Keep packaging locked until owner resumes release."
            : "Keep release evidence attached."
      }))
    });
    const html = renderPhase11Proof({ owner, proof, evidence, release });

    expect(html).toContain("Release gate ready");
    expect(html).toContain("Ready");
    expect(html).toContain("Decision");
    expect(html).toContain("Owner can decide whether to resume release");
    expect(html).toContain("Keep packaging locked until owner resumes release");
    expect(html).toContain("2 open blockers");
    expect(html).toContain("goal-phase-3-proof-clearance is active");
    expect(html).toContain("phase-03-child-blocker-priority");
    expect(html).toContain("phase-03-child-traceability");
    expect(html).toContain("phase-03-child-handoff-gate");
    expect(html).not.toContain("phase-03-child-blocker-priority: Clearance Blocker Priority");
    expect(html).not.toContain("phase-03-child-handoff-gate: Owner Handoff Gate");
    expect(html).not.toContain("82% complete");
    expect(html).toContain("Phase 11 release readiness is evidence-only");
  });
});
