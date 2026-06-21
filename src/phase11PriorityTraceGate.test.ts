import { describe, expect, it } from "vitest";
import type {
  Phase11OwnerCommandCenterGoalTrace,
  Phase11OwnerCommandCenterSnapshot
} from "./phase11OwnerCommandCenter";
import type { Phase11OwnerReleaseTraceabilitySummary } from "./phase11OwnerReleaseTraceability";
import { buildPhase11PriorityTraceGate } from "./phase11PriorityTraceGate";

function goalTrace(
  overrides: Partial<Phase11OwnerCommandCenterGoalTrace> = {}
): Phase11OwnerCommandCenterGoalTrace {
  return {
    goalId: "goal-phase-9-runner-approval",
    target: "Desktop-backed runner approval",
    status: "active",
    priority: "high",
    completionPercent: 94,
    phaseIds: ["phase-9-runner-approval"],
    pmTaskIds: ["phase-09-child-request-gate", "phase-09-child-closeout-status"],
    nextAction: "Keep the fixed terminal-readonly probe held behind ready live gates.",
    current: true,
    ...overrides
  };
}

function ownerCommand(
  overrides: Partial<Phase11OwnerCommandCenterSnapshot> = {}
): Phase11OwnerCommandCenterSnapshot {
  const priorityGoalTraces = overrides.priorityGoalTraces ?? [goalTrace()];

  return {
    id: "phase-11-owner-command-center",
    label: "Phase 11 Owner Testing command center",
    state: "review",
    statusLabel: "Review",
    readiness: 75,
    canRelease: false,
    checklistReadiness: 80,
    phaseReadiness: 94,
    blockerCount: 0,
    readyCount: 4,
    reviewCount: 3,
    blockedCount: 0,
    waitingCount: 2,
    nextAction: "Resolve Owner Testing proof holds.",
    safety:
      "Phase 11 command center is evidence-only. It does not install dependencies, build packages, run desktop smoke, mutate files, push branches, call networks, or resume release actions.",
    ariaLabel: "Phase 11 Owner Testing command center: Review.",
    items: [],
    priorityGoalTraceCount: priorityGoalTraces.length,
    priorityGoalTraces,
    ...overrides
  };
}

function traceability(
  overrides: Partial<Phase11OwnerReleaseTraceabilitySummary> = {}
): Phase11OwnerReleaseTraceabilitySummary {
  return {
    id: "phase-11-owner-release-traceability",
    label: "Phase 11 owner release traceability",
    state: "ready",
    statusLabel: "Ready",
    readiness: 100,
    canTrustOwnerReleaseGate: true,
    readyCount: 10,
    reviewCount: 0,
    blockedCount: 0,
    waitingCount: 0,
    missingPmTaskIds: [],
    linkedGoalIds: ["goal-phase-11-owner-command-center", "goal-phase-11-release-readiness"],
    linkedPmTaskCount: 12,
    releaseHoldStatus: "ready",
    nextAction:
      "Keep Phase 11 owner release traceability attached until the owner explicitly resumes release actions.",
    safety:
      "Phase 11 owner release traceability is evidence-only. It links Owner Testing, proof freshness, evidence records, release readiness, Project Management rows, and packaging holds without installing dependencies, running tests, building packages, pushing branches, or resuming release actions.",
    ariaLabel: "Phase 11 owner release traceability: Ready.",
    items: [],
    ...overrides
  };
}

describe("phase 11 priority trace gate", () => {
  it("trusts priority traces only when traceability and PM coverage are ready", () => {
    const gate = buildPhase11PriorityTraceGate(ownerCommand(), traceability());

    expect(gate).toMatchObject({
      state: "ready",
      canTrustPriorityTrace: true,
      priorityGoalTraceCount: 1,
      currentActiveTraceCount: 1,
      linkedPmTaskCount: 12,
      missingPmTaskCount: 0,
      packagingPaused: true,
      releaseHeld: true,
      topGoalId: "goal-phase-9-runner-approval",
      topPriority: "high",
      topStatus: "active",
      topCompletionPercent: 94
    });
    expect(gate.priorityTraceGateProof).toContain("canTrust=yes");
    expect(gate.priorityTraceGateProof).toContain("currentActive=1");
  });

  it("blocks when no prioritized traces are attached", () => {
    const gate = buildPhase11PriorityTraceGate(
      ownerCommand({ priorityGoalTraceCount: 0, priorityGoalTraces: [] }),
      traceability()
    );

    expect(gate).toMatchObject({
      state: "blocked",
      canTrustPriorityTrace: false,
      priorityGoalTraceCount: 0,
      topStatus: "none"
    });
    expect(gate.detail).toContain("no prioritized remaining-goal trace");
    expect(gate.priorityTraceGateProof).toContain("traces=0");
  });

  it("reviews traces when multiple current active goals are present", () => {
    const gate = buildPhase11PriorityTraceGate(
      ownerCommand({
        priorityGoalTraces: [
          goalTrace(),
          goalTrace({
            goalId: "goal-phase-4-provider-integration",
            target: "Provider integration surfaces",
            priority: "medium"
          })
        ]
      }),
      traceability()
    );

    expect(gate).toMatchObject({
      state: "review",
      canTrustPriorityTrace: false,
      currentActiveTraceCount: 2
    });
    expect(gate.detail).toContain("exactly one current active");
    expect(gate.priorityTraceGateProof).toContain("currentActive=2");
  });

  it("reviews traces when PM rows are missing from owner release traceability", () => {
    const gate = buildPhase11PriorityTraceGate(
      ownerCommand(),
      traceability({
        canTrustOwnerReleaseGate: false,
        missingPmTaskIds: ["phase-11-child-evidence-records"],
        nextAction: "Add the missing Phase 11 PM child links."
      })
    );

    expect(gate).toMatchObject({
      state: "review",
      canTrustPriorityTrace: false,
      missingPmTaskCount: 1
    });
    expect(gate.detail).toContain("missing Project Management rows");
    expect(gate.priorityTraceGateProof).toContain("missingPm=1");
  });

  it("waits when release traceability is waiting", () => {
    const gate = buildPhase11PriorityTraceGate(
      ownerCommand(),
      traceability({
        state: "waiting",
        statusLabel: "Waiting",
        canTrustOwnerReleaseGate: false,
        nextAction: "Record structured evidence before release traceability is trusted."
      })
    );

    expect(gate).toMatchObject({
      state: "waiting",
      canTrustPriorityTrace: false,
      traceabilityState: "waiting"
    });
    expect(gate.detail).toContain("owner release traceability is trusted");
    expect(gate.priorityTraceGateProof).toContain("traceability=waiting");
  });
});
