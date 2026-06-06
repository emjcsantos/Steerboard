import { describe, expect, it } from "vitest";
import { buildDispatchPackage } from "./dispatch";
import type { DispatchPackage } from "./dispatch";
import { createMockRunFromDispatchPackage, type MockOrchestratorRun } from "./run";
import type { PlanningDraft } from "./planning";
import {
  createDispatchRolePanelPlan,
  type DispatchRolePanelPlan
} from "./dispatchRolePanelPlan";

const stagedProject = {
  id: "dispatch-role-project",
  name: "Dispatch Role Test Project"
};

const basePlanningDraft: PlanningDraft = {
  title: "Build explicit role-panel plans",
  objective: "Create per-role cockpits for orchestration preview before runtime execution.",
  targetProjectId: stagedProject.id,
  scope: ["Model role ownership", "Execution attempt visibility", "Safe operator handoff"],
  fileAreas: ["src/dispatchRolePanelPlan.ts"],
  acceptanceCriteria: [
    "Each role is visible with explicit attempt and dependency detail.",
    "No runtime execution claim appears in preview output."
  ],
  validationPlan: ["npm run test -- src/dispatchRolePanelPlan.test.ts", "npm run build"],
  risk: "low",
  rollbackNote: "No runtime action can occur from these role-panel objects.",
  deployMode: "dry-run"
};

function buildPlan(options: {
  createdAt?: string;
  idSeed?: string;
  status?: "queued" | "running" | "complete" | "blocked" | "failed";
} = {}): DispatchRolePanelPlan {
  const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
    idSeed: options.idSeed ?? "dispatch-role-plan-seed",
    createdAt: options.createdAt ?? "2026-06-04T10:00:00.000Z",
    status: "ready"
  });

  const run = createMockRunFromDispatchPackage(dispatchPackage, {
    idSeed: options.idSeed ?? "role-run-seed",
    createdAt: options.createdAt ?? "2026-06-04T10:00:00.000Z",
    status: options.status
  });

  return createDispatchRolePanelPlan(dispatchPackage, run);
}

describe("dispatch role panel plan", () => {
  it("produces stable deterministic output for the same package and run", () => {
    const first = buildPlan({ idSeed: "deterministic-seed", createdAt: "2026-06-04T11:00:00.000Z" });
    const second = buildPlan({ idSeed: "deterministic-seed", createdAt: "2026-06-04T11:00:00.000Z" });

    expect(first).toEqual(second);
    expect(first.planId).toContain("deterministic-seed");
    expect(first.totalPanelCount).toBeGreaterThan(0);
    expect(first.panels).toHaveLength(first.totalPanelCount);
  });

  it("counts role panels explicitly and keeps role order deterministic", () => {
    const plan = buildPlan({ idSeed: "role-count-seed", createdAt: "2026-06-04T11:10:00.000Z" });

    expect(plan.totalPanelCount).toBe(4);
    expect(plan.roleCounts).toEqual({
      orchestrator: 1,
      implementer: 1,
      validator: 1,
      integration: 1
    });
    expect(plan.panels.map((panel) => panel.role)).toEqual([
      "orchestrator",
      "implementer",
      "validator",
      "integration"
    ]);
  });

  it("uses three-attempt labels for worker roles", () => {
    const plan = buildPlan({ idSeed: "worker-attempt-seed", createdAt: "2026-06-04T11:20:00.000Z" });
    const implementerPanel = plan.panels.find((panel) => panel.role === "implementer");
    const validatorPanel = plan.panels.find((panel) => panel.role === "validator");

    expect(implementerPanel?.attemptLabel).toMatch(/\/\s*3$/);
    expect(validatorPanel?.attemptLabel).toMatch(/\/\s*3$/);
  });

  it("reports blocked readiness when any role panel is blocked", () => {
    const dispatchPackage: DispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "blocked-seed",
      createdAt: "2026-06-04T11:30:00.000Z",
      status: "ready"
    });
    const run: MockOrchestratorRun = {
      id: "blocked-run",
      projectId: stagedProject.id,
      projectName: stagedProject.name,
      title: "Manual blocked run",
      status: "blocked",
      createdAt: "2026-06-04T11:30:10.000Z",
      sourcePackageId: dispatchPackage.id,
      summary: {
        objective: basePlanningDraft.objective,
        scopeCount: 1,
        fileAreaCount: 1,
        acceptanceCriteriaCount: 1,
        validationGateCount: 1,
        risk: "low"
      },
      sessions: [
        {
          id: "orchestrator-session",
          projectId: stagedProject.id,
          title: "Blocked plan",
          role: "orchestrator",
          state: "blocked",
          branch: "main",
          runtime: "Local Runtime",
          attempt: 2,
          validation: "Dependency blocked",
          files: ["src/dispatch.ts"],
          transcript: ["Blocked for dependency reasons."],
          tools: ["Plan", "Report"]
        },
        {
          id: "implementer-session",
          projectId: stagedProject.id,
          title: "Implementer session",
          role: "implementer",
          state: "implementing",
          branch: "main",
          runtime: "Local Runtime",
          attempt: 0,
          validation: "Running implementation",
          files: ["src/dispatchRolePanelPlan.ts"],
          transcript: ["Ready for work."],
          tools: ["Edit"]
        }
      ],
      tasks: [],
      validationGates: []
    };

    const plan = createDispatchRolePanelPlan(dispatchPackage, run);

    expect(plan.readinessState).toBe("blocked");
    expect(plan.panels.find((panel) => panel.role === "orchestrator")?.state).toBe("blocked");
  });

  it("falls back safely when run sessions and tasks are empty", () => {
    const dispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "empty-fallback-seed",
      createdAt: "2026-06-04T11:40:00.000Z",
      status: "ready"
    });
    const run: MockOrchestratorRun = {
      id: "empty-run",
      projectId: stagedProject.id,
      projectName: stagedProject.name,
      title: "Empty run",
      status: "queued",
      createdAt: "2026-06-04T11:40:01.000Z",
      sourcePackageId: dispatchPackage.id,
      summary: {
        objective: basePlanningDraft.objective,
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

    const plan = createDispatchRolePanelPlan(dispatchPackage, run);

    expect(plan.totalPanelCount).toBe(0);
    expect(plan.roleCounts).toEqual({
      orchestrator: 0,
      implementer: 0,
      validator: 0,
      integration: 0
    });
    expect(plan.readinessState).toBe("waiting");
    expect(plan.projectId).toBe(stagedProject.id);
    expect(plan.projectName).toBe(stagedProject.name);
  });

  it("handles malformed run package fields without throwing", () => {
    const validDispatchPackage = buildDispatchPackage(basePlanningDraft, stagedProject, {
      idSeed: "malformed-seed",
      createdAt: "2026-06-04T12:10:00.000Z"
    });
    const malformedDispatchPackage = {
      ...validDispatchPackage,
      id: null,
      targetProject: null
    } as unknown as DispatchPackage;
    const validRun = createMockRunFromDispatchPackage(validDispatchPackage, {
      idSeed: "malformed-run-seed",
      createdAt: "2026-06-04T12:10:00.000Z"
    });
    const malformedRun = {
      ...validRun,
      sessions: {} as unknown as MockOrchestratorRun["sessions"],
      tasks: {} as unknown as MockOrchestratorRun["tasks"]
    } as unknown as MockOrchestratorRun;

    const plan = createDispatchRolePanelPlan(malformedDispatchPackage, malformedRun);

    expect(plan.totalPanelCount).toBe(0);
    expect(plan.projectId).toBe(stagedProject.id);
    expect(plan.readinessState).toBe("waiting");
    expect(plan.panels.every((panel) => panel.noRuntimeExecutionNote.length > 0)).toBe(true);
  });

  it("never over-claims runtime execution on role panels", () => {
    const plan = buildPlan({ idSeed: "no-exec-seed", createdAt: "2026-06-04T11:50:00.000Z" });

    for (const panel of plan.panels) {
      expect(panel.noRuntimeExecutionNote).toContain("No runtime execution");
      expect(panel.noRuntimeExecutionNote).not.toContain("executed");
      expect(panel.noRuntimeExecutionNote).not.toContain("running runtime");
      expect(panel.validationLabel).not.toMatch(/actually executing|executed for real|real execution/);
      expect(panel.noRuntimeExecutionNote).toContain("preview");
    }
  });
});
