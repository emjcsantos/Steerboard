import { describe, expect, it } from "vitest";
import {
  canDeployPlanningDraft,
  evaluatePlanningReadiness,
  normalizePlanningDraft,
  type PlanningReadiness
} from "./planning";

describe("planning draft normalization", () => {
  it("repairs malformed draft input and trims list fields", () => {
    const normalized = normalizePlanningDraft({
      title: "   Shipping checklist   ",
      objective: 10,
      targetProjectId: "",
      scope: [" Confirm paths ", "", "  "],
      fileAreas: [" src/planning.ts ", 1, "   "],
      acceptanceCriteria: ["  Validate contracts   ", null],
      validationPlan: [" run build ", ""],
      risk: "extreme",
      rollbackNote: "   Revert safe files only   ",
      deployMode: "unsupported"
    });

    expect(normalized).toEqual({
      title: "Shipping checklist",
      objective: "",
      targetProjectId: "",
      scope: ["Confirm paths"],
      fileAreas: ["src/planning.ts"],
      acceptanceCriteria: ["Validate contracts"],
      validationPlan: ["run build"],
      risk: "medium",
      rollbackNote: "Revert safe files only",
      deployMode: "dry-run"
    });
  });
});

describe("planning draft readiness", () => {
  it("reports missing required field ids and readiness percentage", () => {
    const readiness: PlanningReadiness = evaluatePlanningReadiness({
      title: "",
      objective: "",
      targetProjectId: "",
      scope: [],
      fileAreas: ["src/planning.ts"],
      acceptanceCriteria: ["Acceptance criteria present"],
      validationPlan: [],
      risk: "low",
      rollbackNote: "",
      deployMode: "dry-run"
    });

    expect(readiness.readiness).toBe(14);
    expect(readiness.missingFieldIds).toEqual([
      "title",
      "objective",
      "targetProjectId",
      "scope",
      "validationPlan",
      "rollbackNote"
    ]);
  });

  it("returns 100% readiness when all required fields are populated", () => {
    const readiness = evaluatePlanningReadiness({
      title: "Prepare planning draft contract",
      objective: "Draft the project plan before dispatching.",
      targetProjectId: "project-ops",
      scope: ["Scope item one", "Scope item two"],
      fileAreas: ["src/planning.ts"],
      acceptanceCriteria: ["Criteria one"],
      validationPlan: ["npm run test -- src/planning.test.ts"],
      risk: "high",
      rollbackNote: "No production effect; remove draft file if rejected.",
      deployMode: "staged"
    });

    expect(readiness).toEqual({
      readiness: 100,
      missingFieldIds: []
    });
  });
});

describe("planning draft deploy gating", () => {
  it("prevents deployment when readiness is incomplete", () => {
    expect(
      canDeployPlanningDraft({
        title: "Missing fields",
        objective: "Incomplete",
        scope: ["Scope"],
        acceptanceCriteria: ["Accepted"],
        validationPlan: ["npm run test -- src/planning.test.ts"]
      })
    ).toBe(false);
  });

  it("allows deployment at full readiness", () => {
    expect(
      canDeployPlanningDraft({
        title: "Release readiness contract",
        objective: "Define safe dispatch rules.",
        targetProjectId: "project-readiness",
        scope: ["Draft scope"],
        acceptanceCriteria: ["All required checks pass."],
        validationPlan: ["npm run test -- src/planning.test.ts"],
        rollbackNote: "Revert planning draft file and queue the next draft review."
      })
    ).toBe(true);
  });
});
