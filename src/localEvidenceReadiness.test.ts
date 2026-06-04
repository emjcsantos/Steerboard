import { describe, expect, it } from "vitest";
import type { MockOrchestratorRun } from "./run";
import type { PlanningDraft } from "./planning";
import { buildDispatchPackage } from "./dispatch";
import { createMockRunFromDispatchPackage } from "./run";
import { buildLocalEvidenceReadinessSnapshot } from "./localEvidenceReadiness";

const project = {
  id: "local-evidence-project",
  name: "Local Evidence Project"
};

const planningDraft: PlanningDraft = {
  title: "Build local evidence readiness fixture",
  objective: "Create run data for readiness calculations.",
  targetProjectId: project.id,
  scope: ["Local evidence checks", "Local readiness rows"],
  fileAreas: ["src/localEvidenceReadiness.ts"],
  acceptanceCriteria: ["Compute evidence readiness deterministically."],
  validationPlan: ["Run mock validation."],
  risk: "low",
  rollbackNote: "No external mutation required.",
  deployMode: "dry-run"
};

describe("local evidence readiness snapshot", () => {
  it("returns an empty snapshot when run is undefined", () => {
    const snapshot = buildLocalEvidenceReadinessSnapshot(undefined);

    expect(snapshot.state).toBe("empty");
    expect(snapshot.statusLabel).toBe("No run");
    expect(snapshot.readiness).toBe(0);
    expect(snapshot.gateCount).toBe(0);
    expect(snapshot.passedGateCount).toBe(0);
    expect(snapshot.failedGateCount).toBe(0);
    expect(snapshot.evidenceCount).toBe(0);
    expect(snapshot.canFinalize).toBe(false);
    expect(
      snapshot.items.find((item) => item.id === "local-evidence-readiness:validation-gates")
        ?.status
    ).toBe("missing");
    expect(
      snapshot.items.find((item) => item.id === "local-evidence-readiness:final-review")
        ?.status
    ).toBe("blocked");
  });

  it("returns waiting for queued/running run with pending gates", () => {
    const dispatchPackage = buildDispatchPackage(planningDraft, project, {
      idSeed: "local-evidence-queued",
      createdAt: "2026-06-04T09:10:00.000Z",
      status: "ready"
    });

    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "local-evidence-queued-run",
      createdAt: "2026-06-04T10:10:00.000Z",
      status: "running"
    });

    const snapshot = buildLocalEvidenceReadinessSnapshot(run);

    expect(snapshot.state).toBe("waiting");
    expect(snapshot.statusLabel).toBe("Waiting");
    expect(snapshot.readiness).toBeGreaterThanOrEqual(50);
    expect(snapshot.readiness).toBeLessThanOrEqual(75);
    expect(snapshot.canFinalize).toBe(false);
    expect(
      snapshot.items.find((item) => item.id === "local-evidence-readiness:validation-gates")
        ?.status
    ).toBe("waiting");
  });

  it("returns ready and canFinalize when complete with passed gates and evidence", () => {
    const dispatchPackage = buildDispatchPackage(planningDraft, project, {
      idSeed: "local-evidence-ready",
      createdAt: "2026-06-04T11:20:00.000Z",
      status: "ready"
    });

    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "local-evidence-ready-run",
      createdAt: "2026-06-04T11:25:00.000Z",
      status: "complete"
    });

    const snapshot = buildLocalEvidenceReadinessSnapshot(run);

    expect(snapshot.state).toBe("ready");
    expect(snapshot.statusLabel).toBe("Ready");
    expect(snapshot.readiness).toBe(100);
    expect(snapshot.canFinalize).toBe(true);
    expect(snapshot.gateCount).toBeGreaterThan(0);
    expect(snapshot.passedGateCount).toBe(snapshot.gateCount);
    expect(snapshot.failedGateCount).toBe(0);
    expect(snapshot.evidenceCount).toBeGreaterThan(0);
  });

  it("returns blocked when a validation gate has failed", () => {
    const dispatchPackage = buildDispatchPackage(
      {
        ...planningDraft,
        validationPlan: ["Run quick gate.", "Run strict gate."]
      },
      project,
      {
        idSeed: "local-evidence-blocked-gate",
        createdAt: "2026-06-04T12:30:00.000Z",
        status: "ready"
      }
    );

    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "local-evidence-blocked-gate-run",
      createdAt: "2026-06-04T12:32:00.000Z",
      status: "running"
    });

    const runWithFailedGate: MockOrchestratorRun = {
      ...run,
      validationGates: run.validationGates.map((gate, index) => ({
        ...gate,
        status: index === 1 ? "failed" : gate.status
      }))
    };

    const snapshot = buildLocalEvidenceReadinessSnapshot(runWithFailedGate);

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.statusLabel).toBe("Blocked");
    expect(snapshot.readiness).toBeLessThanOrEqual(35);
    expect(snapshot.canFinalize).toBe(false);
    expect(
      snapshot.items.find((item) => item.id === "local-evidence-readiness:validation-gates")
        ?.status
    ).toBe("blocked");
  });

  it("blocks when sessions or tasks are failed/blocked", () => {
    const dispatchPackage = buildDispatchPackage(planningDraft, project, {
      idSeed: "local-evidence-blocked-session",
      createdAt: "2026-06-04T13:30:00.000Z",
      status: "ready"
    });

    const baseRun = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "local-evidence-blocked-session-run",
      createdAt: "2026-06-04T13:31:00.000Z",
      status: "running"
    });

    const runBlocked: MockOrchestratorRun = {
      ...baseRun,
      sessions: [
        {
          ...baseRun.sessions[0],
          state: "blocked"
        },
        ...baseRun.sessions.slice(1)
      ]
    };

    const snapshot = buildLocalEvidenceReadinessSnapshot(runBlocked);

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.canFinalize).toBe(false);

    const blockedTaskRun: MockOrchestratorRun = {
      ...baseRun,
      tasks: [
        {
          ...baseRun.tasks[0],
          status: "blocked"
        },
        ...baseRun.tasks.slice(1)
      ]
    };

    const blockedTaskSnapshot = buildLocalEvidenceReadinessSnapshot(blockedTaskRun);

    expect(blockedTaskSnapshot.state).toBe("blocked");
    expect(blockedTaskSnapshot.canFinalize).toBe(false);
    expect(blockedTaskSnapshot.statusLabel).toBe("Blocked");
  });

  it("derives evidence count from sessions with files, transcript, or validation text", () => {
    const run: MockOrchestratorRun = {
      id: "mock-run-evidence-count",
      projectId: project.id,
      projectName: project.name,
      title: "Evidence count baseline",
      status: "running",
      createdAt: "2026-06-04T14:30:00.000Z",
      sourcePackageId: "manual-package",
      summary: {
        objective: "Count sessions with evidence.",
        scopeCount: 1,
        fileAreaCount: 1,
        acceptanceCriteriaCount: 1,
        validationGateCount: 1,
        risk: "medium"
      },
      sessions: [
        {
          id: "s-no-evidence",
          projectId: project.id,
          title: "No evidence",
          role: "orchestrator",
          state: "implementing",
          branch: "local/evidence/no",
          runtime: "Model-only orchestrator",
          attempt: 0,
          validation: "",
          files: [],
          transcript: [],
          tools: ["Plan"]
        },
        {
          id: "s-file-evidence",
          projectId: project.id,
          title: "File evidence",
          role: "implementer",
          state: "implementing",
          branch: "local/evidence/file",
          runtime: "Model-only orchestrator",
          attempt: 0,
          validation: "",
          files: ["readme.md"],
          transcript: [],
          tools: ["Edit"]
        },
        {
          id: "s-transcript-evidence",
          projectId: project.id,
          title: "Transcript evidence",
          role: "validator",
          state: "implementing",
          branch: "local/evidence/transcript",
          runtime: "Model-only orchestrator",
          attempt: 0,
          validation: "",
          files: [],
          transcript: ["Validation text present."],
          tools: ["Verify"]
        },
        {
          id: "s-validation-evidence",
          projectId: project.id,
          title: "Validation evidence",
          role: "integration",
          state: "implementing",
          branch: "local/evidence/validation",
          runtime: "Model-only orchestrator",
          attempt: 0,
          validation: "Validation summary line",
          files: [],
          transcript: [],
          tools: ["Report"]
        }
      ],
      tasks: [
        {
          id: "task-implementation",
          projectId: project.id,
          title: "Mock task",
          role: "implementation",
          status: "implementing",
          attempt: 0,
          attemptLimit: 1,
          owner: "Mock",
          objective: "Collect evidence count.",
          scope: ["Local evidence"],
          fileOwnership: ["src/localEvidenceReadiness.test.ts"],
          acceptanceCriteria: ["Count evidence"],
          validationCommands: ["Collect"],
          dependencies: [],
          rollback: "None."
        }
      ],
      validationGates: [
        {
          id: "gate-validation",
          label: "Validation gate",
          command: "echo complete",
          status: "pending",
          detail: "Model-only gate; no command executed."
        }
      ]
    };

    const snapshot = buildLocalEvidenceReadinessSnapshot(run);

    expect(snapshot.evidenceCount).toBe(3);
    expect(snapshot.state).toBe("waiting");
    expect(snapshot.readiness).toBeGreaterThanOrEqual(50);
    expect(snapshot.readiness).toBeLessThanOrEqual(75);
  });

  it("does not mutate the input run", () => {
    const dispatchPackage = buildDispatchPackage(planningDraft, project, {
      idSeed: "local-evidence-immutability",
      createdAt: "2026-06-04T15:30:00.000Z",
      status: "ready"
    });

    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "local-evidence-immutability-run",
      createdAt: "2026-06-04T15:32:00.000Z",
      status: "running"
    });
    const original = JSON.parse(JSON.stringify(run)) as MockOrchestratorRun;

    buildLocalEvidenceReadinessSnapshot(run);

    expect(run).toEqual(original);
  });
});
