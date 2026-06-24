import { describe, expect, it } from "vitest";
import {
  createMockRunFromDispatchPackage,
  getActivePhaseWorksheets,
  integratePhaseWorksheetIntoMain,
  requestPhaseWorksheetRevision,
  runToOrchestrationTasks,
  runToSessionSummaries,
  type MockOrchestratorRun
} from "./run";
import type { DispatchPackage } from "./dispatch";
import { buildDispatchPackage } from "./dispatch";
import type { PlanningDraft } from "./planning";

const stagedProject = {
  id: "run-project",
  name: "Mock Orchestrator Project"
};

const basePlanningDraft: PlanningDraft = {
  title: "Build local orchestrator mock model",
  objective: "Create a deterministic mock run model for Arena visibility.",
  targetProjectId: stagedProject.id,
  scope: ["Mock run scaffolding", "Validation gate projection", "Session conversion surface"],
  fileAreas: ["src/run.ts"],
  acceptanceCriteria: [
    "Model output is deterministic given idSeed and createdAt.",
    "Sessions and tasks are safely transformed for Arena review."
  ],
  validationPlan: [
    "npm run test -- src/run.test.ts",
    "npm run build"
  ],
  risk: "low",
  rollbackNote: "No runtime mutation is performed in this local model.",
  deployMode: "dry-run"
};

describe("mock run creation", () => {
  it("creates a deterministic run from a staged dispatch package", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "run-seed",
      createdAt: "2026-06-04T09:10:00.000Z",
      status: "ready"
    });
    const options = {
      idSeed: "mock-run-seed",
      createdAt: "2026-06-04T10:00:00.000Z",
      status: "running" as const
    };

    const first = createMockRunFromDispatchPackage(dispatchPackage, options);
    const second = createMockRunFromDispatchPackage(dispatchPackage, options);

    expect(first.id).toBe(second.id);
    expect(first.id).toContain("mock-run-seed");
    expect(first.id).toContain("run-project");
    expect(first.projectId).toBe(stagedProject.id);
    expect(first.projectName).toBe(stagedProject.name);
    expect(first.sourcePackageId).toBe(dispatchPackage.id);
    expect(first.createdAt).toBe(options.createdAt);
    expect(first.status).toBe(options.status);
    expect(first.summary.scopeCount).toBe(dispatchPackage.scope.length);
    expect(first.summary.validationGateCount).toBe(dispatchPackage.validationPlan.length);
    expect(first.sessions).toHaveLength(first.tasks.length);
    expect(first.validationGates).toHaveLength(dispatchPackage.validationPlan.length);
    expect(first.summary.objective).toBe(basePlanningDraft.objective);
  });

  it("creates required orchestrator and worker session roles", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "role-seed",
      createdAt: "2026-06-04T09:20:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "role-run-seed",
      createdAt: "2026-06-04T09:20:00.000Z",
      status: "running"
    });

    const sessionRoles = run.sessions.map((session) => session.role);

    expect(sessionRoles).toContain("orchestrator");
    expect(sessionRoles).toContain("implementer");
    expect(sessionRoles).toContain("validator");
    expect(sessionRoles).toContain("integration");

    const implementerCount = run.tasks.filter((task) => task.role === "implementation").length;
    const validatorCount = run.tasks.filter((task) => task.role === "validation").length;
    expect(implementerCount).toBeGreaterThan(0);
    expect(validatorCount).toBeGreaterThan(0);
  });

  it("uses role-specific attempt limits for orchestrator and worker tasks", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "attempt-seed",
      createdAt: "2026-06-04T09:30:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "attempt-run-seed",
      createdAt: "2026-06-04T09:30:00.000Z",
      status: "running"
    });

    const plannerTasks = run.tasks.filter((task) => task.role === "planning");
    const integrationTasks = run.tasks.filter((task) => task.role === "integration");
    const implementationTasks = run.tasks.filter((task) => task.role === "implementation");
    const validationTasks = run.tasks.filter((task) => task.role === "validation");

    expect(plannerTasks.every((task) => task.attemptLimit === 1)).toBe(true);
    expect(integrationTasks.every((task) => task.attemptLimit === 1)).toBe(true);
    expect(integrationTasks.every((task) => task.owner === "Main Codex")).toBe(true);
    expect(integrationTasks[0]?.scope).toEqual(
      expect.arrayContaining([
        "Collect validated command evidence.",
        "Prepare operator-visible Arena rows and handoff metadata.",
        "Keep final merge review, commit preparation, push approval, and reporting owned by Main Codex."
      ])
    );
    expect(integrationTasks[0]?.validationCommands).toEqual(
      expect.arrayContaining([
        "Final validation reviewed by Main Codex",
        "Commit prepared only after owner approval",
        "Push held until owner approval",
        "Dispatch report complete"
      ])
    );
    expect(implementationTasks.every((task) => task.attemptLimit === 3)).toBe(true);
    expect(validationTasks.every((task) => task.attemptLimit === 3)).toBe(true);
  });

  it("creates one phase worksheet per implementation phase with separate subagents", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "worksheet-seed",
      createdAt: "2026-06-04T09:35:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "worksheet-run-seed",
      createdAt: "2026-06-04T09:35:00.000Z",
      status: "running"
    });

    expect(run.mainWorksheet?.title).toBe("Main Worksheet");
    expect(run.mainWorksheet?.integrationReceipts).toEqual([]);
    expect(run.phaseWorksheets).toHaveLength(8);
    expect(run.activeWorksheetQueue).toHaveLength(8);
    expect(run.phaseWorksheets?.map((worksheet) => worksheet.phaseId)).toEqual([
      "phase-0",
      "phase-1",
      "phase-2",
      "phase-3",
      "phase-4",
      "phase-5",
      "phase-6",
      "phase-7"
    ]);
    expect(run.phaseWorksheets?.every((worksheet) => worksheet.subagents.length > 0)).toBe(true);
    expect(run.phaseWorksheets?.every((worksheet) => worksheet.state === "active")).toBe(true);
    expect(new Set(run.phaseWorksheets?.flatMap((worksheet) => worksheet.subagents.map((agent) => agent.id))).size)
      .toBe(run.phaseWorksheets?.reduce((count, worksheet) => count + worksheet.subagents.length, 0));
  });

  it("removes completed phase worksheets from active work and records main worksheet receipts", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "complete-worksheet-seed",
      createdAt: "2026-06-04T09:36:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "complete-worksheet-run-seed",
      createdAt: "2026-06-04T09:36:00.000Z",
      status: "complete"
    });

    expect(run.phaseWorksheets).toHaveLength(8);
    expect(run.phaseWorksheets?.every((worksheet) => worksheet.state === "removed")).toBe(true);
    expect(run.activeWorksheetQueue).toEqual([]);
    expect(getActivePhaseWorksheets(run)).toEqual([]);
    expect(run.mainWorksheet?.acceptedPhaseIds).toHaveLength(8);
    expect(run.mainWorksheet?.integrationReceipts).toHaveLength(8);
    expect(run.mainWorksheet?.integrationReceipts.every((receipt) => receipt.integratedBy === "Main Orchestrator"))
      .toBe(true);
  });
});

describe("mock run resilience", () => {
  it("handles empty list fields without dropping rows", () => {
    const packageWithEmptyLists: DispatchPackage = {
      id: "pkg-empty-lists",
      targetProject: {
        id: "empty-project",
        name: "Empty Inputs"
      },
      sourceDraftTitle: "Empty input run",
      objective: "",
      deployMode: "dry-run",
      risk: "medium",
      scope: [],
      fileAreas: [],
      acceptanceCriteria: [],
      validationPlan: [],
      rollbackNote: "",
      createdAt: "2026-06-04T11:11:11.111Z",
      status: "staged"
    };

    const run = createMockRunFromDispatchPackage(packageWithEmptyLists, {
      idSeed: "empty-seed",
      createdAt: "2026-06-04T11:11:11.111Z"
    });

    expect(run.summary.scopeCount).toBe(0);
    expect(run.summary.fileAreaCount).toBe(0);
    expect(run.summary.acceptanceCriteriaCount).toBe(0);
    expect(run.validationGates).toHaveLength(1);
    expect(run.tasks.length).toBeGreaterThan(0);
    expect(run.sessions.length).toBe(run.tasks.length);
    expect(run.sessions.every((session) => session.files.length > 0)).toBe(true);
    expect(runToSessionSummaries(run).map((row) => row.role)).toContain("orchestrator");
  });

  it("returns safe empty results when a run has no sessions or tasks", () => {
    const emptyAwareRun: MockOrchestratorRun = {
      id: "mock-run-empty",
      projectId: "empty-project",
      projectName: "Empty Inputs",
      title: "Manual empty run",
      status: "queued",
      createdAt: "2026-06-04T12:00:00.000Z",
      sourcePackageId: "manual-empty",
      summary: {
        objective: "No work requested.",
        scopeCount: 0,
        fileAreaCount: 0,
        acceptanceCriteriaCount: 0,
        validationGateCount: 0,
        risk: "low"
      },
      sessions: [],
      tasks: [],
      validationGates: []
    };

    expect(runToSessionSummaries(emptyAwareRun)).toEqual([]);
    expect(runToOrchestrationTasks(emptyAwareRun)).toEqual([]);
  });

  it("stores explicit non-empty worker handoff fields", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "handoff-seed",
      createdAt: "2026-06-04T09:40:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "handoff-run-seed",
      createdAt: "2026-06-04T09:40:00.000Z",
      status: "running"
    });
    const workerTasks = run.tasks.filter(
      (task) => task.role === "implementation" || task.role === "validation" || task.role === "integration"
    );

    for (const task of workerTasks) {
      expect(task.objective.trim().length).toBeGreaterThan(0);
      expect(task.scope.length).toBeGreaterThan(0);
      expect(task.fileOwnership.length).toBeGreaterThan(0);
      expect(task.acceptanceCriteria.length).toBeGreaterThan(0);
      expect(task.validationCommands.length).toBeGreaterThan(0);
      expect(task.dependencies.length).toBeGreaterThan(0);
      expect(task.rollback.trim().length).toBeGreaterThan(0);
      expect(task.scope.every((scopeValue) => scopeValue.trim().length > 0)).toBe(true);
      expect(task.fileOwnership.every((file) => file.trim().length > 0)).toBe(true);
      expect(task.acceptanceCriteria.every((criterion) => criterion.trim().length > 0)).toBe(true);
      expect(task.validationCommands.every((command) => command.trim().length > 0)).toBe(true);
      expect(task.rollback.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps revision-needed worksheets active and routes issues back to the owning subagent", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "revision-worksheet-seed",
      createdAt: "2026-06-04T09:42:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "revision-worksheet-run-seed",
      createdAt: "2026-06-04T09:42:00.000Z",
      status: "running"
    });
    const worksheet = run.phaseWorksheets?.find((item) => item.phaseId === "phase-5");
    const subagent = worksheet?.subagents[0];

    expect(worksheet).toBeDefined();
    expect(subagent).toBeDefined();

    const firstRevision = requestPhaseWorksheetRevision(run, {
      worksheetId: worksheet!.id,
      subagentId: subagent!.id,
      notes: "Patch changed_files did not match the actual diff.",
      requiredActions: ["Repair changed_files metadata", "Resubmit verification plan"],
      createdAt: "2026-06-04T09:43:00.000Z"
    });
    const secondRevision = requestPhaseWorksheetRevision(firstRevision, {
      worksheetId: worksheet!.id,
      subagentId: subagent!.id,
      notes: "Rollback notes are still missing.",
      requiredActions: ["Add rollback notes"],
      createdAt: "2026-06-04T09:44:00.000Z"
    });
    const revisedWorksheet = secondRevision.phaseWorksheets?.find((item) => item.id === worksheet!.id);

    expect(revisedWorksheet?.state).toBe("revision_needed");
    expect(revisedWorksheet?.revisionHistory).toHaveLength(2);
    expect(revisedWorksheet?.revisionHistory.every((revision) => revision.subagentId === subagent!.id)).toBe(true);
    expect(secondRevision.activeWorksheetQueue).toContain(worksheet!.id);
    expect(secondRevision.mainWorksheet?.integrationReceipts).toEqual([]);
  });

  it("moves only accepted worksheet output into the main worksheet and removes the worksheet from active work", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "integrate-worksheet-seed",
      createdAt: "2026-06-04T09:45:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "integrate-worksheet-run-seed",
      createdAt: "2026-06-04T09:45:00.000Z",
      status: "running"
    });
    const worksheet = run.phaseWorksheets?.find((item) => item.phaseId === "phase-4");

    expect(worksheet).toBeDefined();

    const integrated = integratePhaseWorksheetIntoMain(run, {
      worksheetId: worksheet!.id,
      acceptedEvidence: ["Readonly workers returned findings with no writes."],
      integratedArtifacts: ["Readonly handoff summary"],
      validatorNotes: "Main orchestrator accepted the readonly handoff.",
      integratedAt: "2026-06-04T09:46:00.000Z"
    });
    const removedWorksheet = integrated.phaseWorksheets?.find((item) => item.id === worksheet!.id);

    expect(removedWorksheet?.state).toBe("removed");
    expect(removedWorksheet?.removedAt).toBe("2026-06-04T09:46:00.000Z");
    expect(integrated.activeWorksheetQueue).not.toContain(worksheet!.id);
    expect(getActivePhaseWorksheets(integrated).map((item) => item.id)).not.toContain(worksheet!.id);
    expect(integrated.mainWorksheet?.acceptedPhaseIds).toContain("phase-4");
    expect(integrated.mainWorksheet?.integrationReceipts).toEqual([
      expect.objectContaining({
        phaseWorksheetId: worksheet!.id,
        phaseId: "phase-4",
        acceptedEvidence: ["Readonly workers returned findings with no writes."],
        integratedArtifacts: ["Readonly handoff summary"],
        validatorNotes: "Main orchestrator accepted the readonly handoff.",
        integratedBy: "Main Orchestrator",
        validatedBy: "Main Orchestrator"
      })
    ]);
  });

  it("exposes handoff transcripts without claiming external runtime execution", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "transcript-seed",
      createdAt: "2026-06-04T09:50:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "transcript-run-seed",
      createdAt: "2026-06-04T09:50:00.000Z",
      status: "running"
    });

    const forbiddenTokens = ["runtime execution", "external execution", "executed", "executing"];
    const hasHandoffText = run.sessions.every((session) =>
      session.transcript.some((line) => line.toLowerCase().includes("handoff"))
    );

    expect(hasHandoffText).toBe(true);
    expect(
      run.sessions.every((session) =>
        session.transcript.every((line) =>
          forbiddenTokens.every((token) => !line.toLowerCase().includes(token))
        )
      )
    ).toBe(true);
  });
});

describe("mock run conversions", () => {
  it("converts a run to cockpit-like sessions deterministically", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "convert-seed",
      createdAt: "2026-06-04T13:00:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "convert-seed",
      createdAt: "2026-06-04T13:00:00.000Z",
      status: "running"
    });

    const rows = runToSessionSummaries(run);

    expect(rows).toHaveLength(run.sessions.length);
    expect(rows[0].projectId).toBe(run.projectId);
    expect(rows[0].role).toBe("orchestrator");
    expect(rows[0].validation).toContain("session");
    expect(rows.every((row) => row.id.startsWith(run.id))).toBe(true);
    expect(rows.every((row) => row.files.length > 0)).toBe(true);
  });

  it("converts run tasks to orchestration task payloads", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "task-seed",
      createdAt: "2026-06-04T14:00:00.000Z",
      status: "ready"
    });
    const run = createMockRunFromDispatchPackage(dispatchPackage, {
      idSeed: "task-seed",
      createdAt: "2026-06-04T14:00:00.000Z"
    });

    const converted = runToOrchestrationTasks(run);

    expect(converted).toHaveLength(run.tasks.length);
    expect(converted).toEqual(run.tasks);
    expect(converted.every((task) => task.projectId === run.projectId)).toBe(true);
    expect(converted.some((task) => task.role === "validation")).toBe(true);
  });
});
