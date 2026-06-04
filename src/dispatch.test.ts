import { describe, expect, it } from "vitest";
import type { PlanningDraft } from "./planning";
import {
  buildDispatchPackage,
  renderDispatchPackageMarkdown,
  tryBuildDispatchPackage
} from "./dispatch";

const baseTarget = {
  id: "project-dispatch",
  name: "Dispatch Readiness Pilot"
};

const completeDraft: PlanningDraft = {
  title: "Create dispatch gate model",
  objective:
    "Generate a deterministic dispatch package that can be reviewed before runtime execution.",
  targetProjectId: "project-dispatch",
  scope: ["Scope list item one", "Scope list item two"],
  fileAreas: ["src/dispatch.ts", "src/planning.ts", "src/fixtures.ts"],
  acceptanceCriteria: ["Dispatch package contains all required sections.", "Package is deterministic with seed inputs."],
  validationPlan: ["npm run test -- src/dispatch.test.ts", "npm run build"],
  risk: "medium",
  rollbackNote: "Remove the dispatch package builder if review requires a simpler handoff shape.",
  deployMode: "staged"
};

describe("dispatch package build guardrails", () => {
  it("returns a readiness rejection for incomplete drafts", () => {
    const incompleteDraft = {
      title: "",
      objective: "Draft output model before dispatch.",
      targetProjectId: "",
      scope: [],
      fileAreas: ["src/dispatch.ts"],
      acceptanceCriteria: ["Draft is staged."],
      validationPlan: [],
      risk: "low",
      rollbackNote: "",
      deployMode: "dry-run"
    };

    const result = tryBuildDispatchPackage(incompleteDraft as PlanningDraft, baseTarget);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.readiness.readiness).toBeLessThan(100);
      expect(result.readiness.missingFieldIds).toContain("title");
      expect(result.readiness.missingFieldIds).toContain("targetProjectId");
    }
  });
});

describe("dispatch package construction", () => {
  it("builds a complete deterministic package from a ready planning draft", () => {
    const options = {
      idSeed: "dispatch-seed",
      createdAt: "2026-06-04T10:15:30.000Z",
      status: "ready" as const
    };

    const first = tryBuildDispatchPackage(completeDraft, baseTarget, options);
    const second = tryBuildDispatchPackage(completeDraft, baseTarget, options);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    if (first.ok && second.ok) {
      expect(first.package.id).toBe(second.package.id);
      expect(first.package.targetProject).toEqual(baseTarget);
      expect(first.package.sourceDraftTitle).toBe(completeDraft.title);
      expect(first.package.objective).toBe(completeDraft.objective);
      expect(first.package.status).toBe("ready");
      expect(first.package.createdAt).toBe(options.createdAt);
      expect(first.package.id).toContain("dispatch-seed");
      expect(first.package.id).toContain("project-dispatch");
    }
  });

  it("builds markdown preview with stable deterministic sections", () => {
    const packageResult = tryBuildDispatchPackage(completeDraft, baseTarget, {
      idSeed: "markdown-seed",
      createdAt: "2026-06-04T12:00:00.000Z",
      status: "ready"
    });

    expect(packageResult.ok).toBe(true);
    if (!packageResult.ok) {
      throw new Error("Expected package build to succeed");
    }

    const markdownA = renderDispatchPackageMarkdown(packageResult.package);
    const markdownB = renderDispatchPackageMarkdown(packageResult.package);

    expect(markdownA).toContain("# Dispatch Package: Create dispatch gate model");
    expect(markdownA).toContain("## Objective");
    expect(markdownA).toContain("## Scope");
    expect(markdownA).toContain("## File Areas");
    expect(markdownA).toContain("## Acceptance Criteria");
    expect(markdownA).toContain("## Validation Plan");
    expect(markdownA).toContain("## Rollback");
    expect(markdownA).toContain("## Deploy Settings");
    expect(markdownA).toContain("Target Project: Dispatch Readiness Pilot (project-dispatch)");
    expect(markdownA).toContain("Scope list item one");
    expect(markdownA).toContain("src/dispatch.ts");
    expect(markdownA).toContain("Mode: staged");
    expect(markdownA).toContain("Status: ready");

    expect(markdownA).toBe(markdownB);
  });

  it("defaults status when not provided and keeps deterministic generated content", () => {
    const packageResult = tryBuildDispatchPackage(completeDraft, baseTarget, {
      idSeed: "default-status",
      createdAt: "2026-06-04T00:00:00.000Z"
    });

    expect(packageResult.ok).toBe(true);
    if (!packageResult.ok) {
      throw new Error("Expected package build to succeed");
    }

    expect(packageResult.package.status).toBe("staged");
    expect(packageResult.package.createdAt).toBe("2026-06-04T00:00:00.000Z");
    expect(
      buildDispatchPackage(completeDraft, baseTarget, {
        idSeed: "fallback",
        createdAt: "2026-01-01T00:00:00.000Z"
      }).status
    ).toBe("staged");
  });
});
